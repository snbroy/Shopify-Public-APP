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

    // Validate input
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

    // Try to find customer by phone
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
                    firstName
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

      const data = searchResponse.data;

      if (data?.data?.customers?.edges?.length > 0) {
        customerId = data.data.customers.edges[0].node.id;
      }
    } catch (err) {
      console.warn(
        "Customer lookup failed (likely due to no protected data access). Continuing without customerId."
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
            customer: customerId ? { id: customerId } : undefined,
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

    const orderData = orderResponse.data.data.orderCreate;
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
