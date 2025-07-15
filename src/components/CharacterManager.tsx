
import React, { useState } from 'react';
import { UsersIcon, CloseIcon, TrashIcon } from './IconComponents';
import { SecondaryCharacter } from '../types';

interface CharacterManagerProps {
  characters: SecondaryCharacter[];
  onAdd: (name: string, description: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

const CharacterManager: React.FC<CharacterManagerProps> = ({ characters, onAdd, onRemove, onClose, isLoading }) => {
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newDesc.trim() && !isLoading) {
      onAdd(newName, newDesc);
      setNewName('');
      setNewDesc('');
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-2xl bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl shadow-cyan-500/10 ring-1 ring-white/20 p-6 sm:p-8 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-cyan-400" />
            <h2 className="text-2xl font-bold font-serif text-cyan-300">角色管理</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
            <CloseIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="space-y-4 mb-6 pb-6 border-b border-slate-700 flex-shrink-0">
            <h3 className="text-lg font-semibold text-slate-200">增加新角色</h3>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">角色名稱</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="例如：神秘的商人" required className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">角色描述</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="外觀、個性、目的..." required rows={2} className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
            </div>
            <button type="submit" disabled={isLoading || !newName.trim() || !newDesc.trim()} className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors">
                {isLoading ? '處理中...' : '加入劇情'}
            </button>
        </form>

        <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
            <h3 className="text-lg font-semibold text-slate-200 mb-2">目前場上角色</h3>
            {characters.length > 0 ? (
                characters.map(char => (
                    <div key={char.id} className="bg-slate-900/50 p-3 rounded-lg flex justify-between items-start gap-4">
                        <div>
                            <p className="font-bold text-cyan-400">{char.name}</p>
                            <p className="text-sm text-slate-400 mt-1">{char.description}</p>
                        </div>
                        <button onClick={() => onRemove(char.id)} disabled={isLoading} className="p-2 text-slate-500 hover:text-red-500 disabled:text-slate-700 disabled:cursor-not-allowed transition-colors flex-shrink-0">
                           <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                ))
            ) : (
                <div className="text-center py-6 bg-slate-900/30 rounded-lg">
                    <p className="text-slate-500">除了你的夥伴，目前沒有其他角色。</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CharacterManager;
