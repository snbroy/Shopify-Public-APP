import axios from "axios";
import { getAccessToken } from "../models/shopModel.js";

const isValidPhone = (phone) => {
  return /^\+?[0-9]{7,15}$/.test(phone);
};

const createCodOrder = async (req, res) => {
  try {
    const {
      shop,
      name,
      phone,
      country,
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
      !country ||
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

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format.",
      });
    }

    const accessToken = await getAccessToken(shop);
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: "Access token not found",
      });
    }

    const dummyEmail = `cod_${phone.replace(/\D/g, "")}@codly.app`;
    const fullAddress = `${address}${
      landmark ? ", " + landmark : ""
    }, ${city}, ${province} - ${zip}, ${country}`;

    const orderPayload = {
      order: {
        financial_status: "pending",
        fulfillment_status: "unfulfilled",
        send_receipt: false,
        tags: "COD",
        email: dummyEmail,
        phone: phone,
        line_items: [
          {
            variant_id: Number(variantId),
            quantity: Number(quantity),
          },
        ],
        note: "COD Order from custom form",
        note_attributes: [
          { name: "Customer Name", value: name },
          { name: "Phone", value: phone },
          { name: "Country", value: country },
          { name: "Address", value: fullAddress },
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

    const order = response.data.order;

    return res.status(200).json({
      success: true,
      message: "COD order created successfully.",
      orderId: order.id,
      orderStatusUrl: order.order_status_url,
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
