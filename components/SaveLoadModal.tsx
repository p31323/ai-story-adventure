
import React from 'react';
import { SaveData } from '../types.ts';
import { CloseIcon, TrashIcon, ArrowUpTrayIcon, ArrowDownTrayIcon } from './IconComponents.tsx';

interface SaveLoadModalProps {
  mode: 'save' | 'load';
  slots: (SaveData | null)[];
  onClose: () => void;
  onSave: (slotIndex: number) => void;
  onLoad: (slotIndex: number) => void;
  onDelete: (slotIndex: number) => void;
  isLoading: boolean;
}

const SaveLoadModal: React.FC<SaveLoadModalProps> = ({ mode, slots, onClose, onSave, onLoad, onDelete, isLoading }) => {
  const title = mode === 'save' ? '儲存遊戲' : '讀取遊戲';
  const Icon = mode === 'save' ? ArrowUpTrayIcon : ArrowDownTrayIcon;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-2xl bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl shadow-cyan-500/10 ring-1 ring-white/20 p-6 sm:p-8 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Icon className="w-8 h-8 text-cyan-400" />
            <h2 className="text-2xl font-bold font-serif text-cyan-300">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
            <CloseIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
          {slots.map((slot, index) => (
            <div key={index} className="bg-slate-900/50 p-4 rounded-lg flex justify-between items-center gap-4 transition-all hover:ring-1 hover:ring-cyan-500">
              <div>
                <p className="font-bold text-white">存檔欄位 {index + 1}</p>
                {slot ? (
                  <p className="text-sm text-slate-400 mt-1">
                    上次儲存：{new Date(slot.savedAt).toLocaleString('zh-TW', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 mt-1 italic">（空）</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {mode === 'load' && slot && (
                  <>
                    <button onClick={() => onLoad(index)} disabled={isLoading} className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                      讀取
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm(`您確定要刪除「存檔欄位 ${index + 1}」嗎？此操作無法復原。`)) {
                           onDelete(index);
                        }
                      }} 
                      disabled={isLoading} 
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:text-slate-600 disabled:cursor-not-allowed"
                      title="刪除存檔"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </>
                )}
                {mode === 'save' && (
                   <button onClick={() => {
                     if (!slot || window.confirm(`您確定要覆蓋「存檔欄位 ${index + 1}」嗎？`)) {
                        onSave(index);
                     }
                   }} disabled={isLoading} className="bg-cyan-700 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                    {slot ? '覆蓋' : '儲存'}
                  </button>
                )}
              </div>
            </div>
          ))}
           {slots.every(s => s === null) && mode === 'load' && (
                <div className="text-center py-10 bg-slate-900/30 rounded-lg">
                    <p className="text-slate-500">沒有任何存檔紀錄。</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SaveLoadModal;