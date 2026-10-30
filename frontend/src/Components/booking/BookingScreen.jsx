import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function BookingScreen() {
  const [doctors, setDoctors] = useState([]);
  const [specialization, setSpecialization] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);

  const navigate = useNavigate();

  // Load doctors
  useEffect(() => {
    axios.get("/api/doctors")
      .then(res => setDoctors(res.data))
      .catch(err => console.error(err));
  }, []);

  // When doctor is selected → load their slots
  const loadSlots = async (doctorId) => {
    const res = await axios.get(
      `/api/doctor/slots?doctorId=${doctorId}`
    );
    setSlots(res.data);
  };

  const bookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const res = await axios.post(
        "/api/appointments/book",
        {
          doctorId: selectedDoctor._id,
          date: selectedDate,
          start: selectedSlot.start,
          end: selectedSlot.end
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

      toast.success("Appointment booked!");

      navigate(`/payment/${res.data.appointmentId}/${res.data.fee}`, {
        state: {
          doctor: selectedDoctor,
          slot: selectedSlot,
          date: selectedDate
        }
      });

    } catch (err) {
      const msg =
        err.response?.data?.error ||
        "Error booking the appointment. Please try again.";

      toast.error(msg);
    }
  };

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-3xl font-bold">Book an Appointment</h1>

      {/* Select Specialization */}
      <select
        className="select select-bordered w-full max-w-md"
        onChange={(e) => setSpecialization(e.target.value)}
      >
        <option value="">Select Specialization</option>
        {[...new Set(doctors.map(d => d.specialization))].map((sp, i) => (
          <option key={i} value={sp}>{sp}</option>
        ))}
      </select>

      {/* Select Doctor */}
      {specialization && (
        <select
          className="select select-bordered w-full max-w-md"
          onChange={(e) => {
            const doc = doctors.find(d => d._id === e.target.value);
            setSelectedDoctor(doc);
            loadSlots(doc._id);
          }}
        >
          <option value="">Select Doctor</option>
          {doctors
            .filter(d => d.specialization === specialization)
            .map(doc => (
              <option key={doc._id} value={doc._id}>
                {doc.fullName || doc.name} (Fee: ৳{doc.consultationFee || doc.fee || 0})
              </option>
            ))}
        </select>
      )}

      {/* Select Date */}
      {selectedDoctor && (
        <input
          type="date"
          className="input input-bordered w-full max-w-md"
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      )}

      {/* Select Slot */}
      {selectedDate && (
        <div className="space-y-3">
          <h3 className="text-xl font-semibold">Available Slots</h3>

          {slots
            .filter(day => day.date === selectedDate)
            .map(day => (
              <div key={day.date} className="flex flex-wrap gap-3">
                {day.slots.map((slot, index) => (
                  <button
                    key={index}
                    className={
                      slot.booked
                        ? "btn btn-error btn-outline btn-sm opacity-50 cursor-not-allowed"
                        : selectedSlot?.start === slot.start
                          ? "btn btn-primary btn-sm"
                          : "btn btn-outline btn-sm"
                    }
                    onClick={() => {
                      if (slot.booked) {
                        toast.error("You cannot able to book this slot");
                      } else {
                        setSelectedSlot(slot);
                      }
                    }}
                  >
                    {slot.start} - {slot.end}
                  </button>
                ))}
              </div>
            ))}
        </div>
      )}

      {/* Confirm Booking */}
      {selectedSlot && (
        <button
          className="btn btn-success w-full max-w-md"
          onClick={bookAppointment}
        >
          Confirm & Proceed to Payment
        </button>
      )}
    </div>
  );
}
