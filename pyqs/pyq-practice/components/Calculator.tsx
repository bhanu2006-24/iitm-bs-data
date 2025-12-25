
import React, { useState, useRef, useEffect } from 'react';

interface CalculatorProps {
  onClose: () => void;
}

const Calculator: React.FC<CalculatorProps> = ({ onClose }) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [memory, setMemory] = useState(0);
  const [position, setPosition] = useState({ x: 20, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false); // Minimized state
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
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
      const newX = Math.max(0, Math.min(window.innerWidth - (isMinimized ? 200 : 320), dragRef.current.initialX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 50, dragRef.current.initialY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isMinimized]);

  // ... (Calculation Logic functions: inputDigit, handleOp, handleFunc, calculate, clear, backspace, memory) ...
  const inputDigit = (digit: string) => { setDisplay(prev => (prev === '0' || prev === 'Error' ? digit : prev + digit)); };
  const handleOp = (op: string) => { if (display === 'Error') return; setExpression(display + ' ' + op + ' '); setDisplay('0'); };
  const handleFunc = (func: string) => {
    if (display === 'Error') return;
    const val = parseFloat(display);
    let res = 0;
    switch (func) {
      case 'sin': res = Math.sin(val); break;
      case 'cos': res = Math.cos(val); break;
      case 'tan': res = Math.tan(val); break;
      case 'sqrt': res = val < 0 ? NaN : Math.sqrt(val); break;
      case 'log': res = val <= 0 ? NaN : Math.log10(val); break;
      case 'ln': res = val <= 0 ? NaN : Math.log(val); break;
      case 'sq': res = Math.pow(val, 2); break;
    }
    if (isNaN(res)) setDisplay('Error'); else setDisplay(String(Number(res.toFixed(8))));
    if (['sin', 'cos', 'tan', 'log', 'ln', 'sqrt'].includes(func)) setExpression(`${func}(${val})`); else if (func === 'sq') setExpression(`${val}^2`);
  };
  const calculate = () => {
    try {
      if (display === 'Error') { setDisplay('0'); return; }
      const fullExpr = expression + display;
      if (!/^[\d\.\s\+\-\*\/\(\)\^]+$/.test(fullExpr)) {} 
      const safeExpr = fullExpr.replace(/\^/g, '**');
      // eslint-disable-next-line no-eval
      const res = eval(safeExpr); 
      if (!isFinite(res) || isNaN(res)) setDisplay('Error'); else setDisplay(String(Number(res.toFixed(8))));
      setExpression('');
    } catch (e) { setDisplay('Error'); }
  };
  const clear = () => { setDisplay('0'); setExpression(''); };
  const backspace = () => { if (display === 'Error') { setDisplay('0'); return; } setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0'); };
  const memAdd = () => { const val = parseFloat(display); if (!isNaN(val)) setMemory(m => m + val); };
  const memSub = () => { const val = parseFloat(display); if (!isNaN(val)) setMemory(m => m - val); };
  const memRecall = () => setDisplay(String(memory));
  const memClear = () => setMemory(0);

  const btnClass = "h-10 text-sm font-bold bg-white hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white border border-gray-200 dark:border-gray-600 rounded shadow-sm active:shadow-inner active:scale-95 transition-all";
  const opClass = "h-10 text-sm font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded text-blue-800 active:scale-95 transition-all";
  const memClass = "h-8 text-xs font-bold bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 rounded active:scale-95 transition-all";

  if (isMinimized) {
    return (
      <div 
        className="fixed z-[9999] pointer-events-auto bg-gray-800 dark:bg-black text-white rounded-full shadow-xl flex items-center px-4 py-2 gap-3 cursor-move select-none border border-gray-600"
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <i className="fa-solid fa-calculator"></i>
        <span className="font-bold text-sm">{display}</span>
        <button onClick={() => setIsMinimized(false)} className="ml-2 hover:text-blue-300"><i className="fa-solid fa-expand"></i></button>
        <button onClick={onClose} className="hover:text-red-400"><i className="fa-solid fa-times"></i></button>
      </div>
    );
  }

  return (
    <div 
      className="fixed flex flex-col w-[320px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-300 dark:border-gray-600 overflow-hidden z-[9999] pointer-events-auto animate-fade-in-up"
      style={{ left: position.x, top: position.y }}
    >
      <div 
        className="bg-gray-800 dark:bg-black text-white px-4 py-2 flex justify-between items-center cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <span className="font-bold flex items-center gap-2"><i className="fa-solid fa-calculator"></i> Scientific</span>
        <div className="flex gap-3">
            <button onClick={() => setIsMinimized(true)} className="hover:text-blue-300"><i className="fa-solid fa-minus"></i></button>
            <button onClick={onClose} className="hover:text-red-400"><i className="fa-solid fa-times"></i></button>
        </div>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="text-right text-xs text-gray-500 h-4">{expression}</div>
        <div className="text-right text-3xl font-mono font-bold text-gray-900 dark:text-white overflow-x-auto scrollbar-hide">
          {display}
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1 p-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
         <button onClick={memClear} className={memClass}>MC</button>
         <button onClick={memRecall} className={memClass}>MR</button>
         <button onClick={memAdd} className={memClass}>M+</button>
         <button onClick={memSub} className={memClass}>M-</button>
         <div className="flex items-center justify-center text-xs text-gray-500 font-bold">{memory !== 0 ? 'M' : ''}</div>
      </div>
      <div className="p-2 grid grid-cols-4 gap-2 bg-gray-100 dark:bg-gray-900">
        <button onClick={() => handleFunc('sin')} className={btnClass}>sin</button>
        <button onClick={() => handleFunc('cos')} className={btnClass}>cos</button>
        <button onClick={() => handleFunc('tan')} className={btnClass}>tan</button>
        <button onClick={backspace} className="h-10 text-sm font-bold bg-red-100 hover:bg-red-200 text-red-800 rounded"><i className="fa-solid fa-backspace"></i></button>
        <button onClick={() => handleFunc('ln')} className={btnClass}>ln</button>
        <button onClick={() => handleFunc('log')} className={btnClass}>log</button>
        <button onClick={() => handleFunc('sqrt')} className={btnClass}>√</button>
        <button onClick={() => handleFunc('sq')} className={btnClass}>x²</button>
        <button onClick={() => inputDigit('(')} className={btnClass}>(</button>
        <button onClick={() => inputDigit(')')} className={btnClass}>)</button>
        <button onClick={() => handleOp('^')} className={btnClass}>^</button>
        <button onClick={() => handleOp('/')} className={opClass}>÷</button>
        <button onClick={() => inputDigit('7')} className={btnClass}>7</button>
        <button onClick={() => inputDigit('8')} className={btnClass}>8</button>
        <button onClick={() => inputDigit('9')} className={btnClass}>9</button>
        <button onClick={() => handleOp('*')} className={opClass}>×</button>
        <button onClick={() => inputDigit('4')} className={btnClass}>4</button>
        <button onClick={() => inputDigit('5')} className={btnClass}>5</button>
        <button onClick={() => inputDigit('6')} className={btnClass}>6</button>
        <button onClick={() => handleOp('-')} className={opClass}>-</button>
        <button onClick={() => inputDigit('1')} className={btnClass}>1</button>
        <button onClick={() => inputDigit('2')} className={btnClass}>2</button>
        <button onClick={() => inputDigit('3')} className={btnClass}>3</button>
        <button onClick={() => handleOp('+')} className={opClass}>+</button>
        <button onClick={clear} className="h-10 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded shadow-sm">AC</button>
        <button onClick={() => inputDigit('0')} className={btnClass}>0</button>
        <button onClick={() => inputDigit('.')} className={btnClass}>.</button>
        <button onClick={calculate} className="h-10 text-sm font-bold bg-green-500 hover:bg-green-600 text-white rounded shadow-sm">=</button>
      </div>
    </div>
  );
};

export default Calculator;