import { useEffect } from 'react';

export function useHotkeys({
  onBuy,
  onSell,
  onDrawHorizLine,
  onReplayStep,
  onReplayStepBack,
  onResetTool,
  onToggleFullscreen
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore key events when user is typing inside an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }

      if (e.key === 'b' || e.key === 'B') {
        if (!e.altKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          if (onBuy) onBuy();
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (!e.altKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          if (onSell) onSell();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          if (onToggleFullscreen) onToggleFullscreen();
        }
      } else if ((e.key === 'h' || e.key === 'H') && e.altKey) {
        e.preventDefault();
        if (onDrawHorizLine) onDrawHorizLine();
      } else if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowRight' && onReplayStep) onReplayStep();
        if (e.key === 'ArrowLeft' && onReplayStepBack) onReplayStepBack();
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (onReplayStep) onReplayStep();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (onResetTool) onResetTool();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBuy, onSell, onDrawHorizLine, onReplayStep, onReplayStepBack, onResetTool, onToggleFullscreen]);
}
