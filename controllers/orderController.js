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

    if (
      !shop ||
      !name ||
      !phone ||
      !address ||
      !city ||
      !province ||
      !zip ||
      !variantId ||
      !quantity
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    const accessToken = await getAccessToken(shop);
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: "Access token not found",
      });
    }

    const orderPayload = {
      order: {
        financial_status: "pending", // COD
        fulfillment_status: "unfulfilled",
        send_receipt: false,
        tags: "COD",
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
        phone,
        email: null, // No email
      },
    };

    const response = await axios.post(
      `https://${shop}/admin/api/2024-04/orders.json`,
      orderPayload,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "COD order created successfully.",
      order: response.data.order,
    });
  } catch (error) {
    console.error("COD Order Error:", error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Order creation failed",
      details: error?.response?.data || error.message,
    });
  }
};

export default createCodOrder;
