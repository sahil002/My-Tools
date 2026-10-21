import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowDown, ArrowRight, BookOpen, Check, CheckCircle2, CircleHelp,
  ClipboardList, Download, FileChartColumn, GitBranch, GraduationCap,
  RotateCcw, Sparkles, Target, TriangleAlert, Workflow, Zap
} from 'lucide-react';
import { SEOHelmet } from '../components/SEOHelmet';

type NodeStatus = 'pending' | 'running' | 'complete' | 'error';

const PURPLE = '#7C3AED';
const steps = [
  { id: 'validate', title: 'Validate inputs', subtitle: 'Check grades, weights and target', icon: ClipboardList },
  { id: 'current', title: 'Calculate current standing', subtitle: 'Compute weighted coursework grade', icon: Zap },
  { id: 'scenarios', title: 'Explore exam scenarios', subtitle: 'Compare five possible exam scores', icon: GitBranch },
  { id: 'target', title: 'Check target feasibility', subtitle: 'Find the exam score required', icon: Target },
  { id: 'report', title: 'Build student report', subtitle: 'Assemble charts and recommendations', icon: FileChartColumn },
];

function statusLabel(status: NodeStatus) {
  if (status === 'complete') return 'Complete';
  if (status === 'running') return 'Processing';
  if (status === 'error') return 'Needs attention';
  return 'Waiting';
}

export function FinalExamGradePlannerView() {
  const [coursework, setCoursework] = useState(84);
  const [finalWeight, setFinalWeight] = useState(30);
  const [target, setTarget] = useState(90);
  const [courseName, setCourseName] = useState('Biology 101');
  const [statuses, setStatuses] = useState<Record<string, NodeStatus>>({});
  const [activeStep, setActiveStep] = useState(-1);
  const [hasRun, setHasRun] = useState(false);
  const [selectedStep, setSelectedStep] = useState('validate');
  const [isRunning, setIsRunning] = useState(false);

  const result = useMemo(() => {
    const w = finalWeight / 100;
    const required = w > 0 ? (target - coursework * (1 - w)) / w : Number.POSITIVE_INFINITY;
    const scores = [60, 70, 80, 90, 100].map((exam) => ({
      exam,
      finalGrade: coursework * (1 - w) + exam * w,
    }));
    return {
      required,
      currentContribution: coursework * (1 - w),
      scores,
      achievable: required <= 100 && required >= 0,
      targetImpossible: required > 100,
      targetAlreadyMet: required < 0,
    };
  }, [coursework, finalWeight, target]);

  const runWorkflow = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setHasRun(true);
    setActiveStep(-1);
    setStatuses({});
    for (let i = 0; i < steps.length; i += 1) {
      setActiveStep(i);
      setSelectedStep(steps[i].id);
      setStatuses((prev) => ({ ...prev, [steps[i].id]: 'running' }));
      // Brief, truthful visual transition: the calculation is local and does not call an AI service.
      await new Promise((resolve) => window.setTimeout(resolve, 420));
      if (i === 0 && (finalWeight <= 0 || finalWeight > 100 || coursework < 0 || coursework > 100 || target < 0 || target > 100)) {
        setStatuses((prev) => ({ ...prev, [steps[i].id]: 'error' }));
        setIsRunning(false);
        return;
      }
      setStatuses((prev) => ({ ...prev, [steps[i].id]: 'complete' }));
    }
    setIsRunning(false);
    setActiveStep(steps.length);
    setSelectedStep('report');
  };

  const resetWorkflow = () => {
    setStatuses({});
    setActiveStep(-1);
    setHasRun(false);
    setSelectedStep('validate');
  };

  const downloadReport = () => {
    const rows = [
      ['Final Exam & Weighted Grade Scenario Planner'],
      ['Course', courseName],
      ['Current coursework average', `${coursework}%`],
      ['Final exam weight', `${finalWeight}%`],
      ['Target course grade', `${target}%`],
      ['Required exam score', Number.isFinite(result.required) ? `${result.required.toFixed(2)}%` : 'Not calculable'],
      [],
      ['Exam score', 'Projected final grade'],
      ...result.scores.map((s) => [`${s.exam}%`, `${s.finalGrade.toFixed(2)}%`]),
      [],
      ['Note', 'Projection assumes the current coursework average applies to the non-final portion of the course. Confirm your syllabus weighting.'],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'final-exam-grade-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const active = steps.find((step) => step.id === selectedStep);
  const completedCount = Object.values(statuses).filter((status) => status === 'complete').length;
  const progress = hasRun ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div className="space-y-7 pb-10">
      <SEOHelmet
        title="Final Exam & Weighted Grade Scenario Planner"
        description="Explore final exam grade scenarios, calculate the score needed for your target, and understand every step in an interactive learning workflow."
        canonicalPath="/final-exam-grade-planner"
      />
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#EDE9FE] pb-5">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-3 py-1 text-xs font-semibold text-[#7C3AED]">
            <Workflow className="h-3.5 w-3.5" /> Interactive learning workflow
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E1035] sm:text-3xl">Final Exam &amp; Weighted Grade Planner</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6D6582]">See how your coursework, exam weight and target grade connect. Run the workflow to reveal each calculation step, compare outcomes and generate a report.</p>
        </div>
        <button onClick={resetWorkflow} className="inline-flex items-center gap-2 rounded-xl border border-[#EDE9FE] bg-white px-3 py-2 text-sm font-semibold text-[#6D6582] transition hover:border-[#DDD6FE] hover:text-[#7C3AED]">
          <RotateCcw className="h-4 w-4" /> Reset workflow
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-[#EDE9FE] bg-white p-5 shadow-[0_2px_12px_rgba(124,58,237,0.04)]">
          <div className="mb-4 flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7C3AED]"><GraduationCap className="h-5 w-5" /></div><div><h2 className="font-bold text-[#1E1035]">Your course</h2><p className="text-xs text-[#6D6582]">Adjust inputs to model your grade</p></div></div>
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-[#1E1035]">Course name<input value={courseName} onChange={(e) => setCourseName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#DDD6FE] bg-[#FAF9FE] px-3 py-2.5 font-normal outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15" placeholder="e.g. Biology 101" /></label>
            <label className="block text-sm font-semibold text-[#1E1035]">Current coursework average <span className="float-right text-[#7C3AED]">{coursework}%</span><input aria-label="Current coursework average" type="range" min="0" max="100" value={coursework} onChange={(e) => setCoursework(Number(e.target.value))} className="mt-3 w-full accent-[#7C3AED]" /><span className="flex justify-between text-xs font-normal text-[#9D95B3]"><span>0%</span><span>100%</span></span></label>
            <label className="block text-sm font-semibold text-[#1E1035]">Final exam weight <span className="float-right text-[#7C3AED]">{finalWeight}%</span><input aria-label="Final exam weight" type="range" min="1" max="100" value={finalWeight} onChange={(e) => setFinalWeight(Number(e.target.value))} className="mt-3 w-full accent-[#7C3AED]" /><span className="flex justify-between text-xs font-normal text-[#9D95B3]"><span>1%</span><span>100%</span></span></label>
            <label className="block text-sm font-semibold text-[#1E1035]">Target course grade <span className="float-right text-[#7C3AED]">{target}%</span><input aria-label="Target course grade" type="range" min="0" max="100" value={target} onChange={(e) => setTarget(Number(e.target.value))} className="mt-3 w-full accent-[#7C3AED]" /><span className="flex justify-between text-xs font-normal text-[#9D95B3]"><span>0%</span><span>100%</span></span></label>
            <button onClick={runWorkflow} disabled={isRunning} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#6D28D9] disabled:cursor-wait disabled:opacity-70">
              {isRunning ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Running workflow…</> : <><Zap className="h-4 w-4" /> Run Analysis <ArrowRight className="h-4 w-4" /></>}
            </button>
            <button onClick={() => { setCoursework(84); setFinalWeight(30); setTarget(90); setCourseName('Biology 101'); resetWorkflow(); }} className="w-full rounded-xl px-3 py-2 text-sm font-semibold text-[#7C3AED] transition hover:bg-[#F5F3FF]">Load sample scenario</button>
            <p className="text-xs leading-5 text-[#9D95B3]">Runs locally in your browser. No AI API is called in this first workflow prototype.</p>
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="rounded-2xl border border-[#EDE9FE] bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-[#1E1035]">Workflow canvas</h2><p className="mt-1 text-xs text-[#6D6582]">Inputs flow through each verified calculation step.</p></div><span className="rounded-full border border-[#EDE9FE] bg-[#FAF9FE] px-3 py-1 text-xs font-semibold text-[#6D6582]">{hasRun ? `${completedCount} / ${steps.length} steps complete` : 'Ready to run'}</span></div>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#F5F3FF]"><motion.div className="h-full rounded-full bg-[#7C3AED]" animate={{ width: `${progress}%` }} transition={{ duration: 0.35 }} /></div>
            <div className="grid gap-2 sm:grid-cols-5">
              {steps.map((step, index) => {
                const status = statuses[step.id] || 'pending';
                const Icon = step.icon;
                const isActive = activeStep === index && isRunning;
                return <div key={step.id} className="flex min-w-0 flex-col items-center">
                  <button type="button" onClick={() => setSelectedStep(step.id)} className={`group relative flex min-h-[124px] w-full flex-col items-center justify-center rounded-xl border p-3 text-center transition ${selectedStep === step.id ? 'border-[#7C3AED] bg-[#F5F3FF] ring-2 ring-[#7C3AED]/10' : 'border-[#EDE9FE] bg-white hover:border-[#DDD6FE]'}`} aria-pressed={selectedStep === step.id}>
                    {isActive && <motion.span className="absolute inset-0 rounded-xl border-2 border-[#7C3AED]" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} />}
                    <span className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${status === 'complete' ? 'bg-[#F5F3FF] text-[#7C3AED]' : status === 'error' ? 'bg-red-50 text-red-600' : 'bg-[#FAF9FE] text-[#7C3AED]'}`}>{status === 'complete' ? <CheckCircle2 className="h-5 w-5" /> : isActive ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#DDD6FE] border-t-[#7C3AED]" /> : <Icon className="h-5 w-5" />}</span>
                    <span className="text-xs font-bold text-[#1E1035]">{index + 1}. {step.title}</span>
                    <span className="mt-1 text-[11px] text-[#6D6582]">{statusLabel(status)}</span>
                  </button>
                  {index < steps.length - 1 && <div className="flex h-7 items-center justify-center text-[#7C3AED] sm:hidden"><ArrowDown className="h-4 w-4" /></div>}
                  {index < steps.length - 1 && <div className="hidden h-7 items-center justify-center text-[#7C3AED] sm:flex"><ArrowRight className="h-4 w-4" /></div>}
                </div>;
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#EDE9FE] pt-3 text-xs text-[#6D6582]"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#7C3AED]" /> Active / completed</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#DDD6FE]" /> Waiting</span><span className="ml-auto inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[#7C3AED]" /> Calculation steps, not simulated AI thinking</span></div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={selectedStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.18 }} className="rounded-2xl border border-[#EDE9FE] bg-white p-5">
              <div className="mb-4 flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7C3AED]">{active ? <active.icon className="h-5 w-5" /> : <CircleHelp className="h-5 w-5" />}</div><div><h2 className="font-bold text-[#1E1035]">{active?.title || 'Workflow overview'}</h2><p className="mt-1 text-sm text-[#6D6582]">{active?.subtitle || 'Select a node to inspect its output.'}</p></div></div>
              {!hasRun && <div className="rounded-xl border border-dashed border-[#DDD6FE] bg-[#FAF9FE] p-4 text-sm leading-6 text-[#6D6582]">Set your course values and select <strong className="text-[#1E1035]">Run Analysis</strong>. Each node will activate in sequence and reveal the result from the grade calculation engine.</div>}
              {hasRun && selectedStep === 'validate' && <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[#FAF9FE] p-4"><p className="text-xs text-[#6D6582]">Input check</p><p className="mt-1 font-semibold text-[#1E1035]">{statuses.validate === 'error' ? 'Review your values' : statuses.validate === 'complete' ? 'All values within range' : 'Checking…'}</p></div><div className="rounded-xl bg-[#FAF9FE] p-4"><p className="text-xs text-[#6D6582]">Course</p><p className="mt-1 font-semibold text-[#1E1035]">{courseName || 'Unnamed course'}</p></div></div>}
              {hasRun && selectedStep === 'current' && <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[#FAF9FE] p-4"><p className="text-xs text-[#6D6582]">Coursework average</p><p className="mt-1 text-2xl font-bold text-[#7C3AED]">{coursework.toFixed(1)}%</p></div><div className="rounded-xl bg-[#FAF9FE] p-4"><p className="text-xs text-[#6D6582]">Contribution to final grade</p><p className="mt-1 text-2xl font-bold text-[#1E1035]">{result.currentContribution.toFixed(2)} pts</p><p className="text-xs text-[#6D6582]">From the {100 - finalWeight}% non-exam portion</p></div></div>}
              {hasRun && selectedStep === 'scenarios' && <div className="space-y-4"><div className="flex h-36 items-end gap-3 rounded-xl bg-[#FAF9FE] p-4">{result.scores.map((s) => <div key={s.exam} className="flex h-full flex-1 flex-col items-center justify-end gap-1"><motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(2, Math.min(100, s.finalGrade))}%` }} transition={{ duration: 0.45, delay: s.exam / 100 * 0.12 }} className="w-full max-w-12 rounded-t-md bg-[#7C3AED]" /><span className="text-[10px] font-semibold text-[#6D6582]">{s.exam}%</span></div>)}</div><div className="overflow-x-auto rounded-xl border border-[#EDE9FE]"><table className="w-full text-left text-sm"><thead className="bg-[#FAF9FE] text-xs text-[#6D6582]"><tr><th className="px-3 py-2.5">Exam score</th><th className="px-3 py-2.5">Projected course grade</th><th className="px-3 py-2.5">Target status</th></tr></thead><tbody>{result.scores.map((s) => <tr key={s.exam} className="border-t border-[#EDE9FE]"><td className="px-3 py-2.5 font-semibold text-[#1E1035]">{s.exam}%</td><td className="px-3 py-2.5 text-[#1E1035]">{s.finalGrade.toFixed(2)}%</td><td className="px-3 py-2.5">{s.finalGrade >= target ? <span className="font-semibold text-[#7C3AED]">Target met</span> : <span className="text-[#6D6582]">Below target</span>}</td></tr>)}</tbody></table></div></div>}
              {hasRun && selectedStep === 'target' && <div className="space-y-3"><div className="rounded-xl bg-[#F5F3FF] p-4"><p className="text-sm font-semibold text-[#6D6582]">Exam score needed to reach {target}% overall</p><p className="mt-1 text-3xl font-bold text-[#7C3AED]">{result.targetAlreadyMet ? '0%+ (target already secured)' : Number.isFinite(result.required) ? `${result.required.toFixed(2)}%` : 'Not calculable'}</p><p className="mt-2 text-sm leading-6 text-[#6D6582]">{result.targetImpossible ? 'This target requires more than 100% on the final under the entered weights. Consider a different target or verify the syllabus weights.' : result.targetAlreadyMet ? 'Your current coursework contribution already meets the target threshold under this model.' : 'This is the required final exam score assuming the coursework average applies to the full non-exam portion.'}</p></div>{result.targetImpossible && <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><TriangleAlert className="h-5 w-5 shrink-0" />The target is mathematically out of reach with the current inputs.</div>}</div>}
              {hasRun && selectedStep === 'report' && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-[#EDE9FE] p-4"><p className="text-xs text-[#6D6582]">Current coursework</p><p className="mt-1 text-2xl font-bold text-[#1E1035]">{coursework}%</p></div><div className="rounded-xl border border-[#EDE9FE] p-4"><p className="text-xs text-[#6D6582]">Exam weight</p><p className="mt-1 text-2xl font-bold text-[#1E1035]">{finalWeight}%</p></div><div className="rounded-xl border border-[#EDE9FE] p-4"><p className="text-xs text-[#6D6582]">Target grade</p><p className="mt-1 text-2xl font-bold text-[#1E1035]">{target}%</p></div></div><div className="rounded-xl border border-[#EDE9FE] p-4"><h3 className="mb-2 font-bold text-[#1E1035]">Worked formula</h3><p className="font-mono text-sm text-[#7C3AED]">Final grade = coursework × (1 − exam weight) + exam score × exam weight</p><p className="mt-2 text-sm leading-6 text-[#6D6582]">Required exam score = (target − coursework × (1 − exam weight)) ÷ exam weight. Here, the exam weight is {((finalWeight / 100)).toFixed(2)} as a decimal.</p></div><div className="rounded-xl bg-[#FAF9FE] p-4 text-sm leading-6 text-[#6D6582]"><BookOpen className="mr-1 inline h-4 w-4 text-[#7C3AED]" /> <strong className="text-[#1E1035]">Assumption:</strong> This planner assumes the current coursework average represents all non-final course components. If your syllabus has separate weights, enter a combined weighted coursework average or use a detailed assessment-based model when available.</div><button onClick={downloadReport} className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#6D28D9]"><Download className="h-4 w-4" /> Export report (CSV)</button></div>}
            </motion.div>
          </AnimatePresence>
          <p className="flex items-start gap-2 text-xs leading-5 text-[#9D95B3]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7C3AED]" />This is a planning estimate, not an official grade record. Verify course weights and grading policies with your instructor or syllabus.</p>
        </section>
      </div>
    </div>
  );
}
