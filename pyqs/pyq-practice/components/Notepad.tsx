
import React, { useState, useEffect, useRef } from 'react';

interface NotepadProps {
  examId: string;
  onClose: () => void;
}

const Notepad: React.FC<NotepadProps> = ({ examId, onClose }) => {
  const [text, setText] = useState('');
  const [position, setPosition] = useState({ x: window.innerWidth - 340, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`notepad_${examId}`);
    if (saved) setText(saved);
  }, [examId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    localStorage.setItem(`notepad_${examId}`, val);
  };

  // Drag Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      
      const newX = Math.max(0, Math.min(window.innerWidth - 100, dragRef.current.initialX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, dragRef.current.initialY + dy));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      className="fixed z-[100] flex flex-col w-80 h-96 shadow-2xl rounded-lg overflow-hidden border border-yellow-300 pointer-events-auto"
      style={{ left: position.x, top: position.y }}
    >
      <div 
        className="bg-yellow-400 px-3 py-2 cursor-move flex justify-between items-center border-b border-yellow-500 select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="font-bold text-yellow-900 text-sm flex items-center gap-2">
          <i className="fa-solid fa-note-sticky"></i> Scratchpad
        </div>
        <button onClick={onClose} className="text-yellow-800 hover:text-black">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div className="flex-1 bg-yellow-50 relative">
        {/* Lined paper effect */}
        <div className="absolute inset-0 pointer-events-none opacity-10" 
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px)', backgroundSize: '100% 24px', top: '24px' }}>
        </div>
        <div className="absolute left-8 top-0 bottom-0 w-px bg-red-300 opacity-50 pointer-events-none"></div>
        
        <textarea
          className="w-full h-full bg-transparent p-4 pl-10 text-gray-800 resize-none outline-none text-base font-handwriting leading-6"
          placeholder="Write your calculations here..."
          style={{ lineHeight: '24px' }}
          value={text}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default Notepad;