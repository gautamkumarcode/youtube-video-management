import { Toaster } from "react-hot-toast";
import {
	Navigate,
	Route,
	BrowserRouter as Router,
	Routes,
} from "react-router-dom";
import "./App.css";
import AuthCallback from "./components/AuthCallback";
import Dashboard from "./components/Dashboard";
import LoginPage from "./components/LoginPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// App configuration
const APP_CONFIG = {
	TOAST: {
		POSITION: "top-right",
		DURATION: 4000,
		STYLE: {
			background: "#1f1f1f",
			color: "#fff",
			borderRadius: "8px",
			border: "1px solid #383838",
		},
	},
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-white">Loading...</p>
				</div>
			</div>
		);
	}

	return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route component (redirect to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-white">Loading...</p>
				</div>
			</div>
		);
	}

	return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// Main App Router
const AppRouter = () => {
	return (
		<Router>
			<Routes>
				{/* Public routes */}
				<Route
					path="/login"
					element={
						<PublicRoute>
							<LoginPage />
						</PublicRoute>
					}
				/>

				<Route path="/auth/callback" element={<AuthCallback />} />

				{/* Protected routes */}
				<Route
					path="/dashboard"
					element={
						<ProtectedRoute>
							<Dashboard />
						</ProtectedRoute>
					}
				/>

				{/* Default redirect */}
				<Route path="/" element={<Navigate to="/dashboard" replace />} />

				{/* Catch all - redirect to dashboard */}
				<Route path="*" element={<Navigate to="/dashboard" replace />} />
			</Routes>
		</Router>
	);
};

// Main App component
const App = () => {
	return (
		<div className="App">
			<AuthProvider>
				<AppRouter />
				<Toaster
					position={APP_CONFIG.TOAST.POSITION}
					toastOptions={{
						duration: APP_CONFIG.TOAST.DURATION,
						style: APP_CONFIG.TOAST.STYLE,
					}}
				/>
			</AuthProvider>
		</div>
	);
};

export default App;
