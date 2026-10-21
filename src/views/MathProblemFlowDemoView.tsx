import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, BrainCircuit, CheckCircle2, CircleDot, FileImage, GitBranch, Play, RotateCcw, Sigma, Sparkles, Workflow } from 'lucide-react';
import { SEOHelmet } from '../components/SEOHelmet';

const steps = [
  { title: 'Question received', detail: 'Read the typed problem', icon: FileImage },
  { title: 'AI understanding', detail: 'Identify the equation and goal', icon: BrainCircuit },
  { title: 'Math engine', detail: 'Solve with deterministic rules', icon: Sigma },
  { title: 'Step builder', detail: 'Explain each transformation', icon: GitBranch },
  { title: 'Answer verification', detail: 'Substitute roots into equation', icon: CheckCircle2 },
  { title: 'Final answer', detail: 'Show result and explanation', icon: Sparkles },
];

type NodeCardProps = { index: number; title: string; detail: string; icon: typeof FileImage; status: 'idle' | 'active' | 'done'; children?: React.ReactNode };

function NodeCard({ index, title, detail, icon: Icon, status, children }: NodeCardProps) {
  return <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.25 }} className={`relative z-10 w-[220px] rounded-2xl border bg-white p-4 shadow-sm transition-colors ${status === 'active' ? 'border-[#7C3AED] ring-4 ring-[#7C3AED]/10' : status === 'done' ? 'border-[#C4B5FD] bg-[#FAF9FE]' : 'border-[#EDE9FE]'}`}>
    <div className="mb-3 flex items-center justify-between">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7C3AED]"><Icon className="h-5 w-5" /></span>
      <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${status === 'done' ? 'bg-emerald-50 text-emerald-700' : status === 'active' ? 'bg-[#F5F3FF] text-[#7C3AED]' : 'bg-[#FAF9FE] text-[#9D95B3]'}`}>{status === 'done' ? 'Complete' : status === 'active' ? 'Running' : `Node ${index + 1}`}</span>
    </div>
    <h3 className="text-sm font-bold text-[#1E1035]">{title}</h3>
    <p className="mt-1 text-xs leading-5 text-[#6D6582]">{detail}</p>
    {children}
  </motion.div>;
}

export function MathProblemFlowDemoView() {
  const [question, setQuestion] = useState('Solve x² − 5x + 6 = 0');
  const [stage, setStage] = useState(-1);
  const [running, setRunning] = useState(false);
  const [imageName, setImageName] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const runFlow = async () => {
    if (running || !question.trim()) return;
    setRunning(true);
    setShowDetails(false);
    setStage(0);
    for (let i = 1; i < steps.length; i++) {
      await new Promise(resolve => window.setTimeout(resolve, 650));
      setStage(i);
    }
    setRunning(false);
    setShowDetails(true);
  };

  const reset = () => {
    setStage(-1);
    setRunning(false);
    setShowDetails(false);
  };

  const status = (index: number): 'idle' | 'active' | 'done' => stage > index ? 'done' : stage === index ? 'active' : 'idle';
  const edge = (from: number, to: number) => stage >= from && stage >= to;

  return <div className="space-y-6 pb-10">
    <SEOHelmet title="Math Problem-Solving Flow Demo" description="Preview a visual math workflow with branching arrows, AI understanding, deterministic calculations and verified steps." canonicalPath="/math-problem-flow-demo" noindex={true} />
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#EDE9FE] pb-5">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-3 py-1 text-xs font-semibold text-[#7C3AED]"><Workflow className="h-4 w-4" /> Experimental visual workflow</div>
        <h1 className="text-2xl font-bold text-[#1E1035] sm:text-3xl">Math Problem Solver — Flow Demo</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6D6582]">A sample of the intended interface: trigger arrows, branching dotted connectors, AI interpretation, a verified calculation path, and one final answer.</p>
      </div>
      <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-[#EDE9FE] bg-white px-3 py-2 text-sm font-semibold text-[#6D6582] hover:text-[#7C3AED]"><RotateCcw className="h-4 w-4" /> Reset flow</button>
    </header>

    <section className="rounded-2xl border border-[#EDE9FE] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-bold text-[#1E1035]">1. Trigger the workflow</h2><p className="mt-1 text-xs text-[#6D6582]">Edit the sample question or select an image to preview the input state.</p></div>
        <span className="rounded-full border border-[#EDE9FE] bg-[#FAF9FE] px-3 py-1 text-xs text-[#6D6582]">{stage < 0 ? 'Ready to run' : stage >= 5 ? 'Flow complete' : `Stage ${stage + 1} of 6`}</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="block text-sm font-semibold text-[#1E1035]">Math problem
          <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={2} disabled={running} className="mt-1.5 w-full resize-y rounded-xl border border-[#DDD6FE] bg-[#FAF9FE] px-3 py-3 font-normal outline-none focus:border-[#7C3AED] disabled:opacity-60" placeholder="Enter a math question..." />
        </label>
        <div className="flex flex-col justify-end gap-2 sm:flex-row md:flex-col">
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#DDD6FE] px-4 py-3 text-sm font-semibold text-[#6D6582] hover:border-[#7C3AED] hover:text-[#7C3AED]"><FileImage className="h-4 w-4" /> Upload image<input type="file" accept="image/*" className="hidden" disabled={running} onChange={e => setImageName(e.target.files?.[0]?.name ?? '')} /></label>
          <button onClick={runFlow} disabled={running || !question.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-3 text-sm font-bold text-white hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-50"><Play className="h-4 w-4" /> {running ? 'Running flow…' : 'Trigger flow'}</button>
        </div>
      </div>
      {imageName && <p className="mt-2 text-xs text-[#6D6582]">Selected image: <span className="font-semibold text-[#1E1035]">{imageName}</span> <span className="text-[#9D95B3]">· Upload is visual-only in this demo; image understanding is not connected yet.</span></p>}
    </section>

    <section className="overflow-hidden rounded-2xl border border-[#EDE9FE] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE9FE] px-4 py-4 sm:px-5">
        <div><h2 className="font-bold text-[#1E1035]">2. Live solving graph</h2><p className="mt-1 text-xs text-[#6D6582]">Dotted arrows show the direction and dependencies between steps.</p></div>
        <div className="flex items-center gap-2 text-xs text-[#6D6582]"><span className="h-2.5 w-2.5 rounded-full bg-[#7C3AED]" /> Active path <span className="ml-2 h-0 w-6 border-t-2 border-dashed border-[#A78BFA]" /> Dotted connector</div>
      </div>
      <div className="overflow-x-auto bg-[#FCFBFF] p-4 sm:p-6">
        <div className="relative mx-auto h-[650px] min-w-[1000px] max-w-[1120px]">
          <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible" viewBox="0 0 1120 650" fill="none" aria-label="Dotted arrows connecting math solving steps">
            <defs><marker id="flow-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#A78BFA" /></marker><marker id="flow-arrow-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#7C3AED" /></marker></defs>
            {[
              { d:'M220 315 C250 315 250 145 285 145', active:edge(0,1) },
              { d:'M220 330 C250 330 250 470 285 470', active:edge(0,2) },
              { d:'M505 145 C540 145 530 145 565 145', active:edge(1,3) },
              { d:'M505 470 C540 470 530 470 565 470', active:edge(2,3) },
              { d:'M785 145 C825 145 810 315 850 315', active:edge(3,4) },
              { d:'M785 470 C825 470 810 335 850 335', active:edge(3,4) },
              { d:'M960 390 C960 430 960 445 960 470', active:edge(4,5) },
            ].map((path, i) => <motion.path key={i} d={path.d} stroke={path.active ? '#7C3AED' : '#C4B5FD'} strokeWidth={path.active ? 2.5 : 1.8} strokeDasharray="5 7" strokeLinecap="round" markerEnd={path.active ? 'url(#flow-arrow-active)' : 'url(#flow-arrow)'} initial={false} animate={{ opacity: stage < 0 ? 0.5 : path.active ? 1 : 0.65 }} />)}
          </svg>

          <div className="absolute left-0 top-[245px]"><NodeCard index={0} title="Question trigger" detail="Input question enters the flow" icon={CircleDot} status={status(0)}><p className="mt-3 rounded-lg bg-[#F5F3FF] p-2 text-xs font-medium text-[#7C3AED]">"{question.length > 30 ? question.slice(0, 30) + '…' : question}"</p></NodeCard></div>
          <div className="absolute left-[285px] top-[75px]"><NodeCard index={1} title="AI understanding" detail="Interpret the question and select a solving strategy" icon={BrainCircuit} status={status(1)}><p className="mt-3 text-[11px] leading-4 text-[#6D6582]">Sample output: quadratic equation · solve for x</p></NodeCard></div>
          <div className="absolute left-[285px] top-[400px]"><NodeCard index={2} title="Verified math engine" detail="Apply deterministic algebra rules" icon={Sigma} status={status(2)}><p className="mt-3 rounded-lg bg-[#FAF9FE] p-2 font-mono text-xs text-[#7C3AED]">x² − 5x + 6 = 0</p></NodeCard></div>
          <div className="absolute left-[565px] top-[75px]"><NodeCard index={3} title="Step-by-step builder" detail="Create readable transformations and explanations" icon={GitBranch} status={status(3)}><p className="mt-3 font-mono text-xs leading-5 text-[#6D6582]">x² − 5x + 6<br />(x − 2)(x − 3)</p></NodeCard></div>
          <div className="absolute left-[565px] top-[400px]"><NodeCard index={3} title="Independent verification" detail="Substitute each root back into the original equation" icon={CheckCircle2} status={status(4)}><p className="mt-3 text-xs leading-5 text-[#6D6582]">x = 2 → 4 − 10 + 6 = 0<br />x = 3 → 9 − 15 + 6 = 0</p></NodeCard></div>
          <div className="absolute left-[850px] top-[245px]"><NodeCard index={5} title="Final answer" detail="Combine verified solution and explanation" icon={Sparkles} status={status(5)}><p className="mt-3 rounded-lg bg-[#F5F3FF] p-2 text-center font-mono text-sm font-bold text-[#7C3AED]">x = 2 or x = 3</p></NodeCard></div>
          <div className="absolute left-[290px] top-[5px] text-[10px] font-semibold uppercase tracking-wider text-[#9D95B3]">AI path</div>
          <div className="absolute left-[290px] top-[620px] text-[10px] font-semibold uppercase tracking-wider text-[#9D95B3]">Calculation + verification path</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EDE9FE] bg-white px-4 py-3 sm:px-5">
        <p className="text-xs text-[#6D6582]">This is a UI/flow prototype. The AI branch is simulated; the displayed algebra example is prewritten.</p>
        <button onClick={() => { setQuestion('Solve x² − 5x + 6 = 0'); setImageName(''); reset(); }} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#6D6582] hover:bg-[#FAF9FE]"><RotateCcw className="h-3.5 w-3.5" /> Restore sample</button>
      </div>
    </section>

    <AnimatePresence>{showDetails && <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-4 lg:grid-cols-3">
      <article className="rounded-2xl border border-[#EDE9FE] bg-white p-5"><div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1E1035]"><BrainCircuit className="h-4 w-4 text-[#7C3AED]" /> AI interpretation (sample)</div><p className="text-sm leading-6 text-[#6D6582]">The input is interpreted as a quadratic equation equal to zero. The goal is to find all values of x that satisfy the equation.</p></article>
      <article className="rounded-2xl border border-[#EDE9FE] bg-white p-5"><div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1E1035]"><Sigma className="h-4 w-4 text-[#7C3AED]" /> Deterministic solution</div><div className="space-y-2 font-mono text-sm text-[#6D6582]"><p>x² − 5x + 6 = 0</p><p>(x − 2)(x − 3) = 0</p><p>x − 2 = 0 or x − 3 = 0</p><p className="font-bold text-[#7C3AED]">x = 2 or x = 3</p></div></article>
      <article className="rounded-2xl border border-[#DDD6FE] bg-[#FAF9FE] p-5"><div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1E1035]"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Verified result</div><p className="text-sm leading-6 text-[#6D6582]">Both roots return zero when substituted into the original equation, so the sample answer is verified.</p></article>
    </motion.section>}</AnimatePresence>
  </div>;
}
