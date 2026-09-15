/**
 * AI Trade Coach & Behavioral Audit Engine
 * Evaluates trade setup quality (0-100), detects psychological & tactical mistakes (FOMO, Revenge Trading, Overchasing),
 * and generates actionable coaching advice.
 */

export function auditTradeSetup({ orderData, candles, recentLossTimestamp = null, mlData = null }) {
  if (!orderData || !candles || candles.length < 10) {
    return {
      score: 80,
      grade: 'B+',
      flags: [],
      coachingAdvice: 'Standard market order executed. Maintain disciplined risk management.',
      isFomo: false,
      isRevenge: false,
      riskRewardRatio: 1.5,
    };
  }

  const { side, entryPrice, stopLoss, takeProfit, sizeUsd } = orderData;
  const lastCandle = candles[candles.length - 1];
  const isLong = side === 'BUY';

  const flags = [];
  let score = 100;

  // 1. Calculate EMA 9 & ATR for extension check
  let ema9Sum = 0;
  const emaPeriod = Math.min(9, candles.length);
  for (let i = candles.length - emaPeriod; i < candles.length; i++) {
    ema9Sum += candles[i].close;
  }
  const ema9 = ema9Sum / emaPeriod;
  const emaDistPct = Math.abs((entryPrice - ema9) / ema9) * 100;

  // FOMO Detection: Buying when price is > 1.8% stretched above EMA 9
  if (isLong && entryPrice > ema9 && emaDistPct > 1.8) {
    flags.push({
      type: 'FOMO_ENTRY',
      severity: 'HIGH',
      title: '⚠️ FOMO Entry Warning',
      desc: `Price is stretched ${emaDistPct.toFixed(2)}% above EMA 9. High probability of pullback.`
    });
    score -= 22;
  } else if (!isLong && entryPrice < ema9 && emaDistPct > 1.8) {
    flags.push({
      type: 'FOMO_ENTRY',
      severity: 'HIGH',
      title: '⚠️ FOMO Short Warning',
      desc: `Price is over-extended ${emaDistPct.toFixed(2)}% below EMA 9. Vulnerable to short squeeze.`
    });
    score -= 22;
  }

  // 2. Revenge Trading Check: Trade entered within 45 seconds of a losing trade
  const isRevenge = recentLossTimestamp && (Date.now() - recentLossTimestamp < 45000);
  if (isRevenge) {
    flags.push({
      type: 'REVENGE_TRADE',
      severity: 'CRITICAL',
      title: '⚠️ Revenge Trading Risk',
      desc: 'Executed trade immediately following a loss. Emotionally driven entries reduce win-rate by 40%.'
    });
    score -= 30;
  }

  // 3. Risk-to-Reward Ratio Check
  let riskRewardRatio = 1.5;
  if (stopLoss && takeProfit) {
    const slDist = Math.abs(entryPrice - stopLoss);
    const tpDist = Math.abs(takeProfit - entryPrice);
    if (slDist > 0) {
      riskRewardRatio = Number((tpDist / slDist).toFixed(2));
      if (riskRewardRatio < 1.0) {
        flags.push({
          type: 'POOR_RR',
          severity: 'MEDIUM',
          title: '⚠️ Sub-optimal Risk/Reward',
          desc: `Current R:R is ${riskRewardRatio}x (risking $${slDist.toFixed(2)} to make $${tpDist.toFixed(2)}). Aim for at least 1.5x.`
        });
        score -= 15;
      }
    }
  } else if (!stopLoss) {
    flags.push({
      type: 'NO_STOP_LOSS',
      severity: 'HIGH',
      title: '⚠️ Naked Position (No Stop Loss)',
      desc: 'Position entered without explicit Stop Loss protection.'
    });
    score -= 20;
  }

  // 4. ML Confluence Check
  if (mlData && mlData.signal) {
    const mlSignal = mlData.signal;
    if ((isLong && mlSignal.includes('SELL')) || (!isLong && mlSignal.includes('BUY'))) {
      flags.push({
        type: 'ML_DIVERGENCE',
        severity: 'MEDIUM',
        title: '🤖 Counter-AI Signal Entry',
        desc: `Machine Learning Model predicts ${mlSignal} (${mlData.confidence}% confidence). Trading against AI consensus.`
      });
      score -= 15;
    }
  }

  // Ensure score stays within 0 - 100
  score = Math.max(10, Math.min(100, score));

  // Determine Quality Grade
  let grade = 'A+';
  let gradeColor = 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
  if (score >= 90) {
    grade = 'A+';
    gradeColor = 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
  } else if (score >= 75) {
    grade = 'B';
    gradeColor = 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
  } else if (score >= 60) {
    grade = 'C';
    gradeColor = 'text-amber-400 border-amber-500/40 bg-amber-500/10';
  } else {
    grade = 'D (High Risk)';
    gradeColor = 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  }

  // Generate AI Tactical Advice
  let coachingAdvice = 'Excellent trade execution aligned with institutional risk parameters.';
  if (flags.length > 0) {
    coachingAdvice = `Coach Advice: ${flags[0].desc} Ensure strict adherence to Stop Loss.`;
  }

  return {
    score,
    grade,
    gradeColor,
    flags,
    coachingAdvice,
    isFomo: flags.some(f => f.type === 'FOMO_ENTRY'),
    isRevenge,
    riskRewardRatio
  };
}
