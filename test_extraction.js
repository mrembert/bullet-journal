
const extractTextFromContent = (content) => {
    if (!content) return '';
    try {
        const json = JSON.parse(content);
        if (typeof json !== 'object' || !json) return content;

        let text = '';
        const traverse = (node) => {
            if (node.text) {
                text += node.text + ' ';
            }
            if (node.content && Array.isArray(node.content)) {
                node.content.forEach(traverse);
            }
        };

        traverse(json);
        return text.trim();
    } catch (e) {
        // Not JSON, return as is
        return content;
    }
};

// Test cases
const test1 = '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Suzanne smith - dhe dir research and eval"}]}]}';
console.log('Test 1 (JSON):', extractTextFromContent(test1));

const test2 = 'Simple string content';
console.log('Test 2 (String):', extractTextFromContent(test2));

const test3 = '{"invalid json';
console.log('Test 3 (Invalid JSON):', extractTextFromContent(test3));

const test4 = '{"type":"doc","content":[{"type":"heading","content":[{"type":"text","text":"Header"}]},{"type":"paragraph","content":[{"type":"text","text":"Body text"}]}]}';
console.log('Test 4 (Complex JSON):', extractTextFromContent(test4));
