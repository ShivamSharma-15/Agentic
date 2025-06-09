const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const { loadProductList } = require("../utils/getProductList");
const { getBracketedCsv } = require("../utils/processString");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = "gemini-1.5-flash";

const featureClassifier = async function (filteredProduct, query) {
  const featureListString = await generateFeatureListString(filteredProduct);
  const model = genAI.getGenerativeModel({ model: MODEL });
  const prompt = `
You are a simple product feature classifier for a furniture store chatbot. Your job is to match the available features list for a product line up across the products list with what the user is actually looking for.
The product that the user wants to see has been classified as ${filteredProduct[0]}, the particular product cataegory has been classified as ${filteredProduct[1]}
Classify the user's search into one of these feature requests for the product- ${filteredProduct[0]}:

${featureListString}

Please keep in mind common synonyms and interchangeably used terms for above features. Respond with just one or more features that matches for the search and put it between square brackets seperated by a comma. example: [display, storage]
The featuers that the user requests but are not available should also be included and put in a seperate [], example if matched feature is "[display,storage]" and unmatched is "[bone,muscle]" your reply should be [display,storage]&&[bone,muscle]]. Reply with [null] if the feature asked by user is nonsensical, impractical, unusual category for that product, useless or does not make sense. Do not use any other words in the output please.

Query: "${query}"
Features:
`;

  const result = await model.generateContent(prompt);
  const feature = getBracketedCsv(result.response.text().trim().toLowerCase());
  const usage = result.response.usageMetadata;
  console.log("Feature: ", feature[0]);
  console.log("  Feature Input Tokens:", usage.promptTokenCount);
  console.log("  Feature Output Tokens:", usage.candidatesTokenCount);
  feature.push(featureListString);
  return feature;
};

const generateFeatureListString = async function (filteredProduct) {
  const featureList = await loadProductList();
  let featureListString = "";
  let j = 0;
  if (filteredProduct[1] === "all") {
    const totalCats = Object.keys(featureList.attributes[filteredProduct[0]]);
    console.log(totalCats);
    let i = 0;
    while (i < totalCats) {
      console.log(i);
      const catLength = Object.keys(
        featureList.attributes[[filteredProduct[0]][i]]
      );
      for (let j = 0; j < catLength; j++) {
        if (i === catLength - 1) {
          featureListString += `${Object.keys(
            featureList.attributes[[filteredProduct[0]][i]]
          )} - ${Object.values(featureList.attributes[filteredProduct[0]][i])}`;
        } else {
          featureListString += `${Object.keys(
            featureList.attributes[[filteredProduct[0]][i]]
          )} - ${Object.values(
            featureList.attributes[filteredProduct[0]][i]
          )}\n`;
        }
      }
      i++;
    }
    return featureListString;
  }

  let totalLength = Object.keys(
    featureList.attributes[filteredProduct[0]][filteredProduct[1]]
  ).length;

  if (!featureList) {
    return null;
  }
  for (let i = 0; i < totalLength; i++) {
    if (
      i ===
      Object.keys(
        featureList.attributes[filteredProduct[0]][filteredProduct[1]]
      ).length -
        1
    ) {
      featureListString += `${
        Object.keys(
          featureList.attributes[filteredProduct[0]][filteredProduct[1]]
        )[i]
      } - ${
        Object.values(
          featureList.attributes[filteredProduct[0]][filteredProduct[1]]
        )[i]
      }`;
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
