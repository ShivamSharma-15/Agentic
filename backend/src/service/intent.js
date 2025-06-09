const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const { loadIntentList } = require("../utils/getIntentList");
const { getBracketedCsv } = require("../utils/processString");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = "gemini-1.5-flash";

async function intentClassifier(query) {
  const intentString = await generateIntentString();
  const model = genAI.getGenerativeModel({ model: MODEL });
  const prompt = `
You are an intent classifier. Your job is to accurately classify intents of a query.
Classify the user's query into one of these intents:

${intentString}

Respond with just the intent from above within square brackets []. Use [noreply] only when no other intent matches. Do not use any other words please.

Query: "${query}"
Intent:
`;

  const result = await model.generateContent(prompt);
  const intent = getBracketedCsv(result.response.text().trim().toLowerCase());
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

async function generateIntentString() {
  const intentList = await loadIntentList();
  let intentString = "";
  if (!intentList)
    return console.log("Something went wrong while loading intents");
  for (let i = 0; i < intentList.intent.length; i++) {
    if (i === intentList.intent.length - 1) {
      intentString += `- ${intentList.intent[i]}`;
    } else {
      intentString += `- ${intentList.intent[i]}\n`;
    }
  }
  return intentString;
}
// async function generateIntentArray() {
//   const intentList = await loadIntentList();
//   let intentArray = [];
//   if (!intentList)
//     return console.log("Something went wrong while loading intents");
//   for (let i = 0; i < intentList.intent.length; i++) {
//     let splitIntent = intentList.intent[i].split(":");
//     let intent = splitIntent[0];
//     intentArray.push(intent);
//   }
//   return intentArray;
// }
module.exports = { intentClassifier };
