import React, { useState } from "react";
import { X, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";

const PrescriptionModal = ({ isOpen, onClose, appointment }) => {
    const [medicine, setMedicine] = useState("");
    const [dosage, setDosage] = useState("");
    const [instructions, setInstructions] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!medicine || !dosage) {
            toast.warning("Medicine and dosage are required");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("authToken");
            await axios.post(
                `/doctor/appointments/${appointment._id}/prescription`,
                { medicine, dosage, instructions },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Prescription saved successfully");
            setMedicine("");
            setDosage("");
            setInstructions("");
            onClose();
        } catch (error) {
            console.error("Error saving prescription:", error);
            toast.error("Failed to upload prescription. Try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!appointment) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-primary/5 p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary">
                                <FileText size={20} />
                                <h3 className="font-bold text-lg">Add Prescription</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <p className="text-sm text-gray-500 mb-4">
                                Prescribing for <span className="font-semibold text-gray-800">
                                    {appointment.patientDetails?.fullName || appointment.fullName || appointment.patientName || "Unknown Patient"}
                                </span>
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Medicine Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={medicine}
                                        onChange={(e) => setMedicine(e.target.value)}
                                        placeholder="e.g., Amoxicillin"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Dosage <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={dosage}
                                        onChange={(e) => setDosage(e.target.value)}
                                        placeholder="e.g., 500mg twice daily for 7 days"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Instructions
                                    </label>
                                    <textarea
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        placeholder="e.g., Take with food"
                                        rows={3}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-focus font-medium transition-colors shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {loading ? (
                                            <span className="loading loading-spinner loading-sm"></span>
                                        ) : (
                                            "Save Prescription"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PrescriptionModal;
