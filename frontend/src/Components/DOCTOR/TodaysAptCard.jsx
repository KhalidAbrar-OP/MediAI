import React, { useState, useEffect } from "react";
import StatusBadge from "./StatusBadge";
import DoctorConsultation from "../../Consultation/DoctorConsultation";
import axios from "axios";

const TodayAppointmentCard = ({ appt }) => {
    const [showConsultation, setShowConsultation] = useState(false);
    const [canStartConsultation, setCanStartConsultation] = useState(false);
    const [consultationStatus, setConsultationStatus] = useState(null);
    const token = localStorage.getItem("authToken");

    useEffect(() => {
        checkConsultationAvailability();
    }, [appt._id]);

    const checkConsultationAvailability = async () => {
        try {
            // Check if appointment is online consultation
            if (appt.consultationType !== "online" || appt.status === "Cancelled") {
                return;
            }

            // Check if it's consultation time (allow 15 minutes before)
            const now = new Date();
            const appointmentDate = new Date(appt.appointmentDate);
            const [hours, minutes] = appt.appointmentTime.split(':');
            appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            const fifteenMinutesBefore = new Date(appointmentDate.getTime() - 15 * 60 * 1000);

            if (now >= fifteenMinutesBefore) {
                setCanStartConsultation(true);

                // Check consultation status
                const headers = { Authorization: `Bearer ${token}` };
                const response = await axios.get(
                    `/consultation/${appt._id}/status`,
                    { headers }
                );
                setConsultationStatus(response.data);
            }
        } catch (error) {
            console.error("Error checking consultation availability:", error);
        }
    };

    const handleStartConsultation = () => {
        if (!canStartConsultation) {
            return;
        }
        setShowConsultation(true);
    };

    if (appt.status === "Cancelled") {
        return (
            <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm opacity-60">
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900">
                            {appt.patientName}
                        </h4>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Appointment Cancelled</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900">
                            {appt.patientName}
                        </h4>
                        {appt.consultationType === "online" && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                                Online
                            </span>
                        )}
                    </div>
                    {appt.reason && (
                        <p className="mt-1 text-xs text-gray-500">{appt.reason}</p>
                    )}
                    <p className="mt-1 text-sm font-medium text-gray-800">
                        {appt.time} • <StatusBadge status={appt.status || "Pending"} />
                    </p>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                    {appt.consultationType === "online" ? (
                        canStartConsultation ? (
                            <button
                                onClick={handleStartConsultation}
                                className="rounded-lg bg-indigo-600 px-2 py-1 font-medium text-white hover:bg-indigo-700"
                            >
                                Start Consultation
                            </button>
                        ) : (
                            <button
                                disabled
                                className="rounded-lg bg-gray-300 px-2 py-1 font-medium text-gray-600 cursor-not-allowed"
                            >
                                Not Consultation time yet
                            </button>
                        )
                    ) : (
                        <button className="rounded-lg border border-gray-200 px-2 py-1 text-gray-700 hover:bg-gray-50">
                            View Details
                        </button>
                    )}
                </div>
            </div>
            {showConsultation && (
                <DoctorConsultation
                    appointmentId={appt._id}
                    onClose={() => setShowConsultation(false)}
                />
            )}
        </>
    );
};

export default TodayAppointmentCard;

