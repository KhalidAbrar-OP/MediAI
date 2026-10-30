import React from "react";
import { useNavigate, useRouteError } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const ErrorPage = () => {
    const navigate = useNavigate();
    const error = useRouteError();
    console.error("Router Error:", error);

    const handleGoHome = () => {
        // Show dismissible toast
        toast.success("Redirecting to Home...", {
            position: "top-center",
            autoClose: 5000,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
        });

        // Navigate after 1 second
        setTimeout(() => {
            navigate("/");
        }, 1000);
    };

    const handleRetry = () => {
        toast.info("Retrying...", {
            position: "top-center",
            autoClose: 5000,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
        });

        setTimeout(() => window.location.reload(), 1000);
    };

    const isNotFound = error?.status === 404;
    const errorMessage = error?.statusText || error?.message || "Unknown error occurred";

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-6">
            <motion.div
                className="text-center"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
            >
                <motion.h1
                    className="text-7xl font-bold text-error mb-4"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    {error?.status || "Oops!"}
                </motion.h1>
                <h2 className="text-2xl font-semibold mt-4">
                    {isNotFound ? "Page Not Found" : "Something went wrong"}
                </h2>
                <p className="mt-2 text-base-content/70">
                    {isNotFound
                        ? "The page you are looking for does not exist."
                        : errorMessage}
                </p>

                <div className="mt-6 flex justify-center gap-3">
                    <button onClick={handleGoHome} className="btn btn-primary">
                        Go Home
                    </button>
                    <button onClick={handleRetry} className="btn btn-outline">
                        Retry
                    </button>
                </div>

                {/* Loading Spinner */}
                <div className="mt-10 flex justify-center">
                    <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            </motion.div>
        </div>
    );
};

export default ErrorPage;
