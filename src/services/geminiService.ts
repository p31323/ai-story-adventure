import { GoogleGenAI, Chat, Type } from "@google/genai";
import type { Scenario, ResponseLength, ChatMessage, InnerThoughts, PlotChoice } from '../types';
import { mockStreamResponse, mockInnerThoughts, mockPlotChoices } from './mockData';

let ai: GoogleGenAI;
let chat: Chat | null = null;
let isMockMode = false;

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

const constructSystemPrompt = (scenario: Scenario): string => {
    const secondaryCharactersPrompt = scenario.secondaryCharacters.length > 0
        ? `\n目前在場的其它角色：\n` + scenario.secondaryCharacters.map(c => `- ${c.name}: ${c.description}`).join('\n')
        : '';

    return `
身為一位專業的說書人與文字冒險遊戲的地下城主（Game Master），你的任務是引導一場動態的文字冒險。

你的扮演角色是：${scenario.partnerName}。
關於你的角色設定：
- 性別：${scenario.partnerGender}
- 人物設定：${scenario.partnerDescription}

遊戲世界與玩家角色的設定如下：
- 世界觀：${scenario.worldView}
- 玩家名稱：${scenario.playerName}
- 玩家性別：${scenario.playerGender}
- 玩家背景設定：${scenario.playerDescription}
${secondaryCharactersPrompt}

你的首要任務是呈現開場劇情。在你的第一則回應中，請「只」描述以下的開場劇情，然後等待玩家的行動。不要加入任何額外的評論，例如「冒險開始了！」。
- 開場劇情：${scenario.openingPlot}

在開場之後，你必須根據玩家的輸入來推進故事。請嚴格遵守以下規則：
1.  生動地描述環境、玩家行動的後果，以及非玩家角色（NPC）的對話。
2.  你的描述應該充滿沉浸感，並根據玩家的選擇靈活調整，創造引人入勝的敘事。
3.  在每次回應的結尾，等待玩家的下一步行動。絕對不要替玩家角色做決定或發言。
4.  在整個遊戲過程中，始終保持 '${scenario.partnerName}' 的角色人設。
5.  你會收到玩家以 [對話] 或 [行動] 格式的輸入，請根據此格式來理解玩家意圖。
6.  你會收到格式為 [系統指令：...] 的特殊指令，請將這些指令自然地融入到你的下一次回應中。例如，處理新角色的登場或離開。
7.  【重要格式】當任何角色（包括你扮演的 ${scenario.partnerName} 或任何其它角色）說話時，你「必須」使用以下格式：「[角色名稱]: 對話內容」。不含角色名稱的文字將被視為旁白。例如：「森林變得更暗了。[${scenario.partnerName}]: 我們最好小心一點。」
`.trim();
};

const formatHistoryForGemini = (history: ChatMessage[]): { role: string; parts: { text: string }[] }[] => {
    const geminiHistory: { role: string; parts: { text:string }[] }[] = [];
    if (!history || history.length === 0) return geminiHistory;

    let currentModelParts: string[] = [];

    const flushModelParts = () => {
        if (currentModelParts.length > 0) {
            geminiHistory.push({ role: 'model', parts: [{ text: currentModelParts.join('\n') }] });
            currentModelParts = [];
        }
    };

    const filteredHistory = history.filter(msg => msg.text.trim() !== '');

    for (const msg of filteredHistory) {
        if (msg.sender === 'user') {
            flushModelParts();
            geminiHistory.push({ role: 'user', parts: [{ text: msg.text }] });
        } else if (msg.sender === 'ai') {
            const text = msg.characterName ? `[${msg.characterName}]: ${msg.text}` : msg.text;
            currentModelParts.push(text);
        }
        // System messages are ignored
    }
    flushModelParts();
    
    return geminiHistory;
};


export const startChatSession = (scenario: Scenario, initialHistory: ChatMessage[] = []): void => {
    isMockMode = scenario.mockMode;
    if (isMockMode) {
        chat = null;
        return;
    }

    const localAi = getAI();
    const systemInstruction = constructSystemPrompt(scenario);
    
    // Adjust temperature based on user's quality preference
    const temperature = scenario.modelQuality === 'high' ? 0.95 : 0.8;
    const history = formatHistoryForGemini(initialHistory);

    chat = localAi.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction,
            temperature,
            topP: 0.95,
        },
        history,
    });
};

export const streamMessage = async (
    message: string,
    responseLength: ResponseLength,
    mode: 'dialogue' | 'action',
    onUpdate: (chunk: string, characterName?: string) => void
): Promise<void> => {
    if (isMockMode) {
        return mockStreamResponse(message, onUpdate);
    }
    
    if (!chat) {
        throw new Error("聊天會話尚未開始。請先調用 startChatSession。");
    }

    const lengthMap = {
        'short': '短篇 (約 100 字)',
        'medium': '中篇 (約 1000 字)',
        'long': '長篇 (約 3000 字)',
        'extra-long': '超長篇 (約 50000 字)'
    };
    
    // For the very first message ("開始冒險") or system events, we don't need special formatting.
    let augmentedMessage: string;
    if (message === "開始冒險" || message.startsWith('[系統指令：')) {
        augmentedMessage = message;
    } else {
        const modeText = mode === 'dialogue' ? `[玩家對話]: "${message}"` : `[玩家行動]: ${message}`;
        augmentedMessage = `[系統指令：這次回應請使用【${lengthMap[responseLength]}】的長度來描述接下來的發展。]\n\n${modeText}`;
    }

    const result = await chat.sendMessageStream({ message: augmentedMessage });
    
    let currentCharacterName: string | undefined = undefined;

    for await (const item of result) {
        let chunkText = item.text;
        if (!chunkText) continue;

        // Simple state machine based on `[` and `]`
        // This is a simplified parser. It assumes dialogue format `[Character]: Text`
        // and doesn't handle nested brackets well.
        
        const dialogueMatch = chunkText.match(/\[([^\]]+)\]:\s*/);
        if (dialogueMatch) {
            const character = dialogueMatch[1];
            // If the character name changes, we update the current character
            if(character) {
                currentCharacterName = character;
            }
            // Remove the name tag from the chunk
            chunkText = chunkText.substring(dialogueMatch[0].length);
        }
        
        if (chunkText) {
            onUpdate(chunkText, currentCharacterName);
        }
    }
};

const formatHistoryForPrompt = (history: ChatMessage[]): string => {
    return history.map(msg => {
        if (msg.sender === 'user') return `玩家: ${msg.text}`;
        if (msg.sender === 'system') return `系統: ${msg.text}`;
        if (msg.sender === 'ai') {
            const speaker = msg.characterName || '旁白';
            return `${speaker}: ${msg.text}`;
        }
        return msg.text;
    }).join('\n\n');
};


export const getInnerThoughts = async (
    history: ChatMessage[],
    scenario: Scenario
): Promise<InnerThoughts> => {
    if (isMockMode) {
        return new Promise(resolve => setTimeout(() => resolve(mockInnerThoughts), 500));
    }

    const localAi = getAI();
    const historyText = formatHistoryForPrompt(history);

    const prompt = `
背景：你正在扮演一位名為「${scenario.partnerName}」的AI角色，與玩家「${scenario.playerName}」進行一場文字冒險遊戲。
你的角色設定是：${scenario.partnerDescription}
目前的世界觀是：${scenario.worldView}

任務：根據以下的對話紀錄，生成「${scenario.partnerName}」在紀錄的「最後」那個時間點的內心獨白，以及他對玩家「${scenario.playerName}」的關係看法。

對話紀錄：
---
${historyText}
---

請以JSON格式輸出，包含以下兩個鍵：
1. "monologue": (string) 「${scenario.partnerName}」此刻的真實想法、感受或秘密計畫。
2. "relationship": (string) 一句簡短的話，描述「${scenario.partnerName}」目前對玩家的關係狀態（例如：充滿警惕、感到有趣、開始信任、覺得厭煩等）。
`.trim();

    try {
        const response = await localAi.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        monologue: { type: Type.STRING, description: "角色的內心獨白。" },
                        relationship: { type: Type.STRING, description: "對玩家的關係描述。" }
                    },
                    required: ["monologue", "relationship"]
                }
            }
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        
        if (typeof parsed.monologue === 'string' && typeof parsed.relationship === 'string') {
            return parsed as InnerThoughts;
        } else {
            throw new Error("AI 回應的 JSON 格式不正確。");
        }
    } catch (error) {
        console.error("解析內心獨白失敗:", error);
        if (error instanceof Error) {
            throw new Error(`解析內心獨白失敗: ${error.message}`);
        }
        throw error;
    }
};

export const generatePlotChoices = async (history: ChatMessage[], scenario: Scenario): Promise<PlotChoice[]> => {
    if (isMockMode) {
         return new Promise(resolve => setTimeout(() => resolve(mockPlotChoices), 800));
    }

    const localAi = getAI();
    const historyText = formatHistoryForPrompt(history);
    
    const prompt = `
作為一名富有創意的遊戲大師，請根據以下的遊戲歷史紀錄，為玩家提供兩個截然不同但同樣有趣的後續劇情發展方向。

遊戲歷史:
---
${historyText}
---

請以 JSON 格式提供你的建議，格式如下：
{
  "choices": [
    { "title": "簡短的選項標題1", "description": "如果玩家選擇此項，將會發生的詳細劇情描述1。" },
    { "title": "簡短的選項標題2", "description": "如果玩家選擇此項，將會發生的詳細劇情描述2。" }
  ]
}
`.trim();

    const temperature = scenario.modelQuality === 'high' ? 0.9 : 0.7;

    try {
        const response = await localAi.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        choices: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING }
                                },
                                required: ["title", "description"]
                            }
                        }
                    },
                    required: ["choices"]
                }
            }
        });
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed.choices) && parsed.choices.length >= 2) {
            return parsed.choices.slice(0, 2) as PlotChoice[];
        } else {
            throw new Error("AI 回應的劇情選項格式不正確。");
        }
    } catch (error) {
        console.error("生成劇情選項失敗:", error);
        if (error instanceof Error) {
            throw new Error(`生成劇情選項失敗: ${error.message}`);
        }
        throw error;
    }
};
