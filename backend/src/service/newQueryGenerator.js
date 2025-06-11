const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const { getBracketedCsv } = require("../utils/processString");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = "gemini-1.5-flash";

async function makeQueryForProduct(query) {
  const model = genAI.getGenerativeModel({ model: MODEL });
  const prompt = `
You are a simple query generator, given the product schema, generate a query that a human user might ask to get that product as the result. Include features, colors, and other relevant details. But not too descriptive to result in exact match.
Just include one query seperating features and thoughts by comma. Do not include anything else in the response
Schema: 
${query}
`;

  const result = await model.generateContent(prompt);
  const intent = result.response.text();
  const usage = result.response.usageMetadata;
  console.log("Intent: ", intent);
  console.log("  Intent Input Tokens:", usage.promptTokenCount);
  console.log("  Intent Output Tokens:", usage.candidatesTokenCount);

  //   const intentArray = generateIntentArray();
  if (intent.length !== 0) {
    return intent;
  } else {
    return ["noreply"];
  }
}

module.exports = { makeQueryForProduct };
