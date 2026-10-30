import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../Auth/AuthProvider.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const MyAppointments = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [pastAppointments, setPastAppointments] = useState([]);
    const [consultationHistory, setConsultationHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAppointmentsData();
    }, []);

    const fetchAppointmentsData = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");

        try {
            const headers = { Authorization: `Bearer ${token}` };
            // Reusing the dashboard endpoint as per plan
            const response = await axios.get(
                "/patient/dashboard",
                { headers }
            );

            const { pastAppointments, history } = response.data;

            setPastAppointments(pastAppointments || []);
            setConsultationHistory(history || []);

        } catch (error) {
            console.error("Error fetching appointments data:", error);
            toast.error("Failed to load appointments data");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (appointmentId) => {
        toast.info("View Details functionality coming soon");
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
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-2xl p-6 md:p-8 shadow-lg mb-6">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">My Appointments</h1>
                <p className="text-primary-content/80">View your past appointments and consultation history</p>
            </div>

            {/* Past Appointments Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Past Appointments</h2>

                {pastAppointments.length === 0 ? (
                    <div className="text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-600 text-lg">No past appointments</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pastAppointments.map((appointment) => (
                            <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow opacity-75">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                                    {appointment.doctorName}
                                                </h3>
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
                                                    <span className="badge badge-ghost">Completed</span>
                                                    {appointment.type === 'Emergency' && (
                                                        <span className="badge badge-error text-white animate-pulse">Emergency</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleViewDetails(appointment.id)}
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

            {/* Telemedicine History Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mt-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Telemedicine History</h2>

                {consultationHistory.length === 0 ? (
                    <div className="text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-600 text-lg">No telemedicine consultations yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {consultationHistory.map((consultation) => (
                            <div key={consultation.consultationId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                            {consultation.doctorName}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">{consultation.doctorSpecialization}</p>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span>{consultation.appointmentDate ? new Date(consultation.appointmentDate).toLocaleDateString() : "N/A"}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>{consultation.appointmentTime}</span>
                                            </div>
                                            {consultation.rating && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-yellow-400">★</span>
                                                    <span>{consultation.rating}/5</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {consultation.hasPrescription && (
                                            <button
                                                onClick={() => {
                                                    toast.info("Prescription view coming soon");
                                                }}
                                                className="btn btn-outline btn-sm"
                                            >
                                                View Prescription
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyAppointments;
