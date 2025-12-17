import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

async function testGemini() {
    try {
        const key = process.env.VITE_GEMINI_API_KEY;
        console.log("Testing Gemini Key...", key ? "Found" : "Not Found");

        if (!key) {
            console.error("No API key found in .env");
            return;
        }

        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = "Hello! Are you working?";
        console.log("Sending prompt:", prompt);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("Success! Response:", text);
    } catch (error) {
        console.error("Error testing Gemini:", error);
    }
}

testGemini();
