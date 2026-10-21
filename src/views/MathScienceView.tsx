import { ArrowRight, Atom, BookOpen, Calculator, ChartNoAxesCombined, FlaskConical, GraduationCap, Sigma } from 'lucide-react';
import { Link } from '../context/RouterContext';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { SEOHelmet } from '../components/SEOHelmet';
import { useMergedTools } from '../services/toolRegistryService';

const SUBJECTS = [
  {
    title: 'Math & Algebra',
    description: 'Equations, algebra, quadratics, derivatives and integrals with clear working steps.',
    icon: Sigma,
    query: 'math',
    accent: 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]',
    planned: ['Equation Solver', 'Quadratic Solver', 'Calculus Solver'],
  },
  {
    title: 'Statistics & Probability',
    description: 'Understand data, probability, distributions and statistical results—not just the final number.',
    icon: ChartNoAxesCombined,
    query: 'statistics',
    accent: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
    planned: ['Statistics Toolkit', 'Probability Solver', 'Regression Analysis'],
  },
  {
    title: 'Physics',
    description: 'Solve formula-based problems with units, rearranged equations and step-by-step calculations.',
    icon: Atom,
    query: 'physics',
    accent: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
    planned: ['Physics Problem Solver', 'Motion & Force', 'Electricity Calculator'],
  },
  {
    title: 'Chemistry',
    description: 'Go beyond basic balancing with molar mass, mole conversions and stoichiometry workflows.',
    icon: FlaskConical,
    query: 'chemistry',
    accent: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]',
    planned: ['Equation Balancer', 'Molar Mass Calculator', 'Stoichiometry Solver'],
  },
];

export function MathScienceView() {
  const { tools } = useMergedTools();
  const breadcrumbs = [
    { label: 'Explore Tools', path: '/tools' },
    { label: 'Math & Science', path: '/math-science' },
  ];

  return (
    <div className="space-y-7 sm:space-y-9">
      <SEOHelmet
        title="Math & Science Tools – Step-by-Step Problem Solvers"
        description="Explore focused math, statistics, physics and chemistry tools planned for clear, step-by-step problem solving on PRB Solver."
        canonicalPath="/math-science"
        breadcrumbs={breadcrumbs}
      />
      <Breadcrumbs items={breadcrumbs} />

      <section className="relative overflow-hidden rounded-3xl border border-[#EDE9FE] bg-white p-5 sm:p-8 lg:p-10 shadow-[0_2px_12px_rgba(124,58,237,0.04)]">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#F5F3FF] blur-3xl opacity-80" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-3 py-1.5 text-xs font-bold text-[#6D28D9]">
            <GraduationCap className="h-4 w-4" /> Focused learning tools
          </span>
          <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1E1035]">
            Math & Science, made easier to solve.
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base leading-7 text-[#6D6582]">
            Find the right subject area quickly. Our goal is to build useful solvers that show the method, explain the result and help you understand the problem—not just output an answer.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href="/tools" className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#6D28D9]">
              <Calculator className="h-4 w-4" /> Browse available tools <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="text-xs text-[#6D6582]">New subject collections will appear as tools are published.</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="subject-areas-heading" className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7C3AED]">Choose a subject</p>
            <h2 id="subject-areas-heading" className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-[#1E1035]">Explore subject areas</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#6D6582]">Four clear pathways instead of one crowded list.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SUBJECTS.map((subject) => {
            const Icon = subject.icon;
            const matchingTools = tools.filter((tool) => {
              const text = [tool.name, tool.description, tool.category, ...(tool.keywords || [])].join(' ').toLowerCase();
              return subject.query === 'math'
                ? /math|equation|quadratic|algebra|derivative|integral/.test(text)
                : text.includes(subject.query);
            });
            return (
              <article key={subject.title} className="group rounded-2xl border border-[#EDE9FE] bg-white p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C4B5FD] hover:shadow-[0_10px_28px_rgba(124,58,237,0.07)]">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${subject.accent}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-[#1E1035]">{subject.title}</h3>
                      <span className="rounded-full border border-[#EDE9FE] bg-[#FAF9FE] px-2 py-0.5 text-[10px] font-semibold text-[#6D6582]">
                        {matchingTools.length > 0 ? `${matchingTools.length} related tools` : 'Collection planned'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#6D6582]">{subject.description}</p>
                  </div>
                </div>
                <div className="mt-5 border-t border-[#EDE9FE] pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#9D95B3]">Planned capabilities</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {subject.planned.map((item) => (
                      <span key={item} className="rounded-lg border border-[#EDE9FE] bg-[#FAF9FE] px-2.5 py-1.5 text-xs font-medium text-[#514766]">{item}</span>
                    ))}
                  </div>
                  {matchingTools.length > 0 ? (
                    <Link href={`/tools?q=${encodeURIComponent(subject.query)}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#7C3AED] hover:text-[#6D28D9]">
                      Explore related tools <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  ) : (
                    <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B829C]">
                      <BookOpen className="h-3.5 w-3.5" /> More tools will be added after validation
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-[#EDE9FE] bg-[#FAF9FE] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-base font-bold text-[#1E1035]">Looking for grades, GPA or exam planning?</h2>
          <p className="mt-1 text-sm text-[#6D6582]">Academic planning stays in Education, while subject-specific problem solving lives here.</p>
        </div>
        <Link href="/tools?q=grade" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#DDD6FE] bg-white px-4 py-2.5 text-sm font-bold text-[#7C3AED] transition-colors hover:bg-[#F5F3FF]">
          <GraduationCap className="h-4 w-4" /> Explore academic tools <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
