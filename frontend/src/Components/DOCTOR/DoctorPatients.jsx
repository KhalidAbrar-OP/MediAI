import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import PatientRow from "../Dashboard/DoctorFiles/PatientRow";

const DoctorPatients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientAppointments, setPatientAppointments] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const token = localStorage.getItem("authToken");

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                setLoading(true);
                const headers = { Authorization: `Bearer ${token}` };
                // Using the existing dashboard endpoint for now, or a specific patients endpoint if it exists
                const response = await axios.get("/doctor/patients", { headers });
                setPatients(response.data || []);
            } catch (err) {
                console.error("Error fetching patients:", err);
                setError("Failed to load patients");
                toast.error("Failed to load patients");
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, [token]);

    const filteredPatients = patients.filter(patient =>
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewDetails = async (patient) => {
        try {
            setSelectedPatient(patient);
            setIsDetailsModalOpen(true);
            setLoadingDetails(true);
            
            const headers = { Authorization: `Bearer ${token}` };
            // Fetch patient's appointment history
            const response = await axios.get(`/doctor/patient/${patient._id}/appointments`, { headers });
            setPatientAppointments(response.data || []);
        } catch (err) {
            console.error("Error fetching patient details:", err);
            toast.error("Failed to load patient appointment history");
            setPatientAppointments([]);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCancelAppointment = async (appointmentId) => {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) {
            return;
        }

        try {
            const headers = { Authorization: `Bearer ${token}` };
            await axios.patch(`/api/cancel-appointment/${appointmentId}`, { type: "Regular" }, { headers });
            toast.success("Appointment cancelled successfully");
            
            // Refresh appointment history
            if (selectedPatient) {
                const response = await axios.get(`/doctor/patient/${selectedPatient._id}/appointments`, { headers });
                setPatientAppointments(response.data || []);
            }
            
            // Refresh patient list
            const patientsResponse = await axios.get("/doctor/patients", { headers });
            setPatients(patientsResponse.data || []);
        } catch (err) {
            console.error("Error cancelling appointment:", err);
            toast.error(err.response?.data?.message || "Failed to cancel appointment");
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-8 mt-6">
                <div className="flex h-64 items-center justify-center bg-gray-50 rounded-xl">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 mt-6 mb-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Patient Directory</h1>
                <p className="text-gray-500 mt-2">Manage and view medical records for all your patients.</p>
            </div>

            <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="input input-bordered w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div className="text-sm font-medium text-gray-600">
                    Total Patients: {filteredPatients.length}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th>Patient</th>
                                <th>Contact</th>
                                <th>Last Visit</th>
                                <th>Total Appointments</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-gray-500">
                                        {searchTerm ? "No patients match your search." : "No patients found."}
                                    </td>
                                </tr>
                            ) : (
                                filteredPatients.map((patient) => (
                                    <PatientRow 
                                        key={patient._id} 
                                        patient={patient}
                                        onViewDetails={() => handleViewDetails(patient)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Patient Details Modal */}
            {isDetailsModalOpen && selectedPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setIsDetailsModalOpen(false)}>
                    <div className="bg-white rounded-lg shadow-2xl p-0 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
                            <h3 className="text-xl font-bold">Patient Details</h3>
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="btn btn-sm btn-circle btn-ghost text-white hover:bg-indigo-700"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            {/* Patient Info */}
                            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                                    {selectedPatient.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-800">{selectedPatient.name}</h4>
                                    <p className="text-sm text-gray-500">{selectedPatient.gender || "N/A"}</p>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Email</p>
                                    <p className="font-medium text-gray-800">{selectedPatient.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                                    <p className="font-medium text-gray-800">{selectedPatient.phone || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Last Visit</p>
                                    <p className="font-medium text-gray-800">{selectedPatient.lastVisit}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Total Appointments</p>
                                    <p className="font-medium text-gray-800">{selectedPatient.totalAppointments || 0}</p>
                                </div>
                            </div>

                            {/* Appointment History */}
                            <div>
                                <h4 className="text-md font-bold text-gray-800 mb-3">Appointment History</h4>
                                {loadingDetails ? (
                                    <div className="flex justify-center py-8">
                                        <span className="loading loading-spinner loading-md text-primary"></span>
                                    </div>
                                ) : patientAppointments.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">No appointment history found</p>
                                ) : (
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {patientAppointments.map((appointment, index) => (
                                            <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">
                                                            {new Date(appointment.appointmentDate).toLocaleDateString('en-US', { 
                                                                weekday: 'short', 
                                                                year: 'numeric', 
                                                                month: 'short', 
                                                                day: 'numeric' 
                                                            })}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {appointment.timeSlot?.start} - {appointment.timeSlot?.end}
                                                        </p>
                                                        <p className="text-xs text-gray-600 mt-1">{appointment.reason || "No reason specified"}</p>
                                                    </div>
                                                    <div className="text-right space-y-2">
                                                        <div>
                                                            <span className={`badge badge-sm ${
                                                                appointment.status === 'completed' ? 'badge-success' :
                                                                appointment.status === 'confirmed' ? 'badge-info' :
                                                                appointment.status === 'cancelled' ? 'badge-error' :
                                                                'badge-warning'
                                                            }`}>
                                                                {appointment.status}
                                                            </span>
                                                            <p className="text-xs text-gray-500 mt-1">{appointment.meetingType}</p>
                                                        </div>
                                                        {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                                                            <button
                                                                onClick={() => handleCancelAppointment(appointment._id)}
                                                                className="btn btn-xs btn-error text-white"
                                                            >
                                                                Cancel
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

                        {/* Footer */}
                        <div className="bg-gray-50 px-6 py-4 flex justify-end">
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="btn btn-primary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorPatients;
