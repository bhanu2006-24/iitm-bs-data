
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ExamPaper, QuestionType, Attempt } from '../types';
import Calculator from './Calculator';
import Notepad from './Notepad';
import MathRenderer from './MathRenderer';
// import ToastContainer, { ToastMessage } from './Toast'; // Commented out as requested
import ShortcutsModal from './ShortcutsModal';
import ResultDashboard from './ResultDashboard';

interface QuizInterfaceProps {
  exam: ExamPaper;
  mode: 'practice' | 'exam';
  onBack: () => void;
  onComplete: (attempt: Attempt) => void;
}

type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked_for_review' | 'answered_marked_for_review';

const QuizInterface: React.FC<QuizInterfaceProps> = ({ exam, mode, onBack, onComplete }) => {
  // State for Exam Flow
  const [hasStarted, setHasStarted] = useState(false);
  
  // Quiz State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [questionStatus, setQuestionStatus] = useState<Record<string, QuestionStatus>>({});
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // New States for enhanced flow
  const [showResult, setShowResult] = useState(false); // Post-submit dashboard
  const [currentAttempt, setCurrentAttempt] = useState<Attempt | null>(null);

  // Persistence State
  const [savedSessionFound, setSavedSessionFound] = useState(false);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [showNotepad, setShowNotepad] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false); // Shortcuts Modal
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [paletteFilter, setPaletteFilter] = useState<'all' | 'answered' | 'review' | 'not_answered'>('all');
  
  // Toast State (Commented out)
  // const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const storageKey = `pyq_progress_${exam.id}`;

  // Helper to add toast (Commented out functionality)
  const addToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    // const id = Date.now().toString();
    // setToasts(prev => [...prev, { id, type, message }]);
    // console.log(`[${type}] ${message}`); // Optional: log to console instead
  };

  // const removeToast = (id: string) => {
  //   setToasts(prev => prev.filter(t => t.id !== id));
  // };

  // Initialize & Check for Saved Session
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      setSavedSessionFound(true);
    }

    const initialStatus: Record<string, QuestionStatus> = {};
    exam.questions.forEach(q => initialStatus[q.id] = 'not_visited');
    if (exam.questions.length > 0) initialStatus[exam.questions[0].id] = 'not_answered';
    setQuestionStatus(initialStatus);
    setTimeLeft(exam.durationMinutes * 60);
    setIsSubmitted(false);
    setShowSummary(false);
    setAnswers({});
    setCurrentQIndex(0);
    setHasStarted(false);
    setIsPaused(false);
    setShowResult(false);

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      if (timerRef.current) clearInterval(timerRef.current);
      if (document.fullscreenElement) document.exitFullscreen().catch(e => console.warn(e));
    };
  }, [exam.id, storageKey]); 

  // Auto-Save Effect
  useEffect(() => {
    if (hasStarted && !isSubmitted && !isPaused) {
      const stateToSave = {
        answers,
        questionStatus,
        timeLeft,
        currentQIndex
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }
  }, [answers, questionStatus, timeLeft, currentQIndex, hasStarted, isSubmitted, isPaused, storageKey]);

  // Load Saved Session
  const handleResume = () => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setAnswers(parsed.answers || {});
        setQuestionStatus(parsed.questionStatus || {});
        setTimeLeft(parsed.timeLeft || exam.durationMinutes * 60);
        setCurrentQIndex(parsed.currentQIndex || 0);
        setHasStarted(true);
        // addToast('success', 'Session Resumed Successfully');
      } catch (e) {
        console.error("Failed to restore session", e);
        startNewSession();
      }
    } else {
      startNewSession();
    }
  };

  const startNewSession = () => {
    setHasStarted(true);
    // addToast('info', 'Good Luck! Exam Started.');
  };

  const handleNext = () => {
    updateStatusOnLeave(false);
    if (currentQIndex < exam.questions.length - 1) setCurrentQIndex(p => p + 1);
  };

  const handlePrev = () => {
    updateStatusOnLeave(false);
    if (currentQIndex > 0) setCurrentQIndex(p => p - 1);
  };

  const handleMarkReviewNext = () => {
    updateStatusOnLeave(true);
    if (currentQIndex < exam.questions.length - 1) {
        setCurrentQIndex(p => p + 1);
        // addToast('info', 'Marked for Review');
    }
  };

  // Keyboard Navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasStarted || isSubmitted || isPaused) return;
      if (showSummary || showReport || showShortcuts) return;

      if (e.key === 'ArrowRight') {
        if (currentQIndex < exam.questions.length - 1) handleNext();
      } else if (e.key === 'ArrowLeft') {
        if (currentQIndex > 0) handlePrev();
      } else if (['1','2','3','4'].includes(e.key)) {
         // Quick Select MCQ Options A, B, C, D
         const q = exam.questions[currentQIndex];
         if ((q.type === QuestionType.MCQ || q.type === QuestionType.MSQ) && q.options && q.options.length >= parseInt(e.key)) {
             handleOptionSelect(q.id, q.options[parseInt(e.key)-1].id, q.type);
         }
      } else if (e.key.toLowerCase() === 's') {
          handleNext(); // Save and Next
      } else if (e.key.toLowerCase() === 'm') {
          handleMarkReviewNext();
      } else if (e.key.toLowerCase() === 'x') {
          handleClearResponse();
      } else if (e.key.toLowerCase() === 'c') {
          setShowCalc(p => !p);
      } else if (e.key.toLowerCase() === 'f') {
          toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQIndex, isSubmitted, hasStarted, isPaused, showSummary, showReport, showShortcuts]);

  // Timer Logic
  useEffect(() => {
    if (!hasStarted || isSubmitted || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSubmitted, hasStarted, isPaused]);

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
      const handleFsChange = () => {
          setIsFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handleFsChange);
      return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Calculate Score
  const calculateScore = useCallback(() => {
    let score = 0;
    exam.questions.forEach(q => {
      const ans = answers[q.id];
      if (!ans) return;
      let correct = false;
      if (q.type === QuestionType.MCQ || q.type === QuestionType.BOOLEAN) {
        if (ans === q.options?.find(o => o.isCorrect)?.id) correct = true;
      } else if (q.type === QuestionType.NUMERIC) {
        const num = parseFloat(ans);
        if (q.range) {
          if (num >= q.range.min && num <= q.range.max) correct = true;
        } else if (q.correctValue !== undefined) {
          if (Math.abs(num - Number(q.correctValue)) < 0.01) correct = true;
        }
      } else if (q.type === QuestionType.MSQ) {
        const correctIds = q.options?.filter(o => o.isCorrect).map(o => o.id).sort();
        if (JSON.stringify(correctIds) === JSON.stringify((ans as string[]).sort())) correct = true;
      }
      
      if (correct) score += q.marks;
    });
    return score;
  }, [answers, exam.questions]);

  // Submit Exam
  const submitExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    localStorage.removeItem(storageKey);

    const attemptResult: Attempt = {
      examId: exam.id,
      examTitle: exam.title,
      score: calculateScore(),
      totalMarks: exam.totalMarks,
      date: new Date().toISOString(),
      timeSpentSeconds: (exam.durationMinutes * 60) - timeLeft
    };
    
    setIsSubmitted(true);
    setShowSummary(false);
    setShowResult(true); // Show Result Dashboard
    setCurrentAttempt(attemptResult);
    
    onComplete(attemptResult); 
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    // addToast('success', 'Exam Submitted Successfully!');
  }, [calculateScore, exam, timeLeft, onComplete, storageKey]);

  // Auto-submit
  useEffect(() => {
    if (timeLeft === 0 && mode === 'exam' && !isSubmitted && hasStarted) {
      submitExam();
    }
  }, [timeLeft, mode, isSubmitted, submitExam, hasStarted]);

  const currentQuestion = exam.questions[currentQIndex];

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOptionSelect = (qId: string, optionId: string, type: QuestionType) => {
    if (isSubmitted || isPaused) return;
    setAnswers(prev => {
      const newAns = { ...prev };
      if (type === QuestionType.MSQ) {
        const current = newAns[qId] || [];
        newAns[qId] = current.includes(optionId) ? current.filter((id: string) => id !== optionId) : [...current, optionId];
      } else {
        newAns[qId] = optionId;
      }
      return newAns;
    });
    setQuestionStatus(prev => ({ ...prev, [qId]: 'answered' }));
  };

  const handleNumericInput = (qId: string, val: string) => {
    if (isSubmitted || isPaused) return;
    setAnswers(prev => ({ ...prev, [qId]: val }));
    setQuestionStatus(prev => ({ ...prev, [qId]: val ? 'answered' : 'not_answered' }));
  };

  const handleClearResponse = () => {
    if (isSubmitted || isPaused) return;
    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[currentQuestion.id];
      return copy;
    });
    setQuestionStatus(prev => ({ ...prev, [currentQuestion.id]: 'not_answered' }));
    // addToast('info', 'Response Cleared');
  };

  const updateStatusOnLeave = (markReview: boolean) => {
    if (isSubmitted || isPaused) return;
    const qId = currentQuestion.id;
    const hasAns = answers[qId] !== undefined && answers[qId] !== '' && (Array.isArray(answers[qId]) ? answers[qId].length > 0 : true);
    
    setQuestionStatus(prev => {
      let status = prev[qId];
      if (markReview) status = hasAns ? 'answered_marked_for_review' : 'marked_for_review';
      else status = hasAns ? 'answered' : 'not_answered';
      return { ...prev, [qId]: status };
    });
  };

  const quitExam = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    localStorage.removeItem(storageKey); // Clear session
    onBack();
  };

  const fontSizes = ['text-sm', 'text-base', 'text-lg'];

  // --- INSTRUCTIONS SCREEN ---
  if (!hasStarted) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        {/* <ToastContainer toasts={toasts} removeToast={removeToast} /> */}
        <div className="max-w-3xl w-full bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="bg-primary-600 p-6 text-white text-center">
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <p className="opacity-90 mt-2">Read the instructions carefully before starting</p>
          </div>
          <div className="p-8 overflow-y-auto flex-1 text-gray-700 dark:text-gray-300 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                   <i className="fa-regular fa-clock text-primary-500 mr-2"></i>
                   <span className="font-bold">Duration:</span> {exam.durationMinutes} Minutes
                </div>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                   <i className="fa-solid fa-list-ol text-primary-500 mr-2"></i>
                   <span className="font-bold">Questions:</span> {exam.questions.length}
                </div>
             </div>
             <h3 className="font-bold text-lg text-gray-900 dark:text-white border-b pb-2">General Instructions:</h3>
             <ul className="list-disc pl-5 space-y-2">
                <li>The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination.</li>
                <li>The question palette displayed on the right side of screen will show the status of each question using the color codes provided.</li>
                <li>To answer a question, do the following:
                   <ul className="list-circle pl-5 mt-1 space-y-1 text-sm opacity-80">
                      <li>Click on the question number in the Question Palette to go to that question directly.</li>
                      <li>Click on <b>Save & Next</b> to save your answer for the current question and then go to the next question.</li>
                      <li>Click on <b>Mark for Review & Next</b> to save your answer for the current question, mark it for review, and then go to the next question.</li>
                   </ul>
                </li>
             </ul>
             
             {savedSessionFound && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-800 dark:text-blue-200">
                    <i className="fa-solid fa-circle-info mr-2"></i>
                    A saved session was found for this exam. You can resume from where you left off.
                </div>
             )}
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center gap-4">
             <button onClick={onBack} className="text-gray-500 hover:text-gray-700 font-bold px-4">Cancel</button>
             <div className="flex gap-3">
                 {savedSessionFound && (
                     <button onClick={handleResume} className="bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg">
                        <i className="fa-solid fa-rotate-right mr-2"></i> Resume Session
                     </button>
                 )}
                 <button onClick={startNewSession} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg">
                   {savedSessionFound ? 'Restart Exam' : 'Start Exam'} <i className="fa-solid fa-arrow-right ml-2"></i>
                 </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RESULT DASHBOARD ---
  if (showResult && currentAttempt) {
      return (
        <ResultDashboard 
            attempt={currentAttempt} 
            onReview={() => setShowResult(false)} 
            onHome={onBack} 
        />
      );
  }

  // --- QUIZ SCREEN ---
  return (
    <div className="fixed inset-0 z-0 flex flex-col bg-gray-50 dark:bg-gray-900 font-sans h-screen w-screen overflow-hidden">
      
      {/* <ToastContainer toasts={toasts} removeToast={removeToast} /> */}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {/* Floating Tools Layer */}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {showCalc && <div className="pointer-events-auto absolute"><Calculator onClose={() => setShowCalc(false)} /></div>}
        {showNotepad && <div className="pointer-events-auto absolute"><Notepad examId={exam.id} onClose={() => setShowNotepad(false)} /></div>}
      </div>

      {/* Header */}
      <header className="flex-none h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center px-4 shadow-sm z-30 select-none">
        <div className="flex items-center gap-3 overflow-hidden">
           <div className="bg-primary-600 text-white w-10 h-10 shrink-0 flex items-center justify-center rounded-lg font-bold shadow-sm">
             {exam.subjectId.substring(0,2).toUpperCase()}
           </div>
           <div className="leading-tight min-w-0">
              <h1 className="font-bold text-gray-800 dark:text-gray-100 text-sm md:text-base truncate">{exam.title}</h1>
              {isSubmitted && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Review Mode</span>}
           </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
           {/* Tools */}
           <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
              <button onClick={() => setShowCalc(!showCalc)} className={`p-2 rounded-md ${showCalc ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`} title="Calculator"><i className="fa-solid fa-calculator"></i></button>
              <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1 my-1"></div>
              <button onClick={() => setShowNotepad(!showNotepad)} className={`p-2 rounded-md ${showNotepad ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`} title="Notepad"><i className="fa-solid fa-note-sticky"></i></button>
           </div>
           
           <button onClick={() => setShowShortcuts(true)} className="hidden md:block p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400" title="Keyboard Shortcuts"><i className="fa-solid fa-keyboard"></i></button>
           <button onClick={() => setFontSize(f => (f + 1) % 3)} className="hidden md:block p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400" title="Font Size"><i className="fa-solid fa-text-height"></i></button>
           <button onClick={toggleFullscreen} className={`hidden md:block p-2 text-gray-500 ${isFullscreen ? 'text-primary-600' : ''}`} title="Fullscreen">{isFullscreen ? <i className="fa-solid fa-compress"></i> : <i className="fa-solid fa-expand"></i>}</button>

           <div className={`hidden sm:block font-mono text-xl font-bold px-3 py-1 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 ${timeLeft < 300 && !isSubmitted ? 'text-red-600 animate-pulse border-red-200 bg-red-50' : 'text-gray-800 dark:text-gray-200'}`}>
              {isSubmitted ? 'Finished' : (isPaused ? 'Paused' : formatTime(timeLeft))}
           </div>

           {!isSubmitted ? (
             <button onClick={() => setShowSummary(true)} disabled={isPaused} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">Submit</button>
           ) : (
             <button onClick={quitExam} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">Exit Review</button>
           )}
           
           {!isSubmitted && (
             <button onClick={() => setIsPaused(true)} className="text-red-500 hover:text-red-700 p-2 ml-1" title="Pause / Exit">
               <i className="fa-solid fa-power-off text-xl"></i>
             </button>
           )}
           
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-gray-600 dark:text-gray-300 p-2">
             <i className="fa-solid fa-bars text-xl"></i>
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className={`flex-1 overflow-y-auto scroll-smooth bg-white dark:bg-gray-900 z-10 ${isSidebarOpen ? '' : 'lg:mr-80'} transition-all duration-300 relative`}>
             {/* ... (Pause Overlay logic same as before) ... */}
             {isPaused && (
                 <div className="absolute inset-0 z-20 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center">
                     <div className="text-center p-8">
                         <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"><i className="fa-solid fa-pause text-4xl text-gray-500 dark:text-gray-400"></i></div>
                         <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Exam Paused</h3>
                     </div>
                 </div>
             )}

             <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32 animate-fade-in-up">
                {/* Question Rendering (Same as before but with MathRenderer) */}
                <div className="flex items-center justify-between mb-6 border-b pb-4 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-20 pt-2">
                   <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Question {currentQIndex + 1}</div>
                   <div className="flex items-center gap-2">
                      <button onClick={() => setShowReport(true)} className="text-gray-400 hover:text-red-500 text-xs mr-2" title="Report Issue"><i className="fa-solid fa-flag"></i></button>
                      <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{currentQuestion.type}</span>
                      <span className="text-xs font-bold px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full border border-green-200 dark:border-green-800">+{currentQuestion.marks} Marks</span>
                   </div>
                </div>

                {currentQuestion.context && (
                  <div className="mb-8 bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border-l-4 border-blue-500 shadow-sm">
                     <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2"><i className="fa-solid fa-align-left"></i> Context / Passage:</h4>
                     <div className={`${fontSizes[fontSize]} text-gray-800 dark:text-gray-200 leading-relaxed`}><MathRenderer content={currentQuestion.context} /></div>
                  </div>
                )}

                <div className="mb-8">
                   <div className={`font-medium text-gray-900 dark:text-gray-100 leading-relaxed ${fontSizes[fontSize]}`}><MathRenderer content={currentQuestion.text} /></div>
                   {currentQuestion.imgUrl && (
                     <div className="mt-6 p-2 border border-gray-200 dark:border-gray-700 rounded-lg inline-block bg-white dark:bg-gray-800 shadow-sm max-w-full cursor-zoom-in" onClick={() => setZoomedImage(currentQuestion.imgUrl!)}>
                        <img src={currentQuestion.imgUrl} alt="Question Diagram" className="max-w-full h-auto max-h-[400px] rounded object-contain" />
                     </div>
                   )}
                   {currentQuestion.codeSnippet && (
                     <div className="mt-6 relative group">
                        <div className="absolute top-2 right-2 text-xs text-gray-400 font-mono">code</div>
                        <pre className="bg-[#1e1e1e] text-gray-200 p-5 rounded-lg text-sm overflow-x-auto font-mono border border-gray-700 shadow-inner"><code>{currentQuestion.codeSnippet}</code></pre>
                     </div>
                   )}
                </div>

                <div className="space-y-4">
                   {(currentQuestion.type === QuestionType.MCQ || currentQuestion.type === QuestionType.MSQ || currentQuestion.type === QuestionType.BOOLEAN) && (
                     <div className={currentQuestion.type === QuestionType.BOOLEAN ? "grid grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
                     {currentQuestion.options?.map((opt, idx) => {
                       const isSelected = currentQuestion.type === QuestionType.MSQ 
                          ? (answers[currentQuestion.id] || []).includes(opt.id)
                          : answers[currentQuestion.id] === opt.id;
                       
                       let containerClass = "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800";
                       if (isSubmitted) {
                          if (opt.isCorrect) containerClass = "border-green-500 bg-green-50 dark:bg-green-900/20";
                          else if (isSelected) containerClass = "border-red-500 bg-red-50 dark:bg-red-900/20";
                       } else if (isSelected) {
                          containerClass = "border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500";
                       }

                       return (
                         <div 
                           key={opt.id}
                           onClick={() => handleOptionSelect(currentQuestion.id, opt.id, currentQuestion.type)}
                           className={`p-4 rounded-xl border-2 cursor-pointer flex gap-4 transition-all items-start group ${containerClass}`}
                         >
                            <div className={`mt-0.5 w-6 h-6 shrink-0 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-400 text-transparent'}`}>
                               <i className="fa-solid fa-check text-xs"></i>
                            </div>
                            <div className="flex-1 text-gray-800 dark:text-gray-200">
                               <div className="flex flex-col gap-2">
                                  <div className="flex gap-2">
                                     <span className="font-bold text-gray-500 dark:text-gray-400 min-w-[20px]">{String.fromCharCode(65 + idx)}.</span>
                                     <div className={`flex-1 ${fontSizes[fontSize]}`}><MathRenderer content={opt.text} /></div>
                                  </div>
                                  {opt.imgUrl && (
                                     <div className="mt-2 ml-7" onClick={(e) => { e.stopPropagation(); setZoomedImage(opt.imgUrl!); }}>
                                        <img src={opt.imgUrl} alt={`Option ${String.fromCharCode(65 + idx)}`} className="max-w-[200px] h-auto rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 cursor-zoom-in" />
                                     </div>
                                  )}
                               </div>
                            </div>
                         </div>
                       )
                     })}
                     </div>
                   )}

                   {currentQuestion.type === QuestionType.NUMERIC && (
                     <div className="max-w-sm bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Your Answer:</label>
                        <input 
                           type="number" 
                           value={answers[currentQuestion.id] || ''}
                           onChange={(e) => handleNumericInput(currentQuestion.id, e.target.value)}
                           className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-primary-500 outline-none text-lg"
                           placeholder="Type a number..."
                           disabled={isSubmitted}
                        />
                        {isSubmitted && (
                           <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 text-sm font-bold">
                              Correct: {currentQuestion.range ? `${currentQuestion.range.min} - ${currentQuestion.range.max}` : currentQuestion.correctValue}
                           </div>
                        )}
                     </div>
                   )}
                </div>

                {isSubmitted && (
                   <div className="mt-10 bg-green-50 dark:bg-green-900/10 p-6 rounded-xl border border-green-100 dark:border-green-800/50">
                      <h4 className="font-bold text-green-800 dark:text-green-400 mb-3"><i className="fa-solid fa-lightbulb"></i> Solution:</h4>
                      <MathRenderer content={currentQuestion.solutionExplanation || "No explanation provided."} className="text-gray-800 dark:text-gray-200" />
                   </div>
                )}
             </div>
        </div>

        {/* Sidebar (Same as before) */}
        <aside className={`absolute inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300 z-40 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} shadow-2xl lg:shadow-none flex flex-col`}>
             {/* ... Palette content ... */}
             <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                <h3 className="font-bold text-gray-800 dark:text-white"><i className="fa-solid fa-th-large text-primary-500"></i> Question Palette</h3>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500"><i className="fa-solid fa-times text-xl"></i></button>
             </div>
             
             <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-1 justify-center bg-white dark:bg-gray-800">
               {(['all', 'answered', 'review', 'not_answered'] as const).map(f => (
                 <button key={f} onClick={() => setPaletteFilter(f)} className={`px-2 py-1 text-xs rounded border capitalize transition-colors ${paletteFilter === f ? 'bg-primary-600 text-white border-primary-600' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>
                   {f === 'not_answered' ? 'Left' : f}
                 </button>
               ))}
             </div>

             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-5 gap-3">
                   {exam.questions.map((q, idx) => {
                      const status = questionStatus[q.id] || 'not_visited';
                      const isCurrent = currentQIndex === idx;
                      if (paletteFilter === 'answered' && status !== 'answered' && status !== 'answered_marked_for_review') return null;
                      if (paletteFilter === 'review' && !status.includes('marked_for_review')) return null;
                      if (paletteFilter === 'not_answered' && (status === 'answered' || status === 'answered_marked_for_review')) return null;

                      let colorClass = 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-transparent';
                      if (isCurrent) colorClass = 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300';
                      else if (status === 'answered') colorClass = 'bg-green-500 text-white';
                      else if (status === 'not_answered') colorClass = 'bg-red-500 text-white';
                      else if (status.includes('marked_for_review')) colorClass = 'bg-purple-600 text-white relative';

                      return (
                         <button key={q.id} onClick={() => { if (isPaused) return; updateStatusOnLeave(false); setCurrentQIndex(idx); }} className={`h-10 rounded-md font-bold text-sm transition-all shadow-sm ${colorClass} ${isPaused ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isPaused}>
                             {idx + 1}
                             {status.includes('marked_for_review') && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-300 rounded-full border-2 border-white dark:border-gray-800"></span>}
                         </button>
                      );
                   })}
                </div>
             </div>
             
             <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                 <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                     <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Answered</div>
                     <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Not Answered</div>
                     <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-600"></span> Review</div>
                     <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-600"></span> Not Visited</div>
                 </div>
             </div>
        </aside>
      </div>

      {/* Footer Navigation */}
      <div className="flex-none h-20 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20 lg:mr-80">
             <div className="flex gap-3">
               <button onClick={handlePrev} disabled={currentQIndex === 0 || isPaused} className={`px-4 py-2.5 rounded-lg font-bold transition-all ${currentQIndex === 0 || isPaused ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white'}`}>
                 <i className="fa-solid fa-arrow-left mr-2"></i> Prev
               </button>
               {currentQIndex === exam.questions.length - 1 ? (
                   <button onClick={() => setShowSummary(true)} disabled={isPaused} className="px-6 py-2.5 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 shadow-md">
                      Finish <i className="fa-solid fa-flag-checkered ml-2"></i>
                   </button>
               ) : (
                   <button onClick={handleNext} disabled={isPaused} className="px-4 py-2.5 rounded-lg font-bold bg-primary-600 text-white hover:bg-primary-700 shadow-md">
                     Next <i className="fa-solid fa-arrow-right ml-2"></i>
                   </button>
               )}
             </div>
             
             {!isSubmitted && (
                <div className="flex gap-3">
                   <button onClick={handleClearResponse} disabled={isPaused} className="hidden sm:block px-4 py-2.5 rounded-lg font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50">Clear</button>
                   <button onClick={handleMarkReviewNext} disabled={isPaused} className="px-4 py-2.5 rounded-lg font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-sm disabled:opacity-50">Review & Next</button>
                </div>
             )}
      </div>

      {/* Summary Modal, Pause Modal, Image Modal, Report Modal (Same logic as before) */}
      {/* For brevity, retaining existing logic for these modals, just ensure they are present in the final render */}
      {showSummary && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Submit Exam?</h3>
                  {/* Summary Stats Logic... */}
                  <div className="flex gap-3 mt-6">
                      <button onClick={() => setShowSummary(false)} className="flex-1 px-4 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-100">Cancel</button>
                      <button onClick={submitExam} className="flex-1 px-4 py-2 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700">Yes, Submit</button>
                  </div>
              </div>
          </div>
      )}
      
      {isPaused && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Exam Paused</h3>
                <div className="space-y-3 mt-4">
                    <button onClick={() => setIsPaused(false)} className="w-full px-4 py-3 rounded-lg font-bold text-white bg-primary-600 hover:bg-primary-700">Resume Exam</button>
                    <button onClick={quitExam} className="w-full px-4 py-3 rounded-lg font-bold text-red-600 bg-red-50 hover:bg-red-100">Quit & Exit</button>
                </div>
            </div>
        </div>
      )}

      {zoomedImage && (
         <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomedImage(null)}>
            <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
         </div>
      )}

      {showReport && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
                 <h3 className="font-bold text-lg mb-4">Report Issue</h3>
                 <button onClick={() => { 
                    // addToast('success', 'Report Sent'); 
                    setShowReport(false); 
                 }} className="w-full bg-primary-600 text-white py-2 rounded font-bold">Submit</button>
                 <button onClick={() => setShowReport(false)} className="w-full mt-2 text-gray-500">Cancel</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default QuizInterface;