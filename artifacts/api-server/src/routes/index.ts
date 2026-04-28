import { Router, type IRouter } from "express";
import healthRouter from "./health";
import saathiRouter from "./saathi";
// import geminiRouter from "./gemini";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/saathi", saathiRouter);
// router.use("/gemini", geminiRouter);

export default router;
