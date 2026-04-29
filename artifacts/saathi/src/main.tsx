import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Configure API client to use environment variable
setBaseUrl(import.meta.env.VITE_API_URL || "http://localhost:3000");

createRoot(document.getElementById("root")!).render(<App />);
