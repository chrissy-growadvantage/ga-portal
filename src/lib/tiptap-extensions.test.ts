import { describe, it, expect } from 'vitest';
import { plainTextToJSON, generateHTML, createEditorExtensions } from './tiptap-extensions';

describe('tiptap-extensions', () => {
  describe('createEditorExtensions', () => {
    it('returns an array of extensions', () => {
      const extensions = createEditorExtensions();
      expect(Array.isArray(extensions)).toBe(true);
      expect(extensions.length).toBeGreaterThan(0);
    });

    it('accepts placeholder option', () => {
      const extensions = createEditorExtensions({ placeholder: 'Custom placeholder' });
      expect(extensions.length).toBeGreaterThan(0);
    });

    it('accepts maxLength option', () => {
      const extensions = createEditorExtensions({ maxLength: 500 });
      expect(extensions.length).toBeGreaterThan(0);
    });
  });

  describe('plainTextToJSON', () => {
    it('converts empty string to empty doc', () => {
      const result = plainTextToJSON('');
      expect(result.type).toBe('doc');
      expect(result.content).toHaveLength(1);
      expect(result.content?.[0].type).toBe('paragraph');
    });

    it('converts single line text to paragraph', () => {
      const result = plainTextToJSON('Hello world');
      expect(result.type).toBe('doc');
      expect(result.content).toHaveLength(1);
      expect(result.content?.[0].type).toBe('paragraph');
      expect(result.content?.[0].content?.[0].text).toBe('Hello world');
    });

    it('converts multiline text to multiple paragraphs', () => {
      const result = plainTextToJSON('Line 1\nLine 2\nLine 3');
      expect(result.type).toBe('doc');
      expect(result.content).toHaveLength(3);
      expect(result.content?.[0].content?.[0].text).toBe('Line 1');
      expect(result.content?.[1].content?.[0].text).toBe('Line 2');
      expect(result.content?.[2].content?.[0].text).toBe('Line 3');
    });

    it('handles whitespace-only string as empty', () => {
      const result = plainTextToJSON('   ');
      expect(result.type).toBe('doc');
      expect(result.content).toHaveLength(1);
      expect(result.content?.[0].type).toBe('paragraph');
      expect(result.content?.[0].content).toBeUndefined();
    });
  });

  describe('generateHTML', () => {
    it('converts Tiptap JSON to HTML string', () => {
      const json = plainTextToJSON('Hello world');
      const html = generateHTML(json);
      expect(html).toContain('Hello world');
      expect(html).toContain('<p>');
    });

    it('converts empty doc to empty paragraph', () => {
      const json = plainTextToJSON('');
      const html = generateHTML(json);
      expect(html).toContain('<p>');
    });

    it('preserves multiple paragraphs', () => {
      const json = plainTextToJSON('First\nSecond');
      const html = generateHTML(json);
      expect(html).toContain('First');
      expect(html).toContain('Second');
    });
  });
});
