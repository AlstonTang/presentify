import React from 'react';
import { Settings as SettingsIcon, X, Check, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UserSettings } from '../types';
import { storage } from '../utils/storage';
import { ThemeSelector } from './ThemeSelector';
import { FontSelector } from './FontSelector'

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
    const [settings, setSettings] = React.useState<UserSettings>(storage.getSettings());
    const [saved, setSaved] = React.useState(false);

    const handleSave = () => {
        storage.saveSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6 sm:p-0">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl bg-[#0a0e1a] text-white border border-white/10 rounded-3xl shadow-2xl"
            >
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                                <SettingsIcon size={20} className="text-violet-400" />
                            </div>
                            <h2 className="text-2xl font-bold">Preferences</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <X size={20} className="text-text-dim" />
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* Appearance Section */}
                        <section>
                            <h3 className="text-xs font-bold uppercase text-text-dim mb-4">Default Appearance</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-text-muted">Default Theme</label>
                                    <ThemeSelector currentTheme={settings.defaultTheme} onThemeChange={(e) => setSettings({ ...settings, defaultTheme: e })}/>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-text-muted">Default Font</label>
                                    <FontSelector currentFont={settings.defaultFontFamily} onFontChange={(e) => setSettings({ ...settings, defaultFontFamily: e })}/>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim mb-4">Editing Experience</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                                            <Zap size={20} />
                                        </div>
                                        <div>
                                            <div className="font-semibold">Jump to Current Slide</div>
                                            <div className="text-xs text-text-dim">Automatically start presentation at the slide under your cursor or selected in preview.</div>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.jumpToCurrentSlide}
                                            onChange={(e) => setSettings({ ...settings, jumpToCurrentSlide: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500" />
                                    </label>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="mt-12 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all border border-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className={`px-8 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${saved ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                                }`}
                        >
                            {saved ? <Check size={18} /> : null}
                            <span>{saved ? 'Saved' : 'Save Changes'}</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
