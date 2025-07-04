import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import codOrderRoutes from "./routes/codOrderRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", authRoutes);
app.use("/api/order/", orderRoutes);

app.use("/api/cod-order", codOrderRoutes);

// Serve widget JS
app.get("/cod-popup.js", (req, res) => {
  res.sendFile(path.join(__dirname, "views/codPopupWidget.js"));
});

app.get("/", async (req, res) => {
  res.send("Homepage");
});

app.listen(5000, () => {
  console.log("Shopify app server running on port 5000");
});
