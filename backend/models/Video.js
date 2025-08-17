import mongoose from "mongoose";

const VIDEO_DEFAULT_VALUES = {
	DESCRIPTION: "",
	THUMBNAIL: "",
	DURATION: "",
	VIEW_COUNT: "0",
	LIKE_COUNT: "0",
	COMMENT_COUNT: "0",
	UPLOAD_STATUS: "processed",
	PRIVACY_STATUS: "unlisted",
};

const statisticsSchema = new mongoose.Schema(
	{
		viewCount: {
			type: String,
			default: VIDEO_DEFAULT_VALUES.VIEW_COUNT,
		},
		likeCount: {
			type: String,
			default: VIDEO_DEFAULT_VALUES.LIKE_COUNT,
		},
		commentCount: {
			type: String,
			default: VIDEO_DEFAULT_VALUES.COMMENT_COUNT,
		},
	},
	{ _id: false }
);

const statusSchema = new mongoose.Schema(
	{
		uploadStatus: {
			type: String,
			default: VIDEO_DEFAULT_VALUES.UPLOAD_STATUS,
		},
		privacyStatus: {
			type: String,
			default: VIDEO_DEFAULT_VALUES.PRIVACY_STATUS,
		},
	},
	{ _id: false }
);

const videoSchema = new mongoose.Schema(
	{
		youtubeId: {
			type: String,
			required: [true, "YouTube ID is required"],
			unique: true,
			trim: true,
		},
		title: {
			type: String,
			required: [true, "Title is required"],
			trim: true,
			maxlength: [500, "Title cannot exceed 500 characters"],
		},
		description: {
			type: String,
			default: VIDEO_DEFAULT_VALUES.DESCRIPTION,
			maxlength: [5000, "Description cannot exceed 5000 characters"],
		},
		thumbnail: {
			type: String,
			default: VIDEO_DEFAULT_VALUES.THUMBNAIL,
			validate: {
				validator: function (v) {
					return !v || /^https?:\/\/.+/.test(v);
				},
				message: "Thumbnail must be a valid URL",
			},
		},
		duration: {
			type: String,
			default: VIDEO_DEFAULT_VALUES.DURATION,
		},
		publishedAt: {
			type: Date,
			default: Date.now,
		},
		statistics: statisticsSchema,
		status: statusSchema,
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

videoSchema.index({ youtubeId: 1 });
videoSchema.index({ title: "text", description: "text" });

videoSchema.pre("save", function (next) {
	if (this.isNew) {
		this.statistics = this.statistics || {};
		this.status = this.status || {};
	}
	next();
});

export default mongoose.model("Video", videoSchema);
