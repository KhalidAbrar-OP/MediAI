import React, { useState } from "react";

const ScheduleForm = ({ slots, onAddSlot, onDeleteSlot }) => {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [form, setForm] = useState({
    date: getTodayDate(),
    start: "09:00",
    end: "13:00",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.date || !form.start || !form.end) return;

    // Get the day name from the selected date
    const selectedDate = new Date(form.date + 'T00:00:00');
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = days[selectedDate.getDay()];

    // Send both date and day to backend
    onAddSlot({
      date: form.date,
      day: day,
      start: form.start,
      end: form.end
    });
  };

  return (
    <div className="space-y-4">
      <form
        className="grid grid-cols-1 gap-3 md:grid-cols-3"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600">Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            min={getTodayDate()}
            className="mt-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600">Start</label>
          <input
            type="time"
            name="start"
            value={form.start}
            onChange={handleChange}
            className="mt-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600">End</label>
          <input
            type="time"
            name="end"
            value={form.end}
            onChange={handleChange}
            className="mt-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="col-span-1 md:col-span-3">
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"
          >
            Add Availability Slot
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs">
        <h4 className="mb-2 text-xs font-semibold text-gray-700">
          Current Available Slots (Real-time sync with patients)
        </h4>
        {slots.length === 0 ? (
          <p className="text-xs text-gray-500">
            No availability set yet. Add your first slot above.
          </p>
        ) : (
          <ul className="space-y-1">
            {slots.map((slot) => {
              // Format the date for display
              const formatDate = (dateStr) => {
                if (!dateStr) return "";
                
                // Convert DD-MM-YYYY to YYYY-MM-DD for parsing
                let dateToParse = dateStr;
                if (dateStr.includes('-')) {
                  const parts = dateStr.split('-');
                  if (parts.length === 3 && parts[0].length <= 2) {
                    // It's DD-MM-YYYY format, convert to YYYY-MM-DD
                    dateToParse = `${parts[2]}-${parts[1]}-${parts[0]}`;
                  }
                }
                
                const date = new Date(dateToParse + 'T00:00:00');
                return date.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                });
              };

              return (
                <li
                  key={slot._id || slot.id}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5"
                >
                  <div>
                    <span className="font-medium text-gray-800">
                      {slot.date ? formatDate(slot.date) : slot.day} • {slot.start}–{slot.end}
                    </span>
                  </div>
                  {onDeleteSlot && (
                    <button
                      onClick={() => onDeleteSlot(slot._id)}
                      className="rounded-md border border-red-200 px-2 py-0.5 text-[11px] text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ScheduleForm;

