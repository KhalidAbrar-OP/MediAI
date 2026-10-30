import React, { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../Auth/AuthProvider.jsx";

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/doctors/${id}`)
      .then((res) => setDoctor(res.data))
      .catch((err) => console.error("Error loading doctor:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading doctor details...</div>;
  }

  if (!doctor) {
    return <div className="p-10 text-center text-red-500">Doctor not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-5 space-y-4">
      <div className="flex items-start gap-4">
        <img
          src={doctor.photoURL || "default-url"}
          alt={doctor.fullName}
          className="w-20 h-20 rounded-full object-cover"
        />

        <div className="flex-1">
          <h1 className="text-3xl font-bold">{doctor.fullName}</h1>
          <p className="text-lg text-gray-600">{doctor.specialization || "—"}</p>

          <div className="mt-2 text-gray-700 space-y-1">
            <p>
              <strong>Fee:</strong> ৳{doctor.consultationFee ?? 0}
            </p>
            <p>
              <strong>Rating:</strong>{" "}
              ⭐ {(doctor.ratingAvg ?? 0).toFixed?.(1) ?? (doctor.ratingAvg ?? 0)} ({doctor.ratingCount ?? 0})
            </p>
            {doctor.phoneNumber ? (
              <p>
                <strong>Contact:</strong> {doctor.phoneNumber}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="text-gray-700">
        <strong>Biography:</strong>
        <div className="mt-1 whitespace-pre-line">
          {doctor.bio || "No biography available."}
        </div>
      </div>

      {/* Optional: availability list if you return it from backend */}
      {Array.isArray(doctor.availability) && doctor.availability.length > 0 ? (
        <div className="text-gray-700">
          <strong>Availability:</strong>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            {doctor.availability.map((a) => (
              <li key={a._id}>
                {a.day ? `${a.day}: ` : ""}
                {a.startTime && a.endTime ? `${a.startTime} - ${a.endTime}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex gap-3 pt-2">
        <button
          className="btn btn-success"
          onClick={() => {
            if (!user) {
              navigate("/login");
              return;
            }
            navigate(`/book/${doctor._id}`);
          }}
        >
          Book Appointment
        </button>
        <Link to="/doctors" className="btn btn-ghost">
          Back to Find Your Doctor
        </Link>
      </div>
    </div>
  );
}
