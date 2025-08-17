import mongoose from "mongoose";

const EVENT_TYPES = {
	VIDEO_FETCHED: "video_fetched",
	VIDEO_UPDATED: "video_updated",
	COMMENT_ADDED: "comment_added",
	COMMENT_REPLIED: "comment_replied",
	COMMENT_DELETED: "comment_deleted",
	NOTE_CREATED: "note_created",
	NOTE_UPDATED: "note_updated",
	NOTE_DELETED: "note_deleted",
	API_ERROR: "api_error",
	USER_ACTION: "user_action",
};

const ALLOWED_EVENT_TYPES = Object.values(EVENT_TYPES);

const eventLogSchema = new mongoose.Schema(
	{
		eventType: {
			type: String,
			required: [true, "Event type is required"],
			enum: {
				values: ALLOWED_EVENT_TYPES,
				message: "Event type must be one of: {VALUE}",
			},
			uppercase: false,
		},
		videoId: {
			type: String,
			default: null,
			trim: true,
			validate: {
				validator: function (v) {
					return v === null || (typeof v === "string" && v.length > 0);
				},
				message: "Video ID must be a non-empty string if provided",
			},
		},
		commentId: {
			type: String,
			default: null,
			trim: true,
		},
		noteId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Note",
			default: null,
		},
		details: {
			type: mongoose.Schema.Types.Mixed,
			default: () => ({}),
			validate: {
				validator: function (v) {
					return v === null || typeof v === "object";
				},
				message: "Details must be an object",
			},
		},
		userAgent: {
			type: String,
			default: "",
			maxlength: [500, "User agent cannot exceed 500 characters"],
		},
		ipAddress: {
			type: String,
			default: "",
			validate: {
				validator: function (v) {
					if (!v) return true;
					const ipRegex =
						/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
					return ipRegex.test(v);
				},
				message: "Invalid IP address format",
			},
		},
		success: {
			type: Boolean,
			default: true,
		},
		errorMessage: {
			type: String,
			default: null,
			maxlength: [1000, "Error message cannot exceed 1000 characters"],
		},
		duration: {
			type: Number,
			default: null,
			min: [0, "Duration cannot be negative"],
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

eventLogSchema.index({ eventType: 1, createdAt: -1 });
eventLogSchema.index({ videoId: 1, createdAt: -1 });
eventLogSchema.index({ success: 1, createdAt: -1 });

eventLogSchema.virtual("isError").get(function () {
	return !this.success || this.eventType === EVENT_TYPES.API_ERROR;
});

eventLogSchema.statics.createLog = function (data) {
	return new this(data);
};

eventLogSchema.statics.EVENT_TYPES = EVENT_TYPES;

export default mongoose.model("EventLog", eventLogSchema);
