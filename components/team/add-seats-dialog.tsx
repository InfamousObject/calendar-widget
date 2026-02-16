'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

interface AddSeatsDialogProps {
  onSeatsAdded?: () => void;
  children?: React.ReactNode;
}

export function AddSeatsDialog({ onSeatsAdded, children }: AddSeatsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handlePurchase = async () => {
    if (quantity < 1) return;

    setLoading(true);
    try {
      const response = await fetch('/api/team/seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add seats');
      }

      toast.success(`Successfully added ${quantity} seat${quantity > 1 ? 's' : ''}`);
      setOpen(false);
      setQuantity(1);
      onSeatsAdded?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add seats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            Add Seats
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Team Seats</DialogTitle>
          <DialogDescription>
            Purchase additional seats for your team. Each seat costs $5/month.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <Label htmlFor="quantity" className="mb-3 block">Number of seats to add</Label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={50}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="text-center w-20"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Total: <span className="font-medium text-foreground">${quantity * 5}/month</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Your next invoice will be prorated for the remaining billing period.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handlePurchase} disabled={loading || quantity < 1}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Add ${quantity} Seat${quantity > 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
