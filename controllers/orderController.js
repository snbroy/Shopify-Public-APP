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

    // 🛠️ Dummy email to satisfy Shopify
    const dummyEmail = `cod_${phone.replace(/\D/g, "")}@codorder.local`;

    // ✅ Add customer object inline
    const orderPayload = {
      order: {
        financial_status: "pending",
        fulfillment_status: "unfulfilled",
        send_receipt: false,
        tags: "COD",
        email: dummyEmail,
        phone: phone,
        customer: {
          first_name: name,
          email: dummyEmail,
          phone: phone,
        },
        shipping_address: {
          first_name: name,
          address1: address,
          address2: landmark || "",
          city: city,
          province: province,
          zip: zip,
          country: "India",
          phone: phone,
        },
        billing_address: {
          first_name: name,
          address1: address,
          address2: landmark || "",
          city: city,
          province: province,
          zip: zip,
          country: "India",
          phone: phone,
        },
        line_items: [
          {
            variant_id: Number(variantId),
            quantity: Number(quantity),
          },
        ],
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
    const errorDetails = error?.response?.data || error.message;
    console.error("COD Order Error:", errorDetails);

    return res.status(500).json({
      success: false,
      message: "Order creation failed",
      details: errorDetails,
    });
  }
};

export default createCodOrder;
