import React from "react";
import StatusBadge from "./StatusBadge";

const TodayAppointmentCard = ({ appt, onStartCall, onViewDetails, onPrescriptionClick, onCancel, onComplete }) => {
  const isTelemedicine =
    appt.consultationType?.toLowerCase() === "online" ||
    appt.consultationType?.toLowerCase() === "telemedicine" ||
    appt.medium?.toLowerCase() === "online" ||
    appt.medium?.toLowerCase() === "telemedicine" ||
    appt.meetingType?.toLowerCase() === "online" ||
    appt.meetingType?.toLowerCase() === "telemedicine";
  return (
    <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-900">
            {appt.patientDetails?.fullName || appt.fullName || appt.patientName || "Unknown"}
          </h4>
          {appt.type && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
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
        {appt.reason && (
          <p className="mt-1 text-xs text-gray-500">{appt.reason}</p>
        )}
        <p className="mt-1 text-sm font-medium text-gray-800">
          {appt.time} • <StatusBadge status={appt.status || "Pending"} />
        </p>
      </div>
      <div className="flex flex-row gap-2 text-xs">
        <div className="flex gap-2">
          {isTelemedicine && (
            <button
              onClick={onStartCall}
              className="flex-1 rounded-lg px-2 py-1.5 font-medium text-white transition-colors bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
              title="Join Consultation"
            >
              Join Consultation
            </button>
          )}
          <button
            onClick={onViewDetails}
            className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            View Details
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPrescriptionClick(appt)}
            className="rounded-lg border border-gray-200 px-2 py-1 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Prescriptions
          </button>
          {(appt.status === "confirmed" || appt.status === "Confirmed" || appt.status === "pending" || appt.status === "Pending") && (
            <button
              onClick={onComplete}
              className="rounded-lg border border-green-100 px-2 py-1.5 text-green-600 hover:bg-green-50 transition-colors cursor-pointer font-medium"
            >
              Done
            </button>
          )}
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-red-100 px-2 py-1.5 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodayAppointmentCard;

