import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Renders content with LaTeX math ($$...$$), cloze deletions, and highlights
 * @param {string} content - The content to render
 * @param {boolean} hideClozes - Whether to hide cloze deletions
 * @returns {Array} Array of React elements to render
 */
export const renderMixedContent = (content, hideClozes = false) => {
  if (!content) return [];

  const parts = [];
  let key = 0;

  // Regular expressions
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  const mathRegex = /\$\$(.*?)\$\$/gs;
  const clozeRegex = /\{\{c\d+::(.*?)\}\}/g;

  // First, find all code blocks (process these first as they can contain anything)
  const codeBlocks = [];
  let codeMatch;
  while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
    codeBlocks.push({
      start: codeMatch.index,
      end: codeMatch.index + codeMatch[0].length,
      language: codeMatch[1],
      code: codeMatch[2],
    });
  }

  // Process content, handling code blocks first
  let position = 0;

  for (const codeBlock of codeBlocks) {
    // Process text before code block (may contain math, clozes, highlights)
    if (position < codeBlock.start) {
      const textChunk = content.substring(position, codeBlock.start);
      parts.push(...renderTextWithMathClozesHighlights(textChunk, hideClozes, key));
      key += 1000;
    }

    // Render code block
    let codeContent = codeBlock.code;

    // Handle clozes inside code blocks
    if (hideClozes) {
      codeContent = codeContent.replace(clozeRegex, '[...]');
    } else {
      codeContent = codeContent.replace(clozeRegex, '$1');
    }

    parts.push(
      <pre
        key={key++}
        style={{
          backgroundColor: '#f5f5f5',
          padding: '12px 16px',
          borderRadius: '6px',
          overflow: 'auto',
          margin: '12px 0',
          border: '1px solid #e0e0e0',
        }}
      >
        <code
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {codeContent}
        </code>
      </pre>
    );

    position = codeBlock.end;
  }

  // Process remaining text after last code block
  if (position < content.length) {
    const textChunk = content.substring(position);
    parts.push(...renderTextWithMathClozesHighlights(textChunk, hideClozes, key));
  }

  return parts;
};

/**
 * Renders text with math blocks, cloze deletions, and highlights (but not code blocks)
 */
const renderTextWithMathClozesHighlights = (content, hideClozes, startKey = 0) => {
  const parts = [];
  let key = startKey;

  const mathRegex = /\$\$(.*?)\$\$/gs;
  const clozeRegex = /\{\{c\d+::(.*?)\}\}/g;

  // Find all math blocks in this chunk
  const mathBlocks = [];
  let mathMatch;
  while ((mathMatch = mathRegex.exec(content)) !== null) {
    mathBlocks.push({
      start: mathMatch.index,
      end: mathMatch.index + mathMatch[0].length,
      content: mathMatch[1],
    });
  }

  let position = 0;

  for (const mathBlock of mathBlocks) {
    // Process text before math block
    if (position < mathBlock.start) {
      const textChunk = content.substring(position, mathBlock.start);
      parts.push(...renderTextWithClozesAndHighlights(textChunk, hideClozes, key));
      key += 100;
    }

    // Process math block
    let mathContent = mathBlock.content;

    // Handle clozes inside math
    if (hideClozes) {
      mathContent = mathContent.replace(clozeRegex, '[...]');
    } else {
      mathContent = mathContent.replace(clozeRegex, '$1');
    }

    // Render LaTeX
    try {
      const html = katex.renderToString(mathContent, {
        displayMode: true,
        throwOnError: false,
        errorColor: '#cc0000',
      });

      parts.push(
        <span
          key={key++}
          dangerouslySetInnerHTML={{ __html: html }}
          style={{ display: 'block', margin: '15px 0' }}
        />
      );
    } catch (error) {
      parts.push(
        <span key={key++} style={{ color: '#cc0000' }}>
          {`$$${mathContent}$$`}
        </span>
      );
    }

    position = mathBlock.end;
  }

  // Process remaining text after last math block
  if (position < content.length) {
    const textChunk = content.substring(position);
    parts.push(...renderTextWithClozesAndHighlights(textChunk, hideClozes, key));
  }

  return parts;
};

/**
 * Renders text with cloze deletions and highlights (no LaTeX)
 * @param {string} text - The text to render
 * @param {boolean} hideClozes - Whether to hide cloze deletions
 * @param {number} startKey - Starting key for React elements
 * @returns {Array} Array of React elements
 */
const renderTextWithClozesAndHighlights = (text, hideClozes, startKey = 0) => {
  const parts = [];
  let key = startKey;

  // First, process clozes
  const clozeRegex = /\{\{c\d+::(.*?)\}\}/g;
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = clozeRegex.exec(text)) !== null) {
    // Add text before cloze
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    // Add cloze
    segments.push({
      type: 'cloze',
      content: match[1],
      hidden: hideClozes,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  // Now process each segment for highlights
  for (const segment of segments) {
    if (segment.type === 'cloze') {
      if (segment.hidden) {
        parts.push(
          <span
            key={key++}
            style={{
              backgroundColor: '#fef3c7',
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 'bold',
            }}
          >
            [...]
          </span>
        );
      } else {
        parts.push(
          <span
            key={key++}
            style={{
              backgroundColor: '#bfdbfe',
              padding: '2px 4px',
              borderRadius: '2px',
            }}
          >
            {segment.content}
          </span>
        );
      }
    } else {
      // Process highlights in text segments
      const highlightParts = processHighlights(segment.content, key);
      parts.push(...highlightParts);
      key += highlightParts.length;
    }
  }

  return parts;
};

/**
 * Process highlights in text
 * @param {string} text - Text to process
 * @param {number} startKey - Starting key
 * @returns {Array} Array of React elements
 */
const processHighlights = (text, startKey = 0) => {
  const parts = [];
  let key = startKey;
  const highlightRegex = /==(.*?)==/g;
  let lastIndex = 0;
  let match;

  while ((match = highlightRegex.exec(text)) !== null) {
    // Add text before highlight
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++}>{text.substring(lastIndex, match.index)}</span>
      );
    }

    // Add highlight
    parts.push(
      <span
        key={key++}
        style={{
          backgroundColor: '#FFD700',
          padding: '2px 4px',
          borderRadius: '2px',
        }}
      >
        {match[1]}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.substring(lastIndex)}</span>);
  }

  // If no highlights found, return the whole text
  if (parts.length === 0) {
    parts.push(<span key={key}>{text}</span>);
  }

  return parts;
};

/**
 * Insert math delimiters around selected text
 * @param {string} content - The full content
 * @param {number} selectionStart - Start position of selection
 * @param {number} selectionEnd - End position of selection
 * @returns {string} Updated content with math delimiters
 */
export const insertMath = (content, selectionStart, selectionEnd) => {
  const selectedText = content.substring(selectionStart, selectionEnd);
  const before = content.substring(0, selectionStart);
  const after = content.substring(selectionEnd);

  return `${before}$$${selectedText}$$${after}`;
};

/**
 * Insert code block delimiters around selected text
 * @param {string} content - The full content
 * @param {number} selectionStart - Start position of selection
 * @param {number} selectionEnd - End position of selection
 * @returns {string} Updated content with code block delimiters
 */
export const insertCode = (content, selectionStart, selectionEnd) => {
  const selectedText = content.substring(selectionStart, selectionEnd);
  const before = content.substring(0, selectionStart);
  const after = content.substring(selectionEnd);

  return `${before}\`\`\`\n${selectedText}\n\`\`\`${after}`;
};
