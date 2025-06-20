import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", authRoutes);
app.use("/api/order/", orderRoutes);

app.get("/", async (req, res) => {
  res.send("Homepage");
});

app.listen(5000, () => {
  console.log("Shopify app server running on port 5000");
});
