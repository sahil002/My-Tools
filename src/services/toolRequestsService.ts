/**
 * OnlineTools Tool Requests Service
 * Manages user-submitted tool requests from /request-a-tool and the admin dashboard.
 * Supports individual submissions, status tracking, internal admin notes,
 * and grouping by tool name to count duplicate demand.
 */

export type ToolRequestStatus = 'new' | 'in_progress' | 'completed' | 'declined';

export interface ToolRequestNote {
  id: string;
  text: string;
  createdAt: string;
  author: string;
}

export interface ToolRequest {
  id: string;
  toolName: string;
  description: string;
  requesterEmail?: string;
  requesterName?: string;
  category?: string;
  useCase?: string;
  createdAt: string; // ISO 8601 string
  status: ToolRequestStatus;
  adminNotes: ToolRequestNote[];
  ipAddress?: string;
}

export interface GroupedToolRequest {
  groupKey: string;
  toolName: string;
  category?: string;
  count: number;
  requests: ToolRequest[];
  latestDate: string;
  requesters: string[];
  statusBreakdown: Record<ToolRequestStatus, number>;
  primaryStatus: ToolRequestStatus;
  totalNotesCount: number;
}

export interface ToolRequestsStats {
  total: number;
  newCount: number;
  inProgress: number;
  completed: number;
  declined: number;
  uniqueToolsCount: number;
  topRequestedTool?: string;
}

const STORAGE_KEY = 'onlinetools_tool_requests_v1';
export const TOOL_REQUESTS_CHANGED_EVENT = 'onlinetools_tool_requests_changed';

/**
 * Realistic seed data: 37 requests matching ADMIN_STATS_SUMMARY (37 total, 9 new)
 * with realistic duplicates to demonstrate duplicate request grouping and popularity ranking.
 */
const INITIAL_SEED_REQUESTS: ToolRequest[] = [
  // SVG to PNG Rasterizer (Requested 4 times)
  {
    id: 'req-101',
    toolName: 'SVG to PNG Converter',
    description: 'Client-side high-resolution SVG to PNG/JPEG rasterizer with custom DPI multiplier (1x, 2x, 4x) and transparent background option.',
    requesterEmail: 'dev.marcus@graphicshub.io',
    requesterName: 'Marcus Vance',
    category: 'Media & Image Tools',
    useCase: 'Exporting vector icons for retina web graphics and mobile app icons without installing desktop software.',
    createdAt: '2026-09-19T02:10:00.000Z',
    status: 'new',
    adminNotes: [
      {
        id: 'note-101-1',
        text: 'High demand tool. Can implement via HTML5 Canvas 2D context or Canvg library in browser.',
        createdAt: '2026-09-19T02:30:00.000Z',
        author: 'Lead Developer',
      },
    ],
    ipAddress: '192.0.2.45',
  },
  {
    id: 'req-102',
    toolName: 'SVG to PNG Rasterizer',
    description: 'Convert SVG code or files into crisp PNG images with custom dimensions (up to 4096px) and color profile retention.',
    requesterEmail: 'sarah.k@designsystem.co',
    requesterName: 'Sarah Kim',
    category: 'Media & Image Tools',
    useCase: 'Creating static fallback thumbnails from dynamic SVG charts.',
    createdAt: '2026-09-18T20:14:00.000Z',
    status: 'new',
    adminNotes: [],
    ipAddress: '198.51.100.12',
  },
  {
    id: 'req-103',
    toolName: 'SVG to PNG Converter',
    description: 'Quick tool to paste raw SVG text or drop an SVG file and download as 300 DPI transparent PNG.',
    requesterEmail: 'alex.designer@agency.net',
    requesterName: 'Alex Thorne',
    category: 'Media & Image Tools',
    useCase: 'Email newsletter graphics that cannot reliably render inline vector SVG.',
    createdAt: '2026-09-17T11:45:00.000Z',
    status: 'in_progress',
    adminNotes: [
      {
        id: 'note-103-1',
        text: 'Assigned to sprint 14. Architecture draft completed using client Canvas API.',
        createdAt: '2026-09-17T14:00:00.000Z',
        author: 'Product Manager',
      },
    ],
    ipAddress: '203.0.113.88',
  },
  {
    id: 'req-104',
    toolName: 'SVG to PNG',
    description: 'Batch SVG to PNG converter with transparent background support.',
    requesterEmail: undefined,
    requesterName: 'Anonymous Visitor',
    category: 'Media & Image Tools',
    useCase: 'Quick batch icon export.',
    createdAt: '2026-09-16T15:20:00.000Z',
    status: 'new',
    adminNotes: [],
    ipAddress: '192.0.2.105',
  },

  // Mortgage & Amortization Calculator (Requested 3 times)
  {
    id: 'req-105',
    toolName: 'Mortgage Amortization Schedule Calculator',
    description: 'Detailed monthly mortgage calculator with annual breakdown table, extra principal payment simulations, and export to CSV.',
    requesterEmail: 'd.miller@finadvisors.org',
    requesterName: 'David Miller',
    category: 'Calculators & Finance',
    useCase: 'Helping clients compare 15-year vs 30-year fixed loans with bi-weekly accelerated payments.',
    createdAt: '2026-09-18T16:30:00.000Z',
    status: 'new',
    adminNotes: [
      {
        id: 'note-105-1',
        text: 'Financial formulas already drafted. Need amortization schedule interactive table and chart.',
        createdAt: '2026-09-18T17:00:00.000Z',
        author: 'FinTech Lead',
      },
    ],
    ipAddress: '198.51.100.82',
  },
  {
    id: 'req-106',
    toolName: 'Mortgage Calculator with Amortization Table',
    description: 'Home loan payment calculator including property taxes, home insurance, and PMI estimates with full yearly schedule.',
    requesterEmail: 'homebuyer2026@outlook.com',
    requesterName: 'Rachel Green',
    category: 'Calculators & Finance',
    useCase: 'First-time home buyer calculating exact monthly escrow obligations.',
    createdAt: '2026-09-15T09:12:00.000Z',
    status: 'in_progress',
    adminNotes: [],
    ipAddress: '203.0.113.14',
  },
  {
    id: 'req-107',
    toolName: 'Mortgage Amortization Calculator',
    description: 'Calculate remaining principal balance and cumulative interest over time with prepayment options.',
    requesterEmail: 'kevin.realestate@invest.com',
    requesterName: 'Kevin Chen',
    category: 'Calculators & Finance',
    useCase: 'Property investment cash flow analysis.',
    createdAt: '2026-09-14T18:05:00.000Z',
    status: 'new',
    adminNotes: [],
    ipAddress: '192.0.2.210',
  },

  // JSON Schema Validator (Requested 3 times)
  {
    id: 'req-108',
    toolName: 'JSON Schema Validator',
    description: 'Validate arbitrary JSON data payloads against Draft-07, Draft 2019-09, and Draft 2020-12 specifications with line-by-line syntax error markers.',
    requesterEmail: 'artur.dev@backendstack.net',
    requesterName: 'Artur Nowak',
    category: 'Developer Tools',
    useCase: 'Debugging OpenAPI / Swagger schema definitions before deploying API routes.',
    createdAt: '2026-09-18T08:22:00.000Z',
    status: 'new',
    adminNotes: [
      {
        id: 'note-108-1',
        text: 'Ajv (Another JSON Schema Validator) can easily run in the browser without server overhead.',
        createdAt: '2026-09-18T10:15:00.000Z',
        author: 'Lead Developer',
      },
    ],
    ipAddress: '198.51.100.99',
  },
  {
    id: 'req-109',
    toolName: 'JSON Schema Validator',
    description: 'Interactive schema validator showing exact JSON path where validation failed (e.g. /users/0/email).',
    requesterEmail: 'claire.qa@fintechapp.com',
    requesterName: 'Claire Laurent',
    category: 'Developer Tools',
    useCase: 'Automated contract testing verification for microservices.',
    createdAt: '2026-09-12T14:40:00.000Z',
    status: 'in_progress',
    adminNotes: [],
    ipAddress: '203.0.113.63',
  },
  {
    id: 'req-110',
    toolName: 'JSON Schema Checker',
    description: 'Check if my JSON payload matches my JSON schema with formatted errors.',
    requesterEmail: undefined,
    requesterName: 'Anonymous Developer',
    category: 'Developer Tools',
    useCase: 'Quick JSON structure validation.',
    createdAt: '2026-09-10T16:18:00.000Z',
    status: 'new',
    adminNotes: [],
    ipAddress: '192.0.2.77',
  },

  // Subnet IPv4 / IPv6 CIDR Calculator (Requested 2 times)
  {
    id: 'req-111',
    toolName: 'IPv4 / IPv6 Subnet Calculator',
    description: 'CIDR calculator displaying network address, broadcast address, usable IP range, subnet mask, wildcard mask, and binary representation.',
    requesterEmail: 'neteng.carlos@sysadmin.org',
    requesterName: 'Carlos Mendoza',
    category: 'Developer Tools',
    useCase: 'Configuring VLAN routing tables and cloud VPC security groups.',
    createdAt: '2026-09-17T22:50:00.000Z',
    status: 'in_progress',
    adminNotes: [
      {
        id: 'note-111-1',
        text: 'Algorithm ready. Need visual representation of network vs host bits.',
        createdAt: '2026-09-18T01:00:00.000Z',
        author: 'Lead Developer',
      },
    ],
    ipAddress: '198.51.100.34',
  },
  {
    id: 'req-112',
    toolName: 'CIDR Subnet Calculator',
    description: 'Calculate IP ranges from CIDR notation like 10.0.0.0/22 with total host count and binary masks.',
    requesterEmail: 'priya.s@cloudinfrasolutions.io',
    requesterName: 'Priya Sharma',
    category: 'Developer Tools',
    useCase: 'Planning AWS subnet allocation.',
    createdAt: '2026-09-13T10:11:00.000Z',
    status: 'in_progress',
    adminNotes: [],
    ipAddress: '203.0.113.111',
  },

  // Regex Tester & Debugger (Requested 2 times)
  {
    id: 'req-113',
    toolName: 'Regex Tester & Explainer',
    description: 'JavaScript Regular Expression builder with live match highlighting, capture groups breakdown, cheat sheet, and natural English regex breakdown.',
    requesterEmail: 'tomas.v@codelabs.dev',
    requesterName: 'Tomas Varga',
    category: 'Developer Tools',
    useCase: 'Writing and debugging complex parsing regex for date and log extraction.',
    createdAt: '2026-09-17T19:30:00.000Z',
    status: 'in_progress',
    adminNotes: [],
    ipAddress: '192.0.2.144',
  },
  {
    id: 'req-114',
    toolName: 'Regular Expression Tester',
    description: 'Test regex pattern against multiline test strings with flags (g, i, m, s, u).',
    requesterEmail: 'jordan@devops.co',
    requesterName: 'Jordan Reed',
    category: 'Developer Tools',
    useCase: 'Validating log pattern extraction rules.',
    createdAt: '2026-09-11T13:40:00.000Z',
    status: 'in_progress',
    adminNotes: [],
    ipAddress: '198.51.100.170',
  },

  // Markdown Table Generator (Requested 2 times)
  {
    id: 'req-115',
    toolName: 'Markdown Table Generator',
    description: 'Visual spreadsheet-style grid to type or paste CSV data and instantly generate clean GitHub-flavored markdown table with column alignments (left, center, right).',
    requesterEmail: 'linda.techwriter@docs.org',
    requesterName: 'Linda O’Connor',
    category: 'Text Tools',
    useCase: 'Creating documentation tables for README.md and technical documentation wikis.',
    createdAt: '2026-09-16T14:15:00.000Z',
    status: 'in_progress',
    adminNotes: [
      {
        id: 'note-115-1',
        text: 'Prototype almost complete in staging. Adding import CSV feature.',
        createdAt: '2026-09-17T09:00:00.000Z',
        author: 'Frontend Dev',
      },
    ],
    ipAddress: '203.0.113.201',
  },
  {
    id: 'req-116',
    toolName: 'Markdown Table Generator & CSV Converter',
    description: 'Paste excel or CSV rows and output clean formatted markdown tables with customizable padding.',
    requesterEmail: 'dev.sam@openwiki.org',
    requesterName: 'Samir Patel',
    category: 'Text Tools',
    useCase: 'Converting client specification sheets into GitHub issues.',
    createdAt: '2026-09-09T17:22:00.000Z',
    status: 'in_progress',
    adminNotes: [],
    ipAddress: '192.0.2.89',
  },

  // Barcode Generator (Requested 2 times)
  {
    id: 'req-117',
    toolName: 'Barcode Generator',
    description: 'Generate standard Code 128, EAN-13, UPC-A, and Code 39 barcodes with downloadable high-res PNG and SVG vector formats.',
    requesterEmail: 'warehouse@logistics-direct.com',
    requesterName: 'Frank Sinatra Logistics',
    category: 'Media & Image Tools',
    useCase: 'Printing inventory SKU labels for shipping boxes.',
    createdAt: '2026-09-16T11:05:00.000Z',
    status: 'in_progress',
    adminNotes: [],
    ipAddress: '198.51.100.55',
  },
  {
    id: 'req-118',
    toolName: 'Barcode Maker (Code 128 / UPC)',
    description: 'Free barcode maker that produces printable SVG barcodes for retail product testing.',
    requesterEmail: undefined,
    requesterName: 'Anonymous Visitor',
    category: 'Media & Image Tools',
    useCase: 'Testing retail barcode scanner hardware.',
    createdAt: '2026-09-08T12:00:00.000Z',
    status: 'in_progress',
    adminNotes: [],
    ipAddress: '203.0.113.78',
  },

  // Time Zone Meeting Planner (Requested 2 times)
  {
    id: 'req-119',
    toolName: 'Time Zone Meeting Planner',
    description: 'Interactive world clock visualizer showing overlapping working hours across multiple global cities (e.g. San Francisco, London, Tokyo) with copyable invite times.',
    requesterEmail: 'remote.manager@distributed.work',
    requesterName: 'Hannah Abbott',
    category: 'Time & Date Tools',
    useCase: 'Scheduling team standups across 4 continents without causing 2 AM meetings.',
    createdAt: '2026-09-17T07:45:00.000Z',
    status: 'new',
    adminNotes: [],
    ipAddress: '192.0.2.160',
  },
  {
    id: 'req-120',
    toolName: 'Global Timezone Overlap Finder',
    description: 'Select 3 to 5 cities and highlight the golden overlapping working hours (9 AM - 6 PM) in green.',
    requesterEmail: 'danielle@nomadguild.io',
    requesterName: 'Danielle Brooks',
    category: 'Time & Date Tools',
    useCase: 'Planning executive board calls across US Pacific and European time zones.',
    createdAt: '2026-09-07T14:30:00.000Z',
    status: 'new',
    adminNotes: [],
    ipAddress: '198.51.100.222',
  },

  // YAML to JSON & JSON to YAML (Requested 2 times)
  {
    id: 'req-121',
    toolName: 'YAML to JSON Converter',
    description: 'Bidirectional YAML to JSON parser with indentation customization and schema validation.',
    requesterEmail: 'k8s.operator@cloudinfra.net',
    requesterName: 'Igor Sokolov',
    category: 'Developer Tools',
    useCase: 'Converting Kubernetes Helm manifests into JSON for scripting.',
    createdAt: '2026-09-18T12:00:00.000Z',
    status: 'new',
    adminNotes: [],
    ipAddress: '203.0.113.149',
  },
  {
    id: 'req-122',
    toolName: 'YAML to JSON / JSON to YAML Converter',
    description: 'Paste YAML or JSON with instant two-way synchronization and syntax highlighting.',
    requesterEmail: 'maya@devopsengine.org',
    requesterName: 'Maya Lin',
    category: 'Developer Tools',
    useCase: 'Editing Docker Compose and CI/CD workflow YAMLs.',
    createdAt: '2026-09-06T18:10:00.000Z',
    status: 'in_progress',
    adminNotes: [],
    ipAddress: '192.0.2.234',
  },

  // Color Contrast WCAG Checker (Completed)
  {
    id: 'req-123',
    toolName: 'Color Contrast WCAG Checker',
    description: 'Calculate WCAG 2.1 AA and AAA contrast ratios between foreground text and background color with color blindness simulation previews.',
    requesterEmail: 'a11y.advocate@accessibility.org',
    requesterName: 'Jessica Taylor',
    category: 'Developer Tools',
    useCase: 'Ensuring digital products comply with Section 508 and WCAG standards.',
    createdAt: '2026-08-25T10:00:00.000Z',
    status: 'completed',
    adminNotes: [
      {
        id: 'note-123-1',
        text: 'Implemented and live in the tools directory under Developer tools.',
        createdAt: '2026-09-01T11:00:00.000Z',
        author: 'Admin Team',
      },
    ],
    ipAddress: '198.51.100.18',
  },

  // Password Generator (Completed)
  {
    id: 'req-124',
    toolName: 'Password Generator with Entropy Meter',
    description: 'Cryptographically secure password generator using browser Web Crypto API with customizable symbols, numbers, and entropy calculation.',
    requesterEmail: 'security@enterpriseshield.com',
    requesterName: 'Security Admin',
    category: 'Developer Tools',
    useCase: 'Generating NIST-compliant passwords without server transmission.',
    createdAt: '2026-08-15T09:30:00.000Z',
    status: 'completed',
    adminNotes: [
      {
        id: 'note-124-1',
        text: 'Live on production with 100% client-side crypto.getRandomValues().',
        createdAt: '2026-08-20T16:00:00.000Z',
        author: 'Lead Developer',
      },
    ],
    ipAddress: '203.0.113.50',
  },

  // Percentage Calculator (Completed)
  {
    id: 'req-125',
    toolName: 'Percentage Calculator Suite',
    description: 'All-in-one percentage calculator (X% of Y, what percent is X of Y, percentage increase/decrease, margin vs markup).',
    requesterEmail: 'math.teacher@education.k12.us',
    requesterName: 'Emily Watson',
    category: 'Calculators & Finance',
    useCase: 'Quick classroom calculations and retail sales discount problem solving.',
    createdAt: '2026-08-10T14:15:00.000Z',
    status: 'completed',
    adminNotes: [],
    ipAddress: '192.0.2.66',
  },

  // JSON Formatter & Validator (Completed)
  {
    id: 'req-126',
    toolName: 'JSON Formatter & Minifier',
    description: 'Format unreadable compressed JSON into indented readable JSON with syntax coloration, error highlighting, and tree view.',
    requesterEmail: 'api.dev@startuphq.co',
    requesterName: 'Braden Lee',
    category: 'Developer Tools',
    useCase: 'Inspecting backend REST API responses.',
    createdAt: '2026-08-08T11:20:00.000Z',
    status: 'completed',
    adminNotes: [],
    ipAddress: '198.51.100.74',
  },

  // Word & Character Counter (Completed)
  {
    id: 'req-127',
    toolName: 'Word Counter & Reading Time Estimator',
    description: 'Real-time text analyzer counting words, characters with/without spaces, sentences, paragraphs, and estimated reading/speaking time.',
    requesterEmail: 'writer@contentcreators.club',
    requesterName: 'Oliver Twist Editorial',
    category: 'Text Tools',
    useCase: 'Writing blog articles to specific word limits for editorial guidelines.',
    createdAt: '2026-08-05T15:45:00.000Z',
    status: 'completed',
    adminNotes: [],
    ipAddress: '203.0.113.92',
  },

  // Base64 Image Encoder / Decoder (Completed)
  {
    id: 'req-128',
    toolName: 'Base64 Image Encoder / Decoder',
    description: 'Convert PNG/JPEG/WEBP images to data:image base64 URI strings and decode base64 back into image previews.',
    requesterEmail: 'webmaster@fastsites.io',
    requesterName: 'Gavin Ross',
    category: 'Converters',
    useCase: 'Inlining small icon assets directly into CSS and HTML files.',
    createdAt: '2026-08-02T13:10:00.000Z',
    status: 'completed',
    adminNotes: [],
    ipAddress: '192.0.2.181',
  },

  // URL Encoder / Decoder (Completed)
  {
    id: 'req-129',
    toolName: 'URL Encoder / Decoder',
    description: 'Encode and decode query strings and special characters using encodeURIComponent with parameter parser.',
    requesterEmail: 'qa.tester@ecomstore.com',
    requesterName: 'Tara Singh',
    category: 'Converters',
    useCase: 'Debugging OAuth redirect URLs and tracking parameters.',
    createdAt: '2026-07-28T16:00:00.000Z',
    status: 'completed',
    adminNotes: [],
    ipAddress: '198.51.100.133',
  },

  // Unit Converter (Completed)
  {
    id: 'req-130',
    toolName: 'Multi-Unit Converter (Length, Weight, Temp)',
    description: 'Quick scientific and everyday unit converter covering Metric, Imperial, Celsius, Fahrenheit, Kelvin, kilograms, pounds.',
    requesterEmail: 'student@university.edu',
    requesterName: 'Lucas Grey',
    category: 'Converters',
    useCase: 'Physics and chemistry homework unit conversions.',
    createdAt: '2026-07-25T10:30:00.000Z',
    status: 'completed',
    adminNotes: [],
    ipAddress: '203.0.113.41',
  },

  // Case Converter (Completed)
  {
    id: 'req-131',
    toolName: 'Text Case Converter (camelCase, snake_case, Title Case)',
    description: 'Convert text between UPPERCASE, lowercase, camelCase, snake_case, kebab-case, and Title Case.',
    requesterEmail: 'code.stylist@devtools.net',
    requesterName: 'Dev Stylist',
    category: 'Text Tools',
    useCase: 'Standardizing database column names and code constants.',
    createdAt: '2026-07-20T08:15:00.000Z',
    status: 'completed',
    adminNotes: [],
    ipAddress: '192.0.2.95',
  },

  // Epoch Unix Timestamp Converter (Completed)
  {
    id: 'req-132',
    toolName: 'Unix Epoch Timestamp Converter',
    description: 'Convert seconds/milliseconds epoch timestamps to human readable dates (UTC and local timezone) and vice-versa.',
    requesterEmail: 'backend.ops@cloudstack.com',
    requesterName: 'DevOps Engineer',
    category: 'Time & Date Tools',
    useCase: 'Analyzing database audit logs with epoch numbers.',
    createdAt: '2026-07-15T17:40:00.000Z',
    status: 'completed',
    adminNotes: [],
    ipAddress: '198.51.100.205',
  },

  // Diff Checker (Completed)
  {
    id: 'req-133',
    toolName: 'Text & Code Diff Checker',
    description: 'Side-by-side and unified text diff highlighting added, removed, and modified characters and lines.',
    requesterEmail: 'editor@reviewpress.org',
    requesterName: 'Review Press',
    category: 'Text Tools',
    useCase: 'Comparing contract clauses and draft revisions.',
    createdAt: '2026-07-10T12:00:00.000Z',
    status: 'completed',
    adminNotes: [],
    ipAddress: '203.0.113.180',
  },

  // QR Code Generator (Completed)
  {
    id: 'req-134',
    toolName: 'QR Code Generator with Custom Color',
    description: 'Generate high resolution QR codes for URLs, WiFi passwords, vCards, and plain text with PNG/SVG export.',
    requesterEmail: 'marketing@eventpro.com',
    requesterName: 'Event Marketing',
    category: 'Media & Image Tools',
    useCase: 'Printing event brochures and table tent WiFi codes.',
    createdAt: '2026-07-05T14:20:00.000Z',
    status: 'completed',
    adminNotes: [],
    ipAddress: '192.0.2.119',
  },

  // Loan Calculator (Completed)
  {
    id: 'req-135',
    toolName: 'Personal Loan & Auto Loan Calculator',
    description: 'Calculate monthly loan repayment installments, total interest charges, and loan payoff duration.',
    requesterEmail: 'carbuyer@financialsmart.net',
    requesterName: 'Smart Borrower',
    category: 'Calculators & Finance',
    useCase: 'Comparing auto loan dealership quotes against bank pre-approvals.',
    createdAt: '2026-07-01T09:00:00.000Z',
    status: 'completed',
    adminNotes: [],
    ipAddress: '198.51.100.88',
  },

  // Crypto Trading Bot (Declined)
  {
    id: 'req-136',
    toolName: 'Automated Crypto Arbitrage Trading Bot',
    description: 'A tool that automatically executes buy and sell orders across Binance, Coinbase, and Kraken via private API keys.',
    requesterEmail: 'moonshot.trader@cryptoanon.xyz',
    requesterName: 'Crypto Trader',
    category: 'Calculators & Finance',
    useCase: 'High-frequency algorithmic trading.',
    createdAt: '2026-08-30T21:10:00.000Z',
    status: 'declined',
    adminNotes: [
      {
        id: 'note-136-1',
        text: 'Declined: Outside our scope as a client-side utility site. Storing API trading keys and executing financial trades carries severe security & regulatory liability.',
        createdAt: '2026-08-31T09:00:00.000Z',
        author: 'Security & Compliance',
      },
    ],
    ipAddress: '203.0.113.250',
  },

  // Web Scraping / Mass Email Harvester (Declined)
  {
    id: 'req-137',
    toolName: 'Bulk Website Email Harvester & Scraper',
    description: 'Enter a domain name and automatically scrape and extract all email addresses and phone numbers found on every subpage.',
    requesterEmail: 'leadgen.king@spammerdomain.biz',
    requesterName: 'LeadGen King',
    category: 'Developer Tools',
    useCase: 'Cold outreach marketing lead generation.',
    createdAt: '2026-08-18T16:45:00.000Z',
    status: 'declined',
    adminNotes: [
      {
        id: 'note-137-1',
        text: 'Declined: Violates acceptable use guidelines. We do not build email scraping or unsolicited harvesting tools.',
        createdAt: '2026-08-19T08:30:00.000Z',
        author: 'Site Admin',
      },
    ],
    ipAddress: '192.0.2.199',
  },
];

/**
 * Normalizes tool name for grouping (lowercases, removes punctuation, trims spaces)
 */
export function normalizeToolNameKey(rawName: string): string {
  return rawName
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Loads requests from localStorage or seeds initial database
 */
export function getToolRequests(): ToolRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_REQUESTS));
      return INITIAL_SEED_REQUESTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_SEED_REQUESTS;
  } catch (error) {
    console.warn('Failed to load tool requests from storage:', error);
    return INITIAL_SEED_REQUESTS;
  }
}

/**
 * Saves requests to localStorage and broadcasts event
 */
function saveToolRequests(requests: ToolRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    window.dispatchEvent(new CustomEvent(TOOL_REQUESTS_CHANGED_EVENT, { detail: requests }));
  } catch (error) {
    console.error('Failed to save tool requests to storage:', error);
  }
}

/**
 * Submits a new tool request from public /request-a-tool or admin
 */
export function submitToolRequest(input: {
  toolName: string;
  description: string;
  requesterEmail?: string;
  requesterName?: string;
  category?: string;
  useCase?: string;
}): ToolRequest {
  const current = getToolRequests();
  const id = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newRequest: ToolRequest = {
    id,
    toolName: input.toolName.trim(),
    description: input.description.trim(),
    requesterEmail: input.requesterEmail?.trim() || undefined,
    requesterName: input.requesterName?.trim() || (input.requesterEmail ? input.requesterEmail.split('@')[0] : 'Community User'),
    category: input.category || 'General Utility',
    useCase: input.useCase?.trim() || undefined,
    createdAt: new Date().toISOString(),
    status: 'new',
    adminNotes: [],
  };

  const updated = [newRequest, ...current];
  saveToolRequests(updated);
  return newRequest;
}

/**
 * Updates status of a tool request
 */
export function updateToolRequestStatus(id: string, newStatus: ToolRequestStatus): boolean {
  const current = getToolRequests();
  const index = current.findIndex((item) => item.id === id);
  if (index === -1) return false;

  current[index].status = newStatus;
  saveToolRequests([...current]);
  return true;
}

/**
 * Adds an internal admin note to a tool request
 */
export function addToolRequestAdminNote(id: string, noteText: string, author = 'Admin'): ToolRequestNote | null {
  const trimmed = noteText.trim();
  if (!trimmed) return null;

  const current = getToolRequests();
  const index = current.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const newNote: ToolRequestNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    text: trimmed,
    createdAt: new Date().toISOString(),
    author,
  };

  if (!current[index].adminNotes) {
    current[index].adminNotes = [];
  }
  current[index].adminNotes.push(newNote);
  saveToolRequests([...current]);
  return newNote;
}

/**
 * Deletes an admin note from a tool request
 */
export function deleteToolRequestAdminNote(requestId: string, noteId: string): boolean {
  const current = getToolRequests();
  const index = current.findIndex((item) => item.id === requestId);
  if (index === -1) return false;

  if (!current[index].adminNotes) return false;
  current[index].adminNotes = current[index].adminNotes.filter((n) => n.id !== noteId);
  saveToolRequests([...current]);
  return true;
}

/**
 * Deletes a tool request
 */
export function deleteToolRequest(id: string): boolean {
  const current = getToolRequests();
  const filtered = current.filter((item) => item.id !== id);
  if (filtered.length === current.length) return false;

  saveToolRequests(filtered);
  return true;
}

/**
 * Bulk updates status for multiple requests
 */
export function bulkUpdateToolRequestStatus(ids: string[], newStatus: ToolRequestStatus): number {
  if (ids.length === 0) return 0;
  const set = new Set(ids);
  const current = getToolRequests();
  let count = 0;

  for (const item of current) {
    if (set.has(item.id)) {
      item.status = newStatus;
      count++;
    }
  }

  if (count > 0) {
    saveToolRequests([...current]);
  }
  return count;
}

/**
 * Bulk deletes multiple requests
 */
export function bulkDeleteToolRequests(ids: string[]): number {
  if (ids.length === 0) return 0;
  const set = new Set(ids);
  const current = getToolRequests();
  const filtered = current.filter((item) => !set.has(item.id));
  const removed = current.length - filtered.length;

  if (removed > 0) {
    saveToolRequests(filtered);
  }
  return removed;
}

/**
 * Groups duplicate requests by normalized tool name.
 * Sorts them with most requested first by default.
 */
export function getGroupedToolRequests(requestsList?: ToolRequest[]): GroupedToolRequest[] {
  const source = requestsList || getToolRequests();
  const groupsMap = new Map<string, GroupedToolRequest>();

  for (const req of source) {
    const key = normalizeToolNameKey(req.toolName);
    const existing = groupsMap.get(key);

    if (existing) {
      existing.count += 1;
      existing.requests.push(req);
      existing.statusBreakdown[req.status] = (existing.statusBreakdown[req.status] || 0) + 1;
      existing.totalNotesCount += req.adminNotes?.length || 0;

      if (req.requesterEmail && !existing.requesters.includes(req.requesterEmail)) {
        existing.requesters.push(req.requesterEmail);
      }

      if (new Date(req.createdAt).getTime() > new Date(existing.latestDate).getTime()) {
        existing.latestDate = req.createdAt;
      }

      // Decide primary status priority: in_progress > new > completed > declined
      if (req.status === 'in_progress' || existing.primaryStatus !== 'in_progress') {
        if (req.status === 'in_progress') {
          existing.primaryStatus = 'in_progress';
        } else if (req.status === 'new' && existing.primaryStatus !== 'in_progress') {
          existing.primaryStatus = 'new';
        }
      }
    } else {
      const breakdown: Record<ToolRequestStatus, number> = {
        new: 0,
        in_progress: 0,
        completed: 0,
        declined: 0,
      };
      breakdown[req.status] = 1;

      groupsMap.set(key, {
        groupKey: key,
        toolName: req.toolName,
        category: req.category,
        count: 1,
        requests: [req],
        latestDate: req.createdAt,
        requesters: req.requesterEmail ? [req.requesterEmail] : [],
        statusBreakdown: breakdown,
        primaryStatus: req.status,
        totalNotesCount: req.adminNotes?.length || 0,
      });
    }
  }

  const grouped = Array.from(groupsMap.values());
  // Sort descending by count, then by latestDate
  grouped.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
  });

  return grouped;
}

/**
 * Returns aggregated statistics for the tool requests module
 */
export function getToolRequestsStats(): ToolRequestsStats {
  const requests = getToolRequests();
  const stats: ToolRequestsStats = {
    total: requests.length,
    newCount: 0,
    inProgress: 0,
    completed: 0,
    declined: 0,
    uniqueToolsCount: 0,
  };

  const nameSet = new Set<string>();

  for (const r of requests) {
    nameSet.add(normalizeToolNameKey(r.toolName));
    if (r.status === 'new') stats.newCount++;
    else if (r.status === 'in_progress') stats.inProgress++;
    else if (r.status === 'completed') stats.completed++;
    else if (r.status === 'declined') stats.declined++;
  }

  stats.uniqueToolsCount = nameSet.size;

  const grouped = getGroupedToolRequests(requests);
  if (grouped.length > 0) {
    stats.topRequestedTool = `${grouped[0].toolName} (${grouped[0].count} requests)`;
  }

  return stats;
}

/**
 * Resets storage back to initial seeds (useful for testing)
 */
export function resetToolRequestsToDefault(): void {
  saveToolRequests(INITIAL_SEED_REQUESTS);
}
