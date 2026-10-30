import React, { useEffect, useState } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import dayjs from "dayjs";
import { toast } from "react-toastify";

export default function DoctorSchedule() {
  const [date, setDate] = useState(new Date());
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [duration, setDuration] = useState(30);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all schedules on mount
  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const res = await axios.get("/doctor/schedule", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Backend returns array of objects with { day: "YYYY-MM-DD", start, end, ... }
      setSchedules(res.data);
    } catch (error) {
      console.error("Error loading schedule:", error);
      toast.error("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  const addSlot = async () => {
    if (!start || !end) {
      toast.error("Please select start and end time");
      return;
    }

    const formattedDate = dayjs(date).format("YYYY-MM-DD");

    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        "/doctor/schedule",
        {
          date: formattedDate,
          start,
          end,
          duration
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Slot added successfully!");
      setStart("");
      setEnd("");
      loadSchedules();
      // notify other parts of the app (cross-tab and same-window)
      try {
        localStorage.setItem('schedulesUpdated', Date.now().toString());
      } catch (err) {
        // ignore
      }
      try { window.dispatchEvent(new Event('schedulesUpdated')); } catch (e) {}
    } catch (error) {
      console.error("Error adding slot:", error);
      toast.error("Failed to add slot");
    }
  };

  const deleteSlot = async (slotId) => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`/doctor/schedule/${slotId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Slot removed");
      loadSchedules();
      // notify others about schedule change
      try {
        localStorage.setItem('schedulesUpdated', Date.now().toString());
      } catch (err) {}
      try { window.dispatchEvent(new Event('schedulesUpdated')); } catch (e) {}
    } catch (error) {
      console.error("Error deleting slot:", error);
      toast.error("Failed to delete slot");
    }
  };

  // Filter slots for the selected date
  const selectedDateStr = dayjs(date).format("YYYY-MM-DD");
  const slotsForDate = schedules.filter(s => (s.date || s.day) === selectedDateStr);

  // Function to add class to calendar tiles that have slots
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = dayjs(date).format("YYYY-MM-DD");
      if (schedules.some(s => (s.date || s.day) === dateStr)) {
        return 'has-slots'; // Custom class we can style if needed
      }
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Manage Availability</h2>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Calendar & Add Form */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="card bg-base-100 shadow-xl border border-gray-100">
            <div className="card-body p-0 overflow-hidden rounded-2xl">
              <Calendar
                onChange={setDate}
                value={date}
                className="w-full border-none"
                tileClassName={tileClassName}
              />
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl border border-gray-100">
            <div className="card-body">
              <h3 className="card-title text-lg">Add Slot for {dayjs(date).format("MMM D, YYYY")}</h3>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Start Time</span>
                </label>
                <input
                  type="time"
                  className="input input-bordered w-full"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">End Time</span>
                </label>
                <input
                  type="time"
                  className="input input-bordered w-full"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>

              <button className="btn btn-primary mt-4 w-full" onClick={addSlot}>
                Add This Slot
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Slots List */}
        <div className="w-full lg:w-2/3">
          <div className="card bg-base-100 shadow-xl border border-gray-100 h-full">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  Slots for {dayjs(date).format("dddd, MMMM D, YYYY")}
                </h3>
                <span className="badge badge-lg badge-neutral">
                  {slotsForDate.length} Slots
                </span>
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : slotsForDate.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {slotsForDate
                    .sort((a, b) => a.start.localeCompare(b.start)) // Sort by time
                    .map((slot) => (
                      <div key={slot._id} className="alert alert-light border border-gray-200 shadow-sm flex justify-between items-center">
                        <div>
                          <div className="font-bold text-lg text-primary">
                            {slot.start} - {slot.end}
                          </div>
                          <div className="text-xs text-gray-500">
                            {slot.duration || 30} mins
                          </div>
                        </div>
                        <button
                          className="btn btn-circle btn-sm btn-ghost text-red-500 hover:bg-red-50"
                          onClick={() => deleteSlot(slot._id)}
                          title="Remove slot"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-base-200 rounded-xl">
                  <p className="text-gray-500 text-lg">No slots available for this day.</p>
                  <p className="text-sm text-gray-400 mt-2">Use the form to add new availability.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles for Calendar */}
      <style>{`
        .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        .has-slots {
          background-color: #f0fdf4 !important;
          color: #15803d !important;
          font-weight: bold;
        }
        .has-slots abbr {
          text-decoration: underline;
          text-decoration-color: #22c55e;
          text-decoration-thickness: 3px;
        }
        .react-calendar__tile--active {
          background: #000 !important;
          color: white !important;
        }
        .react-calendar__tile--now {
          background: #ffffc0;
        }
      `}</style>
    </div>
  );
}
