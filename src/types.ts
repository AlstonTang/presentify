export interface Presentation {
    id: string;
    title: string;
    markdown: string;
    theme: string;
    globalAlignment?: 'center' | 'left';
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
}
