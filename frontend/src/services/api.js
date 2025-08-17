import axios from "axios";

const API_CONFIG = {
	BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
	TIMEOUT: 30000,
	DEFAULT_HEADERS: {
		"Content-Type": "application/json",
	},
};

const ENDPOINTS = {
	AUTH: "/auth",
	VIDEOS: "/videos",
	NOTES: "/notes",
	EVENT_LOGS: "/event-logs",
};

const createAPIInstance = () => {
	const instance = axios.create({
		baseURL: API_CONFIG.BASE_URL,
		timeout: API_CONFIG.TIMEOUT,
		headers: API_CONFIG.DEFAULT_HEADERS,
	});

	instance.interceptors.request.use(
		(config) => {
			const timestamp = new Date().toISOString();
			console.log(
				`[${timestamp}] API Request: ${config.method?.toUpperCase()} ${
					config.url
				}`
			);

			if (config.data) {
				console.log("Request Data:", config.data);
			}

			return config;
		},
		(error) => {
			console.error("Request Error:", error);
			return Promise.reject(error);
		}
	);

	instance.interceptors.response.use(
		(response) => {
			const timestamp = new Date().toISOString();
			console.log(
				`[${timestamp}] API Response: ${response.status} ${response.config.url}`
			);
			return response;
		},
		(error) => {
			const timestamp = new Date().toISOString();
			const errorMessage = error.response?.data?.message || error.message;
			const statusCode = error.response?.status;

			console.error(
				`[${timestamp}] API Error: ${statusCode || "Network"} - ${errorMessage}`
			);

			if (error.response?.data) {
				console.error("Error Details:", error.response.data);
			}

			return Promise.reject(error);
		}
	);

	return instance;
};

const api = createAPIInstance();

const createAPIService = (baseEndpoint) => ({
	get: (path = "", params = {}) => {
		const url = path ? `${baseEndpoint}${path}` : baseEndpoint;
		return api.get(url, { params });
	},

	post: (path = "", data = {}) => {
		const url = path ? `${baseEndpoint}${path}` : baseEndpoint;
		return api.post(url, data);
	},

	put: (path = "", data = {}) => {
		const url = path ? `${baseEndpoint}${path}` : baseEndpoint;
		return api.put(url, data);
	},

	patch: (path = "", data = {}) => {
		const url = path ? `${baseEndpoint}${path}` : baseEndpoint;
		return api.patch(url, data);
	},

	delete: (path = "") => {
		const url = path ? `${baseEndpoint}${path}` : baseEndpoint;
		return api.delete(url);
	},
});

const handleAPIError = (error, context = "API operation") => {
	const errorInfo = {
		context,
		status: error.response?.status,
		message: error.response?.data?.message || error.message,
		data: error.response?.data,
		timestamp: new Date().toISOString(),
	};

	console.error(`${context} failed:`, errorInfo);
	throw error;
};

export const videoAPI = {
	async getVideo(videoId) {
		try {
			if (!videoId) throw new Error("Video ID is required");
			return await api.get(`${ENDPOINTS.VIDEOS}/${videoId}`);
		} catch (error) {
			handleAPIError(error, "Get video details");
		}
	},

	async updateVideo(videoId, data) {
		try {
			if (!videoId) throw new Error("Video ID is required");
			if (!data.title?.trim()) throw new Error("Title is required");

			const sanitizedData = {
				title: data.title.trim(),
				description: (data.description || "").trim(),
			};

			return await api.put(`${ENDPOINTS.VIDEOS}/${videoId}`, sanitizedData);
		} catch (error) {
			handleAPIError(error, "Update video");
		}
	},

	async getComments(videoId, maxResults = 20) {
		try {
			if (!videoId) throw new Error("Video ID is required");
			return await api.get(`${ENDPOINTS.VIDEOS}/${videoId}/comments`, {
				params: { maxResults: Math.min(maxResults, 100) },
			});
		} catch (error) {
			handleAPIError(error, "Get video comments");
		}
	},

	async addComment(videoId, text) {
		try {
			if (!videoId) throw new Error("Video ID is required");
			if (!text?.trim()) throw new Error("Comment text is required");

			return await api.post(`${ENDPOINTS.VIDEOS}/${videoId}/comments`, {
				text: text.trim(),
			});
		} catch (error) {
			handleAPIError(error, "Add comment");
		}
	},

	async replyToComment(videoId, commentId, text) {
		try {
			if (!videoId) throw new Error("Video ID is required");
			if (!commentId) throw new Error("Comment ID is required");
			if (!text?.trim()) throw new Error("Reply text is required");

			return await api.post(
				`${ENDPOINTS.VIDEOS}/${videoId}/comments/${commentId}/reply`,
				{ text: text.trim() }
			);
		} catch (error) {
			handleAPIError(error, "Reply to comment");
		}
	},

	async deleteComment(videoId, commentId) {
		try {
			if (!videoId) throw new Error("Video ID is required");
			if (!commentId) throw new Error("Comment ID is required");

			return await api.delete(
				`${ENDPOINTS.VIDEOS}/${videoId}/comments/${commentId}`
			);
		} catch (error) {
			handleAPIError(error, "Delete comment");
		}
	},
};

export const notesAPI = {
	async getNotes(videoId, filters = {}) {
		try {
			if (!videoId) throw new Error("Video ID is required");

			const params = { ...filters };
			return await api.get(`${ENDPOINTS.NOTES}/video/${videoId}`, { params });
		} catch (error) {
			handleAPIError(error, "Get notes");
		}
	},

	async searchNotes(query, filters = {}) {
		try {
			const params = { q: query, ...filters };
			return await api.get(`${ENDPOINTS.NOTES}/search`, { params });
		} catch (error) {
			handleAPIError(error, "Search notes");
		}
	},

	async createNote(data) {
		try {
			const requiredFields = ["videoId", "title", "content"];
			for (const field of requiredFields) {
				if (!data[field]?.trim()) {
					throw new Error(`${field} is required`);
				}
			}

			const sanitizedData = {
				videoId: data.videoId.trim(),
				title: data.title.trim(),
				content: data.content.trim(),
				category: data.category?.toLowerCase() || "general",
				priority: data.priority?.toLowerCase() || "medium",
				tags: Array.isArray(data.tags)
					? data.tags.filter((tag) => tag?.trim()).map((tag) => tag.trim())
					: [],
			};

			return await api.post(ENDPOINTS.NOTES, sanitizedData);
		} catch (error) {
			handleAPIError(error, "Create note");
		}
	},

	async updateNote(noteId, data) {
		try {
			if (!noteId) throw new Error("Note ID is required");

			const sanitizedData = {};
			if (data.title) sanitizedData.title = data.title.trim();
			if (data.content) sanitizedData.content = data.content.trim();
			if (data.category) sanitizedData.category = data.category.toLowerCase();
			if (data.priority) sanitizedData.priority = data.priority.toLowerCase();
			if (typeof data.isCompleted === "boolean")
				sanitizedData.isCompleted = data.isCompleted;
			if (Array.isArray(data.tags)) {
				sanitizedData.tags = data.tags
					.filter((tag) => tag?.trim())
					.map((tag) => tag.trim());
			}

			return await api.put(`${ENDPOINTS.NOTES}/${noteId}`, sanitizedData);
		} catch (error) {
			handleAPIError(error, "Update note");
		}
	},

	async toggleNoteCompletion(noteId) {
		try {
			if (!noteId) throw new Error("Note ID is required");
			return await api.patch(`${ENDPOINTS.NOTES}/${noteId}/toggle`);
		} catch (error) {
			handleAPIError(error, "Toggle note completion");
		}
	},

	async deleteNote(noteId) {
		try {
			if (!noteId) throw new Error("Note ID is required");
			return await api.delete(`${ENDPOINTS.NOTES}/${noteId}`);
		} catch (error) {
			handleAPIError(error, "Delete note");
		}
	},

	async getNote(noteId) {
		try {
			if (!noteId) throw new Error("Note ID is required");
			return await api.get(`${ENDPOINTS.NOTES}/${noteId}`);
		} catch (error) {
			handleAPIError(error, "Get note");
		}
	},
};

export const healthAPI = {
	async checkStatus() {
		try {
			return await api.get("/health");
		} catch (error) {
			handleAPIError(error, "Health check");
		}
	},

	async getVersion() {
		try {
			return await api.get("/version");
		} catch (error) {
			handleAPIError(error, "Get API version");
		}
	},
};

export const eventLogsAPI = {
	async getEventLogs(filters = {}) {
		try {
			const params = { ...filters };
			return await api.get(ENDPOINTS.EVENT_LOGS, { params });
		} catch (error) {
			handleAPIError(error, "Get event logs");
		}
	},

	async getEventLogsByVideo(videoId, filters = {}) {
		try {
			if (!videoId) throw new Error("Video ID is required");
			const params = { videoId, ...filters };
			return await api.get(ENDPOINTS.EVENT_LOGS, { params });
		} catch (error) {
			handleAPIError(error, "Get event logs by video");
		}
	},

	async getEventLogsByType(eventType, filters = {}) {
		try {
			if (!eventType) throw new Error("Event type is required");
			const params = { eventType, ...filters };
			return await api.get(ENDPOINTS.EVENT_LOGS, { params });
		} catch (error) {
			handleAPIError(error, "Get event logs by type");
		}
	},
};

// Authentication API
export const authAPI = {
	async getGoogleAuthUrl() {
		try {
			return await api.get(`${ENDPOINTS.AUTH}/google`);
		} catch (error) {
			handleAPIError(error, "Get Google auth URL");
		}
	},

	async handleGoogleCallback(code) {
		try {
			if (!code) throw new Error("Authorization code is required");
			return await api.post(`${ENDPOINTS.AUTH}/google/callback`, { code });
		} catch (error) {
			handleAPIError(error, "Google OAuth callback");
		}
	},

	async getCurrentUser() {
		try {
			return await api.get(`${ENDPOINTS.AUTH}/me`);
		} catch (error) {
			handleAPIError(error, "Get current user");
		}
	},

	async logout() {
		try {
			return await api.post(`${ENDPOINTS.AUTH}/logout`);
		} catch (error) {
			handleAPIError(error, "Logout");
		}
	},
};

export { API_CONFIG, api as default, ENDPOINTS };
