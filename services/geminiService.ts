
import { GoogleGenAI, Type } from "@google/genai";
import { AIServiceType } from "../types";

// Corrected: Initialization must use process.env.API_KEY directly as a named parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const processNoteWithAI = async (
  type: AIServiceType,
  content: string,
  title: string
): Promise<string> => {
  const model = "gemini-3-flash-preview";
  
  let prompt = "";
  switch (type) {
    case AIServiceType.SUMMARIZE:
      prompt = `Please provide a concise summary of the following note titled "${title}":\n\n${content}`;
      break;
    case AIServiceType.EXPAND:
      prompt = `Please expand on the ideas in the following note titled "${title}", adding more details and professional depth:\n\n${content}`;
      break;
    case AIServiceType.FIX_GRAMMAR:
      prompt = `Please correct any grammar, spelling, or punctuation issues in this note, while keeping the original tone. Title: "${title}"\n\nContent:\n${content}`;
      break;
    case AIServiceType.SUGGEST_TAGS:
      // This usually returns JSON, so we handle it slightly differently in calling function if needed
      prompt = `Suggest 3-5 keywords or tags for this note titled "${title}". Content:\n${content}. Return only the tags separated by commas.`;
      break;
    default:
      prompt = content;
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    // Note: response.text is a property, not a method.
    return response.text || "";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw new Error("AI service failed to generate content.");
  }
};

export const getSmartTags = async (content: string, title: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this note and provide exactly 3 relevant tags. Return as a JSON array of strings. 
      Title: ${title}
      Content: ${content}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    
    // Note: response.text is a property, not a method.
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};
