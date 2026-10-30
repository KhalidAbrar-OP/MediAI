import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AgoraRTC from "agora-rtc-sdk-ng";
import { io } from "socket.io-client";

const PatientConsultation = ({ appointmentId, onClose }) => {
    const [consultationData, setConsultationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [doctorJoined, setDoctorJoined] = useState(false);
    const [showChecklist, setShowChecklist] = useState(true);

    const [checklist, setChecklist] = useState({
        camera: false,
        microphone: false,
        connection: false
    });

    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [localVideoTrack, setLocalVideoTrack] = useState(null);
    const [localAudioTrack, setLocalAudioTrack] = useState(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState(null);

    const client = useRef(AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
    const remoteVideoRef = useRef(null);

    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [doctorProfile, setDoctorProfile] = useState(null);
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

                await fetchDoctorProfile(response.data.appointment);

                if (agoraAppId && agoraToken) {
                    try {
                        if (client.current.connectionState === "DISCONNECTED") {
                            await client.current.join(agoraAppId, channelName, agoraToken, uid);
                        }

                        if (!isSubscribed) {
                            await client.current.leave();
                            return;
                        }

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

                        client.current.on("user-published", async (user, mediaType) => {
                            await client.current.subscribe(user, mediaType);
                            if (mediaType === "video") {
                                setDoctorJoined(true);
                                setRemoteVideoTrack(user.videoTrack);
                            }
                            if (mediaType === "audio") {
                                user.audioTrack.play();
                            }
                        });

                        client.current.on("user-unpublished", (user) => {
                            if (user.uid !== client.current.uid) {
                                setDoctorJoined(false);
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

                currentSocket = await initializeSocket(response.data.consultationId);

            } catch (error) {
                if (!isSubscribed) return;
                console.error("Error initializing consultation:", error);
                toast.error(error.response?.data?.message || "Failed to start consultation");
            } finally {
                if (isSubscribed) setLoading(false);
            }
        };

        if (!showChecklist) {
            initializeConsultation();
        }

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
    }, [appointmentId, showChecklist]);

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
                    role: "patient"
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
                    setDoctorJoined(true);
                }
            });

            newSocket.on("user-joined", (data) => {
                if (data.role === "doctor") {
                    setDoctorJoined(true);
                    toast.info("Doctor has joined the consultation");
                }
            });

            newSocket.on("user-left", (data) => {
                if (data.role === "doctor") {
                    setDoctorJoined(false);
                    setRemoteVideoTrack(null);
                    toast.warn("Doctor has left the consultation");
                }
            });

            setSocket(newSocket);
            return newSocket;
        } catch (error) {
            console.error("Socket error:", error);
            return null;
        }
    };

    const fetchDoctorProfile = async (appointment) => {
        try {
            setDoctorProfile({
                fullName: appointment?.doctorName || "Doctor",
                specialty: appointment?.specialization || "Physician"
            });
        } catch (error) {
            console.error("Error fetching doctor profile:", error);
        }
    };

    const handleStartChecklist = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setChecklist({ camera: true, microphone: true, connection: true });
            stream.getTracks().forEach(track => track.stop());
            toast.success("Ready for consultation!");
        } catch (err) {
            console.error("Permission error:", err);
            toast.error("Camera and Microphone access are required");
        }
    };

    const handleJoinConsultation = () => {
        setShowChecklist(false);
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

    const sendMessage = () => {
        if (newMessage.trim() && socket && consultationData) {
            const userId = JSON.parse(atob(token.split('.')[1])).id;
            const messageData = {
                consultationId: consultationData.consultationId,
                userId,
                role: "patient",
                message: newMessage,
                timestamp: new Date().toISOString()
            };

            // Optimistic UI update: Add message locally immediately
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: newMessage,
                sender: "patient", // Self is always "patient" in this component
                timestamp: messageData.timestamp
            }]);

            socket.emit("send-message", messageData);
            setNewMessage("");
        }
    };

    const submitRating = async () => {
        try {
            if (!rating || rating < 1 || rating > 5) {
                toast.error("Please select a rating");
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };
            await axios.post(
                `/consultation/${consultationData.consultationId}/rating`,
                { rating, comment: ratingComment },
                { headers }
            );
            toast.success("Thank you for your feedback!");
        } catch (error) {
            console.error("Error submitting rating:", error);
            toast.error("Failed to submit rating");
        }
    };

    const downloadPrescription = () => {
        if (!prescription) return;

        const content = `
PRESCRIPTION
Date: ${new Date(prescription.createdAt).toLocaleDateString()}

MEDICATIONS:
${prescription.medications.map((med, i) =>
            `${i + 1}. ${med.name} - ${med.dosage}, ${med.frequency}, ${med.duration}`
        ).join('\n')}

INSTRUCTIONS:
${prescription.instructions}

${prescription.followUp ? `Follow-up Date: ${prescription.followUpDate}` : ''}
    `;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prescription_${consultationData.consultationId}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (showChecklist) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-8 max-w-xl w-full shadow-2xl text-black">
                    <h2 className="text-3xl font-bold mb-6 text-primary">Pre-Consultation Check</h2>
                    <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📹</span>
                                <span className="font-medium">Camera Test</span>
                            </div>
                            {checklist.camera ? (
                                <span className="badge badge-success py-3 px-4">✓ Passed</span>
                            ) : (
                                <span className="badge badge-secondary py-3 px-4">Pending</span>
                            )}
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🎤</span>
                                <span className="font-medium">Microphone Test</span>
                            </div>
                            {checklist.microphone ? (
                                <span className="badge badge-success py-3 px-4">✓ Passed</span>
                            ) : (
                                <span className="badge badge-secondary py-3 px-4">Pending</span>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={handleStartChecklist} className="btn btn-primary flex-1">
                            Run Hardware Tests
                        </button>
                        <button
                            onClick={handleJoinConsultation}
                            disabled={!checklist.camera || !checklist.microphone}
                            className={`btn flex-1 ${(!checklist.camera || !checklist.microphone) ? 'btn-disabled' : 'btn-success text-white'}`}
                        >
                            Join Consultation
                        </button>
                        <button onClick={onClose} className="btn btn-ghost">Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 text-center text-black">
                    <div className="loading loading-spinner loading-lg text-primary"></div>
                    <p className="mt-4">Connecting to doctor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
            <div className="bg-gray-800 text-white p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold">Consultation with {doctorProfile?.fullName || "Doctor"}</h2>
                        <p className="text-sm text-gray-400">Please stay on this screen. Your consultation is live.</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-700">
                        <div className={`w-2 h-2 rounded-full ${doctorJoined ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}></div>
                        <span className="text-xs font-medium">
                            {doctorJoined ? "Doctor Ready" : "Doctor Offline"}
                        </span>
                    </div>
                </div>
                <button onClick={onClose} className="btn btn-sm btn-ghost">Leave</button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 bg-black relative overflow-hidden">
                        {/* Remote Video (Doctor) */}
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
                            <div className="w-px h-6 bg-gray-700 mx-2"></div>
                            <button
                                onClick={onClose}
                                className="btn btn-circle btn-sm md:btn-md btn-error"
                                title="Leave Call"
                            >
                                📞
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-96 bg-white flex flex-col border-l text-black">
                    <div className="flex border-b">
                        <button className="flex-1 p-2 font-semibold border-b-2 border-primary">Chat</button>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`p-2 rounded ${msg.sender === "patient" ? "bg-primary text-white ml-auto" : "bg-gray-200 text-black"
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
                </div>
            </div>
        </div>
    );
};

export default PatientConsultation;
