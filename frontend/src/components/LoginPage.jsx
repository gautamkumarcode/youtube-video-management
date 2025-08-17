import { useAuth } from "../contexts/AuthContext";
import LoginButton from "./LoginButton";

const LoginPage = () => {
	const { isLoading, error } = useAuth();

	return (
		<div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
			<div className="max-w-md w-full space-y-8">
				{/* Header */}
				<div className="text-center">
					<div className="mx-auto h-16 w-16 bg-red-600 rounded-lg flex items-center justify-center mb-6">
						<svg
							className="h-10 w-10 text-white"
							fill="currentColor"
							viewBox="0 0 24 24">
							<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
						</svg>
					</div>
					<h2 className="text-3xl font-bold text-white">
						YouTube Companion Dashboard
					</h2>
					<p className="mt-2 text-sm text-gray-400">
						Manage your YouTube videos with advanced note-taking and analytics
					</p>
				</div>

				{/* Login form */}
				<div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
					<div className="text-center mb-6">
						<h3 className="text-xl font-semibold text-white mb-2">
							Sign in to get started
						</h3>
						<p className="text-gray-400 text-sm">
							Connect your Google account to access YouTube features
						</p>
					</div>

					{/* Error message */}
					{error && (
						<div className="mb-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
							<div className="flex items-center space-x-3">
								<svg
									className="w-5 h-5 text-red-400 flex-shrink-0"
									fill="currentColor"
									viewBox="0 0 20 20">
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clipRule="evenodd"
									/>
								</svg>
								<p className="text-red-300 text-sm">{error}</p>
							</div>
						</div>
					)}

					{/* Login button */}
					<div className="space-y-4">
						<LoginButton size="large" className="w-full" />
					</div>

					{/* Features list */}
					<div className="mt-6 pt-6 border-t border-gray-700">
						<p className="text-sm font-medium text-gray-300 mb-3">
							What you'll get:
						</p>
						<ul className="space-y-2 text-sm text-gray-400">
							<li className="flex items-center space-x-2">
								<svg
									className="w-4 h-4 text-green-400"
									fill="currentColor"
									viewBox="0 0 20 20">
									<path
										fillRule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clipRule="evenodd"
									/>
								</svg>
								<span>Access your YouTube videos and comments</span>
							</li>
							<li className="flex items-center space-x-2">
								<svg
									className="w-4 h-4 text-green-400"
									fill="currentColor"
									viewBox="0 0 20 20">
									<path
										fillRule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clipRule="evenodd"
									/>
								</svg>
								<span>Advanced note-taking with categories</span>
							</li>
							<li className="flex items-center space-x-2">
								<svg
									className="w-4 h-4 text-green-400"
									fill="currentColor"
									viewBox="0 0 20 20">
									<path
										fillRule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clipRule="evenodd"
									/>
								</svg>
								<span>Analytics and activity tracking</span>
							</li>
							<li className="flex items-center space-x-2">
								<svg
									className="w-4 h-4 text-green-400"
									fill="currentColor"
									viewBox="0 0 20 20">
									<path
										fillRule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clipRule="evenodd"
									/>
								</svg>
								<span>Secure data with your Google account</span>
							</li>
						</ul>
					</div>
				</div>

				{/* Privacy notice */}
				<div className="text-center text-xs text-gray-500">
					<p>
						By signing in, you agree to our terms of service. We'll only access
						the YouTube data necessary for app functionality.
					</p>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
