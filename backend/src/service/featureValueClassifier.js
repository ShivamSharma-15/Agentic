const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const { loadProductList } = require("../utils/getProductList");
const { getBracketedCsv } = require("../utils/processString");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = "gemini-1.5-flash";

const featureValueClassifier = async function (filteredProduct, query) {
  if (filteredProduct[2] == "null") {
    return ["null"];
  }
  const featureValueListString = await generateFeatureValueListString(
    filteredProduct
  );
  const model = genAI.getGenerativeModel({ model: MODEL });
  const prompt = `
You are a simple product feature classifier for a furniture store chatbot. Your job is to match the available features list for a product line up across the products list with what the user is actually looking for.
The product that the user wants to see has been classified as ${filteredProduct[0]}, the particular product cataegory has been classified as ${filteredProduct[1]}
Classify the user's search into one of these feature requests for the product- ${filteredProduct[0]}:

${featureValueListString}

Please keep in mind common synonyms and interchangeably used terms for above features. Keep in mind redundancy, do not use similar descriptions twice. Respond with just one or more features that matches for the search and put it between square brackets seperated by a comma. example: [big oled display,maximum storage]
The featuers that the user requests but are not available should also be included and put in a seperate [], example if matched feature is "[big oled display,maximum storage]" and unmatched is "[bone,muscle]" your reply should be [big oled display,maximum storage]&&[bone,muscle]]. Reply with [null] if the feature asked by user is nonsensical, impractical, unusual category for that product, useless or does not make sense. Do not use any other words in the output please.

Query: "${query}"
Features:
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
  if (filteredProduct[1] === "all") {
    const totalCats = Object.keys(
      featureList.attribute_value[filteredProduct[0]]
    );
    let i = 0;
    while (i < totalCats) {
      const catLength = Object.keys(
        featureList.attribute_value[[filteredProduct[0]][i]]
      );
      for (let j = 0; j < catLength; j++) {
        if (i === catLength - 1) {
          featureListString += `${Object.keys(
            featureList.attribute_value[[filteredProduct[0]][i]]
          )} - ${Object.values(
            featureList.attribute_value[filteredProduct[0]][i]
          )}`;
        } else {
          featureListString += `${Object.keys(
            featureList.attribute_value[[filteredProduct[0]][i]]
          )} - ${Object.values(
            featureList.attribute_value[filteredProduct[0]][i]
          )}\n`;
        }
      }
      i++;
    }
    return featureListString;
  }
  const totalFeatures = filteredProduct[2].length;
  for (let i = 0; i < totalFeatures; i++) {
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
