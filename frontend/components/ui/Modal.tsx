'use client';

import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* 内容 */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md
        max-h-[85vh] overflow-y-auto p-5 shadow-xl animate-slide-up">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{title}</h3>
            <button onClick={onClose} className="text-gray-400 text-xl leading-none">
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
