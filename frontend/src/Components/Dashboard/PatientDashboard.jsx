import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../Auth/AuthProvider.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import PatientConsultation from "../Consultation/PatientConsultation";
import ConfirmationModal from "../Shared/ConfirmationModal";
import AppointmentDetailsModal from "../Shared/AppointmentDetailsModal";
import PatientPrescriptionModal from "./PatientPrescriptionModal";

const PatientDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [todayAppointments, setTodayAppointments] = useState([]);
    // pastAppointments and consultationHistory moved to MyAppointments
    const [loading, setLoading] = useState(true);

    // Modal States
    const [showConsultation, setShowConsultation] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
    const [showPrescription, setShowPrescription] = useState(false);
    const [selectedPrescriptionAppt, setSelectedPrescriptionAppt] = useState(null);

    const [metrics, setMetrics] = useState({
        totalConsultations: 0,
        bookedConsultations: 0,
        upcomingThisWeek: 0
    });

    // Modal State - Cancellation
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);

    // Modal State - View Details
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");

        try {
            const headers = { Authorization: `Bearer ${token}` };
            const response = await axios.get(
                "/patient/dashboard",
                { headers }
            );

            const { metrics, upcomingAppointments, todayAppointments } = response.data;

            setMetrics(metrics);
            setTodayAppointments(todayAppointments || []);
            setUpcomingAppointments(upcomingAppointments || []);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (appointment) => {
        try {
            const id = appointment._id || appointment.id;
            if (!id) {
                setSelectedAppointmentDetails(appointment);
                setIsDetailsModalOpen(true);
                return;
            }
            const token = localStorage.getItem("authToken");
            const headers = { Authorization: `Bearer ${token}` };
            const response = await axios.get(`/api/appointments/${id}`, { headers });
            setSelectedAppointmentDetails(response.data);
            setIsDetailsModalOpen(true);
        } catch (error) {
            console.error("Error fetching appointment details:", error);
            // Fallback to what we have in the card
            setSelectedAppointmentDetails(appointment);
            setIsDetailsModalOpen(true);
        }
    };

    const handleViewPrescription = (appointment) => {
        if (!appointment.prescription) {
            toast.error("Prescription data not found");
            return;
        }
        setSelectedPrescriptionAppt(appointment);
        setShowPrescription(true);
    };

    const handlePaymentStatusClick = (appointment) => {
        if (appointment.paymentStatus?.toLowerCase() === "paid") {
            if (appointment.paymentId) {
                navigate(`/invoice/${appointment.paymentId}`);
            } else {
                toast.info("Invoice detail not found. It might be an older record.");
            }
        } else {
            // Redirect to payment
            const amount = appointment.amount || 0;
            const type = appointment.type?.toLowerCase() === "emergency" ? "emergency" : "normal";
            navigate(`/payment/${appointment.id}/${amount}?type=${type}`);
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
                `/api/cancel-appointment/${appointmentToCancel.id}`,
                { type: appointmentToCancel.type }, // Pass type (Emergency/Regular)
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


    const handleJoinConsultation = async (appointmentId) => {
        // Check if it's consultation time
        const appointment = [...todayAppointments, ...upcomingAppointments].find(apt => apt.id === appointmentId);
        if (!appointment) return;

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

        // Check if it's consultation time (allow 15 minutes before)
        const now = new Date();
        const appointmentDate = new Date(appointment.appointmentDate);
        const [hours, minutes] = appointment.appointmentTime.replace(" AM", "").replace(" PM", "").split(':');
        const isPM = appointment.appointmentTime.includes("PM");
        appointmentDate.setHours(parseInt(hours) + (isPM && hours !== "12" ? 12 : 0), parseInt(minutes), 0, 0);
        const fifteenMinutesBefore = new Date(appointmentDate.getTime() - 15 * 60 * 1000);

        if (now < fifteenMinutesBefore) {
            toast.error("Not consultation time yet. Please join 15 minutes before the scheduled time.");
            return;
        }

        setSelectedAppointmentId(appointmentId);
        setShowConsultation(true);
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-8 mt-6 md:mt-10 mb-10">
                <div className="flex justify-center items-center h-64">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 mt-6 md:mt-10 mb-10">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-focus text-white rounded-2xl p-6 md:p-8 shadow-lg mb-6">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Patient Dashboard</h1>
                <p className="text-primary-content/80">Manage your appointments and consultations</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Consultations</p>
                            <p className="text-3xl font-bold text-gray-800">{metrics.totalConsultations}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Upcoming Today</p>
                            <p className="text-3xl font-bold text-gray-800">{todayAppointments.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Upcoming This Week</p>
                            <p className="text-3xl font-bold text-gray-800">{metrics.upcomingThisWeek}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Appointments Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Today's Appointments</h2>
                </div>

                {todayAppointments.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">No appointments scheduled for today</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {todayAppointments.map((appointment) => (
                            <div key={appointment.id} className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5 hover:border-primary/40 transition-all shadow-sm">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-semibold text-gray-800">
                                                        {appointment.doctorName}
                                                    </h3>
                                                    {appointment.isParticipantOnline && (
                                                        <span className="badge badge-success animate-pulse flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 bg-green-700 rounded-full"></span>
                                                            Doctor Ready
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{appointment.specialization}</p>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1 font-bold text-primary">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span>{appointment.appointmentTime}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span
                                                            onClick={() => handlePaymentStatusClick(appointment)}
                                                            className={`badge cursor-pointer hover:opacity-80 transition-opacity ${appointment.paymentStatus?.toLowerCase() === 'paid' ? 'badge-success' : 'badge-warning'}`}
                                                        >
                                                            {appointment.paymentStatus}
                                                        </span>
                                                    </div>
                                                    {(appointment.consultationType?.toLowerCase() === 'online' ||
                                                        appointment.consultationType?.toLowerCase() === 'telemedicine' ||
                                                        appointment.medium?.toLowerCase() === 'online' ||
                                                        appointment.medium?.toLowerCase() === 'telemedicine' ||
                                                        appointment.meetingType?.toLowerCase() === 'online' ||
                                                        appointment.meetingType?.toLowerCase() === 'telemedicine') && (
                                                            <span className="badge badge-info">Online Consultation</span>
                                                        )}
                                                    {appointment.type === 'Emergency' && (
                                                        <span className="badge badge-error text-white animate-pulse">Emergency</span>
                                                    )}
                                                    {appointment.type === 'Emergency' && appointment.status?.toLowerCase() === 'accepted' && (
                                                        <span className="badge badge-success">Accepted</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(appointment.consultationType?.toLowerCase() === 'online' ||
                                            appointment.consultationType?.toLowerCase() === 'telemedicine' ||
                                            appointment.medium?.toLowerCase() === 'online' ||
                                            appointment.medium?.toLowerCase() === 'telemedicine' ||
                                            appointment.meetingType?.toLowerCase() === 'online' ||
                                            appointment.meetingType?.toLowerCase() === 'telemedicine') && (
                                                <button
                                                    onClick={() => handleJoinConsultation(appointment.id)}
                                                    className="btn btn-primary btn-sm shadow-md"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    Join Now
                                                </button>
                                            )}
                                        <button
                                            onClick={() => handleViewDetails(appointment)}
                                            className="btn btn-outline btn-sm"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upcoming Appointments Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Upcoming Appointments</h2>

                {upcomingAppointments.length === 0 ? (
                    <div className="text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-600 text-lg">No upcoming appointments</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {upcomingAppointments.map((appointment) => (
                            <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-semibold text-gray-800">
                                                        {appointment.doctorName}
                                                    </h3>
                                                    {appointment.isParticipantOnline && (
                                                        <span className="badge badge-success animate-pulse flex items-center gap-1 text-[10px]">
                                                            <span className="w-1.5 h-1.5 bg-green-700 rounded-full"></span>
                                                            Doctor Ready
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{appointment.specialization}</p>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span>{appointment.appointmentTime}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span
                                                            onClick={() => handlePaymentStatusClick(appointment)}
                                                            className={`badge cursor-pointer hover:opacity-80 transition-opacity ${appointment.paymentStatus?.toLowerCase() === 'paid' ? 'badge-success' : 'badge-warning'}`}
                                                        >
                                                            {appointment.paymentStatus}
                                                        </span>
                                                    </div>
                                                    {(appointment.consultationType?.toLowerCase() === 'online' ||
                                                        appointment.consultationType?.toLowerCase() === 'telemedicine' ||
                                                        appointment.medium?.toLowerCase() === 'online' ||
                                                        appointment.medium?.toLowerCase() === 'telemedicine' ||
                                                        appointment.meetingType?.toLowerCase() === 'online' ||
                                                        appointment.meetingType?.toLowerCase() === 'telemedicine') && (
                                                            <span className="badge badge-info">Online Consultation</span>
                                                        )}
                                                    {appointment.type === 'Emergency' && (
                                                        <span className="badge badge-error text-white animate-pulse">Emergency</span>
                                                    )}
                                                    {appointment.type === 'Emergency' && appointment.status?.toLowerCase() === 'accepted' && (
                                                        <span className="badge badge-success">Accepted</span>
                                                    )}
                                                    {appointment.isParticipantOnline && (
                                                        <span className="badge badge-success animate-pulse flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 bg-green-700 rounded-full"></span>
                                                            Doctor Ready
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(appointment.consultationType?.toLowerCase() === 'online' ||
                                            appointment.consultationType?.toLowerCase() === 'telemedicine' ||
                                            appointment.medium?.toLowerCase() === 'online' ||
                                            appointment.medium?.toLowerCase() === 'telemedicine' ||
                                            appointment.meetingType?.toLowerCase() === 'online' ||
                                            appointment.meetingType?.toLowerCase() === 'telemedicine') && (
                                                <button
                                                    onClick={() => handleJoinConsultation(appointment.id)}
                                                    className="btn btn-primary btn-sm"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    Join Consultation
                                                </button>
                                            )}
                                        <button
                                            onClick={() => handleViewDetails(appointment)}
                                            className="btn btn-outline btn-sm"
                                        >
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => initiateCancel(appointment)}
                                            className="btn btn-error btn-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Consultation Modal */}
            {showConsultation && selectedAppointmentId && (
                <PatientConsultation
                    appointmentId={selectedAppointmentId}
                    onClose={() => {
                        setShowConsultation(false);
                        setSelectedAppointmentId(null);
                        // No need to fetch history here as it's not displayed
                    }}
                />
            )}

            {/* Prescription Modal */}
            <PatientPrescriptionModal
                isOpen={showPrescription}
                onClose={() => {
                    setShowPrescription(false);
                    setSelectedPrescriptionAppt(null);
                }}
                appointment={selectedPrescriptionAppt}
            />

            {/* Cancel Confirmation Modal */}
            <ConfirmationModal
                isOpen={isCancelModalOpen}
                onClose={() => {
                    setIsCancelModalOpen(false);
                    setAppointmentToCancel(null);
                }}
                onConfirm={handleConfirmCancel}
                title="Cancel Appointment"
                message="Are you sure you want to cancel this appointment? This action cannot be undone and the slot will be made available to other patients."
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
            />
        </div>
    );
};

export default PatientDashboard;

