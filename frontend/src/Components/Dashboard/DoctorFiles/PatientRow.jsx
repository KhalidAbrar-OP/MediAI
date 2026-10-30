import React from "react";

const PatientRow = ({ patient, onViewDetails }) => {
  return (
    <tr className="border-b last:border-0 hover:bg-gray-50">
      <td className="px-3 py-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">{patient.name}</div>
          <div className="text-xs text-gray-500">{patient.gender || "N/A"}</div>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="text-sm text-gray-700">{patient.email}</div>
        <div className="text-xs text-gray-500">{patient.phone}</div>
      </td>
      <td className="px-3 py-3 text-sm text-gray-600">{patient.lastVisit}</td>
      <td className="px-3 py-3 text-center">
        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {patient.totalAppointments || 0}
        </span>
      </td>
      <td className="px-3 py-3 text-right">
        <button 
          onClick={onViewDetails}
          className="rounded-md border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          View Details
        </button>
      </td>
    </tr>
  );
};

export default PatientRow;