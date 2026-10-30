import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion"; // Animation
import { Mail, Lock, Activity, ArrowRight } from "lucide-react"; // Icons

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const res = await axios.post("/login", { email, password });
            // Save JWT token
            localStorage.setItem("authToken", res.data.token);
            toast.success("Login successful!");
            // Auto refresh session 
            window.location.href = "/";
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid email or password");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 md:p-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
                {/* Left Side: Visual/Image */}
                <div className="hidden md:flex md:w-1/2 bg-blue-600 relative overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2070"
                        alt="Medical AI"
                        className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
                    />
                    <div className="relative z-10 p-12 flex flex-col justify-between text-white">
                        <div className="flex items-center gap-2">
                            <Activity className="w-8 h-8 text-cyan-300" />
                            <span className="text-2xl font-bold tracking-tight">MediAi</span>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold leading-tight mb-4">
                                Precision Care <br />
                                <span className="text-cyan-300">Powered by AI.</span>
                            </h1>
                            <p className="text-blue-100 text-lg">
                                Access your personalized medical dashboard and AI diagnostics.
                            </p>
                        </div>
                        <div className="text-sm text-blue-200">
                            © 2024 MediAi Health Systems
                        </div>
                    </div>
                    {/* Decorative Blobs */}
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-400 rounded-full blur-3xl opacity-20"></div>
                </div>
                {/* Right Side: Form */}
                <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white">
                    <div className="mb-10 text-center md:text-left">
                        <h2 className="text-3xl font-bold text-slate-800">Welcome Back</h2>
                        <p className="text-slate-500 mt-2">Please enter your credentials to access MediAi</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    placeholder="@gmail.com"
                                    className="input input-bordered w-full pl-10 bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white transition-all h-12 rounded-xl"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-sm font-semibold text-slate-600">Password</label>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="input input-bordered w-full pl-10 bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white transition-all h-12 rounded-xl"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="btn bg-blue-600 hover:bg-blue-700 border-none text-white w-full h-12 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 text-lg font-semibold"
                        >
                            Login to Dashboard
                            <ArrowRight className="w-5 h-5" />
                        </motion.button>
                        <div className="text-center mt-8">
                            <p className="text-slate-500">
                                New to the platform?
                                <Link to="/register" className="ml-2 text-blue-600 font-bold hover:underline underline-offset-4 transition-all">
                                    Create Account
                                </Link>
                            </p>
                        </div>
                    </form>
                    {/* Footer for Mobile Only */}
                    <div className="md:hidden mt-12 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2 text-blue-600">
                            <Activity className="w-6 h-6" />
                            <span className="font-bold">MediAi</span>
                        </div>
                        <p className="text-xs text-slate-400">Advanced Diagnostic Intelligence</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;