
import React from 'react';
import { Attempt } from '../types';

interface ResultDashboardProps {
  attempt: Attempt;
  onReview: () => void;
  onHome: () => void;
}

const ResultDashboard: React.FC<ResultDashboardProps> = ({ attempt, onReview, onHome }) => {
  const percentage = Math.round((attempt.score / attempt.totalMarks) * 100);
  const timeFormatted = `${Math.floor(attempt.timeSpentSeconds / 60)}m ${attempt.timeSpentSeconds % 60}s`;

  let gradeColor = 'text-red-500';
  let gradeText = 'Needs Improvement';
  let gradeIcon = 'fa-chart-line';

  if (percentage >= 90) { gradeColor = 'text-green-500'; gradeText = 'Outstanding!'; gradeIcon = 'fa-trophy'; }
  else if (percentage >= 75) { gradeColor = 'text-blue-500'; gradeText = 'Excellent'; gradeIcon = 'fa-medal'; }
  else if (percentage >= 50) { gradeColor = 'text-yellow-500'; gradeText = 'Good'; gradeIcon = 'fa-thumbs-up'; }

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in-up">
        
        <div className="text-center mb-10">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-white dark:bg-gray-800 shadow-xl mb-6 ${gradeColor}`}>
                <i className={`fa-solid ${gradeIcon} text-5xl`}></i>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">{gradeText}</h1>
            <p className="text-gray-500 dark:text-gray-400">You have completed <b>{attempt.examTitle}</b></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard label="Your Score" value={`${attempt.score} / ${attempt.totalMarks}`} subtext={`${percentage}%`} icon="fa-star" color="text-yellow-500" />
            <StatCard label="Time Taken" value={timeFormatted} subtext="Duration" icon="fa-clock" color="text-blue-500" />
            <StatCard label="Accuracy" value="N/A" subtext="Calculated in Review" icon="fa-crosshairs" color="text-purple-500" />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">What would you like to do next?</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                    onClick={onReview}
                    className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                    <i className="fa-solid fa-magnifying-glass"></i> Review Solutions
                </button>
                <button 
                    onClick={onHome}
                    className="px-8 py-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-3"
                >
                    <i className="fa-solid fa-house"></i> Back to Home
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<any> = ({ label, value, subtext, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-5">
        <div className={`w-14 h-14 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center ${color}`}>
            <i className={`fa-solid ${icon} text-2xl`}></i>
        </div>
        <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{label}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</div>
            <div className="text-xs text-gray-400 mt-1">{subtext}</div>
        </div>
    </div>
);

export default ResultDashboard;