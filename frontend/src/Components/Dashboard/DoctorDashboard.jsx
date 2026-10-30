import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import TodayAppointmentCard from "./DoctorFiles/TodayAppointmentCard";
import UpcomingAppointmentCard from "./DoctorFiles/UpcomingAppointmentCard";
import StatCard from "./DoctorFiles/StatCard";
import DoctorConsultation from "../Consultation/DoctorConsultation";
import ConfirmationModal from "../Shared/ConfirmationModal";
import AppointmentDetailsModal from "../Shared/AppointmentDetailsModal";
import PrescriptionModal from "./DoctorFiles/PrescriptionModal";

const DoctorDashboard = () => {
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null);
  const [activeConsultationId, setActiveConsultationId] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);

  // Prescription Modal State
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const token = localStorage.getItem("authToken");

  // Fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };

        const response = await axios.get("/doctor/dashboard", { headers });

        setTodayAppointments(response.data.todayAppointments || []);
        setUpcomingAppointments(response.data.upcomingAppointments || []);
        setWeeklyStats(response.data.weeklyStats || null);
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        const message =
          err.response?.data?.message || "Failed to load dashboard data";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const handlePrescriptionClick = (appointment) => {
    setSelectedAppointment(appointment);
    setPrescriptionModalOpen(true);
  }

  const handleStartConsultation = (appointment) => {
    if (appointment.status === "Cancelled") {
      toast.error("This appointment has been cancelled");
      return;
    }

    const isTelemedicine =
      appointment.consultationType?.toLowerCase() === "online" ||
      appointment.consultationType?.toLowerCase() === "telemedicine" ||
      appointment.medium?.toLowerCase() === "online" ||
      appointment.medium?.toLowerCase() === "telemedicine" ||
      appointment.meetingType?.toLowerCase() === "online" ||
      appointment.meetingType?.toLowerCase() === "telemedicine";

    if (!isTelemedicine) {
      toast.error("This is not an online consultation");
      return;
    }

    setActiveConsultationId(appointment._id || appointment.id);
  };

  const handleCloseConsultation = () => {
    setActiveConsultationId(null);
  };

  const handleViewDetails = async (appointment) => {
    try {
      const id = appointment._id || appointment.id;
      if (!id) {
        setSelectedAppointmentDetails(appointment);
        setIsDetailsModalOpen(true);
        return;
      }
      const authToken = localStorage.getItem("authToken");
      const headers = { Authorization: `Bearer ${authToken}` };
      const response = await axios.get(`/api/appointments/${id}`, { headers });
      setSelectedAppointmentDetails(response.data);
      setIsDetailsModalOpen(true);
    } catch (err) {
      console.error("Error fetching appointment details:", err);
      // Fallback to what we have in the card
      setSelectedAppointmentDetails(appointment);
      setIsDetailsModalOpen(true);
    }
  };

  const initiateCancel = (appointment) => {
    setAppointmentToCancel(appointment);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;

    setIsCancelling(true);
    const token = localStorage.getItem("authToken");

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.patch(
        `/api/cancel-appointment/${appointmentToCancel._id || appointmentToCancel.id}`,
        { type: appointmentToCancel.type || "Normal" },
        { headers }
      );

      toast.success("Appointment cancelled successfully");
      setIsCancelModalOpen(false);
      setAppointmentToCancel(null);
      fetchDashboardData(); // Refresh list
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      const msg = error.response?.data?.message || "Failed to cancel appointment";
      toast.error(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCompleteAppointment = async (appointment) => {
    if (!window.confirm("Mark this appointment as completed?")) {
      return;
    }

    const token = localStorage.getItem("authToken");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.patch(
        `/api/complete-appointment/${appointment._id || appointment.id}`,
        {},
        { headers }
      );

      toast.success("Appointment marked as completed");
      // Refresh dashboard data
      const response = await axios.get("/doctor/dashboard", { headers });
      setTodayAppointments(response.data.todayAppointments || []);
      setUpcomingAppointments(response.data.upcomingAppointments || []);
      setWeeklyStats(response.data.weeklyStats || null);
    } catch (error) {
      console.error("Error completing appointment:", error);
      const msg = error.response?.data?.message || "Failed to complete appointment";
      toast.error(msg);
    }
  };

  const totalDailyAppointments = useMemo(
    () =>
      weeklyStats?.dailyAppointments?.reduce((sum, d) => sum + d.count, 0) ||
      0,
    [weeklyStats]
  );

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 mt-6 md:mt-10 mb-10">
        <div className="flex h-64 items-center justify-center bg-gray-50 rounded-xl">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="mt-4 text-sm text-gray-600">Loading dashboard...</p>
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
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Doctor Dashboard</h1>
            <p className="text-blue-50">
              Centralized view of your appointments, patients, and weekly performance.
            </p>
          </div>
          <div className="text-right mt-4 md:mt-0">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-100">
              Today
            </p>
            <p className="text-sm font-semibold">{today}</p>
          </div>
        </div>
      </div>

      {/* Top grid: Today + Weekly stats */}
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr] mb-6">
        {/* Weekly Stats Summary (Sidebar) */}
        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Weekly Performance</h2>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">Live</span>
          </div>

          {weeklyStats && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <StatCard
                  label="Total"
                  value={weeklyStats.totalAppointments}
                />
                <StatCard
                  label="Today"
                  value={todayAppointments.length}
                />
                <StatCard
                  label="Weekly Rev."
                  value={weeklyStats.revenue}
                />
              </div>
            </>
          )}
        </section>

        {/* Today's Appointments */}
        <section className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Today&apos;s Appointments
            </h2>
          </div>
          <div className="space-y-3">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">No appointments scheduled for today</p>
              </div>
            ) : (
              todayAppointments.map((appt) => (
                <TodayAppointmentCard
                  key={appt._id}
                  appt={appt}
                  onStartCall={() => handleStartConsultation(appt)}
                  onViewDetails={() => handleViewDetails(appt)}
                  onPrescriptionClick={handlePrescriptionClick}
                  onCancel={() => initiateCancel(appt)}
                  onComplete={() => handleCompleteAppointment(appt)}
                />
              ))
            )}
          </div>
        </section>

      </div>



      {/* Middle grid: Upcoming + Patient list */}
      <div className="grid gap-4 mb-6">
        {/* Upcoming Appointments */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Upcoming Appointments
            </h2>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            Plan and manage your future schedule efficiently with quick access actions.
          </p>
          <div className="space-y-4">
            {upcomingAppointments.length === 0 ? (
              <div className="py-12 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 text-sm">No upcoming appointments</p>
              </div>
            ) : (
              upcomingAppointments.map((appt) => (
                <UpcomingAppointmentCard
                  key={appt._id}
                  appt={appt}
                  onViewDetails={() => handleViewDetails(appt)}
                  onCancel={() => initiateCancel(appt)}
                  onJoinConsultation={() => handleStartConsultation(appt)}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Consultation Overlay */}
      {activeConsultationId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm">
          <DoctorConsultation
            appointmentId={activeConsultationId}
            onClose={handleCloseConsultation}
          />
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setAppointmentToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        isLoading={isCancelling}
      />

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedAppointmentDetails(null);
        }}
        appointment={selectedAppointmentDetails}
        isDoctorView={true}
      />

      <PrescriptionModal
        isOpen={prescriptionModalOpen}
        onClose={() => setPrescriptionModalOpen(false)}
        appointment={selectedAppointment}
      />
    </div>
  );
};

export default DoctorDashboard;
