import React from 'react';
import { Play, Pause, SkipForward, SkipBack, FastForward, Sliders, History, Scissors } from 'lucide-react';

export const ReplayControls = React.memo(function ReplayControls({
  isReplayMode,
  onToggleReplayMode,
  isSelectingReplayCut,
  onToggleSelectReplayCut,
  isPlaying,
  onTogglePlay,
  onStepNext,
  onStepPrev,
  onJumpToLatest,
  replayIndex,
  totalCandles,
  onScrubReplay,
  playbackSpeed,
  onChangePlaybackSpeed
}) {
  const progressPct = totalCandles > 1 ? ((replayIndex / (totalCandles - 1)) * 100).toFixed(1) : 100;

  return (
    <div className="bg-slate-900/95 border-t border-b border-slate-800 px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
      
      {/* Left: Replay Mode Toggle & Candle Cut Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onToggleReplayMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition-all border ${
            isReplayMode
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <History className={`w-4 h-4 ${isReplayMode ? 'text-cyan-400' : ''}`} />
          <span>{isReplayMode ? 'BAR REPLAY ON' : 'ENABLE BAR REPLAY'}</span>
        </button>

        {isReplayMode && (
          <button
            onClick={onToggleSelectReplayCut}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              isSelectingReplayCut
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow animate-pulse'
                : 'bg-slate-950 text-amber-400 border-slate-800 hover:bg-slate-900'
            }`}
            title="Click any candle on chart to set Replay start point"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>{isSelectingReplayCut ? 'Click Candle on Chart...' : 'Jump to Candle ✂️'}</span>
          </button>
        )}

        {isReplayMode && (
          <span className="text-[11px] text-cyan-400 font-mono hidden lg:inline-block bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
            Candle {replayIndex + 1} / {totalCandles}
          </span>
        )}
      </div>

      {/* Middle: Stepper & Playback Controls */}
      {isReplayMode && (
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
          {/* Step Back */}
          <button
            onClick={onStepPrev}
            disabled={replayIndex <= 0}
            className="p-1.5 text-slate-300 hover:text-cyan-400 disabled:opacity-30 rounded hover:bg-slate-900 transition-all"
            title="Step 1 Candle Back"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause Toggle */}
          <button
            onClick={onTogglePlay}
            className={`p-2 rounded-lg font-bold transition-all ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg'
            }`}
            title={isPlaying ? 'Pause Replay' : 'Auto-Play Replay'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {/* Step Next */}
          <button
            onClick={onStepNext}
            disabled={replayIndex >= totalCandles - 1}
            className="p-1.5 text-slate-300 hover:text-cyan-400 disabled:opacity-30 rounded hover:bg-slate-900 transition-all"
            title="Step 1 Candle Forward (Advance Time)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Fast Forward to Latest */}
          <button
            onClick={onJumpToLatest}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-900 transition-all ml-1 border-l border-slate-800"
            title="Jump to Latest Candle"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="ml-2 pl-2 border-l border-slate-800 flex items-center gap-1 text-[11px] font-mono">
            <span className="text-slate-500 hidden sm:inline">Speed:</span>
            {[0.5, 1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangePlaybackSpeed(spd)}
                className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                  playbackSpeed === spd
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Right: Progress Scrub Slider */}
      {isReplayMode && (
        <div className="flex items-center gap-2 w-full md:w-64">
          <input
            type="range"
            min={0}
            max={Math.max(0, totalCandles - 1)}
            value={replayIndex}
            onChange={(e) => onScrubReplay(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="font-mono text-[10px] text-slate-400 w-10 text-right">
            {progressPct}%
          </span>
        </div>
      )}
    </div>
  );
});
