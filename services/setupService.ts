
import { GoogleGenAI, Type } from "@google/genai";
import type { SetupFieldType } from '../types.ts';
import { mockSetupDetails, mockImageURL, mockImagePrompt } from './mockData.ts';

let ai: GoogleGenAI;

// A helper to safely get the API key from the window object
const getApiKey = (): string | undefined => (window as any).GEMINI_API_KEY;

const getAI = (): GoogleGenAI => {
    if (!ai) {
        const apiKey = getApiKey();
        if (!apiKey) {
            throw new Error("API 金鑰未設定。請確保 /config.js 已正確載入。");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

export const generateImage = async (prompt: string, isMock: boolean = false): Promise<string> => {
    if (isMock) {
        return new Promise(resolve => setTimeout(() => resolve(mockImageURL), 1000));
    }
    const localAi = getAI();
    try {
        const response = await localAi.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '9:16',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("AI did not return an image.");
        }
    } catch (error) {
        console.error("Error generating image:", error);
        throw error;
    }
};

export const generateImageFromContext = async (
    worldView: string,
    partnerDescription: string,
    openingPlot: string,
    isMock: boolean = false
): Promise<{ prompt: string, image: string }> => {
    if (isMock) {
        return new Promise(resolve => setTimeout(() => resolve({ prompt: mockImagePrompt, image: mockImageURL }), 1200));
    }
    const localAi = getAI();
    const promptGenPrompt = `
    Based on the following text adventure game settings, create a single, concise, and visually descriptive prompt for an AI image generation model. The prompt should capture the essence of the world, atmosphere, and the opening scene. Do not add any conversational text, just the prompt itself. The prompt should be in English to maximize compatibility with image models.

    - World View: ${worldView}
    - Partner/Narrator: ${partnerDescription}
    - Opening Plot: ${openingPlot}

    Image Generation Prompt:
    `.trim();

    const textResponse = await localAi.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptGenPrompt,
        config: {
            temperature: 0.7,
        }
    });

    const generatedPrompt = textResponse.text.trim();
    if (!generatedPrompt) {
        throw new Error("Failed to generate an image prompt from context.");
    }
    
    const image = await generateImage(generatedPrompt, isMock);
    
    return { prompt: generatedPrompt, image };
};


const getPromptAndSchema = (type: SetupFieldType) => {
    switch (type) {
        case 'player':
            return {
                prompt: "為一個奇幻或科幻背景的文字冒險遊戲，生成一位獨特的主角。請提供名字、性別和一段引人入勝的人物描述。",
                schema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "角色名字" },
                        gender: { type: Type.STRING, description: "角色性別" },
                        description: { type: Type.STRING, description: "角色背景、外觀、個性的詳細描述" }
                    },
                    required: ["name", "gender", "description"]
                }
            };
        case 'partner':
            return {
                prompt: "為一個奇幻或科幻背景的文字冒險遊戲，生成一位有趣的夥伴或敘事者。這個角色將會引導玩家。請提供名字/稱呼、性別和一段獨特的人物描述。",
                schema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "夥伴的名字或稱呼" },
                        gender: { type: Type.STRING, description: "夥伴的性別" },
                        description: { type: Type.STRING, description: "夥伴的背景、外觀、個性的詳細描述" }
                    },
                    required: ["name", "gender", "description"]
                }
            };
        case 'world':
            return {
                prompt: "為一個文字冒險遊戲，設計一個引人入勝的世界。請提供一段宏大的世界觀描述，以及一個具體的、能立即展開故事的開場劇情。",
                schema: {
                    type: Type.OBJECT,
                    properties: {
                        worldView: { type: Type.STRING, description: "遊戲世界的宏觀設定，包括規則、歷史、氛圍等" },
                        openingPlot: { type: Type.STRING, description: "一個具體的、懸念十足的開場劇情" }
                    },
                    required: ["worldView", "openingPlot"]
                }
            };
        default:
            throw new Error("無效的生成類型");
    }
}

export const generateSetupDetails = async (type: SetupFieldType, isMock: boolean = false): Promise<any> => {
    if (isMock) {
        return new Promise(resolve => setTimeout(() => resolve(mockSetupDetails(type)), 500));
    }
    const localAi = getAI();
    const { prompt, schema } = getPromptAndSchema(type);

    try {
        const response = await localAi.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.9
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error(`在生成 ${type} 時發生錯誤:`, error);
        throw error;
    }
};