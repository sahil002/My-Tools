import { GuideArticle } from '../types';

export const GUIDES: GuideArticle[] = [
  {
    title: 'How to Calculate Percentage: The Complete Step-by-Step Guide',
    slug: 'how-to-calculate-percentage',
    description: 'Learn how to calculate percentages, percentage increases, discounts, and percentage differences with practical formulas and clear examples.',
    category: 'calculators',
    author: 'Editorial Math Team',
    publishedDate: '2026-02-10',
    updatedDate: '2026-08-15',
    readingTime: '5 min read',
    quickAnswer: 'To find what percentage a number X is of Y, divide X by Y and multiply by 100: (X / Y) × 100. To find X% of Y, multiply Y by (X / 100).',
    formula: 'Percentage (%) = (Part / Whole) × 100',
    sections: [
      {
        title: 'Understanding What a Percentage Actually Is',
        paragraphs: [
          'The word "percent" stems from the Latin "per centum", which translates directly to "by the hundred". In mathematical terms, a percentage is a dimensionless ratio or fraction where the denominator is always fixed at 100.',
          'Using a standardized scale of 100 makes it straightforward to compare proportional sizes. For example, comparing 17 out of 25 against 48 out of 70 is challenging at a glance, but converting both to 68% and 68.57% makes comparison immediate.'
        ]
      },
      {
        title: 'The Three Fundamental Percentage Scenarios',
        paragraphs: [
          'In everyday personal finance, business, and schoolwork, you will almost always encounter one of three standard scenarios:'
        ],
        listItems: [
          'Finding a percentage of a given number (e.g. "What is 20% of $80?")',
          'Finding what percentage one number is of another (e.g. "Score of 42 out of 50 is what percent?")',
          'Finding the percentage change or increase/decrease between two values (e.g. "Price went from $40 to $50")'
        ]
      },
      {
        title: 'Formulas for Quick Calculation',
        paragraphs: [
          'Memorize or bookmark these three basic formulations to solve any problem rapidly:'
        ],
        table: {
          headers: ['Objective', 'Standard Formula', 'Mental Shortcut'],
          rows: [
            ['X% of Number Y', '(X ÷ 100) × Y', 'Find 10% (move decimal left by 1) then scale'],
            ['Part X as % of Whole Y', '(X ÷ Y) × 100', 'Simplify fraction first if possible'],
            ['% Change from Old to New', '((New - Old) ÷ Old) × 100', 'Positive value = increase, negative = decrease']
          ]
        }
      }
    ],
    practicalExamples: [
      {
        title: 'Practical Example: Calculating a Store Sale Discount',
        scenario: 'A winter jacket original price is $160, marked down by 25%.',
        steps: [
          'Convert the percentage into decimal: 25 ÷ 100 = 0.25',
          'Multiply original price: $160 × 0.25 = $40 discount',
          'Subtract discount from original price: $160 - $40 = $120 final cost'
        ],
        result: 'The discount is $40, making the final price $120.'
      },
      {
        title: 'Practical Example: Fuel Price Increase',
        scenario: 'Gas price increases from $3.20 per gallon to $3.84.',
        steps: [
          'Find absolute difference: 3.84 - 3.20 = 0.64',
          'Divide by starting price: 0.64 ÷ 3.20 = 0.20',
          'Convert to percentage: 0.20 × 100 = 20%'
        ],
        result: 'The price increased by 20%.'
      }
    ],
    commonMistakes: [
      'Dividing by the final value instead of the original initial value when computing percentage changes.',
      'Assuming that a 50% discount followed by an additional 20% discount equals 70% off (the second discount applies only to the already discounted price).',
      'Confusing percentage points with percentage change (e.g., an interest rate moving from 4% to 5% is a 1 percentage point change, but a 25% relative increase).'
    ],
    relatedTools: ['percentage-calculator', 'age-calculator', 'loan-calculator'],
    relatedGuides: ['how-to-calculate-exact-age', 'word-count-guide-for-essays-and-seo'],
    faq: [
      {
        question: 'How do you calculate percentage backwards?',
        answer: 'If you know the final amount after a percentage increase/decrease, divide the final amount by (1 + percentage/100) for increases, or (1 - percentage/100) for decreases.'
      },
      {
        question: 'Is percentage increase capped at 100%?',
        answer: 'No. Percentage increase can exceed 100%. For example, tripling a number from 10 to 30 is a 200% increase.'
      }
    ]
  },
  {
    title: 'How to Calculate Exact Age Chronologically and Between Dates',
    slug: 'how-to-calculate-exact-age',
    description: 'A comprehensive guide explaining the Gregorian calendar math behind calculating exact chronological age, months, and days.',
    category: 'date-time',
    author: 'Calendar Systems Research',
    publishedDate: '2026-03-01',
    updatedDate: '2026-07-22',
    readingTime: '4 min read',
    quickAnswer: 'Subtract the birth year, month, and day from the current date, carrying over 12 months if the current month is earlier, and carrying over the preceding month\'s day count if the current day is earlier.',
    formula: 'Age = (Year_now - Year_birth) - borrow_adjustment',
    sections: [
      {
        title: 'Why Age Calculation Is More Complex Than Division',
        paragraphs: [
          'A common misconception is that dividing the total number of days lived by 365 or 365.25 produces an accurate age in years. While this gives a rough approximation, it frequently introduces errors of days or weeks.',
          'True chronological age requires honoring the variable lengths of calendar months (28, 29, 30, or 31 days) as well as the rules governing leap years in the Gregorian calendar.'
        ]
      },
      {
        title: 'The Borrowing Method Step-by-Step',
        paragraphs: [
          'To calculate by hand without software tools:',
          '1. Compare days: If current day < birth day, borrow days from the previous month (28, 29, 30, or 31 depending on month and year).',
          '2. Compare months: If current month < birth month, borrow 12 months from the current year.',
          '3. Subtract remaining years.'
        ]
      }
    ],
    practicalExamples: [
      {
        title: 'Example: Evaluating Age with Month Borrowing',
        scenario: 'Person born November 20, 2000 evaluated on May 10, 2026.',
        steps: [
          'Days: 10 is less than 20, so borrow from April (30 days). 10 + 30 - 20 = 20 days. May becomes 4 months (April).',
          'Months: 4 is less than 11, so borrow 12 months from 2026. 4 + 12 - 11 = 5 months. 2026 becomes 2025.',
          'Years: 2025 - 2000 = 25 years.'
        ],
        result: 'Exact age: 25 years, 5 months, and 20 days.'
      }
    ],
    commonMistakes: [
      'Assuming all months have 30 days when borrowing.',
      'Forgetting that leap years add February 29th, altering total day counts.'
    ],
    relatedTools: ['age-calculator', 'percentage-calculator', 'time-difference-calculator'],
    relatedGuides: ['how-to-calculate-percentage'],
    faq: [
      {
        question: 'When is a leap-day baby legally one year older?',
        answer: 'In common law jurisdictions without specific statutory provisions, people born on February 29 legally turn a year older on March 1 in non-leap years, though some regional statutes recognize February 28.'
      }
    ]
  },
  {
    title: 'Word Count Guide for Essays, SEO Articles, and Social Media Limits',
    slug: 'word-count-guide-for-essays-and-seo',
    description: 'Optimal word and character count benchmarks for academic writing, search engine optimization content, and social media platforms.',
    category: 'text-tools',
    author: 'Content Strategy Desk',
    publishedDate: '2026-01-18',
    updatedDate: '2026-06-11',
    readingTime: '6 min read',
    quickAnswer: 'SEO blog posts perform best between 1,500–2,500 words. Academic essays typically range from 1,000–3,000 words. Social media platforms enforce strict character limits (e.g., 280 on X, 2,200 on Instagram).',
    formula: 'Reading Time (minutes) = Total Words ÷ 225 wpm',
    sections: [
      {
        title: 'Why Word Count and Length Matter',
        paragraphs: [
          'Target word count is not just an arbitrary constraint; it directly reflects depth, conciseness, and reader attention spans.',
          'In search engine ranking, comprehensive coverage of a topic naturally requires 1,200 to 2,500 words to answer user search intent without superficial fluff. In academic submissions, word boundaries force concise logical structure.'
        ]
      },
      {
        title: 'Platform Word & Character Count Benchmarks',
        paragraphs: [
          'Here is a quick reference table for standard publication formats:'
        ],
        table: {
          headers: ['Content Type', 'Recommended Target', 'Key Metric'],
          rows: [
            ['Standard Blog Post', '800 – 1,200 words', 'Reading time (~4 min)'],
            ['In-Depth SEO Pillar Guide', '1,800 – 3,000 words', 'Keyword coverage & density'],
            ['Academic Essay (Undergraduate)', '1,500 – 2,500 words', 'Strict word limit'],
            ['LinkedIn Post', '150 – 300 words', 'Character count (< 3,000)'],
            ['Meta Description (SEO)', '150 – 160 characters', 'Snippet truncation limit']
          ]
        }
      }
    ],
    practicalExamples: [
      {
        title: 'Example: Estimating Essay Reading Time',
        scenario: 'An undergraduate term paper of 2,400 words.',
        steps: [
          'Take word total: 2,400 words',
          'Divide by average reading speed: 2,400 ÷ 225 = 10.66 minutes',
          'Divide by presentation speaking speed: 2,400 ÷ 130 = 18.46 minutes'
        ],
        result: 'Approx. 11 minutes to read silently, 18.5 minutes for a podium presentation.'
      }
    ],
    commonMistakes: [
      'Padding content with verbose qualifiers to artificially hit word minimums.',
      'Failing to verify whether an assignment counts bibliography/citations toward the maximum limit.'
    ],
    relatedTools: ['word-counter', 'case-converter', 'json-formatter'],
    relatedGuides: ['how-to-calculate-percentage'],
    faq: [
      {
        question: 'Does Google penalize short articles under 500 words?',
        answer: 'No, Google ranks content based on helpfulness and query intent. Simple questions require direct, short answers, while multi-faceted topics demand exhaustive coverage.'
      }
    ]
  },
  {
    title: 'Understanding Unit Conversion: Metric vs Imperial Standards',
    slug: 'understanding-unit-conversion',
    description: 'Learn the mathematical principles of converting units of length, mass, and temperature between metric and imperial systems.',
    category: 'converters',
    author: 'Physical Science Dept',
    publishedDate: '2026-04-05',
    updatedDate: '2026-08-01',
    readingTime: '5 min read',
    quickAnswer: 'To convert metric to imperial, multiply by the calibrated conversion factor (e.g. 1 kg = 2.20462 lbs, 1 km = 0.621371 miles). For temperature, apply formula: °F = (°C × 9/5) + 32.',
    formula: 'Target Unit = Base Unit × Factor  (or affine scaling for temperature)',
    sections: [
      {
        title: 'The Dual Measurement Paradigms',
        paragraphs: [
          'The International System of Units (SI, or Metric) is built on decimal base-10 increments, making scaling between millimeters, meters, and kilometers intuitive.',
          'The Imperial and US Customary systems, conversely, rely on historical fractional increments (12 inches in a foot, 3 feet in a yard, 16 ounces in a pound). Converting between them requires exact constant multipliers.'
        ]
      }
    ],
    practicalExamples: [
      {
        title: 'Example: Converting Kilograms to Pounds',
        scenario: 'A luggage bag weighs 23 kg at an international airport.',
        steps: [
          'Identify factor: 1 kg ≈ 2.20462 lbs',
          'Multiply: 23 × 2.20462 = 50.706 lbs'
        ],
        result: '23 kg is approximately 50.71 lbs.'
      }
    ],
    commonMistakes: [
      'Multiplying instead of dividing when going from smaller units to larger units.',
      'Forgetting the +32 offset when converting between Celsius and Fahrenheit.'
    ],
    relatedTools: ['unit-converter', 'percentage-calculator'],
    relatedGuides: ['how-to-calculate-percentage'],
    faq: [
      {
        question: 'Why is temperature conversion non-linear?',
        answer: 'Celsius and Fahrenheit have different zero points (0°C is freezing water, whereas 0°F is the freezing point of brine). Therefore, converting requires both scaling the interval (9/5) and shifting the origin (+32).'
      }
    ]
  }
];

export function getGuideBySlug(slug: string): GuideArticle | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getGuidesByCategory(category: string): GuideArticle[] {
  return GUIDES.filter((g) => g.category === category);
}
