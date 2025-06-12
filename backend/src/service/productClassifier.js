const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const { loadProductList } = require("../utils/getProductList");
const { getBracketedCsv } = require("../utils/processString");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = "gemini-1.5-flash";

const productClassifier = async function (query, history) {
  console.log(query);
  const productListString = await generateProductListString();
  const model = genAI.getGenerativeModel({ model: MODEL });
  console.log(history);
  const prompt = `
You are a simple product classifier for a furniture store chatbot.  
Your job is to classify what product the user is referring to, based on the available product list.

---
## Context:
- Chat History (last 7 messages):  
${history}
- Available products: ${productListString}
---

## Rules for Classification:

1. Check the **current user query** for any mention or synonym of a product from the list.  
    - Use common phrasing and interchangeable terms.  
    - Example: “couch” → [sofa], “sleeping furniture” → [bed]

2. If the query does **not explicitly mention a product**, try to infer the product from **chat history**:  
    - Look for the last clearly mentioned product in history.  
    - If the current query is vague or refers to color, features, or general interest (e.g., “show me something in blue”), assume the user is still referring to the last mentioned product.

3. If the user refers to a **function or purpose** (e.g., “something to relax on”), map to a suitable product if possible (e.g., [sofa], [recliner]).

4. If **no valid product** can be determined from the query or history, or the request is nonsensical or unrelated to furniture, return [null].

---
## Final Output Format:

- Return exactly one product from the product list in this format: [product]
- If no product applies, return [null]
- Never return empty brackets, never include explanation.

---
User Query: "${query}"  
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
