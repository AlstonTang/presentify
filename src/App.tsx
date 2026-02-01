import React from 'react';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { PresentationViewer } from './components/PresentationViewer';
import { Settings } from './components/Settings';
import type { Presentation } from './types';
import { storage } from './utils/storage';
import { v4 as uuidv4 } from 'uuid';

import { motion, AnimatePresence } from 'framer-motion';

type View = 'dashboard' | 'editor' | 'present';

// URL path helpers
const getPathInfo = () => {
    const path = window.location.pathname;
    const hash = window.location.hash;

    if (path.startsWith('/edit/')) {
        return { view: 'editor' as View, id: path.slice(6) };
    }
    if (path.startsWith('/present/')) {
        const id = path.slice(9);
        // Parse slide indices from hash (e.g., #/1/2)
        const slideMatch = hash.match(/^#\/(\d+)(?:\/(\d+))?$/);
        return {
            view: 'present' as View,
            id,
            slideH: slideMatch ? parseInt(slideMatch[1]) : 0,
            slideV: slideMatch ? parseInt(slideMatch[2] || '0') : 0
        };
    }
    return { view: 'dashboard' as View, id: null, slideH: 0, slideV: 0 };
};

const updateUrl = (view: View, id?: string | null, title?: string, indices?: [number, number]) => {
    let path = '/';
    let hash = '';
    let pageTitle = 'Presentify';

    if (view === 'editor' && id) {
        path = `/edit/${id}`;
        pageTitle = title ? `${title} - Edit | Presentify` : 'Editor | Presentify';
    } else if (view === 'present' && id) {
        path = `/present/${id}`;
        pageTitle = title ? `${title} - Present | Presentify` : 'Presenting | Presentify';
        if (indices) {
            hash = `#/${indices[0]}/${indices[1]}`;
        }
    }

    window.history.pushState({ view, id }, '', path + hash);
    document.title = pageTitle;
};

const App: React.FC = () => {
    const [view, setView] = React.useState<View>('dashboard');
    const [currentId, setCurrentId] = React.useState<string | null>(null);
    const [isPresenting, setIsPresenting] = React.useState(false);
    const [startIndices, setStartIndices] = React.useState<[number, number] | undefined>(undefined);
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

    // Lifted Editor State
    const [editorMarkdown, setEditorMarkdown] = React.useState('');
    const [editorTitle, setEditorTitle] = React.useState('');
    const [editorTheme, setEditorTheme] = React.useState('black');
    const [editorGlobalAlignment, setEditorGlobalAlignment] = React.useState<'center' | 'left'>('center');
    const [editorFontFamily, setEditorFontFamily] = React.useState('Outfit');

    // Initialize from URL on mount
    React.useEffect(() => {
        const pathInfo = getPathInfo();

        if (pathInfo.view === 'editor' && pathInfo.id) {
            const p = storage.getPresentationById(pathInfo.id);
            if (p) {
                setCurrentId(pathInfo.id);
                setEditorMarkdown(p.markdown);
                setEditorTitle(p.title);
                setEditorTheme(p.theme);
                setEditorGlobalAlignment(p.globalAlignment || 'center');
                setEditorFontFamily(p.fontFamily || 'Outfit');
                setView('editor');
                document.title = `${p.title} - Edit | Presentify`;
            } else {
                // Presentation not found, go to dashboard
                updateUrl('dashboard');
                setView('dashboard');
            }
        } else if (pathInfo.view === 'present' && pathInfo.id) {
            const p = storage.getPresentationById(pathInfo.id);
            if (p) {
                setCurrentId(pathInfo.id);
                setEditorMarkdown(p.markdown);
                setEditorTitle(p.title);
                setEditorTheme(p.theme);
                setEditorGlobalAlignment(p.globalAlignment || 'center');
                setEditorFontFamily(p.fontFamily || 'Outfit');
                setStartIndices([pathInfo.slideH || 0, pathInfo.slideV || 0]);
                setIsPresenting(true);
                setView('present');
                document.title = `${p.title} - Present | Presentify`;
            } else {
                updateUrl('dashboard');
                setView('dashboard');
            }
        } else {
            document.title = 'Presentify - Beautiful Presentations from Markdown';
        }

        // Handle browser back/forward
        const handlePopState = (event: PopStateEvent) => {
            const state = event.state;
            if (state?.view === 'editor' && state?.id) {
                const p = storage.getPresentationById(state.id);
                if (p) {
                    setCurrentId(state.id);
                    setEditorMarkdown(p.markdown);
                    setEditorTitle(p.title);
                    setEditorTheme(p.theme);
                    setEditorGlobalAlignment(p.globalAlignment || 'center');
                    setEditorFontFamily(p.fontFamily || 'Outfit');
                    setIsPresenting(false);
                    setView('editor');
                }
            } else if (state?.view === 'present' && state?.id) {
                setIsPresenting(true);
                setView('present');
            } else {
                setIsPresenting(false);
                setView('dashboard');
                setCurrentId(null);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const handleCreate = () => {
        const settings = storage.getSettings();
        const newId = uuidv4();
        const newPresentation: Presentation = {
            id: newId,
            title: 'Untitled Presentation',
            markdown: '# Welcome to Presentify\n\n*A new way to turn Markdown into beautiful presentations*\n\n## Getting Started\n\n- Write your content in Markdown\n- Use `---` to separate slides\n- Press **Present** to view\n\n## Math Support\n\nInline: $E = mc^2$\n\nBlock:\n$$\\int_{a}^{b} x^2 dx = \\frac{b^3 - a^3}{3}$$\n\nNote:\nThese are speaker notes - only you can see them!',
            theme: settings.defaultTheme,
            globalAlignment: settings.defaultAlignment,
            fontFamily: settings.defaultFontFamily,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        storage.savePresentation(newPresentation);
        setCurrentId(newId);
        setEditorMarkdown(newPresentation.markdown);
        setEditorTitle(newPresentation.title);
        setEditorTheme(newPresentation.theme);
        setEditorGlobalAlignment(newPresentation.globalAlignment || 'center');
        setEditorFontFamily(newPresentation.fontFamily || 'Outfit');
        setView('editor');
        updateUrl('editor', newId, newPresentation.title);
    };

    const handleSelect = (id: string) => {
        const p = storage.getPresentationById(id);
        if (p) {
            setCurrentId(id);
            setEditorMarkdown(p.markdown);
            setEditorTitle(p.title);
            setEditorTheme(p.theme);
            setEditorGlobalAlignment(p.globalAlignment || 'center');
            setEditorFontFamily(p.fontFamily || 'Outfit');
            setView('editor');
            updateUrl('editor', id, p.title);
        }
    };

    const handleSave = (p: Presentation) => {
        setEditorMarkdown(p.markdown);
        setEditorTitle(p.title);
        setEditorTheme(p.theme);
        setEditorGlobalAlignment(p.globalAlignment || 'center');
        setEditorFontFamily(p.fontFamily || 'Outfit');
        storage.savePresentation(p);
        // Update URL with new title
        updateUrl('editor', p.id, p.title);
    };

    const handleBack = () => {
        setView('dashboard');
        setCurrentId(null);
        setIsPresenting(false);
        updateUrl('dashboard');
    };

    const handlePresent = (indices?: [number, number]) => {
        setStartIndices(indices);
        setIsPresenting(true);
        setView('present');
        updateUrl('present', currentId, editorTitle, indices);
    };

    const handleExitPresent = () => {
        setIsPresenting(false);
        if (currentId) {
            setView('editor');
            updateUrl('editor', currentId, editorTitle);
        } else {
            setView('dashboard');
            updateUrl('dashboard');
        }
    };

    const handlePlayFromDashboard = (id: string) => {
        const p = storage.getPresentationById(id);
        if (p) {
            setCurrentId(id);
            setEditorMarkdown(p.markdown);
            setEditorTitle(p.title);
            setEditorTheme(p.theme);
            setEditorGlobalAlignment(p.globalAlignment || 'center');
            setEditorFontFamily(p.fontFamily || 'Outfit');
            setIsPresenting(true);
            setView('present');
            updateUrl('present', id, p.title);
        }
    };



    return (
        <div className="min-h-screen bg-#050811">
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
                            onPlay={handlePlayFromDashboard}
                            onSettings={() => setIsSettingsOpen(true)}
                        />
                    </motion.div>
                )}

                {view === 'editor' && currentId && !isPresenting && (
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
                                globalAlignment: editorGlobalAlignment,
                                fontFamily: editorFontFamily,
                                createdAt: Date.now(),
                                updatedAt: Date.now()
                            }}
                            onSave={handleSave}
                            onBack={handleBack}
                            onPresent={handlePresent}

                        />
                    </motion.div>
                )}

                {(view === 'present' || isPresenting) && (
                    <motion.div
                        key="player"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <PresentationViewer
                            markdown={editorMarkdown}
                            theme={editorTheme}
                            globalAlignment={editorGlobalAlignment}
                            fontFamily={editorFontFamily}
                            onClose={handleExitPresent}
                            initialIndices={startIndices}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};

export default App;
