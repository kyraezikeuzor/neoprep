const PROSE_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "at",
  "be",
  "by",
  "choice",
  "constant",
  "discriminant",
  "each",
  "equal",
  "equals",
  "equation",
  "exactly",
  "expression",
  "factor",
  "for",
  "formula",
  "from",
  "function",
  "giving",
  "given",
  "has",
  "here",
  "if",
  "in",
  "instead",
  "into",
  "is",
  "its",
  "of",
  "on",
  "one",
  "or",
  "originally",
  "priced",
  "real",
  "results",
  "so",
  "solution",
  "solutions",
  "substituting",
  "system",
  "that",
  "the",
  "then",
  "this",
  "to",
  "value",
  "what",
  "when",
  "where",
  "which",
  "with",
]);

const PROSE_START =
  /^(What|Which|Find|How|If\b|In\b|The\b|A\b|An\b|Given|For\b|Determine|Based|According|Of the|Based)/i;

/** Single linear / simple algebraic equation (no leading prose). */
const LINEAR_EQ =
  /^([+-]?(?:\d+)?[a-z](?:\^\{\d+\}|\^\d+)?(?:\s*[+-]\s*(?:\d+)?[a-z](?:\^\{\d+\}|\^\d+)?)*(?:\s*[+-]\s*\d+(?:\/\d+)?)?\s*=\s*[+-]?\d+(?:\/\d+)?)/i;

/** Function form: y = 2x + 3 (stops before next equation or prose). */
const FUNC_EQ =
  /^([a-z]\s*=\s*[+-]?(?:\d+)?(?:[a-z](?:\^\{\d+\}|\^\d+)?)?(?:\s*[+-]\s*(?:\d+)?(?:[a-z](?:\^\{\d+\}|\^\d+)?)?)*)/i;

function isProseWord(word: string) {
  return PROSE_WORDS.has(word.toLowerCase());
}

function normalizeExponents(text: string): string {
  return text.replace(/\^(\d+)/g, "^{$1}");
}

function toAlignedLine(eq: string): string {
  const m = eq.match(/^(.+?)\s*=\s*(.+)$/);
  if (!m) return eq;
  return `${m[1].trim()} &= ${m[2].trim()}`;
}

/**
 * Pull leading equation block(s) off the stem so they can sit above the
 * question prose (SAT system-of-equations style).
 *
 * Handles jammed text like:
 *   "2x + y = 10 x - y = 2 What is the value of x..."
 * and newline-separated equation lists.
 */
export function splitLeadingEquations(stem: string): {
  equations: string[];
  prose: string;
} {
  if (!stem) return { equations: [], prose: stem };

  // Prefer explicit newlines: equations on their own lines at the top
  if (stem.includes("\n")) {
    const lines = stem.split(/\n/);
    const equations: string[] = [];
    let i = 0;
    for (; i < lines.length; i++) {
      const line = normalizeExponents(lines[i].trim());
      if (!line) continue;
      if (PROSE_START.test(line)) break;
      const linear = line.match(LINEAR_EQ);
      const func = line.match(FUNC_EQ);
      const eq = linear?.[1] ?? (func && line === func[1].trim() ? func[1] : null);
      if (eq && eq.trim() === line) {
        equations.push(eq.trim());
        continue;
      }
      // line is pure equation if it looks like math = math and has no prose words
      if (/^[^=]+=.+$/.test(line) && !/\b(what|which|value|solution)\b/i.test(line)) {
        equations.push(line);
        continue;
      }
      break;
    }
    if (equations.length > 0) {
      const prose = lines.slice(i).join("\n").trim();
      if (prose && (PROSE_START.test(prose) || equations.length >= 2)) {
        return { equations, prose };
      }
    }
  }

  let s = normalizeExponents(stem.trim());
  const equations: string[] = [];

  while (s.length > 0) {
    if (PROSE_START.test(s)) break;

    let matched: string | null = null;
    const linear = s.match(LINEAR_EQ);
    if (linear) {
      matched = linear[1];
    } else {
      const func = s.match(FUNC_EQ);
      if (func) {
        // Only accept y=... if the remainder starts with another eq or prose
        const rest = s.slice(func[1].length).trim();
        if (
          PROSE_START.test(rest) ||
          LINEAR_EQ.test(rest) ||
          (FUNC_EQ.test(rest) && equations.length >= 0)
        ) {
          matched = func[1];
        }
      }
    }

    if (!matched) break;
    equations.push(matched.replace(/\s+/g, " ").trim());
    s = s.slice(matched.length).trim();
  }

  if (equations.length === 0) return { equations: [], prose: stem };

  // Keep extraction when we have a system (2+) or clear prose tail
  if (equations.length >= 2 || PROSE_START.test(s)) {
    return { equations, prose: s };
  }

  return { equations: [], prose: stem };
}

function formatEquationBlock(equations: string[]): string {
  if (equations.length === 0) return "";
  if (equations.length === 1) {
    return `\\[${equations[0]}\\]`;
  }
  const body = equations.map(toAlignedLine).join(" \\\\\n");
  return `\\[\\begin{aligned}\n${body}\n\\end{aligned}\\]`;
}

/**
 * Prepare question text for MathJax.
 *
 * Bank content often uses ASCII caret math (kx^2) without delimiters.
 * Dollar signs in stems are frequently currency ($80), so we use \(...\)
 * instead of $...$ and only auto-wrap algebra-looking spans.
 *
 * Leading equation systems are pulled into a display block above the prose.
 */
export function prepareForMathJax(text: string): string {
  if (!text) return text;

  // Imported JSON occasionally preserves an extra escape slash, turning a
  // valid delimiter such as \[ into \\[. Normalize only delimiters here so
  // MathJax receives the syntax it is configured to typeset.
  text = text
    .replace(/\\\\([\[\]()])/g, "\\$1");

  // A few legacy AI rationales contain full sentences inside a TeX delimiter.
  // They cannot be safely recovered as mixed prose/math because the original
  // delimiter boundaries are wrong. Render those as plain readable text rather
  // than allowing MathJax to italicize and run every word together.
  const hasMalformedStepMath =
    /\bStep\s*\d+/i.test(text) && /\\+[\[(]/.test(text);

  // Repair a common generated-rationale mistake: putting the prose phrase
  // "of the form" inside a math delimiter, often alongside malformed v0/h0
  // parameter notation for projectile equations.
  text = text
    .replace(
      /of the\s+\\\(\s*form\s+([\s\S]*?)\\\)/gi,
      (_match, formula: string) => `of the form \\(${formula.trim()}\\)`
    )
    .replace(/\bv0\*(?=\s*[+\-]|\s*$)/g, "v_0")
    .replace(/\bh0\b/g, "h_0");

  // Imported explanations sometimes omit the space immediately before or
  // after inline MathJax delimiters. MathJax then visually joins prose to the
  // formula (for example, "-16gives"), even though they are separate ideas.
  text = text
    .replace(/\\\)(?=[A-Za-z])/g, "\\) ")
    .replace(/([A-Za-z0-9])\\\(/g, "$1 \\(");

  // Some imported/generated rationales incorrectly wrap whole prose steps in
  // inline-math delimiters, which makes the entire explanation italic and
  // removes normal word spacing. A rationale that contains a numbered step is
  // prose, even when it also contains formulas, so remove those bad wrappers.
  text = text.replace(/\\+\(([\s\S]*?)\\+\)/g, (match, inner: string) => {
    if (/\b(?:step\s*\d+|identify|substitute|simplify|because|therefore|first|second)\b/i.test(inner)) {
      return inner;
    }
    return match;
  });

  // Keep legacy explanations readable while older generated rows remain in
  // the bank. Convert AI-style step labels and dashes into ordinary numbered
  // prose before MathJax sees the text.
  if (/\bStep\s*\d+/i.test(text)) {
    text = text
      .replace(/[—–]/g, ", ")
      .replace(/\bStep\s*(\d+)\s*[:,\-]*\s*/gi, "\n$1. ")
      .replace(/([.!?])\s*(?=\d+\.\s)/g, "$1\n\n");
  }

  const { equations, prose } = splitLeadingEquations(text);
  const eqBlock = formatEquationBlock(equations);
  let s = normalizeExponents(equations.length ? prose : text);

  // Whole-line equations like "y = x^{2}"
  s = s
    .split("\n")
    .map((line) => {
      if (/\\[\(\[]/.test(line)) return line;
      const m = line.match(/^\s*(y\s*=\s*.+?)\s*$/i);
      return m ? `\\(${m[1].trim()}\\)` : line;
    })
    .join("\n");

  const spans: Array<[number, number]> = [];
  const expRe = /\^\{\d+\}/g;
  let match: RegExpExecArray | null;

  while ((match = expRe.exec(s)) !== null) {
    // Skip exponents already inside \( ... \)
    const before = s.slice(0, match.index);
    if (before.lastIndexOf("\\(") > before.lastIndexOf("\\)")) continue;

    let start = match.index;
    let end = match.index + match[0].length;

    // Expand left through math tokens / spaces, but not through prose words
    while (start > 0) {
      const prev = s[start - 1];
      if (/[0-9+\-=()\/]/.test(prev)) {
        start--;
        continue;
      }
      if (/[A-Za-z]/.test(prev)) {
        let i = start - 1;
        while (i > 0 && /[A-Za-z]/.test(s[i - 1])) i--;
        const word = s.slice(i, start);
        if (isProseWord(word) && word.length >= 2) break;
        start = i;
        continue;
      }
      if (/\s/.test(prev)) {
        // peek previous token
        let i = start - 1;
        while (i > 0 && /\s/.test(s[i - 1])) i--;
        let j = i;
        while (j > 0 && /[A-Za-z]/.test(s[j - 1])) j--;
        const word = s.slice(j, i);
        if (word && isProseWord(word) && word.length >= 2) break;
        start--;
        continue;
      }
      break;
    }
    while (start < match.index && /\s/.test(s[start])) start++;

    // Expand right
    while (end < s.length) {
      const next = s[end];
      if (/[0-9+\-=()\/]/.test(next)) {
        end++;
        continue;
      }
      if (/[A-Za-z]/.test(next)) {
        let i = end;
        while (i < s.length && /[A-Za-z]/.test(s[i])) i++;
        const word = s.slice(end, i);
        if (isProseWord(word) && word.length >= 3) break;
        end = i;
        continue;
      }
      if (/\s/.test(next)) {
        const rest = s.slice(end).match(/^\s+([A-Za-z]+)/);
        if (rest && isProseWord(rest[1]) && rest[1].length >= 3) break;
        end++;
        continue;
      }
      break;
    }
    while (end > match.index && /\s/.test(s[end - 1])) end--;

    if (start < end) spans.push([start, end]);
  }

  spans.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const span of spans) {
    const prev = merged[merged.length - 1];
    if (prev && span[0] <= prev[1] + 1) {
      prev[1] = Math.max(prev[1], span[1]);
    } else {
      merged.push([span[0], span[1]]);
    }
  }

  for (let i = merged.length - 1; i >= 0; i--) {
    const [start, end] = merged[i];
    const core = s.slice(start, end).trim();
    if (!core) continue;
    s = `${s.slice(0, start)}\\(${core}\\)${s.slice(end)}`;
  }

  s = wrapInlineMath(s);

  if (eqBlock) {
    // Single newline — display math is already a block; avoid a blank line gap
    return s ? `${eqBlock}\n${s}` : eqBlock;
  }
  return hasMalformedStepMath
    ? s.replace(/\\+[\[(]/g, "").replace(/\\+[\])]/g, "")
    : s;
}

function alreadyInMath(s: string, index: number) {
  const before = s.slice(0, index);
  return before.lastIndexOf("\\(") > before.lastIndexOf("\\)");
}

/**
 * Wrap SAT-style inline algebra so variables render italic (e.g. L + E = 4,500)
 * without touching currency like $1,275.
 */
function wrapInlineMath(text: string): string {
  if (!text) return text;
  let s = text;

  // Appositive single-letter variables: ", E," or ", L,"
  s = s.replace(/,\s*([A-Z])\s*,/g, (m, letter, offset) => {
    if (alreadyInMath(s, offset)) return m;
    return `, \\(${letter}\\),`;
  });

  // Equations like L + E = 4,500 or 2x + y = 10
  s = s.replace(
    /\b([A-Za-z]\d*(?:\s*[+\-]\s*[A-Za-z]\d*)*\s*=\s*-?[\d,]+(?:\.\d+)?)\b/g,
    (eq, _g1, offset) => {
      if (alreadyInMath(s, offset)) return eq;
      return `\\(${eq}\\)`;
    }
  );

  return s;
}
