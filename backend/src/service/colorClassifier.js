const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const { loadProductList } = require("../utils/getProductList");
const { getBracketedCsv } = require("../utils/processString");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = "gemini-1.5-flash";

const colorClassifier = async function (filteredProduct, query, history) {
  const colorString = await generateColorListString(filteredProduct);
  const model = genAI.getGenerativeModel({ model: MODEL });
  console.log(colorString);
  const prompt = `
You are a simple color classifier for a furniture store chatbot.  
Your job is to match the user's current query to the most appropriate color(s) from the available list provided below.

---
## Context:
- Product: ${filteredProduct[0]}
- Product category: ${filteredProduct[1]}
- Color list: ${colorString}
- Chat History (last 7 messages):  
${history}
---

## Rules for Classification:

1. **Check if the current user query mentions a color or color-related term** (e.g., blue, dark, pastel, light, neutral).
    - If yes → Match that to the closest color(s) from the list.
    - If the query mentions a **negated color** (e.g., "not white", "anything but black"), explicitly exclude that color and prefer alternatives that may fit better.
    - If no → go to Rule 2.

2. If the query does not mention any color-related term:
    - Check if the chat history contains a **recent color mention that clearly applies to the same product or request**.
    - If yes, use that color.
    - If not, return [null].

3. Use **common synonyms or close matches** to map the user request to the color list.
    - If the user says "peach" and only "ivory" and "light orange" are close matches, return [ivory,light orange].
    - If the list contains similar prefixed/suffixed options (e.g., "peach mango", "peach leafy"), include both.

4. If the user specifies a color that is **not in the list** and not even close to anything in the list, return [null].

5. If the user query is **irrelevant, nonsensical, or does not concern color**, return [null].

---
## Final Instruction:

Match the query to as many colors as possible from the list.  
Return the result strictly in this format: [color1,color2] or [null].  
Do **not** include any other text or explanation.

---
User Query: "${query}"`;

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
  let colorListString = "";
  const category = filteredProduct[0];
  if (filteredProduct[1] === "all") {
    const totalCats = Object.keys(colorList.colors[category]);
    let i = 0;
    while (i < totalCats.length) {
      let subCategory = Object.keys(colorList.colors[category])[i];

      let tryData = colorList.colors[category][subCategory];
      let catLength = Object.keys(tryData).length;
      for (let j = 0; j < catLength; j++) {
        let subCategory = Object.keys(colorList.colors[category])[i];
        let tryData = colorList.colors[category][subCategory];
        if (j === tryData.length - 1) {
          colorListString += `- ${tryData[j]}`;
        } else {
          colorListString += `- ${tryData[j]}\n`;
        }
      }
      i++;
    }
    return colorListString;
  }
  colorList.colors[filteredProduct[0]][filteredProduct[1]];
  let totalLength =
    colorList.colors[filteredProduct[0]][filteredProduct[1]].length;
  let target = colorList.colors[filteredProduct[0]][filteredProduct[1]];

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
