import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Brain, ShieldCheck, Zap, ArrowRight, CheckCircle2, Search,Bell,
     Plus, Minus, Dna, Cpu, Microscope, Watch, Database, Pill, FileHeart, Smartphone} from 'lucide-react';

import { AuthContext } from '../Auth/AuthProvider'; 
import Dashboard from '../Dashboard/Dashboard'; 

const Home = () => {
    const { user } = useContext(AuthContext);

    if (user) {
        return <Dashboard />;
    }

    // If user is not logged in, show public home page
    // --- Animation Variants ---
    const fadeInUp = {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    return (
        <div className="bg-white font-sans text-gray-800 overflow-x-hidden">

            {/* ==================== HERO SECTION ==================== */}
            <section className="relative pt-24 pb-28 lg:pt-36 lg:pb-40 overflow-hidden">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/4 -z-10"
                />
                <motion.div
                    animate={{ scale: [1, 1.3, 1], rotate: [0, -45, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-50/40 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/4 -z-10"
                />

                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-8">
                            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-semibold tracking-wide">
                                <Zap size={16} className="fill-blue-600" /> AI-Powered Medicine
                            </motion.div>
                            <motion.h1 variants={fadeInUp} className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
                                Health Intelligence <br />
                                <span className="text-blue-600">Simplified.</span>
                            </motion.h1>
                            <motion.p variants={fadeInUp} className="text-lg lg:text-xl text-gray-500 max-w-lg leading-relaxed">
                                Experience the future of medicine. AI-powered diagnostics and real-time health alerts.
                            </motion.p>
                            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xl shadow-blue-600/20 transition-all">Get Started</button>
                                <button className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-bold transition-all">View Demo</button>
                            </motion.div>
                        </motion.div>

                        <div className="relative hidden lg:block">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative z-10"
                            >
                                <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-2xl max-w-sm mx-auto">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Brain size={20} /></div>
                                        <div><div className="font-bold">MediAi Bot</div><div className="text-xs text-green-500">● Online</div></div>
                                    </div>
                                    <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-600 mb-2">Analyzing report...</div>
                                    <div className="bg-blue-600 text-white rounded-lg p-3 text-sm ml-auto w-3/4">Diagnosis?</div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== CONNECTED ECOSYSTEM (NEW SECTION) ==================== */}
            <section className="py-24 bg-gradient-to-b from-white to-blue-50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">

                        {/* LEFT: Text Content */}
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wider">
                                <Activity size={14} /> Seamless Integration
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                                One Platform, <br />
                                <span className="text-blue-600">Infinite Connections.</span>
                            </h2>
                            <p className="text-gray-500 text-lg leading-relaxed">
                                MediAI doesn't work in isolation. We connect with hospital EMRs, wearable devices, insurance providers, and pharmacies to create a unified health record.
                            </p>

                            <ul className="space-y-4 pt-4">
                                <ListItem text="Syncs with Apple Health & Google Fit" />
                                <ListItem text="Direct HL7/FHIR Hospital Integration" />
                                <ListItem text="Automated Insurance Claim Processing" />
                            </ul>
                        </div>

                        {/* RIGHT: Orbit Animation */}
                        <div className="relative h-[500px] flex items-center justify-center">
                            {/* Central Hub */}
                            <div className="relative z-10 w-32 h-32 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-blue-50">
                                <div className="text-blue-600">
                                    <Brain size={48} />
                                </div>
                                <div className="absolute -bottom-8 font-bold text-gray-900">MediAI Core</div>
                            </div>

                            {/* Orbit Ring 1 */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute w-[300px] h-[300px] border border-dashed border-blue-200 rounded-full"
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-lg text-purple-500">
                                    <Watch size={24} />
                                </div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white p-3 rounded-full shadow-lg text-teal-500">
                                    <Smartphone size={24} />
                                </div>
                            </motion.div>

                            {/* Orbit Ring 2 */}
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                className="absolute w-[450px] h-[450px] border border-blue-100 rounded-full"
                            >
                                <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-full shadow-lg text-red-500">
                                    <FileHeart size={24} />
                                </div>
                                <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-full shadow-lg text-orange-500">
                                    <Pill size={24} />
                                </div>
                                <div className="absolute bottom-4 right-16 bg-white p-4 rounded-full shadow-lg text-slate-600">
                                    <Database size={24} />
                                </div>
                            </motion.div>

                            {/* Background Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -z-10"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== WORKFLOW ANIMATIONS ==================== */}
            <section className="py-24 bg-gray-50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-blue-600 font-bold uppercase text-sm mb-3">Workflow</h2>
                        <h3 className="text-4xl font-bold text-gray-900">Advanced AI Features</h3>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-10">
                        <DemoCard title="AI Doctor Search" desc="Type your symptoms. We find the specialist.">
                            <div className="bg-white rounded-xl shadow-inner border border-gray-200 p-4 h-48 flex flex-col relative overflow-hidden">
                                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 mb-4">
                                    <Search size={16} className="text-gray-400" />
                                    <TypewriterText text="Severe migraine..." />
                                </div>
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 2.0, duration: 0.5 }}
                                    className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-100"
                                >
                                    <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">Dr</div>
                                    <div><div className="text-xs font-bold">Dr. Emily Chen</div><div className="text-[10px] text-gray-500">Neurologist</div></div>
                                    <CheckCircle2 size={14} className="text-blue-600 ml-auto" />
                                </motion.div>
                            </div>
                        </DemoCard>

                        <DemoCard title="Prescription Scanner" desc="Extract medicine info from photos instantly.">
                            <div className="bg-slate-800 rounded-xl shadow-inner p-4 h-48 relative overflow-hidden">
                                <div className="bg-white w-20 h-28 mx-auto mt-4 rounded p-2 text-[5px] text-gray-400">Rx: Amoxicillin<br />500mg</div>
                                <motion.div
                                    animate={{ top: ["0%", "100%", "0%"] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 right-0 h-1 bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.8)]"
                                />
                                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute bottom-4 left-4 right-4 bg-green-500/90 backdrop-blur rounded-lg p-2 flex items-center gap-2">
                                    <CheckCircle2 className="text-white" size={12} /> <span className="text-xs font-bold text-white">Scanned</span>
                                </motion.div>
                            </div>
                        </DemoCard>

                        <DemoCard title="Live Notifications" desc="Real-time alerts for pills and appointments.">
                            <div className="bg-blue-50 rounded-xl shadow-inner border border-blue-100 p-4 h-48 relative flex items-center justify-center">
                                <motion.div animate={{ rotate: [0, -15, 15, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}>
                                    <Bell size={40} className="text-blue-200" fill="currentColor" />
                                </motion.div>
                            </div>
                        </DemoCard>
                    </div>
                </div>
            </section>

            {/* ==================== NEW TECHNOLOGY ==================== */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                {/* Background Tech Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>

                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                    <div className="mb-16">
                        <h2 className="text-blue-400 font-bold uppercase text-sm tracking-wider mb-2">Innovation Lab</h2>
                        <h3 className="text-4xl md:text-5xl font-bold">Pioneering the Future</h3>
                        <p className="text-slate-400 mt-4 max-w-2xl text-lg">
                            We are integrating quantum computing, genomics, and nanotechnology to solve the unsolved.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* TECH CARD 1 */}
                        <div className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-3xl hover:bg-slate-800 transition-all duration-300">
                            <div className="mb-8 relative h-32 flex items-center justify-center">
                                <motion.div animate={{ rotateY: 360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} className="text-teal-400">
                                    <Dna size={80} strokeWidth={1.5} />
                                </motion.div>
                            </div>
                            <h4 className="text-2xl font-bold mb-2">Genomic Profiling</h4>
                            <p className="text-slate-400">Personalized treatment plans based on real-time DNA sequencing.</p>
                        </div>
                        {/* TECH CARD 2 */}
                        <div className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-3xl hover:bg-slate-800 transition-all duration-300">
                            <div className="mb-8 relative h-32 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-900">
                                <Microscope size={64} className="text-blue-500 z-10" />
                                <motion.div animate={{ left: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="absolute top-0 bottom-0 w-2 bg-blue-400/50 blur-md shadow-[0_0_15px_#60a5fa]" />
                            </div>
                            <h4 className="text-2xl font-bold mb-2">Nano-Robotics</h4>
                            <p className="text-slate-400">Micro-surgery performed with sub-millimeter precision.</p>
                        </div>
                        {/* TECH CARD 3 */}
                        <div className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-3xl hover:bg-slate-800 transition-all duration-300">
                            <div className="mb-8 relative h-32 flex items-center justify-center">
                                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="text-purple-500 relative z-10">
                                    <Cpu size={80} strokeWidth={1.5} />
                                </motion.div>
                                <motion.div animate={{ scale: [1, 2], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute w-20 h-20 border border-purple-500/50 rounded-full" />
                            </div>
                            <h4 className="text-2xl font-bold mb-2">Neural Computing</h4>
                            <p className="text-slate-400">Brain-Computer Interfaces (BCI) allowing neural feedback.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== FAQ SECTION ==================== */}
            <section className="py-24 bg-white">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-blue-600 font-bold text-sm mb-3">Support</h2>
                        <h3 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h3>
                    </div>
                    <div className="space-y-4">
                        <AccordionItem question="Is my data secure?" answer="Yes, we use AES-256 encryption and are HIPAA compliant." />
                        <AccordionItem question="How accurate is the AI?" answer="Our AI is 99.8% accurate, verified against 50M+ records." />
                        <AccordionItem question="Can I book real doctors?" answer="Yes, we connect you to certified specialists nearby." />
                    </div>
                </div>
            </section>
            
        </div>
    );
};

// --- Helpers ---

const DemoCard = ({ title, desc, children }) => (
    <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg text-center">
        <div className="w-full mb-6">{children}</div>
        <h4 className="text-xl font-bold mb-2">{title}</h4>
        <p className="text-gray-500 text-sm">{desc}</p>
    </motion.div>
);

const TypewriterText = ({ text }) => {
    const [d, setD] = useState('');
    useEffect(() => {
        let i = 0; const t = setInterval(() => {
            if (i < text.length) { setD(p => p + text[i]); i++; } else clearInterval(t);
        }, 100);
        return () => clearInterval(t);
    }, [text]);
    return <span className="text-xs text-gray-600 font-mono">{d}<span className="animate-pulse">|</span></span>;
};

const AccordionItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-gray-200 rounded-2xl bg-gray-50">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between p-6 bg-white hover:bg-gray-50">
                <span className="font-bold">{question}</span>
                {isOpen ? <Minus size={20} /> : <Plus size={20} />}
            </button>
            <AnimatePresence>
                {isOpen && <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden"><div className="p-6 pt-0 text-gray-600 border-t">{answer}</div></motion.div>}
            </AnimatePresence>
        </div>
    );
};

const ListItem = ({ text }) => (
    <div className="flex items-center gap-3">
        <div className="min-w-[24px] h-6 text-green-500">
            <CheckCircle2 size={24} />
        </div>
        <span className="text-gray-700 font-medium">{text}</span>
    </div>
);

export default Home;
