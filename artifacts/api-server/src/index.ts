import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

console.log("Environment variables loaded:", {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "SET" : "NOT SET",
  DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
});

const { default: app } = await import("./app");
const { logger } = await import("./lib/logger");

const port = Number(process.env["PORT"] || "3000");

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
