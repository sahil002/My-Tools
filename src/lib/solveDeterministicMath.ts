export type DeterministicSolution = {
  kind: 'quadratic' | 'linear' | 'identity' | 'none' | 'general';
  answer: string;
  steps: { title: string; work: string; why: string; detail?: string }[];
  check: string;
  concept: string;
  formula: string;
  practice: string;
  practiceAnswer: string;
  methodName?: string;
  problemType?: string;
  methodReason?: string;
};

const fmt = (n: number) => {
  if (!Number.isFinite(n)) return String(n);
  if (Math.abs(n) < 1e-10) return '0';
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  return String(Number(n.toPrecision(10)));
};

function evaluateArithmetic(source: string): number | null {
  const text = source.replace(/[−–—]/g, '-').replace(/[×·⋅]/g, '*').replace(/÷/g, '/').replace(/,/g, '');
  const tokens = text.match(/(?:\d+(?:\.\d*)?|\.\d+)|[()+\-*/^]/g);
  if (!tokens || tokens.join('') !== text.replace(/\s+/g, '') || tokens.length > 100) return null;
  let i = 0;
  const primary = (): number => {
    const t = tokens[i++];
    if (t === undefined) throw new Error('missing value');
    if (t === '+') return primary();
    if (t === '-') return -primary();
    if (t === '(') {
      const value = expression();
      if (tokens[i++] !== ')') throw new Error('missing close bracket');
      return value;
    }
    const n = Number(t);
    if (!Number.isFinite(n)) throw new Error('invalid number');
    return n;
  };
  const power = (): number => {
    const left = primary();
    if (tokens[i] === '^') { i++; return Math.pow(left, power()); }
    return left;
  };
  const product = (): number => {
    let n = power();
    while (tokens[i] === '*' || tokens[i] === '/') {
      const op = tokens[i++];
      const rhs = power();
      if (op === '/' && rhs === 0) throw new Error('division by zero');
      n = op === '*' ? n * rhs : n / rhs;
    }
    return n;
  };
  const expression = (): number => {
    let n = product();
    while (tokens[i] === '+' || tokens[i] === '-') {
      const op = tokens[i++];
      const rhs = product();
      n = op === '+' ? n + rhs : n - rhs;
    }
    return n;
  };
  try {
    const value = expression();
    if (i !== tokens.length || !Number.isFinite(value) || Math.abs(value) > 1e15) return null;
    return value;
  } catch { return null; }
}

function makeSolution(args: {
  type: string; method: string; reason: string; answer: string; concept: string; formula: string;
  steps: DeterministicSolution['steps']; check: string; practice?: string; practiceAnswer?: string;
}): DeterministicSolution {
  return {
    kind: 'general', problemType: args.type, methodName: args.method, methodReason: args.reason,
    answer: args.answer, concept: args.concept, formula: args.formula, steps: args.steps,
    check: args.check, practice: args.practice || 'Calculate 18% of 250.', practiceAnswer: args.practiceAnswer || '45',
  };
}

/** Free deterministic helpers for common school-math questions. Returns null rather than guessing. */
export function solveDeterministicMath(input: string): DeterministicSolution | null {
  const q = input.trim();
  if (!q || q.length > 1000) return null;
  const lower = q.toLowerCase().replace(/[−–—]/g, '-').replace(/[×·⋅]/g, '*').replace(/÷/g, '/');

  // Percentage questions: "15% of 200", "what is 15 percent of 200?"
  const percent = lower.match(/(?:what\s+is\s+)?(-?\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:of|\*|×)?\s*(-?\d+(?:\.\d+)?)/);
  if (percent) {
    const rate = Number(percent[1]), amount = Number(percent[2]), value = rate / 100 * amount;
    return makeSolution({
      type: 'Percentage calculation', method: 'Find the percentage of a quantity',
      reason: 'A percentage means “out of 100”, so convert it to a decimal and multiply by the quantity.',
      answer: fmt(value),
      concept: `${fmt(rate)}% means ${fmt(rate)}/100 of the whole amount.`,
      formula: 'Percentage value = (percentage ÷ 100) × whole',
      steps: [
        { title: 'Identify the values', work: `Percentage = ${fmt(rate)}%; whole = ${fmt(amount)}`, why: 'Separate the rate from the amount the percentage is taken from.' },
        { title: 'Convert percent to a decimal', work: `${fmt(rate)} ÷ 100 = ${fmt(rate / 100)}`, why: 'Percent means per hundred, so divide the percentage by 100.' },
        { title: 'Multiply by the whole amount', work: `${fmt(rate / 100)} × ${fmt(amount)} = ${fmt(value)}`, why: 'Multiplication finds the requested fraction of the whole.' },
      ],
      check: `${fmt(value)} ÷ ${fmt(amount)} × 100 = ${fmt(amount === 0 ? 0 : value / amount * 100)}% (when the whole is non-zero).`,
      practice: 'Find 20% of 150.', practiceAnswer: '30',
    });
  }

  // Square roots and powers.
  const root = lower.match(/(?:square\s+root\s+of|sqrt\s*\(?\s*)(-?\d+(?:\.\d+)?)/);
  if (root) {
    const n = Number(root[1]);
    if (n < 0) return null;
    const value = Math.sqrt(n);
    return makeSolution({
      type: 'Square root', method: 'Use the inverse of squaring',
      reason: 'The square root asks which non-negative number multiplied by itself gives the input.',
      answer: fmt(value), concept: `The square root of ${fmt(n)} is the non-negative number whose square is ${fmt(n)}.`,
      formula: 'If x² = n and x ≥ 0, then x = √n',
      steps: [
        { title: 'Read the radicand', work: `√${fmt(n)}`, why: 'The number inside the radical is called the radicand.' },
        { title: 'Find the square root', work: `√${fmt(n)} = ${fmt(value)}`, why: 'Choose the non-negative value whose square equals the radicand.' },
      ],
      check: `${fmt(value)} × ${fmt(value)} = ${fmt(value * value)}.`,
      practice: 'Find the square root of 81.', practiceAnswer: '9',
    });
  }

  // Mean / average of a comma-separated list.
  if (/\b(mean|average)\b/.test(lower)) {
    const tail = lower.split(/\b(?:of|is|:|equals)\b/).pop() || '';
    const nums = tail.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
    if (nums.length >= 2 && nums.length <= 100) {
      const sum = nums.reduce((a, b) => a + b, 0), mean = sum / nums.length;
      return makeSolution({
        type: 'Statistics — arithmetic mean', method: 'Add all values and divide by the count',
        reason: 'The arithmetic mean is the total of all observations divided by how many observations there are.',
        answer: fmt(mean), concept: 'The mean is the equal-share value you would get if the total were distributed evenly.',
        formula: 'Mean = sum of values ÷ number of values',
        steps: [
          { title: 'List the observations', work: nums.join(', '), why: 'Each listed value contributes once to the total.' },
          { title: 'Add the values', work: nums.map(fmt).join(' + ') + ' = ' + fmt(sum), why: 'Find the total before dividing.' },
          { title: 'Divide by the number of values', work: `${fmt(sum)} ÷ ${nums.length} = ${fmt(mean)}`, why: `There are ${nums.length} observations, so divide the sum by ${nums.length}.` },
        ],
        check: `${fmt(mean)} × ${nums.length} = ${fmt(mean * nums.length)} (the original sum, up to rounding).`,
        practice: 'Find the mean of 3, 6, 9.', practiceAnswer: '6',
      });
    }
  }

  // Rectangle area/perimeter.
  const rectangle = lower.match(/\b(area|perimeter)\b.*\brectangle\b.*?(?:length|l)\s*(?:=|of|:)?\s*(-?\d+(?:\.\d+)?).*?(?:width|breadth|w)\s*(?:=|of|:)?\s*(-?\d+(?:\.\d+)?)/)
    || lower.match(/\b(area|perimeter)\b.*\brectangle\b.*?(-?\d+(?:\.\d+)?)\s*(?:by|×|\*)\s*(-?\d+(?:\.\d+)?)/);
  if (rectangle) {
    const mode = rectangle[1], l = Number(rectangle[2]), w = Number(rectangle[3]);
    if (l < 0 || w < 0) return null;
    const areaMode = mode === 'area', value = areaMode ? l * w : 2 * (l + w);
    return makeSolution({
      type: `Geometry — rectangle ${mode}`, method: areaMode ? 'Multiply length by width' : 'Add all four sides',
      reason: areaMode ? 'A rectangle’s area counts square units inside it.' : 'A perimeter is the total distance around the boundary.',
      answer: fmt(value) + (areaMode ? ' square units' : ' units'),
      concept: areaMode ? 'Area measures the two-dimensional space inside a shape.' : 'Perimeter measures the total boundary length.',
      formula: areaMode ? 'A = length × width' : 'P = 2 × (length + width)',
      steps: [
        { title: 'Identify dimensions', work: `Length = ${fmt(l)}, width = ${fmt(w)}`, why: 'Use the two perpendicular side lengths of the rectangle.' },
        { title: areaMode ? 'Multiply the dimensions' : 'Add the side lengths', work: areaMode ? `${fmt(l)} × ${fmt(w)} = ${fmt(value)}` : `2 × (${fmt(l)} + ${fmt(w)}) = 2 × ${fmt(l + w)} = ${fmt(value)}`, why: areaMode ? 'The area formula multiplies the two dimensions.' : 'Opposite sides are equal, so double the sum of length and width.' },
      ],
      check: areaMode ? `The product ${fmt(l)} × ${fmt(w)} is ${fmt(value)} square units.` : `Two lengths and two widths total ${fmt(l)} + ${fmt(w)} + ${fmt(l)} + ${fmt(w)} = ${fmt(value)} units.`,
      practice: 'Find the area of a rectangle 8 by 3.', practiceAnswer: '24 square units',
    });
  }

  // Pythagorean theorem with two named legs.
  const pyth = lower.match(/(?:right\s*triangle|pythagorean|hypotenuse).*?(?:legs?|sides?)\s*(?:are|of|=|:)?\s*(-?\d+(?:\.\d+)?)\s*(?:and|,)\s*(-?\d+(?:\.\d+)?)/)
    || lower.match(/(?:hypotenuse|pythagorean).*?(-?\d+(?:\.\d+)?)\s*(?:and|,)\s*(-?\d+(?:\.\d+)?)/);
  if (pyth) {
    const a = Number(pyth[1]), b = Number(pyth[2]);
    if (a <= 0 || b <= 0) return null;
    const squareSum = a*a + b*b, c = Math.sqrt(squareSum);
    return makeSolution({
      type: 'Geometry — right triangle', method: 'Pythagorean theorem',
      reason: 'For a right-angled triangle, the square of the hypotenuse equals the sum of the squares of the two perpendicular legs.',
      answer: `c = √${fmt(squareSum)} ≈ ${fmt(c)}`,
      concept: 'The hypotenuse is the side opposite the right angle and is the longest side.',
      formula: 'a² + b² = c²',
      steps: [
        { title: 'Identify the perpendicular legs', work: `a = ${fmt(a)}, b = ${fmt(b)}`, why: 'The two given legs meet at the right angle.' },
        { title: 'Square and add', work: `${fmt(a)}² + ${fmt(b)}² = ${fmt(a*a)} + ${fmt(b*b)} = ${fmt(squareSum)}`, why: 'The theorem adds the squares of both legs.' },
        { title: 'Take the square root', work: `c = √${fmt(squareSum)} ≈ ${fmt(c)}`, why: 'Square root reverses squaring and gives the positive side length.' },
      ],
      check: `${fmt(a)}² + ${fmt(b)}² = ${fmt(squareSum)}; (${fmt(c)})² ≈ ${fmt(c*c)}.`,
      practice: 'A right triangle has legs 5 and 12. Find its hypotenuse.', practiceAnswer: '13',
    });
  }

  // Arithmetic expression in an explicitly computational question.
  const explicitlyAsked = /\b(calculate|compute|evaluate|simplify|what\s+is|solve)\b/.test(lower);
  const expressionMatch = lower.match(/(?:calculate|compute|evaluate|simplify|what\s+is|solve)\s*[:=]?\s*([\d().+\-*/^\s]+)/);
  if (explicitlyAsked && expressionMatch) {
    const expression = expressionMatch[1].trim();
    const value = evaluateArithmetic(expression);
    if (value !== null) {
      return makeSolution({
        type: 'Arithmetic expression', method: 'Order of operations (PEMDAS/BODMAS)',
        reason: 'Evaluate brackets first, then powers, multiplication/division, and addition/subtraction.',
        answer: fmt(value), concept: 'Order of operations ensures everyone evaluates the same expression consistently.',
        formula: 'Brackets → powers → multiplication/division → addition/subtraction',
        steps: [
          { title: 'Read the expression', work: expression, why: 'Identify numbers, operations and any brackets before calculating.' },
          { title: 'Apply order of operations', work: `${expression} = ${fmt(value)}`, why: 'The expression parser applies powers and higher-priority operations before lower-priority ones; operations of equal priority go left to right.' },
        ],
        check: `Re-evaluating the expression with the same order of operations gives ${fmt(value)}.`,
        practice: 'Calculate 6 + 2 × 5.', practiceAnswer: '16',
      });
    }
  }

  return null;
}
