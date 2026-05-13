const { logger } = require("../utils/logger");

const freeAIResponse = (message) => {
  const msg = message.toLowerCase();
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
    return "Hello! I am ConnectX AI. How can I help you today? I support English, Hindi and Telugu!";
  } else if (msg.includes("how are you")) {
    return "I am doing great! Ready to help you with anything. What do you need?";
  } else if (msg.includes("your name") || msg.includes("who are you")) {
    return "I am ConnectX AI, your personal assistant built into ConnectX Chat! I can help you draft messages, translate text, and answer questions.";
  } else if (msg.includes("translate") && msg.includes("telugu")) {
    return "Here is your translation in Telugu! For example: Hello = నమస్కారం, How are you = మీరు ఎలా ఉన్నారు, Thank you = ధన్యవాదాలు";
  } else if (msg.includes("translate") && msg.includes("hindi")) {
    return "Here is your translation in Hindi! For example: Hello = नमस्ते, How are you = आप कैसे हैं, Thank you = धन्यवाद";
  } else if (msg.includes("feature") || msg.includes("what can you do")) {
    return "ConnectX has amazing features: Real-time chat, Group chat, AI Assistant, Voice and Video calls, Stories, File sharing, Multi-language support and much more!";
  } else if (msg.includes("joke")) {
    return "Why do programmers prefer dark mode? Because light attracts bugs! 😄";
  } else if (msg.includes("thank")) {
    return "You are welcome! Happy to help you anytime! 😊";
  } else if (msg.includes("bye") || msg.includes("goodbye")) {
    return "Goodbye! Have a wonderful day! Come back anytime you need help! 👋";
  } else if (msg.includes("weather")) {
    return "I cannot check real-time weather, but I suggest checking weather.com for accurate forecasts!";
  } else if (msg.includes("help")) {
    return "I can help you with: drafting messages, translating text (English, Hindi, Telugu), answering questions, and chatting! What do you need?";
  } else if (msg.includes("draft") || msg.includes("write") || msg.includes("message")) {
    return "Sure! I can help you draft a message. Please tell me: Who is it for? What is the topic? Should it be formal or casual?";
  } else if (msg.includes("summarize") || msg.includes("summary")) {
    return "Please paste the text you want me to summarize and I will give you a brief summary!";
  } else {
    return "That is interesting! I am ConnectX AI and I am here to help you. You can ask me to translate text, draft messages, tell jokes, or just chat. What would you like to do?";
  }
};

exports.aiChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });
    const reply = freeAIResponse(message);
    res.json({ success: true, reply });
  } catch (error) {
    logger.error("AI Chat error: " + error.message);
    res.status(500).json({ error: "AI service temporarily unavailable" });
  }
};

exports.smartReply = async (req, res) => {
  try {
    res.json({ success: true, suggestions: ["OK! Got it!", "Thanks!", "Sure, sounds good!"] });
  } catch (error) {
    res.json({ success: true, suggestions: ["OK!", "Thanks!", "Sure!"] });
  }
};

exports.translate = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    const translations = {
      hi: "हिंदी अनुवाद: " + text,
      te: "తెలుగు అనువాదం: " + text,
      en: text,
    };
    res.json({ success: true, translation: translations[targetLanguage] || text });
  } catch (error) {
    res.status(500).json({ error: "Translation failed" });
  }
};