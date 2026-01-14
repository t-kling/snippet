/**
 * Cloze deletion utilities
 * Format: {{c1::answer}}
 */

export const parseCloze = (text) => {
  const clozeRegex = /\{\{c(\d+)::([^}]+)\}\}/g;
  const clozes = [];
  let match;

  while ((match = clozeRegex.exec(text)) !== null) {
    clozes.push({
      index: parseInt(match[1]),
      answer: match[2],
      start: match.index,
      end: match.index + match[0].length,
      fullMatch: match[0],
    });
  }

  return clozes;
};

export const renderClozeHidden = (text) => {
  return text.replace(/\{\{c\d+::([^}]+)\}\}/g, '[...]');
};

export const renderClozeVisible = (text) => {
  return text.replace(/\{\{c\d+::([^}]+)\}\}/g, '$1');
};

export const insertCloze = (text, selectionStart, selectionEnd) => {
  const selectedText = text.substring(selectionStart, selectionEnd);

  if (!selectedText) {
    return text;
  }

  // Find the next cloze number
  const existingClozes = parseCloze(text);
  const nextNumber = existingClozes.length > 0
    ? Math.max(...existingClozes.map(c => c.index)) + 1
    : 1;

  const clozeText = `{{c${nextNumber}::${selectedText}}}`;
  const newText = text.substring(0, selectionStart) + clozeText + text.substring(selectionEnd);

  return newText;
};

/**
 * Highlight utilities
 * Format: ==highlighted text==
 */

export const insertHighlight = (text, selectionStart, selectionEnd) => {
  const selectedText = text.substring(selectionStart, selectionEnd);

  if (!selectedText) {
    return text;
  }

  const highlightText = `==${selectedText}==`;
  const newText = text.substring(0, selectionStart) + highlightText + text.substring(selectionEnd);

  return newText;
};

export const renderHighlights = (text) => {
  // Split by highlight markers while preserving the structure
  const parts = [];
  const regex = /==([^=]+)==/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before highlight
    if (match.index > lastIndex) {
      parts.push({ text: text.substring(lastIndex, match.index), highlighted: false });
    }
    // Add highlighted text
    parts.push({ text: match[1], highlighted: true });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ text: text.substring(lastIndex), highlighted: false });
  }

  return parts.length > 0 ? parts : [{ text, highlighted: false }];
};
