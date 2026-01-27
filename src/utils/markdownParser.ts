import type { SlideContent } from '../types';

export function parseMarkdownToSlides(markdown: string): SlideContent[] {
    // 1. Split by explicit separator first
    const explicitSections = markdown.split(/\n\s*---\s*\n/);
    const allSlides: SlideContent[] = [];

    explicitSections.forEach(section => {
        // 2. Within each section, split by H1 or H2 headers
        // We use a positive lookahead (?=...) so the header stays with its content
        // This handles cases where people want to start a new slide with just a header
        const implicitSections = section.split(/\n(?=#+\s)/);

        implicitSections.forEach(subSection => {
            const trimmed = subSection.trim();
            if (!trimmed) return;

            let content = trimmed;
            let notes = '';

            // Extract speaker notes: text after "Note:" at the end of section
            const noteMatch = content.match(/\nNote:([\s\S]*)$/i);
            if (noteMatch) {
                notes = noteMatch[1].trim();
                content = content.replace(/\nNote:[\s\S]*$/i, '').trim();
            }

            allSlides.push({
                type: 'slide',
                content,
                notes
            });
        });
    });

    return allSlides;
}

export function generateRevealHtml(slides: SlideContent[]): string {
    return slides.map(slide => {
        let slideHtml = `<section data-markdown>
<textarea data-template>
${slide.content}

${slide.notes ? `\nNote:\n${slide.notes}` : ''}
</textarea>
</section>`;
        return slideHtml;
    }).join('\n');
}
