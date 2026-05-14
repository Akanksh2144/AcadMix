import React, { useState } from 'react';
import { SignIn, X } from '@phosphor-icons/react';

/**
 * Premium neat style prompt modal for user inputs.
 */
interface PromptModalProps {
  open: boolean;
  title: string;
  message: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const PromptModal: React.FC<PromptModalProps> = ({
  open, title, message, placeholder = 'Enter text...',
  confirmText = 'Confirm', cancelText = 'Cancel',
  onConfirm, onCancel,
}) => {
  const [value, setValue] = useState('');

  if (!open) return null;

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim());
      setValue('');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        style={{ animation: 'promptScaleIn 0.2s ease' }}>
        
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 relative">
          <button onClick={onCancel}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close">
            <X size={16} weight="bold" className="text-white" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <SignIn size={26} weight="duotone" className="text-indigo-600" />
            </div>
            <h2 className="text-xl font-extrabold text-white">{title}</h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-slate-600 font-medium leading-relaxed mb-4">{message}</p>
          <input 
            type="text" 
            autoFocus
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            {cancelText}
          </button>
          <button onClick={handleConfirm}
            className="flex-1 py-3 rounded-2xl font-bold text-sm text-white bg-indigo-500 hover:bg-indigo-600 transition-colors">
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes promptScaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1);    }
        }
      `}</style>
    </div>
  );
};

export default PromptModal;
