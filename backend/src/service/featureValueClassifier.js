const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const { loadProductList } = require("../utils/getProductList");
const { getBracketedCsv } = require("../utils/processString");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = "gemini-1.5-flash";

const featureValueClassifier = async function (
  filteredProduct,
  query,
  history
) {
  if (filteredProduct[2] == "null") {
    return ["null"];
  }
  const featureValueListString = await generateFeatureValueListString(
    filteredProduct
  );
  const model = genAI.getGenerativeModel({ model: MODEL });
  const prompt = `
You are a simple product feature value classifier for a furniture store chatbot.  
Your job is to classify which specific feature values (not just feature categories) from the available list match what the user is asking for.

---
## Context:
- Product: ${filteredProduct[0]}
- Product category: ${filteredProduct[1]}
- Available feature values: ${featureValueListString}
- Chat History (last 7 messages):  
${history}
---

## Rules for Classification:

1. **Check if the current query contains any specific feature values** (e.g., "55 inch", "leather", "recliner", "matte black", etc.).
    - If yes → Map them to the closest matching entries in the provided list using common synonyms and real-world interpretations.
    - If no → proceed to Rule 2.

2. If the query does not contain any feature-related values:
    - Check if the chat history contains a **recent specific feature value** related to the same product.
    - If so, and if it is relevant to the user’s current query, use it.
    - Otherwise, return [null].

3. Only include values **that are listed in the feature value list**.  
    - If a value is **not present** in the list but appears to be requested, add it to a separate unmatched list.

4. Match **close synonyms or interchangeable phrases** to the list values.
    - Example: "fifty-five inch" or "55-inch" → "55 inch"
    - Example: "charcoal" → "dark grey", if that's in the list
    - Avoid including similar values more than once (handle redundancy).

5. Format:
    - If matches found: [matched1,matched2]
    - If some are unmatched: [matched1] && [unmatched1]
    - If nothing is relevant: [null]

6. Do **not** add your own feature values, placeholder guesses, or general descriptions.  
    Only classify values from the provided list, or include unmatched ones explicitly.

---
## Final Instruction:

Return the result strictly in this format:  
- [matched1,matched2]
- or [matched1] &&
    [unmatched1,unmatched2] 
- or [null] if no valid value is found.  

Do **not** include any other text or explanation.

---
User Query: "${query}"
`;

  const result = await model.generateContent(prompt);

  console.log(result.response.text());
  const featureValue = getBracketedCsv(
    result.response.text().trim().toLowerCase()
  );
  const usage = result.response.usageMetadata;
  console.log("Feature Value: ", featureValue);
  console.log("  Feature Value Input Tokens:", usage.promptTokenCount);
  console.log("  Feature Value Output Tokens:", usage.candidatesTokenCount);
  featureValue.push(featureValueListString);
  return featureValue;
};

const generateFeatureValueListString = async function (filteredProduct) {
  const featureList = await loadProductList();
  let featureListString = "";
  const category = filteredProduct[0];
  const totalFeatures = filteredProduct[2].length;
  if (filteredProduct[1] === "all") {
    const totalCats = Object.keys(featureList.attribute_value[category]);
    let i = 0;

    for (let j = 0; i < totalFeatures; i++) {
      while (i < totalCats.length) {
        let subCategory = Object.keys(featureList.attribute_value[category])[i];
        let tryData = featureList.attribute_value[category][subCategory];
        let allKeys = Object.keys(tryData);
        if (allKeys.indexOf(filteredProduct[2][j]) !== -1) {
          let key =
            featureList.attribute_value[category][subCategory][
              filteredProduct[2][j]
            ];
          featureListString += key.join(", ");
          if (j !== totalFeatures - 1) {
            featureListString += ", ";
          }
        }
        i++;
      }
    }
    return featureListString;
  }

  for (let i = 0; i < totalFeatures; i++) {
    console.log(filteredProduct[2]);
    let key =
      featureList.attribute_value[filteredProduct[0]][filteredProduct[1]][
        filteredProduct[2][i]
      ];
    featureListString += key.join(", ");
    if (i !== totalFeatures - 1) {
      featureListString += ", ";
    }
  }
  return featureListString;
};

module.exports = { featureValueClassifier };
