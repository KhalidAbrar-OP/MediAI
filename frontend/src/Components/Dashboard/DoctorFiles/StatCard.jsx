import React from "react";

const StatCard = ({ label, value, sublabel }) => {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className="mt-2 text-2xl font-semibold text-gray-900">{value}</span>
      {sublabel && (
        <span className="mt-1 text-xs text-gray-500">{sublabel}</span>
      )}
    </div>
  );
};

export default StatCard;

