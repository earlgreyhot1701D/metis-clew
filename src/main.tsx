import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./env-test";

createRoot(document.getElementById("root")!).render(<App />);
