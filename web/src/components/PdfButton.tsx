import React from 'react';

interface PdfButtonProps {
  onClick: () => void;
  title?: string;
  className?: string;
}

export const PdfButton: React.FC<PdfButtonProps> = ({ 
  onClick, 
  title = "Descargar Reporte PDF",
  className = "" 
}) => {
  return (
    <button 
      onClick={onClick}
      className={`min-h-[44px] min-w-[44px] flex items-center justify-center border-2 border-slate-900 dark:border-white bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none ${className}`}
      title={title}
    >
      <span className="material-symbols-outlined">picture_as_pdf</span>
    </button>
  );
};
