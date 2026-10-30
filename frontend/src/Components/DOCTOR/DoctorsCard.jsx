import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Heart, Star, Flag } from "lucide-react";
import { toast } from "react-toastify";
import DoctorModal from "./DoctorPOP-UPModal";
import RatingModal from "../Modals/RatingModal";
import ReportModal from "../Modals/ReportModal";


const DoctorsCard = () => {
    const [doctors, setDoctors] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [favoriteDoctors, setFavoriteDoctors] = useState([]);

    const [searchQuery, setSearchQuery] = useState("");
    const [aiMode, setAiMode] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    const navigate = useNavigate();
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);


    // Fetch doctors and favorites from API
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await axios.get("/api/doctors");
                setDoctors(res.data);
                setFilteredDoctors(res.data);
                setLoading(false);
                console.log("Fetched doctors:", res.data);
            } catch (err) {
                console.error("Failed to fetch doctors:", err);
                setError("Failed to fetch doctors");
                setLoading(false);
            }
        };
        fetchDoctors();
        fetchFavorites();
    }, []);


    // NORMAL SEARCH (auto-filter)
    const normalSearch = (query) => {
        if (!query) {
            setFilteredDoctors(doctors);
            console.log("Normal search: showing all doctors");
            return;
        }
        const filtered = doctors.filter((doctor) =>
            Object.values(doctor).some((val) =>
                val?.toString().toLowerCase().includes(query.toLowerCase())
            )
        );
        setFilteredDoctors(filtered);
        console.log("Normal search filtered results:", filtered);
    };


    // AI SEARCH (filter on button click)
    const aiSearch = async (query) => {
        if (!query.trim()) {
            setFilteredDoctors(doctors);
            console.log("AI search: query empty, showing all doctors");
            return;
        }
        try {
            setAiLoading(true);
            console.log("AI Search triggered with query:", query);


            const res = await axios.post("/aisearch", { query });
            const specialties = res.data?.specialties || [];


            console.log("AI returned specialties:", specialties);


            if (specialties.length === 0) {
                setFilteredDoctors([]);
                console.log("AI search returned no specialties, showing empty list");
                return;
            }


            const filtered = doctors.filter((doctor) =>
                specialties.some((spec) =>
                    doctor.specialization?.toLowerCase().includes(spec.toLowerCase())
                )
            );


            setFilteredDoctors(filtered);
            console.log("AI search filtered results:", filtered);
        } catch (err) {
            console.error("AI search failed:", err);
        } finally {
            setAiLoading(false);
        }
    };


    // Filter button handler (AI search only)
    const handleFilter = () => {
        if (aiMode) {
            console.log("AI Filter button clicked with query:", searchQuery);
            aiSearch(searchQuery);
        }
    };


    // AUTO NORMAL SEARCH WHEN NOT IN AI MODE
    useEffect(() => {
        if (!aiMode) {
            normalSearch(searchQuery);
        }
    }, [searchQuery, aiMode]);

    // Fetch favorites
    const fetchFavorites = async () => {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        try {
            const res = await axios.get("/api/favorites", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFavoriteDoctors(res.data.map(d => d._id || d.userId));
        } catch (err) {
            console.error("Failed to fetch favorites:", err);
        }
    };

    // Toggle favorite
    const toggleFavorite = async (doctorId) => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            toast.info("Please login to add favorites");
            return;
        }

        const isFavorite = favoriteDoctors.includes(doctorId);
        try {
            if (isFavorite) {
                await axios.delete("/api/favorites/remove", {
                    data: { doctorId },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFavoriteDoctors(favoriteDoctors.filter(id => id !== doctorId));
                toast.success("Removed from favorites");
            } else {
                await axios.post(
                    "/api/favorites/add",
                    { doctorId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setFavoriteDoctors([...favoriteDoctors, doctorId]);
                toast.success("Added to favorites");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update favorites");
        }
    };

    // Open rating modal
    const openRatingModal = (doctor) => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            toast.info("Please login to rate doctors");
            return;
        }
        setSelectedDoctor(doctor);
        setRatingModalOpen(true);
    };

    // Open report modal
    const openReportModal = (doctor) => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            toast.info("Please login to report doctors");
            return;
        }
        setSelectedDoctor(doctor);
        setReportModalOpen(true);
    };


    if (loading) return <p className="text-center mt-10">Loading doctors...</p>;
    if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;


    return (
        <div className="p-6 min-h-screen bg-gray-50">
            <h2 className="text-3xl font-bold text-center mb-8">Our Doctors</h2>


            {/* SEARCH BAR */}
            <div className="max-w-md mx-auto mb-6 flex gap-2">
                <motion.div
                    className="rounded-lg p-[2px] flex-1"
                    animate={
                        aiMode
                            ? { backgroundPosition: ["0% 50%", "100% 50%"] }
                            : { backgroundPosition: "0% 50%" }
                    }
                    transition={
                        aiMode
                            ? { duration: 3, repeat: Infinity, ease: "linear" }
                            : {}
                    }
                    style={{
                        backgroundImage: aiMode
                            ? "linear-gradient(90deg,#3b82f6,#8b5cf6,#ec4899)"
                            : "linear-gradient(#d1d5db,#d1d5db)",
                        backgroundSize: "300% 300%",
                    }}
                >
                    <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg outline-none"
                        placeholder={
                            aiMode
                                ? "Ask AI: Describe your symptoms..."
                                : "Search doctors (Press TAB for AI)"
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Tab") {
                                e.preventDefault();
                                setAiMode(!aiMode);
                                setSearchQuery("");
                                setFilteredDoctors(doctors);
                                console.log("Toggled AI mode:", !aiMode);
                            }
                        }}
                    />
                </motion.div>


                {/* Filter button only visible in AI mode */}
                {aiMode && (
                    <button className="btn btn-primary" onClick={handleFilter}>
                        Filter
                    </button>
                )}
            </div>


            {aiLoading && (
                <motion.p
                    className="text-sm text-blue-500 mt-2 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    AI is analyzing your symptoms...
                </motion.p>
            )}


            {/* DOCTOR GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                        <div
                            key={doctor._id}
                            className="bg-white rounded-xl shadow-md hover:shadow-xl transition flex flex-col"
                        >
                            <img
                                src={doctor.photoURL || "https://via.placeholder.com/400x300"}
                                alt={doctor.fullName}
                                className="w-full h-52 object-cover rounded-t-xl"
                            />
                            <div className="p-5 flex flex-col flex-1">
                                <h3 className="text-xl font-semibold">{doctor.fullName}</h3>
                                <p className="text-blue-600 font-medium">{doctor.specialization}</p>
                                <p className="text-sm text-gray-600">{doctor.qualifications}</p>
                                <p className="text-sm text-gray-800 font-bold mt-1">
                                    Fee: ৳{doctor.consultationFee || 0}
                                </p>
                                {doctor.accountStatus === "Under Review" && (
                                    <p className="inline-block bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded mt-1">
                                        ⚠️ Under Review
                                    </p>
                                )}
                                <p className="text-sm text-yellow-500 font-medium mt-1">
                                    ⭐ {(doctor.ratingAvg || 4.5).toString()} ({doctor.ratingCount || 10} reviews)
                                </p>

                                {/* Action Buttons Row */}
                                <div className="flex gap-2 mt-3 mb-2">
                                    <button
                                        onClick={() => toggleFavorite(doctor._id)}
                                        className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${favoriteDoctors.includes(doctor._id)
                                            ? "bg-red-50 border-red-500 text-red-600"
                                            : "border-gray-300 text-gray-600 hover:border-red-300"
                                            }`}
                                        title="Add to Favorites"
                                    >
                                        <Heart
                                            size={18}
                                            className={favoriteDoctors.includes(doctor._id) ? "fill-red-500" : ""}
                                        />
                                    </button>
                                    <button
                                        onClick={() => openRatingModal(doctor)}
                                        className="flex-1 py-2 px-3 rounded-lg border-2 border-gray-300 text-gray-600 hover:border-yellow-300 transition-all flex items-center justify-center gap-2"
                                        title="Rate Doctor"
                                    >
                                        <Star size={18} />
                                    </button>
                                    <button
                                        onClick={() => openReportModal(doctor)}
                                        className="flex-1 py-2 px-3 rounded-lg border-2 border-gray-300 text-gray-600 hover:border-red-300 transition-all flex items-center justify-center gap-2"
                                        title="Report Doctor"
                                    >
                                        <Flag size={18} />
                                    </button>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                                    <button
                                        className="btn btn-primary flex-1"
                                        onClick={() => {
                                            setSelectedDoctor(doctor);
                                            setModalOpen(true);
                                        }}
                                    >
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center col-span-full py-10">
                        <p className="text-gray-500 text-lg">No doctors found</p>
                        {aiMode && !aiLoading && (
                            <p className="text-sm text-gray-400">
                                Try describing your symptoms differently.
                            </p>
                        )}
                    </div>
                )}
            </div>


            <DoctorModal
                doctor={selectedDoctor}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
            />

            <RatingModal
                doctor={selectedDoctor}
                isOpen={ratingModalOpen}
                onClose={() => setRatingModalOpen(false)}
            />

            <ReportModal
                doctor={selectedDoctor}
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
            />
        </div>
    );
};


export default DoctorsCard;