import React, { useState, useCallback, useEffect } from 'react';
import { SetupForm } from './components/SetupForm';
import GameScreen from './components/GameScreen';
import SaveLoadModal from './components/SaveLoadModal';
import CharacterInfoModal from './components/CharacterInfoModal';
import { startChatSession, streamMessage, getInnerThoughts, generatePlotChoices } from './services/geminiService';
import { loadGames, saveGame, deleteGame } from './services/storageService';
import { parseGeminiError } from './services/errorService';
import type { Scenario, ChatMessage, ResponseLength, InnerThoughts, SecondaryCharacter, PlotChoice, SaveData } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';

const getApiKey = (): string | undefined => (window as any).GEMINI_API_KEY;

const App: React.FC = () => {
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'loading'>('setup');

  const [isPeeking, setIsPeeking] = useState(false);
  const [innerThoughts, setInnerThoughts] = useState<InnerThoughts | null>(null);
  const [plotChoices, setPlotChoices] = useState<PlotChoice[]>([]);
  const [isGeneratingChoices, setIsGeneratingChoices] = useState(false);
  const [isGoingBack, setIsGoingBack] = useState(false);

  // State for Save/Load feature
  const [saveSlots, setSaveSlots] = useState<(SaveData | null)[]>([]);
  const [modalMode, setModalMode] = useState<'save' | 'load' | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  // State for Character Info Modal
  const [isInfoModalOpen, setInfoModalOpen] = useState(false);

  useEffect(() => {
    if (!getApiKey()) {
      setApiKeyError("警告：未偵測到 API 金鑰。AI 功能將無法使用。您可以啟用下方的「模擬模式」來測試應用程式介面。");
    }
    setSaveSlots(loadGames());
  }, []);

  const handleStartGame = useCallback(async (newScenario: Scenario) => {
    setGamePhase('loading');
    setScenario(newScenario);
    
    try {
      startChatSession(newScenario);
      const initialMessageId = Date.now().toString();
      
      setChatHistory([]);
      setChatHistory(prev => [...prev, { id: initialMessageId, sender: 'ai', text: '' }]);
      
      await streamMessage("開始冒險", 'short', 'action', (chunk, characterName) => {
        setChatHistory(prev => prev.map(msg => 
          msg.id === initialMessageId ? { ...msg, text: msg.text + chunk, characterName: msg.characterName ?? characterName } : msg
        ));
      });
      
      setGamePhase('playing');
    } catch (error) {
      console.error("Failed to start game:", error);
      const friendlyError = parseGeminiError(error);
      setApiKeyError(`遊戲開始失敗: ${friendlyError}`);
      setGamePhase('setup');
    }
  }, []);

  const handleSendMessage = useCallback(async (message: string, responseLength: ResponseLength, mode: 'dialogue' | 'action') => {
    if (!message.trim() || !scenario) return;

    setPlotChoices([]);
    const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: message };
    
    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);

    const messageIds = {
        narration: `narration-${Date.now()}`,
        dialogue: `dialogue-${Date.now()}`
    };

    try {
        await streamMessage(message, responseLength, mode, (chunk, characterName) => {
            setChatHistory(prev => {
                const newHistory = [...prev];
                if (characterName) {
                    const msgId = messageIds.dialogue;
                    const index = newHistory.findIndex(m => m.id === msgId);
                    if (index > -1) {
                        newHistory[index] = { ...newHistory[index], text: newHistory[index].text + chunk };
                    } else {
                        // Correct the character name if the AI deviates from the known characters.
                        const knownNames = [scenario.partnerName, ...(scenario.secondaryCharacters || []).map(c => c.name)];
                        const finalCharacterName = knownNames.includes(characterName) ? characterName : scenario.partnerName;
                        newHistory.push({ id: msgId, sender: 'ai', text: chunk, characterName: finalCharacterName });
                    }
                } else {
                    const msgId = messageIds.narration;
                    const index = newHistory.findIndex(m => m.id === msgId);
                    if (index > -1) {
                        newHistory[index] = { ...newHistory[index], text: newHistory[index].text + chunk };
                    } else {
                         newHistory.push({ id: msgId, sender: 'ai', text: chunk });
                    }
                }
                return newHistory;
            });
        });
    } catch (error) {
        console.error("Failed to send message:", error);
        const friendlyError = parseGeminiError(error);
        const errorText = `發生錯誤: ${friendlyError}`;
        const errorMsg: ChatMessage = { id: `error-${Date.now()}`, sender: 'system', text: errorText };
        setChatHistory(prev => [...prev, errorMsg]);
    } finally {
        setIsLoading(false);
    }
  }, [scenario]);

  const handlePeekThoughts = useCallback(async (messageId: string) => {
    if (!scenario || isPeeking) return;
    setIsPeeking(true);
    setInnerThoughts(null); // Clear previous thoughts
    
    const messageIndex = chatHistory.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1 && messageId !== 'latest') {
        console.error("Message not found for peeking");
        setIsPeeking(false);
        return;
    }
    const historySnapshot = messageId === 'latest' 
        ? chatHistory 
        : chatHistory.slice(0, messageIndex + 1);

    try {
      const thoughts = await getInnerThoughts(historySnapshot, scenario);
      setInnerThoughts(thoughts);
    } catch (error) {
      console.error("Failed to peek thoughts:", error);
      const friendlyError = parseGeminiError(error);
      setInnerThoughts({
        monologue: `窺探失敗: ${friendlyError}`,
        relationship: "未知"
      });
    } finally {
      setIsPeeking(false);
    }
  }, [chatHistory, scenario, isPeeking]);
  
  const handleGenerateChoices = useCallback(async () => {
    if (!scenario) return;
    setIsGeneratingChoices(true);
    setPlotChoices([]);
    try {
        const choices = await generatePlotChoices(chatHistory, scenario);
        setPlotChoices(choices);
    } catch (error) {
        console.error("Failed to generate plot choices:", error);
        const friendlyError = parseGeminiError(error);
        setPlotChoices([
            { title: "生成選項時發生錯誤", description: friendlyError },
            { title: "手動輸入", description: "或者，您可以忽略此建議並手動輸入您的下一個行動。" }
        ]);
    } finally {
        setIsGeneratingChoices(false);
    }
  }, [chatHistory, scenario]);

  const handleAddCharacter = useCallback((name: string, description: string) => {
    if (!scenario) return;

    const newCharacter: SecondaryCharacter = { id: Date.now().toString(), name, description };
    setScenario(prev => prev ? { ...prev, secondaryCharacters: [...prev.secondaryCharacters, newCharacter] } : null);

    const eventText = `系統事件：一位名叫「${name}」的新角色出現了。角色描述：${description}。`;
    const eventMessage: ChatMessage = { id: Date.now().toString(), sender: 'system', text: eventText };
    setChatHistory(prev => [...prev, eventMessage]);
    
    handleSendMessage(`[系統指令：將新角色「${name}」的登場無縫融入劇情。]`, 'short', 'action');
  }, [scenario, handleSendMessage]);

  const handleRemoveCharacter = useCallback((id: string) => {
    if (!scenario) return;
    const characterToRemove = scenario.secondaryCharacters.find(c => c.id === id);
    if (!characterToRemove) return;
    
    setScenario(prev => prev ? { ...prev, secondaryCharacters: prev.secondaryCharacters.filter(c => c.id !== id) } : null);
    
    const eventText = `系統事件：角色「${characterToRemove.name}」已經離開或消失了。`;
    const eventMessage: ChatMessage = { id: Date.now().toString(), sender: 'system', text: eventText };
    setChatHistory(prev => [...prev, eventMessage]);

    handleSendMessage(`[系統指令：在劇情中反映角色「${characterToRemove.name}」的缺席。]`, 'short', 'action');
  }, [scenario, handleSendMessage]);

  const handleGoBack = useCallback(async () => {
    if (!scenario || isGoingBack || isLoading) return;

    let lastUserMessageIndex = -1;
    for (let i = chatHistory.length - 1; i >= 0; i--) {
      if (chatHistory[i].sender === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }

    if (lastUserMessageIndex === -1) {
      return;
    }

    setIsGoingBack(true);

    try {
      const newHistory = chatHistory.slice(0, lastUserMessageIndex);
      startChatSession(scenario, newHistory);
      setChatHistory(newHistory);
      setPlotChoices([]);

    } catch (error) {
      console.error("Failed to go back:", error);
      const friendlyError = parseGeminiError(error);
      const errorMsg: ChatMessage = { id: `error-${Date.now()}`, sender: 'system', text: `回到上一步失敗: ${friendlyError}` };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsGoingBack(false);
    }
  }, [chatHistory, scenario, isGoingBack, isLoading]);

  const handleReset = () => {
    if (window.confirm("您確定要重設遊戲嗎？目前的進度將會遺失。")) {
        setScenario(null);
        setChatHistory([]);
        setGamePhase('setup');
        setInnerThoughts(null);
        setPlotChoices([]);
        if (getApiKey()) {
          setApiKeyError(null);
        }
    }
  };

  const handleToggleInfoModal = useCallback(() => {
    setInfoModalOpen(prev => {
        const willBeOpen = !prev;
        if (willBeOpen) {
            handlePeekThoughts('latest');
        } else {
            setInnerThoughts(null); // Clear thoughts when closing
        }
        return willBeOpen;
    });
  }, [handlePeekThoughts]);
  
  // --- Save/Load Handlers ---
  const handleSaveGame = useCallback((slotIndex: number) => {
    if (!scenario) return;
    setIsModalLoading(true);
    const data: SaveData = {
      scenario,
      chatHistory,
      savedAt: new Date().toISOString(),
    };
    const updatedSlots = saveGame(slotIndex, data);
    setSaveSlots(updatedSlots);
    setIsModalLoading(false);
    setModalMode(null); // Close modal on success
  }, [scenario, chatHistory]);
  
  const handleLoadGame = useCallback((slotIndex: number) => {
    const slotData = saveSlots[slotIndex];
    if (!slotData) return;

    setIsModalLoading(true);
    setGamePhase('loading');
    setModalMode(null);

    setTimeout(() => {
        setScenario(slotData.scenario);
        setChatHistory(slotData.chatHistory);
        setPlotChoices([]);
        setInnerThoughts(null);

        try {
            startChatSession(slotData.scenario, slotData.chatHistory);
            setGamePhase('playing');
        } catch (error) {
            console.error("Failed to load game session:", error);
            const friendlyError = parseGeminiError(error);
            setApiKeyError(`遊戲讀取失敗: ${friendlyError}`);
            setGamePhase('setup');
        } finally {
            setIsModalLoading(false);
        }
    }, 500); // Give a small delay for the loading screen to be noticeable
  }, [saveSlots]);

  const handleDeleteGame = useCallback((slotIndex: number) => {
    setIsModalLoading(true);
    const updatedSlots = deleteGame(slotIndex);
    setSaveSlots(updatedSlots);
    setIsModalLoading(false);
  }, []);

  const renderContent = () => {
    switch (gamePhase) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center h-screen animate-fadeIn">
            <LoadingSpinner />
            <p className="mt-4 text-lg text-slate-300">正在建構您的史詩世界...</p>
          </div>
        );
      case 'playing':
        if (scenario) {
          return (
            <GameScreen
              scenario={scenario}
              chatHistory={chatHistory}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onReset={handleReset}
              onPeekThoughts={handlePeekThoughts}
              onAddCharacter={handleAddCharacter}
              onRemoveCharacter={handleRemoveCharacter}
              innerThoughts={innerThoughts}
              onCloseThoughts={() => setInnerThoughts(null)}
              isPeeking={isPeeking}
              plotChoices={plotChoices}
              onGenerateChoices={handleGenerateChoices}
              isGeneratingChoices={isGeneratingChoices}
              onGoBack={handleGoBack}
              isGoingBack={isGoingBack}
              canGoBack={chatHistory.some(msg => msg.sender === 'user')}
              onOpenSaveModal={() => setModalMode('save')}
              onToggleInfoModal={handleToggleInfoModal}
            />
          );
        }
        return null;
      case 'setup':
      default:
        return (
            <SetupForm 
                onStartGame={handleStartGame} 
                apiKeyError={apiKeyError}
                onOpenLoadModal={() => setModalMode('load')}
                hasSaveData={saveSlots.some(s => s !== null)}
            />
        );
    }
  };

  return (
    <main className="font-sans">
      {renderContent()}
      {modalMode && (
        <SaveLoadModal
          mode={modalMode}
          slots={saveSlots}
          onClose={() => setModalMode(null)}
          onSave={handleSaveGame}
          onLoad={handleLoadGame}
          onDelete={handleDeleteGame}
          isLoading={isModalLoading}
        />
      )}
      {isInfoModalOpen && scenario && (
        <CharacterInfoModal
            scenario={scenario}
            innerThoughts={innerThoughts}
            isLoading={isPeeking}
            onClose={handleToggleInfoModal}
        />
      )}
    </main>
  );
};

export default App;
