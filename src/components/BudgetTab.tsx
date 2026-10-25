import React, { useState, useEffect } from "react";
import { Lock, Unlock, Sliders, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  HydratedEvent,
  BudgetAllocation,
  BudgetCategory,
} from "../shared/schemas";
import { formatInr } from "../lib/format";

interface BudgetTabProps {
  event: HydratedEvent;
  isHighlighted: boolean;
  onSaveBudget: (payload: {
    totalBudget?: number;
    allocations?: BudgetAllocation[];
    autoRebalance?: boolean;
    changedCategory?: BudgetCategory;
  }) => Promise<void>;
}

const SLICE_COLORS: Record<BudgetCategory, string> = {
  venue: "#BE123C",
  catering: "#D97706",
  decor: "#0F766E",
  photography: "#4338CA",
  entertainment: "#B45309",
  misc: "#57534E",
};

export const BudgetTab: React.FC<BudgetTabProps> = ({
  event,
  isHighlighted,
  onSaveBudget,
}) => {
  const [totalBudget, setTotalBudget] = useState(event.input.totalBudget);
  const [rows, setRows] = useState<BudgetAllocation[]>(event.budget);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTotalBudget(event.input.totalBudget);
    setRows(event.budget);
  }, [event.input.totalBudget, event.budget]);

  const totalPlanned = rows.reduce((s, r) => s + r.plannedAmount, 0);
  const totalSpent = rows.reduce((s, r) => s + r.actualSpent, 0);
  const overspend = totalPlanned - totalBudget;
  const actualOverspend = totalSpent - totalBudget;

  // Build SVG Donut Geometry
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let cumulativeFraction = 0;

  const handlePlannedChange = (cat: BudgetCategory, nextVal: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.category === cat ? { ...r, plannedAmount: Math.max(0, nextVal) } : r
      )
    );
  };

  const handleSpentChange = (cat: BudgetCategory, nextVal: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.category === cat ? { ...r, actualSpent: Math.max(0, nextVal) } : r
      )
    );
  };

  const handleToggleLock = async (cat: BudgetCategory) => {
    const updated = rows.map((r) =>
      r.category === cat ? { ...r, locked: !r.locked } : r
    );
    setRows(updated);
    setIsSaving(true);
    try {
      await onSaveBudget({ totalBudget, allocations: updated, autoRebalance: false });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveManual = async () => {
    setIsSaving(true);
    try {
      await onSaveBudget({ totalBudget, allocations: rows, autoRebalance: false });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunOptimizer = async (pinnedCategory?: BudgetCategory) => {
    setIsSaving(true);
    try {
      await onSaveBudget({
        totalBudget,
        allocations: rows,
        autoRebalance: true,
        changedCategory: pinnedCategory,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Summary & Overspend Alert */}
      {(overspend > 0 || actualOverspend > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">
                Budget Ceiling Alert
              </p>
              <p className="text-xs text-red-800 mt-0.5">
                {actualOverspend > 0
                  ? `Actual vendor payments (${formatInr(totalSpent)}) exceed your target budget by ${formatInr(actualOverspend)}.`
                  : `Planned category allocations (${formatInr(totalPlanned)}) exceed your ${formatInr(totalBudget)} ceiling by ${formatInr(overspend)}.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleRunOptimizer()}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
          >
            Auto-Rebalance Within {formatInr(totalBudget)}
          </button>
        </div>
      )}

      {/* Donut Chart + Constraint Optimizer Control Card */}
      <div
        className={`bg-white rounded-xl p-6 md:p-8 border transition-colors ${
          isHighlighted
            ? "border-amber-500 ring-2 ring-amber-200/70"
            : "border-stone-200/90"
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* SVG Donut Chart */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-48 h-48 shrink-0">
              <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="transparent"
                  stroke="#F5F5F4"
                  strokeWidth="22"
                />
                {rows.map((r) => {
                  const frac =
                    totalPlanned > 0 ? r.plannedAmount / totalPlanned : 0;
                  const dash = frac * circumference;
                  const offset = -cumulativeFraction * circumference;
                  cumulativeFraction += frac;
                  return (
                    <circle
                      key={r.category}
                      cx="90"
                      cy="90"
                      r={radius}
                      fill="transparent"
                      stroke={SLICE_COLORS[r.category]}
                      strokeWidth="22"
                      strokeDasharray={`${dash} ${circumference}`}
                      strokeDashoffset={offset}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                <span className="text-[11px] text-stone-500">Total Planned</span>
                <span className="text-base font-mono font-semibold tabular-nums text-stone-900">
                  {formatInr(totalPlanned)}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-emerald-700 mt-0.5">
                  Spent: {formatInr(totalSpent)}
                </span>
              </div>
            </div>

            <div className="space-y-2 w-full">
              {rows.map((r) => {
                const pct =
                  totalPlanned > 0
                    ? Math.round((r.plannedAmount / totalPlanned) * 100)
                    : 0;
                return (
                  <div
                    key={r.category}
                    className="flex items-center justify-between text-xs gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: SLICE_COLORS[r.category] }}
                      />
                      <span className="text-stone-700 truncate">{r.label}</span>
                    </div>
                    <span className="font-mono tabular-nums font-medium text-stone-900 shrink-0">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Budget Input & Constraint Solver Explanation */}
          <div className="lg:col-span-7 space-y-4 lg:border-l lg:border-stone-200 lg:pl-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Target Celebration Budget Ceiling (INR)
                </label>
                <input
                  type="number"
                  step={5000}
                  min={25000}
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-base font-mono font-semibold tabular-nums bg-stone-50 border border-stone-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleRunOptimizer()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  {isSaving ? "Solving..." : "Auto-Rebalance (Solver)"}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveManual}
                  className="px-4 py-2.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  Save Edits
                </button>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-800 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Constraint Solver Trade-Off Explanation</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                {event.budgetTradeoffNote}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Progress Bars & Editable Ledger */}
      <div className="bg-white border border-stone-200/90 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-stone-900">
            Category Allocations &amp; Live Spent Tracking
          </h3>
          <span className="text-xs text-stone-500">
            Edit any planned amount and click &ldquo;Rebalance Others&rdquo; to
            pin it and solve remaining categories
          </span>
        </div>

        <div className="divide-y divide-stone-200/80">
          {rows.map((row) => {
            const spentRatio =
              row.plannedAmount > 0
                ? Math.min(100, Math.round((row.actualSpent / row.plannedAmount) * 100))
                : 0;
            const rowOver = row.actualSpent > row.plannedAmount;

            return (
              <div key={row.category} className="p-6 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-0.5 max-w-md">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: SLICE_COLORS[row.category] }}
                      />
                      <h4 className="text-sm font-semibold text-stone-900">
                        {row.label}
                      </h4>
                      <span className="text-xs font-mono tabular-nums text-stone-500">
                        · Bounds {row.minPct}%–{row.maxPct}%
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">{row.rationale}</p>
                  </div>

                  {/* Controls: Planned INR, Actual Spent INR, Lock, Rebalance */}
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="block text-[11px] text-stone-500 mb-1">
                        Planned (₹)
                      </label>
                      <input
                        type="number"
                        step={1000}
                        min={0}
                        value={row.plannedAmount}
                        onChange={(e) =>
                          handlePlannedChange(row.category, Number(e.target.value))
                        }
                        className="w-32 px-2.5 py-1.5 text-xs font-mono font-semibold tabular-nums bg-stone-50 border border-stone-300 rounded-md text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-500 mb-1">
                        Actual Spent (₹)
                      </label>
                      <input
                        type="number"
                        step={1000}
                        min={0}
                        value={row.actualSpent}
                        onChange={(e) =>
                          handleSpentChange(row.category, Number(e.target.value))
                        }
                        className="w-32 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-stone-50 border border-stone-300 rounded-md text-right"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleLock(row.category)}
                      title={row.locked ? "Unlock category" : "Lock category"}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border cursor-pointer whitespace-nowrap ${
                        row.locked
                          ? "border-amber-400 bg-amber-50 text-amber-900"
                          : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      {row.locked ? (
                        <>
                          <Lock className="w-3.5 h-3.5" /> Locked
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" /> Flexible
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRunOptimizer(row.category)}
                      className="px-3 py-1.5 text-xs font-medium text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md cursor-pointer whitespace-nowrap"
                    >
                      Pin &amp; Rebalance Others
                    </button>
                  </div>
                </div>

                {/* Spent vs Planned Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-transform duration-150 origin-left ${
                        rowOver ? "bg-red-600" : "bg-emerald-600"
                      }`}
                      style={{ width: `${spentRatio}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono tabular-nums text-stone-500">
                    <span>
                      Paid: {formatInr(row.actualSpent)} ({spentRatio}% of planned)
                    </span>
                    <span className={rowOver ? "text-red-700 font-semibold" : ""}>
                      {rowOver
                        ? `Over category plan by ${formatInr(row.actualSpent - row.plannedAmount)}`
                        : `Remaining: ${formatInr(Math.max(0, row.plannedAmount - row.actualSpent))}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
