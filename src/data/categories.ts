import { CategoryInfo } from '../types';
import { TOOLS } from './tools';

interface CategoryConfig {
  id: CategoryInfo['id'];
  name: string;
  slug: string;
  description: string;
  iconName: string;
  seoTitle: string;
  seoDescription: string;
  faq?: { question: string; answer: string }[];
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    id: 'calculators',
    name: 'Calculators',
    slug: 'calculators',
    description: 'Online calculators for everyday mathematical tasks and percentage calculations.',
    iconName: 'Calculator',
    seoTitle: 'Online Calculators – Free Mathematical Tools',
    seoDescription: 'Free online calculators for percentages and everyday calculations. Clean layouts with formulas and explanations where useful.',
    faq: [
      {
        question: 'Are all calculators free to use?',
        answer: 'Yes. All calculators on our platform are free to use with no sign-up or subscription required.'
      },
      {
        question: 'Do calculations run locally on my device?',
        answer: 'Calculations are computed directly in your browser using standard JavaScript.'
      },
      {
        question: 'How accurate are the results?',
        answer: 'Our tools use standard mathematical formulas and numerical methods.'
      },
      {
        question: 'Can I use these calculators on my mobile device?',
        answer: 'Yes. All calculators are built with responsive layouts that work smoothly on mobile phones, tablets, and desktop computers.'
      }
    ]
  },
  {
    id: 'text-tools',
    name: 'Text Tools',
    slug: 'text-tools',
    description: 'Text utilities for word counting, character analysis, and text case conversion.',
    iconName: 'FileText',
    seoTitle: 'Online Text Tools – Word Counter & Text Formatting',
    seoDescription: 'Free online text utilities to count words, inspect character counts, and transform letter case.',
    faq: [
      {
        question: 'Is my text stored or uploaded to any server?',
        answer: 'No. Your text is processed entirely within your browser and is not stored remotely.'
      },
      {
        question: 'Does the Word Counter count hyphenated words as one or two words?',
        answer: 'Standard hyphenated terms are treated as single compound words, matching common word-processing rules.'
      }
    ]
  },
  {
    id: 'converters',
    name: 'Converters',
    slug: 'converters',
    description: 'Unit conversion utilities for length, mass, volume, and temperature measurements.',
    iconName: 'ArrowLeftRight',
    seoTitle: 'Unit Converters – Metric & Imperial Measurement Tools',
    seoDescription: 'Measurement conversion utilities for everyday units and quantities.',
    faq: [
      {
        question: 'What conversion standards are referenced?',
        answer: 'Our conversion factors follow standard International System of Units (SI) values.'
      }
    ]
  },
  {
    id: 'date-time',
    name: 'Date & Time',
    slug: 'date-time',
    description: 'Date and time tools for calculating age and counting days between calendar dates.',
    iconName: 'Calendar',
    seoTitle: 'Date & Time Calculators – Age & Days Between Dates',
    seoDescription: 'Date tools to calculate chronological age and find the number of days between dates.',
    faq: [
      {
        question: 'Does the Age Calculator account for leap years?',
        answer: 'Yes. The algorithm accounts for varying month lengths and leap years according to the Gregorian calendar.'
      }
    ]
  },
  {
    id: 'education',
    name: 'Education',
    slug: 'education',
    description: 'Educational reference tools and calculation guides for students and learners.',
    iconName: 'GraduationCap',
    seoTitle: 'Educational Tools & Academic Reference Guides',
    seoDescription: 'Academic reference tools and calculation guides for everyday student tasks.',
    faq: [
      {
        question: 'What types of educational tools are included?',
        answer: 'Educational references and calculation guides designed to help students with everyday coursework and formulas.'
      }
    ]
  },
  {
    id: 'developer-tools',
    name: 'Developer Tools',
    slug: 'developer-tools',
    description: 'Browser-based utilities and helpers for programmers and technical tasks.',
    iconName: 'Code',
    seoTitle: 'Developer Tools – Code & Data Utilities',
    seoDescription: 'Browser utilities for web developers and programmers to inspect and process data.',
    faq: [
      {
        question: 'Do developer tools process data locally?',
        answer: 'Yes. All utilities run client-side in your browser without transmitting code or data to external servers.'
      }
    ]
  }
];

export const CATEGORIES: CategoryInfo[] = CATEGORY_CONFIGS.map((cat) => ({
  ...cat,
  get toolCount() {
    return TOOLS.filter((t) => t.category === cat.id).length;
  },
}));

export function getCategoryBySlug(slug: string): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.slug === slug || c.id === slug);
}
