// services/shopifyService.js

import axios from "axios";
import querystring from "querystring";
import crypto from "crypto";
import { storeAccessToken } from "../models/db.js";
import {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_REDIRECT_URI,
  SHOPIFY_SCOPES,
} from "../utils/constants.js";

export function generateInstallUrl(shop) {
  const state = crypto.randomBytes(16).toString("hex");
  const installUrl =
    `https://${shop}/admin/oauth/authorize?` +
    querystring.stringify({
      client_id: SHOPIFY_API_KEY,
      scope: SHOPIFY_SCOPES,
      redirect_uri: SHOPIFY_REDIRECT_URI,
      state,
    });
  return { installUrl, state };
}

export async function exchangeToken(shop, code) {
  const tokenUrl = `https://${shop}/admin/oauth/access_token`;

  const response = await axios.post(tokenUrl, {
    client_id: SHOPIFY_API_KEY,
    client_secret: SHOPIFY_API_SECRET,
    code,
  });

  const accessToken = response.data.access_token;

  // Store token in DB
  await storeAccessToken(shop, accessToken);
  return accessToken;
}

export function verifyHmac(query) {
  const { hmac, ...rest } = query;
  const message = querystring.stringify(rest);
  const generatedHash = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(message)
    .digest("hex");

  return generatedHash === hmac;
}
