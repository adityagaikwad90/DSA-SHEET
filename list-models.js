import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const key = process.env.VITE_GEMINI_API_KEY;
    if (!key) return console.log("No key");

    // Note: The SDK unfortunately doesn't export a direct listModels method on the client easily in all versions,
    // but we can try the direct fetch or check if there's a manager.
    // Actually, let's try a direct REST call to debug if SDK is obscuring things.

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            const chatModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
            console.log("Chat Models:", chatModels.map(m => m.name));
        } else {
            console.log("No models found or error:", data);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
