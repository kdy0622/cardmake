
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent, Situation, Target, MessageStyle, ImageStyle, QuoteTheme, QuoteOption } from "../types";

export const fetchQuoteOptions = async (apiKey: string, theme: QuoteTheme): Promise<QuoteOption[]> => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `주제: ${theme}. 비즈니스 리더십과 성공에 관련된 깊이 있는 명언 5개와 그 저자를 추출하세요.`,
    config: {
      systemInstruction: "당신은 세계적인 인문학자입니다. 요청한 주제에 대해 영감을 주는 명언 5개를 명언자와 함께 JSON 배열로 응답하세요.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            author: { type: Type.STRING }
          },
          required: ["text", "author"]
        }
      }
    }
  });
  
  const text = response.text;
  if (!text) throw new Error("API 응답이 비어있습니다.");
  return JSON.parse(text.trim());
};

export const generateGreetingContent = async (
  apiKey: string,
  situation: Situation, 
  target: Target,
  sender: string,
  userPrompt: string,
  style: MessageStyle,
  quoteTheme: QuoteTheme,
  isQuoteOnly: boolean = false,
  selectedQuoteText?: string 
): Promise<GeneratedContent> => {
  const ai = new GoogleGenAI({ apiKey });
  const now = new Date();
  
  const promptContent = isQuoteOnly 
    ? `선택된 명언: "${selectedQuoteText}". 이 명언에 어울리는 비주얼 테마와 대안 문구를 생성하세요.`
    : `작성자: ${sender}, 대상: ${target}, 상황: ${situation}, 스타일: ${style}. 추가요청: ${userPrompt}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: promptContent,
    config: {
      systemInstruction: `당신은 대한민국 최고의 리더십 메시지 전문가입니다. 현재 날짜(${now.toLocaleDateString()})를 반영하여 품격 있는 비즈니스 문장을 작성하세요.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mainMessage: { type: Type.STRING },
          alternativeMessage: { type: Type.STRING },
          bgTheme: { type: Type.STRING },
          recommendedSeason: { type: Type.STRING }
        },
        required: ["mainMessage", "alternativeMessage", "bgTheme", "recommendedSeason"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("문구 생성에 실패했습니다.");
  const parsed = JSON.parse(text.trim());
  return { ...parsed, sender, situation, target, wiseSayingOptions: [] };
};

export const generateCardImage = async (
  apiKey: string,
  theme: string, 
  style: ImageStyle, 
  designRequirement: string,
  referenceImage?: string,
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' = '1:1',
  imageType?: string,
  imageStylePreset?: string,
  refinementText?: string,
  messageContext?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  
  const promptText = `High-end cinematic professional background. Theme: ${theme}. Style: ${imageStylePreset || "Cinematic"}. Visual Direction: ${designRequirement}. NO TEXT.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: promptText }] },
    config: { imageConfig: { aspectRatio, imageSize: "1K" } }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("이미지 데이터가 생성되지 않았습니다.");
};
