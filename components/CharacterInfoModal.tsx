
import React from 'react';
import { UserCircleIcon, CloseIcon } from './IconComponents';
import type { Scenario, InnerThoughts } from '../types';

interface CharacterInfoModalProps {
  scenario: Scenario;
  innerThoughts: InnerThoughts | null;
  isLoading: boolean;
  onClose: () => void;
}

const CharacterInfoModal: React.FC<CharacterInfoModalProps> = ({ scenario, innerThoughts, isLoading, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-2xl bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl shadow-cyan-500/10 ring-1 ring-white/20 p-6 sm:p-8 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <UserCircleIcon className="w-8 h-8 text-cyan-400" />
            <h2 className="text-2xl font-bold font-serif text-cyan-300">角色資訊</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
            <CloseIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2">
            {/* Player Section */}
            <div className="p-4 bg-slate-900/40 rounded-lg">
                <h3 className="text-xl font-semibold text-cyan-300 mb-3 border-b border-cyan-500/20 pb-2">玩家：{scenario.playerName} ({scenario.playerGender})</h3>
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{scenario.playerDescription}</p>
            </div>

            {/* Partner Section */}
            <div className="p-4 bg-slate-900/40 rounded-lg">
                <h3 className="text-xl font-semibold text-cyan-300 mb-3 border-b border-cyan-500/20 pb-2">夥伴：{scenario.partnerName} ({scenario.partnerGender})</h3>
                <div className="space-y-4">
                    <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{scenario.partnerDescription}</p>
                    <div>
                        <h4 className="font-semibold text-slate-200 mb-1">目前關係：</h4>
                         {isLoading ? (
                            <div className="bg-slate-700/50 p-3 rounded-lg flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-slate-400 italic">分析中...</span>
                            </div>
                         ) : (
                             <p className="bg-slate-700/50 p-3 rounded-lg text-cyan-200 italic">
                                {innerThoughts?.relationship || '暫無資訊'}
                            </p>
                         )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterInfoModal;
