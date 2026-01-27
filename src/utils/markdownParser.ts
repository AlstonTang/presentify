import type { SlideContent } from '../types';

export function parseMarkdownToSlides(markdown: string): SlideContent[] {
    // Simple delimiter-based splitting
    // Use --- for horizontal slides
    // Use -- for vertical slides (optional extension)

    const sections = markdown.split(/\n---\n/);

    return sections.map(section => {
        let content = section.trim();
        let notes = '';

        // Extract speaker notes: text after "Note:" at the end of section
        const noteMatch = content.match(/\nNote:([\s\S]*)$/i);
        if (noteMatch) {
            notes = noteMatch[1].trim();
            content = content.replace(/\nNote:[\s\S]*$/i, '').trim();
        }

        return {
            type: 'slide',
            content,
            notes
        };
    });
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
