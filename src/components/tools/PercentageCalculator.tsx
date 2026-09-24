import { useState } from 'react';
import { Copy, Check, RotateCcw, Calculator } from 'lucide-react';

type CalcMode = 'what-is-x-of-y' | 'x-is-what-of-y' | 'percentage-change';

export function PercentageCalculator() {
  const [mode, setMode] = useState<CalcMode>('what-is-x-of-y');
  const [copied, setCopied] = useState(false);

  // Mode 1: What is X% of Y?
  const [m1Percent, setM1Percent] = useState<string>('15');
  const [m1Base, setM1Base] = useState<string>('240');

  // Mode 2: X is what % of Y?
  const [m2Part, setM2Part] = useState<string>('36');
  const [m2Whole, setM2Whole] = useState<string>('240');

  // Mode 3: Percentage Change from X to Y
  const [m3Initial, setM3Initial] = useState<string>('50');
  const [m3Final, setM3Final] = useState<string>('75');

  // Calculations
  const parseNum = (val: string) => {
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Computation for Mode 1
  const m1X = parseNum(m1Percent);
  const m1Y = parseNum(m1Base);
  const m1Result = m1X !== null && m1Y !== null ? (m1X / 100) * m1Y : null;

  // Computation for Mode 2
  const m2X = parseNum(m2Part);
  const m2Y = parseNum(m2Whole);
  const m2Result = m2X !== null && m2Y !== null && m2Y !== 0 ? (m2X / m2Y) * 100 : null;

  // Computation for Mode 3
  const m3X = parseNum(m3Initial);
  const m3Y = parseNum(m3Final);
  const m3Diff = m3X !== null && m3Y !== null ? m3Y - m3X : null;
  const m3Result = m3X !== null && m3Y !== null && m3X !== 0 ? ((m3Y - m3X) / Math.abs(m3X)) * 100 : null;

  const currentResultString =
    mode === 'what-is-x-of-y'
      ? m1Result !== null ? `${m1Result.toLocaleString(undefined, { maximumFractionDigits: 4 })}` : ''
      : mode === 'x-is-what-of-y'
      ? m2Result !== null ? `${m2Result.toLocaleString(undefined, { maximumFractionDigits: 4 })}%` : ''
      : m3Result !== null ? `${m3Result > 0 ? '+' : ''}${m3Result.toLocaleString(undefined, { maximumFractionDigits: 4 })}%` : '';

  return (
    <div id="percentage-calculator-tool" className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-7 shadow-[0_2px_14px_rgba(124,58,237,0.03)] transition-colors duration-200">
      {/* Header & Modes Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EDE9FE]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center font-heading font-bold text-base shadow-2xs">
            %
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-[#1E1035]">Interactive Percentage Engine</h2>
            <p className="font-sans text-xs text-[#6D6582]">Instant calculation with breakdown</p>
          </div>
        </div>

        {/* Calculation Modes */}
        <div className="flex items-center gap-1 p-1 bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl text-xs font-heading font-medium self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setMode('what-is-x-of-y')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              mode === 'what-is-x-of-y'
                ? 'bg-[#7C3AED] text-white font-semibold shadow-xs'
                : 'text-[#6D6582] hover:text-[#1E1035]'
            }`}
          >
            What is X% of Y?
          </button>
          <button
            type="button"
            onClick={() => setMode('x-is-what-of-y')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              mode === 'x-is-what-of-y'
                ? 'bg-[#7C3AED] text-white font-semibold shadow-xs'
                : 'text-[#6D6582] hover:text-[#1E1035]'
            }`}
          >
            X is what % of Y?
          </button>
          <button
            type="button"
            onClick={() => setMode('percentage-change')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              mode === 'percentage-change'
                ? 'bg-[#7C3AED] text-white font-semibold shadow-xs'
                : 'text-[#6D6582] hover:text-[#1E1035]'
            }`}
          >
            % Change (Increase/Decrease)
          </button>
        </div>
      </div>

      {/* Main Interactive Form */}
      <div className="mt-6">
        {mode === 'what-is-x-of-y' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="m1-percent-input" className="block font-heading text-xs font-semibold text-[#1E1035] uppercase tracking-wider mb-2">
                  Percentage (%)
                </label>
                <div className="relative">
                  <input
                    id="m1-percent-input"
                    type="number"
                    step="any"
                    value={m1Percent}
                    onChange={(e) => setM1Percent(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl px-3.5 py-2.5 text-base font-medium text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9D95B3] font-bold text-sm">%</span>
                </div>
                {/* Presets */}
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  <span className="text-[11px] font-sans text-[#6D6582]">Quick presets:</span>
                  {[5, 10, 15, 20, 25, 50].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setM1Percent(preset.toString())}
                      className="px-2 py-0.5 text-xs bg-[#FAF9FE] border border-[#EDE9FE] rounded-md text-[#6D6582] hover:text-[#7C3AED] hover:border-[#DDD6FE] transition-colors cursor-pointer"
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="m1-base-input" className="block font-heading text-xs font-semibold text-[#1E1035] uppercase tracking-wider mb-2">
                  Of Base Amount (Whole)
                </label>
                <input
                  id="m1-base-input"
                  type="number"
                  step="any"
                  value={m1Base}
                  onChange={(e) => setM1Base(e.target.value)}
                  placeholder="e.g. 240"
                  className="w-full bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl px-3.5 py-2.5 text-base font-medium text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all"
                />
              </div>
            </div>

            {/* Live Result Box */}
            <div className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-heading font-semibold uppercase tracking-wider text-[#7C3AED]">Calculated Result</span>
                  <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#7C3AED] mt-1 tracking-tight">
                    {m1Result !== null ? m1Result.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'}
                  </div>
                  {m1Result !== null && (
                    <p className="text-xs font-sans text-[#6D6582] mt-1">
                      {m1Percent}% of {m1Base} = ({m1Percent} ÷ 100) × {m1Base} = {m1Result.toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={m1Result === null}
                    onClick={() => currentResultString && copyToClipboard(currentResultString)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FFFFFF] border border-[#EDE9FE] rounded-lg text-xs font-heading font-semibold text-[#1E1035] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#7C3AED]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy result'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setM1Percent('');
                      setM1Base('');
                    }}
                    className="p-2 text-[#6D6582] hover:text-[#1E1035] rounded-lg hover:bg-white border border-transparent hover:border-[#EDE9FE] transition-colors cursor-pointer"
                    title="Clear fields"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'x-is-what-of-y' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="m2-part-input" className="block font-heading text-xs font-semibold text-[#1E1035] uppercase tracking-wider mb-2">
                  Part Value (X)
                </label>
                <input
                  id="m2-part-input"
                  type="number"
                  step="any"
                  value={m2Part}
                  onChange={(e) => setM2Part(e.target.value)}
                  placeholder="e.g. 36"
                  className="w-full bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl px-3.5 py-2.5 text-base font-medium text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all"
                />
              </div>

              <div>
                <label htmlFor="m2-whole-input" className="block font-heading text-xs font-semibold text-[#1E1035] uppercase tracking-wider mb-2">
                  Total Whole Value (Y)
                </label>
                <input
                  id="m2-whole-input"
                  type="number"
                  step="any"
                  value={m2Whole}
                  onChange={(e) => setM2Whole(e.target.value)}
                  placeholder="e.g. 240"
                  className="w-full bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl px-3.5 py-2.5 text-base font-medium text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all"
                />
              </div>
            </div>

            {/* Live Result Box */}
            <div className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-heading font-semibold uppercase tracking-wider text-[#7C3AED]">Calculated Percentage</span>
                  <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#7C3AED] mt-1 tracking-tight">
                    {m2Result !== null ? `${m2Result.toLocaleString(undefined, { maximumFractionDigits: 4 })}%` : '—'}
                  </div>
                  {m2Result !== null && (
                    <p className="text-xs font-sans text-[#6D6582] mt-1">
                      {m2Part} ÷ {m2Whole} = {(m2X! / m2Y!).toFixed(4)} × 100 = {m2Result.toFixed(2)}%
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={m2Result === null}
                    onClick={() => currentResultString && copyToClipboard(currentResultString)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FFFFFF] border border-[#EDE9FE] rounded-lg text-xs font-heading font-semibold text-[#1E1035] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#7C3AED]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy result'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setM2Part('');
                      setM2Whole('');
                    }}
                    className="p-2 text-[#6D6582] hover:text-[#1E1035] rounded-lg hover:bg-white border border-transparent hover:border-[#EDE9FE] transition-colors cursor-pointer"
                    title="Clear fields"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'percentage-change' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="m3-initial-input" className="block font-heading text-xs font-semibold text-[#1E1035] uppercase tracking-wider mb-2">
                  Initial Value (From)
                </label>
                <input
                  id="m3-initial-input"
                  type="number"
                  step="any"
                  value={m3Initial}
                  onChange={(e) => setM3Initial(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl px-3.5 py-2.5 text-base font-medium text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all"
                />
              </div>

              <div>
                <label htmlFor="m3-final-input" className="block font-heading text-xs font-semibold text-[#1E1035] uppercase tracking-wider mb-2">
                  Final Value (To)
                </label>
                <input
                  id="m3-final-input"
                  type="number"
                  step="any"
                  value={m3Final}
                  onChange={(e) => setM3Final(e.target.value)}
                  placeholder="e.g. 75"
                  className="w-full bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl px-3.5 py-2.5 text-base font-medium text-[#1E1035] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all"
                />
              </div>
            </div>

            {/* Live Result Box */}
            <div className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-heading font-semibold uppercase tracking-wider text-[#7C3AED]">Relative Change</span>
                    {m3Result !== null && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-heading font-semibold ${
                        m3Result > 0 ? 'bg-[#EDE9FE] text-[#6D28D9]' : m3Result < 0 ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#FAF9FE] text-[#6D6582]'
                      }`}>
                        {m3Result > 0 ? 'Increase' : m3Result < 0 ? 'Decrease' : 'No Change'}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#7C3AED] mt-1 tracking-tight">
                    {m3Result !== null ? `${m3Result > 0 ? '+' : ''}${m3Result.toLocaleString(undefined, { maximumFractionDigits: 4 })}%` : '—'}
                  </div>
                  {m3Result !== null && m3Diff !== null && (
                    <p className="text-xs font-sans text-[#6D6582] mt-1">
                      Difference: {m3Diff > 0 ? '+' : ''}{m3Diff.toLocaleString()} ({m3Diff} ÷ {m3Initial} × 100)
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={m3Result === null}
                    onClick={() => currentResultString && copyToClipboard(currentResultString)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FFFFFF] border border-[#EDE9FE] rounded-lg text-xs font-heading font-semibold text-[#1E1035] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#7C3AED]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy result'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setM3Initial('');
                      setM3Final('');
                    }}
                    className="p-2 text-[#6D6582] hover:text-[#1E1035] rounded-lg hover:bg-white border border-transparent hover:border-[#EDE9FE] transition-colors cursor-pointer"
                    title="Clear fields"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trust & Methodology Footer */}
      <div className="mt-6 pt-4 border-t border-[#EDE9FE] flex items-center justify-between text-xs text-[#6D6582]">
        <span className="flex items-center gap-1">
          <Calculator className="w-3.5 h-3.5 text-[#7C3AED]" />
          Instant client-side calculation
        </span>
        <span>Standard IEEE 754 precision</span>
      </div>
    </div>
  );
}
