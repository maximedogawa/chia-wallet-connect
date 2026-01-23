import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * Reusable page layout component with consistent spacing and max width
 */
export default function PageLayout({ children, maxWidth = '2xl' }: PageLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto w-full space-y-6`}>
      {children}
    </div>
  );
}
