import crypto from "crypto";
import querystring from "querystring";
import {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_REDIRECT_URI,
  SHOPIFY_SCOPES,
} from "./constants.js";

export const getInstallUrl = (shop) => {
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
};

export const getAccessToken = async (shop, code) => {
  const axios = await import("axios").then((mod) => mod.default);
  const result = await axios.post(`https://${shop}/admin/oauth/access_token`, {
    client_id: SHOPIFY_API_KEY,
    client_secret: SHOPIFY_API_SECRET,
    code,
  });

  return result.data.access_token;
};
