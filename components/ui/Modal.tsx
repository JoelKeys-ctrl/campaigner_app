import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-sm select-none overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className={`relative w-full ${maxWidth} bg-white dark:bg-[#18202c] rounded-[28px] border border-slate-200/80 dark:border-gray-800 shadow-2xl p-6 overflow-hidden my-auto transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{title}</h2>
          <button 
            onClick={onClose} 
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-xs font-semibold cursor-pointer transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
