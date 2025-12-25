
import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[200] flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; removeToast: (id: string) => void }> = ({ toast, removeToast }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  const bgColors = {
    success: 'bg-gray-900 text-white dark:bg-white dark:text-gray-900',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-600 text-white'
  };

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-triangle-exclamation',
    info: 'fa-info-circle'
  };

  return (
    <div className={`${bgColors[toast.type]} px-6 py-3 rounded-full shadow-xl flex items-center justify-center gap-3 animate-fade-in-up transition-all transform hover:scale-105 pointer-events-auto`}>
      <i className={`fa-solid ${icons[toast.type]}`}></i>
      <span className="font-medium text-sm">{toast.message}</span>
    </div>
  );
};

export default ToastContainer;