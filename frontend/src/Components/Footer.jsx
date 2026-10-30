import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const Footer = () => {
    return (
        <footer className="footer sm:footer-horizontal bg-base-200 text-base-content p-10">

            {/* Logo / About */}
            <aside className="flex flex-col items-start">
                <img
                    src={logo}
                    alt="MediAi Logo"
                    className="w-50 h-50 mb-2 object-contain"
                />

                <p>
                    <Link to="/" className="btn btn-ghost text-2xl font-bold text-primary">
                        MediAI
                    </Link>
                    <br />
                    Providing reliable tech since 2025
                </p>
            </aside>

            {/* Services */}
            <nav>
                <h6 className="footer-title">Services</h6>
                <a className="link link-hover">Branding</a>
                <a className="link link-hover">Design</a>
                <a className="link link-hover">Marketing</a>
                <a className="link link-hover">Advertisement</a>
            </nav>

            {/* Company */}
            <nav>
                <h6 className="footer-title">Company</h6>
                <a className="link link-hover">About us</a>
                <a className="link link-hover">Contact</a>
                <a className="link link-hover">Jobs</a>
                <a className="link link-hover">Press kit</a>
            </nav>

            {/* Legal */}
            <nav>
                <h6 className="footer-title">Legal</h6>
                <a className="link link-hover">Terms of use</a>
                <a className="link link-hover">Privacy policy</a>
                <a className="link link-hover">Cookie policy</a>
            </nav>

        </footer>
    );
};

export default Footer;
