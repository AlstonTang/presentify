export interface Transition {
    id: string;
    label: string;
}

export const transitions: Transition[] = [
    { id: 'none', label: 'none' },
    { id: 'fade-out', label: 'fade-out' },
    { id: 'fade-up', label: 'fade-up' },
    { id: 'fade-down', label: 'fade-down' },
    { id: 'fade-left', label: 'fade-left' },
    { id: 'fade-right', label: 'fade-right' },
    { id: 'fade-in-then-out', label: 'fade-in-then-out' },
    { id: 'current-visible', label: 'current-visible' },
    { id: 'fade-in-then-semi-out', label: 'fade-in-then-semi-out' },
    { id: 'grow', label: 'grow' },
    { id: 'semi-fade-out', label: 'semi-fade-out' },
    { id: 'shrink', label: 'shrink' },
    { id: 'strike', label: 'strike' },
    { id: 'highlight-red', label: 'highlight-red' },
    { id: 'highlight-green', label: 'highlight-green' },
    { id: 'highlight-blue', label: 'highlight-blue' },
    { id: 'highlight-current-red', label: 'highlight-current-red' },
    { id: 'highlight-current-green', label: 'highlight-current-green' },
    { id: 'highlight-current-blue', label: 'highlight-current-blue' }
];

export const getTransitionById = (id: string): Transition =>
    transitions.find(t => t.id === id) || transitions[0];