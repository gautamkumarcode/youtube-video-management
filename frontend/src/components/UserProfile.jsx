import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const UserProfile = () => {
	const { user, logout, isLoading } = useAuth();
	const [showDropdown, setShowDropdown] = useState(false);

	const handleLogout = async () => {
		try {
			await logout();
			toast.success("Logged out successfully");
		} catch (error) {
			toast.error("Logout failed");
		}
		setShowDropdown(false);
	};

	if (!user) return null;

	return (
		<div className="relative">
			{/* Profile button */}
			<button
				onClick={() => setShowDropdown(!showDropdown)}
				className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
				<img
					src={user.picture}
					alt={user.name}
					className="w-8 h-8 rounded-full border-2 border-gray-600"
				/>
				<div className="hidden sm:block text-left">
					<p className="text-sm font-medium text-white">{user.name}</p>
					<p className="text-xs text-gray-400">{user.email}</p>
				</div>
				<svg
					className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
						showDropdown ? "rotate-180" : ""
					}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{/* Dropdown menu */}
			{showDropdown && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 z-10"
						onClick={() => setShowDropdown(false)}
					/>

					{/* Dropdown content */}
					<div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-20">
						{/* User info */}
						<div className="px-4 py-3 border-b border-gray-700">
							<div className="flex items-center space-x-3">
								<img
									src={user.picture}
									alt={user.name}
									className="w-10 h-10 rounded-full"
								/>
								<div>
									<p className="text-sm font-medium text-white">{user.name}</p>
									<p className="text-xs text-gray-400">{user.email}</p>
								</div>
							</div>
						</div>

						{/* Menu items */}
						<div className="py-2">
							<button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 flex items-center space-x-3">
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
								<span>Profile Settings</span>
							</button>

							<button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 flex items-center space-x-3">
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
								<span>Preferences</span>
							</button>

							<hr className="my-2 border-gray-700" />

							<button
								onClick={handleLogout}
								disabled={isLoading}
								className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors duration-200 flex items-center space-x-3 disabled:opacity-50">
								{isLoading ? (
									<div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
								) : (
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
										/>
									</svg>
								)}
								<span>Sign Out</span>
							</button>
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default UserProfile;
