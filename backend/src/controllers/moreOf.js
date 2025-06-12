const { getLast7Urls } = require("../utils/getLast7Messages");
const { searchController } = require("./search");

async function moreOf(query, chatId) {
  let history = await getLast7Urls(chatId);
  answer = await searchController(query, history[0], chatId);
  return answer;
}
module.exports = { moreOf };
