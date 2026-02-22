import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Checkbox } from '@/core/components/ui/checkbox';
import { AdjustAttemptScoreDTO } from '../types/quiz.types';

interface ScoreAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentScore: number | null;
  passingScore: number;
  onConfirm: (data: AdjustAttemptScoreDTO) => void;
  isLoading?: boolean;
}

const ScoreAdjustmentDialog = ({
  open,
  onOpenChange,
  currentScore,
  passingScore,
  onConfirm,
  isLoading = false,
}: ScoreAdjustmentDialogProps) => {
  const [adjustedScore, setAdjustedScore] = useState<string>(
    currentScore != null ? String(currentScore) : '',
  );
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [overridePassStatus, setOverridePassStatus] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setAdjustedScore(currentScore != null ? String(currentScore) : '');
      setAdjustmentReason('');
      setOverridePassStatus(undefined);
    }
  }, [open, currentScore]);

  const scoreNum = adjustedScore.trim() === '' ? null : Number(adjustedScore);
  const isValid =
    scoreNum !== null && !Number.isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onConfirm({
      adjustedScore: scoreNum!,
      adjustmentReason: adjustmentReason.trim() || undefined,
      overridePassStatus: overridePassStatus,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust quiz score</DialogTitle>
          <DialogDescription>
            Manually set the final score for this attempt (0–100). Current score:{' '}
            {currentScore != null ? `${currentScore.toFixed(1)}%` : '—'}. Passing: {passingScore}%.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adjustedScore">Adjusted score (0–100)</Label>
            <Input
              id="adjustedScore"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={adjustedScore}
              onChange={(e) => setAdjustedScore(e.target.value)}
              placeholder="e.g. 85"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adjustmentReason">Reason (optional)</Label>
            <Textarea
              id="adjustmentReason"
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              placeholder="e.g. Partial credit for explanation"
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="overridePassStatus"
              checked={overridePassStatus === true}
              onCheckedChange={(checked) =>
                setOverridePassStatus(checked === true ? true : checked === false ? false : undefined)
              }
            />
            <Label
              htmlFor="overridePassStatus"
              className="text-sm font-normal cursor-pointer"
            >
              Override pass/fail (check to mark as passed regardless of score)
            </Label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading ? 'Saving…' : 'Save score'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreAdjustmentDialog;
