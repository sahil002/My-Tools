export type ToolCategory =
  | 'calculators'
  | 'text-tools'
  | 'converters'
  | 'date-time'
  | 'education'
  | 'developer-tools';

export interface CategoryInfo {
  id: ToolCategory;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  seoTitle: string;
  seoDescription: string;
  toolCount: number;
  faq?: { question: string; answer: string }[];
}

export interface FormulaData {
  title: string;
  equation: string;
  explanation: string;
  variables?: { symbol: string; label: string }[];
}

export interface StepExample {
  title: string;
  scenario: string;
  steps: string[];
  result: string;
}

export interface ToolItem {
  id: string;
  name: string;
  slug: string;
  category: ToolCategory;
  description: string;
  iconName: string;
  keywords: string[];
  featured: boolean;
  popular: boolean;
  status: 'active' | 'coming-soon' | 'inactive';
  relatedTools: string[];
  relatedGuides: string[];
  howToUse?: string[];
  conceptExplanation?: string;
  formula?: FormulaData;
  stepExamples?: StepExample[];
  commonUseCases?: string[];
  commonMistakes?: string[];
  faq?: { question: string; answer: string }[];
}

export type Tool = ToolItem;

export interface GuideSection {
  title?: string;
  paragraphs: string[];
  listItems?: string[];
  formulaBox?: string;
  table?: {
    headers: string[];
    rows: string[][];
  };
}

export interface GuideArticle {
  title: string;
  slug: string;
  description: string;
  category: ToolCategory;
  author: string;
  publishedDate: string;
  updatedDate: string;
  readingTime: string;
  quickAnswer: string;
  formula?: string;
  sections: GuideSection[];
  practicalExamples: StepExample[];
  commonMistakes: string[];
  relatedTools: string[];
  relatedGuides: string[];
  faq: { question: string; answer: string }[];
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}
