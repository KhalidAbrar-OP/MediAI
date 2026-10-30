import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from './Auth/AuthProvider.jsx';
import axios from 'axios';
import logo from '../assets/logo.png';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const [userRole, setUserRole] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const token = localStorage.getItem('authToken');
    const location = useLocation();
    const navigate = useNavigate();

    const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

    useEffect(() => {
        const fetchUserRole = async () => {
            if (!user?.email || !token) {
                setUserRole('');
                return;
            }

            try {
                const res = await axios.get(
                    `/users/role?email=${user.email}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setUserRole(res.data.role || 'user');
            } catch (err) {
                console.error('Error fetching user role:', err);
                const status = err.response?.status;
                if (status === 401 || status === 403) {
                    localStorage.removeItem('authToken');
                    logout();
                    navigate('/login');
                } else {
                    setUserRole('user');
                }
            }
        };

        fetchUserRole();
    }, [user, token, logout, navigate]);

    const getNavItems = () => {
        if (!user) {
            return [
                { name: 'Home', path: '/' },
                { name: 'Doctors', path: '/doctorCard' },
                { name: 'Services', path: '/services' },
                { name: 'About Us', path: '/about' },
              
            ];
        }

        if (userRole === 'admin') {
            return [
                { name: 'Home', path: '/' },
                { name: 'Activity Log', path: '/users' },
                { name: 'Doctors', path: '/admin/doctors' },
                { name: 'Reports', path: '/admin/reports' },
            ];
        }

        if (userRole === 'doctor') {
            return [
                { name: 'Home', path: '/' },
                { name: 'Schedule Management', path: '/doctor/schedule-page' },
                { name: 'Patients', path: '/doctor/patients' },
                { name: 'Emergency Appointment', path: '/doctor-emergency' },
                { name: 'Profile', path: '/user-settings' },
            ];
        }
        //Normal User
        return [
            { name: 'Home', path: '/' },
            { name: 'Find Doctors', path: '/doctorCard' },
            { name: 'My Appointments', path: '/appointments/my' },
            { name: 'Health Tools', path: '/health-tools' },
            { name: 'Profile', path: '/user-settings' },
            { name: 'Emergency Appointment', path: '/patient-emergencies' },
        ];
    };

    const navItems = getNavItems();

    return (
        <div className="navbar bg-base-100 shadow-md px-4 sticky top-0 z-50">
            {/* Logo */}
            <div className="navbar-start flex items-center">
                <img src={logo} alt="MediAi Logo" className="w-25 h-25 object-contain" />
                <Link to="/" className="btn btn-ghost text-2xl font-bold text-primary">
                    MediAI
                </Link>
            </div>

            {/* Desktop Menu */}
            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1 gap-4">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <li key={item.name}>
                                <Link
                                    to={item.path}
                                    className={`font-medium transition-colors ${isActive
                                        ? 'bg-blue-500 text-white rounded-md px-2 py-1'
                                        : 'hover:text-primary'
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="navbar-end hidden lg:flex items-center gap-3">
                {user ? (
                    <>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">{user.email}</span>
                            <span className="badge badge-info badge-sm">{userRole || 'User'}</span>
                        </div>
                        <button
                            onClick={() => logout()}
                            className="btn btn-outline btn-error btn-sm"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link
                            to="/login"
                            className={`btn btn-sm ${location.pathname === '/login' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className={`btn btn-sm ${location.pathname === '/register' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                        >
                            Register
                        </Link>
                    </>
                )}
            </div>

            {/* Mobile Hamburger */}
            <div className="lg:hidden navbar-end">
                <button onClick={toggleMobileMenu} className="btn btn-ghost btn-circle">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    </svg>
                </button>
            </div>

            {/* Mobile Dropdown */}
            {isMobileMenuOpen && (
                <div className="absolute top-full left-0 w-full bg-base-100 shadow-2xl z-50 lg:hidden border-t">
                    <ul className="menu p-4 space-y-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.name}>
                                    <Link
                                        to={item.path}
                                        className={`text-lg block px-2 py-1 rounded ${isActive ? 'bg-blue-500 text-white' : ''
                                            }`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}

                        <div className="divider my-2"></div>

                        {/* Mobile Auth */}
                        {user ? (
                            <div className="flex flex-col gap-3 pt-2">
                                <div className="text-center">
                                    <p className="font-semibold">{user.email}</p>
                                    <p className="text-sm opacity-70 capitalize">
                                        Role: {userRole || 'User'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        logout();
                                    }}
                                    className="btn btn-error w-full"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 pt-2">
                                <Link
                                    to="/login"
                                    className={`btn w-full ${location.pathname === '/login' ? 'bg-blue-500 text-white' : 'bg-white'
                                        }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className={`btn w-full ${location.pathname === '/register' ? 'bg-blue-500 text-white' : 'bg-white'
                                        }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Navbar;
