import { transitions } from './utils/transitions'

export type transitions = (typeof transitions)[number]['id']

export interface Presentation {
    id: string;
    title: string;
    markdown: string;
    theme: string;
    globalAlignment?: 'center' | 'left';
    fontFamily?: string;
    globalTransition?: transitions;
    createdAt: number;
    updatedAt: number;
}

export interface SlideContent {
    type: 'slide' | 'vertical' | 'fragment';
    content: string;
    notes?: string;
    background?: string;
    subSlides?: SlideContent[];
    transition?: transitions;
    alignment?: string;
    sourceLineRange?: [number, number]; // [startLine, endLine] 0-indexed
}

export interface UserSettings {
    defaultTheme: string;
    defaultFontFamily: string;
    defaultAlignment: 'center' | 'left';
    jumpToCurrentSlide: boolean;
}
