import { getAccessToken as fetchToken } from "../utils/shopifyOAuth.js";
import { getAccessToken, storeAccessToken } from "../models/shopModel.js";
import { getInstallUrl } from "../utils/shopifyOAuth.js";
import { SHOPIFY_API_KEY } from "../utils/constants.js";

export const installApp = (req, res) => {
  const { shop } = req.query;
  if (!shop) return res.status(400).send("Shop query param missing");

  const { installUrl } = getInstallUrl(shop);
  res.redirect(installUrl);
};

export const authCallback = async (req, res) => {
  console.log(req.query, "req query");
  const { shop, code } = req.query;
  if (!shop || !code)
    return res.status(400).send("Missing required parameters");

  try {
    const accessToken = await fetchToken(shop, code);
    console.log(accessToken, "Token");
    await storeAccessToken(shop, accessToken);
    console.log("App successfully installed!");
    return res.redirect(`https://${shop}/admin/apps/${SHOPIFY_API_KEY}`);
    res.send("App successfully installed!");
  } catch (e) {
    res.status(500).send("OAuth Error: " + e.message);
  }
};
