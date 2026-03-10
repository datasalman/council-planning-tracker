"use client";

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatForInput(isoDate: string): string {
  return isoDate;
}

function getToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfLastMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function endOfLastMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 0);
}

function startOfQuarter(date: Date): Date {
  const q = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), q * 3, 1);
}

const PRESETS = [
  {
    label: "Last 7d",
    getDates: () => {
      const today = getToday();
      return { from: toISODate(subDays(today, 7)), to: toISODate(today) };
    },
  },
  {
    label: "Last 30d",
    getDates: () => {
      const today = getToday();
      return { from: toISODate(subDays(today, 30)), to: toISODate(today) };
    },
  },
  {
    label: "Last 90d",
    getDates: () => {
      const today = getToday();
      return { from: toISODate(subDays(today, 90)), to: toISODate(today) };
    },
  },
  {
    label: "This month",
    getDates: () => {
      const today = getToday();
      return { from: toISODate(startOfMonth(today)), to: toISODate(today) };
    },
  },
  {
    label: "Last month",
    getDates: () => {
      const today = getToday();
      return {
        from: toISODate(startOfLastMonth(today)),
        to: toISODate(endOfLastMonth(today)),
      };
    },
  },
  {
    label: "This quarter",
    getDates: () => {
      const today = getToday();
      return { from: toISODate(startOfQuarter(today)), to: toISODate(today) };
    },
  },
];

interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onChange: (dateFrom: string, dateTo: string) => void;
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  onChange,
}: DateRangePickerProps) {
  const today = toISODate(getToday());

  const handleFromChange = (value: string) => {
    if (value > dateTo) {
      onChange(value, value);
    } else {
      onChange(value, dateTo);
    }
  };

  const handleToChange = (value: string) => {
    if (value < dateFrom) return;
    onChange(dateFrom, value);
  };

  // Check if a preset is currently active
  const isPresetActive = (preset: (typeof PRESETS)[0]) => {
    const { from, to } = preset.getDates();
    return from === dateFrom && to === dateTo;
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-white/90 mb-2">
        Date Range
      </label>

      <div className="space-y-2 mb-3">
        <div>
          <label className="text-xs text-white/50 mb-1 block">From</label>
          <input
            type="date"
            value={formatForInput(dateFrom)}
            max={today}
            onChange={(e) => handleFromChange(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">To</label>
          <input
            type="date"
            value={formatForInput(dateTo)}
            min={dateFrom}
            max={today}
            onChange={(e) => handleToChange(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => {
          const active = isPresetActive(preset);
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                const { from, to } = preset.getDates();
                onChange(from, to);
              }}
              className={`text-xs px-2.5 py-1 rounded-full transition-all duration-200 ${active
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-white/10 hover:bg-white/20 text-white/60 hover:text-white/80"
                }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
