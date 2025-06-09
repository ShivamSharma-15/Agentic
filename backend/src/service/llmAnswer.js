const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = "gemini-1.5-flash";

const finalOutput = async function (query, result) {
  const slimmed = result.map((p) => ({
    name: p.name,
    description: p.description?.split(".")[0] + ".", // first sentence only
    image: p.image,
    price: p.priceSpecification?.[0]?.price,
  }));

  const model = genAI.getGenerativeModel({ model: MODEL });

  const prompt = `
You are a helpful and concise product recommendation assistant for a furniture store.

You will receive:
1. A user’s query describing what they are looking for.
2. A list of up to 5 product objects in JSON format. Each object includes product name, description, features, price, and image link.

Your task is to:
- Recommend products based **only** on the features explicitly present in the JSON.
- Do **not** invent any features or benefits.
- For each product:
  - Mention the **name**.
  - Highlight 2–4 most relevant features from the JSON that match the user’s query.
  - Show the **price** (if available).
  - End with the **product image link**.

Use natural language but be concise. Format each product as a bullet point or short paragraph. Do not repeat the query or explain your reasoning.

User Query:
"${query}"

Top Matching Products:
${JSON.stringify(slimmed, null, 2)}

`;

  const answer = await model.generateContent(prompt);
  const usage = answer.response.usageMetadata;
  console.log("  Input Tokens:", usage.promptTokenCount);
  console.log("  Output Tokens:", usage.candidatesTokenCount);
  console.log(answer.response.text());
  return answer.response.text();
};

module.exports = { finalOutput };
