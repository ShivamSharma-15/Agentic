const { productClassifier } = require("../service/productClassifier");
const { categoryClassifier } = require("../service/categoryClassifier");
const { featureClassifier } = require("../service/featureClassifier");
const { featureValueClassifier } = require("../service/featureValueClassifier");
const { colorClassifier } = require("../service/colorClassifier");
const { searchTopProductsWeighted } = require("../utils/searchProduct");
const { makeObject } = require("../utils/makeRedisObject");
const path = require("path");
const { finalOutput } = require("../service/llmAnswer");
const { saveMessage } = require("../redis/redis");
const { getLast7MessagesForLLM } = require("../utils/getLast7Messages");

const searchController = async function (query, skip = [], chatId) {
  let history = await getLast7MessagesForLLM(chatId);
  console.log(history);
  let filteredProduct = [];
  const product = await productClassifier(query, history);
  if (product[0] === "null") {
    const productList = product[1];
    const answer = `We currently do not have a listing for that product. Our current product range is: \n${productList}`;
    return answer;
  }
  filteredProduct.push(product[0]);

  const productCategory = await categoryClassifier(
    filteredProduct,
    query,
    history
  );
  if (productCategory[0] === "null") {
    const answer = `Sorry but that seems like an invalid request. Please try again`;
  }
  filteredProduct.push(productCategory[0]);
  let missing = [];

  const features = await featureClassifier(filteredProduct, query, history);
  filteredProduct.push(features[0]);
  missing.push(features[1]);
  const featureValues = await featureValueClassifier(
    filteredProduct,
    query,
    history
  );
  if (!Array.isArray(featureValues[0])) {
    const pushFeatureValues = [featureValues[0]];
    filteredProduct.push(pushFeatureValues);
  } else {
    filteredProduct.push(featureValues[0]);
  }

  missing.push(featureValues[1]);
  const color = await colorClassifier(filteredProduct, query, history);
  if (!Array.isArray(color[0])) {
    const pushFeatureValues = [color[0]];
    filteredProduct.push(pushFeatureValues);
  } else {
    filteredProduct.push(color[0]);
  }

  console.log(color.length);
  missing.push(color[1]);
  console.log(filteredProduct);
  console.log(missing);
  const embeddingFilePath = path.resolve(
    __dirname,
    "../../../data/embedded/embedded_products.json"
  );
  let result;
  if (skip.length < 1) {
    result = await searchTopProductsWeighted(
      filteredProduct,
      embeddingFilePath
    );
    console.log(result);
  } else {
    result = await searchTopProductsWeighted(
      filteredProduct,
      embeddingFilePath,
      skip
    );
    console.log(result);
  }

  const answer = await finalOutput(query, result);

  const payload = makeObject(query, result, filteredProduct, "search_products");

  if (payload) {
    await saveMessage(chatId, "search_products", payload);
  } else {
    console.log("No valid products, skipping chat history save.");
  }

  // const simplifiedQuery = await querySimplifier(filteredProduct, query);

  // const matcher = await matchProducts(filteredProduct, simplifiedQuery);

  // const answer = await searchReply(missing, query, matcher);

  return answer;
};

module.exports = { searchController };
