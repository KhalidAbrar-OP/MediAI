import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../Auth/AuthProvider.jsx";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, Calendar, Clock,
  Activity, ChevronRight, Stethoscope,
  UserCircle
} from "lucide-react";

export default function PatientBooking() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [slots, setSlots] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [type, setType] = useState("normal");
  const [medium, setMedium] = useState("physical");

  // Patient profile state
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    gender: "",
    dob: "",
    phoneNumber: "",
  });

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDoctor();
    loadSlots();
    fetchProfile();
  }, [doctorId]);

  const fetchProfile = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) return;
    try {
      const res = await axios.get("/users/profile", {
        headers: { Authorization: `Bearer ${authToken}` },
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
        localStorage.removeItem("user"); // Clear user info if stored
        navigate("/login");
      } else {
        toast.error("Failed to load profile");
      }
    }
  };

  const loadDoctor = async () => {
    try {
      const res = await axios.get(`/api/doctors/${doctorId}`);
      setDoctor(res.data);
    } catch (err) {
      console.error("Failed to load doctor", err);
    }
  };

  const loadSlots = async () => {
    try {
      const res = await axios.get(
        `/api/doctor/slots?doctorId=${doctorId}`
      );
      setSlots(res.data);
    } catch (err) {
      toast.error("Failed to load slots");
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSlotSelection = (day, slot) => {
    setSelectedDate(day);
    setSelectedSlot(slot);
  };

  const bookAppointment = async () => {
    if (!user) {
      toast.info("Please login to book an appointment");
      return navigate("/login");
    }

    // Validate patient info
    if (!profile.fullName || !profile.email || !profile.gender || !profile.dob || !profile.phoneNumber) {
      toast.warn("Please fill in all patient information");
      return;
    }

    if (!selectedSlot || !selectedDate) {
      toast.warn("Please select a time slot");
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        doctorId,
        type: "normal",
        medium,
        date: selectedDate.date,
        start: selectedSlot.start,
        end: selectedSlot.end,
        patientDetails: {
          fullName: profile.fullName,
          email: profile.email,
          gender: profile.gender,
          dob: profile.dob,
          phoneNumber: profile.phoneNumber,
        }
      };

      const res = await axios.post(
        "/api/appointments/book",
        bookingData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

      toast.success("Appointment request submitted! Redirecting to payment...");

      const { appointmentId, fee } = res.data;
      navigate(`/payment/${appointmentId}/${fee || 0}`);

    } catch (error) {
      const message = error.response?.data?.message || "Error booking the appointment. Please try again.";

      if (error.response && (error.response.status === 401 || (error.response.status === 403 && message.toLowerCase().includes("session")))) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      toast.error(message);
      console.error("Booking error:", error);
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
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-8 text-white relative">
          <div className="absolute top-0 right-0 opacity-10 -mr-10 -mt-10">
            <Activity size={200} />
          </div>
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium mb-4"
            >
              <Calendar size={16} />
              Book Appointment
            </motion.div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Consult with Dr. {doctor?.fullName || "Loading..."}
            </h2>
            <p className="mt-2 text-blue-100 flex items-center gap-2">
              <Stethoscope size={18} /> MediAi Healthcare System
            </p>
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-8">
          {/* Appointment Type & Medium */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Appointment Type
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                  value={type}
                  onChange={(e) => {
                    if (e.target.value === "emergency") {
                      if (doctor) {
                        navigate("/emergency-appointment", { state: { doctor } });
                      } else {
                        toast.error("Doctor information not loaded yet. Please try again in a moment.");
                      }
                    } else {
                      setType(e.target.value);
                    }
                  }}
                >
                  <option value="normal">Normal Appointment</option>
                  <option value="emergency">Emergency Appointment (Priority)</option>
                </select>
                <ChevronRight className="absolute right-3 top-11 text-slate-400 rotate-90 pointer-events-none" size={18} />
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Appointment Medium
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                  value={medium}
                  onChange={(e) => setMedium(e.target.value)}
                >
                  <option value="physical">Physical Visit</option>
                  <option value="telemedicine">Telemedicine (Online)</option>
                </select>
                <ChevronRight className="absolute right-3 top-11 text-slate-400 rotate-90 pointer-events-none" size={18} />
              </div>
            </div>
          </section>

          {/* Patient Information */}
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

          {/* Available Slots */}
          <section>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
              <Clock className="text-blue-600" size={20} />
              <h3 className="text-lg font-bold text-slate-800">Select Available Slot</h3>
            </div>
            {slots.length > 0 ? (
              <>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white border-2 border-blue-200 rounded"></div>
                    <span className="text-sm text-slate-600">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-600 rounded"></div>
                    <span className="text-sm text-slate-600">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 rounded opacity-60"></div>
                    <span className="text-sm text-slate-600">Booked</span>
                  </div>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto p-1 pr-2 custom-scrollbar">
                  {slots.map((day) => (
                    <div key={day.date} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3">
                      <h4 className="font-bold text-blue-600 border-b pb-2">{day.date}</h4>
                      <div className="flex flex-wrap gap-2">
                        {day.slots.map((slot, i) => (
                          <motion.button
                            key={i}
                            whileHover={{ scale: slot.booked ? 1 : 1.05 }}
                            whileTap={{ scale: slot.booked ? 1 : 0.95 }}
                            className={`px-4 py-2 rounded-xl font-medium transition-all relative ${slot.booked
                              ? "bg-red-100 text-red-400 cursor-not-allowed opacity-60 line-through"
                              : selectedSlot === slot && selectedDate === day
                                ? "bg-blue-600 text-white shadow-lg ring-2 ring-blue-500"
                                : "bg-white border-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                              }`}
                            onClick={() => {
                              if (!slot.booked) handleSlotSelection(day, slot);
                            }}
                            disabled={slot.booked}
                          >
                            <div className="flex flex-col items-center">
                              <span>{slot.start} - {slot.end}</span>
                              {slot.booked && (
                                <span className="text-xs font-bold text-red-500">BOOKED</span>
                              )}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                <Activity size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 font-medium">No available slots found for this doctor.</p>
              </div>
            )}
          </section>

          {/* Book Button */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 8px 20px -5px rgba(37,99,235,0.4)" }}
            whileTap={{ scale: 0.98 }}
            onClick={bookAppointment}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black text-xl tracking-wide uppercase transition-all flex items-center justify-center gap-3 ${loading
              ? "bg-slate-300 cursor-not-allowed text-slate-500"
              : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-xl shadow-blue-200"
              }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <Activity size={24} />
                Confirm Booking
              </>
            )}
          </motion.button>

          <p className="text-center text-slate-400 text-sm">
            Secured by MediAi Healthcare © {new Date().getFullYear()}
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
}
