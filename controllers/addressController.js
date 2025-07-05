import axios from "axios";
import { LOCATIONIQ_API_KEY } from "../utils/constants.js";

export const getAddressSuggestions = async (req, res) => {
  const query = req.query.q;

  if (!query || typeof query !== "string" || query.length < 3) {
    return res.status(400).json({
      success: false,
      message: "Query must be at least 3 characters long.",
    });
  }

  try {
    const url = `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(
      query
    )}&limit=5&dedupe=1`;

    const response = await axios.get(url);
    return res.status(200).json({ success: true, suggestions: response.data });
  } catch (err) {
    console.error("LocationIQ Error:", err?.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch address suggestions.",
    });
  }
};
