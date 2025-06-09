const basicReplyController = async function (intent) {
  if (intent.indexOf("greetings") !== -1 && intent.indexOf("noreply") === -1) {
    answer = "Hi there, thank you for contacting us\nHow can I help you today";
    return answer;
  } else {
    answer =
      "Sorry but I cannot answer that right now. Please feel free to ask something else";
    return answer;
  }
};
module.exports = { basicReplyController };
