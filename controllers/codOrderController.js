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
    email, // optional
  } = req.body;

  try {
    // Basic field validation
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
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    const accessToken = await getAccessToken(shop);
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Access token not found or invalid shop.",
      });
    }

    const customer = {
      first_name: name,
      phone,
      ...(email && { email }),
    };

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

    // Step 1: Create Draft Order
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

    const draftOrderId = draftRes.data?.draft_order?.id;
    if (!draftOrderId) {
      throw new Error("Draft order ID not found.");
    }

    // Step 2: Complete Draft Order to place real order
    const completeRes = await axios.put(
      `https://${shop}/admin/api/2024-04/draft_orders/${draftOrderId}/complete.json`,
      {
        payment_pending: true, // Mark as COD
      },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const finalOrder = completeRes.data?.order;

    if (!finalOrder) {
      throw new Error("Failed to complete draft order.");
    }

    return res.status(200).json({
      success: true,
      message: "COD order successfully created.",
      order: finalOrder,
    });
  } catch (err) {
    console.error("COD order error:", err?.response?.data || err.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create COD order",
      error:
        err?.response?.data?.errors ||
        err?.response?.data?.error ||
        err.message,
    });
  }
};
