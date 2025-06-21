import axios from "axios";
import { getAccessToken } from "../models/shopModel.js";

const isValidPhone = (phone) => {
  // Basic validation: 7–15 digits (international format), optional +
  return /^\+?[0-9]{7,15}$/.test(phone);
};

const createCodOrder = async (req, res) => {
  try {
    const {
      shop,
      name,
      phone,
      countryCode,
      address,
      landmark,
      province,
      city,
      variantId,
      quantity,
      zip,
    } = req.body;

    // ✅ Basic validation
    if (
      !shop ||
      !name ||
      !phone ||
      !phoneCode ||
      !countryCode ||
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

    const fullPhone = phone.startsWith("+") ? phone : `${phoneCode}${phone}`;

    if (!isValidPhone(fullPhone)) {
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

    // ✅ Dummy email from phone (for uniqueness)
    const dummyEmail = `cod_${fullPhone.replace(/\D/g, "")}@codly.app`;

    // ✅ Build readable full address
    const fullAddress = `${address}${
      landmark ? ", " + landmark : ""
    }, ${city}, ${province} - ${zip}, ${countryCode}`;

    const orderPayload = {
      order: {
        financial_status: "pending", // COD
        fulfillment_status: "unfulfilled",
        send_receipt: false,
        tags: "COD",
        email: dummyEmail,
        phone: fullPhone,
        line_items: [
          {
            variant_id: Number(variantId),
            quantity: Number(quantity),
          },
        ],
        note: "COD Order from custom form",
        note_attributes: [
          {
            name: "Customer Name",
            value: name,
          },
          {
            name: "Phone",
            value: fullPhone,
          },
          {
            name: "Country Code",
            value: countryCode,
          },
          {
            name: "Address",
            value: fullAddress,
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
