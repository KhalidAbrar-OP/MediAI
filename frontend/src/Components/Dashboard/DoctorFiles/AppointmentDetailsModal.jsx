import React from "react";
import { X, Calendar, Clock, User, FileText, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AppointmentDetailsModal = ({ isOpen, onClose, appointment }) => {
    if (!appointment) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-indigo-50 p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-700">
                                <FileText size={20} />
                                <h3 className="font-bold text-lg">Appointment Details</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4 border-b pb-4">
                                <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h4 className="text-sm text-gray-500 uppercase font-semibold">Patient</h4>
                                    <p className="text-xl font-bold text-gray-900">
                                        {appointment.patientDetails?.fullName || appointment.fullName || appointment.patientName || "N/A"}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {appointment.patientDetails?.email || appointment.email || appointment.patientEmail || "N/A"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                                        <Calendar size={16} />
                                        <span className="text-sm font-medium">Date</span>
                                    </div>
                                    <p className="text-gray-900">
                                        {appointment.appointmentDate
                                            ? new Date(appointment.appointmentDate).toLocaleDateString()
                                            : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                                        <Clock size={16} />
                                        <span className="text-sm font-medium">Time</span>
                                    </div>
                                    <p className="text-gray-900">{appointment.appointmentTime || "N/A"}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h5 className="text-sm font-semibold text-gray-700 mb-1">Status</h5>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                        ${appointment.status?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-700' :
                                            appointment.status?.toLowerCase() === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                appointment.status?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'}`}>
                                        {appointment.status || "Pending"}
                                    </span>
                                </div>

                                <div>
                                    <h5 className="text-sm font-semibold text-gray-700 mb-1">Payment Status</h5>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                        ${appointment.paymentStatus?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {appointment.paymentStatus || "Unpaid"}
                                    </span>
                                </div>

                                {appointment.type && (
                                    <div>
                                        <h5 className="text-sm font-semibold text-gray-700 mb-1">Type</h5>
                                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                                            {appointment.type}
                                        </span>
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center gap-2 text-gray-700 mb-1">
                                        <Activity size={16} />
                                        <h5 className="text-sm font-semibold">Reason for Visit</h5>
                                    </div>
                                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                                        {appointment.reason || "No reason specified."}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={onClose}
                                    className="w-full bg-gray-100 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AppointmentDetailsModal;
