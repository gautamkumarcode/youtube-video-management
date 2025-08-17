import express from "express";
import { asyncLogEvent, eventLogger } from "../middleware/eventLogger.js";
import Video from "../models/Video.js";
import youtubeService from "../services/youtubeService.js";

const router = express.Router();

const RESPONSE_MESSAGES = {
	SUCCESS: {
		VIDEO_FETCHED: "Video details fetched successfully",
		VIDEO_UPDATED: "Video updated successfully",
		COMMENTS_FETCHED: "Comments fetched successfully",
		COMMENT_ADDED: "Comment added successfully",
		COMMENT_REPLIED: "Reply added successfully",
		COMMENT_DELETED: "Comment deleted successfully",
	},
	ERROR: {
		VIDEO_FETCH_FAILED: "Error fetching video details",
		VIDEO_UPDATE_FAILED: "Error updating video",
		COMMENTS_FETCH_FAILED: "Error fetching comments",
		COMMENT_ADD_FAILED: "Error adding comment",
		COMMENT_REPLY_FAILED: "Error replying to comment",
		COMMENT_DELETE_FAILED: "Error deleting comment",
		VIDEO_NOT_FOUND: "Video not found",
		TITLE_REQUIRED: "Title is required",
		COMMENT_TEXT_REQUIRED: "Comment text is required",
		REPLY_TEXT_REQUIRED: "Reply text is required",
	},
};

const HTTP_STATUS = {
	OK: 200,
	BAD_REQUEST: 400,
	NOT_FOUND: 404,
	INTERNAL_SERVER_ERROR: 500,
};

const createSuccessResponse = (data, message = null) => ({
	success: true,
	data,
	...(message && { message }),
});

const createErrorResponse = (message, error = null) => ({
	success: false,
	message,
	...(error && { error }),
});

const handleAsyncRoute = (routeHandler) => {
	return async (req, res, next) => {
		try {
			await routeHandler(req, res, next);
		} catch (error) {
			console.error("Unhandled route error:", error);
			res
				.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
				.json(
					createErrorResponse("An unexpected error occurred", error.message)
				);
		}
	};
};

const validateVideoData = (youtubeData) => {
	if (!youtubeData?.snippet?.title) {
		throw new Error("Invalid video data received from YouTube");
	}
};

const mapYouTubeDataToVideo = (videoId, youtubeData) => {
	validateVideoData(youtubeData);

	return {
		youtubeId: videoId,
		title: youtubeData.snippet.title,
		description: youtubeData.snippet.description || "",
		thumbnail:
			youtubeData.snippet.thumbnails?.high?.url ||
			youtubeData.snippet.thumbnails?.default?.url ||
			"",
		duration: youtubeData.contentDetails?.duration || "",
		publishedAt: youtubeData.snippet.publishedAt,
		statistics: {
			viewCount: youtubeData.statistics?.viewCount || "0",
			likeCount: youtubeData.statistics?.likeCount || "0",
			commentCount: youtubeData.statistics?.commentCount || "0",
		},
		status: {
			uploadStatus: youtubeData.status?.uploadStatus || "processed",
			privacyStatus: youtubeData.status?.privacyStatus || "unlisted",
		},
	};
};

const updateVideoStatistics = async (video, videoId) => {
	try {
		const youtubeData = await youtubeService.getVideoDetails(videoId);
		video.statistics = {
			viewCount: youtubeData.statistics?.viewCount || "0",
			likeCount: youtubeData.statistics?.likeCount || "0",
			commentCount: youtubeData.statistics?.commentCount || "0",
		};
		await video.save();
		return true;
	} catch (error) {
		console.warn("Failed to update video statistics:", error.message);
		return false;
	}
};

const getVideoDetailsHandler = async (req, res) => {
	const { videoId } = req.params;

	let video = await Video.findOne({ youtubeId: videoId });

	if (!video) {
		const youtubeData = await youtubeService.getVideoDetails(videoId);
		const videoData = mapYouTubeDataToVideo(videoId, youtubeData);

		video = new Video(videoData);
		await video.save();
	} else {
		await updateVideoStatistics(video, videoId);
	}

	res.json(
		createSuccessResponse(video, RESPONSE_MESSAGES.SUCCESS.VIDEO_FETCHED)
	);
};

const updateVideoHandler = async (req, res) => {
	const { videoId } = req.params;
	const { title, description = "" } = req.body;

	if (!title?.trim()) {
		return res
			.status(HTTP_STATUS.BAD_REQUEST)
			.json(createErrorResponse(RESPONSE_MESSAGES.ERROR.TITLE_REQUIRED));
	}

	await youtubeService.updateVideoDetails(
		videoId,
		title.trim(),
		description.trim()
	);

	const video = await Video.findOneAndUpdate(
		{ youtubeId: videoId },
		{
			title: title.trim(),
			description: description.trim(),
		},
		{ new: true, runValidators: true }
	);

	if (!video) {
		return res
			.status(HTTP_STATUS.NOT_FOUND)
			.json(createErrorResponse(RESPONSE_MESSAGES.ERROR.VIDEO_NOT_FOUND));
	}

	res.json(
		createSuccessResponse(video, RESPONSE_MESSAGES.SUCCESS.VIDEO_UPDATED)
	);
};

const getCommentsHandler = async (req, res) => {
	const { videoId } = req.params;
	const { maxResults = 20 } = req.query;

	const comments = await youtubeService.getVideoComments(
		videoId,
		parseInt(maxResults)
	);

	res.json(
		createSuccessResponse(comments, RESPONSE_MESSAGES.SUCCESS.COMMENTS_FETCHED)
	);
};

const addCommentHandler = async (req, res) => {
	const { videoId } = req.params;
	const { text } = req.body;

	if (!text?.trim()) {
		return res
			.status(HTTP_STATUS.BAD_REQUEST)
			.json(createErrorResponse(RESPONSE_MESSAGES.ERROR.COMMENT_TEXT_REQUIRED));
	}

	try {
		// Add comment to YouTube (requires authentication)
		const comment = await youtubeService.addComment(videoId, text.trim());
		res.json(
			createSuccessResponse(comment, RESPONSE_MESSAGES.SUCCESS.COMMENT_ADDED)
		);
	} catch (error) {
		console.error("YouTube comment error:", error.message);

		// Return proper error response instead of demo mode
		if (error.message.includes("Insufficient Permission")) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(
					createErrorResponse(
						"Insufficient permissions to add comments. Please ensure you have granted the 'youtube' scope during OAuth login, not just 'youtube.readonly'.",
						error.message
					)
				);
		}

		if (error.message.includes("authentication")) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json(
					createErrorResponse(
						"YouTube authentication required. Please login with Google to enable commenting.",
						error.message
					)
				);
		}

		// For other API errors
		return res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(
				createErrorResponse(
					RESPONSE_MESSAGES.ERROR.COMMENT_ADD_FAILED,
					error.message
				)
			);
	}
};

const replyToCommentHandler = async (req, res) => {
	const { commentId } = req.params;
	const { text } = req.body;

	if (!text?.trim()) {
		return res
			.status(HTTP_STATUS.BAD_REQUEST)
			.json(createErrorResponse(RESPONSE_MESSAGES.ERROR.REPLY_TEXT_REQUIRED));
	}

	const reply = await youtubeService.replyToComment(commentId, text.trim());

	res.json(
		createSuccessResponse(reply, RESPONSE_MESSAGES.SUCCESS.COMMENT_REPLIED)
	);
};

const deleteCommentHandler = async (req, res) => {
	const { commentId } = req.params;

	await youtubeService.deleteComment(commentId);

	res.json(
		createSuccessResponse(null, RESPONSE_MESSAGES.SUCCESS.COMMENT_DELETED)
	);
};

const createErrorHandler = (eventType, errorMessage) => {
	return async (error, req, res, next) => {
		await asyncLogEvent(
			eventType,
			{
				videoId: req.params.videoId,
				commentId: req.params.commentId,
				details: { error: error.message },
				success: false,
				errorMessage: error.message,
			},
			req
		);

		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json(createErrorResponse(errorMessage, error.message));
	};
};

router.get(
	"/:videoId",
	eventLogger("video_fetched"),
	handleAsyncRoute(async (req, res) => {
		try {
			await getVideoDetailsHandler(req, res);
		} catch (error) {
			await createErrorHandler(
				"api_error",
				RESPONSE_MESSAGES.ERROR.VIDEO_FETCH_FAILED
			)(error, req, res);
		}
	})
);

router.put(
	"/:videoId",
	eventLogger("video_updated"),
	handleAsyncRoute(async (req, res) => {
		try {
			await updateVideoHandler(req, res);
		} catch (error) {
			await createErrorHandler(
				"api_error",
				RESPONSE_MESSAGES.ERROR.VIDEO_UPDATE_FAILED
			)(error, req, res);
		}
	})
);

router.get(
	"/:videoId/comments",
	eventLogger("user_action"),
	handleAsyncRoute(async (req, res) => {
		try {
			await getCommentsHandler(req, res);
		} catch (error) {
			await createErrorHandler(
				"api_error",
				RESPONSE_MESSAGES.ERROR.COMMENTS_FETCH_FAILED
			)(error, req, res);
		}
	})
);

router.post(
	"/:videoId/comments",
	eventLogger("comment_added"),
	handleAsyncRoute(async (req, res) => {
		try {
			await addCommentHandler(req, res);
		} catch (error) {
			await createErrorHandler(
				"api_error",
				RESPONSE_MESSAGES.ERROR.COMMENT_ADD_FAILED
			)(error, req, res);
		}
	})
);

router.post(
	"/:videoId/comments/:commentId/reply",
	eventLogger("comment_replied"),
	handleAsyncRoute(async (req, res) => {
		try {
			await replyToCommentHandler(req, res);
		} catch (error) {
			await createErrorHandler(
				"api_error",
				RESPONSE_MESSAGES.ERROR.COMMENT_REPLY_FAILED
			)(error, req, res);
		}
	})
);

// @route   GET /api/videos/test-permissions
// @desc    Test YouTube API permissions
// @access  Public
router.get(
	"/test-permissions",
	eventLogger("test_permissions"),
	handleAsyncRoute(async (req, res) => {
		try {
			const permissionTest = await youtubeService.testPermissions();
			res.json(
				createSuccessResponse(permissionTest, "Permission test completed")
			);
		} catch (error) {
			console.error("Permission test error:", error);
			res
				.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
				.json(createErrorResponse("Permission test failed", error.message));
		}
	})
);

router.delete(
	"/:videoId/comments/:commentId",
	eventLogger("comment_deleted"),
	handleAsyncRoute(async (req, res) => {
		try {
			await deleteCommentHandler(req, res);
		} catch (error) {
			await createErrorHandler(
				"api_error",
				RESPONSE_MESSAGES.ERROR.COMMENT_DELETE_FAILED
			)(error, req, res);
		}
	})
);

export default router;
