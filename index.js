import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", authRoutes);

app.listen(5000, () => {
  console.log("Shopify app server running on port 5000");
});
