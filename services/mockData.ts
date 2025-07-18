
import type { SetupFieldType, InnerThoughts, PlotChoice } from '../types.ts';

// MOCK RESPONSES
export const mockImageURL = 'https://picsum.photos/seed/mock/1920/1080';
export const mockImagePrompt = 'a vast and beautiful fantasy landscape, generated by mock mode';

export const mockSetupDetails = (type: SetupFieldType) => {
    switch (type) {
        case 'player':
            return {
                name: '模擬角色',
                gender: '其它',
                description: '這是在模擬模式下生成的角色，沒有連接到 AI。',
            };
        case 'partner':
            return {
                name: '模擬夥伴',
                gender: '其它',
                description: '一個友善的模擬夥伴，引導您完成測試。',
            };
        case 'world':
            return {
                worldView: '一個用於測試的模擬世界。',
                openingPlot: '您在一個明亮的房間裡醒來，看到一行文字寫著：「歡迎來到模擬模式」。',
            };
    }
};

export const mockInnerThoughts: InnerThoughts = {
  monologue: '（模擬的內心獨白：我想知道模擬模式是否運作正常。）',
  relationship: '模擬的關係：中立',
};

export const mockPlotChoices: PlotChoice[] = [
  {
    title: "模擬選項一",
    description: "這是一個模擬的劇情選項，選擇它來繼續測試流程。",
  },
  {
    title: "模擬選項二",
    description: "這是另一個模擬的劇情選項，提供不同的測試路徑。",
  }
];

export const mockStreamResponse = (
    message: string,
    onUpdate: (chunk: string, characterName?: string) => void
): Promise<void> => {
    return new Promise(resolve => {
        let narration = '';
        let dialogue = '';
        const characterName = '模擬夥伴';

        if (message === "開始冒險") {
             narration = '歡迎來到模擬模式！這是一個測試用的開場劇情。\n';
             dialogue = '你的面前有兩條路，一條通往森林，一條通往山脈。你會怎麼做？';
        } else {
             narration = `（模擬旁白）你選擇了「${message}」。\n`;
             dialogue = `這是一個很好的測試選擇！故事繼續發展...`;
        }
        
        const streamPart = (text: string, charName?: string, callback?: () => void) => {
            const words = text.split('');
            let i = 0;
            if (words.length === 0) {
                if(callback) callback();
                return;
            }
            const interval = setInterval(() => {
                if (i < words.length) {
                    onUpdate(words[i], charName);
                    i++;
                } else {
                    clearInterval(interval);
                    if (callback) callback();
                }
            }, 25);
        };

        // Stream narration, then dialogue, then resolve
        streamPart(narration, undefined, () => {
            streamPart(dialogue, characterName, resolve);
        });
    });
};