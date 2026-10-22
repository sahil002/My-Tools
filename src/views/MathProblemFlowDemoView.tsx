import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, FileImage,
  Lightbulb, RotateCcw, Sigma, Sparkles, Upload, X, GraduationCap, ShieldCheck,
} from 'lucide-react';
import { SEOHelmet } from '../components/SEOHelmet';
import { solveDeterministicMath } from '../lib/solveDeterministicMath';

type Solution = {
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

function cleanNumber(value: number): string {
  if (Math.abs(value) < 1e-10) return '0';
  if (Math.abs(value - Math.round(value)) < 1e-9) return String(Math.round(value));
  return String(Number(value.toFixed(6)));
}

function signedTerm(value: number, variable: string): string {
  if (Math.abs(value) < 1e-10) return '';
  const abs = Math.abs(value);
  const coefficient = abs === 1 ? '' : cleanNumber(abs);
  return `${value < 0 ? ' − ' : ' + '}${coefficient}${variable}`;
}

function polynomialText(a: number, b: number, c: number): string {
  let result = '';
  if (Math.abs(a) > 1e-10) result = `${Math.abs(a) === 1 ? '' : cleanNumber(Math.abs(a))}x²`;
  if (Math.abs(a) > 1e-10 && a < 0) result = '−' + result;
  result += signedTerm(b, 'x');
  if (Math.abs(c) > 1e-10) result += signedTerm(c, '');
  return result || '0';
}

function parsePolynomial(input: string): { a: number; b: number; c: number } | null {
  // Normalize common keyboard and textbook notation before parsing.
  // Students often paste a typographic minus (−/–) instead of the ASCII hyphen.
  const normalized = input.toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/[＋]/g, '+')
    .replace(/²/g, '^2')
    .replace(/[×·⋅]/g, '*')
    .replace(/[＝]/g, '=')
    .replace(/\s+/g, '');
  const sides = normalized.split('=');
  if (sides.length !== 2) return null;

  const readSide = (side: string) => {
    const terms = side.match(/[+-]?[^+-]+/g);
    if (!terms) return null;
    const result = { a: 0, b: 0, c: 0 };
    for (const raw of terms) {
      const term = raw.replace(/^\*/, '');
      if (!term) continue;
      if (term.includes('x^2')) {
        const coefficient = term.replace('x^2', '').replace(/\*$/, '');
        result.a += coefficient === '' || coefficient === '+' ? 1 : coefficient === '-' ? -1 : Number(coefficient);
      } else if (term.includes('x')) {
        const coefficient = term.replace('x', '').replace(/\*$/, '');
        result.b += coefficient === '' || coefficient === '+' ? 1 : coefficient === '-' ? -1 : Number(coefficient);
      } else {
        result.c += Number(term);
      }
    }
    return Object.values(result).every(Number.isFinite) ? result : null;
  };

  const left = readSide(sides[0]);
  const right = readSide(sides[1]);
  if (!left || !right) return null;
  return { a: left.a - right.a, b: left.b - right.b, c: left.c - right.c };
}

function solveMathProblem(question: string): Solution | null {
  const parsed = parsePolynomial(question);
  if (!parsed) return null;
  const { a, b, c } = parsed;
  const equation = `${polynomialText(a, b, c)} = 0`;

  if (Math.abs(a) < 1e-10 && Math.abs(b) < 1e-10) {
    if (Math.abs(c) < 1e-10) {
      return {
        kind: 'identity', answer: 'Infinitely many solutions',
        steps: [
          { title: 'Simplify both sides', work: '0 = 0', why: 'Both sides are equal, so the statement is true for every value of x.' },
          { title: 'State the solution set', work: 'x can be any real number', why: 'No restriction on x remains.' },
        ],
        check: 'The equation reduces to a true statement (0 = 0).',
        concept: 'An identity is an equation that stays true for every allowed value.',
        formula: 'If both sides simplify to the same expression, every allowed value works.',
        practice: '2x + 1 = 2x + 1', practiceAnswer: 'Every real number',
      };
    }
    return {
      kind: 'none', answer: 'No solution',
      steps: [
        { title: 'Simplify the equation', work: `0 = ${cleanNumber(-c)}`, why: 'The x terms cancel, leaving a statement that cannot be true.' },
        { title: 'Check the statement', work: '0 is not equal to a non-zero number', why: 'There is no value of x that can make this statement true.' },
      ],
      check: 'The simplified equation is a contradiction, so no solution exists.',
      concept: 'A contradiction is a statement that is always false.',
      formula: 'If variables cancel and leave a false statement, there is no solution.',
      practice: '3x + 2 = 3x + 7', practiceAnswer: 'No solution',
    };
  }

  if (Math.abs(a) < 1e-10) {
    const x = -c / b;
    return {
      kind: 'linear', answer: `x = ${cleanNumber(x)}`,
      steps: [
        { title: 'Write the simplified equation', work: `${polynomialText(0, b, c)} = 0`, why: 'Move all terms to one side so the equation equals zero.', detail: 'Pehle dono sides ke x wale terms aur numbers ko combine kiya jata hai. Is se equation ki simple form bx + c = 0 milti hai. Equal sign ka matlab hai dono sides ki value barabar rehni chahiye.' },
        { title: 'Move the constant', work: `${cleanNumber(b)}x = ${cleanNumber(-c)}`, why: 'Add the opposite of the constant to both sides. This keeps the equation balanced.', detail: `Constant ${cleanNumber(c)} ko hatane ke liye dono sides par ${cleanNumber(-c)} add karte hain. Left side par ${cleanNumber(c)} + (${cleanNumber(-c)}) = 0 ho jata hai, aur right side par 0 + (${cleanNumber(-c)}) = ${cleanNumber(-c)}. Isi liye sign badalta hua nazar aata hai; asal mein hum ne dono sides par same operation kiya.` },
        { title: 'Divide by the coefficient of x', work: `x = ${cleanNumber(-c)} ÷ ${cleanNumber(b)} = ${cleanNumber(x)}`, why: 'Division isolates x because x is multiplied by ' + cleanNumber(b) + '.', detail: `x ke saath ${cleanNumber(b)} multiply ho raha hai. Multiplication ko undo karne ke liye dono sides ko ${cleanNumber(b)} se divide karte hain. Is se left side par sirf x reh jata hai aur right side ka quotient ${cleanNumber(x)} aata hai.` },
      ],
      check: `Substitute x = ${cleanNumber(x)}: ${cleanNumber(b)} × ${cleanNumber(x)} + ${cleanNumber(c)} = ${cleanNumber(b * x + c)}. The result is 0, so it checks out.`,
      concept: 'A linear equation has x to the first power only. Use inverse operations to isolate x.',
      formula: 'bx + c = 0  →  x = −c / b',
      practice: '3x − 12 = 0', practiceAnswer: 'x = 4',
    };
  }

  const discriminant = b * b - 4 * a * c;
  const steps = [
    { title: 'Put it in standard form', work: equation, why: 'A quadratic equation has an x² term. Move all terms to one side so the other side is zero.', detail: 'Quadratic formula tab apply hota hai jab equation ax² + bx + c = 0 ki standard form mein ho. Agar koi term doosri side ho, to usay dono sides par add ya subtract karke left side par le aate hain. Is sample mein equation pehle se isi form mein hai, is liye terms change nahi hui.' },
    { title: 'Identify a, b and c', work: `a = ${cleanNumber(a)},   b = ${cleanNumber(b)},   c = ${cleanNumber(c)}`, why: 'These are the coefficients in ax² + bx + c = 0. Keep each sign exactly as it appears.', detail: `Standard form ax² + bx + c = 0 ke saath compare karein: x² ke saath jo number hai woh a = ${cleanNumber(a)}, x ke saath jo number hai woh b = ${cleanNumber(b)}, aur akela number c = ${cleanNumber(c)} hai. x² ke saath number na likha ho to coefficient 1 hota hai. Minus sign coefficient ka hissa hota hai.` },
    { title: 'Calculate the discriminant', work: `D = b² − 4ac = (${cleanNumber(b)})² − 4(${cleanNumber(a)})(${cleanNumber(c)}) = ${cleanNumber(discriminant)}`, why: 'The discriminant tells us how many real solutions the equation has.', detail: `Formula ke square-root ke andar wali quantity D = b² − 4ac ko discriminant kehte hain. Is example mein pehle (${cleanNumber(b)})² = ${cleanNumber(b*b)}; phir 4 × ${cleanNumber(a)} × ${cleanNumber(c)} = ${cleanNumber(4*a*c)}; ab ${cleanNumber(b*b)} − ${cleanNumber(4*a*c)} = ${cleanNumber(discriminant)}. D positive ho to do real roots, zero ho to ek repeated root, aur negative ho to real-number roots nahi hote.` },
  ];

  let answer = '';
  let check = '';
  if (discriminant > 1e-10) {
    const root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const root2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    answer = `x = ${cleanNumber(root1)} or x = ${cleanNumber(root2)}`;
    steps.push(
      { title: 'Use the quadratic formula', work: `x = (−b ± √D) / 2a`, why: 'Because D is positive, the square root gives two real values: one using plus and one using minus.', detail: `Ab a = ${cleanNumber(a)}, b = ${cleanNumber(b)} aur D = ${cleanNumber(discriminant)} formula mein rakhte hain. −b ka matlab b ke sign ko reverse karna hai. ± ka matlab do calculations karni hain: ek baar plus aur ek baar minus. Neeche denominator 2a = ${cleanNumber(2*a)} hoga.` },
      { title: 'Calculate both roots', work: `x₁ = ${cleanNumber(root1)}     x₂ = ${cleanNumber(root2)}`, why: 'Substitute the values of a, b and D into the formula, then simplify each result.', detail: `Plus wala case: x₁ = (${cleanNumber(-b)} + √${cleanNumber(discriminant)}) / ${cleanNumber(2*a)} = (${cleanNumber(-b)} + ${cleanNumber(Math.sqrt(discriminant))}) / ${cleanNumber(2*a)} = ${cleanNumber(root1)}. Minus wala case: x₂ = (${cleanNumber(-b)} − ${cleanNumber(Math.sqrt(discriminant))}) / ${cleanNumber(2*a)} = ${cleanNumber(root2)}. ± ki wajah se dono cases solve karna zaroori hai.` },
    );
    check = `Check in the original equation: x = ${cleanNumber(root1)} gives ${cleanNumber(a * root1 * root1 + b * root1 + c)}; x = ${cleanNumber(root2)} gives ${cleanNumber(a * root2 * root2 + b * root2 + c)}. Both are approximately 0.`;
  } else if (Math.abs(discriminant) <= 1e-10) {
    const root = -b / (2 * a);
    answer = `x = ${cleanNumber(root)} (repeated root)`;
    steps.push(
      { title: 'Use the quadratic formula', work: `x = (−b ± √0) / 2a = ${cleanNumber(root)}`, why: 'When D equals zero, plus and minus give the same result, so there is one repeated real root.', detail: `Discriminant D = 0 hai, is liye square root √0 = 0 hota hai. Formula mein plus 0 ya minus 0 dono same number dete hain. Is wajah se do alag answers ke bajaye ek repeated real root milta hai: x = ${cleanNumber(root)}.` },
    );
    check = `Substitution gives ${cleanNumber(a * root * root + b * root + c)}, which is 0 (up to rounding).`;
  } else {
    answer = 'No real solutions';
    steps.push(
      { title: 'Interpret the discriminant', work: `D = ${cleanNumber(discriminant)} < 0`, why: 'A negative number has no real square root, so the quadratic formula gives no real x-values.', detail: `Yahan discriminant D = ${cleanNumber(discriminant)} negative hai. Real numbers mein kisi negative number ka square root nahi hota. Is liye quadratic formula se koi real x-value nahi milti. Is result ka matlab no real solutions hai; complex numbers is preview ke scope mein nahi hain.` },
    );
    check = 'There are no real roots to substitute. Complex-number solutions are outside this quick solver’s current scope.';
  }

  return {
    kind: 'quadratic', answer, steps, check,
    concept: 'A quadratic equation contains x². The quadratic formula works even when the equation does not factor neatly.',
    formula: 'x = (−b ± √(b² − 4ac)) / 2a',
    practice: 'x² − 7x + 12 = 0', practiceAnswer: 'x = 3 or x = 4',
  };
}

const examples = [
  { label: 'Quadratic equation', question: 'x² - 5x + 6 = 0' },
  { label: 'Linear equation', question: '3x - 12 = 0' },
  { label: 'Percentage', question: 'Calculate 15% of 200' },
  { label: 'Arithmetic', question: 'Calculate 6 + 2 × 5' },
  { label: 'Mean / average', question: 'Find the mean of 2, 4, 6, 8' },
  { label: 'Geometry', question: 'Find the hypotenuse of a right triangle with legs 3 and 4' },
];

export function MathProblemFlowDemoView() {
  const [question, setQuestion] = useState('');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [imageUploadEnabled, setImageUploadEnabled] = useState(false);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [error, setError] = useState('');
  const [imageName, setImageName] = useState('');
  const [showPractice, setShowPractice] = useState(false);
  const [showConcept, setShowConcept] = useState(true);
  const [isSolving, setIsSolving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const result = useMemo(() => solution, [solution]);
  const parsedForExplanation = result && (result.kind === 'quadratic' || result.kind === 'linear') ? parsePolynomial(question) : null;
  const isQuadratic = result?.kind === 'quadratic';
  const isLinear = result?.kind === 'linear';
  const problemType = result?.problemType || (isQuadratic ? 'Quadratic equation (second-degree)' : isLinear ? 'Linear equation (first-degree)' : result?.kind === 'identity' ? 'Identity — infinitely many solutions' : result?.kind === 'none' ? 'Inconsistent equation — no solution' : 'Mathematics question');
  const methodName = result?.methodName || (isQuadratic ? 'Quadratic Formula Method' : isLinear ? 'Inverse Operations Method' : 'Simplify and Compare Both Sides');
  const methodReason = result?.methodReason || (isQuadratic ? 'The x² term makes this a second-degree equation. The quadratic formula works even when factoring is difficult.' : isLinear ? 'x is only to the first power. Undo addition or subtraction, then divide to leave x by itself.' : 'The variable terms cancel; the remaining statement tells us whether all values work or no value works.');

  useEffect(() => {
    let active = true;
    const refreshFlags = async () => {
      try {
        const response = await fetch('/api/math-ai-status', { cache: 'no-store' });
        const data = await response.json();
        if (!active) return;
        setAiEnabled(data?.success === true && data?.aiEnabled === true);
        setImageUploadEnabled(data?.success === true && data?.aiEnabled === true && data?.imageUploadEnabled === true);
        if (!(data?.success === true && data?.aiEnabled === true && data?.imageUploadEnabled === true)) {
          setImageName('');
          if (fileInput.current) fileInput.current.value = '';
        }
      } catch {
        if (!active) return;
        setAiEnabled(false);
        setImageUploadEnabled(false);
      }
    };
    void refreshFlags();
    const interval = window.setInterval(() => { void refreshFlags(); }, 15000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const solve = async () => {
    setError('');
    setShowPractice(false);
    setActiveStep(0);
    setIsSolving(true);
    try {
      const selectedFile = imageUploadEnabled ? fileInput.current?.files?.[0] : undefined;
      let image: { mimeType: string; data: string } | undefined;
      if (selectedFile) {
        if (!selectedFile.type.startsWith('image/') || selectedFile.size > 5 * 1024 * 1024) throw new Error('Please choose a supported image under 5 MB.');
        image = { mimeType: selectedFile.type, data: await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
          reader.onerror = () => reject(new Error('The image could not be read. Please select it again.'));
          reader.readAsDataURL(selectedFile);
        }) };
      }
      // Free-first hybrid: solve supported equations locally before making any AI request.
      // Image questions and unsupported equation types are sent to the optional free-tier service.
      const local = !image ? (solveMathProblem(question.trim()) || solveDeterministicMath(question.trim())) : null;
      if (local && !aiEnabled) {
        setSolution(local);
        return;
      }

      if (!aiEnabled) {
        setSolution(null);
        setError('AI solving is currently disabled by the site administrator. The built-in free engine handles supported questions; try a supported example or ask the administrator to enable AI.');
        return;
      }
      const response = await fetch('/api/math-solver', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), image }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload?.success && payload?.solution) {
        setSolution(payload.solution as Solution);
        return;
      }
      setSolution(null);
      setError(payload?.error || 'This question could not be solved reliably. Try rephrasing it or typing the question clearly.');
    } catch (e) {
      // Never silently guess. The local engine is a safe fallback for supported typed equations.
      const local = !fileInput.current?.files?.[0] ? (solveMathProblem(question.trim()) || solveDeterministicMath(question.trim())) : null;
      if (local) {
        setSolution(local);
      } else {
        setSolution(null);
        setError(e instanceof Error ? e.message : 'The advanced solver is temporarily unavailable. Supported equations can still be solved directly.');
      }
    } finally {
      setIsSolving(false);
    }
  };

  const reset = () => {
    setQuestion('');
    setSolution(null);
    setError('');
    setImageName('');
    if (fileInput.current) fileInput.current.value = '';
    setShowPractice(false);
    setActiveStep(0);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 pb-12">
      <SEOHelmet title="Math Problem Solver – Step-by-Step Explanations" description="Solve common maths problems free with step-by-step equations, percentages, arithmetic, statistics and geometry explanations." canonicalPath="/math-problem-solver" noindex={true} />
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-3 py-1.5 text-xs font-semibold text-[#6D28D9]">
          <GraduationCap className="h-4 w-4" /> Learn the method, not just the answer
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1E1035] sm:text-4xl">Math Problem Solver</h1>
        <p className="max-w-3xl text-sm leading-6 text-[#6D6582] sm:text-base">
          Enter a maths problem and learn the method, follow each working step, check the result, and practise a similar question. {imageUploadEnabled ? 'You can also upload a question image.' : ''}
        </p>
      </header>

      <section className="overflow-hidden rounded-3xl border border-[#EDE9FE] bg-white shadow-sm">
        <div className="border-b border-[#EDE9FE] bg-[#FCFBFF] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7C3AED]"><Sigma className="h-5 w-5" /></span>
            <div><h2 className="font-bold text-[#1E1035]">Enter your maths question</h2><p className="mt-0.5 text-xs text-[#6D6582]">Equations, percentages, arithmetic, statistics and selected geometry — with advanced topics supported when the free service is available</p></div>
          </div>
        </div>
        <div className="space-y-4 p-5 sm:p-7">
          <label htmlFor="math-question" className="block text-sm font-semibold text-[#1E1035]">Your maths question</label>
          <textarea id="math-question" value={question} onChange={e => { setQuestion(e.target.value); setError(''); }} rows={2} className="w-full resize-y rounded-2xl border border-[#DDD6FE] bg-white px-4 py-4 text-base text-[#1E1035] outline-none transition focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10" placeholder="e.g. Solve x² − 5x + 6 = 0, or explain the Pythagorean theorem" onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') solve(); }} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold text-[#6D6582]">Try an example:</span>
            {examples.map(example => <button key={example.label} type="button" onClick={() => { setQuestion(example.question); setError(''); setSolution(null); setImageName(''); if (fileInput.current) fileInput.current.value = ''; }} className="rounded-full border border-[#EDE9FE] bg-[#FAF9FE] px-3 py-1.5 text-xs font-medium text-[#6D6582] transition hover:border-[#C4B5FD] hover:text-[#6D28D9]">{example.label}</button>)}
          </div>
          <div className="flex flex-col gap-3 border-t border-[#EDE9FE] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {imageUploadEnabled && <><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { setImageName(e.target.files?.[0]?.name ?? ''); setError(''); setSolution(null); }} />
              <button type="button" onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-[#DDD6FE] px-4 py-2.5 text-sm font-semibold text-[#6D6582] transition hover:border-[#7C3AED] hover:text-[#7C3AED]"><Upload className="h-4 w-4" /> Upload question image</button></>}
              {imageName && <span className="inline-flex max-w-full items-center gap-1.5 text-xs text-[#6D6582]"><FileImage className="h-4 w-4 shrink-0" /><span className="max-w-[180px] truncate">{imageName}</span><button type="button" onClick={() => { setImageName(''); if (fileInput.current) fileInput.current.value = ''; }} aria-label="Remove image"><X className="h-3.5 w-3.5" /></button></span>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#EDE9FE] px-4 py-3 text-sm font-semibold text-[#6D6582] hover:bg-[#FAF9FE]"><RotateCcw className="h-4 w-4" /> Clear</button>
              <button type="button" onClick={solve} disabled={isSolving || (!question.trim() && !imageName)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-50"><Sparkles className="h-4 w-4" /> {isSolving ? "Working through your question…" : "Solve step by step"}</button>
            </div>
          </div>
          {imageName && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">Image selected. The question will be read from the image when you solve it.</p>}
          <p className="text-xs leading-5 text-[#9D95B3]">Tip: Press Ctrl + Enter to solve. You can use <span className="font-mono">x²</span> or <span className="font-mono">x^2</span>, and either a normal hyphen <span className="font-mono">-</span> or a textbook minus <span className="font-mono">−</span>.</p>
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">{error}</div>}
        </div>
      </section>

      {result && <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }} className="space-y-5">
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.35 }} className="overflow-hidden rounded-3xl border border-[#DDD6FE] bg-white">
          <div className="flex items-center gap-3 border-b border-[#EDE9FE] bg-[#F5F3FF] px-5 py-4 sm:px-7"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#7C3AED]"><CircleHelp className="h-5 w-5" /></span><div><h2 className="font-bold text-[#1E1035]">1. What kind of question is this?</h2><p className="mt-0.5 text-xs text-[#6D6582]">Pehle question ki pehchan karein</p></div></div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
            <div className="rounded-2xl border border-[#EDE9FE] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#7C3AED]">Question type</p><p className="mt-2 text-lg font-bold text-[#1E1035]">{problemType}</p><p className="mt-2 text-sm leading-6 text-[#6D6582]">{isQuadratic ? 'Is equation mein x² hai, is liye iski degree 2 hai.' : isLinear ? 'x ki highest power 1 hai, is liye yeh linear equation hai.' : result.kind === 'identity' || result.kind === 'none' ? 'Simplify karne par variables cancel ho gaye. Bachi hui statement solution batati hai.' : 'Question ke mathematical topic aur structure ko pehchan kar munasib solving method select kiya gaya hai.'}</p></div>
            <div className="rounded-2xl border border-[#EDE9FE] bg-[#FCFBFF] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#7C3AED]">Solving method</p><p className="mt-2 text-lg font-bold text-[#1E1035]">{methodName}</p><p className="mt-2 text-sm leading-6 text-[#6D6582]">{methodReason}</p></div>
            {parsedForExplanation && (isQuadratic || isLinear) && <div className="sm:col-span-2 rounded-2xl border border-[#EDE9FE] p-4"><p className="text-sm font-bold text-[#1E1035]">Values identified in your question</p><div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">{(isQuadratic ? [{ key: 'a', value: cleanNumber(parsedForExplanation.a), meaning: 'x² ka coefficient' }, { key: 'b', value: cleanNumber(parsedForExplanation.b), meaning: 'x ka coefficient' }, { key: 'c', value: cleanNumber(parsedForExplanation.c), meaning: 'constant number' }] : [{ key: 'b', value: cleanNumber(parsedForExplanation.b), meaning: 'x ka coefficient' }, { key: 'c', value: cleanNumber(parsedForExplanation.c), meaning: 'constant number' }, { key: 'degree', value: '1', meaning: 'x ki highest power' }]).map(item => <div key={item.key} className="rounded-xl bg-[#FAF9FE] px-3 py-3"><p className="font-mono text-lg font-bold text-[#6D28D9]">{item.key} = {item.value}</p><p className="mt-1 text-xs text-[#6D6582]">{item.meaning}</p></div>)}</div><p className="mt-3 text-xs leading-5 text-[#6D6582]">Coefficient woh number hai jo variable ke saath multiply hota hai. Minus sign ho to coefficient negative hota hai.</p></div>}
          </div>
        </motion.section>

        {result && <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12, duration: 0.35 }} className="rounded-3xl border border-[#DDD6FE] bg-white p-5 sm:p-7">
          <div className="mb-4 flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7C3AED]"><Sigma className="h-5 w-5" /></span><div><h2 className="text-lg font-bold text-[#1E1035]">2. Formula — applied to your question</h2><p className="mt-1 text-sm leading-6 text-[#6D6582]">Formula ke saath apni values rakh kar dekhein ke calculation kahan se aayi.</p></div></div>
          <div className="rounded-2xl bg-[#FAF9FE] p-4 sm:p-5"><p className="text-xs font-bold uppercase tracking-wide text-[#7C3AED]">Formula or core rule</p><p className="mt-2 overflow-x-auto font-mono text-base font-semibold leading-7 text-[#1E1035]">{result.formula}</p><p className="mt-2 text-sm leading-6 text-[#6D6582]">{result.concept}</p></div>
          {parsedForExplanation && (isQuadratic || isLinear) ? <div className="mt-4 rounded-2xl border border-[#EDE9FE] p-4 sm:p-5"><p className="text-xs font-bold uppercase tracking-wide text-[#7C3AED]">Substitute the values</p>{isQuadratic ? <div className="mt-3 space-y-3 font-mono text-sm leading-7 text-[#1E1035]"><p>x = (−({cleanNumber(parsedForExplanation.b)}) ± √[({cleanNumber(parsedForExplanation.b)})² − 4({cleanNumber(parsedForExplanation.a)})({cleanNumber(parsedForExplanation.c)})]) / [2({cleanNumber(parsedForExplanation.a)})]</p><p className="rounded-xl bg-[#F5F3FF] px-3 py-3 text-[#6D28D9]">Discriminant D = b² − 4ac = {cleanNumber(parsedForExplanation.b * parsedForExplanation.b - 4 * parsedForExplanation.a * parsedForExplanation.c)}</p></div> : <div className="mt-3 space-y-2 font-mono text-sm leading-7 text-[#1E1035]"><p>x = −c / b</p><p className="rounded-xl bg-[#F5F3FF] px-3 py-3 text-[#6D28D9]">x = −({cleanNumber(parsedForExplanation.c)}) / ({cleanNumber(parsedForExplanation.b)}) = {cleanNumber(-parsedForExplanation.c / parsedForExplanation.b)}</p></div>}<p className="mt-3 text-sm leading-6 text-[#6D6582]">{isQuadratic ? 'Pehle b ka square karein, phir 4 × a × c subtract karein. D ko discriminant kehte hain. Phir √D nikaal kar plus aur minus dono cases solve karte hain.' : 'Constant ko doosri side le jane par sign change hota hai. Phir x ke coefficient se divide karte hain, taake x akela reh jaye.'}</p></div> : <div className="mt-4 rounded-2xl border border-[#EDE9FE] p-4"><p className="text-sm leading-6 text-[#6D6582]">Is question ke liye har step mein formula/rule aur us ka istemal explain kiya gaya hai.</p></div>}
        </motion.section>}

        <section className="overflow-hidden rounded-3xl border border-[#DDD6FE] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE9FE] bg-[#FAF9FE] px-5 py-4 sm:px-7">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1E1035]"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Solution overview</div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Worked solution</span>
          </div>
          <div className="grid gap-5 p-5 sm:p-7 md:grid-cols-[1.1fr_0.9fr]">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-[#6D6582]">Final answer</p><p className="mt-2 break-words text-2xl font-bold text-[#6D28D9] sm:text-3xl">{result.answer}</p><p className="mt-3 text-sm leading-6 text-[#6D6582]">Read the steps below to see how the method leads to this result.</p></div>
            <div className="rounded-2xl border border-[#EDE9FE] bg-[#FCFBFF] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#6D6582]">Key formula</p><p className="mt-2 font-mono text-sm leading-6 text-[#1E1035]">{result.formula}</p><p className="mt-2 text-xs leading-5 text-[#6D6582]">{result.concept}</p></div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#EDE9FE] bg-white p-5 sm:p-7">
          <div className="mb-5 flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7C3AED]"><BookOpen className="h-5 w-5" /></span><div><h2 className="text-lg font-bold text-[#1E1035]">Step-by-step working</h2><p className="mt-1 text-sm text-[#6D6582]">Follow each step in order. The “why” explains the rule behind it.</p></div></div>
          <div className="mb-5 space-y-3">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#6D6582]">
              <span>Step {Math.min(activeStep + 1, result.steps.length)} of {result.steps.length}</span>
              <span>{Math.round(((Math.min(activeStep + 1, result.steps.length)) / result.steps.length) * 100)}% complete</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#EDE9FE]" role="progressbar" aria-valuemin={0} aria-valuemax={result.steps.length} aria-valuenow={Math.min(activeStep + 1, result.steps.length)} aria-label="Solution progress">
              <motion.div className="h-full rounded-full bg-[#7C3AED]" initial={false} animate={{ width: `${((Math.min(activeStep + 1, result.steps.length)) / result.steps.length) * 100}%` }} transition={{ duration: 0.35 }} />
            </div>
          </div>
          {(() => {
            const step = result.steps[Math.min(activeStep, result.steps.length - 1)];
            const index = Math.min(activeStep, result.steps.length - 1);
            return <motion.div key={`${step.title}-${index}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: "easeOut" }} className="rounded-2xl border border-[#DDD6FE] bg-white p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F3FF] text-base font-bold text-[#6D28D9]">{index + 1}</motion.span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#7C3AED]">Step {index + 1}</p>
                  <h3 className="mt-1 text-lg font-bold text-[#1E1035]">{step.title}</h3>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto rounded-xl bg-[#FAF9FE] px-4 py-4 font-mono text-sm leading-7 text-[#6D28D9] sm:text-base">{step.work}</div>
              <div className="mt-4 rounded-xl border border-[#EDE9FE] p-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#1E1035]"><CircleHelp className="h-4 w-4 text-[#7C3AED]" /> What are we doing in this step?</p>
                <p className="mt-2 text-sm leading-7 text-[#6D6582]">{step.detail || step.why}</p>
              </div>
              <div className="mt-3 rounded-xl border border-[#EDE9FE] bg-[#FCFBFF] p-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#7C3AED]"><Lightbulb className="h-4 w-4" /> Why this step matters</p>
                <p className="mt-2 text-sm leading-7 text-[#6D6582]">{step.why}</p>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#EDE9FE] pt-4">
                <button type="button" onClick={() => setActiveStep(value => Math.max(0, value - 1))} disabled={activeStep === 0} className="rounded-xl border border-[#DDD6FE] px-4 py-2.5 text-sm font-semibold text-[#6D28D9] transition hover:bg-[#F5F3FF] disabled:cursor-not-allowed disabled:opacity-40">Previous step</button>
                <span className="text-xs text-[#9D95B3]">Take your time — understand before moving on.</span>
                <button type="button" onClick={() => setActiveStep(value => Math.min(result.steps.length - 1, value + 1))} disabled={activeStep >= result.steps.length - 1} className="rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-40">{activeStep >= result.steps.length - 1 ? 'Last step' : 'Next step'}</button>
              </div>
            </motion.div>;
          })()}
        </section>

        <section className="rounded-3xl border border-emerald-200 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></span><div><h2 className="font-bold text-[#1E1035]">Check your answer</h2><p className="mt-2 text-sm leading-6 text-[#6D6582]">{result.check}</p></div></div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#EDE9FE] bg-white">
          <button type="button" onClick={() => setShowConcept(v => !v)} className="flex w-full items-center justify-between gap-3 p-5 text-left sm:px-7"><span className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7C3AED]"><Lightbulb className="h-5 w-5" /></span><span><span className="block font-bold text-[#1E1035]">Understand the concept</span><span className="mt-1 block text-xs text-[#6D6582]">A plain-language summary of the method</span></span></span>{showConcept ? <ChevronDown className="h-5 w-5 text-[#6D6582]" /> : <ChevronRight className="h-5 w-5 text-[#6D6582]" />}</button>
          {showConcept && <div className="border-t border-[#EDE9FE] px-5 py-5 sm:px-7"><p className="text-sm leading-7 text-[#6D6582]">{result.concept}</p><div className="mt-4 rounded-2xl bg-[#FAF9FE] p-4"><p className="flex items-center gap-2 text-sm font-bold text-[#1E1035]"><CircleHelp className="h-4 w-4 text-[#7C3AED]" /> Remember</p><p className="mt-2 text-sm leading-6 text-[#6D6582]">Whatever operation you apply to one side of an equation, apply it consistently to keep the equality balanced.</p></div></div>}
        </section>

        <section className="rounded-3xl border border-[#DDD6FE] bg-[#FCFBFF] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#7C3AED]"><GraduationCap className="h-4 w-4" /> Keep learning</p><h2 className="mt-2 text-lg font-bold text-[#1E1035]">Try a similar question</h2><p className="mt-1 text-sm text-[#6D6582]">Give it a go before revealing the answer.</p></div><button type="button" onClick={() => setShowPractice(v => !v)} className="rounded-xl border border-[#DDD6FE] bg-white px-4 py-2.5 text-sm font-semibold text-[#6D28D9] hover:bg-[#F5F3FF]">{showPractice ? 'Hide answer' : 'Show answer'}</button></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EDE9FE] bg-white p-4"><p className="font-mono text-base text-[#1E1035]">{result.practice}</p>{showPractice && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{result.practiceAnswer}</p>}</div>
        </section>
      </motion.div>}

      {!result && !error && <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#EDE9FE] bg-white p-4"><BookOpen className="h-5 w-5 text-[#7C3AED]" /><h3 className="mt-3 text-sm font-bold text-[#1E1035]">Learn every step</h3><p className="mt-1 text-xs leading-5 text-[#6D6582]">Each calculation comes with a simple explanation of why it works.</p></div>
        <div className="rounded-2xl border border-[#EDE9FE] bg-white p-4"><ShieldCheck className="h-5 w-5 text-[#7C3AED]" /><h3 className="mt-3 text-sm font-bold text-[#1E1035]">Check the result</h3><p className="mt-1 text-xs leading-5 text-[#6D6582]">Substitute the answer back into the equation when possible.</p></div>
        <div className="rounded-2xl border border-[#EDE9FE] bg-white p-4"><Lightbulb className="h-5 w-5 text-[#7C3AED]" /><h3 className="mt-3 text-sm font-bold text-[#1E1035]">Practise the concept</h3><p className="mt-1 text-xs leading-5 text-[#6D6582]">Use a related question to test your understanding.</p></div>
      </section>}

      <p className="text-center text-xs leading-5 text-[#9D95B3]">Solutions include a worked method and answer check when available. If a question is unclear or unsupported, the solver will ask for clarification rather than guess. {aiEnabled ? 'Advanced explanations are enabled.' : 'Free built-in solving mode is active.'}</p>
    </div>
  );
}
