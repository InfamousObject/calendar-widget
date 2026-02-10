import { ReactNode } from 'react';

interface Step {
  title: string;
  description?: string;
  content?: ReactNode;
}

interface StepListProps {
  steps: Step[];
}

export function StepList({ steps }: StepListProps) {
  return (
    <div className="space-y-6">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              {index + 1}
            </div>
          </div>
          <div className="flex-1 pt-0.5">
            <h3 className="font-semibold text-lg">{step.title}</h3>
            {step.description && (
              <p className="text-muted-foreground mt-1">{step.description}</p>
            )}
            {step.content && <div className="mt-4">{step.content}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

interface TipProps {
  children: ReactNode;
  type?: 'info' | 'warning' | 'success';
}

export function Tip({ children, type = 'info' }: TipProps) {
  const styles = {
    info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
    warning: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
    success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
  };

  const labels = {
    info: 'Tip',
    warning: 'Important',
    success: 'Success',
  };

  return (
    <div className={`p-4 rounded-lg border ${styles[type]}`}>
      <p className="text-sm font-semibold mb-1">{labels[type]}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
