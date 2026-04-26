import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
     // The SDK doesn't have a direct listModels on genAI in all versions, 
     // but we can try to fetch a known one or just try 'gemini-1.5-flash' again with a fallback.
     console.log("Trying gemini-1.5-flash...");
     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
     const result = await model.generateContent("test");
     console.log("Success with gemini-1.5-flash");
  } catch (e: any) {
    console.log("Error with gemini-1.5-flash:", e.message);
    console.log("Trying gemini-pro...");
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent("test");
      console.log("Success with gemini-pro");
    } catch (e2: any) {
      console.log("Error with gemini-pro:", e2.message);
    }
  }
}

listModels();
