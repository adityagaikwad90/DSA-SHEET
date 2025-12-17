import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.VITE_OPENAI_API_KEY,
});

async function testKey() {
    try {
        console.log("Testing API key...", process.env.VITE_OPENAI_API_KEY ? "Found" : "Not Found");
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: "Hello" }],
            model: "gpt-3.5-turbo",
        });
        console.log("Success! Response:", completion.choices[0].message.content);
    } catch (error) {
        console.error("Error:", error);
    }
}

testKey();
