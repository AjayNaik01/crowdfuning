const aiService = require("../services/ai.service");

module.exports.getReview = async (req, res) => {
    const code = req.body.code;

    if (!code) {
        return res.status(400).send("Prompt not provided.");
    }

    try {
        const response = await aiService(code, null); // No user context for code review
        res.send(response);
    } catch (error) {
        console.error("Controller error:", error.message || error);
        res.status(500).send("Internal server error.");
    }
};

module.exports.chat = async (req, res) => {
    const message = req.body.message;
    const user = req.user; // User object from authMiddleware

    if (!message) return res.status(400).send("Message not provided.");

    try {
        const response = await aiService(message, user); // Pass user to the service
        res.send({ response });
    } catch (error) {
        console.error("Chat controller error:", error.message || error);
        res.status(500).send("Internal server error.");
    }
};
