import React from "react";
import StatusBadge from "./StatusBadge";

const UpcomingRow = ({ appt, onViewDetails }) => {
  return (
    <tr className="border-b last:border-0">
      <td className="px-3 py-2 text-xs text-gray-500">{appt.date}</td>
      <td className="px-3 py-2 text-sm font-medium text-gray-900">
        {appt.patientDetails?.fullName || appt.fullName || appt.patientName || "Unknown"}
      </td>
      <td className="px-3 py-2 text-xs text-gray-600">{appt.time}</td>
      <td className="px-3 py-2 text-xs text-gray-600">{appt.reason}</td>
      <td className="px-3 py-2">
        <StatusBadge status={appt.status || "Pending"} />
      </td>
      <td className="px-3 py-2 text-right text-xs">
        <button
          onClick={() => onViewDetails && onViewDetails(appt)}
          className="rounded-md border border-gray-200 px-2 py-1 text-gray-700 hover:bg-gray-50"
        >
          Details
        </button>
      </td>
    </tr>
  );
};

export default UpcomingRow;

