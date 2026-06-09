/**
 * Join token strings into readable text.
 * Handles word-level tokens (split on spaces) and tokens that include whitespace.
 */
export function joinTokens(tokens: string[]): string {
  if (tokens.length === 0) return '';

  return tokens.reduce((acc, token, i) => {
    if (i === 0) return token === ' ' ? '' : token;
    if (token === ' ') return `${acc} `;
    if (/^[,.:;!?)]/.test(token)) return acc + token;
    if (/^['"]/.test(token)) return acc + token;
    return `${acc} ${token}`;
  }, '');
}

/**
 * Extract the generated continuation from full model output.
 */
export function extractGeneratedText(fullOutput: string, inputText: string): string {
  if (!fullOutput) return '';
  if (fullOutput.startsWith(inputText)) {
    return fullOutput.slice(inputText.length).trimStart();
  }
  const replaced = fullOutput.replace(inputText, '').trim();
  return replaced || fullOutput;
}

/**
 * Split generated text into display tokens (word-level).
 */
export function tokenizeForDisplay(text: string): string[] {
  if (!text) return [];
  return text.split(/\s+/).filter(Boolean);
}
