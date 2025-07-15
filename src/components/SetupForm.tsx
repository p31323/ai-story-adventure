
import React, { useState, useRef } from 'react';
import { Scenario, SetupFieldType, ModelQuality } from '../types';
import { ImageIcon, MagicWandIcon, PaintBrushIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from './IconComponents';
import { generateSetupDetails, generateImage, generateImageFromContext } from '../services/setupService';
import { parseGeminiError } from '../services/errorService';

interface SetupFormProps {
  onStartGame: (scenario: Scenario) => void;
  apiKeyError: string | null;
  onOpenLoadModal: () => void;
  hasSaveData: boolean;
}

// Reusable textarea with character counter
interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  maxLength: number;
  placeholder: string;
  rows: number;
  isGenerating?: boolean;
}

const TextareaField: React.FC<TextareaFieldProps> = ({ label, value, onChange, maxLength, placeholder, rows, isGenerating }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <span className="text-xs text-slate-500">{value.length} / {maxLength}</span>
    </div>
    <textarea
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      placeholder={placeholder}
      rows={rows}
      disabled={isGenerating}
      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y"
    />
  </div>
);


const getApiKey = (): string | undefined => (window as any).GEMINI_API_KEY;

const defaultImageDataUrl = 'data:image/jpeg;base64,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';

export const SetupForm: React.FC<SetupFormProps> = ({ onStartGame, apiKeyError, onOpenLoadModal, hasSaveData }) => {
  const [formData, setFormData] = useState<Omit<Scenario, 'secondaryCharacters' | 'modelQuality' | 'mockMode'>>({
    playerName: '艾拉',
    playerGender: '女性',
    playerDescription: '一位記憶模糊的賞金獵人，只記得自己的名字和一套獨特的戰鬥技巧。',
    openingPlot: '妳在一個陌生的巷弄中醒來，口袋裡只有一枚奇特的硬幣和一張寫著「找到我」的紙條。',
    worldView: '一個科技與魔法交織的賽博龐克都市，天空被永久的霓虹雲層覆蓋。',
    partnerName: '凱',
    partnerGender: '男性',
    partnerDescription: '一個漂浮在空中的神秘光球，說話語氣古板，似乎知道這個世界的許多秘密。',
    backgroundImage: defaultImageDataUrl,
  });
  const [isGenerating, setIsGenerating] = useState<Record<SetupFieldType, boolean>>({ player: false, partner: false, world: false });
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [modelQuality, setModelQuality] = useState<ModelQuality>('fast');
  const [mockMode, setMockMode] = useState(!getApiKey());
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleGenderChange = (field: 'playerGender' | 'partnerGender', value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleGenerate = async (type: SetupFieldType) => {
    setIsGenerating(prev => ({ ...prev, [type]: true }));
    setError(null);
    try {
      const result = await generateSetupDetails(type, mockMode);
      if (type === 'player') {
        setFormData(prev => ({ ...prev, playerName: result.name, playerGender: result.gender, playerDescription: result.description }));
      } else if (type === 'partner') {
        setFormData(prev => ({ ...prev, partnerName: result.name, partnerGender: result.gender, partnerDescription: result.description }));
      } else if (type === 'world') {
        setFormData(prev => ({ ...prev, worldView: result.worldView, openingPlot: result.openingPlot }));
      }
    } catch (err) {
      setError(parseGeminiError(err));
    } finally {
      setIsGenerating(prev => ({ ...prev, [type]: false }));
    }
  };
  
   const handleImageGenerate = async (prompt: string) => {
    if (!prompt) return;
    setIsGeneratingImage(true);
    setError(null);
    try {
        const image = await generateImage(prompt, mockMode);
        setFormData(prev => ({ ...prev, backgroundImage: image }));
    } catch(err) {
        setError(parseGeminiError(err));
    } finally {
        setIsGeneratingImage(false);
    }
  };

  const handleContextImageGenerate = async () => {
    setIsGeneratingImage(true);
    setError(null);
    try {
        const { image } = await generateImageFromContext(
            formData.worldView,
            formData.partnerDescription,
            formData.openingPlot,
            mockMode
        );
        setFormData(prev => ({...prev, backgroundImage: image}));
    } catch(err) {
        setError(parseGeminiError(err));
    } finally {
        setIsGeneratingImage(false);
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          setFormData(prev => ({ ...prev, backgroundImage: loadEvent.target.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(isGenerating).some(v => v) || isGeneratingImage) {
        return;
    }
    const allFieldsFilled = Object.values(formData).every(value => typeof value === 'string' ? value.trim() !== '' : true);
    if (!allFieldsFilled) {
      setError("請填寫所有欄位後再開始冒險。");
      return;
    }
    setError(null);

    const scenario: Scenario = {
      ...formData,
      secondaryCharacters: [],
      modelQuality,
      mockMode
    };
    onStartGame(scenario);
  };
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-900 text-white flex-col gap-8 p-4">
      <div className="text-center space-y-2 py-4">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 font-serif">
          AI 文字冒險
        </h1>
        <p className="text-slate-400">創造你的史詩傳說</p>
      </div>

      {(apiKeyError || error) && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg max-w-2xl text-center animate-fadeIn" role="alert">
          <p className="font-bold">發生錯誤</p>
          <p className="text-sm">{apiKeyError || error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-8 p-6 sm:p-8 bg-slate-800/50 rounded-2xl shadow-2xl shadow-cyan-500/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
                 {/* Player Settings */}
                <div className="space-y-4 p-4 bg-slate-900/40 rounded-lg">
                    <h2 className="text-lg font-bold text-cyan-400">1. 角色設定</h2>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">玩家名稱</label>
                        <input type="text" value={formData.playerName} onChange={handleChange('playerName')} maxLength={20} className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">玩家性別</label>
                        <div className="flex gap-2">
                            {(['男性', '女性', '其它'] as const).map(gender => (
                                <button type="button" key={gender} onClick={() => handleGenderChange('playerGender', gender)} className={`flex-1 py-2 text-sm rounded-md transition-colors ${formData.playerGender === gender ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                    {gender}
                                </button>
                            ))}
                        </div>
                    </div>
                    <TextareaField
                      label="角色描述"
                      value={formData.playerDescription}
                      onChange={handleChange('playerDescription')}
                      maxLength={1500}
                      placeholder="外觀、個性、背景..."
                      rows={5}
                      isGenerating={isGenerating.player}
                    />
                    <button type="button" onClick={() => handleGenerate('player')} disabled={isGenerating.player} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        {isGenerating.player ? <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <MagicWandIcon className="w-5 h-5" />}
                        隨機生成
                    </button>
                </div>
                {/* Partner Settings */}
                <div className="space-y-4 p-4 bg-slate-900/40 rounded-lg">
                    <h2 className="text-lg font-bold text-cyan-400">2. 夥伴設定</h2>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">夥伴搭檔</label>
                        <input type="text" value={formData.partnerName} onChange={handleChange('partnerName')} maxLength={20} className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">夥伴性別</label>
                         <div className="flex gap-2">
                             {(['男性', '女性', '其它'] as const).map(gender => (
                                <button type="button" key={gender} onClick={() => handleGenderChange('partnerGender', gender)} className={`flex-1 py-2 text-sm rounded-md transition-colors ${formData.partnerGender === gender ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                    {gender}
                                </button>
                            ))}
                        </div>
                    </div>
                    <TextareaField
                      label="夥伴描述"
                      value={formData.partnerDescription}
                      onChange={handleChange('partnerDescription')}
                      maxLength={1500}
                      placeholder="外觀、個性、與你的關係..."
                      rows={5}
                      isGenerating={isGenerating.partner}
                    />
                    <button type="button" onClick={() => handleGenerate('partner')} disabled={isGenerating.partner} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                         {isGenerating.partner ? <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <MagicWandIcon className="w-5 h-5" />}
                        隨機生成
                    </button>
                </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
                {/* World Settings */}
                <div className="space-y-4 p-4 bg-slate-900/40 rounded-lg">
                    <h2 className="text-lg font-bold text-cyan-400">3. 世界設定</h2>
                     <TextareaField
                      label="世界觀"
                      value={formData.worldView}
                      onChange={handleChange('worldView')}
                      maxLength={300}
                      placeholder="這個世界的規則、歷史、氛圍..."
                      rows={4}
                      isGenerating={isGenerating.world}
                    />
                     <TextareaField
                      label="開場劇情"
                      value={formData.openingPlot}
                      onChange={handleChange('openingPlot')}
                      maxLength={1500}
                      placeholder="你的冒險從哪裡開始..."
                      rows={5}
                      isGenerating={isGenerating.world}
                    />
                    <button type="button" onClick={() => handleGenerate('world')} disabled={isGenerating.world} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        {isGenerating.world ? <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <MagicWandIcon className="w-5 h-5" />}
                        隨機生成
                    </button>
                </div>

                {/* Scene Image */}
                <div className="space-y-2 p-4 bg-slate-900/40 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-cyan-400">4. 場景圖片</h2>
                     <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300">
                        <ArrowUpTrayIcon className="w-4 h-4" /> 上傳圖片
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg" className="hidden" />
                  </div>
                   <div className="aspect-[9/16] w-full max-w-xs mx-auto bg-slate-700/50 rounded-lg overflow-hidden flex items-center justify-center relative">
                        {isGeneratingImage ? (
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                                <p>生成中...</p>
                            </div>
                        ) : (
                            <img src={formData.backgroundImage} alt="場景預覽" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                   </div>
                    <button type="button" onClick={handleContextImageGenerate} disabled={isGeneratingImage} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        {isGeneratingImage ? <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <PaintBrushIcon className="w-5 h-5" />}
                        依據設定生成
                    </button>
                </div>
            </div>
        </div>

        {/* Bottom Section */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-300">AI 品質:</span>
                <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 p-1">
                  <button type="button" onClick={() => setModelQuality('fast')} className={`px-3 py-1 text-sm rounded-md transition-colors ${modelQuality === 'fast' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>速度優先</button>
                  <button type="button" onClick={() => setModelQuality('high')} className={`px-3 py-1 text-sm rounded-md transition-colors ${modelQuality === 'high' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>品質優先</button>
                </div>
            </div>
            {!getApiKey() && (
               <div className="flex items-center">
                    <input
                        id="mock-mode"
                        type="checkbox"
                        checked={mockMode}
                        onChange={(e) => setMockMode(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 bg-slate-700"
                    />
                    <label htmlFor="mock-mode" className="ml-2 block text-sm text-slate-300">
                        啟用模擬模式 (無API金鑰)
                    </label>
                </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
              <button type="button" onClick={onOpenLoadModal} disabled={!hasSaveData} className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">
                  <ArrowDownTrayIcon className="w-5 h-5"/> 讀取遊戲
              </button>
              <button type="submit" disabled={Object.values(isGenerating).some(v => v) || isGeneratingImage} className="w-full sm:w-auto flex-1 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-extrabold py-3 px-4 rounded-lg transition-all transform hover:scale-105">
                  開始冒險
              </button>
          </div>
        </div>
      </form>
    </div>
  );
};
