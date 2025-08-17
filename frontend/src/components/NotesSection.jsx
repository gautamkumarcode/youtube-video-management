import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { notesAPI } from "../services/api";

const NotesSection = ({ video }) => {
	const [notes, setNotes] = useState([]);
	const [loading, setLoading] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [editingNote, setEditingNote] = useState(null);
	const [formData, setFormData] = useState({
		title: "",
		content: "",
		category: "general",
		priority: "medium",
	});

	// Search and filter states
	const [searchQuery, setSearchQuery] = useState("");
	const [filterCategory, setFilterCategory] = useState("all");
	const [filterPriority, setFilterPriority] = useState("all");
	const [filteredNotes, setFilteredNotes] = useState([]);

	useEffect(() => {
		if (video?.youtubeId) {
			fetchNotes();
		}
	}, [video]);

	// Filter notes based on search and filters
	useEffect(() => {
		let filtered = notes;

		// Search filter
		if (searchQuery.trim()) {
			filtered = filtered.filter(
				(note) =>
					note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					note.content.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		// Category filter
		if (filterCategory !== "all") {
			filtered = filtered.filter((note) => note.category === filterCategory);
		}

		// Priority filter
		if (filterPriority !== "all") {
			filtered = filtered.filter((note) => note.priority === filterPriority);
		}

		setFilteredNotes(filtered);
	}, [notes, searchQuery, filterCategory, filterPriority]);

	const fetchNotes = async () => {
		setLoading(true);
		try {
			const response = await notesAPI.getNotes(video.youtubeId);
			if (response.data.success) {
				setNotes(response.data.data);
			}
		} catch (error) {
			console.error("Error fetching notes:", error);
			toast.error("Failed to load notes");
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!formData.title.trim() || !formData.content.trim()) {
			toast.error("Title and content are required");
			return;
		}

		try {
			let response;
			if (editingNote) {
				response = await notesAPI.updateNote(editingNote._id, formData);
			} else {
				response = await notesAPI.createNote({
					...formData,
					videoId: video.youtubeId,
				});
			}

			if (response.data.success) {
				setFormData({
					title: "",
					content: "",
					category: "general",
					priority: "medium",
				});
				setShowForm(false);
				setEditingNote(null);
				fetchNotes();
				toast.success(
					editingNote
						? "Note updated successfully!"
						: "Note created successfully!"
				);
			}
		} catch (error) {
			console.error("Error saving note:", error);
			toast.error(error.response?.data?.message || "Failed to save note");
		}
	};

	const handleEdit = (note) => {
		setFormData({
			title: note.title,
			content: note.content,
			category: note.category,
			priority: note.priority,
		});
		setEditingNote(note);
		setShowForm(true);
	};

	const handleDelete = async (noteId) => {
		if (!confirm("Are you sure you want to delete this note?")) {
			return;
		}

		try {
			const response = await notesAPI.deleteNote(noteId);
			if (response.data.success) {
				fetchNotes();
				toast.success("Note deleted successfully!");
			}
		} catch (error) {
			console.error("Error deleting note:", error);
			toast.error(error.response?.data?.message || "Failed to delete note");
		}
	};

	const handleToggleCompletion = async (noteId) => {
		try {
			const response = await notesAPI.toggleNoteCompletion(noteId);
			if (response.data.success) {
				fetchNotes();
				toast.success("Note status updated!");
			}
		} catch (error) {
			console.error("Error updating note status:", error);
			toast.error(
				error.response?.data?.message || "Failed to update note status"
			);
		}
	};

	const cancelForm = () => {
		setFormData({
			title: "",
			content: "",
			category: "general",
			priority: "medium",
		});
		setShowForm(false);
		setEditingNote(null);
	};

	const getPriorityColor = (priority) => {
		switch (priority) {
			case "high":
				return "bg-red-900/30 text-red-300 border border-red-800";
			case "medium":
				return "bg-yellow-900/30 text-yellow-300 border border-yellow-800";
			case "low":
				return "bg-green-900/30 text-green-300 border border-green-800";
			default:
				return "bg-gray-700 text-gray-300 border border-gray-600";
		}
	};

	const getCategoryColor = (category) => {
		switch (category) {
			case "improvement":
				return "bg-blue-900/30 text-blue-300 border border-blue-800";
			case "ideas":
				return "bg-purple-900/30 text-purple-300 border border-purple-800";
			case "feedback":
				return "bg-orange-900/30 text-orange-300 border border-orange-800";
			case "general":
				return "bg-gray-700 text-gray-300 border border-gray-600";
			default:
				return "bg-gray-700 text-gray-300 border border-gray-600";
		}
	};

	if (!video) {
		return null;
	}

	return (
		<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
			<div className="flex justify-between items-center mb-6">
				<div className="flex items-center space-x-3">
					<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
						<svg
							className="w-5 h-5 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
					</div>
					<h3 className="text-xl font-semibold text-white">Notes</h3>
				</div>
				<button
					onClick={() => setShowForm(true)}
					className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 flex items-center space-x-2">
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 6v6m0 0v6m0-6h6m-6 0H6"
						/>
					</svg>
					<span>Add Note</span>
				</button>
			</div>

			{/* Search and Filter Bar */}
			<div className="bg-gray-700 border border-gray-600 rounded-lg p-4 mb-6">
				<div className="flex flex-col lg:flex-row gap-4">
					{/* Search Input */}
					<div className="flex-1">
						<input
							type="text"
							placeholder="Search notes by title or content..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					{/* Category Filter */}
					<div className="w-full lg:w-48">
						<select
							value={filterCategory}
							onChange={(e) => setFilterCategory(e.target.value)}
							className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
							<option value="all">All Categories</option>
							<option value="general">General</option>
							<option value="improvement">Improvement</option>
							<option value="ideas">Ideas</option>
							<option value="feedback">Feedback</option>
						</select>
					</div>

					{/* Priority Filter */}
					<div className="w-full lg:w-48">
						<select
							value={filterPriority}
							onChange={(e) => setFilterPriority(e.target.value)}
							className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
							<option value="all">All Priorities</option>
							<option value="high">High Priority</option>
							<option value="medium">Medium Priority</option>
							<option value="low">Low Priority</option>
						</select>
					</div>

					{/* Clear Filters Button */}
					{(searchQuery ||
						filterCategory !== "all" ||
						filterPriority !== "all") && (
						<button
							onClick={() => {
								setSearchQuery("");
								setFilterCategory("all");
								setFilterPriority("all");
							}}
							className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors flex items-center space-x-2">
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
							<span>Clear</span>
						</button>
					)}
				</div>
			</div>

			{/* Note Form */}
			{showForm && (
				<div className="bg-gray-700 border border-gray-600 rounded-lg p-4 mb-6">
					<h4 className="font-medium text-white mb-3">
						{editingNote ? "Edit Note" : "Add New Note"}
					</h4>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Title
							</label>
							<input
								type="text"
								value={formData.title}
								onChange={(e) =>
									setFormData({ ...formData, title: e.target.value })
								}
								className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								placeholder="Enter note title"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Content
							</label>
							<textarea
								value={formData.content}
								onChange={(e) =>
									setFormData({ ...formData, content: e.target.value })
								}
								rows={4}
								className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								placeholder="Enter your ideas and notes here..."
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-1">
									Category
								</label>
								<select
									value={formData.category}
									onChange={(e) =>
										setFormData({ ...formData, category: e.target.value })
									}
									className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
									<option value="general">General</option>
									<option value="improvement">Improvement</option>
									<option value="ideas">Ideas</option>
									<option value="feedback">Feedback</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-300 mb-1">
									Priority
								</label>
								<select
									value={formData.priority}
									onChange={(e) =>
										setFormData({ ...formData, priority: e.target.value })
									}
									className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
									<option value="low">Low</option>
									<option value="medium">Medium</option>
									<option value="high">High</option>
								</select>
							</div>
						</div>

						<div className="flex gap-2">
							<button
								type="submit"
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
								{editingNote ? "Update Note" : "Save Note"}
							</button>
							<button
								type="button"
								onClick={cancelForm}
								className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors">
								Cancel
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Notes List */}
			{loading ? (
				<div className="flex justify-center py-8">
					<div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
				</div>
			) : filteredNotes.length === 0 && notes.length > 0 ? (
				<div className="text-center py-8">
					<div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							className="w-8 h-8 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					</div>
					<p className="text-gray-400">No notes match your search criteria</p>
					<p className="text-gray-500 text-sm mt-1">
						Try adjusting your search or filters
					</p>
				</div>
			) : notes.length === 0 ? (
				<p className="text-gray-400 text-center py-8">
					No notes yet. Add your first note to start organizing your video
					improvement ideas!
				</p>
			) : (
				<div className="space-y-4">
					{filteredNotes.map((note) => (
						<div
							key={note._id}
							className={`bg-gray-700 border border-gray-600 rounded-lg p-4 hover:bg-gray-650 transition-colors ${
								note.isCompleted ? "opacity-75" : ""
							}`}>
							<div className="flex justify-between items-start mb-2">
								<div className="flex items-start space-x-3 flex-1">
									<button
										onClick={() => handleToggleCompletion(note._id)}
										className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
											note.isCompleted
												? "bg-green-600 border-green-600 text-white"
												: "border-gray-400 hover:border-green-500"
										}`}>
										{note.isCompleted && (
											<svg
												className="w-3 h-3"
												fill="currentColor"
												viewBox="0 0 20 20">
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
										)}
									</button>
									<h4
										className={`font-medium text-white ${
											note.isCompleted ? "line-through text-gray-400" : ""
										}`}>
										{note.title}
									</h4>
								</div>
								<div className="flex gap-3">
									<button
										onClick={() => handleEdit(note)}
										className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
										Edit
									</button>
									<button
										onClick={() => handleDelete(note._id)}
										className="text-red-400 hover:text-red-300 text-sm transition-colors">
										Delete
									</button>
								</div>
							</div>

							<p
								className={`text-gray-300 mb-3 whitespace-pre-wrap ${
									note.isCompleted ? "line-through text-gray-500" : ""
								}`}>
								{note.content}
							</p>

							<div className="flex items-center justify-between">
								<div className="flex gap-2">
									<span
										className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
											note.category
										)}`}>
										{note.category}
									</span>
									<span
										className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
											note.priority
										)}`}>
										{note.priority} priority
									</span>
									{note.isCompleted && (
										<span className="px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300 border border-green-800">
											completed
										</span>
									)}
								</div>
								<span className="text-xs text-gray-500">
									{formatDistanceToNow(new Date(note.createdAt))} ago
								</span>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default NotesSection;
