"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAIResponse = parseAIResponse;
function extractJsonFromText(text) {
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
    let stringQuote = null;
    let previousChar = '';
    for (let i = startIndex; i < trimmed.length; i++) {
        const char = trimmed[i];
        if (inString) {
            if (char === stringQuote && previousChar !== '\\') {
                inString = false;
                stringQuote = null;
            }
        }
        else {
            if (char === '"' || char === "'") {
                inString = true;
                stringQuote = char;
            }
            else if (char === '{') {
                depth++;
            }
            else if (char === '}') {
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
function repairCommonJSONIssues(jsonStr) {
    let repaired = jsonStr.trim();
    // More robust comma fixing - handle various line ending scenarios
    // Fix missing commas between string properties
    repaired = repaired.replace(/(")\s*\n\s*"/g, '$1,\n  "');
    // Fix missing commas after string values before closing braces
    repaired = repaired.replace(/(")\s*\n\s*(\})/g, '$1$2');
    // Fix missing commas after closing braces/brackets before new properties
    repaired = repaired.replace(/(\}|\])\s*\n\s*"/g, '$1,\n  "');
    // Fix missing commas after arrays before new properties
    repaired = repaired.replace(/(\])\s*\n\s*"/g, '$1,\n  "');
    // Fix missing commas after nested objects
    repaired = repaired.replace(/(\})\s*\n\s*"/g, '$1,\n  "');
    // More sophisticated approach - parse character by character
    let result = '';
    let inString = false;
    let escapeNext = false;
    let openBraces = 0;
    let openBrackets = 0;
    let lastNonWhitespaceChar = '';
    let lastNonWhitespaceIndex = -1;
    for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];
        const nextChar = i < repaired.length - 1 ? repaired[i + 1] : '';
        if (escapeNext) {
            result += char;
            escapeNext = false;
            continue;
        }
        if (inString) {
            if (char === '\\') {
                escapeNext = true;
            }
            else if (char === '"') {
                inString = false;
                lastNonWhitespaceChar = char;
                lastNonWhitespaceIndex = result.length;
            }
            result += char;
            continue;
        }
        // Not in string
        if (char === '"') {
            inString = true;
            // Check if we need a comma before this quote
            if (lastNonWhitespaceChar &&
                (lastNonWhitespaceChar === '"' || lastNonWhitespaceChar === '}' || lastNonWhitespaceChar === ']') &&
                result.slice(lastNonWhitespaceIndex).match(/^\s*$/)) {
                result = result.slice(0, lastNonWhitespaceIndex + 1) + ',' + result.slice(lastNonWhitespaceIndex + 1);
            }
        }
        else if (char === '{') {
            openBraces++;
        }
        else if (char === '}') {
            openBraces--;
        }
        else if (char === '[') {
            openBrackets++;
        }
        else if (char === ']') {
            openBrackets--;
        }
        if (char.trim()) {
            lastNonWhitespaceChar = char;
            lastNonWhitespaceIndex = result.length;
        }
        result += char;
    }
    // Handle incomplete JSON - add missing closing braces and brackets
    while (openBraces > 0) {
        result = result.replace(/,\s*$/, '') + '\n}';
        openBraces--;
    }
    while (openBrackets > 0) {
        result = result.replace(/,\s*$/, '') + '\n]';
        openBrackets--;
    }
    // Final cleanup - remove trailing commas before closing braces/brackets
    result = result.replace(/,(\s*[\}\]])/g, '$1');
    return result;
}
function parseAIResponse(response) {
    const trimmed = response.trim();
    // Fast path: direct JSON
    try {
        return JSON.parse(trimmed);
    }
    catch { }
    // Try to extract JSON from code fences or balanced braces
    const extracted = extractJsonFromText(trimmed);
    if (extracted) {
        try {
            return JSON.parse(extracted);
        }
        catch (error) {
            // Try to repair common JSON issues before giving up
            try {
                const repaired = repairCommonJSONIssues(extracted);
                console.log('Attempting to repair JSON...');
                return JSON.parse(repaired);
            }
            catch (repairError) {
                console.error('Failed to parse extracted JSON:', extracted.substring(0, 500) + '...');
                const repairedAttempt = repairCommonJSONIssues(extracted);
                console.error('Failed to repair JSON:', repairedAttempt.substring(0, 500) + '...');
                console.error('Original error:', error instanceof Error ? error.message : 'Unknown error');
                console.error('Repair error:', repairError instanceof Error ? repairError.message : 'Unknown repair error');
                throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
    // Legacy fallback: previous simple fence stripping
    let legacy = trimmed;
    if (legacy.startsWith('```json')) {
        legacy = legacy.substring(7);
    }
    else if (legacy.startsWith('```')) {
        legacy = legacy.substring(3);
    }
    if (legacy.endsWith('```')) {
        legacy = legacy.substring(0, legacy.length - 3);
    }
    legacy = legacy.trim();
    try {
        return JSON.parse(legacy);
    }
    catch (error) {
        console.error('Failed to parse cleaned response:', legacy);
        throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
