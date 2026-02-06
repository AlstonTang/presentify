import React from 'react';
import { Sparkles } from 'lucide-react'; // Using 'Type' icon for fonts
import { transitions, getTransitionById } from '../utils/transitions';
import { BaseSelector } from './BaseSelector';

interface TransitionSelectorProps {
    currentTransition: string;
    onTransitionChange: (transitionId: string) => void;
}

export const TransitionSelector: React.FC<TransitionSelectorProps> = ({ currentTransition, onTransitionChange }) => {
    const selectedTransition = getTransitionById(currentTransition);

    return (
        <BaseSelector
            items={transitions}
            selectedItem={selectedTransition}
            onSelect={onTransitionChange}
            icon={Sparkles}
            iconColorClass="text-blue-400"
        />
    );
};