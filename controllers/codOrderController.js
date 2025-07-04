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
    email,
  } = req.body;

  try {
    // Step 0: Validate Inputs
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
        message: "Missing fields in request.",
      });
    }

    // Step 1: Get Access Token
    const accessToken = await getAccessToken(shop);
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid shop token",
      });
    }

    // Step 2: Prepare customer & address
    const sanitizedPhone = phone.replace(/\D/g, "");
    const customerEmail = email?.trim() || `cod-${sanitizedPhone}@trazoonow.in`;

    const customer = {
      first_name: name,
      phone,
      email: customerEmail,
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

    // Step 3: Create Draft Order
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
          email: customerEmail,
          phone: phone,
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

    // Step 4: Complete Draft Order (convert to real order)
    let order = null;
    try {
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
      order = completeRes?.data?.order;
    } catch (completeErr) {
      console.warn("Draft may already be completed:", completeErr.message);
    }

    // Step 5: Fallback - Find Order If Not Returned in Response
    if (!order) {
      const recentOrdersRes = await axios.get(
        `https://${shop}/admin/api/2024-04/orders.json?limit=5&status=any&fields=id,order_number,order_status_url,note,tags`,
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      const matched = recentOrdersRes.data.orders.find(
        (o) => o.tags?.includes("COD") && o.note === "COD Draft Order"
      );

      if (!matched) {
        return res.status(200).json({
          success: true,
          message: "Order may have been created, but could not locate it.",
          draft_order_id: draftOrder.id,
          invoice_url: draftOrder.invoice_url,
        });
      }

      order = matched;
    }

    // ✅ Step 6: Success - Return Order Info
    return res.status(200).json({
      success: true,
      message: "COD Order placed successfully",
      order_id: order.id,
      order_number: order.order_number,
      thank_you_url: order.order_status_url,
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
