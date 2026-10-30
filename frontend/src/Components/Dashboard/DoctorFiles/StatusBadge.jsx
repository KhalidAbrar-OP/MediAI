import React from "react";

const StatusBadge = ({ status }) => {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  const styles =
    status.toLowerCase() === "completed"
      ? " bg-green-100 text-green-700"
      : status.toLowerCase() === "confirmed"
        ? " bg-blue-100 text-blue-700"
        : " bg-yellow-100 text-yellow-700";

  return <span className={base + styles}>{status}</span>;
};

export default StatusBadge;

