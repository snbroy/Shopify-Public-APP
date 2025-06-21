import axios from "axios";
import { getAccessToken } from "../models/shopModel.js";

const createCodOrder = async (req, res) => {
  try {
    const {
      shop,
      name,
      phone,
      address,
      landmark,
      province,
      city,
      variantId,
      quantity,
      zip,
    } = req.body;

    const accessToken = await getAccessToken(shop);
    if (!accessToken) {
      return res
        .status(500)
        .json({ error: true, message: "Access token not found" });
    }

    if (
      !variantId ||
      !quantity ||
      !name ||
      !phone ||
      !address ||
      !city ||
      !province ||
      !zip
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    const response = await axios.post(
      `https://${shop}/admin/api/2024-04/orders.json`,
      {
        order: {
          financial_status: "pending",
          send_receipt: true,
          phone: phone,
          shipping_address: {
            first_name: name,
            address1: address,
            address2: landmark || "",
            city,
            province,
            zip,
            country: "India",
            phone,
          },
          billing_address: {
            first_name: name,
            address1: address,
            address2: landmark || "",
            city,
            province,
            zip,
            country: "India",
            phone,
          },
          line_items: [
            {
              variant_id: Number(variantId),
              quantity: Number(quantity),
            },
          ],
          tags: "COD",
        },
      },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({ success: true, order: response.data.order });
  } catch (error) {
    console.error("COD Order Error:", error?.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Order creation failed",
      details: error?.response?.data || error.message,
    });
  }
};

export default createCodOrder;
