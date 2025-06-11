const { extractUrls, findProductByUrl } = require("../utils/allUrlExtractors");
const { urlIntentClassifier } = require("../service/urlIntentClassifier");
const { llmDetailTeller } = require("../service/llmAnswer");
const { searchController } = require("./search");
const { makeQueryForProduct } = require("../service/newQueryGenerator");
async function url(query) {
  const urls = extractUrls(query);
  const intentUrl = await urlIntentClassifier(query);
  const product = await findProductByUrl(urls[0]);
  let response;
  if (intentUrl.indexOf("details") !== -1) {
    response = await llmDetailTeller(query, JSON.stringify(product));
  }
  if (intentUrl.indexOf("moreLike" !== -1)) {
    const newQuery = await makeQueryForProduct(query, JSON.stringify(product));
    const searchResult = await searchController(newQuery, urls);
    response = searchResult;
  }
  return response;
}

module.exports = { url };
