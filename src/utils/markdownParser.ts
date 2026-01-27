import type { SlideContent } from '../types';

/**
 * Thresholds for auto-splitting long content
 */
const AUTO_SPLIT_CHAR_LIMIT = 1500;
const AUTO_SPLIT_LINE_LIMIT = 20;

export function parseMarkdownToSlides(markdown: string): SlideContent[] {
    // 1. Split by explicit horizontal separator first
    const horizontalSections = markdown.split(/\n\s*---\s*\n/);
    const result: SlideContent[] = [];

    // Track the current secondary title (H2) for H3+ inheritance
    let currentSecondaryTitle = '';

    horizontalSections.forEach(hSection => {
        // 2. Check for explicit vertical split within horizontal section
        const vSections = hSection.split(/\n\s*--\s*\n/);

        if (vSections.length > 1) {
            const subSlides: SlideContent[] = [];
            vSections.forEach(vSect => {
                const parsed = parseSlide(vSect, currentSecondaryTitle);
                // Update tracker if we found a new H2
                const h2Match = parsed.content.match(/^##\s+(.+)$/m);
                if (h2Match) currentSecondaryTitle = h2Match[1].trim();
                subSlides.push(...autoSplitIfLong(parsed));
            });

            result.push({
                type: 'vertical',
                content: '',
                subSlides
            });
        } else {
            // 3. Detect implicit hierarchy based on header levels
            // We split by any header level (#, ##, ###, etc.)
            const implicitSections = hSection.split(/\n(?=#+\s)/);

            if (implicitSections.length > 1) {
                const subSlides: SlideContent[] = [];
                let hasDeepHeaders = false;

                implicitSections.forEach(sub => {
                    const parsed = parseSlide(sub, currentSecondaryTitle);

                    // Detect if this is a deep header (H3+)
                    if (parsed.content.match(/^###+\s+/)) {
                        hasDeepHeaders = true;
                    }

                    // Update tracker if we found a new H2
                    const h2Match = parsed.content.match(/^##\s+(.+)$/m);
                    if (h2Match) currentSecondaryTitle = h2Match[1].trim();

                    subSlides.push(...autoSplitIfLong(parsed));
                });

                // If any implicit sections were H3+, we treat the whole H-section as a vertical stack
                // to maintain hierarchy and prevent "horizontal clutter"
                if (hasDeepHeaders) {
                    result.push({
                        type: 'vertical',
                        content: '',
                        subSlides
                    });
                } else {
                    // Otherwise, just keep them as separate horizontal slides
                    result.push(...subSlides);
                }
            } else {
                // Single section, check for auto-split
                const parsed = parseSlide(hSection, currentSecondaryTitle);

                // Update tracker if we found a new H2
                const h2Match = parsed.content.match(/^##\s+(.+)$/m);
                if (h2Match) currentSecondaryTitle = h2Match[1].trim();

                const splits = autoSplitIfLong(parsed);
                if (splits.length > 1) {
                    result.push({
                        type: 'vertical',
                        content: '',
                        subSlides: splits
                    });
                } else {
                    result.push(splits[0]);
                }
            }
        }
    });

    return result.filter(s => s.content || (s.subSlides && s.subSlides.length > 0));
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

    // 3. Handle Tertiary Heading (H3) Inheritance
    // If the slide starts with ### (or more), and we have a parent H2 title,
    // modify the title to "{parentTitle} - {currentTitle}"
    if (parentTitle && content.match(/^###+\s+/)) {
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
        content: idx > 0 ? `${headerLevel} ${baseTitle} (Part ${idx + 1})\n\n${sect}` : sect,
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
