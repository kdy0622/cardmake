
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent, Situation, Target, MessageStyle, ImageStyle, QuoteTheme, QuoteOption } from "../types";

export const fetchQuoteOptions = async (theme: QuoteTheme): Promise<QuoteOption[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `주제: ${theme}. 가장 유명하고 깊이 있는 명언 5개와 그 명언자를 추출하세요.`,
    config: {
      systemInstruction: "당신은 세계적인 인문학자이자 디자이너입니다. 요청한 주제에 대해 가장 강력한 울림을 주는 명언 5개를 명언자와 함께 JSON 배열로 응답하세요. 명언자는 한국어로 적절히 번역하세요.",
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
  if (!text) throw new Error("Empty response from AI");
  return JSON.parse(text.trim());
};

export const generateGreetingContent = async (
  situation: Situation, 
  target: Target,
  sender: string,
  userPrompt: string,
  style: MessageStyle,
  quoteTheme: QuoteTheme,
  isQuoteOnly: boolean = false,
  selectedQuoteText?: string 
): Promise<GeneratedContent> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const now = new Date();
  
  const promptContent = isQuoteOnly 
    ? `선택된 명언: "${selectedQuoteText}". 이 명언에 어울리는 비주얼 테마와 대안 문구를 생성하세요.`
    : `작성자: ${sender}, 대상: ${target}, 상황: ${situation}, 스타일: ${style}. 추가요청: ${userPrompt}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: promptContent,
    config: {
      systemInstruction: `
        당신은 대한민국 최고의 리더십 메시지 전문가이자 20년차 베테랑 카피라이터입니다.
        현재 날짜(${now.toLocaleDateString()})를 반영하여 시적이고 전문적인 비즈니스 문장을 작성하세요.
        - mainMessage: ${selectedQuoteText ? `"${selectedQuoteText}"를 그대로 사용하세요.` : "3-5줄의 세련된 비즈니스 인사말."}
        - alternativeMessage: 다른 느낌의 대안 문구.
        - bgTheme: 이 문구의 영혼을 시각화할 수 있는 구체적인 이미지 키워드 (영어 위주). 
        JSON으로 응답하세요.
      `,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mainMessage: { type: Type.STRING },
          alternativeMessage: { type: Type.STRING },
          wiseSayingOptions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                author: { type: Type.STRING }
              }
            }
          },
          bgTheme: { type: Type.STRING },
          recommendedSeason: { type: Type.STRING }
        },
        required: ["mainMessage", "alternativeMessage", "bgTheme", "recommendedSeason"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No text response from Gemini");
  return { ...JSON.parse(text.trim()), sender, situation, target };
};

export const generateCardImage = async (
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
  // Use pro model for high quality as per instructions
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const promptText = `
    Create a professional high-end cinematic background.
    Theme: ${theme}. 
    Style: ${imageStylePreset || "Cinematic"} ${imageType || "Nature"}.
    Visual Direction: ${designRequirement}.
    Context: ${messageContext || ""}.
    CRITICAL: NO TEXT, NO LOGOS. Optimized for text overlay.
  `;

  const parts: any[] = [{ text: promptText }];
  if (referenceImage) {
    const [header, data] = referenceImage.split(',');
    const mimeType = header.split(':')[1].split(';')[0];
    parts.push({ inlineData: { data, mimeType } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts },
    config: { imageConfig: { aspectRatio, imageSize: "1K" } }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Image part not found in response");
};

export const generateCardVideo = async (
  theme: string,
  designRequirement: string,
  referenceImage?: string,
  aspectRatio: '16:9' | '9:16' = '16:9',
  messageContext?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const promptText = `A cinematic, high-end 4K video background. Theme: ${theme}. Visuals: ${designRequirement}. Slow camera movement. No text.`;

  const videoConfig: any = {
    model: 'veo-3.1-fast-generate-preview',
    prompt: promptText,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio
    }
  };

  if (referenceImage) {
    const [header, data] = referenceImage.split(',');
    const mimeType = header.split(':')[1].split(';')[0];
    videoConfig.image = { imageBytes: data, mimeType };
  }

  let operation = await ai.models.generateVideos(videoConfig);
  
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed");
  
  return `${downloadLink}&key=${process.env.API_KEY}`;
};
