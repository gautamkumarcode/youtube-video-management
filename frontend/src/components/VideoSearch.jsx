import { useState } from "react";
import toast from "react-hot-toast";
import { videoAPI } from "../services/api";

const VideoSearch = ({ onVideoFound }) => {
	const [videoId, setVideoId] = useState("");
	const [loading, setLoading] = useState(false);

	const extractVideoId = (url) => {
		const regex =
			/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
		const match = url.match(regex);
		return match ? match[1] : url;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!videoId.trim()) {
			toast.error("Please enter a YouTube video ID or URL");
			return;
		}

		setLoading(true);
		try {
			const extractedId = extractVideoId(videoId.trim());
			const response = await videoAPI.getVideo(extractedId);

			if (response.data.success) {
				onVideoFound(response.data.data);
				toast.success("Video loaded successfully!");
			}
		} catch (error) {
			console.error("Error fetching video:", error);
			toast.error(error.response?.data?.message || "Failed to fetch video");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
			<div className="flex items-center space-x-3 mb-6">
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
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</div>
				<h2 className="text-xl font-semibold text-white">
					Load Your YouTube Video
				</h2>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="flex flex-col sm:flex-row gap-4">
					<input
						type="text"
						value={videoId}
						onChange={(e) => setVideoId(e.target.value)}
						placeholder="Enter YouTube video ID or URL (e.g., dQw4w9WgXcQ)"
						className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
						disabled={loading}
					/>
					<button
						type="submit"
						disabled={loading}
						className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 min-w-[120px]">
						{loading ? (
							<>
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
								<span>Loading...</span>
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
										d="M9 5l7 7-7 7"
									/>
								</svg>
								<span>Load Video</span>
							</>
						)}
					</button>
				</div>

				<p className="text-sm text-gray-400 flex items-start space-x-2">
					<svg
						className="w-4 h-4 mt-0.5 flex-shrink-0"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>
						You can paste a full YouTube URL or just the video ID. Make sure the
						video is public and accessible.{" "}
						<span className="text-red-400 font-medium">
							Full videos only, not shorts videos.
						</span>
					</span>
				</p>
			</form>
		</div>
	);
};

export default VideoSearch;
