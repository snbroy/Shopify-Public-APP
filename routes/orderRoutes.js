import express from "express";
import createCodOrder from "../controllers/orderController";
const router = express.Router();

router.post("/create-cod", createCodOrder);

export default router;
