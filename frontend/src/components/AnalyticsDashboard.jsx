import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { eventLogsAPI } from "../services/api";

const AnalyticsDashboard = ({ video }) => {
	const [eventLogs, setEventLogs] = useState([]);
	const [loading, setLoading] = useState(false);
	const [stats, setStats] = useState({
		totalEvents: 0,
		videoEvents: 0,
		commentEvents: 0,
		noteEvents: 0,
		errorEvents: 0,
	});
	const [filter, setFilter] = useState("all");

	useEffect(() => {
		fetchEventLogs();
	}, [video, filter]);

	const fetchEventLogs = async () => {
		setLoading(true);
		try {
			const params = {};
			if (video?.youtubeId) params.videoId = video.youtubeId;
			if (filter !== "all") params.eventType = filter;

			const response = await eventLogsAPI.getEventLogs(params);
			if (response.data.success) {
				const logs = response.data.data?.logs || response.data.data || [];
				setEventLogs(Array.isArray(logs) ? logs : []);
				calculateStats(Array.isArray(logs) ? logs : []);
			} else {
				console.error("API returned success: false", response.data);
				setEventLogs([]);
				calculateStats([]);
			}
		} catch (error) {
			console.error("Error fetching event logs:", error);
			toast.error("Failed to load analytics data");
			setEventLogs([]);
			calculateStats([]);
		} finally {
			setLoading(false);
		}
	};

	const calculateStats = (logs) => {
		// Ensure logs is an array
		if (!Array.isArray(logs)) {
			console.warn("calculateStats received non-array data:", logs);
			logs = [];
		}

		const stats = {
			totalEvents: logs.length,
			videoEvents: 0,
			commentEvents: 0,
			noteEvents: 0,
			errorEvents: 0,
		};

		logs.forEach((log) => {
			if (log.eventType.includes("video")) stats.videoEvents++;
			else if (log.eventType.includes("comment")) stats.commentEvents++;
			else if (log.eventType.includes("note")) stats.noteEvents++;
			else if (log.eventType === "api_error" || !log.success)
				stats.errorEvents++;
		});

		setStats(stats);
	};

	const getEventIcon = (eventType) => {
		if (eventType.includes("video")) {
			return (
				<svg
					className="w-4 h-4 text-blue-400"
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
			);
		} else if (eventType.includes("comment")) {
			return (
				<svg
					className="w-4 h-4 text-purple-400"
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
			);
		} else if (eventType.includes("note")) {
			return (
				<svg
					className="w-4 h-4 text-green-400"
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
			);
		} else if (eventType === "api_error" || eventType.includes("error")) {
			return (
				<svg
					className="w-4 h-4 text-red-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
					/>
				</svg>
			);
		}
		return (
			<svg
				className="w-4 h-4 text-gray-400"
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
		);
	};

	const formatEventType = (eventType) => {
		return eventType
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	};

	return (
		<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
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
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
				</div>
				<h3 className="text-xl font-semibold text-white">
					Analytics & Activity
				</h3>
			</div>

			{/* Statistics Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
				<div className="bg-gray-700 border border-gray-600 p-4 rounded-lg">
					<div className="flex items-center space-x-2 mb-2">
						<svg
							className="w-5 h-5 text-blue-400"
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
						<p className="font-medium text-blue-300">Total Events</p>
					</div>
					<p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
				</div>

				<div className="bg-gray-700 border border-gray-600 p-4 rounded-lg">
					<div className="flex items-center space-x-2 mb-2">
						<svg
							className="w-5 h-5 text-blue-400"
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
						<p className="font-medium text-blue-300">Video</p>
					</div>
					<p className="text-2xl font-bold text-white">{stats.videoEvents}</p>
				</div>

				<div className="bg-gray-700 border border-gray-600 p-4 rounded-lg">
					<div className="flex items-center space-x-2 mb-2">
						<svg
							className="w-5 h-5 text-purple-400"
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
						<p className="font-medium text-purple-300">Comments</p>
					</div>
					<p className="text-2xl font-bold text-white">{stats.commentEvents}</p>
				</div>

				<div className="bg-gray-700 border border-gray-600 p-4 rounded-lg">
					<div className="flex items-center space-x-2 mb-2">
						<svg
							className="w-5 h-5 text-green-400"
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
						<p className="font-medium text-green-300">Notes</p>
					</div>
					<p className="text-2xl font-bold text-white">{stats.noteEvents}</p>
				</div>

				<div className="bg-gray-700 border border-gray-600 p-4 rounded-lg">
					<div className="flex items-center space-x-2 mb-2">
						<svg
							className="w-5 h-5 text-red-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
						<p className="font-medium text-red-300">Errors</p>
					</div>
					<p className="text-2xl font-bold text-white">{stats.errorEvents}</p>
				</div>
			</div>

			{/* Filter Buttons */}
			<div className="flex flex-wrap gap-2 mb-6">
				{[
					{ key: "all", label: "All Events" },
					{ key: "video_fetched", label: "Video Fetched" },
					{ key: "video_updated", label: "Video Updated" },
					{ key: "comment_added", label: "Comment Added" },
					{ key: "comment_replied", label: "Comment Replied" },
					{ key: "comment_deleted", label: "Comment Deleted" },
					{ key: "note_created", label: "Note Created" },
					{ key: "note_updated", label: "Note Updated" },
					{ key: "note_deleted", label: "Note Deleted" },
					{ key: "api_error", label: "API Errors" },
				].map((filterOption) => (
					<button
						key={filterOption.key}
						onClick={() => setFilter(filterOption.key)}
						className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
							filter === filterOption.key
								? "bg-blue-600 text-white"
								: "bg-gray-700 text-gray-300 hover:bg-gray-600"
						}`}>
						{filterOption.label}
					</button>
				))}
			</div>

			{/* Event Logs */}
			<div className="space-y-3">
				<h4 className="text-lg font-medium text-white mb-4">Recent Activity</h4>

				{loading ? (
					<div className="flex justify-center py-8">
						<div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
					</div>
				) : eventLogs.length === 0 ? (
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
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
						</div>
						<p className="text-gray-400">No activity logs found</p>
						<p className="text-gray-500 text-sm mt-1">
							Activity will appear here as you use the dashboard
						</p>
					</div>
				) : (
					<div className="max-h-96 overflow-y-auto space-y-2">
						{Array.isArray(eventLogs) &&
							eventLogs.map((log) => (
								<div
									key={log._id}
									className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
										log.success
											? "bg-gray-700 border-gray-600"
											: "bg-red-900/20 border-red-800"
									}`}>
									<div className="flex-shrink-0 mt-1">
										{getEventIcon(log.eventType)}
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between mb-1">
											<p className="text-sm font-medium text-white">
												{formatEventType(log.eventType)}
											</p>
											<span className="text-xs text-gray-400">
												{formatDistanceToNow(new Date(log.createdAt))} ago
											</span>
										</div>

										{log.videoId && (
											<p className="text-xs text-gray-400 mb-1">
												Video: {log.videoId}
											</p>
										)}

										{log.details && Object.keys(log.details).length > 0 && (
											<div className="text-xs text-gray-500">
												{JSON.stringify(log.details, null, 2).slice(0, 100)}
												{JSON.stringify(log.details).length > 100 && "..."}
											</div>
										)}

										{!log.success && log.errorMessage && (
											<p className="text-xs text-red-400 mt-1">
												Error: {log.errorMessage}
											</p>
										)}
									</div>

									<div className="flex-shrink-0">
										<span
											className={`inline-block w-2 h-2 rounded-full ${
												log.success ? "bg-green-400" : "bg-red-400"
											}`}
										/>
									</div>
								</div>
							))}
					</div>
				)}
			</div>
		</div>
	);
};

export default AnalyticsDashboard;
