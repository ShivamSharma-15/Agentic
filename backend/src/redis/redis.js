require("dotenv").config();
const { Redis } = require("@upstash/redis");

const client = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function saveMessage(userId, intent, payload) {
  const timestamp = new Date().toISOString();
  const rootEntry = {
    query: payload.query,
    intent,
    timestamp,
  };

  if (intent === "greeting_or_smalltalk" && payload.response) {
    rootEntry.response = payload.response;
  }

  // Push to root bucket
  await client.lpush(`chat:${userId}:root`, JSON.stringify(rootEntry));
  await client.ltrim(`chat:${userId}:root`, 0, 99); // Keep only last 100

  // Push to intent-specific list
  const intentEntry = {
    ...payload,
    timestamp,
  };
  await client.lpush(`chat:${userId}:${intent}`, JSON.stringify(intentEntry));
  await client.ltrim(`chat:${userId}:${intent}`, 0, 11); // Keep last 50 per intent

  await client.sadd(`chat:${userId}:intents`, intent);
}

async function getUserConversationFlow(userId, limit = 11) {
  const messages = await client.lrange(`chat:${userId}:root`, 0, limit - 1);

  return messages.map((entry) => {
    if (typeof entry === "string") {
      return JSON.parse(entry);
    } else {
      // Already an object, likely test/dev
      return entry;
    }
  });
}

async function getIntentHistory(userId, intent, limit = 11) {
  const history = await client.lrange(`chat:${userId}:${intent}`, 0, limit - 1);
  return history.map((entry) => {
    if (typeof entry === "string") {
      return JSON.parse(entry);
    } else {
      return entry;
    }
  });
}

async function getUserIntents(userId) {
  const intents = await client.smembers(`chat:${userId}:intents`);
  return intents;
}

async function clearUserHistory(userId) {
  const intents = await getUserIntents(userId);
  const keysToDelete = intents.map((intent) => `chat:${userId}:${intent}`);
  keysToDelete.push(`chat:${userId}:root`, `chat:${userId}:intents`);
  await Promise.all(keysToDelete.map((key) => client.del(key)));
}

async function clearAllUserHistories() {
  const allKeys = await client.keys("chat:*", { type: "string" });
  if (allKeys.length > 0) {
    await Promise.all(allKeys.map((key) => client.del(key)));
  }
}

module.exports = {
  saveMessage,
  getUserConversationFlow,
  getIntentHistory,
  getUserIntents,
  clearUserHistory,
  clearAllUserHistories,
};
