import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../Auth/AuthProvider.jsx";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
    User, Mail, Phone, Calendar, Clock,
    AlertCircle, Activity, ChevronRight, Stethoscope,
    FileText, UserCircle
} from "lucide-react";

const BookEmergencyAppointment = () => {
    const { state } = useLocation();
    const doctor = state?.doctor;
    const navigate = useNavigate();
    const { user, token } = useContext(AuthContext);

    const [profile, setProfile] = useState({
        fullName: "",
        email: "",
        gender: "",
        dob: "",
        phoneNumber: "",
    });
    const [schedules, setSchedules] = useState([]);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [details, setDetails] = useState("");
    const [meetingType, setMeetingType] = useState("physical"); // default
    const [loading, setLoading] = useState(false);

    // Redirect if no doctor
    useEffect(() => {
        if (!doctor) navigate("/doctors");
    }, [doctor, navigate]);

    // Fetch profile
    useEffect(() => {
        if (!token) return;
        const fetchProfile = async () => {
            try {
                const res = await axios.get("/users/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProfile({
                    fullName: res.data.fullName || "",
                    email: res.data.email || "",
                    gender: res.data.gender || "",
                    dob: res.data.dob || "",
                    phoneNumber: res.data.phoneNumber || "",
                });
            } catch (err) {
                console.error("Failed to load profile", err);
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    toast.error("Session expired. Please login again.");
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("user");
                    navigate("/login");
                } else {
                    toast.error("Failed to load profile");
                }
            }
        };
        fetchProfile();
    }, [token]);

    // Fetch doctor schedules
    useEffect(() => {
        if (!doctor) return;
        const fetchSchedules = async () => {
            try {
                const res = await axios.get(
                    `/doctor/${doctor._id}/schedules`
                );
                if (res.data.message === "No schedules found") {
                    setSchedules([]);
                    return;
                }
                setSchedules(res.data);
            } catch (err) {
                console.error("Failed to fetch schedules", err);
                toast.error("Failed to fetch schedules");
            }
        };
        fetchSchedules();
    }, [doctor]);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleEmergency = async () => {
        if (!user) {
            toast.info("Please login to book an appointment");
            return navigate("/login");
        }
        if (!selectedSchedule) {
            toast.warn("Please select a schedule");
            return;
        }
        if (!details.trim()) {
            toast.warn("Emergency details are required");
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post(
                "/emergency/book",
                {
                    doctorId: doctor._id,
                    scheduleId: selectedSchedule._id,
                    details,
                    fullName: profile.fullName,
                    email: profile.email,
                    gender: profile.gender,
                    dob: profile.dob,
                    phoneNumber: profile.phoneNumber,
                    meetingType, // included in request
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Emergency appointment requested successfully! Redirecting to payment...");
            const { emergencyId, fee } = res.data;
            navigate(`/payment/${emergencyId}/${fee || 1500}?type=emergency`);
        } catch (err) {
            console.error(err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                toast.error("Session expired. Please login again.");
                localStorage.removeItem("authToken");
                localStorage.removeItem("user");
                navigate("/login");
                return;
            }
            toast.error("Failed to book emergency appointment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 p-8 text-white relative">
                    <div className="absolute top-0 right-0 opacity-10 -mr-10 -mt-10">
                        <Activity size={200} />
                    </div>
                    <div className="relative z-10">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium mb-4"
                        >
                            <AlertCircle size={16} className="animate-pulse" />
                            Priority Emergency Booking
                        </motion.div>
                        <h2 className="text-3xl font-extrabold tracking-tight">
                            Consult with Dr. {doctor?.fullName}
                        </h2>
                        <p className="mt-2 text-rose-100 flex items-center gap-2">
                            <Stethoscope size={18} /> MediAi Emergency Response System
                        </p>
                    </div>
                </div>

                <div className="p-6 md:p-10 space-y-8">
                    {/* Patient Info */}
                    <section>
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                            <UserCircle className="text-blue-600" size={20} />
                            <h3 className="text-lg font-bold text-slate-800">Patient Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="relative group">
                                <User className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={profile.fullName}
                                    onChange={handleChange}
                                    placeholder="Full Name"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                />
                            </div>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    value={profile.email}
                                    onChange={handleChange}
                                    placeholder="Email Address"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                />
                            </div>
                            <div className="relative">
                                <select
                                    name="gender"
                                    value={profile.gender}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                                <ChevronRight className="absolute right-3 top-3.5 text-slate-400 rotate-90 pointer-events-none" size={18} />
                            </div>
                            <div className="relative group">
                                <Phone className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={profile.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="Phone Number"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Date of Birth</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <input
                                        type="date"
                                        name="dob"
                                        value={profile.dob}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Meeting Type */}
                    <section>
                        <div className="relative group">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Meeting Type</label>
                            <select
                                name="meetingType"
                                value={meetingType}
                                onChange={(e) => setMeetingType(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all cursor-pointer"
                            >
                                <option value="physical">Physical</option>
                                <option value="telemedicine">Telemedicine</option>
                            </select>
                        </div>
                    </section>

                    {/* Schedule Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                            <Clock className="text-blue-600" size={20} />
                            <h3 className="text-lg font-bold text-slate-800">Select Emergency Slot</h3>
                        </div>
                        {schedules.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1 pr-2 custom-scrollbar">
                                {schedules.map((s) => (
                                    <motion.div
                                        key={s._id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setSelectedSchedule(s)}
                                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-200 relative ${selectedSchedule?._id === s._id
                                            ? "border-blue-500 bg-blue-50/50 shadow-md ring-1 ring-blue-500"
                                            : "border-slate-100 hover:border-blue-200 bg-slate-50/50"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-900">{s.day}</span>
                                            {selectedSchedule?._id === s._id && (
                                                <div className="h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <div className="h-1.5 w-1.5 bg-white rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-sm text-slate-600 flex items-center gap-1.5">
                                            <Clock size={14} className="text-blue-500" />
                                            {s.start} - {s.end}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                                <Activity size={32} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-slate-500 font-medium">No available slots found for this doctor.</p>
                            </div>
                        )}
                    </section>

                    {/* Case Details */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                            <FileText className="text-blue-600" size={20} />
                            <h3 className="text-lg font-bold text-slate-800">Case Details</h3>
                        </div>
                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Please describe the emergency symptoms or current medical situation"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all resize-none min-h-[120px] shadow-inner"
                        />
                    </section>

                    {/* Payment Button */}
                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 8px 20px -5px rgba(34,197,94,0.4)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleEmergency}
                        disabled={loading}
                        className={`w-full py-4 mt-4 rounded-2xl font-black text-xl tracking-wide uppercase transition-all flex items-center justify-center gap-3 ${loading
                            ? "bg-slate-300 cursor-not-allowed text-slate-500"
                            : "bg-green-600 hover:bg-green-700 text-white shadow-lg"
                            }`}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending Request...
                            </>
                        ) : (
                            <>
                                <Activity size={24} />
                                Pay & Confirm Emergency Booking
                            </>
                        )}
                    </motion.button>

                    <p className="text-center text-slate-400 text-sm">
                        Secured by MediAi Triage Protocols &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </motion.div>

            {/* Scrollbar styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}} />
        </div>
    );
};

export default BookEmergencyAppointment;
