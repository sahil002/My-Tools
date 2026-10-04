import { useState } from 'react';
import {
  ChartConfig,
  ChartType,
  CHART_PRESETS,
  InteractiveFinanceChart,
  ChartMainCategory,
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
  Activity,
  Layers,
  CircleDot,
  Grid,
} from 'lucide-react';

interface ChartStudioModalProps {
  initialConfig?: ChartConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveChart: (config: ChartConfig) => void;
}

// Complete Excel Chart Categories & Subtypes Structure
interface ChartCategoryDef {
  id: ChartMainCategory;
  name: string;
  icon: any;
  subtypes: { id: ChartType; name: string; desc: string; badge?: string }[];
}

export const EXCEL_CHART_CATEGORIES: ChartCategoryDef[] = [
  {
    id: 'column',
    name: 'Column Charts',
    icon: BarChart3,
    subtypes: [
      // 2D Column (3)
      { id: 'col_2d_clustered', name: '2D Clustered Column', desc: 'Compare values across categories', badge: '2D' },
      { id: 'col_2d_stacked', name: '2D Stacked Column', desc: 'Compare parts of a whole over time', badge: '2D' },
      { id: 'col_2d_100_stacked', name: '2D 100% Stacked Column', desc: 'Percentage contribution of each value', badge: '2D' },
      // 3D Column (4)
      { id: 'col_3d_clustered', name: '3D Clustered Column', desc: '3D columns with dual-axis depth', badge: '3D' },
      { id: 'col_3d_stacked', name: '3D Stacked Column', desc: 'Stack 3D blocks to show cumulative totals', badge: '3D' },
      { id: 'col_3d_100_stacked', name: '3D 100% Stacked Column', desc: '3D proportion blocks summing to 100%', badge: '3D' },
      { id: 'col_3d_deep', name: '3D Column (Depth View)', desc: 'Isometric perspective with deep lighting', badge: '3D' },
      // Cylinder (4)
      { id: 'cyl_clustered', name: 'Clustered Cylinder', desc: 'Round cylindrical columns for KPIs', badge: 'Cylinder' },
      { id: 'cyl_stacked', name: 'Stacked Cylinder', desc: 'Stacked cylinders showing growth phases', badge: 'Cylinder' },
      { id: 'cyl_100_stacked', name: '100% Stacked Cylinder', desc: 'Proportional cylinder fill', badge: 'Cylinder' },
      { id: 'cyl_3d', name: '3D Cylinder Perspective', desc: 'Curved cylinder rendering with caps', badge: 'Cylinder' },
      // Cone (4)
      { id: 'cone_clustered', name: 'Clustered Cone', desc: 'Tapered 3D cones for sharp targets', badge: 'Cone' },
      { id: 'cone_stacked', name: 'Stacked Cone', desc: 'Tiered cone layers showing milestones', badge: 'Cone' },
      { id: 'cone_100_stacked', name: '100% Stacked Cone', desc: 'Percentage conical distribution', badge: 'Cone' },
      { id: 'cone_3d', name: '3D Deep Cone', desc: 'High-contrast conical geometric blocks', badge: 'Cone' },
      // Pyramid (4)
      { id: 'pyramid_clustered', name: 'Clustered Pyramid', desc: 'Triangular pyramid faces for rankings', badge: 'Pyramid' },
      { id: 'pyramid_stacked', name: 'Stacked Pyramid', desc: 'Ascending hierarchical pyramid tiers', badge: 'Pyramid' },
      { id: 'pyramid_100_stacked', name: '100% Stacked Pyramid', desc: 'Proportional pyramid structure', badge: 'Pyramid' },
      { id: 'pyramid_3d', name: '3D Pyramid Isometric', desc: 'Full 3D pyramid with shaded surfaces', badge: 'Pyramid' },
    ],
  },
  {
    id: 'line',
    name: 'Line Charts',
    icon: LineChart,
    subtypes: [
      { id: 'line_markers', name: 'Line with Data Markers', desc: 'Highlight discrete calculation nodes' },
      { id: 'line_stacked', name: 'Stacked Line', desc: 'Display trend of contribution of each value' },
      { id: 'line_100_stacked', name: '100% Stacked Line', desc: 'Trend of percentage distribution over time' },
      { id: 'line_smooth', name: 'Smooth Spline Line', desc: 'Continuous bezier curves for interest trajectories' },
      { id: 'line_3d', name: '3D Ribbon Line', desc: 'Volumetric ribbon lines across periods' },
    ],
  },
  {
    id: 'pie',
    name: 'Pie Charts',
    icon: PieChart,
    subtypes: [
      { id: 'pie_2d', name: 'Standard 2D Pie', desc: 'Display proportion of each value in whole' },
      { id: 'pie_3d', name: '3D Exploded Pie', desc: 'Highlights emphasized slices with offset' },
      { id: 'pie_exploded', name: 'Exploded Pie (All Slices)', desc: 'Separated slices for individual review' },
      { id: 'pie_of_pie', name: 'Pie of Pie', desc: 'Secondary pie detailing small percentage segments' },
      { id: 'bar_of_pie', name: 'Bar of Pie', desc: 'Sub-bar extending from smallest slices' },
    ],
  },
  {
    id: 'bar',
    name: 'Bar Charts (Horizontal)',
    icon: BarChart3,
    subtypes: [
      { id: 'bar_2d_clustered', name: '2D Clustered Horizontal Bar', desc: 'Best for comparing long category names' },
      { id: 'bar_2d_stacked', name: '2D Stacked Horizontal Bar', desc: 'Horizontal parts of a whole' },
      { id: 'bar_2d_100_stacked', name: '2D 100% Stacked Bar', desc: 'Horizontal percentage breakdown' },
      { id: 'bar_3d_clustered', name: '3D Clustered Bar', desc: 'Horizontal bars with 3D extrusions' },
      { id: 'bar_cylinder', name: 'Horizontal Cylinder Bar', desc: 'Horizontal rounded pipes' },
      { id: 'bar_cone', name: 'Horizontal Cone Bar', desc: 'Tapered horizontal pointers' },
      { id: 'bar_pyramid', name: 'Horizontal Pyramid Bar', desc: 'Horizontal triangular bars' },
    ],
  },
  {
    id: 'area',
    name: 'Area Charts',
    icon: Layers,
    subtypes: [
      { id: 'area_2d', name: '2D Area Chart', desc: 'Emphasize magnitude of change over time' },
      { id: 'area_stacked', name: 'Stacked Area', desc: 'Trend of cumulative volume' },
      { id: 'area_100_stacked', name: '100% Stacked Area', desc: 'Percentage contribution over time' },
      { id: 'area_3d', name: '3D Deep Area', desc: 'Isometric volumetric area surfaces' },
    ],
  },
  {
    id: 'scatter',
    name: 'X Y (Scatter)',
    icon: CircleDot,
    subtypes: [
      { id: 'scatter_markers', name: 'Scatter with Markers Only', desc: 'Correlation between two quantitative values' },
      { id: 'scatter_smooth', name: 'Scatter with Smooth Lines', desc: 'Fitted smooth regression trajectory' },
      { id: 'scatter_straight', name: 'Scatter with Straight Lines', desc: 'Direct point-to-point connections' },
    ],
  },
  {
    id: 'stock',
    name: 'Stock & Candlestick',
    icon: Activity,
    subtypes: [
      { id: 'stock_hlc', name: 'High-Low-Close (HLC)', desc: 'Trading volatility ranges without opening price' },
      { id: 'stock_candlestick', name: 'Candlestick (Open-High-Low-Close)', desc: 'Green/Red Japanese candlesticks with real wicks' },
      { id: 'stock_vhlc', name: 'Volume-High-Low-Close (VHLC)', desc: 'Combines trading volume with market range' },
    ],
  },
  {
    id: 'surface',
    name: 'Surface Charts',
    icon: Grid,
    subtypes: [
      { id: 'surface_3d', name: '3D Surface Wireframe', desc: 'Find optimum combinations between two sets of data' },
      { id: 'surface_contour', name: 'Contour Heatmap Topographic', desc: '2D top view of 3D surface zones' },
    ],
  },
  {
    id: 'doughnut',
    name: 'Doughnut Charts',
    icon: PieChart,
    subtypes: [
      { id: 'doughnut_2d', name: 'Standard Doughnut', desc: 'Center hole for key KPI metric' },
      { id: 'doughnut_exploded', name: 'Exploded Doughnut', desc: 'Separated ring segments for contrast' },
    ],
  },
  {
    id: 'bubble',
    name: 'Bubble Charts',
    icon: CircleDot,
    subtypes: [
      { id: 'bubble_2d', name: '2D Bubble Chart', desc: '3 variables: X position, Y position, Bubble size' },
      { id: 'bubble_3d', name: '3D Shaded Bubble', desc: 'Radial shaded spheres with depth' },
    ],
  },
  {
    id: 'radar',
    name: 'Radar & Spider',
    icon: Activity,
    subtypes: [
      { id: 'radar_line', name: 'Radar / Spider Web', desc: 'Compare aggregate values of multiple data series' },
      { id: 'radar_markers', name: 'Radar with Data Markers', desc: 'Spider web with bold data vertices' },
      { id: 'radar_filled', name: 'Filled Radar Area', desc: 'Translucent polygon fill highlighting overall coverage' },
    ],
  },
];

export function ChartStudioModal({
  initialConfig,
  isOpen,
  onClose,
  onSaveChart,
}: ChartStudioModalProps) {
  const [activeTab, setActiveTab] = useState<'builder' | 'presets'>('builder');
  const [selectedCategory, setSelectedCategory] = useState<ChartMainCategory>('column');

  // Chart config states
  const [chartType, setChartType] = useState<ChartType>(initialConfig?.type || 'col_2d_clustered');
  const [title, setTitle] = useState(initialConfig?.title || 'Financial Growth & Return Analysis');
  const [subtitle, setSubtitle] = useState(initialConfig?.subtitle || 'Calculated Projection over 5 Periods');
  const [unitPrefix, setUnitPrefix] = useState(initialConfig?.unitPrefix || '$');
  const [unitSuffix, setUnitSuffix] = useState(initialConfig?.unitSuffix || '');
  const [series1Name, setSeries1Name] = useState(initialConfig?.series1Name || 'Value');
  const [series2Name, setSeries2Name] = useState(initialConfig?.series2Name || 'Baseline');
  const [colorTheme, setColorTheme] = useState<'purple' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate'>(
    initialConfig?.colorTheme || 'purple'
  );

  // Spreadsheet Data Grid State
  const [dataRows, setDataRows] = useState<{ label: string; value: number; value2?: number; value3?: number; value4?: number }[]>(
    initialConfig?.data && initialConfig.data.length > 0
      ? initialConfig.data
      : [
          { label: 'Year 1', value: 1000, value2: 1000, value3: 1200, value4: 900 },
          { label: 'Year 2', value: 2400, value2: 2000, value3: 2600, value4: 1900 },
          { label: 'Year 3', value: 4200, value2: 3000, value3: 4500, value4: 2800 },
          { label: 'Year 4', value: 6800, value2: 4000, value3: 7100, value4: 3800 },
          { label: 'Year 5', value: 10500, value2: 5000, value3: 11000, value4: 4800 },
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
    series2Name,
    colorTheme,
    data: dataRows.map((r) => ({
      label: r.label.trim() || 'Period',
      value: Number(r.value) || 0,
      value2: r.value2 !== undefined ? Number(r.value2) || 0 : undefined,
      value3: r.value3 !== undefined ? Number(r.value3) || 0 : undefined,
      value4: r.value4 !== undefined ? Number(r.value4) || 0 : undefined,
    })),
  };

  const currentCatDef = EXCEL_CHART_CATEGORIES.find((c) => c.id === selectedCategory) || EXCEL_CHART_CATEGORIES[0];

  const handleAddRow = () => {
    setDataRows([
      ...dataRows,
      {
        label: `Item ${dataRows.length + 1}`,
        value: 1000,
        value2: 800,
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
      <div className="bg-white border border-[#DDD6FE] rounded-3xl shadow-2xl max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 font-sans">
        
        {/* Header */}
        <header className="p-4 sm:p-5 border-b border-[#EDE9FE] bg-[#FAF9FE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white flex items-center justify-center shadow-md">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#1E1035] flex items-center gap-2">
                <span>Excel-Complete Chart Studio (2D, 3D, Cylinder, Cone, Pyramid &amp; Financials)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF5FF] text-[#7C3AED] border border-[#DDD6FE]">
                  Full SVG Precision
                </span>
              </h3>
              <p className="text-xs text-[#6D6582]">
                Create, customize and live-preview Column, Cylinder, Cone, Pyramid, Line, Pie, Candlestick, Radar, and Surface charts.
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
            🛠️ Excel Chart Type Selector &amp; Data Grid
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
            ⚡ Financial &amp; Math Presets
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
                      {preset.config.type.replace(/_/g, ' ')}
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
              
              {/* ========================================================================= */}
              {/* STEP 1: EXCEL CHART CATEGORY & SUBTYPE PICKER */}
              {/* ========================================================================= */}
              <div className="space-y-3 bg-[#FAF9FE] p-4 rounded-2xl border border-[#EDE9FE]">
                <div>
                  <label className="block text-xs font-heading font-bold text-[#1E1035] uppercase tracking-wider mb-2">
                    1. Choose Microsoft Excel Chart Category:
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {EXCEL_CHART_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            // default to first subtype of category
                            setChartType(cat.subtypes[0].id);
                          }}
                          className={`px-3 py-2 rounded-xl border text-xs font-heading font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-xs'
                              : 'bg-white border-[#EDE9FE] text-[#6D6582] hover:border-[#DDD6FE] hover:text-[#1E1035]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subtypes for Selected Category */}
                <div>
                  <label className="block text-xs font-heading font-bold text-[#1E1035] uppercase tracking-wider mb-2">
                    2. Select Exact Sub-Type for &ldquo;{currentCatDef.name}&rdquo; ({currentCatDef.subtypes.length} options):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {currentCatDef.subtypes.map((sub) => {
                      const isSelected = chartType === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setChartType(sub.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#FAF5FF] border-[#7C3AED] text-[#7C3AED] shadow-2xs ring-2 ring-[#7C3AED]/20'
                              : 'bg-white border-[#EDE9FE] text-[#4B3E65] hover:border-[#DDD6FE] hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <span className="font-heading font-bold text-xs text-[#1E1035] flex-1">
                              {sub.name}
                            </span>
                            {sub.badge && (
                              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 shrink-0">
                                {sub.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#6D6582] line-clamp-1">{sub.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* STEP 2: CHART TITLE, SUBTITLE, PREFIX, SUFFIX, THEME */}
              {/* ========================================================================= */}
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
                  <label className="font-heading font-bold text-[#1E1035]">Color Palette</label>
                  <select
                    value={colorTheme}
                    onChange={(e: any) => setColorTheme(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#DDD6FE] rounded-xl text-[#1E1035] font-semibold outline-none cursor-pointer focus:border-[#7C3AED]"
                  >
                    <option value="purple">Royal Purple (Default)</option>
                    <option value="emerald">Emerald Green (Profits)</option>
                    <option value="blue">Ocean Blue (Corporate)</option>
                    <option value="amber">Warm Gold (Returns)</option>
                    <option value="rose">Sunset Rose (High Growth)</option>
                    <option value="slate">Monochrome Slate (Technical)</option>
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

                <div>
                  <label className="block text-[11px] font-bold text-[#6D6582] mb-1">
                    Series 2 Label (Dual / Open):
                  </label>
                  <input
                    type="text"
                    value={series2Name}
                    onChange={(e) => setSeries2Name(e.target.value)}
                    placeholder="Series 2 Name"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#DDD6FE] rounded-lg font-semibold text-[#1E1035]"
                  />
                </div>
              </div>

              {/* ========================================================================= */}
              {/* STEP 3: SPREADSHEET-LIKE DATA GRID */}
              {/* ========================================================================= */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-heading font-bold text-[#1E1035] uppercase tracking-wider">
                      Spreadsheet Data Table ({dataRows.length} rows)
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
                          {selectedCategory === 'stock' ? 'Close Price' : series1Name || 'Value 1'} ({unitPrefix}
                          {unitSuffix})
                        </th>
                        <th className="p-2.5">
                          {selectedCategory === 'stock' ? 'Open Price' : series2Name || 'Value 2'} ({unitPrefix}
                          {unitSuffix})
                        </th>
                        {selectedCategory === 'stock' && (
                          <>
                            <th className="p-2.5">High Price</th>
                            <th className="p-2.5">Low Price</th>
                          </>
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
                          {selectedCategory === 'stock' && (
                            <>
                              <td className="p-2">
                                <input
                                  type="number"
                                  step="any"
                                  value={row.value3 ?? row.value * 1.05}
                                  onChange={(e) => {
                                    const copy = [...dataRows];
                                    copy[idx].value3 = Number(e.target.value) || 0;
                                    setDataRows(copy);
                                  }}
                                  className="w-full px-2 py-1 bg-[#FAF9FE] border border-[#EDE9FE] focus:border-[#7C3AED] rounded-md text-emerald-700 font-mono font-semibold outline-none"
                                  placeholder="High"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  step="any"
                                  value={row.value4 ?? row.value * 0.95}
                                  onChange={(e) => {
                                    const copy = [...dataRows];
                                    copy[idx].value4 = Number(e.target.value) || 0;
                                    setDataRows(copy);
                                  }}
                                  className="w-full px-2 py-1 bg-[#FAF9FE] border border-[#EDE9FE] focus:border-[#7C3AED] rounded-md text-rose-700 font-mono font-semibold outline-none"
                                  placeholder="Low"
                                />
                              </td>
                            </>
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

              {/* ========================================================================= */}
              {/* STEP 4: LIVE INTERACTIVE SVG PREVIEW */}
              {/* ========================================================================= */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-heading font-bold text-[#7C3AED]">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Real-Time Interactive SVG Preview ({currentPreviewConfig.type}):</span>
                  </div>
                  <span className="text-[11px] text-[#6D6582]">Exact visual match as rendered in published article</span>
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
            Category: <strong className="text-[#1E1035]">{currentCatDef.name}</strong> • Type: <strong className="text-[#7C3AED] font-mono">{chartType}</strong>
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
