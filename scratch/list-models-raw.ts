import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY!;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e: any) {
    console.error("Fetch error:", e.message);
  }
}

listModels();
