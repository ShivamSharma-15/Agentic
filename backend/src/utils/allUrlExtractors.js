const fs = require("fs").promises;
const path = require("path");

function extractUrls(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || []; // Return an array of URLs or an empty array if no matches
}
async function findProductByUrl(targetUrl) {
  dataArray = await loadProductList();
  return dataArray.find((item) => item.url === targetUrl);
}
async function loadProductList() {
  const configPath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "data",
    "raw",
    "items.json"
  );

  try {
    const data = await fs.readFile(configPath, "utf8");
    const config = JSON.parse(data);
    return config;
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(`Error: ProductList.json not found at ${configPath}`);
    } else if (err instanceof SyntaxError) {
      console.error(`Error parsing JSON from ${configPath}:`, err.message);
    } else {
      console.error(`Error reading config file ${configPath}:`, err);
    }
    throw err;
  }
}
module.exports = { extractUrls, findProductByUrl };
