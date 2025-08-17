import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple token storage using a JSON file
const TOKEN_FILE = path.join(__dirname, "..", "youtube-tokens.json");

export class TokenManager {
	static saveTokens(tokens) {
		try {
			// Validate tokens before saving
			if (!tokens || !tokens.access_token) {
				console.warn("⚠️ Cannot save tokens: missing access token");
				return false;
			}

			const tokenData = {
				access_token: tokens.access_token,
				refresh_token: tokens.refresh_token,
				expiry_date: tokens.expiry_date,
				saved_at: new Date().toISOString(),
				scopes: tokens.scope || "unknown",
			};

			// Save to file
			fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData, null, 2));

			// Also set in environment for immediate use
			process.env.YOUTUBE_ACCESS_TOKEN = tokens.access_token;
			process.env.YOUTUBE_REFRESH_TOKEN = tokens.refresh_token;

			console.log("✅ YouTube tokens saved successfully");
			console.log(
				"📍 Token preview:",
				tokens.access_token?.substring(0, 30) + "..."
			);

			return true;
		} catch (error) {
			console.error("❌ Failed to save tokens:", error.message);
			return false;
		}
	}

	static loadTokens() {
		try {
			if (fs.existsSync(TOKEN_FILE)) {
				const tokenData = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));

				// Set in environment variables
				if (tokenData.access_token && tokenData.refresh_token) {
					process.env.YOUTUBE_ACCESS_TOKEN = tokenData.access_token;
					process.env.YOUTUBE_REFRESH_TOKEN = tokenData.refresh_token;

					console.log("✅ YouTube tokens loaded from file");
					console.log("📅 Token saved at:", tokenData.saved_at);

					return tokenData;
				}
			}

			console.log("⚠️ No saved YouTube tokens found");
			return null;
		} catch (error) {
			console.error("❌ Failed to load tokens:", error.message);
			return null;
		}
	}

	static clearTokens() {
		try {
			if (fs.existsSync(TOKEN_FILE)) {
				fs.unlinkSync(TOKEN_FILE);
			}

			// Clear from environment
			process.env.YOUTUBE_ACCESS_TOKEN = "";
			process.env.YOUTUBE_REFRESH_TOKEN = "";

			console.log("🧹 YouTube tokens cleared");
			return true;
		} catch (error) {
			console.error("❌ Failed to clear tokens:", error.message);
			return false;
		}
	}

	static hasTokens() {
		return !!(
			process.env.YOUTUBE_ACCESS_TOKEN && process.env.YOUTUBE_REFRESH_TOKEN
		);
	}

	static getTokenStatus() {
		const hasTokens = this.hasTokens();
		let fileInfo = null;

		try {
			if (fs.existsSync(TOKEN_FILE)) {
				const tokenData = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
				fileInfo = {
					saved_at: tokenData.saved_at,
					scopes: tokenData.scopes,
					has_refresh_token: !!tokenData.refresh_token,
				};
			}
		} catch (error) {
			console.error("Error reading token file:", error.message);
		}

		return {
			hasTokens,
			memoryTokens: {
				access_token_length: process.env.YOUTUBE_ACCESS_TOKEN?.length || 0,
				refresh_token_length: process.env.YOUTUBE_REFRESH_TOKEN?.length || 0,
			},
			fileInfo,
		};
	}
}

export default TokenManager;
