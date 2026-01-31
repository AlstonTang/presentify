export interface Presentation {
    id: string;
    title: string;
    markdown: string;
    theme: string;
    globalAlignment?: 'center' | 'left';
    fontFamily?: string;
    createdAt: number;
    updatedAt: number;
}

export interface SlideContent {
    type: 'slide' | 'vertical' | 'fragment';
    content: string;
    notes?: string;
    background?: string;
    subSlides?: SlideContent[];
    alignment?: 'center' | 'left';
    sourceLineRange?: [number, number]; // [startLine, endLine] 0-indexed
}

export interface UserSettings {
    defaultTheme: string;
    defaultFontFamily: string;
    defaultAlignment: 'center' | 'left';
    jumpToCurrentSlide: boolean;
}
