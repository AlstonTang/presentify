import { describe, it, expect } from 'vitest';
import { parseMarkdownToSlides } from './markdownParser';
import type { transitions } from '../types';

describe('parseMarkdownToSlides regression', () => {
  it('splits on explicit --- separators and sets sourceLineRange', () => {
    const markdown = ['# S1', 'A', '---', '# S2', 'B'].join('\n');
    const slides = parseMarkdownToSlides(markdown, 'none');

    expect(slides).toHaveLength(2);

    expect(slides[0].type).toBe('slide');
    expect(slides[0].content).toBe('# S1\nA');
    expect(slides[0].sourceLineRange).toEqual([0, 1]);

    expect(slides[1].type).toBe('slide');
    expect(slides[1].content).toBe('# S2\nB');
    expect(slides[1].sourceLineRange).toEqual([3, 4]);
  });

  it('creates a vertical slide when using -- and ### sections', () => {
    const markdown = [
      '# Main',
      'Intro',
      '### A',
      'Body A',
      '--',
      '### B',
      'Body B',
    ].join('\n');

    const slides = parseMarkdownToSlides(markdown, 'none');
    const vertical = slides.find((s) => s.type === 'vertical');
    expect(vertical).toBeTruthy();
    expect(vertical?.subSlides?.length ?? 0).toBeGreaterThanOrEqual(2);

    const subContents = (vertical?.subSlides ?? []).map((s) => s.content);
    expect(subContents.some((c) => c.includes('### A'))).toBe(true);
    expect(subContents.some((c) => c.includes('### B'))).toBe(true);
  });

  it('parses Note: blocks and strips them from slide content', () => {
    const markdown = ['# N', 'Paragraph line', 'Note: line 1', 'line 2'].join('\n');
    const slides = parseMarkdownToSlides(markdown, 'none');

    expect(slides).toHaveLength(1);
    expect(slides[0].type).toBe('slide');
    expect(slides[0].notes).toBe('line 1\nline 2');
    expect(slides[0].content).toBe('# N\nParagraph line');
  });

  it('applies the ::fragment directive when it starts a slide', () => {
    const fragmentTransition = 'fade-in-then-out' as transitions;
    const markdown = ['::fragment fade-in-then-out', '- First', '- Second', '', 'Note: hello'].join('\n');
    const slides = parseMarkdownToSlides(markdown, 'none');

    expect(slides).toHaveLength(1);
    expect(slides[0].transition).toBe(fragmentTransition);
    expect(slides[0].notes).toBe('hello');

    expect(slides[0].content).toContain('class="fragment fade-in-then-out" data-fragment-index="1"');
    expect(slides[0].content).toContain('class="fragment fade-in-then-out" data-fragment-index="2"');
  });

  it('injects fragments for list items when ::fragment is provided', () => {
    const fragmentTransition = 'fade-in-then-out' as transitions;
    const markdown = [
      '# T',
      '- First',
      '- Second',
      '',
      'Note: hello world',
    ].join('\n');

    const slides = parseMarkdownToSlides(markdown, fragmentTransition);
    expect(slides).toHaveLength(1);

    const slide = slides[0];
    expect(slide.transition).toBe('none');
    expect(slide.notes).toBe('hello world');
    expect(slide.content).not.toContain('::fragment');

    // Reveal fragment indices are injected sequentially.
    expect(slide.content).toContain('class="fragment fade-in-then-out" data-fragment-index="1"');
    expect(slide.content).toContain('class="fragment fade-in-then-out" data-fragment-index="2"');
  });

  it('auto-splits long slides and preserves sourceLineRange per section', () => {
    const longParagraphLines = Array.from({ length: 25 }, (_, i) => `Text ${i + 1}`);
    const markdown = ['# Title', ...longParagraphLines].join('\n');

    const slides = parseMarkdownToSlides(markdown, 'none');
    const vertical = slides.find((s) => s.type === 'vertical');
    expect(vertical).toBeTruthy();
    expect(vertical?.subSlides?.length ?? 0).toBeGreaterThanOrEqual(2);

    const subSlides = vertical?.subSlides;
    expect(subSlides).toBeTruthy();
    if (!subSlides) throw new Error('Expected vertical subSlides');
    const [first, second, third] = subSlides;

    // First segment is header-prefixed and includes Text 1..9.
    expect(first.content).toContain('# Title');
    expect(first.content).toContain('Text 1');
    expect(first.content).toContain('Text 9');
    expect(first.content).not.toContain('Text 10');
    expect(first.sourceLineRange).toEqual([0, 9]);

    // Second segment continues with a continued title prefix.
    expect(second.content).toContain('# Title (continued)');
    expect(second.content).toContain('Text 10');
    expect(second.content).toContain('Text 19');
    expect(second.content).not.toContain('Text 20');
    expect(second.sourceLineRange).toEqual([10, 20]);

    // Third segment contains the tail of the paragraph.
    expect(third.content).toContain('Text 20');
    expect(third.content).toContain('Text 25');
    expect(third.sourceLineRange).toEqual([21, 27]);
  });
});

