export type MarkdownAction =
  | 'bold'
  | 'italic'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'link'
  | 'blockquote'
  | 'code';

interface MarkdownResult {
  newValue: string;
  newCursorStart: number;
  newCursorEnd: number;
}

function wrapSelection(
  text: string,
  start: number,
  end: number,
  before: string,
  after: string,
  placeholder: string,
): MarkdownResult {
  const selected = text.slice(start, end);
  const content = selected || placeholder;
  const newValue = text.slice(0, start) + before + content + after + text.slice(end);

  if (selected) {
    return {
      newValue,
      newCursorStart: start + before.length,
      newCursorEnd: start + before.length + content.length,
    };
  }
  return {
    newValue,
    newCursorStart: start + before.length,
    newCursorEnd: start + before.length + placeholder.length,
  };
}

function prefixLines(
  text: string,
  start: number,
  end: number,
  prefixFn: (index: number) => string,
  placeholder: string,
): MarkdownResult {
  const selected = text.slice(start, end);

  if (!selected) {
    const prefix = prefixFn(0);
    const newValue = text.slice(0, start) + prefix + placeholder + text.slice(end);
    return {
      newValue,
      newCursorStart: start + prefix.length,
      newCursorEnd: start + prefix.length + placeholder.length,
    };
  }

  const lines = selected.split('\n');
  const prefixed = lines.map((line, i) => prefixFn(i) + line).join('\n');
  const newValue = text.slice(0, start) + prefixed + text.slice(end);

  return {
    newValue,
    newCursorStart: start,
    newCursorEnd: start + prefixed.length,
  };
}

export function applyMarkdownAction(
  action: MarkdownAction,
  text: string,
  selectionStart: number,
  selectionEnd: number,
): MarkdownResult {
  switch (action) {
    case 'bold':
      return wrapSelection(text, selectionStart, selectionEnd, '**', '**', 'bold text');

    case 'italic':
      return wrapSelection(text, selectionStart, selectionEnd, '*', '*', 'italic text');

    case 'heading2': {
      const lineStart = text.lastIndexOf('\n', selectionStart - 1) + 1;
      const selected = text.slice(selectionStart, selectionEnd) || 'Heading';
      const newValue = text.slice(0, lineStart) + '## ' + selected + text.slice(selectionEnd);
      return {
        newValue,
        newCursorStart: lineStart + 3,
        newCursorEnd: lineStart + 3 + selected.length,
      };
    }

    case 'heading3': {
      const lineStart = text.lastIndexOf('\n', selectionStart - 1) + 1;
      const selected = text.slice(selectionStart, selectionEnd) || 'Heading';
      const newValue = text.slice(0, lineStart) + '### ' + selected + text.slice(selectionEnd);
      return {
        newValue,
        newCursorStart: lineStart + 4,
        newCursorEnd: lineStart + 4 + selected.length,
      };
    }

    case 'bulletList':
      return prefixLines(text, selectionStart, selectionEnd, () => '- ', 'List item');

    case 'numberedList':
      return prefixLines(text, selectionStart, selectionEnd, (i) => `${i + 1}. `, 'List item');

    case 'link': {
      const selected = text.slice(selectionStart, selectionEnd);
      if (selected) {
        const newValue = text.slice(0, selectionStart) + '[' + selected + '](url)' + text.slice(selectionEnd);
        const urlStart = selectionStart + selected.length + 2;
        return {
          newValue,
          newCursorStart: urlStart,
          newCursorEnd: urlStart + 3,
        };
      }
      const newValue = text.slice(0, selectionStart) + '[link text](url)' + text.slice(selectionEnd);
      return {
        newValue,
        newCursorStart: selectionStart + 1,
        newCursorEnd: selectionStart + 10,
      };
    }

    case 'blockquote':
      return prefixLines(text, selectionStart, selectionEnd, () => '> ', 'Quote');

    case 'code':
      return wrapSelection(text, selectionStart, selectionEnd, '`', '`', 'code');

    default:
      return { newValue: text, newCursorStart: selectionStart, newCursorEnd: selectionEnd };
  }
}
