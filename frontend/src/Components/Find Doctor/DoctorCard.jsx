import React, { useEffect, useState } from "react";
import axios from "axios";

const DoctorsList = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await axios.get("/api/doctors");
                setDoctors(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch doctors");
                setLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    if (loading) return <p>Loading doctors...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="doctor-list p-4">
            <h2 className="text-xl font-bold mb-4">Doctors</h2>
            <ul>
                {doctors.map((doctor) => (
                    <li key={doctor._id} className="mb-2">
                        {doctor.fullName}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DoctorsList;