import express from "express";
import { placeCodOrder } from "../controllers/codOrderController";
// import { placeCodOrder } from "../controllers/codOrderController.js";

const router = express.Router();

router.post("/place", placeCodOrder);

export default router;
