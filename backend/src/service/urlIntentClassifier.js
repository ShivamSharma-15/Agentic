const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const { getBracketedCsv } = require("../utils/processString");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = "gemini-1.5-flash";

async function urlIntentClassifier(query) {
  const model = genAI.getGenerativeModel({ model: MODEL });
  const prompt = `
You are an intent classifier. Your job is to accurately classify intents of a query.
Classify the user's query into one of these intents:

details : User shared a url and want to know details about the product, or if the user just shared the url and provided no context
moreLike : User shared a url and wants to see more products like the one they shared (needs to be the same product)
designer : User shared a url and wants some other product that would go nicely with the one they shared the link of

the search can be for a product from a furniture store
Respond with just the intent from above within square brackets []. Use [noreply] only when no other intent matches. Do not use any other words please.
If a user query starts with some variation of "I am also looking for", "one more product" etc. That means a "search" intent

Query: "${query}"
Intent:
`;

  const result = await model.generateContent(prompt);
  const intent = getBracketedCsv(result.response.text().trim().toLowerCase());
  const usage = result.response.usageMetadata;
  console.log("URL Intent: ", intent);
  console.log("  URL Intent Input Tokens:", usage.promptTokenCount);
  console.log("  URL Intent Output Tokens:", usage.candidatesTokenCount);

  //   const intentArray = generateIntentArray();
  if (intent.length !== 0) {
    return intent;
  } else {
    return ["noreply"];
  }
}
module.exports = { urlIntentClassifier };
