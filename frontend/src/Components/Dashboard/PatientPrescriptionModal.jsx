import React from "react";
import { X, FileText, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const PatientPrescriptionModal = ({ isOpen, onClose, appointment }) => {
    if (!appointment || !appointment.prescription) return null;

    const { medicine, dosage, instructions, createdAt } = appointment.prescription;

    const handleDownload = async () => {
        try {
            const token = localStorage.getItem("authToken");
            const response = await axios.get(
                `/patient/appointments/${appointment.id}/prescription/download`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob', // Important for files
                }
            );

            // Create a link to download the blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Prescription_${appointment.doctorName}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Download failed:", error);
            // Fallback for demo or error
            alert("Failed to download prescription. Please try again.");
        }
    };

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
                        <div className="bg-blue-50 p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2 text-blue-700">
                                <FileText size={20} />
                                <h3 className="font-bold text-lg">Prescription Details</h3>
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
                            <div className="flex justify-between items-start border-b pb-4">
                                <div>
                                    <p className="text-sm text-gray-500">Doctor</p>
                                    <p className="font-semibold text-gray-800">{appointment.doctorName}</p>
                                    <p className="text-xs text-gray-400">{appointment.specialization}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Date</p>
                                    <p className="font-semibold text-gray-800">
                                        {new Date(createdAt || appointment.appointmentDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-1">Medicine</h4>
                                    <p className="text-lg font-medium text-blue-900 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        {medicine}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-1">Dosage</h4>
                                    <p className="text-gray-800 p-2">
                                        {dosage}
                                    </p>
                                </div>

                                {instructions && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-1">Instructions</h4>
                                        <p className="text-gray-600 italic bg-gray-50 p-3 rounded-lg text-sm">
                                            "{instructions}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleDownload}
                                className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-200"
                            >
                                <Download size={18} />
                                Download Prescription PDF
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PatientPrescriptionModal;
