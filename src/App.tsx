import React from 'react';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { PresentationViewer } from './components/PresentationViewer';
import type { Presentation } from './types';
import { storage } from './utils/storage';
import { v4 as uuidv4 } from 'uuid';
import { enhanceMarkdown } from './utils/aiEnhancer';
import { motion, AnimatePresence } from 'framer-motion';

type View = 'dashboard' | 'editor' | 'player';

const App: React.FC = () => {
    const [view, setView] = React.useState<View>('dashboard');
    const [currentId, setCurrentId] = React.useState<string | null>(null);
    const [previewContent, setPreviewContent] = React.useState<{ markdown: string, theme: string } | null>(null);

    // Lifted Editor State
    const [editorMarkdown, setEditorMarkdown] = React.useState('');
    const [editorTitle, setEditorTitle] = React.useState('');
    const [editorTheme, setEditorTheme] = React.useState('black');

    const handleCreate = () => {
        const newId = uuidv4();
        const newPresentation: Presentation = {
            id: newId,
            title: 'Untitled Presentation',
            markdown: '# Welcome to Presentify\n\nEdit this to start!\n\n---\n\n## Second Slide\n\n- Point 1\n- Point 2\n\nMathematical Magic:\n$E = mc^2$\n\n$$\n\\int_{a}^{b} x^2 dx = \\frac{b^3 - a^3}{3}\n$$\n\nNote:\nThese are speaker notes.',
            theme: 'black',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        storage.savePresentation(newPresentation);
        setCurrentId(newId);
        setEditorMarkdown(newPresentation.markdown);
        setEditorTitle(newPresentation.title);
        setEditorTheme(newPresentation.theme);
        setView('editor');
    };

    const handleSelect = (id: string) => {
        const p = storage.getPresentationById(id);
        if (p) {
            setCurrentId(id);
            setEditorMarkdown(p.markdown);
            setEditorTitle(p.title);
            setEditorTheme(p.theme);
            setView('editor');
        }
    };

    const handleSave = (p: Presentation) => {
        storage.savePresentation(p);
    };

    const handleBack = () => {
        setView('dashboard');
        setCurrentId(null);
    };

    const handlePreview = (markdown: string, theme: string, title?: string) => {
        // Update lifted state before switching to player
        setEditorMarkdown(markdown);
        setEditorTheme(theme);
        if (title !== undefined) setEditorTitle(title);

        setPreviewContent({ markdown, theme });
        setView('player');
    };

    const handleAiEnhance = async (markdown: string, onProgress?: (status: string) => void): Promise<string> => {
        return await enhanceMarkdown(markdown, onProgress);
    };

    return (
        <div className="min-h-screen bg-[#050811]">
            <AnimatePresence mode="wait">
                {view === 'dashboard' && (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Dashboard
                            onSelect={handleSelect}
                            onCreate={handleCreate}
                            onPlay={(id) => {
                                const p = storage.getPresentationById(id);
                                if (p) {
                                    handlePreview(p.markdown, p.theme, p.title);
                                }
                            }}
                        />
                    </motion.div>
                )}

                {view === 'editor' && currentId && (
                    <motion.div
                        key="editor"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Editor
                            presentation={{
                                id: currentId,
                                title: editorTitle,
                                markdown: editorMarkdown,
                                theme: editorTheme,
                                createdAt: Date.now(),
                                updatedAt: Date.now()
                            }}
                            onSave={handleSave}
                            onBack={handleBack}
                            onPreview={handlePreview}
                            onAiEnhance={handleAiEnhance}
                        />
                    </motion.div>
                )}

                {view === 'player' && previewContent && (
                    <motion.div
                        key="player"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <PresentationViewer
                            markdown={previewContent.markdown}
                            theme={previewContent.theme}
                            onClose={() => setView(currentId ? 'editor' : 'dashboard')}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default App;
