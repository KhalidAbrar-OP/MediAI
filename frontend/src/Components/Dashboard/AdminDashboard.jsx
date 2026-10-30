import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const AdminDashboard = () => {
    const [metrics, setMetrics] = useState({
        totalDoctors: 0,
        totalPatients: 0,
        totalAppointments: 0,
        bookedAppointments: 0,
        completedAppointments: 0,
        totalRevenue: 0
    });
    const [revenueData, setRevenueData] = useState({
        weekly: [],
        monthly: []
    });
    const [loading, setLoading] = useState(true);
    const [chartView, setChartView] = useState("weekly"); // "weekly" or "monthly"

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");

        if (!token) {
            toast.error("Authentication token not found. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            // Fetch metrics from backend
            const metricsResponse = await axios.get('/api/admin/metrics', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setMetrics(metricsResponse.data);

            setMetrics(metricsResponse.data);

            // Use real data from backend if available, otherwise fallback to empty structure
            // Backend sends: revenueChart: { weekly: [...], monthly: [...] }
            if (metricsResponse.data.revenueChart) {
                setRevenueData(metricsResponse.data.revenueChart);
            } else {
                // Fallback / Clear
                setRevenueData({
                    weekly: [],
                    monthly: []
                });
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            if (error.response?.status === 403) {
                toast.error("Access denied. Admin privileges required.");
            } else {
                toast.error("Failed to load dashboard data");
            }
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getMaxRevenue = () => {
        const data = chartView === "weekly" ? revenueData.weekly : revenueData.monthly;
        if (!data || data.length === 0) return 1;
        const max = Math.max(...data.map(item => item.revenue || 0));
        return max > 0 ? max : 1;
    };

    const renderRevenueChart = () => {
        const data = chartView === "weekly" ? revenueData.weekly : revenueData.monthly;
        const maxRevenue = getMaxRevenue();
        const labelKey = chartView === "weekly" ? "day" : "month";

        // Color palette for bars
        const barColors = [
            '#3B82F6', // Blue
            '#10B981', // Green
            '#F59E0B', // Amber
            '#EF4444', // Red
            '#8B5CF6', // Purple
            '#EC4899', // Pink
            '#06B6D4', // Cyan
            '#84CC16', // Lime
            '#F97316', // Orange
            '#6366F1', // Indigo
            '#14B8A6', // Teal
            '#A855F7'  // Violet
        ];

        if (!data || data.length === 0) {
            return (
                <div className="mt-6 text-center py-12">
                    <p className="text-gray-600">No revenue data available</p>
                </div>
            );
        }

        // Helper function to create a darker shade for gradient
        const darkenColor = (color, percent) => {
            const num = parseInt(color.replace("#", ""), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.max(0, Math.min(255, (num >> 16) + amt));
            const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
            const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
            return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
        };

        return (
            <div className="mt-6">
                <div className="flex items-end justify-between gap-3 px-4" style={{ minHeight: '300px', height: '300px' }}>
                    {data.map((item, index) => {
                        const revenue = item.revenue || 0;
                        const height = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
                        const barColor = barColors[index % barColors.length];
                        const lighterColor = darkenColor(barColor, 30);
                        return (
                            <div
                                key={index}
                                className="flex-1 flex flex-col items-center h-full group"
                                onMouseEnter={(e) => {
                                    const tooltip = e.currentTarget.querySelector('.revenue-tooltip');
                                    if (tooltip) tooltip.style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                    const tooltip = e.currentTarget.querySelector('.revenue-tooltip');
                                    if (tooltip) tooltip.style.opacity = '0';
                                }}
                            >
                                <div className="w-full h-full flex flex-col items-center justify-end pb-10 relative">
                                    <div
                                        className="w-full rounded-t-lg hover:opacity-90 hover:shadow-xl transition-all cursor-pointer relative shadow-lg"
                                        style={{
                                            height: `${height}%`,
                                            minHeight: revenue > 0 ? '30px' : '0',
                                            maxHeight: '100%',
                                            width: '100%',
                                            background: `linear-gradient(to top, ${lighterColor}, ${barColor})`,
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                    </div>
                                    <div
                                        className="revenue-tooltip absolute -top-14 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap z-50 pointer-events-none shadow-xl font-semibold transition-opacity duration-200"
                                        style={{ opacity: 0 }}
                                    >
                                        {formatCurrency(revenue)}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                            <div className="border-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 text-sm text-gray-700 font-semibold text-center w-full">
                                    {item[labelKey]}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-6 flex justify-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: barColors[0] }}></div>
                        <span className="font-medium">Revenue</span>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-8 mt-6 md:mt-10 mb-10">
                <div className="flex justify-center items-center h-64">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 mt-6 md:mt-10 mb-10">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-focus text-white rounded-2xl p-6 md:p-8 shadow-lg mb-6">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-primary-content/80">System-wide overview and management</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Doctors */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Doctors</p>
                            <p className="text-3xl font-bold text-gray-800">{metrics.totalDoctors}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Total Patients */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Patients</p>
                            <p className="text-3xl font-bold text-gray-800">{metrics.totalPatients}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Total Appointments */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Appointments</p>
                            <p className="text-3xl font-bold text-gray-800">{metrics.totalAppointments}</p>
                            <div className="flex gap-2 mt-2 text-xs">
                                <span className="text-blue-600">Booked: {metrics.bookedAppointments}</span>
                                <span className="text-gray-400">|</span>
                                <span className="text-green-600">Completed: {metrics.completedAppointments}</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                            <p className="text-3xl font-bold text-gray-800">{formatCurrency(metrics.totalRevenue)}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue Chart Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Revenue Overview</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setChartView("weekly")}
                            className={`btn btn-sm ${chartView === "weekly" ? "btn-primary" : "btn-outline"}`}
                        >
                            Weekly
                        </button>
                        <button
                            onClick={() => setChartView("monthly")}
                            className={`btn btn-sm ${chartView === "monthly" ? "btn-primary" : "btn-outline"}`}
                        >
                            Monthly
                        </button>
                    </div>
                </div>
                {renderRevenueChart()}
            </div>
        </div>
    );
};

export default AdminDashboard;