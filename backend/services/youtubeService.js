import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const YOUTUBE_CONFIG = {
	VERSION: "v3",
	DEFAULT_MAX_RESULTS: 20,
	DEFAULT_CATEGORY_ID: "22",
	COMMENT_ORDER: "time",
	REQUIRED_PARTS: {
		VIDEO_DETAILS: ["snippet", "statistics", "status", "contentDetails"],
		VIDEO_UPDATE: ["snippet"],
		COMMENTS: ["snippet", "replies"],
		COMMENT_INSERT: ["snippet"],
	},
};

const YOUTUBE_ERRORS = {
	VIDEO_NOT_FOUND: "Video not found",
	AUTHENTICATION_FAILED: "YouTube authentication failed",
	API_QUOTA_EXCEEDED: "YouTube API quota exceeded",
	INVALID_VIDEO_ID: "Invalid video ID provided",
	COMMENT_DISABLED: "Comments are disabled for this video",
};

class YouTubeAuthManager {
	constructor() {
		this.validateEnvironmentVariables();
	}

	validateEnvironmentVariables() {
		const requiredVars = [
			"YOUTUBE_API_KEY",
			"YOUTUBE_CLIENT_ID",
			"YOUTUBE_CLIENT_SECRET",
			"YOUTUBE_REDIRECT_URI",
		];

		const missing = requiredVars.filter((varName) => !process.env[varName]);
		if (missing.length > 0) {
			throw new Error(
				`Missing required environment variables: ${missing.join(", ")}`
			);
		}
	}

	createReadOnlyAuth() {
		return process.env.YOUTUBE_API_KEY;
	}

	createOAuth2Client() {
		const oauth2Client = new google.auth.OAuth2(
			process.env.YOUTUBE_CLIENT_ID,
			process.env.YOUTUBE_CLIENT_SECRET,
			process.env.YOUTUBE_REDIRECT_URI
		);

		if (process.env.YOUTUBE_ACCESS_TOKEN && process.env.YOUTUBE_REFRESH_TOKEN) {
			oauth2Client.setCredentials({
				access_token: process.env.YOUTUBE_ACCESS_TOKEN,
				refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
			});
		} else {
			// If no tokens are available, throw a specific error
			throw new Error(
				"YouTube authentication tokens not found. Please run the authentication setup script."
			);
		}

		return oauth2Client;
	}
}

class YouTubeAPIClient {
	constructor(authManager) {
		this.authManager = authManager;
		this.readOnlyClient = google.youtube({
			version: YOUTUBE_CONFIG.VERSION,
			auth: this.authManager.createReadOnlyAuth(),
		});
	}

	createAuthenticatedClient() {
		return google.youtube({
			version: YOUTUBE_CONFIG.VERSION,
			auth: this.authManager.createOAuth2Client(),
		});
	}

	async handleAPIError(error, operation) {
		console.error(`YouTube API error during ${operation}:`, {
			message: error.message,
			code: error.code,
			status: error.status,
		});

		if (error.code === 404) {
			throw new Error(YOUTUBE_ERRORS.VIDEO_NOT_FOUND);
		} else if (error.code === 401 || error.code === 403) {
			throw new Error(YOUTUBE_ERRORS.AUTHENTICATION_FAILED);
		} else if (error.code === 403 && error.message.includes("quota")) {
			throw new Error(YOUTUBE_ERRORS.API_QUOTA_EXCEEDED);
		}

		throw error;
	}
}

class YouTubeService {
	constructor() {
		this.authManager = new YouTubeAuthManager();
		this.apiClient = new YouTubeAPIClient(this.authManager);
	}

	validateVideoId(videoId) {
		if (
			!videoId ||
			typeof videoId !== "string" ||
			videoId.trim().length === 0
		) {
			throw new Error(YOUTUBE_ERRORS.INVALID_VIDEO_ID);
		}
		return videoId.trim();
	}

	async getVideoDetails(videoId) {
		try {
			const validatedVideoId = this.validateVideoId(videoId);

			const response = await this.apiClient.readOnlyClient.videos.list({
				part: YOUTUBE_CONFIG.REQUIRED_PARTS.VIDEO_DETAILS,
				id: [validatedVideoId],
			});

			if (!response.data.items || response.data.items.length === 0) {
				throw new Error(YOUTUBE_ERRORS.VIDEO_NOT_FOUND);
			}

			return this.formatVideoData(response.data.items[0]);
		} catch (error) {
			await this.apiClient.handleAPIError(error, "getVideoDetails");
		}
	}

	formatVideoData(videoData) {
		const { snippet, statistics, status, contentDetails } = videoData;

		return {
			id: videoData.id,
			snippet: {
				title: snippet.title,
				description: snippet.description,
				publishedAt: snippet.publishedAt,
				thumbnails: snippet.thumbnails,
				channelId: snippet.channelId,
				channelTitle: snippet.channelTitle,
			},
			statistics: {
				viewCount: statistics?.viewCount || "0",
				likeCount: statistics?.likeCount || "0",
				commentCount: statistics?.commentCount || "0",
			},
			status: {
				uploadStatus: status?.uploadStatus,
				privacyStatus: status?.privacyStatus,
			},
			contentDetails: {
				duration: contentDetails?.duration,
			},
		};
	}

	async updateVideoDetails(
		videoId,
		title,
		description,
		categoryId = YOUTUBE_CONFIG.DEFAULT_CATEGORY_ID
	) {
		try {
			const validatedVideoId = this.validateVideoId(videoId);
			const authenticatedClient = this.apiClient.createAuthenticatedClient();

			if (!title || !description) {
				throw new Error("Title and description are required for video update");
			}

			const response = await authenticatedClient.videos.update({
				part: YOUTUBE_CONFIG.REQUIRED_PARTS.VIDEO_UPDATE,
				requestBody: {
					id: validatedVideoId,
					snippet: {
						title: title.trim(),
						description: description.trim(),
						categoryId,
					},
				},
			});

			return response.data;
		} catch (error) {
			await this.apiClient.handleAPIError(error, "updateVideoDetails");
		}
	}

	async getVideoComments(
		videoId,
		maxResults = YOUTUBE_CONFIG.DEFAULT_MAX_RESULTS
	) {
		try {
			const validatedVideoId = this.validateVideoId(videoId);
			const validatedMaxResults = Math.max(1, Math.min(maxResults, 100));

			const response = await this.apiClient.readOnlyClient.commentThreads.list({
				part: YOUTUBE_CONFIG.REQUIRED_PARTS.COMMENTS,
				videoId: validatedVideoId,
				maxResults: validatedMaxResults,
				order: YOUTUBE_CONFIG.COMMENT_ORDER,
			});

			return this.formatCommentsData(response.data.items || []);
		} catch (error) {
			if (error.message.includes("disabled")) {
				throw new Error(YOUTUBE_ERRORS.COMMENT_DISABLED);
			}
			await this.apiClient.handleAPIError(error, "getVideoComments");
		}
	}

	formatCommentsData(comments) {
		return comments.map((comment) => ({
			id: comment.id,
			snippet: {
				topLevelComment: {
					snippet: {
						textDisplay: comment.snippet.topLevelComment.snippet.textDisplay,
						authorDisplayName:
							comment.snippet.topLevelComment.snippet.authorDisplayName,
						publishedAt: comment.snippet.topLevelComment.snippet.publishedAt,
						likeCount: comment.snippet.topLevelComment.snippet.likeCount,
					},
				},
				totalReplyCount: comment.snippet.totalReplyCount || 0,
			},
			replies: comment.replies
				? this.formatReplies(comment.replies.comments)
				: [],
		}));
	}

	formatReplies(replies) {
		return replies.map((reply) => ({
			id: reply.id,
			snippet: {
				textDisplay: reply.snippet.textDisplay,
				authorDisplayName: reply.snippet.authorDisplayName,
				publishedAt: reply.snippet.publishedAt,
				likeCount: reply.snippet.likeCount,
			},
		}));
	}

	async addComment(videoId, text) {
		try {
			const validatedVideoId = this.validateVideoId(videoId);

			// Check if authentication tokens are available
			if (
				!process.env.YOUTUBE_ACCESS_TOKEN ||
				!process.env.YOUTUBE_REFRESH_TOKEN
			) {
				throw new Error(
					"YouTube authentication is required to add comments. Please set up OAuth2 tokens."
				);
			}

			const authenticatedClient = this.apiClient.createAuthenticatedClient();

			if (!text || text.trim().length === 0) {
				throw new Error("Comment text cannot be empty");
			}

			const response = await authenticatedClient.commentThreads.insert({
				part: YOUTUBE_CONFIG.REQUIRED_PARTS.COMMENT_INSERT,
				requestBody: {
					snippet: {
						videoId: validatedVideoId,
						topLevelComment: {
							snippet: {
								textOriginal: text.trim(),
							},
						},
					},
				},
			});

			return response.data;
		} catch (error) {
			// Handle specific authentication and permission errors
			if (
				error.message.includes("authentication") ||
				error.message.includes("unauthorized_client")
			) {
				throw new Error(
					"YouTube authentication failed. Please ensure your OAuth2 tokens are valid and have the required permissions."
				);
			}

			if (error.message.includes("Insufficient Permission")) {
				throw new Error(
					"Insufficient Permission: Your app needs the 'youtube' scope (not just 'youtube.readonly') to add comments. Please re-authenticate with proper permissions."
				);
			}

			console.error("YouTube API addComment error:", error);
			await this.apiClient.handleAPIError(error, "addComment");
		}
	}

	async replyToComment(commentId, text) {
		try {
			if (!commentId || !text || text.trim().length === 0) {
				throw new Error("Comment ID and reply text are required");
			}

			const authenticatedClient = this.apiClient.createAuthenticatedClient();

			const response = await authenticatedClient.comments.insert({
				part: YOUTUBE_CONFIG.REQUIRED_PARTS.COMMENT_INSERT,
				requestBody: {
					snippet: {
						parentId: commentId,
						textOriginal: text.trim(),
					},
				},
			});

			return response.data;
		} catch (error) {
			await this.apiClient.handleAPIError(error, "replyToComment");
		}
	}

	async deleteComment(commentId) {
		try {
			if (!commentId) {
				throw new Error("Comment ID is required for deletion");
			}

			const authenticatedClient = this.apiClient.createAuthenticatedClient();

			await authenticatedClient.comments.delete({
				id: commentId,
			});

			return { success: true, message: "Comment deleted successfully" };
		} catch (error) {
			await this.apiClient.handleAPIError(error, "deleteComment");
		}
	}

	async testPermissions() {
		const results = {
			hasTokens: false,
			canReadChannel: false,
			canWriteComments: false,
			tokenInfo: null,
			errors: [],
		};

		try {
			// Check if tokens exist
			results.hasTokens = !!(
				process.env.YOUTUBE_ACCESS_TOKEN && process.env.YOUTUBE_REFRESH_TOKEN
			);

			if (!results.hasTokens) {
				results.errors.push(
					"No YouTube tokens found. Please authenticate first."
				);
				return results;
			}

			// Test 1: Try to get user's channel info (basic read permission)
			try {
				const channelResponse =
					await this.apiClient.authenticatedClient.channels.list({
						part: ["snippet", "contentDetails"],
						mine: true,
					});

				results.canReadChannel = true;
				results.tokenInfo = {
					channelTitle:
						channelResponse.data.items?.[0]?.snippet?.title || "Unknown",
					channelId: channelResponse.data.items?.[0]?.id || "Unknown",
				};
			} catch (error) {
				results.errors.push(`Read permission test failed: ${error.message}`);
				if (
					error.message.includes("Insufficient Permission") ||
					error.message.includes("forbidden")
				) {
					results.errors.push(
						"This indicates the token may not have proper YouTube scopes"
					);
				}
			}

			// Test 2: Check comment permissions by attempting a dry-run
			try {
				// We won't actually post a comment, but check if we can access the comments API
				// This is just to test if the client is properly configured for write operations
				const testVideoId = "dQw4w9WgXcQ"; // Rick Roll video ID for testing

				// Try to get comments first (this tests if we can access the comments API)
				await this.apiClient.authenticatedClient.commentThreads.list({
					part: ["snippet"],
					videoId: testVideoId,
					maxResults: 1,
				});

				results.canWriteComments = true;
			} catch (error) {
				results.errors.push(`Comment API access test failed: ${error.message}`);
				if (error.message.includes("Insufficient Permission")) {
					results.errors.push(
						"Token lacks write permissions for comments. Re-authenticate with full YouTube scope."
					);
				}
			}
		} catch (error) {
			results.errors.push(`General permission test failed: ${error.message}`);
		}

		return results;
	}

	async searchVideos(query, maxResults = YOUTUBE_CONFIG.DEFAULT_MAX_RESULTS) {
		try {
			if (!query || query.trim().length === 0) {
				throw new Error("Search query cannot be empty");
			}

			const response = await this.apiClient.readOnlyClient.search.list({
				part: ["snippet"],
				q: query.trim(),
				type: "video",
				maxResults: Math.max(1, Math.min(maxResults, 50)),
				order: "relevance",
			});

			return response.data.items || [];
		} catch (error) {
			await this.apiClient.handleAPIError(error, "searchVideos");
		}
	}
}

const youtubeServiceInstance = new YouTubeService();
export default youtubeServiceInstance;
export { YOUTUBE_ERRORS, YouTubeService };
