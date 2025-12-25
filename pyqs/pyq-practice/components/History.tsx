import React, { useMemo } from 'react';
import { Attempt } from '../types';

interface HistoryProps {
  attempts: Attempt[];
  onBack: () => void;
}

const History: React.FC<HistoryProps> = ({ attempts, onBack }) => {
  
  // Analytics Calculations
  const analytics = useMemo(() => {
    if (attempts.length === 0) return null;

    const totalAttempts = attempts.length;
    const avgScore = attempts.reduce((acc, curr) => acc + (curr.score / curr.totalMarks) * 100, 0) / totalAttempts;
    const totalTime = attempts.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0);
    
    // Group by Subject Logic would go here if we had subject names in Attempt, 
    // for now we use examTitle to loosely group or just show recent.
    
    return {
      totalAttempts,
      avgScore: avgScore.toFixed(1),
      totalTimeHours: (totalTime / 3600).toFixed(1)
    };
  }, [attempts]);

  return (
    <div className="animate-fade-in-up pb-10">
      <button onClick={onBack} className="mb-6 text-gray-500 hover:text-primary-600 flex items-center gap-2 transition-colors">
        <i className="fa-solid fa-arrow-left"></i> Back to Subjects
      </button>

      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Performance Analytics</h2>

      {attempts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-6xl text-gray-300 dark:text-gray-600 mb-4">
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No attempts yet</h3>
          <p className="text-gray-500 dark:text-gray-400">Complete a quiz to see your detailed analytics.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <i className="fa-solid fa-clipboard-check text-xl"></i>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.totalAttempts}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Exams Taken</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                  <i className="fa-solid fa-percent text-xl"></i>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.avgScore}%</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Average Score</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                  <i className="fa-solid fa-hourglass-half text-xl"></i>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.totalTimeHours}h</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Time Practiced</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed History Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white">Recent Attempts</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exam</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {attempts.map((attempt, idx) => {
                    const percentage = (attempt.score / attempt.totalMarks) * 100;
                    let barColor = "bg-red-500";
                    if (percentage >= 80) barColor = "bg-green-500";
                    else if (percentage >= 50) barColor = "bg-yellow-500";

                    return (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {attempt.examTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(attempt.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                          {attempt.score} / {attempt.totalMarks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 inline-block">{Math.round(percentage)}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;