const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const { loadProductList } = require("../utils/getProductList");
const { getBracketedCsv } = require("../utils/processString");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = "gemini-1.5-flash";

const featureClassifier = async function (filteredProduct, query, history) {
  const featureListString = await generateFeatureListString(filteredProduct);
  const model = genAI.getGenerativeModel({ model: MODEL });
  const prompt = `You are a simple product feature classifier for a furniture store chatbot.  
Your job is to identify which feature categories from the available list match what the user is asking for.

Context:
- Product: ${filteredProduct[0]}
- Product category: ${filteredProduct[1]}
- Feature list: ${featureListString}
- Chat History (last 7 messages):  
${history}

Rules for Classification:

1. Identify if the current user query mentions any product features (e.g., size, material, storage, smart features, USB ports, reclining, color, etc.).
    - If yes → Match the relevant feature(s) to entries from the feature list using synonyms and common language.
    - If no feature is clearly stated in the query → go to Rule 2.

2. If no feature is found in the current query:
    - Look at the chat history to check for a feature-related mention relevant to the same product context.
    - If such a feature exists in history, match it.
    - If not, return [null].

3. Use common synonyms and related terms to map user queries to your feature list.
    - Example: If user says “55 inch” and your feature list has “Screen size”, match to [Screen size].
    - Example: If user says “leather” and the feature list has “Upholstery material”, match to [Upholstery material].

4. If the user request includes a feature that is not in the list, add it to a separate unmatched list.
    - Format the output as:  
      [matched1,matched2] &&
    [unmatched1,unmatched2]

5. If the query contains only irrelevant, nonsensical, or unusable feature requests, return [null].

Final Instruction:

Return the features the user is requesting in this exact format:  
- If features are matched: [matchedFeature1,matchedFeature2]  
- If some features are unmatched: [matchedFeature1] &&
    [unmatchedFeature1]
- If nothing is valid or useful: [null]

Do **not** add any extra text or explanation.

---
User Query: "${query}"
`;

  const result = await model.generateContent(prompt);
  const feature = getBracketedCsv(result.response.text().trim().toLowerCase());
  const usage = result.response.usageMetadata;
  console.log("Feature: ", feature[0]);
  console.log("  Feature Input Tokens:", usage.promptTokenCount);
  console.log("  Feature Output Tokens:", usage.candidatesTokenCount);
  feature.push(featureListString);
  if (Array.isArray(feature[0])) return feature;
  else {
    const start = feature.shift();
    const prepend = [start];
    feature.unshift(prepend);
    return feature;
  }
};

const generateFeatureListString = async function (filteredProduct) {
  const featureList = await loadProductList();
  let featureListString = "";
  const category = filteredProduct[0];
  if (filteredProduct[1] === "all") {
    const totalCats = Object.keys(featureList.attributes[category]);

    let i = 0;
    while (i < totalCats.length) {
      let subCategory = Object.keys(featureList.attributes[category])[i];
      let tryData = featureList.attributes[category][subCategory];
      let keys = Object.keys(tryData).length;
      for (let j = 0; j < keys; j++) {
        if (j === keys - 1) {
          featureListString += `${Object.keys(tryData)[j]} - ${
            Object.values(tryData)[j]
          }`;
        } else {
          featureListString += `${Object.keys(tryData)[j]} - ${
            Object.values(tryData)[j]
          }\n`;
        }
      }
      i++;
    }
    return featureListString;
  }

  const subCategory = filteredProduct[1];

  let totalLength = Object.keys(
    featureList.attributes[category][subCategory]
  ).length;
  for (let i = 0; i < totalLength; i++) {
    if (i === totalLength - 1) {
      featureListString += `${
        Object.keys(featureList.attributes[category][subCategory])[i]
      } - ${Object.values(featureList.attributes[category][subCategory])[i]}`;
    } else {
      featureListString += `${
        Object.keys(
          featureList.attributes[filteredProduct[0]][filteredProduct[1]]
        )[i]
      } - ${
        Object.values(
          featureList.attributes[filteredProduct[0]][filteredProduct[1]]
        )[i]
      }\n`;
    }
  }
  return featureListString;
};

module.exports = { featureClassifier };
