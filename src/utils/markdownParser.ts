import type { SlideContent } from '../types';

/**
 * Thresholds for auto-splitting long content
 */
const AUTO_SPLIT_CHAR_LIMIT = 1500;
const AUTO_SPLIT_LINE_LIMIT = 24;

export function parseMarkdownToSlides(markdown: string): SlideContent[] {
    // 1. Initial split by Horizontal separators (---, H1, H2)
    // These levels always represent a "Main Slide" transition.
    const horizontalSects = markdown.split(/\n\s*---\s*\n|\n(?=#{1,2}\s)/g);
    const result: SlideContent[] = [];
    let currentSecondaryTitle = '';

    horizontalSects.forEach(hSect => {
        const trimmedHSect = hSect.trim();
        if (!trimmedHSect) return;

        // 2. Inside each horizontal section, check for Vertical separators (-- or H3+)
        // These represent sub-slides under the current main slide.
        const verticalSects = trimmedHSect.split(/\n\s*--\s*\n|\n(?=###+\s)/g);

        if (verticalSects.length > 1) {
            const subSlides: SlideContent[] = [];
            verticalSects.forEach(vSect => {
                const chunkSlides = parseAndProcess(vSect, currentSecondaryTitle);
                if (chunkSlides.length === 0) return;

                // Update H2 tracker from the first slide in this vertical chunk if it contains an H2
                const h2Match = chunkSlides[0].content.match(/^##\s+(.+)$/m);
                if (h2Match) currentSecondaryTitle = h2Match[1].trim();

                subSlides.push(...chunkSlides);
            });

            if (subSlides.length > 0) {
                result.push({ type: 'vertical', content: '', subSlides });
            }
        } else {
            // Single vertical slide (may be auto-split later)
            const chunkSlides = parseAndProcess(trimmedHSect, currentSecondaryTitle);
            if (chunkSlides.length === 0) return;

            const h2Match = chunkSlides[0].content.match(/^##\s+(.+)$/m);
            if (h2Match) currentSecondaryTitle = h2Match[1].trim();

            if (chunkSlides.length > 1) {
                result.push({ type: 'vertical', content: '', subSlides: chunkSlides });
            } else {
                result.push(chunkSlides[0]);
            }
        }
    });

    return result.filter(s => s.content || (s.subSlides && s.subSlides.length > 0));
}

/**
 * Internal helper to parse a block of text into SlideContent and handle auto-splitting
 */
function parseAndProcess(text: string, parentTitle: string): SlideContent[] {
    const trimmed = text.trim();
    if (!trimmed) return [];

    const slide = parseSlide(trimmed, parentTitle);
    return autoSplitIfLong(slide);
}

function parseSlide(text: string, parentTitle: string = ''): SlideContent {
    let content = text.trim();
    let notes = '';
    let alignment: 'center' | 'left' = 'center';

    // 1. Detect selective alignment marker ::left
    if (content.startsWith('::left')) {
        alignment = 'left';
        content = content.replace(/^::left\s*/, '').trim();
    }

    // 2. Extract speaker notes
    const noteMatch = content.match(/\nNote:([\s\S]*)$/i);
    if (noteMatch) {
        notes = noteMatch[1].trim();
        content = content.replace(/\nNote:[\s\S]*$/i, '').trim();
    }

    // 3. Handle Tertiary Heading (H3+) Inheritance
    // Prepend the secondary title (H2) for context
    if (parentTitle && content.startsWith('###')) {
        content = content.replace(/^(###+)\s+(.+)$/m, (match, prefix, title) => {
            if (!title.startsWith(parentTitle)) {
                return `${prefix} ${parentTitle} - ${title}`;
            }
            return match;
        });
    }

    return {
        type: 'slide',
        content,
        notes,
        alignment
    };
}

/**
 * Automatically splits extremely long slides into multiple slides (subslides)
 * if they exceed character or line limits.
 */
function autoSplitIfLong(slide: SlideContent): SlideContent[] {
    const lines = slide.content.split('\n');

    if (slide.content.length <= AUTO_SPLIT_CHAR_LIMIT && lines.length <= AUTO_SPLIT_LINE_LIMIT) {
        return [slide];
    }

    const sections: string[] = [];
    let currentChunk: string[] = [];
    let currentCharCount = 0;

    lines.forEach((line) => {
        if ((currentCharCount > AUTO_SPLIT_CHAR_LIMIT * 0.7 && line.startsWith('#')) ||
            (currentChunk.length >= AUTO_SPLIT_LINE_LIMIT)) {

            if (currentChunk.length > 0) {
                sections.push(currentChunk.join('\n'));
                currentChunk = [];
                currentCharCount = 0;
            }
        }
        currentChunk.push(line);
        currentCharCount += line.length + 1;
    });

    if (currentChunk.length > 0) {
        sections.push(currentChunk.join('\n'));
    }

    // Capture the first header for context in continuations
    const headerMatch = slide.content.match(/^(#+)\s+(.+)$/m);
    const baseTitle = headerMatch ? headerMatch[2] : 'Continued';
    const headerLevel = headerMatch ? headerMatch[1] : '##';

    return sections.map((sect, idx) => ({
        ...slide,
        content: idx > 0 ? `${headerLevel} ${baseTitle} (Part ${idx + 1} from above)\n\n${sect}` : sect,
        notes: idx === 0 ? slide.notes : ''
    }));
}

export function generateRevealHtml(slides: SlideContent[]): string {
    return slides.map(slide => {
        if (slide.type === 'vertical' && slide.subSlides) {
            const subHtml = slide.subSlides.map(s => renderSlideHtml(s)).join('\n');
            return `<section>${subHtml}</section>`;
        }
        return renderSlideHtml(slide);
    }).join('\n');
}

function renderSlideHtml(slide: SlideContent): string {
    const alignStyle = slide.alignment === 'left' ? 'style="text-align: left;"' : '';
    return `<section data-markdown ${alignStyle}>
<textarea data-template>
${slide.content}

${slide.notes ? `\nNote:\n${slide.notes}` : ''}
</textarea>
</section>`;
}
