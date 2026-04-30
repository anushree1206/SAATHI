import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import saathiRouter from "./saathi";
// import geminiRouter from "./gemini";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/saathi", saathiRouter);
// router.use("/gemini", geminiRouter);

export default router;
