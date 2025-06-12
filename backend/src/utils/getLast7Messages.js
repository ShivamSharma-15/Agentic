const { getUserConversationFlow, getIntentHistory } = require("../redis/redis");

async function getLast7MessagesForLLM(userId) {
  const rawMessages = await getUserConversationFlow(userId, 20);

  if (!rawMessages || rawMessages.length === 0) {
    return "No prior context available. This is the user's first message.";
  }

  const ordered = rawMessages.reverse(); // Oldest to newest
  const formatted = [];

  for (const msg of ordered) {
    const { query, intent, timestamp } = msg;
    if (!query) continue;

    let detailed;
    try {
      const intentHistory = await getIntentHistory(userId, intent, 50);
      detailed = intentHistory.find((h) => h.timestamp === timestamp);
    } catch (err) {
      console.error("Failed to fetch intent detail", err);
    }

    let attributesSummary = "";
    if (detailed?.attributes_used) {
      const attrs = detailed.attributes_used;

      const productName = attrs.product_name || "N/A";
      const category = attrs.category || "N/A";

      const features = Array.isArray(attrs.features)
        ? attrs.features.join(", ")
        : attrs.features || "N/A";

      const featuresValues = Array.isArray(attrs.featuresValues)
        ? attrs.featuresValues.join(", ")
        : attrs.featuresValues || "N/A";

      const colors = Array.isArray(attrs.colors)
        ? attrs.colors.join(", ")
        : attrs.colors || "N/A";

      attributesSummary = ` | Product: ${productName} | Category: ${category} | Features: ${features} | Colors: ${colors}`;
    }

    formatted.push(`User said: "${query}"${attributesSummary}`);
    if (formatted.length === 7) break;
  }

  return formatted.join("\n");
}

module.exports = { getLast7MessagesForLLM };
