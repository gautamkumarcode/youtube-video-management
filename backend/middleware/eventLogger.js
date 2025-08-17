import EventLog from "../models/EventLog.js";

const DEFAULT_EVENT_DATA = {
	videoId: null,
	commentId: null,
	noteId: null,
	details: {},
	success: true,
	errorMessage: null,
};

const extractClientInfo = (req) => {
	if (!req) return {};

	// Extract raw IP address
	let rawIp =
		req.ip ||
		req.connection?.remoteAddress ||
		req.socket?.remoteAddress ||
		req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
		"";

	// Clean and normalize IP address for validation
	let cleanIp = "";
	if (rawIp) {
		// Remove IPv6 prefix for IPv4 mapped addresses
		if (rawIp.startsWith("::ffff:")) {
			cleanIp = rawIp.substring(7);
		}
		// Convert IPv6 localhost to IPv4 localhost
		else if (rawIp === "::1") {
			cleanIp = "127.0.0.1";
		}
		// For other IPv6 addresses, use localhost fallback for development
		else if (rawIp.includes(":")) {
			cleanIp = "127.0.0.1";
		}
		// IPv4 addresses pass through
		else {
			cleanIp = rawIp;
		}
	}

	// Final fallback for development
	if (!cleanIp) {
		cleanIp = "127.0.0.1";
	}

	return {
		userAgent: req.get("User-Agent") || "",
		ipAddress: cleanIp,
	};
};

const createEventData = (eventType, options = {}, req = null) => {
	const baseData = {
		eventType,
		...DEFAULT_EVENT_DATA,
		...options,
	};

	const clientInfo = extractClientInfo(req);
	return { ...baseData, ...clientInfo };
};

const logEvent = async (eventType, options = {}, req = null) => {
	try {
		const eventData = createEventData(eventType, options, req);
		const eventLog = EventLog.createLog(eventData);

		await eventLog.save();

		const logMessage = `Event logged: ${eventType}`;
		const logDetails = {
			videoId: eventData.videoId,
			commentId: eventData.commentId,
			noteId: eventData.noteId,
			success: eventData.success,
		};

		console.log(logMessage, logDetails);

		return eventLog;
	} catch (error) {
		console.error("Failed to log event:", {
			eventType,
			error: error.message,
			options,
		});
		throw error;
	}
};

const determineEventSuccess = (statusCode) => {
	return statusCode >= 200 && statusCode < 400;
};

const extractRequestDetails = (req, res) => ({
	method: req.method,
	url: req.originalUrl,
	statusCode: res.statusCode,
	requestBody: req.body,
	query: req.query,
	headers: {
		contentType: req.get("Content-Type"),
		authorization: req.get("Authorization") ? "[REDACTED]" : undefined,
	},
});

const extractResourceIds = (req) => ({
	videoId: req.params.videoId || req.body.videoId || req.query.videoId,
	commentId: req.params.commentId || req.body.commentId || req.query.commentId,
	noteId: req.params.noteId || req.body.noteId || req.query.noteId,
});

const formatErrorMessage = (data, isSuccess) => {
	if (isSuccess) return null;

	if (typeof data === "string") return data;
	if (typeof data === "object" && data.message) return data.message;

	try {
		return JSON.stringify(data);
	} catch {
		return "Unknown error occurred";
	}
};

const eventLogger = (eventType) => {
	if (!eventType) {
		throw new Error("Event type is required for event logger middleware");
	}

	return (req, res, next) => {
		const originalSend = res.send.bind(res);
		const startTime = Date.now();

		res.send = function (data) {
			const endTime = Date.now();
			const duration = endTime - startTime;
			const isSuccess = determineEventSuccess(res.statusCode);

			const requestDetails = extractRequestDetails(req, res);
			const resourceIds = extractResourceIds(req);
			const errorMessage = formatErrorMessage(data, isSuccess);

			const eventOptions = {
				...resourceIds,
				details: { ...requestDetails, duration },
				success: isSuccess,
				errorMessage,
				duration,
			};

			logEvent(eventType, eventOptions, req).catch((error) => {
				console.error("Event logging failed in middleware:", error.message);
			});

			return originalSend(data);
		};

		next();
	};
};

const asyncLogEvent = (eventType, options, req) => {
	return logEvent(eventType, options, req).catch((error) => {
		console.error("Async event logging failed:", error.message);
	});
};

export {
	asyncLogEvent,
	createEventData,
	eventLogger,
	extractClientInfo,
	logEvent,
};
