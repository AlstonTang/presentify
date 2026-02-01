import { type ReactNode } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';

interface SelectorItem {
    id: string;
    label: string;
}

interface BaseSelectorProps<T extends SelectorItem> {
    selectedItem: T;
    items: T[];
    onSelect: (id: string) => void;
    icon: LucideIcon;
    iconColorClass?: string;
    // This prop allows the concrete component to define how the "dot" or "preview" looks
    renderItemPrefix?: (item: T) => ReactNode;
}

export function BaseSelector<T extends SelectorItem>({
    selectedItem,
    items,
    onSelect,
    icon: Icon,
    iconColorClass = "text-violet-400",
    renderItemPrefix
}: BaseSelectorProps<T>) {
    return (
        <div className="relative group/selector text-sm -mr-3">
            {/* Trigger Button */}
            <button className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/5 rounded-lg transition-all text-text-muted hover:text-white cursor-pointer group-hover/selector:bg-white/5 mr-3">
                <Icon size={14} className={iconColorClass} />
                <span className="font-semibold tracking-wide whitespace-nowrap">
                    {selectedItem.label}
                </span>
                <ChevronDown size={14} className="opacity-40 group-hover/selector:rotate-180 transition-transform" />
            </button>

            {/* Dropdown Menu */}
            <div className="absolute top-full right-0 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover/selector:opacity-100 group-hover/selector:translate-y-0 group-hover/selector:pointer-events-auto transition-all z-[100]">
                <div className="w-56 bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl translate-y-1">
                    <div className="grid grid-cols-1 gap-1">
                        {items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onSelect(item.id)}
                                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all hover:bg-white/10 text-left ${
                                    selectedItem.id === item.id ? 'bg-white/5 text-white' : 'text-text-dim hover:text-white'
                                }`}
                            >
                                {renderItemPrefix && renderItemPrefix(item)}
                                <span className="font-medium">{item.label}</span>
                                {selectedItem.id === item.id && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}