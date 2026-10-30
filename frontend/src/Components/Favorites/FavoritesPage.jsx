import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Heart } from "lucide-react";
import { toast } from "react-toastify";

const FavoritesPage = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const res = await axios.get("/api/favorites", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFavorites(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch favorites:", err);
            toast.error("Failed to load favorites");
            setLoading(false);
        }
    };

    const removeFavorite = async (doctorId) => {
        const token = localStorage.getItem("authToken");
        try {
            await axios.delete("/api/favorites/remove", {
                data: { doctorId },
                headers: { Authorization: `Bearer ${token}` }
            });
            setFavorites(favorites.filter(d => d._id !== doctorId && d.userId !== doctorId));
            toast.success("Removed from favorites");
        } catch (err) {
            toast.error("Failed to remove from favorites");
        }
    };

    if (loading) return <p className="text-center mt-10">Loading favorites...</p>;

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            <h2 className="text-3xl font-bold text-center mb-8">My Favorite Doctors</h2>

            {favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {favorites.map((doctor) => (
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
                                <p className="text-sm text-yellow-500 font-medium mt-1">
                                    ⭐ {(doctor.ratingAvg || 4.5).toString()} ({doctor.ratingCount || 10} reviews)
                                </p>

                                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                                    <button
                                        className="btn btn-primary flex-1"
                                        onClick={() => navigate(`/doctor/${doctor._id}`)}
                                    >
                                        View Profile
                                    </button>
                                    <button
                                        className="btn btn-outline btn-error flex-1 flex items-center justify-center gap-2"
                                        onClick={() => removeFavorite(doctor._id || doctor.userId)}
                                    >
                                        <Heart size={18} className="fill-red-500" />
                                        Unfavorite
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <Heart size={64} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg mb-4">No favorite doctors yet</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate("/doctors")}
                    >
                        Browse Doctors
                    </button>
                </div>
            )}
        </div>
    );
};

export default FavoritesPage;
