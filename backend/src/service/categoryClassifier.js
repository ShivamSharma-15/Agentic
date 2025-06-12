const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const { loadProductList } = require("../utils/getProductList");
const { getBracketedCsv } = require("../utils/processString");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = "gemini-1.5-flash";

const categoryClassifier = async function (filteredProduct, query, history) {
  const categoryListString = await generateCategoryListString(filteredProduct);
  const model = genAI.getGenerativeModel({ model: MODEL });
  const prompt = `
You are a simple product category classifier for a furniture store chatbot.  
Your job is to classify what product **category** the user is referring to, based on the available category list for a specific product.

---
## Context:
- Product: ${filteredProduct[0]}
- Available categories for this product: ${categoryListString}
- Chat History (last 7 messages):  
${history}
---

## Rules for Classification:

1. **Check the current user query for a category name or synonym**.  
    - Use common synonyms and alternate terms to map the user’s request to one of the listed categories.
    - Example: "sofa bed" → [sofa cum bed]  
    - Example: "tv shelf" → [tv unit]

2. If no clear category is mentioned in the current query:
    - Check chat history for the **last mentioned relevant category** for this product.
    - If found and the current query is ambiguous (e.g., “do you have it in white?”), use the category from the history.

3. If the user query is **generic or broad** (e.g., "show me beds"), and doesn't specify any specific category, return [all].

4. If the user mentions a **nonsensical, impractical, or unrelated category** for this product, return [null].

---
## Final Instruction:

Return just **one category** from the list, in square brackets.  
- Format: [category]  
- Use [all] if no specific category is mentioned.  
- Use [null] if the query makes no sense or references an invalid category.  
Do **not** include any other text or explanation.

---
User Query: "${query}"  
Category:
`;

  const result = await model.generateContent(prompt);
  const category = getBracketedCsv(result.response.text().trim().toLowerCase());
  const usage = result.response.usageMetadata;
  console.log("Category: ", category);
  console.log("  Category Input Tokens:", usage.promptTokenCount);
  console.log("  Category Output Tokens:", usage.candidatesTokenCount);
  category.push(categoryListString);
  return category;
};

const generateCategoryListString = async function (filteredProduct) {
  const categoryList = await loadProductList();
  let categoryListString = "";
  if (!categoryList) {
    return null;
  }
  for (let i = 0; i < categoryList.categories[filteredProduct[0]].length; i++) {
    if (i === categoryList.categories[filteredProduct[0]].length - 1) {
      categoryListString += `- ${
        categoryList.categories[filteredProduct[0]][i]
      }`;
    } else {
      categoryListString += `- ${
        categoryList.categories[filteredProduct[0]][i]
      }\n`;
    }
  }
  return categoryListString;
};

module.exports = { categoryClassifier };
