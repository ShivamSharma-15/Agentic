const fs = require("fs").promises;
const path = require("path");

async function loadIntentList() {
  const configPath = path.join(
    __dirname,
    "..",
    "..",
    "configs",
    "intentList.json"
  );

  try {
    const data = await fs.readFile(configPath, "utf8");
    const config = JSON.parse(data);
    return config;
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(`Error: intentList.json not found at ${configPath}`);
    } else if (err instanceof SyntaxError) {
      console.error(`Error parsing JSON from ${configPath}:`, err.message);
    } else {
      console.error(`Error reading config file ${configPath}:`, err);
    }
    throw err;
  }
}
module.exports = { loadIntentList };
