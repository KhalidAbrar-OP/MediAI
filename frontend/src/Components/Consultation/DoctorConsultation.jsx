import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import AgoraRTC from "agora-rtc-sdk-ng";
import { io } from "socket.io-client";

const DoctorConsultation = ({ appointmentId, onClose }) => {
    const navigate = useNavigate();
    const [consultationData, setConsultationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [patientJoined, setPatientJoined] = useState(false);

    // Video/Audio states
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [localVideoTrack, setLocalVideoTrack] = useState(null);
    const [localAudioTrack, setLocalAudioTrack] = useState(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState(null);

    // Agora states
    const client = useRef(AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
    const remoteVideoRef = useRef(null);

    // Socket.io states
    const [socket, setSocket] = useState(null);

    // Chat states
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    // Tab state
    const [activeTab, setActiveTab] = useState("chat");

    // Prescription states (simplified format)
    const [medicine, setMedicine] = useState("");
    const [dosage, setDosage] = useState("");
    const [instructions, setInstructions] = useState("");

    // Old prescription state for backward compatibility
    const [prescription, setPrescription] = useState({
        medications: [{ name: "", dosage: "", frequency: "", duration: "" }],
        instructions: "",
        followUp: false,
        followUpDate: ""
    });

    // Patient profile
    const [patientProfile, setPatientProfile] = useState(null);

    const token = localStorage.getItem("authToken");

    useEffect(() => {
        let isSubscribed = true;
        let currentSocket = null;
        let currentVideoTrack = null;
        let currentAudioTrack = null;

        const initializeConsultation = async () => {
            try {
                if (!isSubscribed) return;
                setLoading(true);
                const headers = { Authorization: `Bearer ${token}` };

                // Generate consultation token
                const response = await axios.post(
                    "/consultation/generate-token",
                    { appointmentId },
                    { headers }
                );

                if (!isSubscribed) return;

                if (response.data.mock) {
                    toast.warning("Agora credentials missing. Video/Audio will not work, but Chat will be active.");
                }

                const { agoraAppId, agoraToken, channelName, uid } = response.data;
                setConsultationData(response.data);

                // Fetch patient profile
                await fetchPatientProfile(response.data.appointment);

                if (agoraAppId && agoraToken) {
                    try {
                        // Prevent double join
                        if (client.current.connectionState === "DISCONNECTED") {
                            await client.current.join(agoraAppId, channelName, agoraToken, uid);
                        }

                        if (!isSubscribed) {
                            await client.current.leave();
                            return;
                        }

                        // Create and publish tracks
                        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks().catch(err => {
                            console.error("Media permission error:", err);
                            toast.error("Could not access camera or microphone. Please check permissions.");
                            throw err;
                        });

                        currentAudioTrack = audioTrack;
                        currentVideoTrack = videoTrack;
                        setLocalAudioTrack(audioTrack);
                        setLocalVideoTrack(videoTrack);

                        await client.current.publish([audioTrack, videoTrack]);

                        // Handle remote users
                        client.current.on("user-published", async (user, mediaType) => {
                            await client.current.subscribe(user, mediaType);
                            if (mediaType === "video") {
                                setPatientJoined(true);
                                setRemoteVideoTrack(user.videoTrack);
                            }
                            if (mediaType === "audio") {
                                user.audioTrack.play();
                            }
                        });

                        client.current.on("user-unpublished", (user) => {
                            if (user.uid !== client.current.uid) {
                                setPatientJoined(false);
                                setRemoteVideoTrack(null);
                            }
                        });
                    } catch (agoraErr) {
                        console.error("Agora initialization failed:", agoraErr);
                        if (!agoraErr.message?.includes("already in connecting/connected state")) {
                            toast.error(`Video/Audio failed: ${agoraErr.message || "Unknown error"}. Chat will still work.`);
                        }
                    }
                }

                // Initialize Socket.io
                currentSocket = await initializeSocket(response.data.consultationId);

                // Fetch prescription if available
                await fetchPrescription(response.data.consultationId);

            } catch (error) {
                if (!isSubscribed) return;
                console.error("Error initializing consultation:", error);
                const message = error.response?.data?.message || error.message || "Failed to start consultation";
                toast.error(message);
            } finally {
                if (isSubscribed) setLoading(false);
            }
        };

        initializeConsultation();

        return () => {
            isSubscribed = false;
            if (currentVideoTrack) {
                currentVideoTrack.stop();
                currentVideoTrack.close();
            }
            if (currentAudioTrack) {
                currentAudioTrack.stop();
                currentAudioTrack.close();
            }
            if (client.current) {
                client.current.leave();
            }
            if (currentSocket) {
                currentSocket.disconnect();
            }
        };
    }, [appointmentId]);

    // Play remote video when track and ref are both ready
    useEffect(() => {
        if (!loading && remoteVideoTrack && remoteVideoRef.current) {
            remoteVideoTrack.play(remoteVideoRef.current);
        }
    }, [loading, remoteVideoTrack]);

    const initializeSocket = async (consultationId) => {
        try {
            const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
                auth: { token },
                withCredentials: true
            });

            newSocket.on("connect", () => {
                const userId = JSON.parse(atob(token.split('.')[1])).id;
                newSocket.emit("join-consultation", {
                    consultationId,
                    userId,
                    role: "doctor"
                });
            });

            newSocket.on("receive-message", (data) => {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    text: data.message,
                    sender: data.role === "doctor" ? "doctor" : "patient",
                    timestamp: data.timestamp
                }]);
            });

            newSocket.on("room-status", (data) => {
                const myId = JSON.parse(atob(token.split('.')[1])).id;
                const otherInRoom = data.participants.some(p => p !== myId);
                if (otherInRoom) {
                    setPatientJoined(true);
                }
            });

            newSocket.on("user-joined", (data) => {
                if (data.role === "patient") {
                    setPatientJoined(true);
                    toast.info("Patient has joined the consultation");
                }
            });

            newSocket.on("user-left", (data) => {
                if (data.role === "patient") {
                    setPatientJoined(false);
                    setRemoteVideoTrack(null);
                    toast.warn("Patient has left the consultation");
                }
            });

            setSocket(newSocket);
            return newSocket;
        } catch (error) {
            console.error("Socket error:", error);
            return null;
        }
    };

    const fetchPrescription = async (consultationId) => {
        try {
            if (consultationId) {
                const headers = { Authorization: `Bearer ${token}` };
                const response = await axios.get(
                    `/consultation/${consultationId}/prescription`,
                    { headers }
                );
                setPrescription(response.data);
            }
        } catch (error) {
            console.log("Prescription not available yet");
        }
    };

    const fetchPatientProfile = async (appointment) => {
        try {
            setPatientProfile({
                name: appointment?.patientName || "Patient",
                condition: appointment?.reason || "N/A"
            });
        } catch (error) {
            console.error("Error fetching patient profile:", error);
        }
    };

    const toggleVideo = async () => {
        if (localVideoTrack) {
            await localVideoTrack.setEnabled(!isVideoEnabled);
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const toggleAudio = async () => {
        if (localAudioTrack) {
            await localAudioTrack.setEnabled(!isAudioEnabled);
            setIsAudioEnabled(!isAudioEnabled);
        }
    };

    const toggleScreenShare = async () => {
        try {
            if (!isScreenSharing) {
                const screenTrack = await AgoraRTC.createScreenVideoTrack();
                await client.current.unpublish(localVideoTrack);
                await client.current.publish(screenTrack);
                setIsScreenSharing(true);
                setLocalVideoTrack(screenTrack);
            } else {
                const videoTrack = await AgoraRTC.createCameraVideoTrack();
                await client.current.unpublish(localVideoTrack);
                await client.current.publish(videoTrack);
                setIsScreenSharing(false);
                setLocalVideoTrack(videoTrack);
            }
        } catch (error) {
            console.error("Error sharing screen:", error);
            toast.error("Could not share screen");
        }
    };

    const sendMessage = () => {
        if (newMessage.trim() && socket && consultationData) {
            const userId = JSON.parse(atob(token.split('.')[1])).id;
            const messageData = {
                consultationId: consultationData.consultationId,
                userId,
                role: "doctor",
                message: newMessage,
                timestamp: new Date().toISOString()
            };

            // Optimistic UI update: Add message locally immediately
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: newMessage,
                sender: "doctor", // Self is always "doctor" in this component
                timestamp: messageData.timestamp
            }]);

            socket.emit("send-message", messageData);
            setNewMessage("");
        }
    };

    const addMedication = () => {
        setPrescription({
            ...prescription,
            medications: [...prescription.medications, { name: "", dosage: "", frequency: "", duration: "" }]
        });
    };

    const updateMedication = (index, field, value) => {
        const updated = [...prescription.medications];
        updated[index][field] = value;
        setPrescription({ ...prescription, medications: updated });
    };

    const savePrescription = async () => {
        if (!medicine || !dosage) {
            toast.warning("Medicine and dosage are required");
            return;
        }

        try {
            const headers = { Authorization: `Bearer ${token}` };
            await axios.post(
                `/doctor/appointments/${appointmentId}/prescription`,
                { medicine, dosage, instructions },
                { headers }
            );
            toast.success("Prescription saved successfully");
            setMedicine("");
            setDosage("");
            setInstructions("");
        } catch (error) {
            console.error("Error saving prescription:", error);
            toast.error("Failed to save prescription");
        }
    };

    const endConsultation = async (outcome) => {
        try {
            console.log("Ending consultation...", consultationData);

            // Stop local tracks
            if (localVideoTrack) {
                localVideoTrack.stop();
                localVideoTrack.close();
            }
            if (localAudioTrack) {
                localAudioTrack.stop();
                localAudioTrack.close();
            }

            // Leave Agora channel
            if (client.current) {
                await client.current.leave();
            }

            // Disconnect socket
            if (socket) {
                socket.disconnect();
            }

            const headers = { Authorization: `Bearer ${token}` };
            // Optional: Call backend to update status if consultationData exists
            if (consultationData?.consultationId) {
                console.log("Sending end request for ID:", consultationData.consultationId);
                await axios.post(
                    `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/consultation/${consultationData.consultationId}/end`,
                    { outcome },
                    { headers }
                );
                console.log("End request successful");
            } else {
                console.warn("No consultationId found in consultationData:", consultationData);
            }

            toast.info("Consultation ended");
            onClose();
        } catch (error) {
            console.error("Error ending consultation:", error);
            // Show more specific error
            const msg = error.response?.data?.message || "Failed to end call properly";
            toast.error(msg);
            onClose(); // Close anyway
        }
    };



    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 text-center text-black">
                    <div className="loading loading-spinner loading-lg text-primary"></div>
                    <p className="mt-4">Initializing consultation...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold">Consultation with {patientProfile?.name || "Patient"}</h2>
                        <p className="text-sm text-gray-400">{consultationData?.appointment?.reason}</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-700">
                        <div className={`w-2 h-2 rounded-full ${patientJoined ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}></div>
                        <span className="text-xs font-medium">
                            {patientJoined ? "Patient Connected" : "Patient Offline"}
                        </span>
                    </div>
                </div>
                <button onClick={onClose} className="btn btn-sm btn-ghost">Close</button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Video Area */}
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 bg-black relative overflow-hidden">
                        {/* Remote Video (Patient) */}
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain bg-gray-900"
                        />

                        {/* Overlaid Controls */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-gray-900/60 backdrop-blur-md rounded-full border border-gray-700 shadow-2xl transition-all hover:bg-gray-900/80 z-10 opacity-80 hover:opacity-100">
                            <button
                                onClick={toggleVideo}
                                className={`btn btn-circle btn-sm md:btn-md ${isVideoEnabled ? "btn-primary" : "btn-error"}`}
                                title={isVideoEnabled ? "Turn Camera Off" : "Turn Camera On"}
                            >
                                {isVideoEnabled ? "📹" : "📹❌"}
                            </button>
                            <button
                                onClick={toggleAudio}
                                className={`btn btn-circle btn-sm md:btn-md ${isAudioEnabled ? "btn-primary" : "btn-error"}`}
                                title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                            >
                                {isAudioEnabled ? "🎤" : "🎤❌"}
                            </button>
                            <button
                                onClick={toggleScreenShare}
                                className={`btn btn-circle btn-sm md:btn-md ${isScreenSharing ? "btn-primary" : "btn-outline border-white text-white"}`}
                                title="Share Screen"
                            >
                                🖥️
                            </button>
                            <div className="w-px h-6 bg-gray-700 mx-2"></div>
                            <button
                                onClick={() => endConsultation("Completed")}
                                className="btn btn-circle btn-sm md:btn-md btn-error"
                                title="End Call"
                            >
                                📞
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-96 bg-white flex flex-col border-l">
                    {/* Tabs */}
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab("chat")}
                            className={`flex-1 p-2 font-semibold ${activeTab === "chat" ? "border-b-2 border-primary text-primary" : "text-gray-600"}`}
                        >
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab("prescription")}
                            className={`flex-1 p-2 font-semibold ${activeTab === "prescription" ? "border-b-2 border-primary text-primary" : "text-gray-600"}`}
                        >
                            Prescription
                        </button>
                    </div>

                    {/* Chat Panel */}
                    {activeTab === "chat" && (
                        <div className="flex-1 flex flex-col overflow-hidden text-black">
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`p-2 rounded ${msg.sender === "doctor" ? "bg-primary text-white ml-auto" : "bg-gray-200"
                                            }`}
                                        style={{ maxWidth: "80%" }}
                                    >
                                        {msg.text}
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                                    placeholder="Type a message..."
                                    className="input input-bordered flex-1"
                                />
                                <button onClick={sendMessage} className="btn btn-primary">
                                    Send
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Prescription Panel */}
                    {activeTab === "prescription" && (
                        <div className="flex-1 flex flex-col overflow-hidden text-black p-6">
                            <h3 className="text-lg font-bold mb-4">Add Prescription</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Prescribing for <span className="font-semibold text-gray-800">
                                    {patientProfile?.name || "Patient"}
                                </span>
                            </p>

                            <div className="space-y-4 flex-1 overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Medicine Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={medicine}
                                        onChange={(e) => setMedicine(e.target.value)}
                                        placeholder="e.g., Amoxicillin"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Dosage <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={dosage}
                                        onChange={(e) => setDosage(e.target.value)}
                                        placeholder="e.g., 500mg twice daily for 7 days"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Instructions
                                    </label>
                                    <textarea
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        placeholder="e.g., Take with food"
                                        rows={3}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t mt-4">
                                <button
                                    onClick={savePrescription}
                                    className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-focus font-medium transition-colors shadow-lg shadow-primary/20"
                                >
                                    Save Prescription
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorConsultation;
