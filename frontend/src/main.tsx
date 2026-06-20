import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import App from "./App";
import "./index.css";

// Wire up auth token injection for all API calls
setAuthTokenGetter(getAuthToken);

createRoot(document.getElementById("root")!).render(<App />);
