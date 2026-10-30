import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

import doc from "../../assets/Banner/doc.png";
import amb from "../../assets/Banner/amb.png";
import fac from "../../assets/Banner/facility.png";

const Banner = () => {
    const images = [doc, amb, fac];

    const [current, setCurrent] = useState(0);
    const [pause, setPause] = useState(false);

    // Auto slide every 3 seconds
    useEffect(() => {
        if (pause) return;

        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % images.length);
        }, 3000);

        return () => clearInterval(timer);
    }, [pause]);

    return (
        <div className="w-full overflow-hidden relative bg-black">

            <motion.img
                key={current}
                src={images[current]}
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: 1, scale: pause ? 1.1 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-[250px] md:h-[400px] lg:h-[550px] object-cover"
                onMouseEnter={() => setPause(true)}
                onMouseLeave={() => setPause(false)}
            />

            {/* Optional: dot indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                    <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${i === current ? "bg-white" : "bg-gray-500"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default Banner;
