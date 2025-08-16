require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GoogleGenerativeAI);

const getModel = (user) => {
    let systemInstruction = `You are a helpful, friendly chatbot for a crowdfunding platform.
You can answer questions about campaigns, donations, KYC, user accounts, and platform features.
If you don't know the answer, politely say so.
Use Markdown formatting (like lists, bold text, and links) to make your answers clear and easy to read.`;

    if (user && user.name) {
        systemInstruction = `You are a helpful, friendly chatbot for a crowdfunding platform.
You are speaking to a logged-in user named ${user.name}. Address them by their name when appropriate.
You can answer questions about their specific campaigns, donations, and account.
If you don't know the answer, politely say so.
Use Markdown formatting (like lists, bold text, and links) to make your answers clear and easy to read.`;
    }

    return genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemInstruction
    });
};


async function generativeContent(prompt, user) {
    try {
        const model = getModel(user); // Get model with user-specific instructions
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating content:", error.message || error);
        return "Something went wrong while generating a response.";
    }
}

module.exports = generativeContent;
