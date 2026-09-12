/**
 * Dispatches a milestone celebration event at specific coordinates (or center of viewport).
 * Used exclusively for meaningful achievements:
 * - Solving a question
 * - Completing a task
 * - Completing a topic or sheet
 */
export const triggerRewardCelebration = (x, y) => {
    const posX = typeof x === 'number' && !isNaN(x) ? x : window.innerWidth / 2;
    const posY = typeof y === 'number' && !isNaN(y) ? y : window.innerHeight / 2;

    window.dispatchEvent(
        new CustomEvent('milestone-celebration', {
            detail: { x: posX, y: posY }
        })
    );
};
