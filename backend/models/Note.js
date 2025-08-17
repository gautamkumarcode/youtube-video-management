import mongoose from "mongoose";

const NOTE_CONSTANTS = {
	CATEGORIES: ["improvement", "ideas", "feedback", "general"],
	PRIORITIES: ["low", "medium", "high"],
	DEFAULT_CATEGORY: "general",
	DEFAULT_PRIORITY: "medium",
	MAX_TITLE_LENGTH: 200,
	MAX_CONTENT_LENGTH: 10000,
};

const noteSchema = new mongoose.Schema(
	{
		videoId: {
			type: String,
			required: [true, "Video ID is required"],
			trim: true,
			validate: {
				validator: function (v) {
					return v && v.length > 0;
				},
				message: "Video ID cannot be empty",
			},
		},
		title: {
			type: String,
			required: [true, "Title is required"],
			trim: true,
			maxlength: [
				NOTE_CONSTANTS.MAX_TITLE_LENGTH,
				`Title cannot exceed ${NOTE_CONSTANTS.MAX_TITLE_LENGTH} characters`,
			],
		},
		content: {
			type: String,
			required: [true, "Content is required"],
			trim: true,
			maxlength: [
				NOTE_CONSTANTS.MAX_CONTENT_LENGTH,
				`Content cannot exceed ${NOTE_CONSTANTS.MAX_CONTENT_LENGTH} characters`,
			],
		},
		category: {
			type: String,
			enum: {
				values: NOTE_CONSTANTS.CATEGORIES,
				message: "Category must be one of: {VALUE}",
			},
			default: NOTE_CONSTANTS.DEFAULT_CATEGORY,
			lowercase: true,
		},
		priority: {
			type: String,
			enum: {
				values: NOTE_CONSTANTS.PRIORITIES,
				message: "Priority must be one of: {VALUE}",
			},
			default: NOTE_CONSTANTS.DEFAULT_PRIORITY,
			lowercase: true,
		},
		isCompleted: {
			type: Boolean,
			default: false,
		},
		tags: [
			{
				type: String,
				trim: true,
				maxlength: [50, "Tag cannot exceed 50 characters"],
			},
		],
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

noteSchema.index({ videoId: 1, createdAt: -1 });
noteSchema.index({ category: 1, priority: 1 });
noteSchema.index({ title: "text", content: "text" });

noteSchema.virtual("isHighPriority").get(function () {
	return this.priority === "high";
});

noteSchema.pre("save", function (next) {
	if (this.tags) {
		this.tags = this.tags.filter((tag) => tag.trim().length > 0);
	}
	next();
});

export default mongoose.model("Note", noteSchema);
