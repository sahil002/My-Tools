import { ToolItem } from '../types';

export const TOOLS: ToolItem[] = [
  {
    id: 'percentage-calculator',
    name: 'Percentage Calculator',
    slug: 'percentage-calculator',
    category: 'calculators',
    description: 'Calculate percentages, find percentage increase or decrease, and determine the percentage proportion between two numbers.',
    iconName: 'Percent',
    keywords: ['percentage', 'percent', 'percentage increase', 'discount calculator', 'math', 'ratio'],
    featured: true,
    popular: true,
    status: 'active',
    relatedTools: ['age-calculator', 'loan-calculator', 'unit-converter'],
    relatedGuides: ['how-to-calculate-percentage', 'understanding-unit-conversion'],
    howToUse: [
      'Select the percentage formula type you want to solve from the top tabs.',
      'Enter your initial value and target percentage or secondary number.',
      'The calculation computes automatically as you type.',
      'Review the step-by-step formula and copy the calculated result with one click.'
    ],
    conceptExplanation:
      'A percentage represents a fraction or ratio expressed as a portion out of 100 (from the Latin "per centum", meaning "by the hundred"). It provides a standardized baseline for comparing relative changes, proportions, margins, tax amounts, and discounts across varying magnitudes.',
    formula: {
      title: 'Standard Percentage Formula',
      equation: 'P = (Part / Whole) × 100  or  Value = (Percentage / 100) × Whole',
      explanation: 'To compute the part from a given percentage, divide the percentage by 100 and multiply by the base number.',
      variables: [
        { symbol: 'Part', label: 'The subset or portion of the total value' },
        { symbol: 'Whole', label: 'The complete base quantity or denominator' },
        { symbol: 'P', label: 'The resulting percentage rate (%)' }
      ]
    },
    stepExamples: [
      {
        title: 'Example 1: Finding 15% of $240',
        scenario: 'Calculate a 15% tip or discount on a $240 bill.',
        steps: [
          'Convert the percentage into decimal: 15 / 100 = 0.15',
          'Multiply by the base amount: 0.15 × 240',
          'Evaluate result: 36'
        ],
        result: '15% of 240 is 36'
      },
      {
        title: 'Example 2: Percentage Increase from $50 to $75',
        scenario: 'Determine the growth rate when revenue increases from $50 to $75.',
        steps: [
          'Calculate absolute difference: 75 - 50 = 25',
          'Divide difference by initial base: 25 / 50 = 0.50',
          'Multiply by 100: 0.50 × 100 = 50%'
        ],
        result: '50% increase'
      }
    ],
    commonUseCases: [
      'Retail shopping discounts and clearance sales deduction',
      'Sales tax, GST, VAT, and invoice calculations',
      'Tip estimations for dining and hospitality services',
      'Financial performance reviews, revenue margins, and ROI metrics',
      'Academic test score grading and examination percentages'
    ],
    commonMistakes: [
      'Confusing percentage points with relative percentage change (e.g. going from 10% to 15% is a 5 point increase, but a 50% relative increase).',
      'Dividing by the new number instead of the original initial base when calculating percentage change.',
      'Applying compound discounts sequentially without adjusting the intermediate subtotal.'
    ],
    faq: [
      {
        question: 'How do I calculate percentage decrease?',
        answer: 'Subtract the new value from the original value, divide the difference by the original value, and multiply by 100. For example, from 100 down to 80: ((100 - 80) / 100) * 100 = 20% decrease.'
      },
      {
        question: 'What is the fastest way to find 10% or 20% mentally?',
        answer: 'To find 10% of any number, move the decimal point one position to the left (e.g., 10% of 65 is 6.5). For 20%, find 10% and simply double it (6.5 × 2 = 13).'
      },
      {
        question: 'Does this calculator save my calculations?',
        answer: 'No data is stored on remote servers. All calculations occur immediately in your browser cache.'
      }
    ]
  },
  {
    id: 'age-calculator',
    name: 'Age Calculator',
    slug: 'age-calculator',
    category: 'date-time',
    description: 'Calculate your exact age in years, months, days, weeks, and hours from your birthdate, with birthday countdown.',
    iconName: 'Calendar',
    keywords: ['age', 'birthdate', 'chronological age', 'birthday countdown', 'days lived', 'date difference'],
    featured: true,
    popular: true,
    status: 'active',
    relatedTools: ['percentage-calculator', 'word-counter', 'time-difference-calculator'],
    relatedGuides: ['how-to-calculate-exact-age', 'how-to-calculate-percentage'],
    howToUse: [
      'Select your Date of Birth in the date selector.',
      'Optionally set the "Age as of" date (defaults to today).',
      'The calculator instantly outputs your exact chronological age in years, months, and days.',
      'Explore total time equivalents (total weeks, total days, total hours) and your next birthday countdown.'
    ],
    conceptExplanation:
      'Chronological age is the exact measure of time elapsed since an individual was born. Calculating true chronological age requires precise accounting for the variable lengths of calendar months (28, 29, 30, or 31 days) as well as leap years in the Gregorian calendar system.',
    formula: {
      title: 'Calendar Date Differential Algorithm',
      equation: 'Years = Y₂ - Y₁ (adjust for month/day borrowing if M₂ < M₁ or D₂ < D₁)',
      explanation: 'If the target day is lower than the birth day, borrow the exact number of days from the preceding month; if the target month is lower than the birth month, borrow 1 year (12 months).'
    },
    stepExamples: [
      {
        title: 'Example: Born March 15, 1995 evaluated on September 17, 2026',
        scenario: 'Calculate exact years, months, and days.',
        steps: [
          'Years: 2026 - 1995 = 31 years',
          'Months: September (9) - March (3) = 6 months',
          'Days: 17 - 15 = 2 days'
        ],
        result: '31 years, 6 months, and 2 days'
      }
    ],
    commonUseCases: [
      'Verifying legal age requirements for employment, contracts, or licensing',
      'Determining school admission eligibility cutoffs',
      'Calculating developmental milestones for pediatric growth charts',
      'Tracking milestones for anniversaries, retirements, and insurance terms'
    ],
    commonMistakes: [
      'Assuming every month is 30 days or dividing total days by 365.25 (which introduces drift).',
      'Forgetting that February has 29 days in leap years like 2024 or 2028.'
    ],
    faq: [
      {
        question: 'Does the age calculator handle leap year birthdays (Feb 29)?',
        answer: 'Yes. For individuals born on February 29th, the algorithm accurately identifies leap years and celebrates non-leap anniversaries on March 1st or February 28th per jurisdictional standards.'
      },
      {
        question: 'Can I calculate age for historical dates or pets?',
        answer: 'Yes, any valid Gregorian date can be entered into the birthdate and target date inputs.'
      }
    ]
  },
  {
    id: 'word-counter',
    name: 'Word Counter',
    slug: 'word-counter',
    category: 'text-tools',
    description: 'Analyze text statistics in real time: word count, character count, sentences, reading time, speaking time, and keyword density.',
    iconName: 'FileText',
    keywords: ['word counter', 'character count', 'reading time', 'text statistics', 'essay counter', 'keyword density'],
    featured: true,
    popular: true,
    status: 'active',
    relatedTools: ['case-converter', 'percentage-calculator', 'json-formatter'],
    relatedGuides: ['word-count-guide-for-essays-and-seo', 'how-to-calculate-percentage'],
    howToUse: [
      'Type or paste your text directly into the main editor area.',
      'View real-time updates for total words, characters, sentences, paragraphs, and reading duration.',
      'Check the keyword frequency density breakdown below the counter.',
      'Use quick case transformation buttons (UPPERCASE, lowercase, Title Case) to reformat text instantly.'
    ],
    conceptExplanation:
      'Word counting parses a stream of Unicode characters into discrete lexical tokens separated by whitespace or punctuation boundaries. Accurate word counting also distinguishes hyphenated compounds, punctuation marks, and multi-line breaks to provide realistic reading and speaking estimates.',
    formula: {
      title: 'Reading & Speaking Duration Estimates',
      equation: 'Reading Time = Words / 225 wpm  |  Speaking Time = Words / 130 wpm',
      explanation: 'Average adult silent reading speeds range between 200 and 250 words per minute. Formal presentation speaking averages 130 words per minute.'
    },
    stepExamples: [
      {
        title: 'Example: 900-word blog post or academic essay',
        scenario: 'Estimate reading duration and paragraph density.',
        steps: [
          'Words: 900 tokens',
          'Reading time: 900 / 225 = 4.0 minutes',
          'Speaking time: 900 / 130 = 6.9 minutes'
        ],
        result: '4 min reading time, 7 min speaking presentation'
      }
    ],
    commonUseCases: [
      'Adhering to strict academic essay, thesis, or paper limits',
      'Meeting character limits for social media platforms and ads (Google Ads, X/Twitter, Meta)',
      'Balancing SEO article lengths (e.g., 1,500 to 2,500 words for comprehensive guides)',
      'Timing conference presentations, podcasts, and speeches'
    ],
    commonMistakes: [
      'Confusing character count including spaces with character count excluding spaces.',
      'Pasting rich text with invisible trailing formatting characters.'
    ],
    faq: [
      {
        question: 'Does the Word Counter count numbers as words?',
        answer: 'Yes, stand-alone numeric values (e.g. "42", "2026") are counted as individual words in accordance with standard publishing rules.'
      },
      {
        question: 'Is there a limit on how much text I can paste?',
        answer: 'You can comfortably paste over 100,000 words. The client-side tokenizer runs in linear O(n) time and maintains fluid 60fps responsiveness.'
      }
    ]
  },
  {
    id: 'unit-converter',
    name: 'Unit Converter',
    slug: 'unit-converter',
    category: 'converters',
    description: 'Convert between metric and imperial measurements for length, mass, volume, temperature, and digital storage.',
    iconName: 'ArrowLeftRight',
    keywords: ['unit converter', 'metric to imperial', 'kg to lbs', 'celsius to fahrenheit', 'km to miles'],
    featured: true,
    popular: true,
    status: 'coming-soon',
    relatedTools: ['percentage-calculator', 'age-calculator'],
    relatedGuides: ['understanding-unit-conversion'],
    howToUse: [
      'Select the measurement dimension (Length, Weight, Temperature, Volume).',
      'Choose the input unit and target unit.',
      'Enter the numeric value to receive an exact conversion with factor breakdown.'
    ],
    conceptExplanation:
      'Unit conversion calculates equivalent quantities across diverse measurement systems by applying calibrated scalar conversion coefficients or affine transformations (such as Celsius to Fahrenheit).',
    faq: [
      {
        question: 'What conversion ratio is used for kilograms to pounds?',
        answer: '1 kilogram is defined as approximately 2.2046226218 pounds under the International Yard and Pound agreement of 1959.'
      }
    ]
  },
  {
    id: 'loan-calculator',
    name: 'Loan Calculator',
    slug: 'loan-calculator',
    category: 'calculators',
    description: 'Estimate monthly loan payments, total interest costs, and amortization schedules for mortgages and personal loans.',
    iconName: 'DollarSign',
    keywords: ['loan', 'mortgage', 'interest', 'amortization', 'monthly payment', 'finance'],
    featured: false,
    popular: true,
    status: 'coming-soon',
    relatedTools: ['percentage-calculator'],
    relatedGuides: ['how-to-calculate-percentage'],
    howToUse: [
      'Input the principal loan balance, annual interest rate, and term in years.',
      'View the estimated monthly payment and complete interest breakdown.'
    ],
    conceptExplanation:
      'Amortized loan calculations use annuity formulas to determine fixed periodic payments that pay down both principal and accrued interest over time.'
  },
  {
    id: 'gpa-calculator',
    name: 'GPA Calculator',
    slug: 'gpa-calculator',
    category: 'education',
    description: 'Calculate semester and cumulative Grade Point Average on 4.0 standard and weighted high school/college scales.',
    iconName: 'GraduationCap',
    keywords: ['gpa', 'grade point average', 'college grades', 'weighted gpa', 'academic standing'],
    featured: false,
    popular: false,
    status: 'coming-soon',
    relatedTools: ['percentage-calculator'],
    relatedGuides: ['word-count-guide-for-essays-and-seo'],
    howToUse: [
      'Add courses with respective grade letters and credit hours.',
      'The weighted or unweighted GPA calculates immediately.'
    ]
  },
  {
    id: 'time-difference-calculator',
    name: 'Days Between Dates Calculator',
    slug: 'time-difference-calculator',
    category: 'date-time',
    description: 'Find the total number of calendar days, business days, and working hours between any two chosen dates.',
    iconName: 'Clock',
    keywords: ['days between dates', 'date difference', 'working days', 'business days', 'calendar count'],
    featured: false,
    popular: false,
    status: 'coming-soon',
    relatedTools: ['age-calculator'],
    relatedGuides: ['how-to-calculate-exact-age']
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter & Validator',
    slug: 'json-formatter',
    category: 'developer-tools',
    description: 'Format, validate, beautify, and minify raw JSON payloads with instant syntax error detection.',
    iconName: 'Code',
    keywords: ['json formatter', 'json validator', 'beautify json', 'minify json', 'developer tool'],
    featured: false,
    popular: false,
    status: 'coming-soon',
    relatedTools: ['word-counter', 'case-converter'],
    relatedGuides: ['word-count-guide-for-essays-and-seo']
  },
  {
    id: 'case-converter',
    name: 'Case Converter',
    slug: 'case-converter',
    category: 'text-tools',
    description: 'Easily convert text between UPPERCASE, lowercase, Title Case, camelCase, kebab-case, and snake_case.',
    iconName: 'Type',
    keywords: ['case converter', 'uppercase', 'lowercase', 'title case', 'camelcase', 'kebab-case'],
    featured: false,
    popular: false,
    status: 'coming-soon',
    relatedTools: ['word-counter'],
    relatedGuides: ['word-count-guide-for-essays-and-seo']
  }
];

export function getToolBySlug(slug: string): ToolItem | undefined {
  return TOOLS.find((t) => t.slug === slug || t.id === slug);
}

export function getToolsByCategory(category: string): ToolItem[] {
  return TOOLS.filter((t) => t.category === category);
}

export function getPopularTools(): ToolItem[] {
  return TOOLS.filter((t) => t.popular);
}

export function getFeaturedTools(): ToolItem[] {
  return TOOLS.filter((t) => t.featured);
}
