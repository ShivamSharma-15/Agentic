function getBracketedCsv(text) {
  const result = [];
  let startIndex = -1;
  let endIndex = -1;
  let searchStart = 0;

  while ((startIndex = text.indexOf("[", searchStart)) !== -1) {
    endIndex = text.indexOf("]", startIndex);

    if (endIndex === -1) {
      break;
    }

    const content = text.substring(startIndex + 1, endIndex);
    const items = content.split(",").map((item) => item.trim());
    result.push(items);

    searchStart = endIndex + 1;
  }

  if (result.length === 1) {
    return result[0];
  }

  return result;
}
module.exports = { getBracketedCsv };
