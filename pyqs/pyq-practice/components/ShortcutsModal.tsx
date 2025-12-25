
import React from 'react';

interface ShortcutsModalProps {
  onClose: () => void;
}

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up">
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            <i className="fa-solid fa-keyboard mr-2 text-gray-500"></i> Keyboard Shortcuts
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <i className="fa-solid fa-times text-lg"></i>
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 gap-4">
            <ShortcutRow k="Right Arrow" desc="Next Question" />
            <ShortcutRow k="Left Arrow" desc="Previous Question" />
            <ShortcutRow k="1, 2, 3, 4" desc="Select Option A, B, C, D" />
            <ShortcutRow k="S" desc="Save & Next" />
            <ShortcutRow k="M" desc="Mark for Review" />
            <ShortcutRow k="X" desc="Clear Response" />
            <ShortcutRow k="F" desc="Toggle Fullscreen" />
            <ShortcutRow k="C" desc="Toggle Calculator" />
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-center">
            <button onClick={onClose} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-bold">Got it</button>
        </div>
      </div>
    </div>
  );
};

const ShortcutRow: React.FC<{ k: string; desc: string }> = ({ k, desc }) => (
    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
        <span className="text-gray-600 dark:text-gray-300 text-sm">{desc}</span>
        <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-md text-xs font-mono font-bold shadow-sm border border-gray-200 dark:border-gray-600">
            {k}
        </span>
    </div>
);

export default ShortcutsModal;