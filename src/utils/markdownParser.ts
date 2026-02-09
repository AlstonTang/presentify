import type { SlideContent, transitions } from '../types';

/**
 * Thresholds for auto-splitting long content
 */
const AUTO_SPLIT_CHAR_LIMIT = 1500;
const AUTO_SPLIT_LINE_LIMIT = 24;

export function parseMarkdownToSlides(markdown: string, globalTransition: transitions = 'none'): SlideContent[] {
    const result: SlideContent[] = [];
    let currentSecondaryTitle = '';

    const lines = markdown.split('\n');
    let currentSlideLines: string[] = [];
    let startLine = 0;

    const pushSlide = (sectionLines: string[], sLine: number) => {
        const text = sectionLines.join('\n').trim();
        if (!text || text === '---') return;

        // Split into vertical sections based on "--" or "###" headers
        const verticalSects = text.split(/\n\s*--\s*\n|\n(?=###+\s)/g);

        if (verticalSects.length > 1) {
            const subSlides: SlideContent[] = [];
            let vStartOffset = 0;
            verticalSects.forEach(vSect => {
                const vLines = vSect.split('\n');
                const chunkSlides = parseAndProcess(vSect, currentSecondaryTitle, sLine + vStartOffset, globalTransition);

                if (chunkSlides.length > 0) {
                    const h2Match = chunkSlides[0].content.match(/^##\s+(.+)$/m);
                    if (h2Match) currentSecondaryTitle = h2Match[1].trim();
                    subSlides.push(...chunkSlides);
                }
                vStartOffset += vLines.length + 1;
            });

            if (subSlides.length > 0) {
                result.push({ type: 'vertical', content: '', subSlides });
            }
        } else {
            const chunkSlides = parseAndProcess(text, currentSecondaryTitle, sLine, globalTransition);
            if (chunkSlides.length === 0) return;

            const h2Match = chunkSlides[0].content.match(/^##\s+(.+)$/m);
            if (h2Match) currentSecondaryTitle = h2Match[1].trim();

            if (chunkSlides.length > 1) {
                result.push({ type: 'vertical', content: '', subSlides: chunkSlides });
            } else {
                result.push(chunkSlides[0]);
            }
        }
    };

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        const isExplicitSep = trimmed === '---';
        const isHeaderSep = line.startsWith('# ') || line.startsWith('## ');

        if (isExplicitSep || isHeaderSep) {
            if (currentSlideLines.length > 0 && currentSlideLines.some(l => l.trim() !== '')) {
                pushSlide(currentSlideLines, startLine);
                currentSlideLines = [];
            }
            startLine = idx;
            if (isExplicitSep) return;
        }
        currentSlideLines.push(line);
    });
    pushSlide(currentSlideLines, startLine);

    return result.filter(s => s.content || (s.subSlides && s.subSlides.length > 0));
}

function parseAndProcess(text: string, parentTitle: string, startLine: number, globalTransition: transitions): SlideContent[] {
    const trimmed = text.trim();
    if (!trimmed) return [];

    const slide = parseSlide(trimmed, parentTitle);
    slide.sourceLineRange = [startLine, startLine + text.split('\n').length - 1];

    const transitionToUse = (slide.transition && slide.transition !== 'none')
        ? slide.transition
        : globalTransition;

    if (transitionToUse && transitionToUse !== 'none') {
        slide.content = applyFragments(slide.content, transitionToUse);
    }

    return autoSplitIfLong(slide, startLine);
}

/**
 * Injects Reveal.js fragment classes.
 * 
 * Strategy:
 * - For code/math blocks: Apply comment on same line (these are block-level elements)
 * - For list items: Wrap content in <span class="fragment"> to directly apply the class
 * - For paragraphs: Put comment on SEPARATE LINE after content, so it becomes a sibling 
 *   of the <p> element rather than a child (preventing it from attaching to inline elements)
 */
function applyFragments(content: string, type: string): string {
    const lines = content.split('\n');
    const cleanType = type.replace(/^fragment\s+/, '');
    const fragmentClass = `fragment ${cleanType}`.trim();

    let inCodeBlock = false;
    let inMathBlock = false;
    let inTableBlock = false;
    let inQuoteBlock = false;

    let pendingCodeBlockFragment = false;
    let pendingMathBlockFragment = false;
    // We don't need pending flags for tables/quotes because we just append the comment after the block

    const result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // 1. Handle Code Blocks
        if (trimmed.startsWith('```')) {
            if (inTableBlock) { inTableBlock = false; result.push(`<!-- .element: class="${fragmentClass}" -->`); }
            if (inQuoteBlock) { inQuoteBlock = false; result.push(`<!-- .element: class="${fragmentClass}" -->`); }

            if (!inCodeBlock) {
                inCodeBlock = true;
                pendingCodeBlockFragment = !line.includes('.element');
                result.push(line);
            } else {
                inCodeBlock = false;
                result.push(line);
                if (pendingCodeBlockFragment) {
                    result.push(`<!-- .element: class="${fragmentClass}" -->`);
                    pendingCodeBlockFragment = false;
                }
            }
            continue;
        }

        if (inCodeBlock) {
            result.push(line);
            continue;
        }

        // 2. Handle Multi-line Math Blocks ($$)
        if (trimmed.startsWith('$$')) {
            if (inTableBlock) { inTableBlock = false; result.push(`<!-- .element: class="${fragmentClass}" -->`); }
            if (inQuoteBlock) { inQuoteBlock = false; result.push(`<!-- .element: class="${fragmentClass}" -->`); }

            if (!inMathBlock && !trimmed.endsWith('$$')) {
                inMathBlock = true;
                pendingMathBlockFragment = !line.includes('.element');
                result.push(line);
            } else if (inMathBlock) {
                inMathBlock = false;
                result.push(line);
                if (pendingMathBlockFragment) {
                    result.push(`<!-- .element: class="${fragmentClass}" -->`);
                    pendingMathBlockFragment = false;
                }
            } else {
                result.push(line);
                result.push(`<!-- .element: class="${fragmentClass}" -->`);
            }
            continue;
        }

        if (inMathBlock) {
            result.push(line);
            continue;
        }

        // 3. Handle Tables (lines starting with |)
        if (trimmed.startsWith('|')) {
            if (inQuoteBlock) { inQuoteBlock = false; result.push(`<!-- .element: class="${fragmentClass}" -->`); }

            if (!inTableBlock) {
                inTableBlock = true;
            }
            result.push(line);
            // Look ahead: if next line doesn't start with |, close the block
            const nextLine = lines[i + 1]?.trim();
            if (!nextLine || !nextLine.startsWith('|')) {
                inTableBlock = false;
                if (!line.includes('.element')) {
                    result.push(`<!-- .element: class="${fragmentClass}" -->`);
                }
            }
            continue;
        }

        // 4. Handle Blockquotes (lines starting with >)
        if (trimmed.startsWith('>')) {
            if (inTableBlock) { inTableBlock = false; result.push(`<!-- .element: class="${fragmentClass}" -->`); }

            if (!inQuoteBlock) {
                inQuoteBlock = true;
            }
            result.push(line);
            // Look ahead
            const nextLine = lines[i + 1]?.trim();
            if (!nextLine || !nextLine.startsWith('>')) {
                inQuoteBlock = false;
                if (!line.includes('.element')) {
                    result.push(`<!-- .element: class="${fragmentClass}" -->`);
                }
            }
            continue;
        }

        // 5. Skip conditions / Empty lines
        if (
            !trimmed ||
            trimmed.startsWith('#') ||
            trimmed === '---' ||
            trimmed === '--' ||
            trimmed.startsWith('::') ||
            trimmed.startsWith('Note:') ||
            line.includes('.element') ||
            line.includes(`class="${fragmentClass}"`)
        ) {
            if (inTableBlock) { inTableBlock = false; result.push(`<!-- .element: class="${fragmentClass}" -->`); }
            if (inQuoteBlock) { inQuoteBlock = false; result.push(`<!-- .element: class="${fragmentClass}" -->`); }

            result.push(line);
            continue;
        }

        // 6. Handle List Items
        const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+/);
        if (listMatch) {
            if (inTableBlock) { inTableBlock = false; result.push(`<!-- .element: class="${fragmentClass}" -->`); }
            if (inQuoteBlock) { inQuoteBlock = false; result.push(`<!-- .element: class="${fragmentClass}" -->`); }

            const prefix = listMatch[0];
            const itemContent = line.substring(prefix.length);

            if (itemContent.trim().match(/^\[[ xX]\]/)) {
                result.push(`${line} <!-- .element: class="${fragmentClass}" -->`);
                continue;
            }

            result.push(`${prefix}<span class="${fragmentClass}">${itemContent}</span>`);
            continue;
        }

        // 7. Regular paragraph content
        if (inTableBlock) { inTableBlock = false; result.push(`<!-- .element: class="${fragmentClass}" -->`); }
        if (inQuoteBlock) { inQuoteBlock = false; result.push(`<!-- .element: class="${fragmentClass}" -->`); }

        result.push(line);
        result.push(`<!-- .element: class="${fragmentClass}" -->`);
    }

    return result.join('\n');
}

function parseSlide(text: string, parentTitle: string = '', defaultTransition: transitions = 'none'): SlideContent {
    let content = processMediaSyntax(text.trim());
    let notes = '';
    let alignment: 'center' | 'left' = 'center';
    let transition: transitions = defaultTransition;

    if (content.startsWith('::left')) {
        alignment = 'left';
        content = content.replace(/^::left\s*/, '').trim();
    }

    const fragmentMatch = content.match(/^::fragment\s+(\S+)/);
    if (fragmentMatch) {
        transition = fragmentMatch[1] as transitions;
        content = content.replace(/^::fragment\s+\S+\s*/, '').trim();
    }

    const noteMatch = content.match(/\nNote:([\s\S]*)$/i);
    if (noteMatch) {
        notes = noteMatch[1].trim();
        content = content.replace(/\nNote:[\s\S]*$/i, '').trim();
    }

    if (parentTitle && content.startsWith('###')) {
        content = content.replace(/^(###+)\s+(.+)$/m, (match, prefix, title) => {
            if (!title.startsWith(parentTitle)) {
                return `${prefix} ${parentTitle} - ${title}`;
            }
            return match;
        });
    }

    return { type: 'slide', content, notes, alignment, transition };
}

function processMediaSyntax(text: string): string {
    const imageRegex = /!\[(.*?)\]\((.*?)\s+=(.*?)\)/g;
    return text.replace(imageRegex, (_, alt, url, size) => {
        let width = '';
        let height = '';
        const parts = size.toLowerCase().split('x');
        if (parts.length >= 1 && parts[0]) width = parts[0];
        if (parts.length >= 2 && parts[1]) height = parts[1];
        const style = [
            width ? `width: ${width}${width.match(/\d$/) ? 'px' : ''}` : '',
            height ? `height: ${height}${height.match(/\d$/) ? 'px' : ''}` : ''
        ].filter(Boolean).join('; ');
        return `<img src="${url.trim()}" alt="${alt}" style="${style}" />`;
    });
}

function autoSplitIfLong(slide: SlideContent, startLine: number): SlideContent[] {
    const lines = slide.content.split('\n');
    if (slide.content.length <= AUTO_SPLIT_CHAR_LIMIT && lines.length <= AUTO_SPLIT_LINE_LIMIT) {
        return [slide];
    }

    const sections: string[] = [];
    let currentChunk: string[] = [];
    let currentCharCount = 0;
    let inCodeBlock = false;

    lines.forEach((line) => {
        if (line.trim().startsWith('```')) inCodeBlock = !inCodeBlock;
        const shouldSplit = !inCodeBlock && (
            (currentCharCount > AUTO_SPLIT_CHAR_LIMIT * 0.8 && line.startsWith('#')) ||
            (currentChunk.length >= AUTO_SPLIT_LINE_LIMIT)
        );
        if (shouldSplit && currentChunk.length > 0) {
            sections.push(currentChunk.join('\n'));
            currentChunk = [];
            currentCharCount = 0;
        }
        currentChunk.push(line);
        currentCharCount += line.length + 1;
    });

    if (currentChunk.length > 0) sections.push(currentChunk.join('\n'));

    const headerMatch = slide.content.match(/^(#+)\s+(.+)$/m);
    const baseTitle = headerMatch ? headerMatch[2] : 'Continued';
    const headerLevel = headerMatch ? headerMatch[1] : '##';

    return sections.map((sect, idx) => {
        const sectLines = sect.split('\n');
        const sRange: [number, number] = [startLine, startLine + sectLines.length - 1];
        startLine += sectLines.length;
        return {
            ...slide,
            content: idx > 0 ? `${headerLevel} ${baseTitle} (Part ${idx + 1})\n\n${sect}` : sect,
            notes: idx === 0 ? slide.notes : '',
            sourceLineRange: sRange
        };
    });
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