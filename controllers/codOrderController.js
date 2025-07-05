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
    // 1. Validate required fields
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

    // 2. Get shop access token
    const accessToken = await getAccessToken(shop);
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid shop token",
      });
    }

    // 3. Prepare customer & address data
    const sanitizedPhone = phone.replace(/\D/g, "");
    const customerEmail = email?.trim() || `cod-${sanitizedPhone}@trazoonow.in`;

    const customer = {
      first_name: name,
      phone: sanitizedPhone,
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
      phone: sanitizedPhone,
    };

    // 4. Create Draft Order
    const draftRes = await axios.post(
      `https://${shop}/admin/api/2024-04/draft_orders.json`,
      {
        draft_order: {
          line_items: [
            { variant_id: Number(variantId), quantity: Number(quantity) },
          ],
          email: customerEmail,
          phone: sanitizedPhone,
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
    if (!draftOrder?.id) {
      throw new Error("Draft order creation failed.");
    }

    // 5. Attempt to complete draft order
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
    } catch (err) {
      console.warn("Draft may already be completed:", err.message);
    }

    // 6. Fallback: Find recently created order
    console.log(shop, "shop name");
    if (!order) {
      try {
        const recentOrdersRes = await axios.get(
          `https://${shop}/admin/api/2024-04/orders.json?limit=5&status=any`,
          {
            headers: {
              "X-Shopify-Access-Token": accessToken,
              "Content-Type": "application/json",
            },
          }
        );

        console.log(JSON.stringify(recentOrdersRes.data));

        const orders = recentOrdersRes.data.orders || [];
        order = orders.find(
          (o) =>
            o.tags?.includes("COD") &&
            o.note === "COD Draft Order" &&
            o.email === customerEmail &&
            o.line_items?.some(
              (li) =>
                li.variant_id === Number(variantId) &&
                li.quantity === Number(quantity)
            )
        );
      } catch (fetchErr) {
        console.warn("Failed to fetch recent orders:", fetchErr.message);
      }
    }

    // 7. Ensure order_status_url exists
    if (order?.id && !order.order_status_url) {
      try {
        const orderByIdRes = await axios.get(
          `https://${shop}/admin/api/2024-04/orders/${order.id}.json?fields=id,order_number,order_status_url`,
          {
            headers: {
              "X-Shopify-Access-Token": accessToken,
              "Content-Type": "application/json",
            },
          }
        );
        order = orderByIdRes.data?.order;
      } catch (err) {
        console.warn("Failed to fetch order by ID:", err.message);
      }
    }

    console.log("new lo");
    console.log(JSON.stringify(order));
    // 8. Final response
    return res.status(200).json({
      success: true,
      message: "COD Order placed successfully",
      order_id: order?.id,
      order_number: order?.order_number,
      thank_you_url: order?.order_status_url || draftOrder?.invoice_url || null,
    });
  } catch (err) {
    console.error("COD Order Error:", {
      message: err.message,
      status: err?.response?.status,
      error: err?.response?.data?.errors,
    });

    return res.status(500).json({
      success: false,
      message: "Failed to create COD order",
      error: err?.response?.data?.errors || err.message,
    });
  }
};
