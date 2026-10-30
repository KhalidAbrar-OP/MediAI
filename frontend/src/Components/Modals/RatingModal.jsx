import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const RatingModal = ({ isOpen, onClose, doctor }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [review, setReview] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.warn("Please select a rating");
            return;
        }

        setLoading(true);
        try {
            await axios.post(
                "/api/ratings/add",
                {
                    doctorId: doctor._id,
                    rating,
                    review
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`
                    }
                }
            );

            toast.success("Rating submitted successfully!");
            setRating(0);
            setReview("");
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit rating");
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
                        <h2 className="text-2xl font-bold mb-2">Rate Doctor</h2>
                        <p className="text-gray-600 mb-6">Dr. {doctor.fullName}</p>

                        {/* Star Rating */}
                        <div className="flex justify-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        size={40}
                                        className={`${star <= (hoverRating || rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Review Text Area */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Your Review (Optional)
                            </label>
                            <textarea
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                placeholder="Share your experience..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                rows={4}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${loading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                                }`}
                        >
                            {loading ? "Submitting..." : "Submit Rating"}
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default RatingModal;
