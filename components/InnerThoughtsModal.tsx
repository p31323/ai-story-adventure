import React from 'react';
import { InsightIcon, CloseIcon } from './IconComponents';
import type { InnerThoughts } from '../types';

interface InnerThoughtsModalProps {
  thoughts: InnerThoughts;
  onClose: () => void;
}

const InnerThoughtsModal: React.FC<InnerThoughtsModalProps> = ({ thoughts, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-lg bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl shadow-cyan-500/10 ring-1 ring-white/20 p-8" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <InsightIcon className="w-8 h-8 text-cyan-400" />
            <h2 className="text-2xl font-bold font-serif text-cyan-300">內心獨白</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
            <CloseIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg text-slate-300 mb-2">當前關係：</h3>
            <p className="bg-slate-900/50 p-3 rounded-lg text-cyan-200 italic">{thoughts.relationship}</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-300 mb-2">內心想法：</h3>
            <p className="bg-slate-900/50 p-4 rounded-lg text-slate-200 whitespace-pre-wrap leading-relaxed font-serif">
              {thoughts.monologue}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InnerThoughtsModal;
