import React from 'react';
import { motion } from 'framer-motion';
import {
    Stethoscope,
    Video,
    Search,
    Activity,
    Clock,
    CreditCard,
    FileText,
    Zap,
    ShieldCheck
} from 'lucide-react';

const services = [
    {
        title: "AI Doctor Finder",
        description: "Our Gemini AI understands your symptoms and matches you with the perfect specialist instantly.",
        icon: <Search className="w-8 h-8 text-primary" />,
        color: "bg-blue-50",
        member: "Member-1"
    },
    {
        title: "Telemedicine",
        description: "High-quality video consultations with real-time chat and encrypted medical summaries.",
        icon: <Video className="w-8 h-8 text-secondary" />,
        color: "bg-purple-50",
        member: "Member-3"
    },
    {
        title: "Emergency On-Call",
        description: "One-tap emergency alerts that bypass the queue to connect you with available on-call doctors.",
        icon: <Zap className="w-8 h-8 text-error" />,
        color: "bg-red-50",
        member: "Member-1"
    },
    {
        title: "Health Insights",
        description: "Track BMI, water intake, and sleep duration with AI-driven wellness recommendations.",
        icon: <Activity className="w-8 h-8 text-success" />,
        color: "bg-green-50",
        member: "Member-2"
    },
    {
        title: "Digital Prescriptions",
        description: "Get validated, downloadable PDF prescriptions immediately after your virtual visit.",
        icon: <FileText className="w-8 h-8 text-info" />,
        color: "bg-cyan-50",
        member: "Member-4"
    },
    {
        title: "Secure Payments",
        description: "Seamless consultation fee processing with automated PDF invoicing and billing history.",
        icon: <CreditCard className="w-8 h-8 text-warning" />,
        color: "bg-orange-50",
        member: "Member-4"
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.2 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.5, ease: "easeOut" }
    }
};

const Service = () => {
    return (
        <div className="min-h-screen bg-base-100 py-16 px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto text-center mb-16">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="badge badge-primary badge-outline mb-4 gap-2 py-3 px-4"
                >
                    <ShieldCheck size={16} /> 24/7 Intelligent Care
                </motion.div>

                <motion.h1
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-4xl md:text-5xl font-bold text-base-content mb-6"
                >
                    Our <span className="text-primary italic">MediAI</span> Ecosystem
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-lg text-base-content/70 max-w-2xl mx-auto"
                >
                    Revolutionizing healthcare through Artificial Intelligence. From instant triage to remote surgeries,
                    we bridge the gap between patients and world-class specialists.
                </motion.p>
            </div>

            {/* Services Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                {services.map((service, index) => (
                    <motion.div
                        key={index}
                        variants={itemVariants}
                        whileHover={{ y: -10 }}
                        className="card bg-base-100 shadow-xl border border-base-200 hover:shadow-2xl transition-all duration-300"
                    >
                        <div className="card-body p-8">
                            <div className={`w-16 h-16 rounded-2xl ${service.color} flex items-center justify-center mb-6`}>
                                {service.icon}
                            </div>
                            <h2 className="card-title text-xl font-bold mb-2">
                                {service.title}
                                <div className="badge badge-ghost text-[10px] opacity-50">{service.member}</div>
                            </h2>
                            <p className="text-base-content/70 leading-relaxed">
                                {service.description}
                            </p>
                            <div className="card-actions justify-end mt-6">
                                <button className="btn btn-ghost btn-sm text-primary hover:bg-primary/10">
                                    Learn More →
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Bottom CTA / Stats Section */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="max-w-5xl mx-auto mt-24 p-8 rounded-3xl bg-primary text-primary-content flex flex-col md:flex-row items-center justify-between gap-8"
            >
                <div className="text-center md:text-left">
                    <h3 className="text-2xl font-bold mb-2">Ready to experience the future?</h3>
                    <p className="opacity-80">Join 50,000+ patients getting smarter healthcare today.</p>
                </div>
                <div className="flex gap-4">
                    <button className="btn btn-secondary shadow-lg">Book Appointment</button>
                    <button className="btn btn-outline border-white text-white hover:bg-white hover:text-primary">
                        Try AI Finder
                    </button>
                </div>
            </motion.div>

            {/* Floating Background Decorations */}
            <div className="fixed top-0 left-0 -z-10 w-full h-full overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 20, repeat: Infinity }}
                    className="absolute -top-20 -left-20 w-96 h-96 bg-primary rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, -90, 0],
                        opacity: [0.1, 0.15, 0.1]
                    }}
                    transition={{ duration: 15, repeat: Infinity }}
                    className="absolute -bottom-20 -right-20 w-96 h-96 bg-secondary rounded-full blur-[120px]"
                />
            </div>
        </div>
    );
};

export default Service;