
import React, { useState, useRef, useEffect } from 'react';
import { Scenario, ChatMessage, ResponseLength, InnerThoughts, PlotChoice } from '../types.ts';
import ChatBubble from './ChatBubble.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { SendIcon, ResetIcon, UsersIcon, MagicWandIcon, UndoIcon, ArrowUpTrayIcon, UserCircleIcon } from './IconComponents.tsx';
import InnerThoughtsModal from './InnerThoughtsModal.tsx';
import CharacterManager from './CharacterManager.tsx';


interface GameScreenProps {
  scenario: Scenario;
  chatHistory: ChatMessage[];
  onSendMessage: (message: string, responseLength: ResponseLength, mode: 'dialogue' | 'action') => Promise<void>;
  isLoading: boolean;
  onReset: () => void;
  onPeekThoughts: (messageId: string) => void;
  onAddCharacter: (name: string, description: string) => void;
  onRemoveCharacter: (id: string) => void;
  innerThoughts: InnerThoughts | null;
  onCloseThoughts: () => void;
  isPeeking: boolean;
  plotChoices: PlotChoice[];
  onGenerateChoices: () => void;
  isGeneratingChoices: boolean;
  onGoBack: () => void;
  isGoingBack: boolean;
  canGoBack: boolean;
  onOpenSaveModal: () => void;
  onToggleInfoModal: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ 
    scenario, chatHistory, onSendMessage, isLoading, onReset,
    onPeekThoughts, onAddCharacter, onRemoveCharacter,
    innerThoughts, onCloseThoughts, isPeeking,
    plotChoices, onGenerateChoices, isGeneratingChoices,
    onGoBack, isGoingBack, canGoBack, onOpenSaveModal,
    onToggleInfoModal
}) => {
  const [input, setInput] = useState('');
  const [responseLength, setResponseLength] = useState<ResponseLength>('short');
  const [inputMode, setInputMode] = useState<'action' | 'dialogue'>('action');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isCharacterModalOpen, setCharacterModalOpen] = useState(false);
  const MAX_INPUT_LENGTH = 1000;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, plotChoices]);
  
  useEffect(() => {
    if(isLoading) {
      scrollToBottom();
    }
  }, [isLoading]);


  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input, responseLength, inputMode);
      setInput('');
    }
  };
  
  const handleSelectChoice = (choice: PlotChoice) => {
    if (isLoading) return;
    onSendMessage(choice.description, responseLength, 'action');
  };

  return (
    <>
      <div
        className="h-screen w-screen bg-cover bg-center bg-no-repeat animate-fadeIn"
        style={{ backgroundImage: `url(${scenario.backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        
        <div className="relative h-full flex flex-col max-w-4xl mx-auto px-4 py-4">
          
          <header className="flex-shrink-0 flex items-center justify-between pb-4 border-b border-white/10">
             <div>
               <h1 className="text-xl font-bold text-white font-serif">{scenario.worldView.substring(0, 50)}...</h1>
               <p className="text-sm text-slate-300">玩家: {scenario.playerName} | 夥伴: {scenario.partnerName}</p>
             </div>
             <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  onClick={onGoBack}
                  disabled={isLoading || isGoingBack || !canGoBack}
                  className="flex items-center gap-2 bg-slate-700/80 hover:bg-slate-600/80 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-200"
                  title="回到上一步"
                >
                  <UndoIcon className="w-5 h-5 text-cyan-400" />
                  <span className="hidden sm:inline">上一步</span>
                </button>
                 <button 
                  onClick={onToggleInfoModal}
                  disabled={isLoading || isGoingBack}
                  className="flex items-center gap-2 bg-slate-700/80 hover:bg-slate-600/80 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-200"
                >
                  <UserCircleIcon className="w-5 h-5 text-cyan-400" />
                  <span className="hidden sm:inline">角色資訊</span>
                </button>
                <button 
                  onClick={() => setCharacterModalOpen(true)}
                  disabled={isLoading || isGoingBack}
                  className="flex items-center gap-2 bg-slate-700/80 hover:bg-slate-600/80 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-200"
                >
                  <UsersIcon className="w-5 h-5 text-cyan-400" />
                  <span className="hidden sm:inline">角色管理</span>
                </button>
                 <button
                    onClick={onOpenSaveModal}
                    disabled={isLoading || isGoingBack}
                    className="flex items-center gap-2 bg-slate-700/80 hover:bg-slate-600/80 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-200"
                    title="儲存遊戲"
                  >
                    <ArrowUpTrayIcon className="w-5 h-5 text-cyan-400" />
                    <span className="hidden sm:inline">儲存</span>
                </button>
                <button 
                  onClick={onReset}
                  className="flex items-center gap-2 bg-red-800/60 hover:bg-red-700/60 text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-200"
                >
                  <ResetIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">重設</span>
                </button>
             </div>
          </header>

          <div className="flex-grow overflow-y-auto py-8 pr-2 custom-scrollbar">
            <div className="space-y-6">
              {chatHistory.map((msg) => (
                <ChatBubble key={msg.id} message={msg} onPeekThoughts={() => onPeekThoughts(msg.id)} isPeeking={isPeeking} />
              ))}
              {isLoading && chatHistory[chatHistory.length - 1]?.sender !== 'ai' && (
                <div className="flex justify-start">
                    <div className="flex items-center gap-3 bg-slate-800/80 rounded-lg p-3 max-w-prose">
                        <LoadingSpinner />
                        <p className="text-slate-400 font-serif italic">正在思考...</p>
                    </div>
                </div>
              )}
               {isGoingBack && (
                <div className="flex justify-center">
                    <div className="flex items-center gap-3 bg-slate-800/80 rounded-lg p-3 max-w-prose">
                        <LoadingSpinner />
                        <p className="text-slate-400 font-serif italic">正在回到上一步...</p>
                    </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          <footer className="flex-shrink-0 mt-auto pt-4 space-y-4">
             {plotChoices.length > 0 && (
                <div className="space-y-2 animate-fadeIn">
                    <h3 className="text-center text-sm font-bold text-cyan-300 mb-2">選擇一個方向</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {plotChoices.map((choice, index) => (
                            <button key={index} onClick={() => handleSelectChoice(choice)} disabled={isLoading || isGoingBack} className="text-left p-4 bg-slate-800/80 hover:bg-slate-700/90 rounded-lg transition-all ring-1 ring-slate-700 hover:ring-cyan-500 disabled:opacity-50">
                                <p className="font-bold text-white">{choice.title}</p>
                                <p className="text-sm text-slate-400 mt-1">{choice.description.substring(0, 80)}...</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            <form onSubmit={handleSend} className="flex items-end gap-2">
                <div className="relative flex-grow space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-y-2">
                         <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 p-1">
                            <button type="button" onClick={() => setInputMode('action')} className={`px-3 py-1 text-sm rounded-md transition-colors ${inputMode === 'action' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>行動</button>
                            <button type="button" onClick={() => setInputMode('dialogue')} className={`px-3 py-1 text-sm rounded-md transition-colors ${inputMode === 'dialogue' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>對話</button>
                        </div>
                        <div className="flex items-center gap-1 rounded-lg bg-slate-900/80 p-1">
                            {(['short', 'medium', 'long', 'extra-long'] as const).map(len => (
                                <button
                                    key={len}
                                    type="button"
                                    onClick={() => setResponseLength(len)}
                                    className={`px-2 py-1 text-xs sm:text-sm rounded-md transition-colors ${responseLength === len ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                                >
                                    {
                                        {
                                            short: '短篇',
                                            medium: '中篇',
                                            long: '長篇',
                                            'extra-long': '超長篇'
                                        }[len]
                                    }
                                </button>
                            ))}
                        </div>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isLoading ? "AI 正在回應..." : isGoingBack ? "請稍候..." : inputMode === 'action' ? '描述你的行動...' : '輸入你想說的話...'}
                        disabled={isLoading || isGeneratingChoices || isGoingBack}
                        rows={1}
                        maxLength={MAX_INPUT_LENGTH}
                        className="w-full px-4 py-3 pr-20 bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all resize-none leading-tight"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                        style={{ height: 'auto', minHeight: '50px' }}
                    />
                     <div className="absolute bottom-3 right-3 text-xs text-slate-500 pointer-events-none">
                        {input.length} / {MAX_INPUT_LENGTH}
                    </div>
                </div>
              <div className="flex flex-col gap-2">
                 <button
                    type="button"
                    onClick={onGenerateChoices}
                    disabled={isLoading || isGeneratingChoices || isGoingBack}
                    className="p-3 h-full flex-grow bg-slate-700 text-white rounded-lg disabled:bg-slate-800 disabled:cursor-wait hover:bg-slate-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500"
                    title="AI 建議劇情"
                >
                    {isGeneratingChoices ? <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <MagicWandIcon className="w-6 h-6" />}
                </button>
                 <button
                    type="submit"
                    disabled={isLoading || !input.trim() || isGeneratingChoices || isGoingBack}
                    className="p-3 h-full flex-grow bg-cyan-600 text-white rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-cyan-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500"
                    title="送出"
                >
                    <SendIcon className="w-6 h-6" />
                </button>
              </div>
            </form>
          </footer>
        </div>
         <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: rgba(34, 211, 238, 0.2);
              border-radius: 20px;
              border: 3px solid transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background-color: rgba(34, 211, 238, 0.4);
            }
         `}</style>
      </div>
      {innerThoughts && <InnerThoughtsModal thoughts={innerThoughts} onClose={onCloseThoughts} />}
      {isCharacterModalOpen && (
        <CharacterManager
          characters={scenario.secondaryCharacters}
          onAdd={onAddCharacter}
          onRemove={onRemoveCharacter}
          onClose={() => setCharacterModalOpen(false)}
          isLoading={isLoading || isGoingBack}
        />
       )}
    </>
  );
};

export default GameScreen;