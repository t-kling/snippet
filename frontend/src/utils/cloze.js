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
