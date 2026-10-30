import React, { useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../Auth/AuthProvider.jsx";

const DoctorModal = ({ doctor, isOpen, onClose }) => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    if (!doctor) return null;

    const handleEmergency = () => {
        if (!user) {
            navigate("/login");
            return;
        }
        navigate("/emergency-appointment", { state: { doctor } });
    };

    const handleBooking = () => {
        if (!user) {
            navigate("/login");
            return;
        }
        navigate(`/book/${doctor._id}`);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white rounded-xl shadow-xl max-w-3xl w-full overflow-hidden relative max-h-[90vh] flex flex-col"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Close Button */}
                        <button
                            className="absolute top-3 right-3 btn btn-sm btn-circle btn-ghost z-10"
                            onClick={onClose}
                        >
                            ✕
                        </button>

                        {/* Modal Content - Scrollable */}
                        <div className="overflow-y-auto flex-1 p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Doctor Photo */}
                                <div className="flex-shrink-0">
                                    <img
                                        src={doctor.photoURL || "https://via.placeholder.com/200"}
                                        alt={doctor.fullName}
                                        className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full border-4 border-gray-100 shadow-sm mx-auto md:mx-0"
                                    />
                                </div>

                                {/* Header Info */}
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-3xl font-bold text-gray-900">{doctor.fullName}</h2>
                                    <p className="text-blue-600 font-semibold text-lg mt-1">{doctor.specialization}</p>
                                    <p className="text-gray-600 text-sm mt-1">{doctor.qualifications}</p>

                                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
                                        <span className="badge badge-lg badge-ghost gap-2">
                                            ⭐ {(doctor.ratingAvg || 0).toFixed?.(1) || doctor.ratingAvg || 0} ({doctor.ratingCount || 0})
                                        </span>
                                        <span className="badge badge-lg badge-ghost">
                                            ৳{doctor.consultationFee || 0} / visit
                                        </span>
                                        {doctor.experience && (
                                            <span className="badge badge-lg badge-ghost">
                                                {doctor.experience} Yrs Exp.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Info */}
                            <div className="mt-8 space-y-6">
                                {/* About Section */}
                                <div>
                                    <h3 className="text-lg font-bold border-b pb-2 mb-3">About Doctor</h3>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                        {doctor.bio || "No biography available for this doctor."}
                                    </p>
                                </div>

                                {/* Contact Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {doctor.email && (
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm font-semibold text-gray-500">Email</p>
                                            <p className="text-gray-900">{doctor.email}</p>
                                        </div>
                                    )}
                                    {doctor.phoneNumber && (
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm font-semibold text-gray-500">Phone</p>
                                            <p className="text-gray-900">{doctor.phoneNumber}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer Actions */}
                        <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                            <button
                                className="btn btn-error text-white flex-1 sm:flex-none"
                                onClick={handleEmergency}
                            >
                                Emergency Appointment
                            </button>

                            <button
                                className="btn btn-primary flex-1 sm:flex-none"
                                onClick={handleBooking}
                            >
                                Book Appointment
                            </button>

                            <button
                                className="btn btn-outline flex-1 sm:flex-none"
                                onClick={onClose}
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DoctorModal;