import axios from "axios";
import { getAccessToken } from "../models/shopModel.js";

const gqlCustomerSearch = async (shop, accessToken, phone) => {
  try {
    const query = `
      {
        customers(first: 1, query: "phone:${phone}") {
          edges {
            node {
              id
              firstName
              phone
            }
          }
        }
      }
    `;

    const response = await axios.post(
      `https://${shop}/admin/api/2024-04/graphql.json`,
      { query },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const customerEdges = response.data.data?.customers?.edges;
    if (customerEdges.length > 0) {
      return customerEdges[0].node.id;
    }

    return null;
  } catch (err) {
    console.error(
      "GraphQL customer search failed:",
      err?.response?.data || err.message
    );
    return null;
  }
};

const gqlCustomerCreate = async (shop, accessToken, name, phone) => {
  const mutation = `
    mutation customerCreate($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer {
          id
          phone
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const input = {
    firstName: name,
    phone: phone,
  };

  try {
    const response = await axios.post(
      `https://${shop}/admin/api/2024-04/graphql.json`,
      { query: mutation, variables: { input } },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data.data.customerCreate;

    if (result.userErrors.length > 0) {
      console.warn("Customer creation errors:", result.userErrors);
      return null;
    }

    return result.customer.id;
  } catch (error) {
    console.error(
      "Customer creation failed:",
      error.response?.data || error.message
    );
    return null;
  }
};

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

    const accessToken = await getAccessToken(shop);
    if (!accessToken) {
      return res
        .status(500)
        .json({ error: true, message: "Access token not found" });
    }

    if (
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

    let customerId = await gqlCustomerSearch(shop, accessToken, phone);

    if (!customerId) {
      customerId = await gqlCustomerCreate(shop, accessToken, name, phone);
    }

    const orderPayload = {
      order: {
        financial_status: "pending",
        send_receipt: true,
        tags: "COD",
        payment_gateway_names: ["cash_on_delivery"],
        customer: customerId ? { id: customerId } : undefined,
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
      },
    };

    const createOrderResponse = await axios.post(
      `https://${shop}/admin/api/2024-04/orders.json`,
      orderPayload,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    res
      .status(200)
      .json({ success: true, order: createOrderResponse.data.order });
  } catch (error) {
    console.error(
      "Order creation failed:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      message: "Order creation failed",
      details: error.response?.data || error.message,
    });
  }
};

export default createCodOrder;
