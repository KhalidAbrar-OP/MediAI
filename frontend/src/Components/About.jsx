import React from 'react';
import { motion } from 'framer-motion';
import { FaStethoscope, FaRobot, FaLock, FaUsers } from 'react-icons/fa';

const AboutUs = () => {
    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.3 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const teamMembers = [
        "MD SAIDUL ISLAM APU",
        "KHALID ABRAR LABIB",
        "MALIHA RAHMAN",
        "OWARA BINTE MAMUN"
    ];

    return (
        <div className="min-h-screen bg-base-100 text-base-content font-sans">

            {/* --- Section 1: Hero (Animated Gradient Background) --- */}
            <div className="relative h-[60vh] flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-500 overflow-hidden">
                {/* Animated background shapes instead of images */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 20, repeat: Infinity }}
                    className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl -top-20 -left-20"
                />
                <motion.div
                    animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }}
                    transition={{ duration: 15, repeat: Infinity }}
                    className="absolute w-80 h-80 bg-cyan-300/10 rounded-full blur-3xl -bottom-20 -right-20"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 text-center px-6"
                >
                    <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4">
                        MediAI
                    </h1>
                    <div className="h-1 w-24 bg-cyan-400 mx-auto mb-6"></div>
                    <p className="text-xl md:text-2xl text-cyan-50 font-light max-w-3xl mx-auto">
                        The future of healthcare, powered by Intelligence.
                        A comprehensive MERN-stack solution for modern medicine.
                    </p>
                </motion.div>
            </div>

            {/* --- Section 2: Our Mission (Responsive Grid) --- */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="container mx-auto px-6 py-24"
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div variants={itemVariants}>
                        <h2 className="text-4xl font-bold mb-6 text-primary">Revolutionizing Consultation</h2>
                        <p className="text-lg leading-relaxed opacity-80 mb-6">
                            MediAI is designed to bridge the gap between patients and specialized healthcare.
                            By leveraging the **Gemini AI engine**, our platform doesn't just store data;
                            it understands patient needs, suggests the right specialists, and manages
                            the entire clinical workflow from booking to digital prescriptions.
                        </p>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-4 border-l-4 border-secondary bg-base-200">
                                <p className="text-2xl font-bold">100%</p>
                                <p className="text-sm opacity-60">Digital Workflow</p>
                            </div>
                            <div className="p-4 border-l-4 border-accent bg-base-200">
                                <p className="text-2xl font-bold">Real-time</p>
                                <p className="text-sm opacity-60">Consultations</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Feature Icons Grid (Visual interest without photos) */}
                    <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                        {[
                            { icon: <FaRobot />, title: "AI Finder", desc: "Specialty mapping", color: "bg-blue-500" },
                            { icon: <FaStethoscope />, title: "Telemedicine", desc: "Secure video calls", color: "bg-cyan-500" },
                            { icon: <FaLock />, title: "Secure", desc: "JWT Protected", color: "bg-indigo-500" },
                            { icon: <FaUsers />, title: "Unified", desc: "Doctors & Patients", color: "bg-teal-500" }
                        ].map((feature, i) => (
                            <div key={i} className="card bg-base-200 p-8 hover:bg-primary hover:text-white transition-all group">
                                <div className={`text-3xl mb-4 ${feature.color} text-white p-3 rounded-lg w-fit group-hover:bg-white group-hover:text-primary`}>
                                    {feature.icon}
                                </div>
                                <h3 className="font-bold text-xl">{feature.title}</h3>
                                <p className="text-sm opacity-70 group-hover:opacity-100">{feature.desc}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* --- Section 3: The Team (Names Only - No Images) --- */}
            <div className="bg-base-200 py-24">
                <div className="container mx-auto px-6 text-center">
                    <motion.h2
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="text-3xl font-bold mb-12 uppercase tracking-[0.3em]"
                    >
                        The Team Behind MediAI
                    </motion.h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {teamMembers.map((name, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -10 }}
                                className="bg-base-100 p-10 rounded-xl shadow-sm border-t-4 border-primary"
                            >
                                {/* Minimalist Initials Circle instead of photo */}
                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                                    {name.charAt(0)}
                                </div>
                                <h3 className="text-lg font-bold tracking-tight">{name}</h3>
                                <p className="text-xs opacity-50 mt-2 uppercase">Developer </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Section 4: Tech Stack (Marquee-style Animation) --- */}
            <div className="py-16 overflow-hidden bg-base-100">
                <div className="flex space-x-12 animate-pulse justify-center opacity-50 grayscale hover:grayscale-0 transition-all">
                    <span className="text-2xl font-bold">MONGODB</span>
                    <span className="text-2xl font-bold text-primary">•</span>
                    <span className="text-2xl font-bold">EXPRESS</span>
                    <span className="text-2xl font-bold text-primary">•</span>
                    <span className="text-2xl font-bold">REACT</span>
                    <span className="text-2xl font-bold text-primary">•</span>
                    <span className="text-2xl font-bold">NODE.JS</span>
                    <span className="text-2xl font-bold text-primary">•</span>
                    <span className="text-2xl font-bold">GEMINI AI</span>
                </div>
            </div>

        </div>
    );
};

export default AboutUs;