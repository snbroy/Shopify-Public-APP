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

    const graphqlUrl = `https://${shop}/admin/api/2024-04/graphql.json`;

    // Optional: Search for existing customer by phone
    let customerId = null;
    try {
      const searchResponse = await axios.post(
        graphqlUrl,
        {
          query: `
            query ($query: String!) {
              customers(first: 1, query: $query) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          `,
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

      if (
        searchResponse.data &&
        searchResponse.data.data &&
        searchResponse.data.data.customers &&
        searchResponse.data.data.customers.edges.length > 0
      ) {
        customerId = searchResponse.data.data.customers.edges[0].node.id;
      }
    } catch (err) {
      console.warn(
        "Customer search skipped (no protected data access):",
        err.response?.data?.errors || err.message
      );
    }

    // Place the order
    const orderResponse = await axios.post(
      graphqlUrl,
      {
        query: `
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
        `,
        variables: {
          input: {
            lineItems: [
              {
                variantId: `gid://shopify/ProductVariant/${variantId}`,
                quantity: parseInt(quantity),
              },
            ],
            financialStatus: "PENDING",
            paymentGatewayNames: ["cash_on_delivery"],
            tags: ["COD"],
            ...(customerId && { customer: { id: customerId } }),
            shippingAddress: {
              firstName: name,
              address1: address,
              address2: landmark || "",
              city,
              province,
              zip,
              country: "India",
              phone,
            },
            billingAddress: {
              firstName: name,
              address1: address,
              address2: landmark || "",
              city,
              province,
              zip,
              country: "India",
              phone,
            },
          },
        },
      },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const responseData = orderResponse.data;

    // Handle GraphQL errors
    if (responseData.errors) {
      return res.status(400).json({
        success: false,
        message: "GraphQL error",
        errors: responseData.errors,
      });
    }

    const orderData = responseData.data?.orderCreate;
    if (!orderData) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Order creation failed: no orderCreate response.",
        });
    }

    if (orderData.userErrors?.length) {
      return res
        .status(400)
        .json({ success: false, errors: orderData.userErrors });
    }

    res.status(200).json({ success: true, order: orderData.order });
  } catch (error) {
    console.error("Error placing order:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
  }
};

export default createCodOrder;
