import { useEffect } from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = '確認',
    cancelText = '取消',
    isDanger = false,
    onConfirm,
    onCancel
}: ConfirmModalProps) {
    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
            />

            {/* Modal Content */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 border border-gray-100">
                <div className="p-6 text-center space-y-3">
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">
                        {message}
                    </p>
                </div>

                <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        className="py-4 text-sm font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`py-4 text-sm font-bold transition-colors
                            ${isDanger
                                ? 'text-red-500 hover:bg-red-50 active:bg-red-100'
                                : 'text-blue-600 hover:bg-blue-50 active:bg-blue-100'
                            }
                        `}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
