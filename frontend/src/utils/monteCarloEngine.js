/**
 * Monte Carlo 1,000-Run Risk Simulation Engine
 * Performs bootstrap resamplings on trade history to calculate sequence risk, Max Drawdown %, and Risk of Ruin.
 */

export function runMonteCarloSimulation(tradeHistory, startingBalance = 10000, numSimulations = 1000, tradesPerRun = 30) {
  // If tradeHistory is empty or small, generate synthetic trade distribution based on realistic quant baseline
  let pnlPctPool = [];

  if (tradeHistory && tradeHistory.length >= 3) {
    pnlPctPool = tradeHistory.map(t => {
      const pnl = t.pnl || 0;
      const initialVal = t.sizeUsd || 1000;
      return (pnl / initialVal) * 100;
    });
  } else {
    // Default bootstrap pool if user hasn't completed enough trades yet
    pnlPctPool = [4.2, -2.1, 5.0, -1.8, 6.5, -2.5, -2.0, 3.8, 4.5, -1.9, 7.1, -2.8];
  }

  const simulations = [];
  const finalBalances = [];
  const maxDrawdownsPct = [];
  let ruinCount = 0;

  for (let s = 0; s < numSimulations; s++) {
    let currentBal = startingBalance;
    let peakBal = startingBalance;
    let maxDrawdownPct = 0;
    const curve = [startingBalance];

    for (let t = 0; t < tradesPerRun; t++) {
      // Bootstrap sample with replacement
      const randomReturnPct = pnlPctPool[Math.floor(Math.random() * pnlPctPool.length)];
      const tradeAmount = currentBal * 0.1; // 10% risk per trade
      const pnlAmount = tradeAmount * (randomReturnPct / 100);
      
      currentBal += pnlAmount;
      if (currentBal < 0) currentBal = 0;

      if (currentBal > peakBal) peakBal = currentBal;
      const ddPct = peakBal > 0 ? ((peakBal - currentBal) / peakBal) * 100 : 0;
      if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;

      curve.push(Number(currentBal.toFixed(2)));
    }

    if (maxDrawdownPct >= 40.0 || currentBal <= startingBalance * 0.5) {
      ruinCount++;
    }

    finalBalances.push(currentBal);
    maxDrawdownsPct.push(maxDrawdownPct);

    if (s < 15) {
      simulations.push(curve);
    }
  }

  // Sort metrics to find percentiles
  finalBalances.sort((a, b) => a - b);
  maxDrawdownsPct.sort((a, b) => a - b);

  const medianBalance = finalBalances[Math.floor(numSimulations * 0.5)];
  const worst5PctBalance = finalBalances[Math.floor(numSimulations * 0.05)];
  const best5PctBalance = finalBalances[Math.floor(numSimulations * 0.95)];

  const medianMaxDrawdownPct = maxDrawdownsPct[Math.floor(numSimulations * 0.5)];
  const worstMaxDrawdownPct = maxDrawdownsPct[Math.floor(numSimulations * 0.95)];

  const riskOfRuinPct = Number(((ruinCount / numSimulations) * 100).toFixed(1));

  let riskVerdict = 'LOW RISK (QUANT APPROVED)';
  let riskVerdictColor = 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';

  if (riskOfRuinPct > 15 || worstMaxDrawdownPct > 35) {
    riskVerdict = 'CRITICAL RISK OF RUIN';
    riskVerdictColor = 'text-rose-400 bg-rose-500/20 border-rose-500/40';
  } else if (riskOfRuinPct > 5 || worstMaxDrawdownPct > 20) {
    riskVerdict = 'MODERATE SEQUENCE RISK';
    riskVerdictColor = 'text-amber-400 bg-amber-500/20 border-amber-500/40';
  }

  return {
    numSimulations,
    tradesPerRun,
    startingBalance,
    medianBalance: Number(medianBalance.toFixed(2)),
    worst5PctBalance: Number(worst5PctBalance.toFixed(2)),
    best5PctBalance: Number(best5PctBalance.toFixed(2)),
    medianMaxDrawdownPct: Number(medianMaxDrawdownPct.toFixed(1)),
    worstMaxDrawdownPct: Number(worstMaxDrawdownPct.toFixed(1)),
    riskOfRuinPct,
    riskVerdict,
    riskVerdictColor,
    sampleCurves: simulations
  };
}
