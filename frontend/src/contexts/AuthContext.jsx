import { createContext, useContext, useEffect, useReducer } from "react";
import { authAPI } from "../services/api";

// Auth context
const AuthContext = createContext();

// Auth actions
const AUTH_ACTIONS = {
	INIT_AUTH: "INIT_AUTH",
	LOGIN_START: "LOGIN_START",
	LOGIN_SUCCESS: "LOGIN_SUCCESS",
	LOGIN_FAILURE: "LOGIN_FAILURE",
	LOGOUT: "LOGOUT",
	SET_LOADING: "SET_LOADING",
};

// Initial state
const initialState = {
	user: null,
	token: null,
	isAuthenticated: false,
	isLoading: true,
	error: null,
};

// Auth reducer
const authReducer = (state, action) => {
	switch (action.type) {
		case AUTH_ACTIONS.INIT_AUTH:
			return {
				...state,
				isLoading: false,
			};
		case AUTH_ACTIONS.LOGIN_START:
			return {
				...state,
				isLoading: true,
				error: null,
			};
		case AUTH_ACTIONS.LOGIN_SUCCESS:
			return {
				...state,
				user: action.payload.user,
				token: action.payload.token,
				isAuthenticated: true,
				isLoading: false,
				error: null,
			};
		case AUTH_ACTIONS.LOGIN_FAILURE:
			return {
				...state,
				user: null,
				token: null,
				isAuthenticated: false,
				isLoading: false,
				error: action.payload.error,
			};
		case AUTH_ACTIONS.LOGOUT:
			return {
				...state,
				user: null,
				token: null,
				isAuthenticated: false,
				error: null,
			};
		case AUTH_ACTIONS.SET_LOADING:
			return {
				...state,
				isLoading: action.payload.isLoading,
			};
		default:
			return state;
	}
};

// Auth provider component
export const AuthProvider = ({ children }) => {
	const [state, dispatch] = useReducer(authReducer, initialState);

	// Initialize auth on app startup
	useEffect(() => {
		initializeAuth();
	}, []);

	const initializeAuth = async () => {
		try {
			const storedToken = localStorage.getItem("auth_token");
			const storedUser = localStorage.getItem("auth_user");

			if (storedToken && storedUser) {
				// Set token in axios defaults
				setAuthToken(storedToken);

				// Verify token is still valid
				try {
					const response = await authAPI.getCurrentUser();
					if (response.data.success) {
						dispatch({
							type: AUTH_ACTIONS.LOGIN_SUCCESS,
							payload: {
								user: JSON.parse(storedUser),
								token: storedToken,
							},
						});
						return;
					}
				} catch (error) {
					// Token is invalid, clear storage
					clearAuthData();
				}
			}
		} catch (error) {
			console.error("Auth initialization error:", error);
		} finally {
			dispatch({ type: AUTH_ACTIONS.INIT_AUTH });
		}
	};

	const loginWithGoogle = async () => {
		try {
			dispatch({ type: AUTH_ACTIONS.LOGIN_START });

			// Get Google OAuth URL
			const response = await authAPI.getGoogleAuthUrl();
			if (response.data.success) {
				// Redirect to Google OAuth
				window.location.href = response.data.data.authUrl;
			}
		} catch (error) {
			dispatch({
				type: AUTH_ACTIONS.LOGIN_FAILURE,
				payload: { error: error.message },
			});
		}
	};

	const handleGoogleCallback = async (code) => {
		try {
			dispatch({ type: AUTH_ACTIONS.LOGIN_START });

			const response = await authAPI.handleGoogleCallback(code);
			if (response.data.success) {
				const { user, token } = response.data.data;

				// Store in localStorage
				localStorage.setItem("auth_token", token);
				localStorage.setItem("auth_user", JSON.stringify(user));

				// Set token in axios defaults
				setAuthToken(token);

				dispatch({
					type: AUTH_ACTIONS.LOGIN_SUCCESS,
					payload: { user, token },
				});

				return { success: true, user };
			} else {
				// Handle backend error response
				const errorMessage = response.data.message || "Authentication failed";
				const errorCode = response.data.error;

				dispatch({
					type: AUTH_ACTIONS.LOGIN_FAILURE,
					payload: { error: errorMessage },
				});

				return { success: false, error: errorCode || errorMessage };
			}
		} catch (error) {
			// Handle network or other errors
			let errorMessage = "Authentication failed";
			let errorCode = null;

			if (error.response?.data?.message) {
				errorMessage = error.response.data.message;
				errorCode = error.response.data.error;
			} else if (error.message) {
				errorMessage = error.message;
			}

			dispatch({
				type: AUTH_ACTIONS.LOGIN_FAILURE,
				payload: { error: errorMessage },
			});

			return { success: false, error: errorCode || errorMessage };
		}
	};

	const logout = async () => {
		try {
			await authAPI.logout();
		} catch (error) {
			console.error("Logout API error:", error);
		} finally {
			clearAuthData();
			dispatch({ type: AUTH_ACTIONS.LOGOUT });
		}
	};

	const clearAuthData = () => {
		localStorage.removeItem("auth_token");
		localStorage.removeItem("auth_user");
		setAuthToken(null);
	};

	const setAuthToken = (token) => {
		if (token) {
			// Set default authorization header for all requests
			import("../services/api").then(({ default: api }) => {
				api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
			});
		} else {
			// Remove authorization header
			import("../services/api").then(({ default: api }) => {
				delete api.defaults.headers.common["Authorization"];
			});
		}
	};

	const value = {
		...state,
		loginWithGoogle,
		handleGoogleCallback,
		logout,
		clearAuthData,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export default AuthContext;
