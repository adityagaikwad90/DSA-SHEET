import { toast } from 'sonner';

/**
 * Rich Toast Notification Utility for DSA Sheet (Sonner)
 * Provides interactive toasts with undo actions, streak updates, and error recovery.
 */

export const showSolvedToast = (questionTitle, onUndo = null) => {
  toast.success(`Solved: ${questionTitle || 'Question'}! 🎉`, {
    description: 'Added to your progress and streak metrics.',
    duration: 4000,
    action: onUndo
      ? {
          label: 'Undo',
          onClick: () => {
            onUndo();
            toast.info(`Marked "${questionTitle}" as unsolved.`);
          }
        }
      : undefined
  });
};

export const showNeedsPracticeToast = (questionTitle, nextReviewDays = 1) => {
  toast.warning(`Queued for Review: ${questionTitle}`, {
    description: `Spaced repetition scheduled in ${nextReviewDays} day${nextReviewDays === 1 ? '' : 's'}.`,
    duration: 4000
  });
};

export const showSyncErrorToast = (errorMessage, onRetry = null) => {
  toast.error('Sync to cloud delayed', {
    description: errorMessage || 'Your progress is safely stored in local cache.',
    duration: 5000,
    action: onRetry
      ? {
          label: 'Retry Sync',
          onClick: () => onRetry()
        }
      : undefined
  });
};

export const showReviewSuccessToast = (questionTitle) => {
  toast.success(`Completed Spaced Review for "${questionTitle}"!`, {
    description: 'Interval increased via SM-2 algorithm.',
    duration: 3500
  });
};

