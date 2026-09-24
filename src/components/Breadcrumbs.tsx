import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbItem } from '../types';
import { Link } from '../context/RouterContext';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const allItems: BreadcrumbItem[] = [{ label: 'Home', path: '/' }, ...items];

  return (
    <nav aria-label="Breadcrumb" className="py-2.5 text-sm font-sans text-[#6D6582]">
      <ol className="flex items-center flex-wrap gap-1.5 list-none m-0 p-0">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-[#9D95B3] shrink-0" aria-hidden="true" />
              )}
              {isLast || !item.path ? (
                <span
                  className="font-heading font-medium text-[#1E1035] truncate max-w-[200px] sm:max-w-none"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {index === 0 ? (
                    <span className="flex items-center gap-1">
                      <Home className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <span>{item.label}</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </span>
              ) : (
                <Link
                  href={item.path}
                  className="text-[#6D6582] hover:text-[#7C3AED] transition-colors flex items-center gap-1"
                >
                  {index === 0 ? (
                    <>
                      <Home className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <span>{item.label}</span>
                    </>
                  ) : (
                    item.label
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
