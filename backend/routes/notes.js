import express from "express";
import mongoose from "mongoose";
import { asyncLogEvent, eventLogger } from "../middleware/eventLogger.js";
import Note from "../models/Note.js";

const router = express.Router();

const RESPONSE_MESSAGES = {
	SUCCESS: {
		NOTES_FETCHED: "Notes fetched successfully",
		NOTE_CREATED: "Note created successfully",
		NOTE_UPDATED: "Note updated successfully",
		NOTE_DELETED: "Note deleted successfully",
		NOTE_FETCHED: "Note fetched successfully",
	},
	ERROR: {
		NOTES_FETCH_FAILED: "Error fetching notes",
		NOTE_CREATE_FAILED: "Error creating note",
		NOTE_UPDATE_FAILED: "Error updating note",
		NOTE_DELETE_FAILED: "Error deleting note",
		NOTE_FETCH_FAILED: "Error fetching note",
		NOTE_NOT_FOUND: "Note not found",
		REQUIRED_FIELDS_MISSING: "Video ID, title, and content are required",
		INVALID_NOTE_ID: "Invalid note ID format",
	},
};

const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	BAD_REQUEST: 400,
	NOT_FOUND: 404,
	INTERNAL_SERVER_ERROR: 500,
};

const DEFAULT_VALUES = {
	CATEGORY: "general",
	PRIORITY: "medium",
	SORT_ORDER: { createdAt: -1 },
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

const validateNoteId = (noteId) => {
	if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
		throw new Error(RESPONSE_MESSAGES.ERROR.INVALID_NOTE_ID);
	}
};

const validateCreateNoteData = ({ videoId, title, content }) => {
	if (!videoId?.trim() || !title?.trim() || !content?.trim()) {
		throw new Error(RESPONSE_MESSAGES.ERROR.REQUIRED_FIELDS_MISSING);
	}
};

const sanitizeNoteData = (data) => {
	const sanitized = {};

	if (data.videoId) sanitized.videoId = data.videoId.trim();
	if (data.title) sanitized.title = data.title.trim();
	if (data.content) sanitized.content = data.content.trim();
	if (data.category) sanitized.category = data.category.toLowerCase();
	if (data.priority) sanitized.priority = data.priority.toLowerCase();
	if (typeof data.isCompleted === "boolean")
		sanitized.isCompleted = data.isCompleted;
	if (Array.isArray(data.tags)) {
		sanitized.tags = data.tags
			.filter((tag) => tag?.trim())
			.map((tag) => tag.trim());
	}

	return sanitized;
};

const getNotesForVideoHandler = async (req, res) => {
	const { videoId } = req.params;
	const {
		category,
		priority,
		isCompleted,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = req.query;

	const filter = { videoId };
	if (category) filter.category = category.toLowerCase();
	if (priority) filter.priority = priority.toLowerCase();
	if (isCompleted !== undefined) filter.isCompleted = isCompleted === "true";

	const sortOptions = {};
	sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

	const notes = await Note.find(filter).sort(sortOptions);

	res.json(
		createSuccessResponse(notes, RESPONSE_MESSAGES.SUCCESS.NOTES_FETCHED)
	);
};

const createNoteHandler = async (req, res) => {
	const noteData = sanitizeNoteData(req.body);
	validateCreateNoteData(noteData);

	const note = new Note({
		...noteData,
		category: noteData.category || DEFAULT_VALUES.CATEGORY,
		priority: noteData.priority || DEFAULT_VALUES.PRIORITY,
	});

	await note.save();

	res
		.status(HTTP_STATUS.CREATED)
		.json(createSuccessResponse(note, RESPONSE_MESSAGES.SUCCESS.NOTE_CREATED));
};

const updateNoteHandler = async (req, res) => {
	const { noteId } = req.params;
	validateNoteId(noteId);

	const updateData = sanitizeNoteData(req.body);

	const note = await Note.findByIdAndUpdate(noteId, updateData, {
		new: true,
		runValidators: true,
		omitUndefined: true,
	});

	if (!note) {
		return res
			.status(HTTP_STATUS.NOT_FOUND)
			.json(createErrorResponse(RESPONSE_MESSAGES.ERROR.NOTE_NOT_FOUND));
	}

	res.json(createSuccessResponse(note, RESPONSE_MESSAGES.SUCCESS.NOTE_UPDATED));
};

const deleteNoteHandler = async (req, res) => {
	const { noteId } = req.params;
	validateNoteId(noteId);

	const note = await Note.findByIdAndDelete(noteId);

	if (!note) {
		return res
			.status(HTTP_STATUS.NOT_FOUND)
			.json(createErrorResponse(RESPONSE_MESSAGES.ERROR.NOTE_NOT_FOUND));
	}

	res.json(createSuccessResponse(null, RESPONSE_MESSAGES.SUCCESS.NOTE_DELETED));
};

const getNoteByIdHandler = async (req, res) => {
	const { noteId } = req.params;
	validateNoteId(noteId);

	const note = await Note.findById(noteId);

	if (!note) {
		return res
			.status(HTTP_STATUS.NOT_FOUND)
			.json(createErrorResponse(RESPONSE_MESSAGES.ERROR.NOTE_NOT_FOUND));
	}

	res.json(createSuccessResponse(note, RESPONSE_MESSAGES.SUCCESS.NOTE_FETCHED));
};

const createErrorHandler = (eventType, errorMessage) => {
	return async (error, req, res, next) => {
		const eventData = {
			videoId: req.params.videoId || req.body.videoId,
			noteId: req.params.noteId,
			details: { error: error.message },
			success: false,
			errorMessage: error.message,
		};

		await asyncLogEvent(eventType, eventData, req);

		const statusCode =
			error.message === RESPONSE_MESSAGES.ERROR.NOTE_NOT_FOUND
				? HTTP_STATUS.NOT_FOUND
				: HTTP_STATUS.INTERNAL_SERVER_ERROR;

		res
			.status(statusCode)
			.json(createErrorResponse(errorMessage, error.message));
	};
};

const searchNotesHandler = async (req, res) => {
	const {
		q: query,
		videoId,
		category,
		priority,
		limit = 50,
		offset = 0,
	} = req.query;

	const filter = {};
	if (videoId) filter.videoId = videoId;
	if (category) filter.category = category.toLowerCase();
	if (priority) filter.priority = priority.toLowerCase();

	const searchOptions = {
		limit: Math.min(parseInt(limit), 100),
		skip: Math.max(parseInt(offset), 0),
		sort: DEFAULT_VALUES.SORT_ORDER,
	};

	let notes;
	if (query?.trim()) {
		notes = await Note.find(
			{
				...filter,
				$or: [
					{ title: { $regex: query.trim(), $options: "i" } },
					{ content: { $regex: query.trim(), $options: "i" } },
					{ tags: { $in: [new RegExp(query.trim(), "i")] } },
				],
			},
			null,
			searchOptions
		);
	} else {
		notes = await Note.find(filter, null, searchOptions);
	}

	res.json(
		createSuccessResponse(notes, RESPONSE_MESSAGES.SUCCESS.NOTES_FETCHED)
	);
};

const toggleNoteCompletionHandler = async (req, res) => {
	const { noteId } = req.params;
	validateNoteId(noteId);

	const note = await Note.findById(noteId);
	if (!note) {
		return res
			.status(HTTP_STATUS.NOT_FOUND)
			.json(createErrorResponse(RESPONSE_MESSAGES.ERROR.NOTE_NOT_FOUND));
	}

	note.isCompleted = !note.isCompleted;
	await note.save();

	res.json(createSuccessResponse(note, RESPONSE_MESSAGES.SUCCESS.NOTE_UPDATED));
};

router.get(
	"/search",
	eventLogger("user_action"),
	handleAsyncRoute(async (req, res) => {
		try {
			await searchNotesHandler(req, res);
		} catch (error) {
			await createErrorHandler(
				"api_error",
				RESPONSE_MESSAGES.ERROR.NOTES_FETCH_FAILED
			)(error, req, res);
		}
	})
);

router.get(
	"/video/:videoId",
	eventLogger("user_action"),
	handleAsyncRoute(async (req, res) => {
		try {
			await getNotesForVideoHandler(req, res);
		} catch (error) {
			await createErrorHandler(
				"api_error",
				RESPONSE_MESSAGES.ERROR.NOTES_FETCH_FAILED
			)(error, req, res);
		}
	})
);

router.post(
	"/",
	eventLogger("note_created"),
	handleAsyncRoute(async (req, res) => {
		try {
			await createNoteHandler(req, res);
		} catch (error) {
			await createErrorHandler(
				"api_error",
				RESPONSE_MESSAGES.ERROR.NOTE_CREATE_FAILED
			)(error, req, res);
		}
	})
);

router.put(
	"/:noteId",
	eventLogger("note_updated"),
	handleAsyncRoute(async (req, res) => {
		try {
			await updateNoteHandler(req, res);
		} catch (error) {
			await createErrorHandler(
				"api_error",
				RESPONSE_MESSAGES.ERROR.NOTE_UPDATE_FAILED
			)(error, req, res);
		}
	})
);

router.patch(
	"/:noteId/toggle",
	eventLogger("note_updated"),
	handleAsyncRoute(async (req, res) => {
		try {
			await toggleNoteCompletionHandler(req, res);
		} catch (error) {
			await createErrorHandler(
				"api_error",
				RESPONSE_MESSAGES.ERROR.NOTE_UPDATE_FAILED
			)(error, req, res);
		}
	})
);

router.delete(
	"/:noteId",
	eventLogger("note_deleted"),
	handleAsyncRoute(async (req, res) => {
		try {
			await deleteNoteHandler(req, res);
		} catch (error) {
			await createErrorHandler(
				"api_error",
				RESPONSE_MESSAGES.ERROR.NOTE_DELETE_FAILED
			)(error, req, res);
		}
	})
);

router.get(
	"/:noteId",
	eventLogger("user_action"),
	handleAsyncRoute(async (req, res) => {
		try {
			await getNoteByIdHandler(req, res);
		} catch (error) {
			await createErrorHandler(
				"api_error",
				RESPONSE_MESSAGES.ERROR.NOTE_FETCH_FAILED
			)(error, req, res);
		}
	})
);

export default router;
