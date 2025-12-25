import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import QuizInterface from './components/QuizInterface';
import History from './components/History';
import { SUBJECTS } from './data/subjects';
import { EXAM_PAPERS } from './data/exams';
import { Subject, ExamPaper, Level, ExamType, Attempt } from './types';

// Types for View State
type View = 'SUBJECTS' | 'EXAMS' | 'QUIZ' | 'HISTORY';

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [currentView, setCurrentView] = useState<View>('SUBJECTS');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedExam, setSelectedExam] = useState<ExamPaper | null>(null);
  const [quizMode, setQuizMode] = useState<'practice' | 'exam'>('practice');
  const [searchTerm, setSearchTerm] = useState('');
  
  // History State
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  // Filters
  const [activeLevel, setActiveLevel] = useState<string>('All');
  const [activeExamType, setActiveExamType] = useState<string>('All');

  // Init
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem('pyq_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
    }
    
    // Load History
    const savedAttempts = localStorage.getItem('pyq_attempts');
    if (savedAttempts) {
      try {
        setAttempts(JSON.parse(savedAttempts));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pyq_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pyq_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setActiveExamType('All'); // Reset exam filter when entering a subject
    setCurrentView('EXAMS');
  };

  const handleExamStart = (exam: ExamPaper, mode: 'practice' | 'exam') => {
    setSelectedExam(exam);
    setQuizMode(mode);
    setCurrentView('QUIZ');
  };

  const handleQuizComplete = (attempt: Attempt) => {
    const newAttempts = [attempt, ...attempts];
    setAttempts(newAttempts);
    localStorage.setItem('pyq_attempts', JSON.stringify(newAttempts));
  };

  const goHome = () => {
    setCurrentView('SUBJECTS');
    setSelectedSubject(null);
    setSelectedExam(null);
  };

  const goHistory = () => {
    setCurrentView('HISTORY');
  };

  // Filter Logic for Subjects
  const filteredSubjects = SUBJECTS.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = activeLevel === 'All' || s.level === activeLevel;
    return matchesSearch && matchesLevel;
  });

  const groupedSubjects = filteredSubjects.reduce((acc, subject) => {
    if (!acc[subject.level]) acc[subject.level] = [];
    acc[subject.level].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

  // Filter Logic for Exams
  const availableExams = selectedSubject 
    ? EXAM_PAPERS.filter(e => {
        const matchesSubject = e.subjectId === selectedSubject.id;
        const matchesType = activeExamType === 'All' || e.examType === activeExamType;
        return matchesSubject && matchesType;
      })
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-200">
      {currentView !== 'QUIZ' && <Header toggleTheme={toggleTheme} isDark={isDark} onHome={goHome} />}

      <main className={currentView === 'QUIZ' ? 'h-screen' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        {currentView === 'SUBJECTS' && (
          <div className="animate-fade-in-up">
            <div className="mb-8 text-center relative">
              {/* History Button Top Right */}
              <div className="absolute top-0 right-0">
                <button onClick={goHistory} className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors" title="My History">
                  <i className="fa-solid fa-clock-rotate-left text-xl"></i>
                </button>
              </div>

              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                Master Your <span className="text-primary-600">BS Degree</span> Exams
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Practice with real previous year questions, simulate exam environments, and track your progress.
              </p>
              
              <div className="mt-8 max-w-xl mx-auto relative">
                <i className="fa-solid fa-search absolute left-4 top-3.5 text-gray-400"></i>
                <input 
                  type="text" 
                  placeholder="Search for subjects (e.g. Statistics, Python, MLF)..." 
                  className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Level Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {['All', Level.FOUNDATION, Level.DIPLOMA_PROG, Level.DIPLOMA_DS, Level.DEGREE].map((level) => (
                <button
                  key={level}
                  onClick={() => setActiveLevel(level)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeLevel === level
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md transform scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  {level === 'All' ? 'All Levels' : level}
                </button>
              ))}
            </div>

            <div className="space-y-12">
              {Object.entries(groupedSubjects).map(([level, subjects]) => (
                <div key={level}>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                    <span className="w-2 h-8 bg-secondary-500 rounded-full mr-3"></span>
                    {level}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subjects.map(subject => (
                      <div 
                        key={subject.id}
                        onClick={() => handleSubjectSelect(subject)}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 cursor-pointer transition-all transform hover:-translate-y-1 group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {subject.code}
                          </span>
                          <i className="fa-solid fa-chevron-right text-gray-300 group-hover:text-primary-500 transition-colors"></i>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 transition-colors">
                          {subject.name}
                        </h4>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {EXAM_PAPERS.filter(e => e.subjectId === subject.id).length} Papers Available
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {Object.keys(groupedSubjects).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No subjects found matching your filters.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'HISTORY' && (
          <History attempts={attempts} onBack={goHome} />
        )}

        {currentView === 'EXAMS' && selectedSubject && (
          <div className="animate-fade-in-up">
            <button onClick={() => setCurrentView('SUBJECTS')} className="mb-6 text-gray-500 hover:text-primary-600 flex items-center gap-2 transition-colors">
              <i className="fa-solid fa-arrow-left"></i> Back to Subjects
            </button>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-2xl">
                  {selectedSubject.code.substring(0,2)}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedSubject.name}</h2>
                  <p className="text-gray-500 dark:text-gray-400">{selectedSubject.level}</p>
                </div>
              </div>

              {/* Exam Type Filter */}
              <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-lg">
                {['All', ExamType.QUIZ_1, ExamType.QUIZ_2, ExamType.END_TERM].map(type => (
                  <button
                    key={type}
                    onClick={() => setActiveExamType(type)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeExamType === type
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {type === 'All' ? 'All Types' : type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {availableExams.length > 0 ? availableExams.map(exam => (
                <div key={exam.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide 
                        ${exam.examType === ExamType.END_TERM ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 
                          exam.examType === ExamType.QUIZ_2 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                        {exam.examType}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {exam.year} - {exam.set}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <span><i className="fa-regular fa-clock mr-1"></i> {exam.durationMinutes} mins</span>
                      <span><i className="fa-solid fa-list-ol mr-1"></i> {exam.questions.length} Questions</span>
                      <span><i className="fa-solid fa-trophy mr-1"></i> {exam.questions.reduce((a,b) => a + b.marks, 0)} Marks</span>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => handleExamStart(exam, 'practice')}
                      className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium transition-colors"
                    >
                      <i className="fa-solid fa-book-open mr-2"></i> Practice
                    </button>
                    <button 
                      onClick={() => handleExamStart(exam, 'exam')}
                      className="flex-1 sm:flex-none px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-md hover:shadow-lg transition-all"
                    >
                      <i className="fa-solid fa-stopwatch mr-2"></i> Start Exam
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                  <div className="text-gray-400 text-4xl mb-3"><i className="fa-regular fa-folder-open"></i></div>
                  <p className="text-gray-500 font-medium">No past papers found for this filter.</p>
                  <p className="text-gray-400 text-sm mt-1">Try changing the exam type filter.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'QUIZ' && selectedExam && (
          <QuizInterface 
            exam={selectedExam} 
            mode={quizMode} 
            onBack={() => setCurrentView('EXAMS')} 
            onComplete={handleQuizComplete}
          />
        )}
      </main>
    </div>
  );
};

export default App;