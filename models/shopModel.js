import { MongoClient } from "mongodb";
import { MONGO_URI } from "../utils/constants.js";

const client = new MongoClient(MONGO_URI);
await client.connect();
const db = client.db("shopify_app");
const shopCollection = db.collection("shops");

export const getAccessToken = async (shop) => {
  const record = await shopCollection.findOne({ shop });
  return record?.accessToken;
};

export const storeAccessToken = async (shop, accessToken) => {
  console.log(accessToken, shop, "storeAccessToken");
  const ress = await shopCollection.updateOne(
    { shop },
    { $set: { shop, accessToken } },
    { upsert: true }
  );
  console.log(ress, "ress");
  console.log(shopCollection, "shopCollection");
};
