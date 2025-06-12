const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const { loadProductList } = require("../utils/getProductList");
const { getBracketedCsv } = require("../utils/processString");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = "gemini-1.5-flash";

const productClassifier = async function (query, history) {
  const productListString = await generateProductListString();
  const model = genAI.getGenerativeModel({ model: MODEL });
  const prompt = `
You are a simple product classifier for a furniture store chatbot. Your job is to match the available product list.

Chat History of the user (past 7 messages):
${history}

Consider the above history as well when deciding what is being talked about, for example if above there is product: bed, and the next message is not clear on what product, the bed is the product

Classify the user's search into one of these products:

${productListString}

Please keep in mind common synonyms and interchangeably used terms for above products. Also if the request is for a purpose match that with suitable product too, for example: "I need calling device", product response shoud be either [mobile] or [phone] based on other details of the query. Respond with just one Product that matches for the search and put it between square brackets. example: [bed]
Use [null] when no product matches. Do not use any other words please.

Query: "${query}"
Product:
`;

  const result = await model.generateContent(prompt);
  const product = getBracketedCsv(result.response.text().trim().toLowerCase());
  const usage = result.response.usageMetadata;
  console.log("Product: ", product);
  console.log("  Product Input Tokens:", usage.promptTokenCount);
  console.log("  Product Output Tokens:", usage.candidatesTokenCount);
  product.push(productListString);
  return product;
};

const generateProductListString = async function () {
  const productList = await loadProductList();
  let productListString = "";
  if (!productList) {
    return null;
  }
  for (let i = 0; i < productList.products.length; i++) {
    if (i === productList.products.length - 1) {
      productListString += `- ${productList.products[i]}`;
    } else {
      productListString += `- ${productList.products[i]}\n`;
    }
  }
  return productListString;
};

module.exports = { productClassifier };
