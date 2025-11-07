import React, { useEffect, useRef } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    contentClassName?: string;
    initialFocusRef?: React.RefObject<HTMLElement>;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, contentClassName, initialFocusRef }) => {
    const modalContentRef = useRef<HTMLDivElement>(null);
    const lastFocusedElementRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        lastFocusedElementRef.current = document.activeElement as HTMLElement;

        const modalElement = modalContentRef.current;
        if (!modalElement) return;

        const focusableElements = Array.from(
            modalElement.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        ).filter(el => !el.hasAttribute('disabled'));
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const timer = setTimeout(() => {
            if (initialFocusRef?.current) {
                initialFocusRef.current.focus();
            } else {
                const autoFocusElement = modalElement.querySelector<HTMLElement>('[autofocus]');
                if (autoFocusElement) {
                    autoFocusElement.focus();
                } else if (firstElement) {
                    firstElement.focus();
                } else {
                    modalElement.focus();
                }
            }
        }, 50);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
                return;
            }

            if (event.key === 'Tab') {
                if (focusableElements.length === 0) {
                    event.preventDefault();
                    return;
                }
                
                if (event.shiftKey) { 
                    if (document.activeElement === firstElement) {
                        lastElement?.focus();
                        event.preventDefault();
                    }
                } else { 
                    if (document.activeElement === lastElement) {
                        firstElement?.focus();
                        event.preventDefault();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('keydown', handleKeyDown);
            lastFocusedElementRef.current?.focus();
        };
    }, [isOpen, onClose, initialFocusRef]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 ease-in-out"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                ref={modalContentRef}
                className={contentClassName || "bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl"}
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
            >
                {children}
            </div>
        </div>
    );
};

export default Modal;