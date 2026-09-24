import JSZip from 'jszip';
import { TOOLS } from '../data/tools';
import {
  getAllDBCustomTools,
  getDBCustomToolBySlug,
  putDBCustomTool,
  deleteDBCustomTool,
  getDBStatusOverrides,
  setDBStatusOverride,
  DBToolRecord,
} from './toolStorageDB';
import { ToolCategory } from '../types';

export interface FileManifestItem {
  path: string;
  size: number;
  mimeType: string;
}

export interface ZipValidationResult {
  valid: boolean;
  error?: string;
  filesCount: number;
  totalSize: number;
  entryHtmlPath: string;
  fileManifest: FileManifestItem[];
  extractedHtml: string;
  zipFileName: string;
}

export interface ToolListItem {
  id: string;
  name: string;
  slug: string;
  category: ToolCategory;
  description: string;
  longDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  iconName: string;
  thumbnailUrl?: string;
  keywords: string[];
  featured: boolean;
  popular: boolean;
  status: 'active' | 'inactive';
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
  zipFileName?: string;
  zipFileSize?: number;
  filesCount?: number;
  entryHtmlPath?: string;
  performance: {
    views: number;
    invocations: number;
    avgDurationSec: number;
    rating: number;
  };
}

const MAX_ZIP_SIZE = 25 * 1024 * 1024; // 25 MB

const FORBIDDEN_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.bash',
  '.php',
  '.phtml',
  '.py',
  '.rb',
  '.pl',
  '.cgi',
  '.msi',
  '.vbs',
  '.jar',
  '.jsp',
  '.asp',
  '.aspx',
  '.dll',
  '.so',
];

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'html':
    case 'htm':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'js':
    case 'mjs':
      return 'application/javascript';
    case 'json':
      return 'application/json';
    case 'svg':
      return 'image/svg+xml';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'woff':
      return 'font/woff';
    case 'woff2':
      return 'font/woff2';
    case 'ttf':
      return 'font/ttf';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Validates, sanitizes, and extracts a zip package for sandboxed embedding
 */
export async function validateAndExtractZip(
  file: File,
  onProgress?: (percent: number, step: string) => void
): Promise<ZipValidationResult> {
  // 1. Check size limit
  if (file.size > MAX_ZIP_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the 25 MB security limit (uploaded: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
      filesCount: 0,
      totalSize: file.size,
      entryHtmlPath: '',
      fileManifest: [],
      extractedHtml: '',
      zipFileName: file.name,
    };
  }

  // 2. Check filename extension
  if (!file.name.toLowerCase().endsWith('.zip')) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload a standard compressed .zip archive.',
      filesCount: 0,
      totalSize: file.size,
      entryHtmlPath: '',
      fileManifest: [],
      extractedHtml: '',
      zipFileName: file.name,
    };
  }

  onProgress?.(20, 'Reading and uncompressing archive...');

  let zip: JSZip;
  try {
    const arrayBuffer = await file.arrayBuffer();
    zip = await JSZip.loadAsync(arrayBuffer);
  } catch (err) {
    return {
      valid: false,
      error: `Corrupt or invalid zip archive: ${err instanceof Error ? err.message : 'Unable to parse zip'}`,
      filesCount: 0,
      totalSize: file.size,
      entryHtmlPath: '',
      fileManifest: [],
      extractedHtml: '',
      zipFileName: file.name,
    };
  }

  onProgress?.(45, 'Sanitizing file paths and extensions...');

  // 3. Inspect all files in zip
  const manifest: FileManifestItem[] = [];
  const entries = Object.keys(zip.files);

  if (entries.length === 0) {
    return {
      valid: false,
      error: 'Archive is empty. Please upload a package containing your tool assets.',
      filesCount: 0,
      totalSize: file.size,
      entryHtmlPath: '',
      fileManifest: [],
      extractedHtml: '',
      zipFileName: file.name,
    };
  }

  let indexHtmlEntry: JSZip.JSZipObject | null = null;
  let indexHtmlPath = '';
  let calculatedTotalSize = 0;

  for (const path of entries) {
    const zipEntry = zip.files[path];
    if (zipEntry.dir) continue;

    const lowerPath = path.toLowerCase();

    // Security check: Directory traversal
    if (path.includes('../') || path.includes('..\\')) {
      return {
        valid: false,
        error: `Security violation: Path traversal detected in filename "${path}".`,
        filesCount: 0,
        totalSize: file.size,
        entryHtmlPath: '',
        fileManifest: [],
        extractedHtml: '',
        zipFileName: file.name,
      };
    }

    // Security check: Executables or server-side scripts
    for (const forbidden of FORBIDDEN_EXTENSIONS) {
      if (lowerPath.endsWith(forbidden)) {
        return {
          valid: false,
          error: `Security violation: Disallowed executable or server script "${path}" (${forbidden}) detected. Only client-side web assets (HTML/CSS/JS/images) are permitted in sandboxed embedding.`,
          filesCount: 0,
          totalSize: file.size,
          entryHtmlPath: '',
          fileManifest: [],
          extractedHtml: '',
          zipFileName: file.name,
        };
      }
    }

    // Identify entry point (index.html in root or in top-level directory)
    if (lowerPath === 'index.html' || lowerPath.endsWith('/index.html')) {
      // Prefer root index.html if available, or first encountered
      if (!indexHtmlEntry || lowerPath === 'index.html') {
        indexHtmlEntry = zipEntry;
        indexHtmlPath = path;
      }
    }

    const estimatedSize = (zipEntry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize || 1024;
    calculatedTotalSize += estimatedSize;

    manifest.push({
      path,
      size: estimatedSize,
      mimeType: getMimeType(path),
    });
  }

  // 4. Validate entry file
  if (!indexHtmlEntry) {
    return {
      valid: false,
      error: 'Missing required entry file: "index.html" was not found in the root or top-level directory of the archive.',
      filesCount: manifest.length,
      totalSize: calculatedTotalSize,
      entryHtmlPath: '',
      fileManifest: manifest,
      extractedHtml: '',
      zipFileName: file.name,
    };
  }

  onProgress?.(70, 'Resolving and inlining sandboxed bundle assets...');

  // 5. Read all text and asset files to create self-contained executable document
  const rawIndexHtml = await indexHtmlEntry.async('string');
  const basePath = indexHtmlPath.includes('/')
    ? indexHtmlPath.substring(0, indexHtmlPath.lastIndexOf('/') + 1)
    : '';

  // Extract CSS, JS, and image files to assemble self-contained document
  let transformedHtml = rawIndexHtml;

  // Inline CSS files
  const cssMatches = Array.from(rawIndexHtml.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi));
  for (const match of cssMatches) {
    const fullTag = match[0];
    const href = match[1];
    if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//')) {
      const targetPath = (basePath + href).replace(/^\.\//, '');
      const cssEntry = zip.files[targetPath] || zip.files[href];
      if (cssEntry) {
        try {
          const cssContent = await cssEntry.async('string');
          transformedHtml = transformedHtml.replace(
            fullTag,
            `<style data-source="${href}">\n${cssContent}\n</style>`
          );
        } catch {
          // keep original if read fails
        }
      }
    }
  }

  // Inline JavaScript files
  const jsMatches = Array.from(rawIndexHtml.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/gi));
  for (const match of jsMatches) {
    const fullTag = match[0];
    const src = match[1];
    if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//')) {
      const targetPath = (basePath + src).replace(/^\.\//, '');
      const jsEntry = zip.files[targetPath] || zip.files[src];
      if (jsEntry) {
        try {
          const jsContent = await jsEntry.async('string');
          transformedHtml = transformedHtml.replace(
            fullTag,
            `<script data-source="${src}">\n${jsContent}\n</script>`
          );
        } catch {
          // keep original if read fails
        }
      }
    }
  }

  // Inline images as Base64 Data URLs where possible
  const imgMatches = Array.from(rawIndexHtml.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi));
  for (const match of imgMatches) {
    const src = match[1];
    if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:')) {
      const targetPath = (basePath + src).replace(/^\.\//, '');
      const imgEntry = zip.files[targetPath] || zip.files[src];
      if (imgEntry) {
        try {
          const mime = getMimeType(targetPath);
          const base64 = await imgEntry.async('base64');
          const dataUrl = `data:${mime};base64,${base64}`;
          transformedHtml = transformedHtml.replaceAll(src, dataUrl);
        } catch {
          // ignore
        }
      }
    }
  }

  // Inject meta tag for sandbox-friendly viewport and clean typography
  if (!transformedHtml.includes('<meta name="viewport"')) {
    transformedHtml = transformedHtml.replace(
      '<head>',
      '<head>\n<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    );
  }

  onProgress?.(100, 'Extraction and sanitization complete!');

  return {
    valid: true,
    filesCount: manifest.length,
    totalSize: calculatedTotalSize,
    entryHtmlPath: indexHtmlPath,
    fileManifest: manifest,
    extractedHtml: transformedHtml,
    zipFileName: file.name,
  };
}

/**
 * Generates an instant sample zip file for 1-click testing
 */
export async function generateSampleToolZip(type: 'tip-calculator' | 'contrast-checker'): Promise<File> {
  const zip = new JSZip();

  if (type === 'tip-calculator') {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tip & Split Calculator</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="calculator-card">
    <div class="card-header">
      <h2>Tip & Bill Split Calculator</h2>
      <p>Quickly calculate gratuity and split total bills accurately</p>
    </div>

    <div class="input-group">
      <label for="bill">Bill Amount ($)</label>
      <input type="number" id="bill" value="85.00" min="0" step="0.01" />
    </div>

    <div class="tip-options">
      <label>Select Tip Percentage</label>
      <div class="buttons-row">
        <button class="tip-btn" data-tip="10">10%</button>
        <button class="tip-btn active" data-tip="15">15%</button>
        <button class="tip-btn" data-tip="18">18%</button>
        <button class="tip-btn" data-tip="20">20%</button>
      </div>
    </div>

    <div class="input-group">
      <label for="people">Number of People</label>
      <input type="number" id="people" value="2" min="1" step="1" />
    </div>

    <div class="results-grid">
      <div class="result-box">
        <span class="label">Tip Amount</span>
        <span class="value" id="tip-total">$12.75</span>
      </div>
      <div class="result-box">
        <span class="label">Total Bill</span>
        <span class="value" id="grand-total">$97.75</span>
      </div>
      <div class="result-box highlight">
        <span class="label">Amount Per Person</span>
        <span class="value" id="per-person">$48.88</span>
      </div>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`;

    const cssContent = `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #F4F6F9;
  color: #131A2B;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 16px;
}
.calculator-card {
  background: #FFFFFF;
  border: 1px solid #E4E8EF;
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(19, 26, 43, 0.05);
}
.card-header h2 { font-size: 18px; font-weight: 700; color: #131A2B; }
.card-header p { font-size: 12px; color: #5B6577; margin-top: 4px; margin-bottom: 20px; }
.input-group { margin-bottom: 16px; }
.input-group label { display: block; font-size: 12px; font-weight: 600; color: #5B6577; margin-bottom: 6px; }
.input-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E4E8EF;
  border-radius: 8px;
  font-size: 14px;
  color: #131A2B;
  outline: none;
}
.input-group input:focus { border-color: #2563EB; box-shadow: 0 0 0 2px rgba(37,99,235,0.15); }
.tip-options { margin-bottom: 16px; }
.tip-options label { display: block; font-size: 12px; font-weight: 600; color: #5B6577; margin-bottom: 6px; }
.buttons-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.tip-btn {
  background: #F4F6F9;
  border: 1px solid #E4E8EF;
  border-radius: 6px;
  padding: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #131A2B;
  cursor: pointer;
  transition: all 0.15s;
}
.tip-btn:hover { background: #E4E8EF; }
.tip-btn.active { background: #2563EB; color: #FFFFFF; border-color: #2563EB; }
.results-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #E4E8EF;
}
.result-box {
  background: #F4F6F9;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #E4E8EF;
}
.result-box.highlight {
  grid-column: span 2;
  background: #EAF1FF;
  border-color: #2563EB;
}
.result-box .label { display: block; font-size: 11px; color: #5B6577; font-weight: 500; }
.result-box .value { display: block; font-size: 18px; font-weight: 700; color: #131A2B; margin-top: 2px; }
.result-box.highlight .value { color: #2563EB; font-size: 22px; }`;

    const jsContent = `document.addEventListener('DOMContentLoaded', () => {
  const billInput = document.getElementById('bill');
  const peopleInput = document.getElementById('people');
  const tipButtons = document.querySelectorAll('.tip-btn');
  const tipTotalEl = document.getElementById('tip-total');
  const grandTotalEl = document.getElementById('grand-total');
  const perPersonEl = document.getElementById('per-person');

  let activeTip = 15;

  tipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tipButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTip = parseFloat(btn.dataset.tip);
      calculate();
    });
  });

  billInput.addEventListener('input', calculate);
  peopleInput.addEventListener('input', calculate);

  function calculate() {
    const bill = parseFloat(billInput.value) || 0;
    const people = Math.max(1, parseInt(peopleInput.value, 10) || 1);

    const tipAmount = bill * (activeTip / 100);
    const total = bill + tipAmount;
    const perPerson = total / people;

    tipTotalEl.textContent = '$' + tipAmount.toFixed(2);
    grandTotalEl.textContent = '$' + total.toFixed(2);
    perPersonEl.textContent = '$' + perPerson.toFixed(2);
  }

  calculate();
});`;

    zip.file('index.html', htmlContent);
    zip.file('style.css', cssContent);
    zip.file('app.js', jsContent);

    const blob = await zip.generateAsync({ type: 'blob' });
    return new File([blob], 'tip-split-calculator.zip', { type: 'application/zip' });
  } else {
    // Contrast checker sample
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Color Contrast Ratio Checker</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="contrast-card">
    <h2>WCAG Color Contrast Checker</h2>
    <p class="subtitle">Validate color pairings against WCAG 2.1 accessibility standards</p>

    <div class="inputs-row">
      <div class="color-field">
        <label>Foreground (Text)</label>
        <div class="picker-wrap">
          <input type="color" id="fgColor" value="#131A2B" />
          <input type="text" id="fgHex" value="#131A2B" />
        </div>
      </div>
      <div class="color-field">
        <label>Background</label>
        <div class="picker-wrap">
          <input type="color" id="bgColor" value="#FFFFFF" />
          <input type="text" id="bgHex" value="#FFFFFF" />
        </div>
      </div>
    </div>

    <div id="previewBox" class="preview-box">
      <h3>Live Preview Text</h3>
      <p>The quick brown fox jumps over the lazy dog. 1234567890</p>
    </div>

    <div class="ratio-display">
      <span class="ratio-label">Contrast Ratio:</span>
      <span id="ratioValue" class="ratio-num">18.5 : 1</span>
    </div>

    <div class="badges-grid">
      <div id="badgeAA" class="badge pass">WCAG AA Pass</div>
      <div id="badgeAAA" class="badge pass">WCAG AAA Pass</div>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`;

    const cssContent = `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #F4F6F9; padding: 16px; display: flex; justify-content: center; }
.contrast-card { background: #FFFFFF; border: 1px solid #E4E8EF; border-radius: 16px; width: 100%; max-width: 480px; padding: 24px; }
h2 { font-size: 18px; font-weight: 700; color: #131A2B; }
.subtitle { font-size: 12px; color: #5B6577; margin-top: 4px; margin-bottom: 20px; }
.inputs-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.color-field label { display: block; font-size: 11px; font-weight: 600; color: #5B6577; margin-bottom: 4px; }
.picker-wrap { display: flex; align-items: center; gap: 6px; border: 1px solid #E4E8EF; border-radius: 8px; padding: 4px 6px; }
.picker-wrap input[type="color"] { border: none; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; }
.picker-wrap input[type="text"] { border: none; font-size: 12px; font-family: monospace; outline: none; width: 100%; }
.preview-box { border: 1px solid #E4E8EF; border-radius: 8px; padding: 16px; margin-bottom: 16px; transition: all 0.2s; }
.ratio-display { display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #F4F6F9; border-radius: 8px; margin-bottom: 12px; }
.ratio-label { font-size: 13px; font-weight: 600; color: #5B6577; }
.ratio-num { font-size: 18px; font-weight: 700; color: #131A2B; font-family: monospace; }
.badges-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.badge { text-align: center; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 700; }
.badge.pass { background: #E9F8EF; color: #16A34A; border: 1px solid #16A34A; }
.badge.fail { background: #FEF2F2; color: #DC2626; border: 1px solid #DC2626; }`;

    const jsContent = `function getLuminance(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x+x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const [R, G, B] = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function update() {
  const fg = document.getElementById('fgColor').value;
  const bg = document.getElementById('bgColor').value;
  document.getElementById('fgHex').value = fg.toUpperCase();
  document.getElementById('bgHex').value = bg.toUpperCase();

  const preview = document.getElementById('previewBox');
  preview.style.color = fg;
  preview.style.backgroundColor = bg;

  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  document.getElementById('ratioValue').textContent = ratio.toFixed(2) + ' : 1';

  const aa = document.getElementById('badgeAA');
  const aaa = document.getElementById('badgeAAA');

  if (ratio >= 4.5) {
    aa.className = 'badge pass'; aa.textContent = 'WCAG AA Pass';
  } else {
    aa.className = 'badge fail'; aa.textContent = 'WCAG AA Fail';
  }

  if (ratio >= 7.0) {
    aaa.className = 'badge pass'; aaa.textContent = 'WCAG AAA Pass';
  } else {
    aaa.className = 'badge fail'; aaa.textContent = 'WCAG AAA Fail';
  }
}

document.getElementById('fgColor').addEventListener('input', update);
document.getElementById('bgColor').addEventListener('input', update);
update();`;

    zip.file('index.html', htmlContent);
    zip.file('style.css', cssContent);
    zip.file('app.js', jsContent);

    const blob = await zip.generateAsync({ type: 'blob' });
    return new File([blob], 'contrast-checker-bundle.zip', { type: 'application/zip' });
  }
}

/**
 * Returns merged tool records (built-in + custom)
 */
export async function getAllToolsList(): Promise<ToolListItem[]> {
  const [customTools, overrides] = await Promise.all([
    getAllDBCustomTools(),
    getDBStatusOverrides(),
  ]);

  // Transform built-in tools
  const builtInList: ToolListItem[] = TOOLS.map((t) => {
    const overrideStatus = overrides[t.id] || overrides[t.slug];
    const status = overrideStatus || t.status;

    // Simulated historical performance snapshot for built-in tools
    const perfDefaults: Record<string, { views: number; invocations: number; avgDurationSec: number; rating: number }> = {
      'percentage-calculator': { views: 42180, invocations: 38450, avgDurationSec: 142, rating: 4.9 },
      'age-calculator': { views: 31200, invocations: 27940, avgDurationSec: 98, rating: 4.8 },
      'word-counter': { views: 28400, invocations: 24100, avgDurationSec: 210, rating: 4.9 },
      'loan-calculator': { views: 12400, invocations: 8200, avgDurationSec: 165, rating: 4.7 },
      'gpa-calculator': { views: 9800, invocations: 6400, avgDurationSec: 120, rating: 4.6 },
      'unit-converter': { views: 18500, invocations: 14200, avgDurationSec: 85, rating: 4.8 },
      'json-formatter': { views: 15300, invocations: 12100, avgDurationSec: 190, rating: 4.9 },
      'password-generator': { views: 14200, invocations: 11800, avgDurationSec: 45, rating: 4.8 },
      'case-converter': { views: 8900, invocations: 7100, avgDurationSec: 72, rating: 4.7 },
      'character-counter': { views: 7600, invocations: 5900, avgDurationSec: 64, rating: 4.6 },
      'time-zone-converter': { views: 11200, invocations: 8900, avgDurationSec: 110, rating: 4.7 },
      'qr-code-generator': { views: 16400, invocations: 13900, avgDurationSec: 54, rating: 4.8 },
    };

    const perf = perfDefaults[t.slug] || { views: 1200, invocations: 800, avgDurationSec: 60, rating: 4.5 };

    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      category: t.category,
      description: t.description,
      longDescription: t.conceptExplanation,
      seoTitle: `${t.name} – Free Online Calculator & Tool`,
      seoDescription: t.description,
      iconName: t.iconName,
      keywords: t.keywords || [],
      featured: t.featured,
      popular: t.popular,
      status: status === 'active' ? 'active' : 'inactive',
      isCustom: false,
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-03-10T12:00:00Z',
      performance: perf,
    };
  });

  // Transform custom tools
  const customList: ToolListItem[] = customTools.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    category: c.category as ToolCategory,
    description: c.description,
    longDescription: c.longDescription,
    seoTitle: c.seoTitle,
    seoDescription: c.seoDescription,
    iconName: c.iconName,
    thumbnailUrl: c.thumbnailUrl,
    keywords: c.keywords,
    featured: c.featured,
    popular: c.popular,
    status: c.status,
    isCustom: true,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    zipFileName: c.zipFileName,
    zipFileSize: c.zipFileSize,
    filesCount: c.filesCount,
    entryHtmlPath: c.entryHtmlPath,
    performance: c.performance || { views: 0, invocations: 0, avgDurationSec: 0, rating: 5.0 },
  }));

  return [...customList, ...builtInList];
}

/**
 * Finds a tool by slug or id (custom or built-in)
 */
export async function getAnyToolBySlug(slug: string): Promise<DBToolRecord | null> {
  const customTool = await getDBCustomToolBySlug(slug);
  if (customTool) return customTool;
  return null;
}

/**
 * Save new or updated custom tool
 */
export async function saveCustomTool(tool: DBToolRecord): Promise<void> {
  await putDBCustomTool(tool);
}

/**
 * Delete a custom tool
 */
export async function removeCustomTool(id: string): Promise<void> {
  await deleteDBCustomTool(id);
}

/**
 * Toggle tool status (works for both custom tools and built-in tools)
 */
export async function toggleToolStatus(id: string, isCustom: boolean, currentStatus: 'active' | 'inactive'): Promise<'active' | 'inactive'> {
  const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';

  if (isCustom) {
    const custom = await getDBCustomToolBySlug(id);
    if (custom) {
      custom.status = nextStatus;
      custom.updatedAt = new Date().toISOString();
      await putDBCustomTool(custom);
    }
  } else {
    await setDBStatusOverride(id, nextStatus);
  }

  return nextStatus;
}
