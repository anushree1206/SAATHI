export const config = {
  port: Number(process.env.PORT ?? "3000"),
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  mongoUrl: process.env.MONGO_URL ?? "mongodb://127.0.0.1:27017/saathi",
  mongoDbName: process.env.MONGO_DB_NAME ?? "saathi",
  jwtSecret: process.env.JWT_SECRET ?? "change-this-secret-in-production",
  allowedOrigins: process.env.ALLOWED_ORIGINS ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development",
  logLevel: process.env.LOG_LEVEL ?? "info",
};
