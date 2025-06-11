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
    url: p.url,
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
- For each product reply with the following format (follow it strictly):
  - name: Mention the **name**.
  - description: Highlight 2–4 most relevant features from the JSON that match the user’s query.
  - price: Show the **price** (if available). It should also include currency (in ₹)
  - image: include the **product image link**.
  - url: include the **Product URL** in the response

at the top of your response include an opening message based on the user's query -> example: Here are some products that you might like <some key features of the products that are listed above>
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

const llmDetailTeller = async function (query, product) {
  const model = genAI.getGenerativeModel({ model: MODEL });

  const prompt = `
You are a sales person bot.
Given the user query with the url of a product, and the product schema for that product, your job is to simply provide details of the product, it's features and color etc
Keep your response in accordance with the schema, do not add features. Tell the user about discount if it is mentioned in the schema along with the validity of the offer if mentioned
You will receive:

1. A user’s query describing what they are looking for.
2. A product schema.

Use natural language but be concise. Do not include anything else in your response

User Query: ${query}
Product Schema: ${product}
`;

  const answer = await model.generateContent(prompt);
  const usage = answer.response.usageMetadata;
  console.log("  Input Tokens:", usage.promptTokenCount);
  console.log("  Output Tokens:", usage.candidatesTokenCount);
  console.log(answer.response.text());
  return answer.response.text();
};

module.exports = { finalOutput, llmDetailTeller };
