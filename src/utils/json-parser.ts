function extractJsonFromText(text: string): string | null {
  const trimmed = text.trim();

  // 1) Prefer fenced ```json blocks anywhere in the text
  const fencedJsonMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedJsonMatch && fencedJsonMatch[1]) {
    return fencedJsonMatch[1].trim();
  }

  // 2) Any fenced block that appears to be JSON
  const fencedAnyMatch = trimmed.match(/```\s*([\s\S]*?)\s*```/);
  if (fencedAnyMatch && fencedAnyMatch[1]) {
    const candidate = fencedAnyMatch[1].trim();
    if (candidate.startsWith('{') && candidate.endsWith('}')) {
      return candidate;
    }
  }

  // 3) Heuristic: find the first balanced JSON object in the text
  const startIndex = trimmed.indexOf('{');
  if (startIndex === -1) {
    return null;
  }

  // Scan for a balanced closing brace, tracking strings and escapes
  let depth = 0;
  let inString = false;
  let stringQuote: '"' | "'" | null = null;
  let previousChar = '';

  for (let i = startIndex; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (inString) {
      if (char === stringQuote && previousChar !== '\\') {
        inString = false;
        stringQuote = null;
      }
    } else {
      if (char === '"' || char === "'") {
        inString = true;
        stringQuote = char as '"' | "'";
      } else if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          const candidate = trimmed.slice(startIndex, i + 1).trim();
          return candidate;
        }
      }
    }
    previousChar = char;
  }

  return null;
}

export function parseAIResponse(response: string): any {
  const trimmed = response.trim();

  // Fast path: direct JSON
  try {
    return JSON.parse(trimmed);
  } catch {}

  // Try to extract JSON from code fences or balanced braces
  const extracted = extractJsonFromText(trimmed);
  if (extracted) {
    try {
      return JSON.parse(extracted);
    } catch (error) {
      console.error('Failed to parse extracted JSON:', extracted);
      throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Legacy fallback: previous simple fence stripping
  let legacy = trimmed;
  if (legacy.startsWith('```json')) {
    legacy = legacy.substring(7);
  } else if (legacy.startsWith('```')) {
    legacy = legacy.substring(3);
  }
  if (legacy.endsWith('```')) {
    legacy = legacy.substring(0, legacy.length - 3);
  }
  legacy = legacy.trim();

  try {
    return JSON.parse(legacy);
  } catch (error) {
    console.error('Failed to parse cleaned response:', legacy);
    throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}