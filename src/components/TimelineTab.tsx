import React, { useState } from "react";
import { Plus, CheckSquare, Square, Clock } from "lucide-react";
import { HydratedEvent } from "../shared/schemas";
import { formatReadableDate } from "../lib/format";

interface TimelineTabProps {
  event: HydratedEvent;
  isHighlighted: boolean;
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>;
  onAddTask: (payload: {
    title: string;
    category: string;
    daysBefore: number;
    priority: "high" | "medium" | "low";
  }) => Promise<void>;
  onUpdateRunSheet: (
    itemId: string,
    status: "scheduled" | "arrived" | "completed"
  ) => Promise<void>;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({
  event,
  isHighlighted,
  onToggleTask,
  onAddTask,
  onUpdateRunSheet,
}) => {
  const [subView, setSubView] = useState<"checklist" | "runsheet">("checklist");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("venue");
  const [newDaysBefore, setNewDaysBefore] = useState(14);
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">(
    "medium"
  );

  const completedCount = event.tasks.filter((t) => t.completed).length;
  const categories = [
    "all",
    ...Array.from(new Set(event.tasks.map((t) => t.category))),
  ];

  const filteredTasks = event.tasks.filter((t) =>
    categoryFilter === "all" ? true : t.category === categoryFilter
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onAddTask({
      title: newTitle.trim(),
      category: newCategory,
      daysBefore: newDaysBefore,
      priority: newPriority,
    });
    setNewTitle("");
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation: Countdown Checklist vs Day-Of Run Sheet */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-stone-200/90 rounded-xl p-5">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">
            Timeline &amp; Day-Of Execution
          </h2>
          <p className="text-xs text-stone-500 mt-0.5 font-mono tabular-nums">
            {completedCount} of {event.tasks.length} countdown milestones
            completed · Event Date: {formatReadableDate(event.input.date)}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setSubView("checklist")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              subView === "checklist"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Countdown Checklist ({event.tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView("runsheet")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              subView === "runsheet"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Day-Of Run Sheet ({event.plan?.runSheet.length || 0})
          </button>
        </div>
      </div>

      {subView === "checklist" ? (
        <div className="space-y-6">
          {/* Add Custom Milestone Form */}
          <form
            onSubmit={handleAdd}
            className="bg-white border border-stone-200/90 rounded-xl p-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
          >
            <div className="md:col-span-5">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                New Task / Milestone
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Confirm Mehendi artist & welcome garland delivery"
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg"
              >
                <option value="venue">venue</option>
                <option value="catering">catering</option>
                <option value="decor">decor</option>
                <option value="entertainment">entertainment</option>
                <option value="guests">guests</option>
                <option value="misc">misc</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Days Before
              </label>
              <input
                type="number"
                min={0}
                max={365}
                value={newDaysBefore}
                onChange={(e) => setNewDaysBefore(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-stone-50 border border-stone-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-3 flex gap-2">
              <select
                value={newPriority}
                onChange={(e) =>
                  setNewPriority(e.target.value as "high" | "medium" | "low")
                }
                className="w-28 px-2.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </form>

          {/* Filter Strip */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat
                    ? "bg-stone-900 text-white"
                    : "bg-white border border-stone-200 text-stone-600 hover:text-stone-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Checklist Rows */}
          <div
            className={`bg-white rounded-xl border divide-y divide-stone-200/80 ${
              isHighlighted
                ? "border-amber-500 ring-2 ring-amber-200/70"
                : "border-stone-200/90"
            }`}
          >
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onToggleTask(task.id, !task.completed)}
                className="px-5 py-4 flex items-start sm:items-center justify-between gap-4 hover:bg-stone-50/80 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    aria-label="Toggle task completed"
                    className="mt-0.5 text-rose-700 shrink-0 cursor-pointer"
                  >
                    {task.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-400" />
                    )}
                  </button>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        task.completed
                          ? "line-through text-stone-400"
                          : "text-stone-900"
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      <span className="capitalize">{task.category}</span>
                      <span aria-hidden="true"> · </span>
                      <span>
                        Priority:{" "}
                        <strong
                          className={
                            task.priority === "high"
                              ? "text-rose-800"
                              : task.priority === "medium"
                              ? "text-amber-800"
                              : "text-stone-600"
                          }
                        >
                          {task.priority}
                        </strong>
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono tabular-nums">
                  <p className="text-xs font-semibold text-stone-800">
                    T-{task.daysBefore}d
                  </p>
                  <p className="text-[11px] text-stone-500">{task.dueDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Differentiator 10: Day-Of Minute-by-Minute Run Sheet & Vendor Coordination */
        <div className="bg-white border border-stone-200/90 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-stone-900">
                Minute-by-Minute Run Sheet &amp; Vendor Arrival Coordination
              </h3>
              <p className="text-xs text-stone-500">
                Track live vendor check-ins, owner assignments, and direct phone
                contacts on celebration day.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-xs font-semibold text-stone-600">
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Activity &amp; Cue</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Vendor Arrival &amp; Contact</th>
                  <th className="py-3 px-4 text-right">Live Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/80 text-sm">
                {(event.plan?.runSheet || []).map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/60">
                    <td className="py-3.5 px-4 font-mono tabular-nums text-xs font-semibold text-stone-900 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {item.time}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-800 font-medium">
                      {item.activity}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-stone-600 whitespace-nowrap">
                      {item.owner}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-stone-600">
                      <p className="font-medium text-stone-800">
                        {item.vendorContact}
                      </p>
                      <p className="font-mono tabular-nums text-[11px] text-stone-500">
                        Call-time: {item.arrivalTime}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          onUpdateRunSheet(
                            item.id,
                            e.target.value as
                              | "scheduled"
                              | "arrived"
                              | "completed"
                          )
                        }
                        className={`px-2.5 py-1 text-xs font-medium rounded-md border cursor-pointer ${
                          item.status === "completed"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                            : item.status === "arrived"
                            ? "border-amber-300 bg-amber-50 text-amber-900"
                            : "border-stone-200 bg-white text-stone-700"
                        }`}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="arrived">Vendor Arrived</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
