import type { SlideContent, transitions } from '../types';

/**
 * Thresholds for auto-splitting long content
 */
const MAX_SLIDE_WEIGHT = 18; // Equivalent to ~15 lines of regular text
const AUTO_SPLIT_CHAR_LIMIT = 1500;

type BlockType = 'header' | 'paragraph' | 'list' | 'code' | 'math' | 'table' | 'quote' | 'empty';

interface Block {
    type: BlockType;
    lines: string[];
    weight: number;
}

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

    // Unified handler for fragments and inline animations to maintain correct ordering
    slide.content = applyFragmentsAndAnimations(slide.content, transitionToUse && transitionToUse !== 'none' ? transitionToUse : null);

    return autoSplitIfLong(slide, startLine);
}

/**
 * Injects Reveal.js fragments and handles inline animation stacks in a single pass.
 * This ensures that fragment indices are sequential and synchronized.
 */
function applyFragmentsAndAnimations(content: string, type: string | null): string {
    const lines = content.split('\n');
    const cleanType = (type || 'fade-in').replace(/^fragment\s+/, '');
    const fragmentClass = `fragment ${cleanType}`.trim();
    const isAutoFragment = !!type;

    // 1. Pre-scan for inline animations to group them by ID and track their first occurrence
    const animationRegex = /```inlineAnimation\[(\w+)\]\s*\n([\s\S]*?)\n```/g;
    const blocksById: Record<string, string[]> = {};
    const firstLineIdx: Record<string, number> = {};
    const idByLine: Record<number, string> = {};
    
    let m;
    while ((m = animationRegex.exec(content)) !== null) {
        const id = m[1];
        const lineStart = content.substring(0, m.index).split('\n').length - 1;
        if (!(id in blocksById)) {
            blocksById[id] = [];
            firstLineIdx[id] = lineStart;
        }
        blocksById[id].push(m[2]);
        idByLine[lineStart] = id;
    }

    let fragmentIndex = 0;
    const result: string[] = [];
    
    let inCodeBlock = false;
    let inMathBlock = false;
    let inTableBlock = false;
    let inQuoteBlock = false;
    
    let pendingCodeBlockFragment = false;
    let pendingMathBlockFragment = false;

    const addFragment = (force = false) => {
        if (!isAutoFragment && !force) return "";
        fragmentIndex++;
        return `<!-- .element: class="${fragmentClass}" data-fragment-index="${fragmentIndex}" -->`;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // 0. Handle Inline Animations
        if (idByLine[i]) {
            const id = idByLine[i];
            const isFirst = (i === firstLineIdx[id]);
            
            // Skip until end of current block
            let endIdx = i;
            while (endIdx < lines.length && !lines[endIdx].trim().endsWith('```')) {
                endIdx++;
            }

            if (isFirst) {
                const blocks = blocksById[id];
                
                let containerFragmentClass = "";
                let containerIndexAttr = "";
                let baseAnimIndex = fragmentIndex + 1;

                // Identify common prefix and suffix across ALL versions to keep them static
                let prefix = blocks[0];
                let suffix = blocks[0];
                
                for (let j = 1; j < blocks.length; j++) {
                    // Find common prefix
                    let p = 0;
                    while (p < prefix.length && p < blocks[j].length && prefix[p] === blocks[j][p]) {
                        p++;
                    }
                    prefix = prefix.substring(0, p);
                    
                    // Find common suffix
                    let s = 0;
                    while (s < suffix.length && s < blocks[j].length && 
                           suffix[suffix.length - 1 - s] === blocks[j][blocks[j].length - 1 - s]) {
                        s++;
                    }
                    suffix = suffix.substring(suffix.length - s);
                }

                // Ensure suffix doesn't overlap prefix if strings are short
                if (prefix.length + suffix.length > Math.min(...blocks.map(b => b.length))) {
                    suffix = ""; 
                }

                // Extract core content for each step (the part that actually changes)
                const coreVersions = blocks.map(b => b.substring(prefix.length, b.length - suffix.length));

                // Determine if we need to auto-fragment the whole container
                if (isAutoFragment) {
                    fragmentIndex++;
                    containerFragmentClass = ` ${fragmentClass}`;
                    containerIndexAttr = ` data-fragment-index="${fragmentIndex}"`;
                    baseAnimIndex = fragmentIndex + 1;
                }
                
                // Wrap in a span to keep it inline with surrounding slide text
                // IMPORTANT: We remove all \n from the generated HTML to prevent the markdown plugin from adding <br/> or <p> tags
                let stackHtml = `<span class="inline-animation-container${containerFragmentClass}"${containerIndexAttr} data-animation-id="${id}">`;
                
                // 1. Common Prefix
                if (prefix) stackHtml += `<span style="white-space: pre !important;">${prefix}</span>`;
                
                // 2. The Animated Stack (Grid overlapping part)
                // Use span with inline-grid to avoid block-level disruption
                stackHtml += `<span class="inline-animation-stack" style="display: inline-grid !important; grid-template-areas: 'stack' !important; align-items: center !important; vertical-align: middle !important;">`;
                
                coreVersions.forEach((bContent, idx) => {
                    let fClass = "";
                    let fIndex = 0;
                    if (idx === 0) {
                        if (blocks.length > 1) {
                            fClass = "fragment fade-out";
                            fIndex = baseAnimIndex;
                        }
                    } else if (idx === blocks.length - 1) {
                        fClass = "fragment fade-in";
                        fIndex = baseAnimIndex + idx - 1;
                    } else {
                        fClass = "fragment fade-in-then-out";
                        fIndex = baseAnimIndex + idx - 1;
                    }

                    const indexAttr = fIndex > 0 ? `data-fragment-index="${fIndex}"` : "";
                    const elementComment = fClass ? `<!-- .element: class="${fClass}" ${indexAttr} -->` : "";
                    
                    // Use span to stick to the 'stack' grid area
                    stackHtml += `<span style="grid-area: stack !important; white-space: pre !important;">${bContent} ${elementComment}</span>`;
                });
                
                stackHtml += `</span>`; // End of stack
                
                // 3. Common Suffix
                if (suffix) stackHtml += `<span style="white-space: pre !important;">${suffix}</span>`;
                
                stackHtml += `</span>`; // End of container
                result.push(stackHtml);
                
                // Track how many fragment clicks this animation sequence consumed
                fragmentIndex += (blocks.length - 1);
            }
            
            i = endIdx;
            continue;
        }

        // 1. Handle Code Blocks
        if (trimmed.startsWith('```')) {
            if (inTableBlock && isAutoFragment) { inTableBlock = false; result.push(addFragment()); }
            if (inQuoteBlock && isAutoFragment) { inQuoteBlock = false; result.push(addFragment()); }

            if (!inCodeBlock) {
                inCodeBlock = true;
                pendingCodeBlockFragment = isAutoFragment && !line.includes('.element');
                result.push(line);
            } else {
                inCodeBlock = false;
                result.push(line);
                if (pendingCodeBlockFragment) {
                    result.push(addFragment());
                    pendingCodeBlockFragment = false;
                }
            }
            continue;
        }
        if (inCodeBlock) { result.push(line); continue; }

        // 2. Handle Multi-line Math Blocks ($$)
        if (trimmed.startsWith('$$')) {
            if (inTableBlock && isAutoFragment) { inTableBlock = false; result.push(addFragment()); }
            if (inQuoteBlock && isAutoFragment) { inQuoteBlock = false; result.push(addFragment()); }

            if (!inMathBlock && !trimmed.endsWith('$$')) {
                inMathBlock = true;
                pendingMathBlockFragment = isAutoFragment && !line.includes('.element');
                result.push(line);
            } else if (inMathBlock) {
                inMathBlock = false;
                result.push(line);
                if (pendingMathBlockFragment) {
                    result.push(addFragment());
                    pendingMathBlockFragment = false;
                }
            } else {
                result.push(line);
                if (isAutoFragment) result.push(addFragment());
            }
            continue;
        }
        if (inMathBlock) { result.push(line); continue; }

        // 3. Handle Tables (lines starting with |)
        if (trimmed.startsWith('|')) {
            if (inQuoteBlock && isAutoFragment) { inQuoteBlock = false; result.push(addFragment()); }
            if (!inTableBlock) inTableBlock = true;
            result.push(line);
            const nextLine = lines[i + 1]?.trim();
            if (!nextLine || !nextLine.startsWith('|')) {
                inTableBlock = false;
                if (isAutoFragment && !line.includes('.element')) result.push(addFragment());
            }
            continue;
        }

        // 4. Handle Blockquotes (lines starting with >)
        if (trimmed.startsWith('>')) {
            if (inTableBlock && isAutoFragment) { inTableBlock = false; result.push(addFragment()); }
            if (!inQuoteBlock) inQuoteBlock = true;
            result.push(line);
            const nextLine = lines[i + 1]?.trim();
            if (!nextLine || !nextLine.startsWith('>')) {
                inQuoteBlock = false;
                if (isAutoFragment && !line.includes('.element')) result.push(addFragment());
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
            line.includes('.element')
        ) {
            if (inTableBlock && isAutoFragment) { inTableBlock = false; result.push(addFragment()); }
            if (inQuoteBlock && isAutoFragment) { inQuoteBlock = false; result.push(addFragment()); }
            result.push(line);
            continue;
        }

        // 6. Handle List Items
        const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+/);
        if (listMatch) {
            if (inTableBlock && isAutoFragment) { inTableBlock = false; result.push(addFragment()); }
            if (inQuoteBlock && isAutoFragment) { inQuoteBlock = false; result.push(addFragment()); }

            const prefix = listMatch[0];
            const itemContent = line.substring(prefix.length);

            if (isAutoFragment) {
                if (itemContent.trim().match(/^\[[ xX]\]/)) {
                    result.push(`${line} ${addFragment()}`);
                } else {
                    fragmentIndex++;
                    result.push(`${prefix}<span class="${fragmentClass}" data-fragment-index="${fragmentIndex}">${itemContent}</span>`);
                }
            } else {
                result.push(line);
            }
            continue;
        }

        // 7. Regular paragraph content
        if (inTableBlock && isAutoFragment) { inTableBlock = false; result.push(addFragment()); }
        if (inQuoteBlock && isAutoFragment) { inQuoteBlock = false; result.push(addFragment()); }

        result.push(line);
        if (isAutoFragment) result.push(addFragment());
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

function getBlocks(text: string): Block[] {
    const lines = text.split('\n');
    const blocks: Block[] = [];
    let currentBlockLines: string[] = [];
    let currentType: BlockType | null = null;

    const pushBlock = () => {
        if (currentBlockLines.length === 0) return;
        const weight = calculateWeight(currentType || 'paragraph', currentBlockLines);
        blocks.push({ type: currentType || 'paragraph', lines: [...currentBlockLines], weight });
        currentBlockLines = [];
        currentType = null;
    };

    let inCodeBlock = false;
    let inMathBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // 1. Handle Code Blocks
        if (trimmed.startsWith('```')) {
            if (!inCodeBlock) {
                pushBlock();
                inCodeBlock = true;
                currentType = 'code';
            } else {
                currentBlockLines.push(line);
                inCodeBlock = false;
                pushBlock();
                continue;
            }
        }
        if (inCodeBlock) {
            currentBlockLines.push(line);
            continue;
        }

        // 2. Handle Math Blocks
        if (trimmed.startsWith('$$')) {
            if (!inMathBlock && !trimmed.endsWith('$$', trimmed.length > 2 ? trimmed.length : undefined)) {
                pushBlock();
                inMathBlock = true;
                currentType = 'math';
            } else if (inMathBlock) {
                currentBlockLines.push(line);
                inMathBlock = false;
                pushBlock();
                continue;
            } else {
                pushBlock();
                blocks.push({ type: 'math', lines: [line], weight: 3 });
                continue;
            }
        }
        if (inMathBlock) {
            currentBlockLines.push(line);
            continue;
        }

        // 3. Handle Empty Lines
        if (!trimmed) {
            pushBlock();
            blocks.push({ type: 'empty', lines: [line], weight: 0.5 });
            continue;
        }

        // 4. Handle Headers
        if (trimmed.startsWith('#')) {
            pushBlock();
            blocks.push({ type: 'header', lines: [line], weight: trimmed.startsWith('###') ? 1.5 : (trimmed.startsWith('##') ? 2 : 2.5) });
            continue;
        }

        // 5. Handle Lists
        const isListItem = trimmed.match(/^([-*+]|\d+\.)\s+/);
        if (isListItem) {
            if (currentType !== 'list') pushBlock();
            currentType = 'list';
            currentBlockLines.push(line);
            continue;
        }

        // 6. Handle Tables
        if (trimmed.startsWith('|')) {
            if (currentType !== 'table') pushBlock();
            currentType = 'table';
            currentBlockLines.push(line);
            continue;
        }

        // 7. Handle Quotes
        if (trimmed.startsWith('>')) {
            if (currentType !== 'quote') pushBlock();
            currentType = 'quote';
            currentBlockLines.push(line);
            continue;
        }

        // 8. Regular Paragraphs
        if (currentType !== 'paragraph' && currentType !== null) pushBlock();
        currentType = 'paragraph';
        currentBlockLines.push(line);
    }

    pushBlock();
    return blocks;
}

function getIndentationLevel(line: string): number {
    const match = line.match(/^(\s*)/);
    if (!match) return 0;
    const spaces = match[1];
    let level = 0;
    for (const char of spaces) {
        if (char === '\t') level += 4;
        else level += 1;
    }
    return level;
}

function calculateWeight(type: BlockType, lines: string[]): number {
    switch (type) {
        case 'header':
            return lines[0].startsWith('###') ? 2 : (lines[0].startsWith('##') ? 2.5 : 3.5);
        case 'paragraph':
            return lines.length * 1.3; // Increased from 1.1
        case 'list':
            // Nested items take more visual weight due to indentation and mental load
            const nestedCount = lines.filter(l => l.startsWith(' ') || l.startsWith('\t')).length;
            return lines.length * 1.4 + 0.5 + (nestedCount * 0.5);
        case 'code':
            return lines.length * 0.9 + 2.5; 
        case 'math':
            return Math.max(3, lines.length * 1.4);
        case 'table':
            return lines.length * 1.5 + 2;
        case 'quote':
            return lines.length * 1.3 + 1.5;
        case 'empty':
            return 0.5;
        default:
            return lines.length * 1.2;
    }
}

function autoSplitIfLong(slide: SlideContent, startLine: number): SlideContent[] {
    const blocks = getBlocks(slide.content);
    const totalWeight = blocks.reduce((acc, b) => acc + b.weight, 0);

    // If it fits normally or within the condensation threshold (35% over), don't split
    if (totalWeight <= MAX_SLIDE_WEIGHT && slide.content.length <= AUTO_SPLIT_CHAR_LIMIT) {
        return [slide];
    }

    // Condense if only slightly over (up to 30% over MAX_SLIDE_WEIGHT)
    if (totalWeight <= MAX_SLIDE_WEIGHT * 1.3) {
        return [{ ...slide, isCondensed: true }];
    }

    const sections: string[] = [];
    let currentSectionBlocks: Block[] = [];
    let currentWeight = 0;

    blocks.forEach((block) => {
        // If a single block is already too big (e.g. massive list), split it internally if it's a list or paragraph
        if (block.weight > MAX_SLIDE_WEIGHT * 0.8) {
            let prefixLines: string[] = [];
            let prefixWeight = 0;

            if (currentSectionBlocks.length > 0) {
                const lastBlock = currentSectionBlocks[currentSectionBlocks.length - 1];
                // Headers often should move to the first segment of the split block
                if (lastBlock.type === 'header') {
                    const header = currentSectionBlocks.pop()!;
                    prefixLines = header.lines;
                    prefixWeight = header.weight;
                } else if (lastBlock.type === 'paragraph' && lastBlock.lines.length <= 3) {
                    // Short paragraphs (e.g. "Example: ...") should stay on current slide AND repeat on segments
                    prefixLines = lastBlock.lines;
                    prefixWeight = lastBlock.weight;

                    // If this context is the ONLY meaningful content in this section, don't push a redundant pre-slide
                    const meaningfulPreBlocks = currentSectionBlocks.filter(b => b.type !== 'empty' && b.type !== 'header');
                    if (meaningfulPreBlocks.length === 1 && meaningfulPreBlocks[0] === lastBlock) {
                        currentSectionBlocks = [];
                    }
                }

                if (currentSectionBlocks.length > 0) {
                    sections.push(currentSectionBlocks.map(b => b.lines.join('\n')).join('\n'));
                    currentSectionBlocks = [];
                    currentWeight = 0;
                }
            }

            if (block.type === 'list' || block.type === 'paragraph') {
                // Internal split for long lists/paragraphs
                let subLines: string[] = [...prefixLines];
                let subWeight = prefixWeight;

                // Identify if the prefix is a good "context header" to repeat (e.g. "Example: ...")
                const contextHeader = (prefixLines.length > 0 && prefixLines.length <= 2) 
                    ? prefixLines.join('\n').trim() 
                    : null;

                const parentStack: { level: number, text: string }[] = [];

                block.lines.forEach(line => {
                    const currentLevel = getIndentationLevel(line);
                    const lineWeight = 1.4;

                    if (subWeight + lineWeight > MAX_SLIDE_WEIGHT * 0.9 && subLines.length > prefixLines.length) {
                        sections.push(subLines.join('\n'));
                        
                        // Start a new slide segment
                        const newSubLines: string[] = [];
                        if (contextHeader) {
                            newSubLines.push(`${contextHeader} (continued)`);
                        }
                        
                        // Add parent breadcrumbs to preserve hierarchy structure and indentation
                        parentStack.forEach((p) => {
                            // Only add if it's a true parent of the current line (already filtered below)
                            if (p.level < currentLevel) {
                                newSubLines.push(`${p.text} (continued)`);
                            }
                        });
                        
                        subLines = newSubLines;
                        subWeight = subLines.length * 1.5; 
                    }
                    
                    // Maintain lineage stack for hierarchy breadcrumbs
                    while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= currentLevel) {
                        parentStack.pop();
                    }
                    
                    // Only track as a potential parent if it's a list item line
                    if (line.trim().match(/^([-*+]|\d+\.)\s+/)) {
                        parentStack.push({ level: currentLevel, text: line });
                    }
                    
                    subLines.push(line);
                    subWeight += lineWeight;
                });
                if (subLines.length > 0) {
                    sections.push(subLines.join('\n'));
                }
                return;
            }
        }

        // Normal split between blocks
        if (currentWeight + block.weight > MAX_SLIDE_WEIGHT && currentSectionBlocks.length > 0) {
            // Check if we are splitting right after a header - try to keep header with at least one block
            const lastBlock = currentSectionBlocks[currentSectionBlocks.length - 1];
            if (lastBlock.type === 'header' && currentSectionBlocks.length > 1) {
                const header = currentSectionBlocks.pop()!;
                sections.push(currentSectionBlocks.map(b => b.lines.join('\n')).join('\n'));
                currentSectionBlocks = [header, block];
                currentWeight = header.weight + block.weight;
            } else {
                sections.push(currentSectionBlocks.map(b => b.lines.join('\n')).join('\n'));
                currentSectionBlocks = [block];
                currentWeight = block.weight;
            }
        } else {
            if (block.type !== 'empty' || currentSectionBlocks.length > 0) {
                currentSectionBlocks.push(block);
                currentWeight += block.weight;
            }
        }
    });

    if (currentSectionBlocks.length > 0) {
        sections.push(currentSectionBlocks.map(b => b.lines.join('\n')).join('\n'));
    }

    const headerMatch = slide.content.match(/^(#+)\s+(.+)$/m);

    let currentLineOffset = 0;
    return sections.map((sect, idx) => {
        const sectLines = sect.split('\n');
        const sRange: [number, number] = [startLine + currentLineOffset, startLine + currentLineOffset + sectLines.length - 1];
        currentLineOffset += sectLines.length;

        let finalContent = sect.trim();
        if (idx > 0 && headerMatch) {
            const headerLevel = headerMatch[1];
            const baseTitle = headerMatch[2];
            finalContent = `${headerLevel} ${baseTitle} (continued)\n\n${finalContent}`;
        }

        return {
            ...slide,
            content: finalContent,
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