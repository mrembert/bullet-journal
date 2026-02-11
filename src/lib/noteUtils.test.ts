import test from 'node:test';
import assert from 'node:assert';
import { cleanNoteContent } from './noteUtils.ts';
import type { Bullet } from '../types.ts';

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
