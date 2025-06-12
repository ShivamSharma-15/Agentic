function makeObject(query, result, filteredProduct) {
  if (!result || !Array.isArray(result) || result.length === 0) {
    return null; // Abort if no products found
  }

  // Extract URLs from result
  const product_urls = result
    .filter((item) => item && typeof item.url === "string")
    .map((item) => item.url);

  if (product_urls.length === 0) {
    return null; // No valid product URLs
  }

  // Build attributes safely
  const attributes_used = {
    product_name: filteredProduct[0] || null,
    category: filteredProduct[1] || null,
    features: Array.isArray(filteredProduct[2])
      ? filteredProduct[2]
      : typeof filteredProduct[2] === "string"
      ? [filteredProduct[2]]
      : [],
    featuresValues: Array.isArray(filteredProduct[3])
      ? filteredProduct[3]
      : typeof filteredProduct[3] === "string"
      ? [filteredProduct[3]]
      : [],
    colors: Array.isArray(filteredProduct[4])
      ? filteredProduct[4]
      : typeof filteredProduct[4] === "string"
      ? [filteredProduct[4]]
      : [],
  };

  return {
    query,
    product_urls,
    attributes_used,
  };
}
module.exports = { makeObject };
