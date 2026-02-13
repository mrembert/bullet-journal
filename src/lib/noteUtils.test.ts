import test from 'node:test';
import assert from 'node:assert';
import { cleanNoteContent, isValidUrl } from './noteUtils.ts';
import type { Bullet } from '../types.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockBullets: Record<string, any> = {
    'bullet-1': { id: 'bullet-1', content: 'Task 1', type: 'task', state: 'open', order: 1, createdAt: 123, updatedAt: 123 },
    'bullet-2': { id: 'bullet-2', content: 'Task 2', type: 'task', state: 'open', order: 2, createdAt: 124, updatedAt: 124 },
};

test('cleanNoteContent - basic cleaning', () => {
    const rawContent = JSON.stringify({
        type: 'doc',
        content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
            { type: 'embeddedTask', attrs: { bulletId: 'bullet-1' } },
            { type: 'embeddedTask', attrs: { bulletId: 'non-existent' } },
        ]
    });

    const cleaned = cleanNoteContent(rawContent, mockBullets as Record<string, Bullet>);
    const parsed = JSON.parse(cleaned);

    assert.strictEqual(parsed.content.length, 2);
    assert.strictEqual(parsed.content[0].type, 'paragraph');
    assert.strictEqual(parsed.content[1].type, 'embeddedTask');
    assert.strictEqual(parsed.content[1].attrs.bulletId, 'bullet-1');
});

test('cleanNoteContent - recursive cleaning', () => {
    const rawContent = JSON.stringify({
        type: 'doc',
        content: [
            {
                type: 'bulletList',
                content: [
                    {
                        type: 'listItem',
                        content: [
                            { type: 'paragraph', content: [{ type: 'text', text: 'Some text' }] },
                            { type: 'embeddedTask', attrs: { bulletId: 'non-existent' } },
                            { type: 'embeddedTask', attrs: { bulletId: 'bullet-2' } },
                        ]
                    }
                ]
            }
        ]
    });

    const cleaned = cleanNoteContent(rawContent, mockBullets as Record<string, Bullet>);
    const parsed = JSON.parse(cleaned);

    const listItemContent = parsed.content[0].content[0].content;
    assert.strictEqual(listItemContent.length, 2);
    assert.strictEqual(listItemContent[0].type, 'paragraph');
    assert.strictEqual(listItemContent[1].type, 'embeddedTask');
    assert.strictEqual(listItemContent[1].attrs.bulletId, 'bullet-2');
});

test('cleanNoteContent - preservation', () => {
    const rawContent = JSON.stringify({
        type: 'doc',
        content: [
            { type: 'embeddedTask', attrs: { bulletId: 'bullet-1' } },
            { type: 'embeddedTask', attrs: { bulletId: 'bullet-2' } },
        ]
    });

    const cleaned = cleanNoteContent(rawContent, mockBullets as Record<string, Bullet>);
    const parsed = JSON.parse(cleaned);

    assert.strictEqual(parsed.content.length, 2);
});

test('cleanNoteContent - handles empty or invalid input', () => {
    assert.strictEqual(cleanNoteContent('', mockBullets as Record<string, Bullet>), '');
    assert.strictEqual(cleanNoteContent('invalid-json', mockBullets as Record<string, Bullet>), 'invalid-json');
});

test('cleanNoteContent - handles JSON without content array', () => {
    const raw = JSON.stringify({ type: 'doc' });
    assert.strictEqual(cleanNoteContent(raw, mockBullets as Record<string, Bullet>), raw);
});

test('cleanNoteContent - handles null or missing attrs/bulletId', () => {
    const rawContent = JSON.stringify({
        type: 'doc',
        content: [
            { type: 'embeddedTask' },
            { type: 'embeddedTask', attrs: {} },
            { type: 'embeddedTask', attrs: { bulletId: null } },
        ]
    });

    const cleaned = cleanNoteContent(rawContent, mockBullets as Record<string, Bullet>);
    const parsed = JSON.parse(cleaned);

    assert.strictEqual(parsed.content.length, 3);
});

test('isValidUrl - valid protocols', () => {
    assert.strictEqual(isValidUrl('http://example.com'), true);
    assert.strictEqual(isValidUrl('https://example.com'), true);
    assert.strictEqual(isValidUrl('mailto:user@example.com'), true);
    assert.strictEqual(isValidUrl('tel:+1234567890'), true);
});

test('isValidUrl - case insensitivity', () => {
    assert.strictEqual(isValidUrl('HTTP://example.com'), true);
    assert.strictEqual(isValidUrl('HTTPS://example.com'), true);
    assert.strictEqual(isValidUrl('MAILTO:user@example.com'), true);
    assert.strictEqual(isValidUrl('TEL:+1234567890'), true);
});

test('isValidUrl - invalid protocols', () => {
    assert.strictEqual(isValidUrl('javascript:alert(1)'), false);
    assert.strictEqual(isValidUrl('vbscript:alert(1)'), false);
    assert.strictEqual(isValidUrl('data:text/plain,Hello'), false);
    assert.strictEqual(isValidUrl('ftp://example.com'), false);
    assert.strictEqual(isValidUrl('file:///etc/passwd'), false);
});

test('isValidUrl - relative URLs', () => {
    assert.strictEqual(isValidUrl('/path/to/resource'), false);
    assert.strictEqual(isValidUrl('relative/path'), false);
    assert.strictEqual(isValidUrl('//example.com'), false); // Protocol-relative URLs are safer than javascript: but strict validation might exclude them. Let's stick to strict protocols.
});

test('isValidUrl - whitespace handling', () => {
    assert.strictEqual(isValidUrl('  https://example.com  '), true);
    assert.strictEqual(isValidUrl('  javascript:alert(1)  '), false);
});

test('isValidUrl - empty or invalid input', () => {
    assert.strictEqual(isValidUrl(''), false);
    // @ts-expect-error Testing invalid input type
    assert.strictEqual(isValidUrl(null), false);
    // @ts-expect-error Testing invalid input type
    assert.strictEqual(isValidUrl(undefined), false);
    // @ts-expect-error Testing invalid input type
    assert.strictEqual(isValidUrl(123), false);
});
