import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DOCUMENT_TEMPLATES } from "./templates";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- STEP 1: THE CLASSIFIER (NOW WITH RETRY LOGIC) ---
export async function classifyIntent(prompt: string): Promise<string> {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      intent: {
        type: Type.STRING,
        enum: [...Object.keys(DOCUMENT_TEMPLATES), "UNKNOWN"],
        description: "Determine the administrative document required based on the user's request.",
      },
    },
    required: ["intent"],
  };

  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a university administration router. Classify the user's request into the correct document type.",
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.0,
        },
      });

      let result = response.text;
      if (!result) return "UNKNOWN";
      result = result.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(result);
      
      return data.intent;

    } catch (error: any) {
      attempt++;
      console.warn(`[Classifier] Attempt ${attempt} failed: ${error.message || "Unknown error"}`);
      
      if (attempt >= maxRetries) {
        console.error("[Classifier] Max retries reached. Failing.");
        throw error;
      }
      
      console.warn(`[Classifier] Retrying in 2 seconds...`);
      await new Promise((res) => setTimeout(res, 2000)); // Wait 2 full seconds
    }
  }
  return "UNKNOWN";
}

// --- STEP 2: THE EXTRACTOR (ENHANCED RETRY LOGIC) ---
export async function extractDocumentData(prompt: string, requiredFields: string[]): Promise<any> {
  const propertiesSchema: Record<string, Schema> = {};
  requiredFields.forEach((field) => {
    propertiesSchema[field] = {
      type: Type.STRING,
      description: `Extract or infer the value for ${field}. If unknown, omit it.`,
    };
  });

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      extractedData: { type: Type.OBJECT, properties: propertiesSchema },
      missingFields: { type: Type.ARRAY, items: { type: Type.STRING } },
      clarificationQuestion: { type: Type.STRING },
    },
    required: ["extractedData", "missingFields"],
  };

  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: `Strict data extractor. Required fields: ${requiredFields.join(", ")}. Never hallucinate.`,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.0,
        },
      });

      let result = response.text;
      if (!result) throw new Error("Empty response");
      result = result.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(result);

    } catch (error: any) {
      attempt++;
      console.warn(`[Extractor] Attempt ${attempt} failed: ${error.message || "Unknown error"}`);
      
      if (attempt >= maxRetries) {
        console.error("[Extractor] Max retries reached. Failing.");
        throw error;
      }
      
      console.warn(`[Extractor] Retrying in 2 seconds...`);
      await new Promise((res) => setTimeout(res, 2000)); // Wait 2 full seconds
    }
  }
}