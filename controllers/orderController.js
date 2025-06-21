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

    // Step 1: Validate input
    if (
      !shop ||
      !name ||
      !phone ||
      !address ||
      !province ||
      !city ||
      !variantId ||
      !quantity ||
      !zip
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    // Step 2: Get access token
    const accessToken = await getAccessToken(shop);
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: "Access token not found for the shop.",
      });
    }

    // Step 3: Try to find an existing customer by phone
    let customerId = null;
    try {
      const searchResponse = await axios.get(
        `https://${shop}/admin/api/2024-04/customers/search.json?query=phone:${encodeURIComponent(
          phone
        )}`,
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
          },
        }
      );

      const customers = searchResponse.data.customers;
      if (customers.length > 0) {
        customerId = customers[0].id;
      }
    } catch (err) {
      console.warn(
        "Customer search failed:",
        err?.response?.data || err.message
      );
    }

    // Step 4: Build order payload
    const orderPayload = {
      order: {
        financial_status: "pending",
        fulfillment_status: "unfulfilled",
        send_receipt: true,
        tags: "COD",
        phone: phone,
        ...(customerId
          ? { customer: { id: customerId } }
          : {
              customer: {
                first_name: name,
                phone: phone,
              },
            }),
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

    // Step 5: Send order creation request
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

    // Step 6: Respond with success
    return res.status(200).json({
      success: true,
      message: "COD order created successfully.",
      order: response.data.order,
    });
  } catch (error) {
    console.error("COD Order Error:", error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Order creation failed.",
      details: error?.response?.data || error.message,
    });
  }
};

export default createCodOrder;
