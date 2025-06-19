import { getAccessToken as fetchToken } from "../utils/shopifyOAuth.js";
import { getAccessToken, storeAccessToken } from "../models/shopModel.js";
import { getInstallUrl } from "../utils/shopifyOAuth.js";

export const installApp = (req, res) => {
  const { shop } = req.query;
  if (!shop) return res.status(400).send("Shop query param missing");

  const { installUrl } = getInstallUrl(shop);
  res.redirect(installUrl);
};

export const authCallback = async (req, res) => {
  const { shop, code } = req.query;
  if (!shop || !code)
    return res.status(400).send("Missing required parameters");

  try {
    const token = await fetchToken(shop, code);
    await storeAccessToken(shop, token);
    res.send("App successfully installed!");
  } catch (e) {
    res.status(500).send("OAuth Error: " + e.message);
  }
};
