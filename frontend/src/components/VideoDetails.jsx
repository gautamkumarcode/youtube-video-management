import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import toast from "react-hot-toast";
import { videoAPI } from "../services/api";

const VideoDetails = ({ video, onVideoUpdate }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [title, setTitle] = useState(video?.title || "");
	const [description, setDescription] = useState(video?.description || "");
	const [loading, setLoading] = useState(false);

	const handleUpdate = async (e) => {
		e.preventDefault();
		if (!title.trim()) {
			toast.error("Title is required");
			return;
		}

		setLoading(true);
		try {
			const response = await videoAPI.updateVideo(video.youtubeId, {
				title: title.trim(),
				description: description.trim(),
			});

			if (response.data.success) {
				onVideoUpdate(response.data.data);
				setIsEditing(false);
				toast.success("Video updated successfully!");
			}
		} catch (error) {
			console.error("Error updating video:", error);
			toast.error(error.response?.data?.message || "Failed to update video");
		} finally {
			setLoading(false);
		}
	};

	const cancelEdit = () => {
		setTitle(video?.title || "");
		setDescription(video?.description || "");
		setIsEditing(false);
	};

	if (!video) {
		return (
			<div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
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
								d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<p className="text-gray-400">
						No video selected. Use the search above to load a video.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-gray-800 rounded-lg border border-gray-700 p-8 mb-8">
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
					<h2 className="text-2xl font-semibold text-white">Video Details</h2>
				</div>
				{!isEditing && (
					<button
						onClick={() => setIsEditing(true)}
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
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
						<span>Edit</span>
					</button>
				)}
			</div>

			{/* Video Thumbnail and Basic Info */}
			<div className="flex flex-col lg:flex-row gap-8 mb-6">
				<div className="lg:w-1/3">
					{video.thumbnail && (
						<div className="relative group">
							<img
								src={video.thumbnail}
								alt={video.title}
								className="w-full rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
							/>
							<div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
								<svg
									className="w-12 h-12 text-white"
									fill="currentColor"
									viewBox="0 0 24 24">
									<path d="M8 5v14l11-7z" />
								</svg>
							</div>
						</div>
					)}
				</div>

				<div className="lg:w-2/3">
					{isEditing ? (
						<form onSubmit={handleUpdate} className="space-y-6">
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Video Title
								</label>
								<input
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
									placeholder="Enter video title..."
									disabled={loading}
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Description
								</label>
								<textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={4}
									className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
									placeholder="Enter video description..."
									disabled={loading}
								/>
							</div>

							<div className="flex gap-3">
								<button
									type="submit"
									disabled={loading}
									className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 transition-all duration-200 flex items-center space-x-2">
									{loading ? (
										<>
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
											<span>Saving...</span>
										</>
									) : (
										<>
											<svg
												className="w-4 h-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M5 13l4 4L19 7"
												/>
											</svg>
											<span>Save Changes</span>
										</>
									)}
								</button>
								<button
									type="button"
									onClick={cancelEdit}
									disabled={loading}
									className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 flex items-center space-x-2">
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
									<span>Cancel</span>
								</button>
							</div>
						</form>
					) : (
						<div className="space-y-6">
							<div>
								<h3 className="text-2xl font-bold text-gray-800 mb-3 leading-tight">
									{video.title}
								</h3>
								<p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
									{video.description}
								</p>
							</div>

							<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
								<div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-4 rounded-xl">
									<div className="flex items-center space-x-2 mb-2">
										<svg
											className="w-5 h-5 text-blue-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
											/>
										</svg>
										<p className="font-semibold text-blue-700">Views</p>
									</div>
									<p className="text-2xl font-bold text-blue-800">
										{parseInt(
											video.statistics?.viewCount || 0
										).toLocaleString()}
									</p>
								</div>

								<div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-4 rounded-xl">
									<div className="flex items-center space-x-2 mb-2">
										<svg
											className="w-5 h-5 text-green-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
											/>
										</svg>
										<p className="font-semibold text-green-700">Likes</p>
									</div>
									<p className="text-2xl font-bold text-green-800">
										{parseInt(
											video.statistics?.likeCount || 0
										).toLocaleString()}
									</p>
								</div>

								<div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-4 rounded-xl">
									<div className="flex items-center space-x-2 mb-2">
										<svg
											className="w-5 h-5 text-purple-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
											/>
										</svg>
										<p className="font-semibold text-purple-700">Comments</p>
									</div>
									<p className="text-2xl font-bold text-purple-800">
										{parseInt(
											video.statistics?.commentCount || 0
										).toLocaleString()}
									</p>
								</div>

								<div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-4 rounded-xl">
									<div className="flex items-center space-x-2 mb-2">
										<svg
											className="w-5 h-5 text-orange-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
											/>
										</svg>
										<p className="font-semibold text-orange-700">Privacy</p>
									</div>
									<p className="text-lg font-bold text-orange-800 capitalize">
										{video.status?.privacyStatus}
									</p>
								</div>
							</div>

							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
								<div className="flex items-center space-x-2">
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
									<span>
										Published {formatDistanceToNow(new Date(video.publishedAt))}{" "}
										ago
									</span>
								</div>
								<div className="flex items-center space-x-2 mt-2 sm:mt-0">
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2M7 4h10M11 14h2"
										/>
									</svg>
									<span>ID: {video.youtubeId}</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default VideoDetails;
