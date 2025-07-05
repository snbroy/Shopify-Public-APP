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
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    // 2. Get shop access token
    const accessToken = await getAccessToken(shop);
    if (!accessToken) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid shop token" });
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

    // 5. Complete draft order
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
    } catch (err) {
      console.warn("Draft may already be completed:", err.message);
    }

    // 6. Get customer using email to fetch their orders
    let order = null;
    try {
      const customerSearchRes = await axios.get(
        `https://${shop}/admin/api/2024-04/customers/search.json?query=email:${encodeURIComponent(
          customerEmail
        )}`,
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      const customerObj = customerSearchRes.data?.customers?.[0];
      if (customerObj?.id) {
        const customerId = customerObj.id;

        const customerOrdersRes = await axios.get(
          `https://${shop}/admin/api/2024-04/customers/${customerId}/orders.json?limit=1&status=any&order=created_at desc`,
          {
            headers: {
              "X-Shopify-Access-Token": accessToken,
              "Content-Type": "application/json",
            },
          }
        );

        order = customerOrdersRes.data.orders?.[0];
      }
    } catch (err) {
      console.warn("Customer fetch or order lookup failed:", err.message);
    }

    // 7. Final fallback to draft invoice if no order
    return res.status(200).json({
      success: true,
      message: "COD Order placed successfully",
      order_id: order?.id || null,
      order_number: order?.order_number || null,
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
