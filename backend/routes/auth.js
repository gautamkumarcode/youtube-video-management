import dotenv from "dotenv";
import express from "express";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import TokenManager from "../utils/TokenManager.js";

dotenv.config();

const router = express.Router();

// Store used authorization codes to prevent reuse
const usedAuthCodes = new Set();

// OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
	process.env.YOUTUBE_CLIENT_ID,
	process.env.YOUTUBE_CLIENT_SECRET,
	process.env.YOUTUBE_REDIRECT_URI
);

// Required scopes for YouTube management
const scopes = [
	"https://www.googleapis.com/auth/youtube", // Full YouTube access (read and write)
	"https://www.googleapis.com/auth/userinfo.profile",
	"https://www.googleapis.com/auth/userinfo.email",
];

// Generate JWT token
const generateToken = (user) => {
	return jwt.sign(
		{
			id: user.id,
			email: user.email,
			name: user.name,
			picture: user.picture,
		},
		process.env.JWT_SECRET || "your-secret-key",
		{ expiresIn: "7d" }
	);
};

// @route   GET /api/auth/google
// @desc    Get Google OAuth URL
// @access  Public
router.get("/google", (req, res) => {
	try {
		const authUrl = oauth2Client.generateAuthUrl({
			access_type: "offline",
			scope: scopes,
			prompt: "consent select_account", // Forces consent screen and account selection
			include_granted_scopes: false, // Don't include previously granted scopes
		});

		res.json({
			success: true,
			data: {
				authUrl,
				message: "Redirect user to this URL for authentication",
			},
		});
	} catch (error) {
		console.error("Error generating Google OAuth URL:", error);
		res.status(500).json({
			success: false,
			message: "Failed to generate authentication URL",
			error: error.message,
		});
	}
});

// @route   POST /api/auth/google/callback
// @desc    Handle Google OAuth callback
// @access  Public
router.post("/google/callback", async (req, res) => {
	try {
		const { code } = req.body;

		if (!code) {
			return res.status(400).json({
				success: false,
				message: "Authorization code is required",
			});
		}

		// Check if this authorization code has already been used
		if (usedAuthCodes.has(code)) {
			console.log(
				"🚫 Authorization code already used:",
				code.substring(0, 20) + "..."
			);
			return res.status(400).json({
				success: false,
				message:
					"Authorization code has already been used. Please try logging in again.",
				error: "CODE_ALREADY_USED",
			});
		}

		// Mark this code as used
		usedAuthCodes.add(code);

		// Clean up old codes periodically (keep last 100 to prevent memory issues)
		if (usedAuthCodes.size > 100) {
			const codesArray = Array.from(usedAuthCodes);
			usedAuthCodes.clear();
			// Keep the most recent 50
			codesArray.slice(-50).forEach((c) => usedAuthCodes.add(c));
		}

		console.log(
			"📝 Received authorization code:",
			code.substring(0, 20) + "..."
		);
		console.log("🔧 OAuth2 Client Config:", {
			clientId: process.env.YOUTUBE_CLIENT_ID?.substring(0, 20) + "...",
			redirectUri: process.env.YOUTUBE_REDIRECT_URI,
		});

		// Exchange authorization code for tokens
		let tokens;
		try {
			const tokenResponse = await oauth2Client.getToken(code);
			tokens = tokenResponse.tokens;
			oauth2Client.setCredentials(tokens);
		} catch (tokenError) {
			console.error("Token exchange error:", tokenError.message);

			// Remove the code from used set since it failed - allow retry with fresh code
			usedAuthCodes.delete(code);

			// Handle specific invalid_grant error
			if (tokenError.message.includes("invalid_grant")) {
				return res.status(400).json({
					success: false,
					message:
						"Authorization code has expired or been used. Please try logging in again.",
					error: "EXPIRED_AUTH_CODE",
				});
			}

			// Handle other token errors
			return res.status(400).json({
				success: false,
				message: "Failed to exchange authorization code for tokens",
				error: tokenError.message,
			});
		}

		// Get user profile information
		const oauth2 = google.oauth2({
			auth: oauth2Client,
			version: "v2",
		});

		const userInfo = await oauth2.userinfo.get();
		const user = userInfo.data;

		// Generate JWT token for our application
		const token = generateToken({
			id: user.id,
			email: user.email,
			name: user.name,
			picture: user.picture,
		});

		// Store tokens securely (in production, store in database)
		const userSession = {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				picture: user.picture,
			},
			tokens: {
				access_token: tokens.access_token,
				refresh_token: tokens.refresh_token,
				expiry_date: tokens.expiry_date,
			},
			authenticated: true,
			createdAt: new Date().toISOString(),
		};

		// Store YouTube tokens for API usage
		const tokensSaved = TokenManager.saveTokens({
			access_token: tokens.access_token,
			refresh_token: tokens.refresh_token,
			expiry_date: tokens.expiry_date,
			scope: "https://www.googleapis.com/auth/youtube", // Current scope
		});

		if (!tokensSaved) {
			console.warn("⚠️ Warning: Failed to persist YouTube tokens");
		}

		// In production, store this in your database
		// For now, we'll include it in the response for frontend to handle
		res.json({
			success: true,
			data: {
				user: userSession.user,
				token,
				message: "Authentication successful - YouTube API access enabled",
			},
		});
	} catch (error) {
		console.error("Google OAuth callback error:", error);

		// Remove the code from used set since processing failed
		if (req.body.code) {
			usedAuthCodes.delete(req.body.code);
		}

		res.status(500).json({
			success: false,
			message: "Authentication failed",
			error: error.message,
		});
	}
});

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get("/me", authenticateToken, (req, res) => {
	res.json({
		success: true,
		data: {
			user: req.user,
		},
	});
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post("/logout", authenticateToken, async (req, res) => {
	try {
		// Clear YouTube tokens on logout
		TokenManager.clearTokens();

		// In production, you might want to blacklist the token
		// or remove it from your database

		res.json({
			success: true,
			data: {
				message: "Logged out successfully",
			},
		});
	} catch (error) {
		console.error("Logout error:", error);
		res.status(500).json({
			success: false,
			message: "Logout failed",
			error: error.message,
		});
	}
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

	if (!token) {
		return res.status(401).json({
			success: false,
			message: "Access token required",
		});
	}

	jwt.verify(
		token,
		process.env.JWT_SECRET || "your-secret-key",
		(err, user) => {
			if (err) {
				return res.status(403).json({
					success: false,
					message: "Invalid or expired token",
				});
			}
			req.user = user;
			next();
		}
	);
}

// @route   GET /api/auth/token-debug
// @desc    Debug current token status
// @access  Private
router.get("/token-debug", authenticateToken, async (req, res) => {
	try {
		const tokenStatus = TokenManager.getTokenStatus();

		res.json({
			success: true,
			data: {
				...tokenStatus,
				message: tokenStatus.hasTokens
					? "YouTube tokens are available"
					: "No YouTube tokens found - please login",
			},
		});
	} catch (error) {
		console.error("Token debug error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to debug tokens",
			error: error.message,
		});
	}
});

export default router;
export { authenticateToken };
