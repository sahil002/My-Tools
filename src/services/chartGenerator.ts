/**
 * PRBSolver Interactive Chart Generator
 * 
 * Generates self-contained, responsive, high-definition SVG & HTML financial charts
 * that render flawlessly across the Admin Editor, Blog Article View, and exports.
 */

export interface ChartDataset {
  name: string;
  color: string;
  values: number[];
}

export interface ChartConfig {
  id?: string;
  type: 'bar' | 'horizontal-bar' | 'donut' | 'area' | 'line';
  title: string;
  subtitle?: string;
  unitPrefix?: string;
  unitSuffix?: string;
  labels: string[];
  datasets: ChartDataset[];
  showTable?: boolean;
}

export const CHART_PRESETS: { id: string; name: string; description: string; config: ChartConfig }[] = [
  {
    id: 'compound-interest',
    name: 'Compound Interest Growth Curve (30-Year Projection)',
    description: 'Shows principal deposits vs compound growth over 30 years',
    config: {
      type: 'area',
      title: '30-Year Compound Interest vs Principal Invested',
      subtitle: '$500/month at 8% annual return compounded monthly',
      unitPrefix: '$',
      unitSuffix: '',
      labels: ['Year 0', 'Year 5', 'Year 10', 'Year 15', 'Year 20', 'Year 25', 'Year 30'],
      datasets: [
        {
          name: 'Principal Invested',
          color: '#A78BFA',
          values: [1000, 31000, 61000, 91000, 121000, 151000, 181000],
        },
        {
          name: 'Total Balance (With Interest)',
          color: '#7C3AED',
          values: [1000, 38250, 94200, 178900, 307200, 500500, 796400],
        },
      ],
      showTable: true,
    },
  },
  {
    id: 'mortgage-breakdown',
    name: 'Monthly Mortgage / Loan Payment Breakdown',
    description: 'Donut chart showing Principal, Interest, Taxes, and Insurance',
    config: {
      type: 'donut',
      title: 'Typical Monthly Housing Payment Distribution',
      subtitle: '$400,000 loan at 6.5% interest rate',
      unitPrefix: '$',
      unitSuffix: '/mo',
      labels: ['Principal', 'Interest', 'Property Taxes', 'Home Insurance'],
      datasets: [
        {
          name: 'Monthly Payment',
          color: '#7C3AED',
          values: [720, 1808, 450, 140],
        },
      ],
      showTable: true,
    },
  },
  {
    id: 'asset-allocation',
    name: 'Classic Three-Fund Investment Portfolio',
    description: 'Target asset distribution across asset classes',
    config: {
      type: 'donut',
      title: 'Balanced Long-Term Investment Allocation',
      subtitle: 'Global diversification strategy for growth and risk control',
      unitPrefix: '',
      unitSuffix: '%',
      labels: ['US Equities (Total Market)', 'International Stocks', 'Bonds / Fixed Income', 'Real Estate / Cash'],
      datasets: [
        {
          name: 'Portfolio Share',
          color: '#7C3AED',
          values: [50, 25, 15, 10],
        },
      ],
      showTable: true,
    },
  },
  {
    id: 'savings-comparison',
    name: 'Savings Rate vs Years to Financial Independence',
    description: 'Bar chart comparing how saving 10% vs 50% cuts retirement years',
    config: {
      type: 'bar',
      title: 'Impact of Savings Rate on Time to Retirement',
      subtitle: 'Assumes 5% real investment return and 4% safe withdrawal rate',
      unitPrefix: '',
      unitSuffix: ' Yrs',
      labels: ['10% Saved', '20% Saved', '30% Saved', '40% Saved', '50% Saved'],
      datasets: [
        {
          name: 'Years to Retirement',
          color: '#7C3AED',
          values: [51, 37, 28, 22, 17],
        },
      ],
      showTable: true,
    },
  },
];

/**
 * Format a numerical value with prefix and suffix (e.g. $1,250 or 50%)
 */
function formatVal(val: number, prefix = '', suffix = ''): string {
  return `${prefix}${val.toLocaleString()}${suffix}`;
}

/**
 * Render a complete interactive chart HTML container
 */
export function generateChartHtml(config: ChartConfig): string {
  const chartId = config.id || `chart-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const jsonEncoded = encodeURIComponent(JSON.stringify(config));

  const prefix = config.unitPrefix || '';
  const suffix = config.unitSuffix || '';

  let chartVisualSvg = '';

  if (config.type === 'donut') {
    // DONUT / PIE CHART SVG
    const values = config.datasets[0]?.values || [];
    const total = values.reduce((a, b) => a + b, 0) || 1;
    const colors = [
      '#7C3AED', '#2563EB', '#059669', '#D97706', '#E11D48', '#4F46E5', '#0891B2', '#475569'
    ];

    let currentAngle = 0;
    const size = 260;
    const center = size / 2;
    const radius = 95;
    const innerRadius = 55;

    const paths: string[] = [];

    values.forEach((v, idx) => {
      const sliceAngle = (v / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const x3 = center + innerRadius * Math.cos(endRad);
      const y3 = center + innerRadius * Math.sin(endRad);
      const x4 = center + innerRadius * Math.cos(startRad);
      const y4 = center + innerRadius * Math.sin(startRad);

      const largeArc = sliceAngle > 180 ? 1 : 0;
      const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
      const color = colors[idx % colors.length];

      paths.push(`
        <path d="${d}" fill="${color}" stroke="#FFFFFF" stroke-width="2" class="transition-opacity hover:opacity-85">
          <title>${config.labels[idx] || ''}: ${formatVal(v, prefix, suffix)} (${Math.round((v / total) * 100)}%)</title>
        </path>
      `);
    });

    chartVisualSvg = `
      <div class="flex flex-col md:flex-row items-center justify-center gap-6 py-4">
        <svg viewBox="0 0 ${size} ${size}" class="w-56 h-56 shrink-0 drop-shadow-xs">
          ${paths.join('')}
          <circle cx="${center}" cy="${center}" r="${innerRadius - 4}" fill="#FAF9FE" />
          <text x="${center}" y="${center - 6}" text-anchor="middle" font-size="10" font-family="sans-serif" font-weight="bold" fill="#6D6582" text-transform="uppercase">TOTAL</text>
          <text x="${center}" y="${center + 14}" text-anchor="middle" font-size="14" font-family="monospace" font-weight="bold" fill="#1E1035">${formatVal(total, prefix, suffix)}</text>
        </svg>

        <div class="space-y-2 text-xs flex-1 max-w-sm">
          ${values.map((v, i) => {
            const color = colors[i % colors.length];
            const pct = Math.round((v / total) * 100);
            return `
              <div class="flex items-center justify-between p-2 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-md shrink-0" style="background-color: ${color};"></span>
                  <span class="font-heading font-semibold text-[#1E1035]">${config.labels[i] || `Item ${i + 1}`}</span>
                </div>
                <div class="flex items-center gap-2 font-mono">
                  <span class="font-bold text-[#1E1035]">${formatVal(v, prefix, suffix)}</span>
                  <span class="text-[10px] text-[#6D6582] bg-white px-1.5 py-0.5 rounded border border-[#EDE9FE]">${pct}%</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else if (config.type === 'horizontal-bar') {
    // HORIZONTAL BAR CHART
    const values = config.datasets[0]?.values || [];
    const maxVal = Math.max(...values, 1);
    chartVisualSvg = `
      <div class="space-y-3 py-3">
        ${values.map((v, i) => {
          const pct = Math.round((v / maxVal) * 100);
          return `
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="font-heading font-semibold text-[#1E1035]">${config.labels[i] || `Item ${i + 1}`}</span>
                <span class="font-mono font-bold text-[#7C3AED]">${formatVal(v, prefix, suffix)}</span>
              </div>
              <div class="w-full h-4 bg-[#FAF5FF] rounded-full overflow-hidden border border-[#DDD6FE] p-0.5">
                <div class="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] transition-all" style="width: ${pct}%;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else if (config.type === 'area' || config.type === 'line') {
    // AREA OR LINE CHART
    const width = 640;
    const height = 260;
    const paddingLeft = 55;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 45;

    const allValues = config.datasets.flatMap((d) => d.values);
    const maxVal = Math.max(...allValues, 100);
    const minVal = 0;

    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;
    const n = config.labels.length;

    // Y Axis Grid lines (4 ticks)
    const yTicks = [0, maxVal * 0.33, maxVal * 0.66, maxVal];
    const gridLines = yTicks.map((tick) => {
      const y = paddingTop + chartH - ((tick - minVal) / (maxVal - minVal)) * chartH;
      return `
        <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="#EDE9FE" stroke-dasharray="4" />
        <text x="${paddingLeft - 8}" y="${y + 3}" text-anchor="end" font-size="9" fill="#9D95B3" font-family="monospace">${formatVal(Math.round(tick), prefix, suffix)}</text>
      `;
    }).join('');

    // X Axis Labels
    const xLabels = config.labels.map((label, i) => {
      const x = paddingLeft + (i / (n - 1 || 1)) * chartW;
      return `
        <text x="${x}" y="${height - 12}" text-anchor="middle" font-size="10" fill="#6D6582" font-family="sans-serif" font-weight="600">${label}</text>
      `;
    }).join('');

    // Render each dataset
    const datasetElements = config.datasets.map((ds, dsIdx) => {
      const points = ds.values.map((v, i) => {
        const x = paddingLeft + (i / (n - 1 || 1)) * chartW;
        const y = paddingTop + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;
        return { x, y, v };
      });

      const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      const areaPath = `${pathData} L ${points[points.length - 1].x.toFixed(1)} ${paddingTop + chartH} L ${points[0].x.toFixed(1)} ${paddingTop + chartH} Z`;
      const gradientId = `grad-${chartId}-${dsIdx}`;

      return `
        <defs>
          <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${ds.color}" stop-opacity="${config.type === 'area' ? '0.35' : '0.05'}" />
            <stop offset="100%" stop-color="${ds.color}" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path d="${areaPath}" fill="url(#${gradientId})" />
        <path d="${pathData}" fill="none" stroke="${ds.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        ${points.map((p, i) => `
          <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="#FFFFFF" stroke="${ds.color}" stroke-width="2.5">
            <title>${config.labels[i]}: ${formatVal(p.v, prefix, suffix)}</title>
          </circle>
        `).join('')}
      `;
    }).join('');

    chartVisualSvg = `
      <div class="overflow-x-auto py-2">
        <svg viewBox="0 0 ${width} ${height}" class="w-full h-auto min-w-[480px]">
          ${gridLines}
          ${datasetElements}
          ${xLabels}
        </svg>
      </div>
    `;
  } else {
    // VERTICAL BAR / COLUMN CHART
    const width = 640;
    const height = 260;
    const paddingLeft = 55;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 45;

    const allValues = config.datasets.flatMap((d) => d.values);
    const maxVal = Math.max(...allValues, 100);
    const minVal = 0;

    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;
    const n = config.labels.length;
    const numDatasets = config.datasets.length;
    const groupW = chartW / n;
    const barW = Math.min(36, (groupW * 0.7) / numDatasets);

    const yTicks = [0, maxVal * 0.33, maxVal * 0.66, maxVal];
    const gridLines = yTicks.map((tick) => {
      const y = paddingTop + chartH - ((tick - minVal) / (maxVal - minVal)) * chartH;
      return `
        <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="#EDE9FE" stroke-dasharray="4" />
        <text x="${paddingLeft - 8}" y="${y + 3}" text-anchor="end" font-size="9" fill="#9D95B3" font-family="monospace">${formatVal(Math.round(tick), prefix, suffix)}</text>
      `;
    }).join('');

    const bars = config.labels.map((label, labelIdx) => {
      const groupX = paddingLeft + labelIdx * groupW + groupW / 2;
      const groupStart = groupX - (numDatasets * barW) / 2;

      const datasetBars = config.datasets.map((ds, dsIdx) => {
        const val = ds.values[labelIdx] || 0;
        const barH = ((val - minVal) / (maxVal - minVal)) * chartH;
        const x = groupStart + dsIdx * barW;
        const y = paddingTop + chartH - barH;

        return `
          <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(barW - 3).toFixed(1)}" height="${barH.toFixed(1)}" rx="4" fill="${ds.color}" class="transition-opacity hover:opacity-85">
            <title>${ds.name} (${label}): ${formatVal(val, prefix, suffix)}</title>
          </rect>
          <text x="${(x + barW / 2 - 1.5).toFixed(1)}" y="${(y - 5).toFixed(1)}" text-anchor="middle" font-size="8.5" font-family="monospace" font-weight="bold" fill="#1E1035">${formatVal(val, prefix, suffix)}</text>
        `;
      }).join('');

      return `
        ${datasetBars}
        <text x="${groupX.toFixed(1)}" y="${height - 12}" text-anchor="middle" font-size="9.5" fill="#6D6582" font-family="sans-serif" font-weight="600">${label}</text>
      `;
    }).join('');

    chartVisualSvg = `
      <div class="overflow-x-auto py-2">
        <svg viewBox="0 0 ${width} ${height}" class="w-full h-auto min-w-[480px]">
          ${gridLines}
          ${bars}
        </svg>
      </div>
    `;
  }

  // Legend
  const legendHtml = config.datasets.length > 1 || config.type === 'area' || config.type === 'line' ? `
    <div class="flex items-center justify-center gap-4 flex-wrap pt-2 border-t border-[#EDE9FE] text-xs">
      ${config.datasets.map((ds) => `
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm" style="background-color: ${ds.color};"></span>
          <span class="font-heading font-semibold text-[#1E1035]">${ds.name}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  // Data Summary Table (Excel-like companion breakdown)
  let tableHtml = '';
  if (config.showTable !== false && config.type !== 'donut') {
    tableHtml = `
      <div class="mt-4 pt-3 border-t border-[#EDE9FE] overflow-x-auto">
        <table class="w-full text-xs divide-y divide-[#EDE9FE] bg-white border border-[#DDD6FE] rounded-xl overflow-hidden shadow-2xs">
          <thead class="bg-[#FAF9FE] text-[#1E1035] font-heading font-bold">
            <tr>
              <th class="p-2.5 text-left border-r border-[#EDE9FE]">Data Point / Period</th>
              ${config.datasets.map((ds) => `<th class="p-2.5 text-right border-r border-[#EDE9FE] last:border-r-0">${ds.name}</th>`).join('')}
            </tr>
          </thead>
          <tbody class="divide-y divide-[#EDE9FE] text-[#372E4C] font-mono">
            ${config.labels.map((lbl, idx) => `
              <tr class="hover:bg-[#FAF9FE] transition-colors">
                <td class="p-2.5 font-sans font-medium text-[#1E1035] border-r border-[#EDE9FE]">${lbl}</td>
                ${config.datasets.map((ds) => `<td class="p-2.5 text-right font-bold text-[#7C3AED] border-r border-[#EDE9FE] last:border-r-0">${formatVal(ds.values[idx] || 0, prefix, suffix)}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  return `
    <figure class="interactive-chart-block my-8 p-5 sm:p-6 bg-white border border-[#DDD6FE] rounded-2xl shadow-xs clear-both" data-chart-json="${jsonEncoded}">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EDE9FE] pb-3 mb-2">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-md text-[10px] font-heading font-bold uppercase tracking-wider bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">Interactive Financial Chart</span>
            <span class="text-[10px] text-[#9D95B3] font-mono capitalize">${config.type.replace('-', ' ')} view</span>
          </div>
          <h4 class="text-base sm:text-lg font-heading font-bold text-[#1E1035] mt-1">${config.title}</h4>
          ${config.subtitle ? `<p class="text-xs text-[#6D6582] mt-0.5">${config.subtitle}</p>` : ''}
        </div>
      </div>

      ${chartVisualSvg}
      ${legendHtml}
      ${tableHtml}

      <div class="mt-3 pt-2 border-t border-[#F5F3FF] flex items-center justify-between text-[11px] text-[#9D95B3]">
        <span class="flex items-center gap-1 font-sans">
          <span>Verified Financial Model</span>
        </span>
        <span class="font-mono">PRBSolver Chart Studio</span>
      </div>
    </figure>
  `;
}
