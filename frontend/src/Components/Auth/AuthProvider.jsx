
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import * as jwt_decode from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState("");

    // Load user & token on page refresh
    useEffect(() => {
        const storedToken = localStorage.getItem("authToken");

        if (storedToken) {
            try {
                const decoded = jwt_decode.default(storedToken);
                setUser({
                    email: decoded.email,
                    role: decoded.userRole || "user",
                    id: decoded.id,
                });
                setToken(storedToken); // ✅ store token in state
            } catch (error) {
                console.error("Invalid token");
                setUser(null);
                setToken("");
            }
        }
    }, []);

    // LOGIN using backend /login
    const login = async (email, password) => {
        const res = await axios.post("/login", {
            email,
            password,
        });

        const authToken = res.data.token;
        localStorage.setItem("authToken", authToken);
        setToken(authToken);

        const decoded = jwt_decode.default(authToken);

        setUser({
            email: decoded.email,
            role: decoded.userRole || "user",
            id: decoded.id,
        });

        return decoded;
    };

    // LOGOUT
    const logout = () => {
        localStorage.removeItem("authToken");
        sessionStorage.clear();
        setUser(null);
        setToken("");
        window.location.href = "/";
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
