import axios from "axios";
import { LOCATIONIQ_API_KEY } from "../utils/constants.js";

export const getAddressSuggestions = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res
      .status(400)
      .json({ success: false, message: "Missing query string (q)" });
  }

  try {
    const url = `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(
      q
    )}&limit=5&dedupe=1`;

    const response = await axios.get(url);
    return res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error("LocationIQ error:", error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch address suggestions",
      error: error?.response?.data || error.message,
    });
  }
};
