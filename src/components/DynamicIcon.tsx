import React from 'react';
import {
  Calculator,
  Percent,
  Calendar,
  FileText,
  ArrowLeftRight,
  GraduationCap,
  Code,
  DollarSign,
  Clock,
  Type,
  Search,
  Check,
  Copy,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Info,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Menu,
  X,
  BookOpen,
  Layers,
  ArrowRight,
  LucideProps
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  Calculator,
  Percent,
  Calendar,
  FileText,
  ArrowLeftRight,
  GraduationCap,
  Code,
  DollarSign,
  Clock,
  Type,
  Search,
  Check,
  Copy,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Info,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Menu,
  X,
  BookOpen,
  Layers,
  ArrowRight,
};

interface DynamicIconProps extends LucideProps {
  name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const Component = ICON_MAP[name] || Calculator;
  return <Component {...props} />;
}
