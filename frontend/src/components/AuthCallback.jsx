import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Global processing lock to prevent multiple simultaneous OAuth callbacks
let globalProcessingLock = false;

const AuthCallback = () => {
	const { handleGoogleCallback } = useAuth();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [status, setStatus] = useState("processing");
	const hasProcessed = useRef(false);

	useEffect(() => {
		// Prevent multiple executions within this component
		if (hasProcessed.current || globalProcessingLock) {
			console.log("OAuth callback already processed or in progress");
			return;
		}

		hasProcessed.current = true;
		globalProcessingLock = true;

		const processCallback = async () => {
			try {
				const code = searchParams.get("code");
				const error = searchParams.get("error");

				// Clear URL parameters immediately to prevent reuse
				window.history.replaceState(
					{},
					document.title,
					window.location.pathname
				);

				if (error) {
					setStatus("error");
					toast.error("Authentication was cancelled or failed");
					setTimeout(() => navigate("/"), 3000);
					return;
				}

				if (!code) {
					setStatus("error");
					toast.error("No authorization code received");
					setTimeout(() => navigate("/"), 3000);
					return;
				}

				const result = await handleGoogleCallback(code);

				if (result.success) {
					setStatus("success");
					toast.success(`Welcome, ${result.user.name}!`);
					setTimeout(() => navigate("/"), 1000);
				} else {
					setStatus("error");

					// Handle specific error codes
					if (
						result.error === "EXPIRED_AUTH_CODE" ||
						result.error === "CODE_ALREADY_USED"
					) {
						toast.error("Please try logging in again with a fresh session.");
						setTimeout(() => navigate("/"), 2000);
					} else {
						toast.error(result.error || "Authentication failed");
						setTimeout(() => navigate("/"), 3000);
					}
				}
			} catch (error) {
				console.error("Callback processing error:", error);
				setStatus("error");
				toast.error("Authentication processing failed");
				setTimeout(() => navigate("/"), 3000);
			} finally {
				// Always release the global lock
				globalProcessingLock = false;
			}
		};

		processCallback();
	}, []); // Empty dependency array to run only once

	const StatusIcon = ({ status }) => {
		switch (status) {
			case "processing":
				return (
					<div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
				);
			case "success":
				return (
					<div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							className="w-8 h-8 text-white"
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
					</div>
				);
			case "error":
				return (
					<div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							className="w-8 h-8 text-white"
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
					</div>
				);
			default:
				return null;
		}
	};

	const getStatusMessage = () => {
		switch (status) {
			case "processing":
				return {
					title: "Authenticating...",
					description: "Please wait while we complete your sign-in process.",
				};
			case "success":
				return {
					title: "Success!",
					description: "Authentication completed. Redirecting to dashboard...",
				};
			case "error":
				return {
					title: "Authentication Failed",
					description: "Something went wrong. Redirecting back to login...",
				};
			default:
				return {
					title: "Processing...",
					description: "Please wait...",
				};
		}
	};

	const { title, description } = getStatusMessage();

	return (
		<div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
			<div className="max-w-md w-full text-center">
				<div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
					<StatusIcon status={status} />

					<h2 className="text-2xl font-bold text-white mb-2">{title}</h2>

					<p className="text-gray-400 mb-6">{description}</p>

					{status === "processing" && (
						<div className="space-y-2">
							<div className="w-full bg-gray-700 rounded-full h-2">
								<div
									className="bg-blue-600 h-2 rounded-full animate-pulse"
									style={{ width: "60%" }}></div>
							</div>
							<p className="text-sm text-gray-500">Connecting to Google...</p>
						</div>
					)}

					{status === "error" && (
						<button
							onClick={() => navigate("/")}
							className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors duration-200">
							Back to Login
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default AuthCallback;
