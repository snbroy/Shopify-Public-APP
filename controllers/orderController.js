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

    // Basic validation
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

    // 🛠 Generate unique dummy email from phone
    const dummyEmail = `cod_${phone.replace(/\D/g, "")}@codorder.local`;

    let customerId;

    // ✅ Step 1: Try to create the customer (safe - no phone)
    try {
      const customerRes = await axios.post(
        `https://${shop}/admin/api/2024-04/customers.json`,
        {
          customer: {
            first_name: name,
            email: dummyEmail,
            tags: "COD-Customer",
            verified_email: true,
          },
        },
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        }
      );
      customerId = customerRes.data.customer.id;
    } catch (err) {
      const msg = err?.response?.data?.errors?.email;
      if (msg && msg[0]?.includes("has already been taken")) {
        // ✅ If email already exists, get that customer ID
        const searchRes = await axios.get(
          `https://${shop}/admin/api/2024-04/customers/search.json?query=email:${dummyEmail}`,
          {
            headers: {
              "X-Shopify-Access-Token": accessToken,
            },
          }
        );
        customerId = searchRes.data.customers[0]?.id;
      } else {
        throw err;
      }
    }

    const fullAddress = `${address}${
      landmark ? ", " + landmark : ""
    }, ${city}, ${province} - ${zip}, India`;
    // ✅ Step 2: Create the actual COD order with address + phone
    const orderPayload = {
      order: {
        financial_status: "pending",
        fulfillment_status: "unfulfilled",
        send_receipt: false,
        tags: "COD",
        customer: {
          id: customerId,
        },
        email: dummyEmail,
        phone: phone,
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
        note: "COD Order from custom form",
        note_attributes: [
          {
            name: "Customer Name",
            value: name,
          },
          {
            name: "Phone",
            value: phone,
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
