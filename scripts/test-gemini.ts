import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const key = process.env.GEMINI_API_KEY?.trim();
  console.log("GEMINI_API_KEY set:", Boolean(key));
  console.log("key prefix:", key ? `${key.slice(0, 6)}…` : "(missing)");

  if (!key) {
    console.error("No GEMINI_API_KEY in .env.local");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey: key });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL?.trim() || "gemini-flash-latest",
    contents:
      'Reply with JSON only: {"ok":true,"message":"gemini works"}. No markdown.',
  });

  console.log("raw response:", response.text);
  console.log("SUCCESS: Gemini API is reachable with this key.");
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
