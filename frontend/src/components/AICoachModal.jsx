import React from 'react';
import { ShieldAlert, Award, CheckCircle2, AlertTriangle, Cpu, X, Zap } from 'lucide-react';

export function AICoachModal({ isOpen, onClose, auditResult, trade }) {
  if (!isOpen || !auditResult) return null;

  const { score, grade, gradeColor, flags, coachingAdvice, riskRewardRatio } = auditResult;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col font-sans select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
                <span>AI TRADE COACH & AUDIT</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/40 font-mono">LIVE AI</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Real-time Tactical & Behavioral Assessment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Trade Quality Score Scorecard */}
          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800/90 shadow-inner">
            <div>
              <div className="text-slate-400 font-mono text-[11px]">TRADE QUALITY SCORE</div>
              <div className="text-3xl font-black font-mono text-slate-100 mt-1 flex items-baseline gap-1">
                <span>{score}</span>
                <span className="text-slate-500 text-sm">/ 100</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Risk-to-Reward: <span className="font-bold text-slate-200">{riskRewardRatio}x</span>
              </div>
            </div>

            <div className={`px-4 py-2 rounded-xl border font-bold text-sm text-center shadow-lg ${gradeColor}`}>
              <div className="text-[10px] text-slate-400 uppercase font-mono">GRADE</div>
              <div className="text-xl font-mono font-black">{grade}</div>
            </div>
          </div>

          {/* Detected Tactical & Behavioral Mistakes */}
          <div>
            <div className="font-bold text-slate-300 mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Behavioral & Risk Audit Flags ({flags.length})</span>
            </div>

            {flags.length === 0 ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero behavioral errors detected. Clean execution matching risk parameters.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {flags.map((flag, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      flag.severity === 'CRITICAL'
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                        : flag.severity === 'HIGH'
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs flex items-center gap-2 font-mono">
                        <span>{flag.title}</span>
                      </div>
                      <div className="text-[11px] opacity-90 mt-0.5 font-sans leading-relaxed">{flag.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Coach Tactical Recommendation */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-cyan-500/30 shadow-md">
            <div className="font-bold text-cyan-400 flex items-center gap-1.5 text-[11px] font-mono uppercase mb-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Coach Recommendation</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
              {coachingAdvice}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs transition-all shadow active:scale-95 cursor-pointer"
          >
            Acknowledge & Continue
          </button>
        </div>

      </div>
    </div>
  );
}
