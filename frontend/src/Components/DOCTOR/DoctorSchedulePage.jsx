import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ScheduleForm from "../Dashboard/DoctorFiles/ScheduleForm";

const DoctorSchedulePage = () => {
  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("authToken");

  // Fetch schedule data from backend
  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };

        const scheduleRes = await axios.get("/doctor/schedule", {
          headers,
        });
        setScheduleSlots(scheduleRes.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching schedule data:", err);
        const message =
          err.response?.data?.message || "Failed to load schedule data";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleData();
  }, [token]);

  const handleAddSlot = async (slot) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post("/doctor/schedule", slot, { headers });
      const scheduleRes = await axios.get("/doctor/schedule", {
        headers,
      });
      setScheduleSlots(scheduleRes.data || []);
      toast.success("Schedule slot added successfully");
    } catch (err) {
      console.error("Error adding schedule:", err);
      toast.error(
        err.response?.data?.message || "Failed to add schedule slot"
      );
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/doctor/schedule/${slotId}`, {
        headers,
      });
      setScheduleSlots((prev) => prev.filter((s) => s._id !== slotId));
      toast.success("Schedule slot deleted successfully");
    } catch (err) {
      console.error("Error deleting schedule:", err);
      toast.error(
        err.response?.data?.message || "Failed to delete schedule slot"
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 mt-6 md:mt-10 mb-10">
        <div className="flex h-64 items-center justify-center bg-gray-50 rounded-xl">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="mt-4 text-sm text-gray-600">Loading schedule...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 mt-6 md:mt-10 mb-10">
        <div className="flex h-64 items-center justify-center bg-gray-50 rounded-xl">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 btn btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 mt-6 md:mt-10 mb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-focus text-white rounded-2xl p-6 md:p-8 shadow-lg mb-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Schedule Management</h1>
            <p className="text-primary-content/80">
              Manage your availability and schedule slots for patient appointments.
            </p>
          </div>
        </div>
      </div>

      {/* Scheduling Management */}
      <div>
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Doctor Availability Slots
            </h2>
            <span className="text-[11px] text-gray-500">
              Availability is synced to the patient booking interface in real time.
            </span>
          </div>
          <ScheduleForm
            slots={scheduleSlots}
            onAddSlot={handleAddSlot}
            onDeleteSlot={handleDeleteSlot}
          />
        </section>
      </div>
    </div>
  );
};

export default DoctorSchedulePage;
