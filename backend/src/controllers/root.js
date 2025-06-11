const { intentClassifier } = require("../service/intent");
const { basicReplyController } = require("./basicReply");
const { searchController } = require("./search");
const { url } = require("./url");
const rootController = async (req, res, next) => {
  const { query } = req.body;
  let answer;
  const intent = await intentClassifier(query);
  console.log(intent[0]);
  if (intent.indexOf("search") === -1 && intent.indexOf("url") === -1) {
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
  if (intent.indexOf("url") !== -1) {
    console.log("here");
    answer = await url(query);
    return res.json({
      response: answer,
    });
  }
};

module.exports = { rootController };
