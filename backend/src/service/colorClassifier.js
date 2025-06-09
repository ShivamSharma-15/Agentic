const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const { loadProductList } = require("../utils/getProductList");
const { getBracketedCsv } = require("../utils/processString");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = "gemini-1.5-flash";

const colorClassifier = async function (filteredProduct, query) {
  const colorString = await generateColorListString(filteredProduct);
  const model = genAI.getGenerativeModel({ model: MODEL });
  const prompt = `
You are a simple color classifier for a furniture store chatbot. Your job is to match the available color list provided below with what the user is actually looking for.
The product that the user wants to see has been classified as ${filteredProduct[0]}, the particular product cataegory has been classified as ${filteredProduct[1]}
Classify the user's search into one of these color requests for the product- ${filteredProduct[0]}:

${colorString}

Please keep in mind common synonyms and interchangeably used terms for above colors. Try to find a color from the above list, that closely matches, or can be percieved as the color that the user asked for, for example if the user asks for peach, and in the above list does not contain peach but contains ivory and light orange, return [ivory,light orange].
Include all the colors present in the list. If there are cases where one color is peach mango and peach leafy, include both saperated by a comma and within square brackets, example [peach,light orange].If the colors that the user requests are not available, and not even close to the list above, simply return [null], if in the query the user does not specify a color, return [null]. Reply with [null] if the color asked by user is nonsensical, impractical, unusual color for that product, useless or does not make sense. Do not use any other words in the output please.
(for beds, you might consider finish color as color)

Query: "${query}"
Colors:
`;

  const result = await model.generateContent(prompt);
  const color = getBracketedCsv(result.response.text().trim().toLowerCase());
  const usage = result.response.usageMetadata;
  console.log("Color: ", color);
  console.log("  Color Input Tokens:", usage.promptTokenCount);
  console.log("  Color Output Tokens:", usage.candidatesTokenCount);
  color.push(colorString);
  return color;
};

const generateColorListString = async function (filteredProduct) {
  const colorList = await loadProductList();
  if (filteredProduct[1] === "all") {
    const totalCats = Object.keys(colorList.colors[filteredProduct[0]]);
    let i = 0;
    while (i < totalCats) {
      const catLength = Object.keys(colorList.colors[[filteredProduct[0]][i]]);
      for (let j = 0; j < catLength; j++) {
        if (i === catLength - 1) {
          colorList += `- ${Object.values(
            colorList.colors[[filteredProduct[0]][i]][0][0]
          )}`;
        } else {
          colorList += `- ${Object.values(
            colorList.colors[[filteredProduct[0]][i]][0][0]
          )}\n`;
        }
      }
      i++;
    }
    return colorList;
  }
  colorList.colors[filteredProduct[0]][filteredProduct[1]];
  let totalLength =
    colorList.colors[filteredProduct[0]][filteredProduct[1]].length;
  let target = colorList.colors[filteredProduct[0]][filteredProduct[1]];
  let colorListString = "";
  if (!colorList) {
    return null;
  }
  for (let i = 0; i < totalLength; i++) {
    if (i === totalLength - 1) {
      colorListString += `- ${target[i]}`;
    } else {
      colorListString += `- ${target[i]}\n`;
    }
  }

  return colorListString;
};

module.exports = { colorClassifier };
