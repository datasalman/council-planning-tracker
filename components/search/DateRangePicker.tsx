"use client";

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatForInput(isoDate: string): string {
  // Input[type=date] uses YYYY-MM-DD
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
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return d;
}

function endOfLastMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 0);
  return d;
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
    if (value < dateFrom) return; // Invalid: ignore
    onChange(dateFrom, value);
  };

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    const { from, to } = preset.getDates();
    onChange(from, to);
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Date Range
      </label>

      <div className="space-y-2 mb-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">From</label>
          <input
            type="date"
            value={formatForInput(dateFrom)}
            max={today}
            onChange={(e) => handleFromChange(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">To</label>
          <input
            type="date"
            value={formatForInput(dateTo)}
            min={dateFrom}
            max={today}
            onChange={(e) => handleToChange(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset)}
            className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-600 rounded-full transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
