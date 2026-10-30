import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../Auth/AuthProvider.jsx";
import * as jwt_decode from "jwt-decode";
import defaultProfilePic from "../../assets/default-url.jpg";
import { Stethoscope, Award, FileText, DollarSign, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';

const UserSettings = () => {
    const { user } = useContext(AuthContext);
    const { profileId } = useParams();
    const [isEditing, setIsEditing] = useState(false);
    const [isOwner, setIsOwner] = useState(true);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showRemovePicConfirm, setShowRemovePicConfirm] = useState(false);
    const [role, setRole] = useState("user");
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- Profile Info ---
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        dob: "",
        gender: "",
        photoURL: "",
        address: "",

        bio: "",
        consultationFee: ""
    });

    // Store original form data to restore on cancel
    const [originalFormData, setOriginalFormData] = useState({
        name: "",
        email: "",
        phone: "",
        dob: "",
        gender: "",
        photoURL: "",
        specialization: "",
        qualifications: "",
        experience: "",
        bio: "",
        consultationFee: "",
        address: ""
    });

    // --- Profile Picture Upload ---
    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState("");
    const [originalProfilePicturePreview, setOriginalProfilePicturePreview] = useState("");

    // ---Password Change ---
    const [passData, setPassData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
    });
    const [prescriptions, setPrescriptions] = useState([]);
    const [fetchingPrescriptions, setFetchingPrescriptions] = useState(false);

    // --- Doctor Request ---
    const [doctorRequest, setDoctorRequest] = useState(null);
    const [requestLoading, setRequestLoading] = useState(true);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestData, setRequestData] = useState({
        specialization: "",
        qualifications: "",
        experience: "",
        bio: "",
        consultationFee: ""
    });

    // --- Schedules / Availability ---
    const [schedules, setSchedules] = useState([]);
    const [schedulesLoading, setSchedulesLoading] = useState(false);

    // Get current user ID from token
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (token) {
            try {
                const decoded = jwt_decode.default(token);
                const extractedUserId = decoded.userId || decoded.id;
                setUserId(extractedUserId);
                setRole(decoded.userRole || "patient");
            } catch (err) {
                console.error("Error decoding token", err);
            }
        } else {
            console.error("No auth token found in localStorage");
        }
    }, []);

    // 1. Fetch User Data
    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem("authToken");
            if (!token) {
                console.error("No auth token found");
                setLoading(false);
                return;
            }

            try {
                let response;

                // If viewing a specific profileId (guest view), fetch that user
                const targetId = profileId || userId;
                if (!targetId) {
                    throw new Error("No user id available to fetch profile");
                }

                // Prefer the merged profile endpoints which combine user + userinfo/doctorinfo
                // If viewing another user's profile (profileId present) call the profile-by-id endpoint
                // Otherwise fetch the current user's profile
                try {
                    if (profileId) {
                        response = await axios.get(`/api/user/profile/${targetId}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                    } else {
                        response = await axios.get(`/users/profile`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                    }
                } catch (profileError) {
                    // As a last resort, try the older user-by-id endpoint for compatibility
                    try {
                        response = await axios.get(`/api/user/${targetId}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                    } catch (err) {
                        // keep original error for outer catch
                        throw profileError;
                    }
                }

                const userData = response.data;

                // Determine ownership
                if (userData?._id && userId) {
                    const owner = userData._id.toString() === userId.toString();
                    setIsOwner(owner);
                    if (!owner) {
                        setIsEditing(false);
                    }
                }

                if (userData._id && !userId) {
                    setUserId(userData._id);
                }

                const initialFormData = {
                    name: userData.fullName || userData.name || "",
                    email: userData.email || user?.email || "",
                    phone: userData.phone || userData.phoneNumber || "",
                    dob: userData.dob || "",
                    gender: userData.gender || "",
                    photoURL: userData.photoURL || "",
                    specialization: userData.specialization || "",
                    qualifications: userData.qualifications || "",
                    experience: userData.experience || "",
                    bio: userData.bio || "",
                    consultationFee: userData.consultationFee || "",
                    address: userData.address || ""
                };

                // Update role from user data
                if (userData.userRole) {
                    const userRole = userData.userRole.toLowerCase();
                    setRole(userRole === 'doctor' ? 'doctor' : 'patient');
                }

                console.log("Initial form data:", initialFormData);
                console.log("Role from backend:", userData.userRole);
                console.log("Role state will be set to:", userData.userRole ? (userData.userRole.toLowerCase() === 'doctor' ? 'doctor' : 'patient') : role);
                setFormData(initialFormData);
                setOriginalFormData(initialFormData);

                if (userData.photoURL && userData.photoURL !== "default-url") {
                    setProfilePicturePreview(userData.photoURL);
                    setOriginalProfilePicturePreview(userData.photoURL);
                } else {
                    // Set default profile picture if no photo is set
                    setProfilePicturePreview(defaultProfilePic);
                    setOriginalProfilePicturePreview(defaultProfilePic);
                }

                setLoading(false);
            } catch (error) {
                console.error("Error fetching user data:", error);
                console.error("Error response:", error.response?.data);
                if (user) {
                    const fallbackData = {
                        ...formData,
                        email: user.email || "",
                        name: user.fullName || "",
                    };
                    setFormData(fallbackData);
                    setOriginalFormData(fallbackData);
                }
                setLoading(false);
            }
        };

        fetchUserData();
    }, [profileId, userId]);

    // Fetch Prescriptions for patient
    useEffect(() => {
        const fetchPrescriptions = async () => {
            if (role === 'doctor' || !userId) return;

            setFetchingPrescriptions(true);
            try {
                const token = localStorage.getItem("authToken");
                const response = await axios.get("/api/patient/prescriptions", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPrescriptions(response.data);
            } catch (error) {
                console.error("Error fetching prescriptions:", error);
                // silent fail for non-critical section
            } finally {
                setFetchingPrescriptions(false);
            }
        };

        if (role !== 'doctor' && userId) {
            fetchPrescriptions();
        }
    }, [role, userId]);

    // Fetch schedules for logged-in doctor (reusable)
    const fetchSchedules = async () => {
        if (role !== 'doctor' || !userId) return;
        setSchedulesLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await axios.get('/doctor/schedule', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // res.data is expected to be an array of schedule objects { date: 'YYYY-MM-DD', start, end, duration }
            if (Array.isArray(res.data)) {
                setSchedules(res.data);
            } else {
                setSchedules([]);
            }
        } catch (err) {
            console.error('Failed to fetch schedules', err);
            setSchedules([]);
        } finally {
            setSchedulesLoading(false);
        }
    };

    // Auto-refresh schedules: initial load, polling, and event listeners
    useEffect(() => {
        if (role !== 'doctor' || !userId) return;

        // initial load
        fetchSchedules();

        // Polling interval (30s)
        const interval = setInterval(() => {
            fetchSchedules();
        }, 30000);

        // storage event (cross-tab) handler
        const onStorage = (e) => {
            if (e.key === 'schedulesUpdated') {
                fetchSchedules();
            }
        };

        // same-window event
        const onSchedulesUpdated = () => fetchSchedules();

        window.addEventListener('storage', onStorage);
        window.addEventListener('schedulesUpdated', onSchedulesUpdated);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('schedulesUpdated', onSchedulesUpdated);
        };
    }, [role, userId]);

    // Check for existing Doctor Request
    useEffect(() => {
        const checkDoctorRequest = async () => {
            if (role === 'doctor' || !userId) {
                setRequestLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem("authToken");
                const response = await axios.get("/api/user/doctor-request-status", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDoctorRequest(response.data.request);
            } catch (error) {
                console.error("Error fetching doctor request status:", error);
            } finally {
                setRequestLoading(false);
            }
        };

        if (userId) {
            checkDoctorRequest();
        }
    }, [userId, role]);

    const handleRequestSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (!requestData.specialization || !requestData.qualifications || !requestData.experience || !requestData.consultationFee) {
            toast.error("Please fill in all required fields.");
            return;
        }

        try {
            const token = localStorage.getItem("authToken");
            await axios.post("/api/user/request-doctor", requestData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Request submitted successfully!");
            setDoctorRequest({
                ...requestData,
                status: 'pending',
                createdAt: new Date()
            });
            setShowRequestForm(false);
        } catch (error) {
            console.error("Error submitting request:", error);
            toast.error(error.response?.data?.message || "Failed to submit request");
        }
    };

    const handleDownloadPrescription = async (appointmentId) => {
        try {
            const token = localStorage.getItem("authToken");
            const response = await axios.get(
                `/patient/appointments/${appointmentId}/prescription/download`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob',
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Prescription_${appointmentId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Download failed:", error);
            toast.error("Failed to download prescription");
        }
    };

    //profile picture file selection
    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicture(file);
            setFormData({ ...formData, photoURL: "" });
            // preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicturePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle URL input change
    const handlePhotoURLChange = (e) => {
        const url = e.target.value;
        setFormData({ ...formData, photoURL: url });
        // Clear file selection when URL is entered
        if (url) {
            setProfilePicture(null);
            setProfilePicturePreview(url);
        } else {
            setProfilePicturePreview(originalProfilePicturePreview);
        }
    };

    // Ref for file input
    const fileInputRef = useRef(null);

    // cancel confirmation
    const handleCancelConfirm = () => {
        // Restore original data
        setFormData(originalFormData);
        setProfilePicture(null);
        setProfilePicturePreview(originalProfilePicturePreview);
        setIsEditing(false);
        setShowCancelConfirm(false);
    };

    // save from modal
    const handleSaveFromModal = async (e) => {
        e?.preventDefault();
        setShowCancelConfirm(false);
        const syntheticEvent = {
            preventDefault: () => { }
        };
        await handleProfileUpdate(syntheticEvent);
    };

    // Handle remove profile picture
    const handleRemoveProfilePicture = async () => {
        if (!userId || !isOwner) {
            return;
        }

        const token = localStorage.getItem("authToken");
        if (!token) {
            toast.error("Authentication token not found. Please log in again.");
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('photoURL', 'default-url');

            // Also send other current form data to maintain them
            formDataToSend.append('fullName', formData.name || "");
            formDataToSend.append('phone', formData.phone || "");
            formDataToSend.append('dob', formData.dob || "");
            formDataToSend.append('gender', formData.gender || "");
            formDataToSend.append('address', formData.address || "");

            if (role === 'doctor') {
                formDataToSend.append('specialization', formData.specialization || "");
                formDataToSend.append('qualifications', formData.qualifications || "");
                formDataToSend.append('experience', formData.experience || "");
                formDataToSend.append('bio', formData.bio || "");
                formDataToSend.append('consultationFee', formData.consultationFee || "0");
            }

            const response = await axios.put(`/api/user/profile/${userId}`, formDataToSend, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            toast.success("Profile picture removed successfully.");

            // Update state to show default image
            setProfilePicturePreview(defaultProfilePic);
            setOriginalProfilePicturePreview(defaultProfilePic);
            setFormData({ ...formData, photoURL: "default-url" });
            setOriginalFormData({ ...formData, photoURL: "default-url" });
            setProfilePicture(null);
            setShowRemovePicConfirm(false);
        } catch (error) {
            console.error("Error removing profile picture:", error);
            toast.error(error.response?.data?.message || "Error removing profile picture.");
        }
    };

    // 2. Handle Profile Update
    const handleProfileUpdate = async (e) => {
        e.preventDefault();

        if (!isEditing || !isOwner) {
            return;
        }

        // Check if userId exists
        if (!userId) {
            toast.error("User ID not found. Please refresh the page.");
            return;
        }

        // Check if token exists
        const token = localStorage.getItem("authToken");
        if (!token) {
            toast.error("Authentication token not found. Please log in again.");
            return;
        }

        try {
            const formDataToSend = new FormData();

            // Add text fields
            formDataToSend.append('fullName', formData.name || "");
            formDataToSend.append('phone', formData.phone || "");
            formDataToSend.append('dob', formData.dob || "");
            formDataToSend.append('gender', formData.gender || "");
            formDataToSend.append('address', formData.address || "");

            // Add doctor-specific fields if role is doctor
            if (role === 'doctor') {
                formDataToSend.append('specialization', formData.specialization || "");
                formDataToSend.append('qualifications', formData.qualifications || "");
                formDataToSend.append('experience', formData.experience || "");
                formDataToSend.append('bio', formData.bio || "");
                formDataToSend.append('consultationFee', formData.consultationFee || "0");
            }

            // Add profile picture if selected
            if (profilePicture) {
                formDataToSend.append('profilePicture', profilePicture);
            } else if (formData.photoURL) {
                formDataToSend.append('photoURL', formData.photoURL);
            }

            console.log("Sending update request with token:", token ? "Token present" : "No token");
            console.log("User ID:", userId);

            const response = await axios.put(`/api/user/profile/${userId}`, formDataToSend, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            toast.success("Profile updated successfully.");

            // Update form data with response from server
            if (response.data && response.data.user) {
                const updatedUserData = response.data.user;
                const updatedFormData = {
                    name: updatedUserData.fullName || updatedUserData.name || "",
                    email: updatedUserData.email || formData.email || "",
                    phone: updatedUserData.phone || updatedUserData.phoneNumber || "",
                    dob: updatedUserData.dob || "",
                    gender: updatedUserData.gender || "",
                    photoURL: updatedUserData.photoURL || "",
                    specialization: updatedUserData.specialization || "",
                    qualifications: updatedUserData.qualifications || "",
                    experience: updatedUserData.experience || "",
                    bio: updatedUserData.bio || "",
                    consultationFee: updatedUserData.consultationFee || "",
                    address: updatedUserData.address || ""
                };

                setFormData(updatedFormData);
                setOriginalFormData(updatedFormData);

                if (updatedUserData.photoURL && updatedUserData.photoURL !== "default-url") {
                    setProfilePicturePreview(updatedUserData.photoURL);
                    setOriginalProfilePicturePreview(updatedUserData.photoURL);
                } else {
                    // Set default profile picture if no photo is set
                    setProfilePicturePreview(defaultProfilePic);
                    setOriginalProfilePicturePreview(defaultProfilePic);
                }
            }

            setIsEditing(false);
            setProfilePicture(null);
        } catch (error) {
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else if (error.message?.includes('profile picture') || error.message?.includes('upload')) {
                toast.error("Error uploading profile picture.");
            } else {
                toast.error("Error updating profile.");
            }
        }
    };

    // 3. Handle Password Change
    const handlePasswordChange = async (e) => {
        e.preventDefault();

        // Frontend Validation: Check if new passwords match 
        if (passData.newPassword !== passData.confirmNewPassword) {
            toast.error("New passwords do not match.");
            return;
        }

        // Additional validation
        if (passData.newPassword.length < 6) {
            toast.error("New password must be at least 6 characters long.");
            return;
        }

        try {
            const token = localStorage.getItem("authToken");
            const res = await axios.put(`/api/user/change-password/${userId}`, {
                currentPassword: passData.currentPassword,
                newPassword: passData.newPassword
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.data.success) {
                toast.success("Password updated successfully");
                setPassData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
                setShowPasswordForm(false);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Current password doesn't match.";
            toast.error(errorMessage);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-8 mt-10">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8">
                    <div className="flex flex-col justify-center items-center h-64">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                        <p className="mt-4 text-gray-500">Loading your profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Group schedules by weekday name for display
    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const schedulesByWeekday = {};
    if (Array.isArray(schedules) && schedules.length > 0) {
        schedules.forEach((s) => {
            try {
                const d = new Date(s.date);
                const name = weekdays[d.getDay()];
                if (!schedulesByWeekday[name]) schedulesByWeekday[name] = [];
                schedulesByWeekday[name].push(s);
            } catch (err) {
                // ignore malformed dates
            }
        });
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 mt-6 md:mt-10 mb-10">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Profile Info */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Main Profile Card */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Profile Picture */}
                            <div className="flex-shrink-0">
                                <div className="avatar">
                                    <div className="w-32 h-32 rounded-full ring-4 ring-primary/20 ring-offset-2 ring-offset-white">
                                        {profilePicturePreview ? (
                                            <img src={profilePicturePreview} alt="Profile" className="rounded-full object-cover w-full h-full" />
                                        ) : formData.photoURL && formData.photoURL !== "default-url" ? (
                                            <img src={formData.photoURL} alt="profile" className="rounded-full object-cover w-full h-full" />
                                        ) : (
                                            <img src={defaultProfilePic} alt="Default Profile" className="rounded-full object-cover w-full h-full" />
                                        )}
                                    </div>
                                </div>
                                {isEditing && (
                                    <div className="mt-4 space-y-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleProfilePictureChange}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-primary w-full"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            Change Photo
                                        </button>
                                        {profilePicture && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-ghost w-full"
                                                onClick={() => {
                                                    setProfilePicture(null);
                                                    setProfilePicturePreview(originalProfilePicturePreview);
                                                    if (fileInputRef.current) {
                                                        fileInputRef.current.value = '';
                                                    }
                                                }}
                                            >
                                                Clear New Photo
                                            </button>
                                        )}
                                        {(profilePicturePreview && profilePicturePreview !== defaultProfilePic && !profilePicture) && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-error w-full"
                                                onClick={() => setShowRemovePicConfirm(true)}
                                            >
                                                Remove Profile Picture
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Profile Info */}
                            <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div className="flex-1">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="input input-bordered w-full text-2xl font-bold mb-2"
                                                value={formData.name || ""}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Full Name"
                                            />
                                        ) : (
                                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                                {formData.name}
                                            </h2>
                                        )}

                                        {role === 'doctor' && (
                                            <div className="mb-3">
                                                <div className="text-sm text-gray-600">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            className="input input-bordered input-sm w-full max-w-xs"
                                                            value={formData.specialization || ""}
                                                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                                            placeholder="Specialization"
                                                        />
                                                    ) : (
                                                        formData.specialization && (
                                                            <span className="badge badge-secondary badge-lg px-3 py-2">
                                                                {formData.specialization}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                    <span>4.8 (124 reviews)</span>
                                                </div>
                                            </div>
                                        )}

                                        {role === 'doctor' && (
                                            <div className="text-sm text-gray-600">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        className="input input-bordered input-sm w-32"
                                                        value={formData.experience || ""}
                                                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                                        placeholder="Years"
                                                    />
                                                ) : (
                                                    <span>{formData.experience || "0"} years experience</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Edit Profile Button */}
                                    {isOwner && (
                                        <div className="flex gap-2">
                                            {!isEditing ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-success text-white"
                                                    onClick={() => setIsEditing(true)}
                                                >
                                                    Edit Profile
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost"
                                                        onClick={() => {
                                                            setShowCancelConfirm(true);
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleProfileUpdate(e);
                                                        }}
                                                    >
                                                        Save Changes
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Biography Section (Doctor Only) */}
                    {role === 'doctor' && (
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Biography</h3>
                            {isEditing ? (
                                <textarea
                                    className="textarea textarea-bordered w-full h-32 text-gray-800"
                                    placeholder="Tell us about your professional background..."
                                    value={formData.bio || ""}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                ></textarea>
                            ) : (
                                <p className="text-gray-700 leading-relaxed">
                                    {formData.bio || "No biography available."}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Qualifications Section (Doctor Only) */}
                    {role === 'doctor' && (
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v9M12 14l-9-5M12 14l9-5M12 5v9" />
                                </svg>
                                Qualifications
                            </h3>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="input input-bordered w-full text-gray-800"
                                    placeholder="e.g., MBBS, MD, PhD"
                                    value={formData.qualifications || ""}
                                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                                />
                            ) : (
                                <ul className="list-disc list-inside text-gray-700 space-y-2">
                                    {formData.qualifications ? (
                                        formData.qualifications.split(',').map((qual, idx) => (
                                            <li key={idx}>{qual.trim()}</li>
                                        ))
                                    ) : (
                                        <li>No qualifications listed</li>
                                    )}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Availability Section (Doctor Only) */}
                    {role === 'doctor' && (
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Availability
                            </h3>
                            <div className="space-y-3">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                                    const slots = schedulesByWeekday[day] || [];
                                    return (
                                        <div key={day} className="flex items-center justify-between">
                                            <span className="font-medium text-gray-700">{day}</span>
                                            <div className="flex gap-2">
                                                {schedulesLoading ? (
                                                    <span className="loading loading-spinner loading-sm text-primary"></span>
                                                ) : slots.length > 0 ? (
                                                    slots.slice(0, 3).map((slot) => (
                                                        <span key={slot._id} className="badge badge-primary badge-outline">{slot.start} - {slot.end}</span>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-gray-400">No availability</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Contact Information */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm sticky top-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Contact Information</h3>
                        <form onSubmit={handleProfileUpdate} className="space-y-5">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold text-gray-700">Email</span>
                                </label>
                                <input
                                    type="email"
                                    className="input input-bordered w-full bg-gray-50 text-gray-800"
                                    value={formData.email || user?.email || ""}
                                    disabled
                                    readOnly
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold text-gray-700">Phone</span>
                                </label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        className="input input-bordered w-full text-gray-800"
                                        placeholder="+1 (555) 888-88888"
                                        value={formData.phone || ""}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-gray-800 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        {formData.phone || "N/A"}
                                    </p>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold text-gray-700">Date of Birth</span>
                                </label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        className="input input-bordered w-full text-gray-800"
                                        value={formData.dob ? formData.dob.split('T')[0] : ''}
                                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-gray-800 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        {formData.dob ? new Date(formData.dob).toLocaleDateString() : "N/A"}
                                    </p>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold text-gray-700">Gender</span>
                                </label>
                                {isEditing ? (
                                    <select
                                        className="select select-bordered w-full text-gray-800"
                                        value={formData.gender || ""}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                ) : (
                                    <p className="text-gray-800 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        {formData.gender || "N/A"}
                                    </p>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold text-gray-700">Address</span>
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="input input-bordered w-full text-gray-800"
                                        placeholder="Enter Your Address"
                                        value={formData.address || ""}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-gray-800 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        {formData.address || "N/A"}
                                    </p>
                                )}
                            </div>

                            {/* Doctor-specific fields in contact section */}
                            {role === 'doctor' && (
                                <>
                                    {isEditing ? (
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-semibold text-gray-700">Consultation Fee (৳)</span>
                                            </label>
                                            <input
                                                type="number"
                                                className="input input-bordered w-full text-gray-800"
                                                placeholder="500"
                                                value={formData.consultationFee || ""}
                                                onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                                            />
                                        </div>
                                    ) : (
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-semibold text-gray-700">Consultation Fee (৳)</span>
                                            </label>
                                            <p className="text-gray-800 p-3 bg-gray-50 rounded-lg border border-gray-200">{formData.consultationFee ? formData.consultationFee : "N/A"}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </form>
                    </div>
                </div>
            </div>

            {/* Patient-only sections: Prescriptions & Consultations */}
            {role !== 'doctor' && (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Suggested Prescriptions</h3>
                            <span className="badge badge-primary">{prescriptions.length}</span>
                        </div>

                        {fetchingPrescriptions ? (
                            <div className="flex justify-center p-4">
                                <span className="loading loading-spinner text-primary"></span>
                            </div>
                        ) : prescriptions.length > 0 ? (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {prescriptions.map((p) => (
                                    <div key={p.appointmentId} className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-between group hover:bg-blue-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">Dr. {p.doctorName}</p>
                                                <p className="text-xs text-gray-500">{new Date(p.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDownloadPrescription(p.appointmentId)}
                                            className="btn btn-circle btn-ghost text-blue-600 hover:bg-blue-200"
                                            title="Download PDF"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-gray-300 mb-2 flex justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <p className="text-gray-400">No prescriptions yet</p>
                            </div>
                        )}
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">Need Assistance?</h3>
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-5 text-white">
                            <p className="font-medium mb-3">Questions about your prescriptions?</p>
                            <p className="text-sm opacity-90 mb-4">Contact our support or consult with your doctor for clarifications.</p>
                            <button className="btn btn-sm btn-outline text-white hover:bg-white hover:text-blue-600 border-white">
                                Contact Support
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Change Password Section */}
            <div className="mt-6 bg-red-50 rounded-xl p-6 border-2 border-red-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b-2 border-red-200">
                    <div>
                        <h3 className="text-2xl font-bold text-red-600 mb-1">Change Password</h3>
                        <p className="text-sm text-red-500/70">Update your account password for better security</p>
                    </div>
                    {!showPasswordForm ? (
                        <button
                            type="button"
                            className="btn btn-sm md:btn-md btn-error mt-3 sm:mt-0 shadow-md hover:shadow-lg transition-all"
                            onClick={() => setShowPasswordForm(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Change Password
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-sm md:btn-md btn-ghost btn-error mt-3 sm:mt-0"
                            onClick={() => {
                                setShowPasswordForm(false);
                                setPassData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                        </button>
                    )}
                </div>

                {showPasswordForm && (
                    <form onSubmit={handlePasswordChange} className="max-w-md space-y-5 bg-white rounded-lg p-5 border border-red-200">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold text-gray-700">Current Password</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your current password"
                                className="input input-bordered w-full bg-white text-gray-800 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                                value={passData.currentPassword}
                                onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold text-gray-700">New Password</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your new password"
                                className="input input-bordered w-full bg-white text-gray-800 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                                value={passData.newPassword}
                                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                            />
                            <label className="label">
                                <span className="label-text-alt text-gray-400">Must be at least 6 characters</span>
                            </label>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold text-gray-700">Confirm New Password</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Confirm your new password"
                                className="input input-bordered w-full bg-white text-gray-800 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                                value={passData.confirmNewPassword}
                                onChange={(e) => setPassData({ ...passData, confirmNewPassword: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="submit" className="btn btn-error flex-1 shadow-md hover:shadow-lg transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Update Password
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm md:btn-md btn-ghost btn-error mt-3 sm:mt-0"
                                onClick={() => {
                                    setShowPasswordForm(false);
                                    setPassData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>




            {/* Request to be Doctor Section */}
            {role !== 'doctor' && !loading && !requestLoading && (
                <div className="mt-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border-2 border-indigo-100 shadow-sm relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-200 rounded-full opacity-20 blur-3xl pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
                                    <Stethoscope className="w-6 h-6 text-indigo-600" />
                                    Join as a Doctor
                                </h3>
                                <p className="text-indigo-600/80 mt-1">
                                    Are you a qualified medical professional? Apply to join our platform.
                                </p>
                            </div>

                            {doctorRequest && doctorRequest.status === 'pending' ? (
                                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-medium flex items-center gap-2 border border-yellow-200 shadow-sm">
                                    <Clock className="w-4 h-4" />
                                    Application Pending Review
                                </div>
                            ) : doctorRequest && doctorRequest.status === 'rejected' ? (
                                <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-medium flex items-center gap-2 border border-red-200 shadow-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    Application Rejected
                                </div>
                            ) : !showRequestForm ? (
                                <button
                                    onClick={() => setShowRequestForm(true)}
                                    className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 border-none shadow-md hover:shadow-lg transition-all"
                                >
                                    Apply Now
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowRequestForm(false)}
                                    className="btn btn-ghost text-indigo-700 hover:bg-indigo-100"
                                >
                                    Cancel Application
                                </button>
                            )}
                        </div>

                        {showRequestForm && !doctorRequest && (
                            <form onSubmit={handleRequestSubmit} className="bg-white rounded-xl p-6 shadow-md border border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold text-gray-700 flex items-center gap-2">
                                                <Award className="w-4 h-4 text-indigo-500" /> Specialization
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 w-full"
                                            placeholder="e.g. Cardiology, Pediatrics"
                                            value={requestData.specialization}
                                            onChange={(e) => setRequestData({ ...requestData, specialization: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold text-gray-700 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-indigo-500" /> Qualifications
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 w-full"
                                            placeholder="e.g. MBBS, FCPS"
                                            value={requestData.qualifications}
                                            onChange={(e) => setRequestData({ ...requestData, qualifications: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold text-gray-700 flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-indigo-500" /> Experience (Years)
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            className="input input-bordered focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 w-full"
                                            placeholder="e.g. 5"
                                            value={requestData.experience}
                                            onChange={(e) => setRequestData({ ...requestData, experience: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold text-gray-700 flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-indigo-500" /> Consultation Fee (৳)
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            className="input input-bordered focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 w-full"
                                            placeholder="e.g. 500"
                                            value={requestData.consultationFee}
                                            onChange={(e) => setRequestData({ ...requestData, consultationFee: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-control md:col-span-2">
                                        <label className="label">
                                            <span className="label-text font-semibold text-gray-700">Professional Bio</span>
                                        </label>
                                        <textarea
                                            className="textarea textarea-bordered focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 w-full h-24"
                                            placeholder="Tell us about yourself..."
                                            value={requestData.bio}
                                            onChange={(e) => setRequestData({ ...requestData, bio: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button type="submit" className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 border-none gap-2 px-8">
                                        <Send className="w-4 h-4" /> Submit Request
                                    </button>
                                </div>
                            </form>
                        )}

                        {doctorRequest && (doctorRequest.status === 'pending' || doctorRequest.status === 'rejected') && (
                            <div className="mt-4 bg-white/60 rounded-lg p-4 border border-indigo-50 text-sm text-indigo-800">
                                <p className="font-semibold mb-1">Your Application Details:</p>
                                <p><span className="font-medium">Specialization:</span> {doctorRequest.specialization}</p>
                                <p><span className="font-medium">Applied on:</span> {new Date(doctorRequest.createdAt).toLocaleDateString()}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Do you want to exit?</h3>
                        <p className="py-4 text-gray-600">
                            You have unsaved changes. Do you want to save your changes before exiting?
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => setShowCancelConfirm(false)}
                            >
                                Go Back
                            </button>
                            <button
                                className="btn btn-error bg-red-500 hover:bg-red-600 text-white border-none"
                                onClick={handleCancelConfirm}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveFromModal}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowCancelConfirm(false)}></div>
                </div>
            )}

            {/* Remove Profile Picture Confirmation Modal */}
            {showRemovePicConfirm && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Remove Profile Picture?</h3>
                        <p className="py-4 text-gray-600">
                            Are you sure you want to remove your profile picture?
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => setShowRemovePicConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-error bg-red-500 hover:bg-red-600 text-white border-none"
                                onClick={handleRemoveProfilePicture}
                            >
                                Remove Picture
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowRemovePicConfirm(false)}></div>
                </div>
            )}
        </div>
    );
};

export default UserSettings;
