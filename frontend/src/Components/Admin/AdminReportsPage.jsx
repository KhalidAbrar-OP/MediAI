import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

const AdminReportsPage = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("in-progress"); // "in-progress" | "resolved"

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null); // "ban", "delete"
    const [selectedReport, setSelectedReport] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        try {
            const res = await axios.get("/api/reports", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReports(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching reports:", err);
            toast.error("Failed to load reports");
            setLoading(false);
        }
    };

    const handleAction = (type, report) => {
        if (type === "ignore") {
            handleResolve(report._id, "Ignored");
            return;
        }
        setSelectedReport(report);
        setModalType(type);
        setModalOpen(true);
    };

    const confirmAction = async () => {
        if (!selectedReport) return;
        setActionLoading(true);
        const token = localStorage.getItem("authToken");
        const headers = { Authorization: `Bearer ${token}` };

        try {
            if (modalType === "ban") {
                // Determine ID to use. Report has doctorId which might be string or ID.
                // Based on backend implementation, we pass doctorId from report.
                await axios.put(`/api/doctors/${selectedReport.doctorId}/ban`, {}, { headers });
                toast.success(`Doctor ${selectedReport.doctorName} has been banned.`);
            } else if (modalType === "delete") {
                await axios.delete(`/api/doctors/${selectedReport.doctorId}`, { headers });
                toast.success(`Doctor ${selectedReport.doctorName} profile deleted.`);
            }
            fetchReports(); // Refresh data
        } catch (err) {
            console.error(`Error performing ${modalType}:`, err);
            toast.error(err.response?.data?.message || `Failed to ${modalType} doctor`);
        } finally {
            setActionLoading(false);
            setModalOpen(false);
            setSelectedReport(null);
        }
    };

    const handleResolve = async (reportId, status) => {
        const token = localStorage.getItem("authToken");
        try {
            await axios.put(`/api/reports/${reportId}/resolve`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.info(`Report marked as ${status}`);
            fetchReports();
        } catch (err) {
            console.error("Error resolving report:", err);
            toast.error("Failed to update report status");
        }
    };

    const filteredReports = reports.filter(report => {
        if (activeTab === "in-progress") {
            return report.status === "pending" || report.status === "Under Review";
        } else {
            return report.status === "Resolved" || report.status === "Ignored";
        }
    });

    if (loading) return <div className="p-10 text-center">Loading reports...</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Reported Doctors</h1>

            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b border-gray-200">
                <button
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === "in-progress"
                        ? "border-b-2 border-blue-500 text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                    onClick={() => setActiveTab("in-progress")}
                >
                    In-Progress
                </button>
                <button
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === "resolved"
                        ? "border-b-2 border-green-500 text-green-600"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                    onClick={() => setActiveTab("resolved")}
                >
                    Resolved
                </button>
            </div>

            <div className="grid gap-6">
                {filteredReports.length > 0 ? (
                    filteredReports.map((report) => (
                        <div key={report._id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Dr. {report.doctorName}</h3>
                                    <span className="text-sm text-gray-500 font-medium">{report.specialization}</span>
                                </div>
                                <div className="mt-2 md:mt-0 flex items-center space-x-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${report.status === "pending" || report.status === "Under Review" ? "bg-yellow-100 text-yellow-700" :
                                        report.status === "Resolved" ? "bg-green-100 text-green-700" :
                                            "bg-gray-100 text-gray-700"
                                        }`}>
                                        {report.status}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(report.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-1"><span className="font-semibold">Reported By:</span> {report.patientName}</p>
                                <p className="text-sm text-gray-600 mb-1"><span className="font-semibold">Reason:</span> {report.reason}</p>
                                <div className="mt-2 bg-gray-50 p-3 rounded-md text-gray-700 text-sm italic border border-gray-100">
                                    "{report.description}"
                                </div>
                            </div>

                            {activeTab === "in-progress" && (
                                <div className="flex space-x-3 mt-4 justify-end border-t pt-4">
                                    <button
                                        onClick={() => handleAction("ignore", report)}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Ignore Report
                                    </button>
                                    <button
                                        onClick={() => handleAction("ban", report)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
                                    >
                                        Ban Doctor
                                    </button>
                                    <button
                                        onClick={() => handleAction("delete", report)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                                    >
                                        Delete Profile
                                    </button>
                                </div>
                            )}
                            {activeTab === "resolved" && (
                                <div className="mt-4 text-right text-sm text-gray-500 italic">
                                    Case closed
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm">
                        <p className="text-lg">No {activeTab} reports found.</p>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all scale-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Confirm {modalType === "ban" ? "Ban" : "Delete"}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to {modalType} <strong>Dr. {selectedReport?.doctorName}</strong>?
                            {modalType === "delete" && (
                                <span className="block mt-2 text-red-600 text-sm font-bold bg-red-50 p-2 rounded">
                                    Warning: This action is permanent and will remove all doctor data including appointments.
                                </span>
                            )}
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                className={`px-4 py-2 text-white rounded-lg font-medium shadow-md ${modalType === "ban" ? "bg-orange-500 hover:bg-orange-600" : "bg-red-600 hover:bg-red-700"
                                    } ${actionLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                                disabled={actionLoading}
                            >
                                {actionLoading ? "Processing..." : `Confirm ${modalType === "ban" ? "Ban" : "Delete"}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReportsPage;
