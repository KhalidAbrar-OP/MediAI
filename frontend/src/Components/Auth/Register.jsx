import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { User, Mail, Lock, Activity, ArrowRight, ShieldCheck, Zap } from "lucide-react";

const Register = () => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        const userData = { fullName, email, password };
        try {
            const res = await axios.post(
                "/register",
                userData,
                { headers: { "Content-Type": "application/json" } }
            );
            if (res.status === 201 && res.data?.userId) {
                toast.success("Register Successful");
                setTimeout(() => navigate("/login"), 1000);
            } else {
                toast.error("Register Failed");
            }
        } catch (error) {
            toast.error("Register Failed");
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] p-4 md:p-10">
            {/*Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[120px] opacity-60" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
            </div>

            {/* Medium Sized Professional Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-4xl bg-white rounded-[2rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row border border-slate-100"
            >

                {/* Left Side: Futuristic Medical Image & Branding */}
                <div className="w-full md:w-5/12 bg-blue-600 relative p-10 flex flex-col justify-between text-white overflow-hidden">
                    {/* Background Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-indigo-900 opacity-90" />

                    <div className="relative z-10">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-2 mb-10"
                        >
                            <div className="bg-white p-2.5 rounded-2xl shadow-lg">
                                <Activity className="text-blue-600 w-6 h-6" />
                            </div>
                            <span className="text-2xl font-black tracking-tighter uppercase">MediAi</span>
                        </motion.div>

                        <h2 className="text-3xl font-bold leading-[1.2] mb-4">
                            The Next Era of <span className="text-blue-300">Clinical Intelligence.</span>
                        </h2>
                        <p className="text-blue-100/80 text-sm leading-relaxed">
                            Join our AI-powered ecosystem designed to assist healthcare professionals with real-time diagnostics.
                        </p>
                    </div>

                    <div className="relative z-10 mt-8">
                        {/* New High-Tech Medical Image */}
                        <motion.img
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1000"
                            alt="AI Medical Interface"
                            className="rounded-2xl shadow-2xl border border-white/20 w-full h-48 object-cover mb-6 transform hover:scale-105 transition-transform duration-500"
                        />
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                            <ShieldCheck className="w-5 h-5 text-blue-300" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-50">Enterprise Grade Security</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="w-full md:w-7/12 p-8 lg:p-14 bg-white">
                    <div className="mb-10">
                        <div className="flex items-center gap-2 text-blue-600 mb-3">
                            <Zap className="w-4 h-4 fill-current" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Secure Registration</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Register Now</h1>
                        <p className="text-slate-500 mt-2 font-medium">Create your unique clinical profile today.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-wider">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Please enter your full name"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-semibold text-slate-800 shadow-sm"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-wider">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors w-5 h-5" />
                                <input
                                    type="email"
                                    placeholder="name@gmail.com"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-semibold text-slate-800 shadow-sm"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-wider">Secure Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors w-5 h-5" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-semibold text-slate-800 shadow-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01, translateY: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="w-full py-4.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-2xl shadow-blue-200 flex items-center justify-center gap-3 text-lg transition-all mt-8"
                        >
                            Register Now
                            <ArrowRight className="w-5 h-5" />
                        </motion.button>

                        <p className="text-center text-slate-500 mt-8 font-bold text-sm">
                            Already a member?{" "}
                            <Link
                                to="/login"
                                className="text-blue-600 hover:text-blue-800 transition-colors decoration-2 underline underline-offset-4"
                            >
                                Login Here
                            </Link>
                        </p>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;