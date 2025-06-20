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
        .json({ error: true, message: "accestoken is not found" });
    }

    // Here you'd place the order using Shopify Admin API or any other system
    // For mockup:
    const response = await axios.post(
      `https://${shop}/admin/api/2024-04/orders.json`,
      {
        order: {
          line_items: [
            {
              variant_id: variantId,
              quantity: quantity,
            },
          ],
          customer: {
            first_name: name,
            phone,
          },
          shipping_address: {
            address1: address,
            address2: landmark,
            city,
            province,
            zip,
            country: "India",
          },
          financial_status: "pending",
          fulfillment_status: "unfulfilled",
          tags: "COD",
        },
      },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({ success: true, order: response.data.order });
  } catch (error) {
    console.error("COD Order Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default createCodOrder;
