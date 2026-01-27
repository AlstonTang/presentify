import React from 'react';
import Reveal from 'reveal.js';
import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js';
import Notes from 'reveal.js/plugin/notes/notes.esm.js';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

// Import reveal.js styles
import 'reveal.js/dist/reveal.css';

interface PresentationViewerProps {
    markdown: string;
    theme: string;
    onClose: () => void;
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({ markdown, theme, onClose }) => {
    const deckRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        // Dynamically load theme CSS
        const linkId = 'reveal-theme';
        const existingLink = document.getElementById(linkId);
        if (existingLink) existingLink.remove();

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://cdn.jsdelivr.net/npm/reveal.js/dist/theme/${theme}.css`;
        link.id = linkId;
        document.head.appendChild(link);

        if (deckRef.current) {
            const deck = new Reveal(deckRef.current, {
                plugins: [Markdown, Notes],
                embedded: false,
                hash: true,
                mouseWheel: true,
                transition: 'slide',
                backgroundTransition: 'fade',
                markdown: {
                    separator: '^\n---\n',
                    notesSeparator: 'Note:'
                }
            });

            deck.initialize().then(() => {
                // Force layout recalculation after a short delay to fix scaling issues
                setTimeout(() => {
                    deck.layout();
                }, 100);
                setTimeout(() => {
                    deck.layout();
                }, 500);
            });
        }

        return () => {
            // Cleanup theme CSS
            const linkToRemove = document.getElementById(linkId);
            if (linkToRemove) linkToRemove.remove();
        };
    }, [theme]);

    // Close with Escape key
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
        >
            <div className="absolute top-6 right-6 z-[110] flex gap-3">
                <button
                    onClick={onClose}
                    className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl text-white transition-all hover:scale-110 active:scale-90 shadow-2xl"
                    title="Exit Presentation"
                >
                    <X size={24} />
                </button>
            </div>

            <div className="reveal" ref={deckRef}>
                <div className="slides">
                    <section
                        data-markdown=""
                        data-separator="^\n---\n"
                        data-notes="Note:"
                    >
                        <textarea data-template defaultValue={markdown} />
                    </section>
                </div>
            </div>
        </motion.div>
    );
};
