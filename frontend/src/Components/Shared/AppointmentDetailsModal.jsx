import React from 'react';

const AppointmentDetailsModal = ({ isOpen, onClose, appointment, isDoctorView = false }) => {
    if (!isOpen || !appointment) return null;

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-2xl p-0 w-full max-w-lg mx-4 relative animate-fade-in-up overflow-hidden border border-gray-100"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Header */}
                <div className="bg-primary px-6 py-4 flex justify-between items-center text-white">
                    <h3 id="modal-title" className="text-xl font-bold">Appointment Details</h3>
                    <button
                        onClick={onClose}
                        className="btn btn-sm btn-circle btn-ghost text-white hover:bg-primary-focus"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">

                    {/* Participant Info */}
                    <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                            {(isDoctorView ? (appointment.patientName || "P") : (appointment.doctorName || "D")).charAt(0)}
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">
                                {isDoctorView ? "Patient" : "Doctor"}
                            </p>
                            <h4 className="text-lg font-bold text-gray-800">
                                {isDoctorView ? (appointment.patientName || "Unknown Patient") : (appointment.doctorName || "Unknown Doctor")}
                            </h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {!isDoctorView && appointment.specialization && appointment.specialization !== 'Emergency' && (
                                    <span className="badge badge-outline">{appointment.specialization}</span>
                                )}
                                {appointment.type === 'Emergency' && (
                                    <span className="badge badge-error text-white">Emergency</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Date</p>
                            <p className="font-medium text-gray-800">{formatDate(appointment.appointmentDate)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Time</p>
                            <p className="font-medium text-gray-800">{appointment.appointmentTime || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Consultation Medium</p>
                            <p className="font-medium text-gray-800 capitalize">{appointment.medium || appointment.consultationType || "Physical"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Status</p>
                            <span className={`badge ${appointment.status === 'Completed' ? 'badge-success text-white' :
                                appointment.status === 'Cancelled' ? 'badge-error text-white' :
                                    'badge-ghost'
                                }`}>
                                {appointment.status || "Upcoming"}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                            <span className={`badge ${appointment.paymentStatus === 'Paid' ? 'badge-success text-white' : 'badge-warning'
                                }`}>
                                {appointment.paymentStatus || "Unpaid"}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Fee</p>
                            <p className="font-medium text-gray-800">{appointment.amount ? `৳${appointment.amount}` : "N/A"}</p>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="btn btn-primary"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppointmentDetailsModal;
