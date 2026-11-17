import { useMemo, useState } from 'react';

function formatINR(value: number): string {
  return '₹' + Math.round(value).toLocaleString('en-IN');
}

function futureValueMonthly(monthly: number, years: number, annualRate: number): number {
  const r = annualRate / 12 / 100;
  const n = years * 12;
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

export function GrowthVisualizerPanel() {
  const [monthlyAmount, setMonthlyAmount] = useState(2000);
  const [years, setYears] = useState(5);
  const [sipRate, setSipRate] = useState(12);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const fdRate = 6.5;

  const series = useMemo(() => {
    const points: Array<{
      year: number;
      invested: number;
      fdValue: number;
      sipValue: number;
    }> = [];
    for (let y = 0; y <= years; y++) {
      points.push({
        year: y,
        invested: monthlyAmount * y * 12,
        fdValue: y === 0 ? 0 : futureValueMonthly(monthlyAmount, y, fdRate),
        sipValue: y === 0 ? 0 : futureValueMonthly(monthlyAmount, y, sipRate),
      });
    }
    return points;
  }, [monthlyAmount, years, sipRate]);

  const finalPoint = series[series.length - 1];
  const activePoint =
    hoveredYear !== null && series[hoveredYear] ? series[hoveredYear] : finalPoint;

  const maxVal = Math.max(finalPoint.sipValue, finalPoint.fdValue, 1);

  // SVG chart dimensions
  const width = 640;
  const height = 280;
  const padLeft = 58;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const xForYear = (y: number) => padLeft + (years === 0 ? 0 : (y / years) * plotW);
  const yForVal = (v: number) => padTop + plotH - (v / maxVal) * plotH;

  const buildPath = (key: 'invested' | 'fdValue' | 'sipValue') =>
    series
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${xForYear(pt.year).toFixed(1)} ${yForVal(pt[key]).toFixed(1)}`)
      .join(' ');

  const sipAreaPath = `${buildPath('sipValue')} L ${xForYear(years).toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${xForYear(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

  const yTicks = [0, 0.5, 1].map((ratio) => ({
    val: maxVal * ratio,
    y: yForVal(maxVal * ratio),
  }));

  const extraSipGain = finalPoint.sipValue - finalPoint.fdValue;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Compounding Visualizer: SIP vs. Fixed Deposit
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Adjust monthly savings and time horizon to see how small ₹500–₹20,000 habits compound.
        </p>
      </div>

      {/* Two-Zone Educational Layout: Left Interactive Stage, Right Control & Concept Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Zone: Interactive Growth Curve Stage */}
        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs text-slate-600">
            <span className="font-medium text-slate-900">
              Year {activePoint.year} Snapshot
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
                Index SIP ({sipRate}% p.a.)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-600 inline-block" />
                FD / RD (6.5% p.a.)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
                Amount Put In
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto overflow-visible"
              role="img"
              aria-label="Interactive SIP versus Fixed Deposit compounding chart"
            >
              {/* Horizontal Gridlines */}
              {yTicks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={tick.y}
                    x2={width - padRight}
                    y2={tick.y}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 8}
                    y={tick.y + 4}
                    textAnchor="end"
                    className="fill-slate-500 text-[10px] font-mono"
                  >
                    {tick.val >= 100000
                      ? `₹${(tick.val / 100000).toFixed(1)}L`
                      : `₹${Math.round(tick.val / 1000)}k`}
                  </text>
                </g>
              ))}

              {/* SIP Area */}
              <path d={sipAreaPath} fill="rgba(5, 150, 105, 0.08)" />

              {/* Curves */}
              <path
                d={buildPath('invested')}
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2"
                strokeDasharray="5 4"
              />
              <path d={buildPath('fdValue')} fill="none" stroke="#2563EB" strokeWidth="2.5" />
              <path d={buildPath('sipValue')} fill="none" stroke="#059669" strokeWidth="3" />

              {/* Interactive Year Columns */}
              {series.map((pt) => {
                const cx = xForYear(pt.year);
                const isActive = activePoint.year === pt.year;
                return (
                  <g key={pt.year}>
                    {isActive && (
                      <>
                        <line
                          x1={cx}
                          y1={padTop}
                          x2={cx}
                          y2={padTop + plotH}
                          stroke="#CBD5E1"
                          strokeWidth="1"
                        />
                        <circle cx={cx} cy={yForVal(pt.sipValue)} r="4.5" fill="#059669" />
                        <circle cx={cx} cy={yForVal(pt.fdValue)} r="4" fill="#2563EB" />
                      </>
                    )}
                    <rect
                      x={cx - plotW / Math.max(years, 1) / 2}
                      y={padTop}
                      width={plotW / Math.max(years, 1)}
                      height={plotH}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredYear(pt.year)}
                      onMouseLeave={() => setHoveredYear(null)}
                    />
                  </g>
                );
              })}

              {/* X-axis Labels */}
              {[0, Math.round(years / 2), years]
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .map((yr) => (
                  <text
                    key={yr}
                    x={xForYear(yr)}
                    y={height - 8}
                    textAnchor="middle"
                    className="fill-slate-500 text-[10px] font-mono"
                  >
                    Yr {yr}
                  </text>
                ))}
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200">
            <div>
              <p className="text-xs text-slate-500">Money You Put In</p>
              <p className="text-base sm:text-lg font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                {formatINR(activePoint.invested)}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-700">FD / RD Value (6.5%)</p>
              <p className="text-base sm:text-lg font-semibold font-mono tabular-nums text-blue-700 mt-0.5">
                {formatINR(activePoint.fdValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-emerald-700">Index SIP ({sipRate}%)</p>
              <p className="text-base sm:text-lg font-semibold font-mono tabular-nums text-emerald-700 mt-0.5">
                {formatINR(activePoint.sipValue)}
              </p>
            </div>
          </div>
        </div>

        {/* Right Zone: Control & Concept Deck */}
        <div className="lg:col-span-5 space-y-5">
          <div>
            <div className="flex justify-between text-sm font-medium text-slate-800 mb-2">
              <label htmlFor="sip-monthly">Monthly Savings</label>
              <span className="font-mono tabular-nums text-blue-700">
                {formatINR(monthlyAmount)} / mo
              </span>
            </div>
            <input
              id="sip-monthly"
              type="range"
              min={500}
              max={25000}
              step={500}
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(Number(e.target.value))}
              className="w-full accent-blue-700"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
              <span>₹500</span>
              <span>₹10,000</span>
              <span>₹25,000</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm font-medium text-slate-800 mb-2">
              <label htmlFor="sip-years">Time Horizon</label>
              <span className="font-mono tabular-nums text-blue-700">
                {years} {years === 1 ? 'Year' : 'Years'}
              </span>
            </div>
            <input
              id="sip-years"
              type="range"
              min={1}
              max={20}
              step={1}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-blue-700"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
              <span>1 Yr</span>
              <span>10 Yrs</span>
              <span>20 Yrs</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm font-medium text-slate-800 mb-2">
              <label htmlFor="sip-rate">Expected Index Return (Illustrative)</label>
              <span className="font-mono tabular-nums text-blue-700">{sipRate.toFixed(1)}% p.a.</span>
            </div>
            <input
              id="sip-rate"
              type="range"
              min={8}
              max={15}
              step={0.5}
              value={sipRate}
              onChange={(e) => setSipRate(Number(e.target.value))}
              className="w-full accent-blue-700"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
              <span>8.0%</span>
              <span>12.0%</span>
              <span>15.0%</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-500 mb-1">Key Takeaway</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              Over{' '}
              <span className="font-mono tabular-nums font-medium text-slate-900">
                {years} {years === 1 ? 'year' : 'years'}
              </span>
              , an Index SIP at {sipRate}% could build{' '}
              <span className="font-mono tabular-nums font-semibold text-emerald-700">
                +{formatINR(extraSipGain)}
              </span>{' '}
              more than a 6.5% FD—though equity values fluctuate in the short term.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
