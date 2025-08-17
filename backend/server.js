import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import eventLogRoutes from "./routes/eventLogs.js";
import noteRoutes from "./routes/notes.js";
import videoRoutes from "./routes/videos.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const initializeMiddleware = () => {
	// Configure CORS
	const corsOptions = {
		origin: [
			"http://localhost:3000",
			"http://localhost:5173",
			"http://localhost:4173",
			"https://localhost:5173",
			process.env.FRONTEND_URL,
		].filter(Boolean),
		credentials: true,
		optionsSuccessStatus: 200,
	};

	app.use(cors(corsOptions));
	app.use(express.json());

	// Debug middleware to log all requests
	app.use((req, res, next) => {
		console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
		next();
	});
};

const initializeRoutes = () => {
	// API routes with /api prefix
	app.use("/api/auth", authRoutes);
	app.use("/api/videos", videoRoutes);
	app.use("/api/notes", noteRoutes);
	app.use("/api/event-logs", eventLogRoutes);

	// Root route
	app.get("/", (req, res) => {
		res.json({
			message: "YouTube Video Management API is running!",
			status: "OK",
			timestamp: new Date().toISOString(),
		});
	});

	// Health check route
	app.get("/api/health", (req, res) => {
		res.json({
			status: "healthy",
			timestamp: new Date().toISOString(),
		});
	});

	// Catch-all for debugging missing routes
	app.use("*", (req, res) => {
		console.log(`404 - Route not found: ${req.method} ${req.path}`);
		res.status(404).json({
			success: false,
			message: `Route not found: ${req.method} ${req.path}`,
			availableRoutes: [
				"GET /",
				"GET /api/health",
				"GET /api/videos/:videoId",
				"PUT /api/videos/:videoId",
				"GET /api/videos/:videoId/comments",
				"POST /api/videos/:videoId/comments",
				"POST /api/videos/:videoId/comments/:commentId/reply",
				"DELETE /api/videos/:videoId/comments/:commentId",
				"GET /api/notes/video/:videoId",
				"POST /api/notes",
				"PUT /api/notes/:noteId",
				"DELETE /api/notes/:noteId",
				"GET /api/event-logs",
			],
		});
	});
};

const initializeErrorHandling = () => {
	app.use((err, req, res, next) => {
		console.error(err.stack);
		res.status(500).json({
			message: "Something went wrong!",
			error: process.env.NODE_ENV === "production" ? {} : err.stack,
		});
	});
};

const startServer = () => {
	app.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}`);
	});
};

const initializeApp = async () => {
	try {
		await connectDB();

		initializeMiddleware();

		initializeRoutes();

		initializeErrorHandling();

		startServer();
	} catch (error) {
		process.exit(1);
	}
};

initializeApp().catch(console.error);

export default app;
