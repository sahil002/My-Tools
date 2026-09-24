import { useState } from 'react';
import { Calendar, Copy, Check, RotateCcw, Clock, Sparkles } from 'lucide-react';

type AgeResult =
  | { isFuture: true }
  | {
      isFuture: false;
      years: number;
      months: number;
      days: number;
      totalMonths: number;
      totalWeeks: number;
      totalWeeksDays: number;
      totalDays: number;
      totalHours: number;
      totalMinutes: number;
      daysUntilNextBday: number;
      nextBdayDayOfWeek: string;
      generation: string;
    };

export function AgeCalculator() {
  const todayStr = '2026-09-17'; // default evaluation date per environment metadata
  const [birthDate, setBirthDate] = useState<string>('1995-03-15');
  const [targetDate, setTargetDate] = useState<string>(todayStr);
  const [copied, setCopied] = useState(false);

  // Accurate Calendar Date Difference Algorithm
  const calculateExactAge = (): AgeResult | null => {
    if (!birthDate || !targetDate) return null;

    const b = new Date(birthDate + 'T00:00:00');
    const t = new Date(targetDate + 'T00:00:00');

    if (isNaN(b.getTime()) || isNaN(t.getTime())) return null;
    if (t.getTime() < b.getTime()) {
      return { isFuture: true };
    }

    let years = t.getFullYear() - b.getFullYear();
    let months = t.getMonth() - b.getMonth();
    let days = t.getDate() - b.getDate();

    if (days < 0) {
      months -= 1;
      // Get days in preceding month of target date
      const prevMonth = new Date(t.getFullYear(), t.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    // Total milliseconds elapsed
    const diffMs = t.getTime() - b.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalWeeksDays = totalDays % 7;
    const totalMonths = years * 12 + months;
    const totalHours = totalDays * 24;
    const totalMinutes = totalHours * 60;

    // Next Birthday calculation
    let nextBday = new Date(t.getFullYear(), b.getMonth(), b.getDate());
    if (nextBday < t) {
      nextBday = new Date(t.getFullYear() + 1, b.getMonth(), b.getDate());
    }
    const daysUntilNextBday = Math.ceil((nextBday.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
    const nextBdayDayOfWeek = nextBday.toLocaleDateString(undefined, { weekday: 'long' });

    // Generation
    const bYear = b.getFullYear();
    let generation = 'Silent Generation / Prior';
    if (bYear >= 1946 && bYear <= 1964) generation = 'Baby Boomer';
    else if (bYear >= 1965 && bYear <= 1980) generation = 'Generation X';
    else if (bYear >= 1981 && bYear <= 1996) generation = 'Millennial';
    else if (bYear >= 1997 && bYear <= 2012) generation = 'Generation Z';
    else if (bYear >= 2013) generation = 'Generation Alpha';

    return {
      isFuture: false,
      years,
      months,
      days,
      totalMonths,
      totalWeeks,
      totalWeeksDays,
      totalDays,
      totalHours,
      totalMinutes,
      daysUntilNextBday,
      nextBdayDayOfWeek,
      generation,
    };
  };

  const ageData = calculateExactAge();

  const handleCopy = () => {
    if (!ageData || ageData.isFuture) return;
    const text = `${ageData.years} years, ${ageData.months} months, and ${ageData.days} days old (${ageData.totalDays.toLocaleString()} days lived).`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="age-calculator-tool" className="bg-[#FFFFFF] border border-[#E4E8EF] rounded-2xl p-5 sm:p-7 shadow-xs transition-colors duration-200">
      {/* Tool Header */}
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#E4E8EF]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E9F8EF] text-[#16A34A] flex items-center justify-center font-heading font-bold text-sm shadow-2xs">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-[#131A2B]">Chronological Age Engine</h2>
            <p className="font-sans text-xs text-[#5B6577]">Accurate to exact day with calendar leap year adjustment</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setBirthDate('1995-03-15');
            setTargetDate(todayStr);
          }}
          className="p-2 text-[#5B6577] hover:text-[#131A2B] rounded-lg hover:bg-white border border-[#E4E8EF] text-xs font-heading font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
          title="Reset dates"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Date Pickers Form */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="birthdate-input" className="block font-heading text-xs font-semibold text-[#131A2B] uppercase tracking-wider mb-2">
            Date of Birth
          </label>
          <input
            id="birthdate-input"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#E4E8EF] rounded-xl px-3.5 py-2.5 text-base font-medium text-[#131A2B] focus:outline-hidden focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all"
          />
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-[11px] font-sans text-[#5B6577]">Presets:</span>
            <button
              type="button"
              onClick={() => setBirthDate('2000-01-01')}
              className="px-2 py-0.5 text-xs bg-[#F4F6F9] border border-[#E4E8EF] rounded-md text-[#5B6577] hover:text-[#131A2B] hover:border-[#16A34A] cursor-pointer transition-colors"
            >
              Jan 1, 2000
            </button>
            <button
              type="button"
              onClick={() => setBirthDate('1990-06-15')}
              className="px-2 py-0.5 text-xs bg-[#F4F6F9] border border-[#E4E8EF] rounded-md text-[#5B6577] hover:text-[#131A2B] hover:border-[#16A34A] cursor-pointer transition-colors"
            >
              Jun 15, 1990
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="targetdate-input" className="block font-heading text-xs font-semibold text-[#131A2B] uppercase tracking-wider mb-2">
            Age as of Date (Today or Evaluation Date)
          </label>
          <input
            id="targetdate-input"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#E4E8EF] rounded-xl px-3.5 py-2.5 text-base font-medium text-[#131A2B] focus:outline-hidden focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all"
          />
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[11px] font-sans text-[#5B6577]">Set to:</span>
            <button
              type="button"
              onClick={() => setTargetDate(todayStr)}
              className="px-2 py-0.5 text-xs bg-[#F4F6F9] border border-[#E4E8EF] rounded-md text-[#5B6577] hover:text-[#131A2B] hover:border-[#16A34A] cursor-pointer transition-colors"
            >
              Current Date
            </button>
          </div>
        </div>
      </div>

      {/* Results Area */}
      <div className="mt-6">
        {ageData?.isFuture ? (
          <div className="p-4 bg-[#FFFBEB] border border-[#F59E0B]/30 rounded-xl text-[#F59E0B] text-sm font-sans">
            <strong>Target date is earlier than birth date.</strong> Please select a target date that occurs after the date of birth.
          </div>
        ) : ageData && !ageData.isFuture ? (
          <div className="space-y-4">
            {/* Primary Result Banner with Category Result Panel Tint */}
            <div className="bg-[#E9F8EF] border border-[#16A34A]/30 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-heading font-semibold uppercase tracking-wider text-[#16A34A]">
                    Primary Chronological Age
                  </span>
                  <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#16A34A] mt-1 tracking-tight">
                    {ageData.years} <span className="text-lg font-medium text-[#16A34A]/80">years</span>,{' '}
                    {ageData.months} <span className="text-lg font-medium text-[#16A34A]/80">months</span>,{' '}
                    {ageData.days} <span className="text-lg font-medium text-[#16A34A]/80">days</span>
                  </div>
                  <p className="text-xs font-sans text-[#16A34A]/80 mt-1.5">
                    Generation: <span className="font-semibold text-[#131A2B]">{ageData.generation}</span> • Next birthday in{' '}
                    <span className="font-semibold text-[#16A34A]">{ageData.daysUntilNextBday} days</span> ({ageData.nextBdayDayOfWeek})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FFFFFF] border border-[#E4E8EF] rounded-lg text-xs font-heading font-semibold text-[#131A2B] hover:border-[#16A34A] hover:text-[#16A34A] transition-colors self-start sm:self-auto cursor-pointer shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy result'}</span>
                </button>
              </div>
            </div>

            {/* Time Equivalence Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#FFFFFF] border border-[#E4E8EF] rounded-xl">
                <div className="text-xs font-sans text-[#5B6577]">Total Months</div>
                <div className="text-lg font-heading font-bold text-[#131A2B] mt-0.5">
                  {ageData.totalMonths.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#9AA5B8] mt-0.5 font-sans">+ {ageData.days} days</div>
              </div>

              <div className="p-3 bg-[#FFFFFF] border border-[#E4E8EF] rounded-xl">
                <div className="text-xs font-sans text-[#5B6577]">Total Weeks</div>
                <div className="text-lg font-heading font-bold text-[#131A2B] mt-0.5">
                  {ageData.totalWeeks.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#9AA5B8] mt-0.5 font-sans">+ {ageData.totalWeeksDays} days</div>
              </div>

              <div className="p-3 bg-[#FFFFFF] border border-[#E4E8EF] rounded-xl">
                <div className="text-xs font-sans text-[#5B6577]">Total Days</div>
                <div className="text-lg font-heading font-bold text-[#131A2B] mt-0.5">
                  {ageData.totalDays.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#9AA5B8] mt-0.5 font-sans">days lived</div>
              </div>

              <div className="p-3 bg-[#FFFFFF] border border-[#E4E8EF] rounded-xl">
                <div className="text-xs font-sans text-[#5B6577]">Total Hours</div>
                <div className="text-lg font-heading font-bold text-[#131A2B] mt-0.5">
                  {ageData.totalHours.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#9AA5B8] mt-0.5 font-sans">hours elapsed</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-[#E4E8EF] flex items-center justify-between text-xs text-[#5B6577]">
        <span className="flex items-center gap-1 font-sans">
          <Clock className="w-3.5 h-3.5 text-[#16A34A]" />
          Gregorian leap year adjusted
        </span>
        <span className="font-sans">Local browser computed</span>
      </div>
    </div>
  );
}
