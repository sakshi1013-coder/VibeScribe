import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testGemini() {
  console.log("Checking Gemini API Key...");
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes("your-gemini")) {
    console.error("❌ Gemini API Key is missing or default.");
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, are you working?");
    const text = result.response.text();
    console.log("✅ Gemini API is working! Response:", text.substring(0, 50) + "...");
  } catch (error: any) {
    console.error("❌ Gemini API Error:", error.message || error);
  }
}

testGemini();
