import { useCallback, useState } from "react";
import AnalyticsDashboard from "./AnalyticsDashboard";
import CommentsSection from "./CommentsSection";
import NotesSection from "./NotesSection";
import UserProfile from "./UserProfile";
import VideoDetails from "./VideoDetails";
import VideoSearch from "./VideoSearch";

const APP_CONFIG = {
	LAYOUT: {
		MAX_WIDTH: "max-w-none",
		PADDING: "px-0",
	},
};

const YouTubeStudioIcon = () => (
	<div className="flex items-center space-x-3">
		<div className="w-8 h-8 bg-red-600 rounded-sm flex items-center justify-center">
			<svg
				className="w-5 h-5 text-white"
				fill="currentColor"
				viewBox="0 0 24 24">
				<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
			</svg>
		</div>
		<div className="flex flex-col">
			<span className="text-xl font-medium text-white">YouTube</span>
			<span className="text-sm text-gray-400 -mt-1">Studio</span>
		</div>
	</div>
);

const AppHeader = () => (
	<header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
		<div className="flex items-center justify-between px-6 py-3">
			<div className="flex items-center space-x-6">
				<YouTubeStudioIcon />
			</div>
			<div className="flex items-center space-x-4">
				<UserProfile />
			</div>
		</div>
	</header>
);

const EmptyStateIcon = () => (
	<div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-6">
		<svg
			className="w-12 h-12 text-gray-400"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor">
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
			/>
		</svg>
	</div>
);

const EmptyState = () => (
	<div className="text-center py-20">
		<EmptyStateIcon />
		<h3 className="text-xl font-medium text-white mb-2">No video selected</h3>
		<p className="text-gray-400 max-w-md mx-auto">
			Enter a YouTube video URL to start managing your content, analyze
			performance, and organize your video assets.
		</p>
	</div>
);

const VideoManagementSection = ({ currentVideo, onVideoUpdate }) => (
	<div className="space-y-6">
		<VideoDetails video={currentVideo} onVideoUpdate={onVideoUpdate} />

		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div className="lg:col-span-2">
				<CommentsSection video={currentVideo} />
			</div>
			<div>
				<NotesSection video={currentVideo} />
			</div>
		</div>
	</div>
);

const Dashboard = () => {
	const [currentVideo, setCurrentVideo] = useState(null);

	const handleVideoFound = useCallback((video) => {
		setCurrentVideo(video);
	}, []);

	const handleVideoUpdate = useCallback((updatedVideo) => {
		setCurrentVideo(updatedVideo);
	}, []);

	return (
		<div className="min-h-screen bg-gray-900">
			<AppHeader />

			<div className="flex">
				<main className="flex-1 bg-gray-900">
					<div
						className={`${APP_CONFIG.LAYOUT.MAX_WIDTH} mx-auto ${APP_CONFIG.LAYOUT.PADDING} py-6`}>
						<div className="mb-6 px-6">
							<VideoSearch onVideoFound={handleVideoFound} />
						</div>

						<div className="px-6">
							{currentVideo ? (
								<VideoManagementSection
									currentVideo={currentVideo}
									onVideoUpdate={handleVideoUpdate}
								/>
							) : (
								<EmptyState />
							)}

							{/* Analytics Dashboard - Always visible */}
							<div className="mt-8">
								<AnalyticsDashboard video={currentVideo} />
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
};

export default Dashboard;
