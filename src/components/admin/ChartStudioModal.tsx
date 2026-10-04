import { useState } from 'react';
import {
  ChartConfig,
  ChartType,
  CHART_PRESETS,
  InteractiveFinanceChart,
} from '../common/InteractiveFinanceChart';
import {
  BarChart3,
  X,
  Plus,
  Trash2,
  Check,
  Sparkles,
  PieChart,
  LineChart,
} from 'lucide-react';

interface ChartStudioModalProps {
  initialConfig?: ChartConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveChart: (config: ChartConfig) => void;
}

export function ChartStudioModal({
  initialConfig,
  isOpen,
  onClose,
  onSaveChart,
}: ChartStudioModalProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'builder'>('builder');

  // Chart config states
  const [chartType, setChartType] = useState<ChartType>(initialConfig?.type || 'bar');
  const [title, setTitle] = useState(initialConfig?.title || 'Financial Growth & Return Analysis');
  const [subtitle, setSubtitle] = useState(
    initialConfig?.subtitle || 'Calculated Projection over 5 Periods'
  );
  const [unitPrefix, setUnitPrefix] = useState(initialConfig?.unitPrefix || '$');
  const [unitSuffix, setUnitSuffix] = useState(initialConfig?.unitSuffix || '');
  const [series1Name, setSeries1Name] = useState(initialConfig?.series1Name || 'Value');
  const [series2Name, setSeries2Name] = useState(initialConfig?.series2Name || 'Baseline');
  const [colorTheme, setColorTheme] = useState<'purple' | 'emerald' | 'blue' | 'amber'>(
    initialConfig?.colorTheme || 'purple'
  );

  // Spreadsheet Data Grid State
  const [dataRows, setDataRows] = useState<{ label: string; value: number; value2?: number }[]>(
    initialConfig?.data && initialConfig.data.length > 0
      ? initialConfig.data
      : [
          { label: 'Year 1', value: 1000, value2: 1000 },
          { label: 'Year 2', value: 2400, value2: 2000 },
          { label: 'Year 3', value: 4200, value2: 3000 },
          { label: 'Year 4', value: 6800, value2: 4000 },
          { label: 'Year 5', value: 10500, value2: 5000 },
        ]
  );

  if (!isOpen) return null;

  const currentPreviewConfig: ChartConfig = {
    id: initialConfig?.id || `chart-${Date.now()}`,
    type: chartType,
    title: title.trim() || 'Untitled Chart',
    subtitle: subtitle.trim() || undefined,
    unitPrefix,
    unitSuffix,
    series1Name,
    series2Name: chartType === 'comparison' ? series2Name : undefined,
    colorTheme,
    data: dataRows.map((r) => ({
      label: r.label.trim() || 'Period',
      value: Number(r.value) || 0,
      value2: chartType === 'comparison' ? Number(r.value2) || 0 : undefined,
    })),
  };

  const handleAddRow = () => {
    setDataRows([
      ...dataRows,
      {
        label: `Item ${dataRows.length + 1}`,
        value: 1000,
        value2: chartType === 'comparison' ? 800 : undefined,
      },
    ]);
  };

  const handleRemoveRow = (idx: number) => {
    if (dataRows.length <= 1) return;
    setDataRows(dataRows.filter((_, i) => i !== idx));
  };

  const handleApplyPreset = (preset: (typeof CHART_PRESETS)[0]) => {
    setChartType(preset.config.type);
    setTitle(preset.config.title);
    setSubtitle(preset.config.subtitle || '');
    setUnitPrefix(preset.config.unitPrefix || '');
    setUnitSuffix(preset.config.unitSuffix || '');
    setSeries1Name(preset.config.series1Name || 'Value');
    setSeries2Name(preset.config.series2Name || 'Baseline');
    setColorTheme(preset.config.colorTheme || 'purple');
    setDataRows(preset.config.data);
    setActiveTab('builder');
  };

  const handleSave = () => {
    onSaveChart(currentPreviewConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#DDD6FE] rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 font-sans">
        
        {/* Header */}
        <header className="p-4 sm:p-5 border-b border-[#EDE9FE] bg-[#FAF9FE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white flex items-center justify-center shadow-md">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#1E1035] flex items-center gap-2">
                <span>Excel-Grade Financial &amp; Calculation Charts Studio</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF5FF] text-[#7C3AED] border border-[#DDD6FE]">
                  Full Interactive SVG
                </span>
              </h3>
              <p className="text-xs text-[#6D6582]">
                Create, customize and live-preview interactive financial charts, comparisons, and matrices for guides and articles.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-[#EDE9FE] bg-white text-xs font-heading font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'builder'
                ? 'border-[#7C3AED] text-[#7C3AED]'
                : 'border-transparent text-[#6D6582] hover:text-[#1E1035]'
            }`}
          >
            🛠️ Interactive Data Grid &amp; Builder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'presets'
                ? 'border-[#7C3AED] text-[#7C3AED]'
                : 'border-transparent text-[#6D6582] hover:text-[#1E1035]'
            }`}
          >
            ⚡ Finance Chart Presets
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'presets' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CHART_PRESETS.map((preset, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-[#EDE9FE] hover:border-[#7C3AED] bg-[#FAF9FE] hover:bg-white transition-all space-y-3 cursor-pointer group shadow-2xs"
                  onClick={() => handleApplyPreset(preset)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-[#1E1035] group-hover:text-[#7C3AED] transition-colors">
                        {preset.name}
                      </h4>
                      <p className="text-xs text-[#6D6582] mt-0.5">{preset.description}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-[#DDD6FE] text-[#7C3AED]">
                      {preset.config.type}
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-[#EDE9FE] text-xs">
                    <span className="text-[11px] font-mono text-[#9D95B3]">
                      {preset.config.data.length} data points
                    </span>
                    <button
                      type="button"
                      className="px-3 py-1 bg-[#7C3AED] group-hover:bg-[#6D28D9] text-white rounded-lg text-xs font-heading font-bold shadow-2xs transition-colors"
                    >
                      Load &amp; Customize
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* TOP ROW: Chart Type Selection */}
              <div>
                <label className="block text-xs font-heading font-bold text-[#1E1035] uppercase tracking-wider mb-2">
                  Select Chart Type:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'bar', label: 'Vertical Columns', icon: BarChart3 },
                    { id: 'comparison', label: 'Dual Comparison', icon: BarChart3 },
                    { id: 'horizontalBar', label: 'Horizontal Bars', icon: BarChart3 },
                    { id: 'line', label: 'Trend / Growth Line', icon: LineChart },
                    { id: 'donut', label: 'Donut Allocation', icon: PieChart },
                  ].map((ct) => {
                    const Icon = ct.icon;
                    const isSelected = chartType === ct.id;
                    return (
                      <button
                        key={ct.id}
                        type="button"
                        onClick={() => setChartType(ct.id as ChartType)}
                        className={`p-2.5 rounded-xl border text-xs font-heading font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FAF5FF] border-[#7C3AED] text-[#7C3AED] shadow-2xs'
                            : 'bg-white border-[#EDE9FE] text-[#6D6582] hover:border-[#DDD6FE] hover:text-[#1E1035]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-center">{ct.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ROW 2: Chart Metadata (Title, Subtitle, Prefix, Suffix, Theme) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                <div className="sm:col-span-5 space-y-1">
                  <label className="font-heading font-bold text-[#1E1035]">Chart Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Compound Interest Growth by Year"
                    className="w-full px-3 py-2 bg-[#FAF9FE] border border-[#DDD6FE] rounded-xl text-[#1E1035] font-semibold outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="sm:col-span-4 space-y-1">
                  <label className="font-heading font-bold text-[#1E1035]">Subtitle / Context</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Based on 7% Average Annual Return"
                    className="w-full px-3 py-2 bg-[#FAF9FE] border border-[#DDD6FE] rounded-xl text-[#1E1035] outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="font-heading font-bold text-[#1E1035]">Color Theme</label>
                  <select
                    value={colorTheme}
                    onChange={(e: any) => setColorTheme(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#DDD6FE] rounded-xl text-[#1E1035] font-semibold outline-none cursor-pointer focus:border-[#7C3AED]"
                  >
                    <option value="purple">Royal Purple (Default)</option>
                    <option value="emerald">Emerald Green (Profits)</option>
                    <option value="blue">Ocean Blue (Corporate)</option>
                    <option value="amber">Warm Gold (Returns)</option>
                  </select>
                </div>
              </div>

              {/* Units and Series Names */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#FAF9FE] p-3 rounded-2xl border border-[#EDE9FE]">
                <div>
                  <label className="block text-[11px] font-bold text-[#6D6582] mb-1">
                    Currency / Prefix:
                  </label>
                  <input
                    type="text"
                    value={unitPrefix}
                    onChange={(e) => setUnitPrefix(e.target.value)}
                    placeholder="e.g. $ or PKR"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#DDD6FE] rounded-lg text-center font-mono font-bold text-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6D6582] mb-1">
                    Unit / Suffix:
                  </label>
                  <input
                    type="text"
                    value={unitSuffix}
                    onChange={(e) => setUnitSuffix(e.target.value)}
                    placeholder="e.g. % or yrs"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#DDD6FE] rounded-lg text-center font-mono font-bold text-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6D6582] mb-1">
                    Series 1 Label:
                  </label>
                  <input
                    type="text"
                    value={series1Name}
                    onChange={(e) => setSeries1Name(e.target.value)}
                    placeholder="Series 1 Name"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#DDD6FE] rounded-lg font-semibold text-[#1E1035]"
                  />
                </div>

                {chartType === 'comparison' && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#6D6582] mb-1">
                      Series 2 (Baseline):
                    </label>
                    <input
                      type="text"
                      value={series2Name}
                      onChange={(e) => setSeries2Name(e.target.value)}
                      placeholder="Series 2 Name"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#DDD6FE] rounded-lg font-semibold text-[#1E1035]"
                    />
                  </div>
                )}
              </div>

              {/* SPREADSHEET-LIKE DATA GRID */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-heading font-bold text-[#1E1035] uppercase tracking-wider">
                      Spreadsheet Data Table ({dataRows.length} points)
                    </span>
                    <span className="text-[10px] text-[#9D95B3]">
                      (Edit numbers below — live preview updates in real time)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-2.5 py-1 bg-white hover:bg-[#FAF5FF] border border-[#DDD6FE] text-[#7C3AED] rounded-lg text-xs font-heading font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-[#DDD6FE] rounded-xl bg-white shadow-2xs">
                  <table className="w-full text-xs">
                    <thead className="bg-[#FAF9FE] border-b border-[#EDE9FE] font-heading font-bold text-[#1E1035] text-left">
                      <tr>
                        <th className="p-2.5 w-12 text-center text-[#9D95B3]">#</th>
                        <th className="p-2.5">Data Label / Period</th>
                        <th className="p-2.5">
                          {series1Name || 'Value 1'} ({unitPrefix}
                          {unitSuffix})
                        </th>
                        {chartType === 'comparison' && (
                          <th className="p-2.5">
                            {series2Name || 'Value 2'} ({unitPrefix}
                            {unitSuffix})
                          </th>
                        )}
                        <th className="p-2.5 w-14 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE9FE]">
                      {dataRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF9FE]/60">
                          <td className="p-2.5 text-center font-mono text-[11px] text-[#9D95B3]">
                            {idx + 1}
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.label}
                              onChange={(e) => {
                                const copy = [...dataRows];
                                copy[idx].label = e.target.value;
                                setDataRows(copy);
                              }}
                              className="w-full px-2 py-1 bg-[#FAF9FE] border border-[#EDE9FE] focus:border-[#7C3AED] rounded-md text-[#1E1035] font-medium outline-none"
                              placeholder={`Label ${idx + 1}`}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="any"
                              value={row.value}
                              onChange={(e) => {
                                const copy = [...dataRows];
                                copy[idx].value = Number(e.target.value) || 0;
                                setDataRows(copy);
                              }}
                              className="w-full px-2 py-1 bg-[#FAF9FE] border border-[#EDE9FE] focus:border-[#7C3AED] rounded-md text-[#7C3AED] font-mono font-bold outline-none"
                              placeholder="0"
                            />
                          </td>
                          {chartType === 'comparison' && (
                            <td className="p-2">
                              <input
                                type="number"
                                step="any"
                                value={row.value2 ?? 0}
                                onChange={(e) => {
                                  const copy = [...dataRows];
                                  copy[idx].value2 = Number(e.target.value) || 0;
                                  setDataRows(copy);
                                }}
                                className="w-full px-2 py-1 bg-[#FAF9FE] border border-[#EDE9FE] focus:border-[#7C3AED] rounded-md text-slate-700 font-mono font-semibold outline-none"
                                placeholder="0"
                              />
                            </td>
                          )}
                          <td className="p-2 text-center">
                            {dataRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(idx)}
                                className="p-1 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-50 cursor-pointer"
                                title="Remove row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* LIVE INTERACTIVE PREVIEW */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#7C3AED]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Real-Time Interactive SVG Preview:</span>
                </div>
                <div className="border border-[#DDD6FE] rounded-2xl p-1 bg-[#FAF9FE]">
                  <InteractiveFinanceChart config={currentPreviewConfig} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="p-4 border-t border-[#EDE9FE] bg-[#FAF9FE] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#6D6582]">
            {dataRows.length} data rows configured. Chart responds smoothly on mobile &amp; desktop.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-heading font-semibold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-heading font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Insert Chart into Article</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
