
import { GoogleGenAI, Type } from "@google/genai";
import { AIServiceType } from "../types";
import { checkIsOnPlatform } from "../lib/platform";

// Function to get AI instance with dynamic base URL
const getAIInstance = () => {
  return new GoogleGenAI({
    apiKey: process.env.API_KEY,
    httpOptions: {
      baseUrl: checkIsOnPlatform() ? `${location.origin}/api/llm/proxy` : undefined
    }
  });
};

export const processNoteWithAI = async (
  type: AIServiceType,
  content: string,
  title: string
): Promise<string> => {
  const ai = getAIInstance();
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
      prompt = `Suggest 3-5 keywords or tags for this note titled "${title}". Content:\n${content}. Return only the tags separated by commas.`;
      break;
    default:
      prompt = content;
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text || "";
  } catch (error: any) {
    if (error?.status === 401) {
      alert("当前应用未开放用户登录，无法调用大模型服务");
    }
    console.error("Gemini AI Error:", error);
    throw new Error("AI service failed to generate content.");
  }
};

export const getSmartTags = async (content: string, title: string): Promise<string[]> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        role: 'user',
        parts: [{
          text: `Analyze this note and provide exactly 3 relevant tags. Return as a JSON array of strings. 
          Title: ${title}
          Content: ${content}`
        }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    if (error?.status === 401) {
      alert("当前应用未开放用户登录，无法调用大模型服务");
    }
    return [];
  }
};
