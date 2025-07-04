import axios from "axios";
import { getAccessToken } from "../models/shopModel.js";

export const placeCodOrder = async (req, res) => {
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

  try {
    // Validate input
    if (
      !shop ||
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
        .json({ success: false, message: "Missing fields." });
    }

    // Get access token
    const accessToken = await getAccessToken(shop);
    if (!accessToken) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid shop token" });
    }

    // Build customer & address objects
    const customer = { first_name: name, phone };
    const addressObj = {
      first_name: name,
      address1: address,
      address2: landmark || "",
      city,
      province,
      zip,
      country: "India",
      phone,
    };

    // 1. Create Draft Order
    const draftRes = await axios.post(
      `https://${shop}/admin/api/2024-04/draft_orders.json`,
      {
        draft_order: {
          line_items: [
            {
              variant_id: Number(variantId),
              quantity: Number(quantity),
            },
          ],
          customer,
          shipping_address: addressObj,
          billing_address: addressObj,
          tags: "COD",
          note: "COD Draft Order",
          use_customer_default_address: false,
        },
      },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const draftOrder = draftRes.data?.draft_order;
    if (!draftOrder || !draftOrder.id) {
      throw new Error("Draft order creation failed.");
    }

    if (draftOrder.status !== "open") {
      throw new Error(`Draft order not open. Status: ${draftOrder.status}`);
    }

    // 2. Complete the Draft Order
    const completeRes = await axios.put(
      `https://${shop}/admin/api/2024-04/draft_orders/${draftOrder.id}/complete.json`,
      { payment_pending: true },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const order = completeRes.data?.order;
    if (!order) {
      console.error("Draft completion failed:", completeRes.data);
      throw new Error("Failed to complete draft order.");
    }

    return res.status(200).json({
      success: true,
      message: "COD Order placed successfully",
      order,
    });
  } catch (err) {
    console.error("COD Order Error:", err?.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create COD order",
      error: err?.response?.data?.errors || err.message,
    });
  }
};
