import axios from "axios";
import { getAccessToken } from "../models/shopModel.js";

const createCodOrderGraphql = async (req, res) => {
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
        .json({ error: true, message: "Access token missing" });
    }

    // Step 1: Search customer by phone
    const searchQuery = `
      query ($query: String!) {
        customers(first: 1, query: $query) {
          edges {
            node {
              id
              phone
            }
          }
        }
      }
    `;

    const searchResponse = await axios.post(
      `https://${shop}/admin/api/2024-04/graphql.json`,
      {
        query: searchQuery,
        variables: {
          query: `phone:${phone}`,
        },
      },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const customerEdges = searchResponse.data.data.customers.edges;
    const customerId = customerEdges.length ? customerEdges[0].node.id : null;

    // Step 2: Create order
    const orderMutation = `
      mutation orderCreate($input: OrderInput!) {
        orderCreate(input: $input) {
          order {
            id
            name
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const input = {
      lineItems: [
        {
          variantId: `gid://shopify/ProductVariant/${variantId}`,
          quantity: parseInt(quantity),
        },
      ],
      financialStatus: "PENDING",
      tags: ["COD"],
      billingAddress: {
        address1: address,
        address2: landmark || "",
        city,
        province,
        zip,
        country: "India",
        firstName: name,
        phone,
      },
      shippingAddress: {
        address1: address,
        address2: landmark || "",
        city,
        province,
        zip,
        country: "India",
        firstName: name,
        phone,
      },
      customerId: customerId || undefined,
    };

    const createResponse = await axios.post(
      `https://${shop}/admin/api/2024-04/graphql.json`,
      {
        query: orderMutation,
        variables: { input },
      },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const result = createResponse.data.data.orderCreate;

    if (result.userErrors.length) {
      return res.status(400).json({
        success: false,
        message: "Order creation error",
        errors: result.userErrors,
      });
    }

    return res.status(200).json({
      success: true,
      orderId: result.order.id,
      orderName: result.order.name,
    });
  } catch (error) {
    console.error(
      "Error placing order:",
      error?.response?.data || error.message
    );
    return res.status(500).json({
      success: false,
      message: "Server error",
      details: error?.response?.data || error.message,
    });
  }
};

export default createCodOrderGraphql;
