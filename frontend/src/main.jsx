import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
	// Temporarily disable StrictMode to prevent OAuth callback double-execution
	// <StrictMode>
	<App />
	// </StrictMode>,
);
