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

    console.log(accessToken, "acc");

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

    // Here you'd place the order using Shopify Admin API or any other system
    // For mockup:
    const response = await axios.post(
      `https://${shop}/admin/api/2024-04/orders.json`,
      {
        order: {
          financial_status: "pending", // For COD
          send_receipt: true, // Send SMS if phone is present
          phone: phone, // Used for SMS updates
          payment_gateway_names: ["cash_on_delivery"],
          customer: {
            first_name: name,
            phone: phone,
          },
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
          tags: "COD",
        },
        // order: {
        //   financial_status: "pending",
        //   send_receipt: true,
        //   email: null,
        //   phone: phone,
        //   customer: {
        //     first_name: name,
        //     phone: phone,
        //   },
        //   shipping_address: {
        //     first_name: name,
        //     address1: address,
        //     address2: landmark || "",
        //     city,
        //     province,
        //     zip,
        //     country: "India",
        //     phone: phone,
        //   },
        //   billing_address: {
        //     first_name: name,
        //     address1: address,
        //     address2: landmark || "",
        //     city,
        //     province,
        //     zip,
        //     country: "India",
        //     phone: phone,
        //   },
        //   line_items: [
        //     {
        //       variant_id: Number(variantId),
        //       quantity: Number(quantity),
        //     },
        //   ],
        //   tags: "COD",
        // },
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
