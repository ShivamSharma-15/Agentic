const { intentClassifier } = require("../service/intent");
const { basicReplyController } = require("./basicReply");
const { searchController } = require("./search");
const rootController = async (req, res, next) => {
  const { query } = req.body;
  let answer;
  const intent = await intentClassifier(query);
  if (intent.indexOf("search") === -1) {
    answer = await basicReplyController(intent);
    return res.json({
      response: answer,
    });
  }
  if (intent.indexOf("search") !== -1) {
    answer = await searchController(query);
    return res.json({
      response: answer,
    });
  }
  if (intent.indexOf("moreOf") !== -1) {
  }
};

module.exports = { rootController };
