const fs = require("fs");
const path = require("path");
const cosineSimilarity = require("cosine-similarity");
const { pipeline } = require("@xenova/transformers");

let embed = null;

async function loadModel() {
  if (!embed) {
    embed = await pipeline("feature-extraction", "Xenova/bge-small-en-v1.5");
  }
}

function weightedAverage(vectors, weights) {
  const length = vectors[0].length;
  const result = new Array(length).fill(0);

  for (let i = 0; i < vectors.length; i++) {
    const vec = vectors[i];
    const weight = weights[i];
    for (let j = 0; j < length; j++) {
      result[j] += vec[j] * weight;
    }
  }

  // Normalize
  const norm = Math.sqrt(result.reduce((sum, val) => sum + val ** 2, 0));
  return result.map((v) => v / norm);
}

/**
 * Search and return full product objects.
 * @param {Array} queryArray - Array like ['sofa', 'wooden sofa', ..., 'indigo blue']
 * @param {string} embeddingFilePath - Path to embedded_products.json
 * @returns {Promise<Array<object>>} - Top 5 matching product JSONs
 */
async function searchTopProductsWeighted(queryArray, embeddingFilePath) {
  await loadModel();

  const categoryList = [queryArray[0]];
  if (queryArray[1] && queryArray[1].toLowerCase() !== "all") {
    categoryList.push(queryArray[1]);
  }
  const productCategory = categoryList.join(", ");

  const features = (Array.isArray(queryArray[3]) ? queryArray[3] : []).join(
    ", "
  );
  const color = queryArray[4] || "";

  const [categoryEmbedding, featuresEmbedding, colorEmbedding] =
    await Promise.all([
      embed(productCategory, { pooling: "mean", normalize: true }),
      embed(features, { pooling: "mean", normalize: true }),
      embed(color, { pooling: "mean", normalize: true }),
    ]);

  const queryEmbedding = weightedAverage(
    [categoryEmbedding.data, colorEmbedding.data, featuresEmbedding.data],
    [1.2, 1.0, 0.4]
  );

  const fullPath = path.resolve(__dirname, embeddingFilePath);
  const raw = fs.readFileSync(fullPath, "utf-8");
  const embeddedProducts = JSON.parse(raw);

  const scored = embeddedProducts.map((entry) => {
    const score = cosineSimilarity(queryEmbedding, entry.embedding);
    return { product: entry.product, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((entry) => entry.product); // Return full product objects
}

module.exports = searchTopProductsWeighted;
