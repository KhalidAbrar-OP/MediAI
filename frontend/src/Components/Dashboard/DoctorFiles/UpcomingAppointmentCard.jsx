import React from "react";
import StatusBadge from "./StatusBadge";

const UpcomingAppointmentCard = ({ appt, onViewDetails, onCancel, onJoinConsultation }) => {
    const isTelemedicine =
        appt.consultationType?.toLowerCase() === 'online' ||
        appt.consultationType?.toLowerCase() === 'telemedicine' ||
        appt.medium?.toLowerCase() === 'online' ||
        appt.medium?.toLowerCase() === 'telemedicine' ||
        appt.meetingType?.toLowerCase() === 'online' ||
        appt.meetingType?.toLowerCase() === 'telemedicine';
    return (
        <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {appt.patientName}
                                </h3>
                                {appt.type && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${appt.type === 'Emergency'
                                        ? 'bg-red-100 text-red-700 animate-pulse'
                                        : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {appt.type}
                                    </span>
                                )}
                                {appt.isParticipantOnline && (
                                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 animate-pulse flex items-center gap-1">
                                        <span className="w-1 h-1 bg-green-600 rounded-full"></span>
                                        Patient In-Call
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                                <span className="font-medium text-gray-700">Reason:</span> {appt.reason || "General Consultation"}
                            </p>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>{appt.date}</span>
                                </div>

                                <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{appt.time}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                    <StatusBadge status={appt.status || "Pending"} />
                                </div>

                                {appt.consultationType === 'online' && (
                                    <div className="flex items-center gap-1">
                                        <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
                                            Online
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 md:self-center">
                    {isTelemedicine && (
                        <button
                            onClick={onJoinConsultation}
                            className="btn btn-primary btn-sm flex items-center gap-1 normal-case font-medium shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Join Consultation
                        </button>
                    )}
                    <button
                        onClick={onViewDetails}
                        className="btn btn-outline btn-sm normal-case font-medium border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                    >
                        View Details
                    </button>
                    <button
                        onClick={onCancel}
                        className="btn btn-error btn-sm text-white normal-case font-medium shadow-sm"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpcomingAppointmentCard;
