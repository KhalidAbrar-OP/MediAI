import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const ReportModal = ({ isOpen, onClose, doctor }) => {
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!reason || !description.trim()) {
            toast.warn("Please select a reason and provide a description");
            return;
        }

        setLoading(true);
        try {
            await axios.post(
                "/api/reports/add",
                {
                    doctorId: doctor._id,
                    reason,
                    description
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`
                    }
                }
            );

            toast.success("Report submitted successfully");
            setReason("");
            setDescription("");
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit report");
        } finally {
            setLoading(false);
        }
    };

    if (!doctor) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2">
                            <Flag className="text-red-500" size={24} />
                            <h2 className="text-2xl font-bold">Report Doctor</h2>
                        </div>
                        <p className="text-gray-600 mb-6">Dr. {doctor.fullName}</p>

                        {/* Reason Dropdown */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for Report
                            </label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                            >
                                <option value="">Select a reason</option>
                                <option value="inappropriate_behavior">Inappropriate Behavior</option>
                                <option value="wrong_diagnosis">Wrong Diagnosis</option>
                                <option value="unprofessional">Unprofessional Conduct</option>
                                <option value="safety_concern">Safety Concern</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Description Text Area */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Please provide details about your concern..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                                rows={5}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${loading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-red-600 hover:bg-red-700"
                                }`}
                        >
                            {loading ? "Submitting..." : "Submit Report"}
                        </button>

                        <p className="text-xs text-gray-500 text-center mt-4">
                            Your report will be reviewed by our admin team
                        </p>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ReportModal;
