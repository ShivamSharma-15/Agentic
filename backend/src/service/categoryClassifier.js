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
You are a simple product category classifier for a furniture store chatbot. Your job is to match the available category list for a specific product with what the user is actually looking for.

Chat History of the user (past 7 messages):
${history}

Consider the above history as well when responding. If the user is not clear about the category in the query, use the category that they last talked about.

The product that the user wants to see has been classified as ${filteredProduct[0]}
Classify the user's search into one of these Categories for the product- ${filteredProduct[0]}:

${categoryListString}

Please keep in mind common synonyms and interchangeably used terms for above Categories. Respond with just one category that matches for the search and put it between square brackets. example: [bed]
Respond with just one category from above within square brackets []. Use [all] when no category matches or category is not mentioned by the user. The category has to be a reasonable category for that product to have. Reply with [null] if the category asked by user is nonsensical, impractical, unusual category for that product, useless or does not make sense. Do not use any other words please.

Query: "${query}"
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
