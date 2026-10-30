import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
    Users, UserPlus, CheckCircle, XCircle, Stethoscope,
    Clock, Mail, Award, Trash2, Search, Filter
} from "lucide-react";

const Doctors = () => {
    const [activeTab, setActiveTab] = useState("requests"); // 'requests' or 'list'
    const [requests, setRequests] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Filters for Doctor List
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const token = localStorage.getItem("authToken");

            try {
                if (activeTab === "requests") {
                    const res = await axios.get("/api/admin/doctor-requests", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setRequests(res.data);
                } else {
                    // Fetch all users and filter for doctors
                    const res = await axios.get("/users", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const allUsers = res.data;
                    const doctorUsers = allUsers.filter(u => u.userRole === 'doctor');
                    setDoctors(doctorUsers);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Failed to load data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab, refreshTrigger]);

    // Handle Request Action
    const handleRequestAction = async (requestId, status) => {
        const token = localStorage.getItem("authToken");
        try {
            await axios.put(`/api/admin/doctor-requests/${requestId}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Request ${status} successfully`);
            setRefreshTrigger(prev => prev + 1); // Refresh list
        } catch (error) {
            console.error(`Error updating request to ${status}:`, error);
            toast.error("Action failed.");
        }
    };

    // Handle Demote (Remove Doctor Role)
    const handleDemoteDoctor = async (userId) => {
        if (!window.confirm("Are you sure you want to remove Doctor status from this user? They will become a regular user.")) return;

        const token = localStorage.getItem("authToken");
        try {
            await axios.put(`/users/role`,
                { userId, role: 'user' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("User demoted to regular User");
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error("Error demoting doctor:", error);
            toast.error("Failed to update role.");
        }
    };

    const filteredDoctors = doctors.filter(doc =>
        doc.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Stethoscope className="w-8 h-8 text-primary" />
                        Doctor Management
                    </h1>
                    <p className="text-gray-500 mt-1">Manage doctor applications and existing medical staff</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-base-200 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab("requests")}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === "requests"
                            ? "bg-white text-primary shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <UserPlus className="w-4 h-4" />
                        Pending Requests
                        {requests.filter(r => r.status === 'pending').length > 0 && (
                            <span className="badge badge-sm badge-error text-white border-none">
                                {requests.filter(r => r.status === 'pending').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("list")}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === "list"
                            ? "bg-white text-primary shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        All Doctors
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <span className="loading loading-dots loading-lg text-primary"></span>
                </div>
            ) : (
                <>
                    {/* REQUESTS TAB */}
                    {activeTab === "requests" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {requests.filter(r => r.status === 'pending').length === 0 ? (
                                <div className="col-span-full text-center py-16 bg-base-100 rounded-2xl border border-dashed border-base-300">
                                    <div className="flex justify-center mb-4">
                                        <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-8 h-8 text-gray-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">No Pending Requests</h3>
                                    <p className="text-gray-500">All caught up! There are no new doctor applications.</p>
                                </div>
                            ) : (
                                requests.filter(r => r.status === 'pending').map((req) => (
                                    <div key={req._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                    {req.userName?.charAt(0) || "U"}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{req.userName}</h3>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(req.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="badge badge-warning gap-1">
                                                Pending
                                            </span>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-600 truncate">{req.userEmail}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Award className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-900 font-medium">{req.specialization}</span>
                                            </div>
                                            <div className="text-xs bg-gray-50 p-2 rounded-lg text-gray-600">
                                                <span className="font-semibold block mb-1">Qualifications:</span>
                                                {req.qualifications}
                                            </div>
                                            <div className="text-xs bg-gray-50 p-2 rounded-lg text-gray-600">
                                                <span className="font-semibold block mb-1">Experience:</span>
                                                {req.experience} Years
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => handleRequestAction(req._id, 'rejected')}
                                                className="btn btn-outline btn-error btn-sm w-full"
                                            >
                                                <XCircle className="w-4 h-4" /> Reject
                                            </button>
                                            <button
                                                onClick={() => handleRequestAction(req._id, 'approved')}
                                                className="btn btn-primary btn-sm w-full"
                                            >
                                                <CheckCircle className="w-4 h-4" /> Approve
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ALL DOCTORS LIST TAB */}
                    {activeTab === "list" && (
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search doctors by name or email..."
                                    className="input input-bordered w-full pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
                                <table className="table">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th>Name</th>
                                            <th>Contact</th>
                                            <th>Joined Date</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDoctors.length > 0 ? (
                                            filteredDoctors.map((doc) => (
                                                <tr key={doc._id} className="hover:bg-gray-50/50">
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div className="avatar placeholder">
                                                                <div className="bg-neutral-focus text-neutral-content rounded-full w-10">
                                                                    <span className="text-xs">{doc.fullName?.charAt(0)}</span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="font-bold">{doc.fullName}</div>
                                                                <div className="text-xs opacity-50">ID: {doc._id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="text-sm">{doc.email}</div>
                                                    </td>
                                                    <td>
                                                        <div className="text-sm">
                                                            {new Date(doc.registrationDate).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="text-right">
                                                        <button
                                                            onClick={() => handleDemoteDoctor(doc._id)}
                                                            className="btn btn-ghost btn-xs text-error hover:bg-error/10 tooltip tooltip-left"
                                                            data-tip="Remove Doctor Status"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="text-center py-10 text-gray-400">
                                                    No doctors found matching your search.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Doctors;
