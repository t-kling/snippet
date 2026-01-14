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
  let currentIndex = 0;
  let key = 0;

  // Regular expressions
  const mathRegex = /\$\$(.*?)\$\$/gs;
  const clozeRegex = /\{\{c\d+::(.*?)\}\}/g;
  const highlightRegex = /==(.*?)==/g;

  // Find all math blocks
  const mathBlocks = [];
  let mathMatch;
  while ((mathMatch = mathRegex.exec(content)) !== null) {
    mathBlocks.push({
      start: mathMatch.index,
      end: mathMatch.index + mathMatch[0].length,
      content: mathMatch[1],
      fullMatch: mathMatch[0],
    });
  }

  // Process content in chunks (math vs non-math)
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
      // If LaTeX rendering fails, show the raw content
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
