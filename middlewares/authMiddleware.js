import { ADDRESS_API_ACCESS_TOKEN } from "../utils/constants.js";

export const verifyAccessToken = (req, res, next) => {
  const token = req.headers["x-access-token"];
  if (!token || token !== ADDRESS_API_ACCESS_TOKEN) {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access" });
  }
  next();
};
