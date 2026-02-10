'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { SupportDialog } from './support-dialog';

interface SupportButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function SupportButton({
  variant = 'ghost',
  size = 'sm',
  showLabel = false,
}: SupportButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setDialogOpen(true)}
        className="gap-2"
      >
        <HelpCircle className="h-4 w-4" />
        {showLabel && <span>Help</span>}
      </Button>
      <SupportDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
