// import React, { useEffect, useState, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//     Search, Filter, Trash2, User, ShieldCheck,
//     Stethoscope, Calendar, Users as UsersIcon
// } from "lucide-react";

// const Users = () => {
//     const [allUsers, setAllUsers] = useState([]); // Raw data from API
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState("");
//     const [filters, setFilters] = useState({
//         search: "",
//         role: "",
//         registrationDate: "",
//     });

//     const navigate = useNavigate();

//     // 1. Fetch data from API
//     const fetchUsers = async () => {
//         setLoading(true);
//         const token = localStorage.getItem("authToken");
//         if (!token) {
//             setLoading(false);
//             navigate("/login");
//             return;
//         }

//         try {
//             const res = await axios.get("http://localhost:5000/users", {
//                 headers: { Authorization: `Bearer ${token}` },
//             });
//             setAllUsers(res.data);
//         } catch (err) {
//             setError("Unable to fetch users.");
//             toast.error("Session expired or connection error.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchUsers();
//     }, []);

//     // 2. AUTO-FILTER LOGIC (Real-time sorting/filtering)
//     const filteredUsers = useMemo(() => {
//         return allUsers.filter((user) => {
//             const matchesSearch =
//                 user.fullName.toLowerCase().includes(filters.search.toLowerCase()) ||
//                 user.email.toLowerCase().includes(filters.search.toLowerCase());

//             const matchesRole = filters.role === "" || user.userRole === filters.role;

//             const matchesDate = !filters.registrationDate ||
//                 new Date(user.registrationDate).toDateString() === new Date(filters.registrationDate).toDateString();

//             return matchesSearch && matchesRole && matchesDate;
//         });
//     }, [allUsers, filters]);

//     // 3. AUTO-UPDATING COUNTERS
//     const stats = useMemo(() => ({
//         total: allUsers.length,
//         admins: allUsers.filter(u => u.userRole === 'admin').length,
//         doctors: allUsers.filter(u => u.userRole === 'doctor').length,
//         users: allUsers.filter(u => u.userRole === 'user').length,
//     }), [allUsers]);

//     const handleFilterChange = (e) => {
//         setFilters({ ...filters, [e.target.name]: e.target.value });
//     };

//     const handleDelete = async (userId) => {
//         if (!window.confirm("Delete this user?")) return;
//         const token = localStorage.getItem("authToken");
//         try {
//             await axios.delete(`http://localhost:5000/users/${userId}`, {
//                 headers: { Authorization: `Bearer ${token}` },
//             });
//             toast.success("User removed");
//             fetchUsers();
//         } catch (err) {
//             toast.error("Delete failed");
//         }
//     };

//     const handleRoleChange = async (userId, newRole) => {
//         const token = localStorage.getItem("authToken");
//         try {
//             await axios.put(
//                 `http://localhost:5000/users/role`,
//                 { userId, role: newRole },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );
//             toast.success(`Role updated to ${newRole}`);
//             fetchUsers();
//         } catch (err) {
//             toast.error("Update failed");
//         }
//     };

//     return (
//         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto mt-10 p-4 md:p-6">
//             <div className="flex flex-col items-center mb-8">
//                 <UsersIcon className="w-12 h-12 text-primary mb-2" />
//                 <h2 className="text-3xl font-bold">Activity Log Management</h2>
//             </div>

//             {/* ANIMATED COUNTERS */}
//             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//                 {[
//                     { label: "Total", value: stats.total, icon: <UsersIcon />, color: "text-primary" },
//                     { label: "Doctors", value: stats.doctors, icon: <Stethoscope />, color: "text-secondary" },
//                     { label: "Admins", value: stats.admins, icon: <ShieldCheck />, color: "text-accent" },
//                     { label: "Users", value: stats.users, icon: <User />, color: "text-neutral" },
//                 ].map((s, i) => (
//                     <motion.div
//                         key={s.label}
//                         whileHover={{ y: -5 }}
//                         className="stat bg-base-100 border border-base-200 shadow rounded-2xl p-4 overflow-hidden"
//                     >
//                         <div className={`stat-figure ${s.color} opacity-60`}>{s.icon}</div>
//                         <div className="stat-title text-xs uppercase font-bold tracking-wider">{s.label}</div>
//                         <motion.div
//                             key={s.value}
//                             initial={{ scale: 1.5, filter: "blur(4px)" }}
//                             animate={{ scale: 1, filter: "blur(0px)" }}
//                             className={`stat-value ${s.color} text-2xl md:text-3xl`}
//                         >
//                             {s.value}
//                         </motion.div>
//                     </motion.div>
//                 ))}
//             </div>

//             {/* REAL-TIME FILTERS */}
//             <div className="bg-base-200 p-4 rounded-2xl mb-6 shadow-inner grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div className="relative">
//                     <Search className="absolute left-3 top-3.5 w-4 h-4 opacity-40" />
//                     <input
//                         name="search"
//                         placeholder="Type to search name or email..."
//                         className="input input-bordered w-full pl-10 focus:input-primary transition-all"
//                         value={filters.search}
//                         onChange={handleFilterChange}
//                     />
//                 </div>
//                 <div className="relative">
//                     <Filter className="absolute left-3 top-3.5 w-4 h-4 opacity-40" />
//                     <select
//                         name="role"
//                         className="select select-bordered w-full pl-10"
//                         value={filters.role}
//                         onChange={handleFilterChange}
//                     >
//                         <option value="">All Roles</option>
//                         <option value="user">User Only</option>
//                         <option value="doctor">Doctors Only</option>
//                         <option value="admin">Admins Only</option>
//                     </select>
//                 </div>
//                 <div className="relative">
//                     <Calendar className="absolute left-3 top-3.5 w-4 h-4 opacity-40 pointer-events-none" />
//                     <input
//                         // Logic to handle placeholder in Date Input
//                         type={filters.registrationDate ? "date" : "text"}
//                         onFocus={(e) => (e.target.type = "date")}
//                         onBlur={(e) => (!e.target.value ? (e.target.type = "text") : null)}
//                         placeholder="Register date"
//                         name="registrationDate"
//                         className="input input-bordered w-full pl-10 focus:input-primary transition-all"
//                         value={filters.registrationDate}
//                         onChange={handleFilterChange}
//                     />
//                 </div>
//             </div>

//             {/* TABLE SECTION */}
//             {loading ? (
//                 <div className="flex flex-col items-center py-20">
//                     <span className="loading loading-dots loading-lg text-primary"></span>
//                 </div>
//             ) : (
//                 <div className="overflow-x-auto bg-base-100 rounded-2xl border border-base-200 shadow-sm">
//                     <table className="table table-zebra w-full">
//                         <thead className="bg-base-200">
//                             <tr>
//                                 <th>Name</th>
//                                 <th>Email</th>
//                                 <th>Role</th>
//                                 <th>Joined</th>
//                                 <th className="text-center">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             <AnimatePresence mode="popLayout">
//                                 {filteredUsers.map((user) => (
//                                     <motion.tr
//                                         key={user._id}
//                                         layout
//                                         initial={{ opacity: 0, scale: 0.98 }}
//                                         animate={{ opacity: 1, scale: 1 }}
//                                         exit={{ opacity: 0, scale: 0.9, x: -20 }}
//                                         transition={{ duration: 0.2 }}
//                                     >
//                                         <td>
//                                             <div className="font-bold">{user.fullName}</div>
//                                             <div className="text-[10px] opacity-40 font-mono">{user._id}</div>
//                                         </td>
//                                         <td>{user.email}</td>
//                                         <td>
//                                             <span className={`badge badge-sm p-3 gap-1 ${user.userRole === 'admin' ? 'badge-accent' :
//                                                 user.userRole === 'doctor' ? 'badge-secondary' : 'badge-ghost'
//                                                 }`}>
//                                                 {user.userRole === 'admin' && <ShieldCheck size={12} />}
//                                                 {user.userRole === 'doctor' && <Stethoscope size={12} />}
//                                                 <span className="capitalize">{user.userRole}</span>
//                                             </span>
//                                         </td>
//                                         <td className="text-sm">{new Date(user.registrationDate).toLocaleDateString()}</td>
//                                         <td>
//                                             <div className="flex items-center justify-center gap-2">
//                                                 <select
//                                                     value={user.userRole}
//                                                     onChange={(e) => handleRoleChange(user._id, e.target.value)}
//                                                     className="select select-xs select-bordered"
//                                                 >
//                                                     <option value="user">User</option>
//                                                     <option value="doctor">Doctor</option>
//                                                     <option value="admin">Admin</option>
//                                                 </select>
//                                                 <button
//                                                     onClick={() => handleDelete(user._id)}
//                                                     className="btn btn-xs btn-error btn-outline btn-square"
//                                                 >
//                                                     <Trash2 size={14} />
//                                                 </button>
//                                             </div>
//                                         </td>
//                                     </motion.tr>
//                                 ))}
//                             </AnimatePresence>
//                         </tbody>
//                     </table>
//                     {!filteredUsers.length && (
//                         <div className="text-center py-20 opacity-50">No users match your search.</div>
//                     )}
//                 </div>
//             )}
//         </motion.div>
//     );
// };

// export default Users;


import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Filter, Trash2, User, ShieldCheck,
    Stethoscope, Calendar, Users as UsersIcon
} from "lucide-react";

const Users = () => {
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState({
        search: "",
        role: "",
        registrationDate: "",
    });

    const navigate = useNavigate();

    // FETCH USERS
    const fetchUsers = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        if (!token) {
            setLoading(false);
            navigate("/login");
            return;
        }

        try {
            const res = await axios.get("/users", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAllUsers(res.data);
        } catch (err) {
            setError("Unable to fetch users.");
            toast.error("Session expired or connection error.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // SAFE FILTERING (BUG FIX)
    const filteredUsers = useMemo(() => {
        return allUsers.filter((user) => {
            const fullName = typeof user.fullName === "string" ? user.fullName : "";
            const email = typeof user.email === "string" ? user.email : "";

            const matchesSearch =
                fullName.toLowerCase().includes(filters.search.toLowerCase()) ||
                email.toLowerCase().includes(filters.search.toLowerCase());

            const matchesRole =
                !filters.role || user.userRole === filters.role;

            const matchesDate =
                !filters.registrationDate ||
                (user.registrationDate &&
                    new Date(user.registrationDate).toDateString() ===
                    new Date(filters.registrationDate).toDateString());

            return matchesSearch && matchesRole && matchesDate;
        });
    }, [allUsers, filters]);

    // COUNTERS
    const stats = useMemo(() => ({
        total: allUsers.length,
        admins: allUsers.filter(u => u.userRole === "admin").length,
        doctors: allUsers.filter(u => u.userRole === "doctor").length,
        users: allUsers.filter(u => u.userRole === "user").length,
    }), [allUsers]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Delete this user?")) return;
        const token = localStorage.getItem("authToken");
        try {
            await axios.delete(`/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("User removed");
            fetchUsers();
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        const token = localStorage.getItem("authToken");
        try {
            await axios.put(
                "/users/role",
                { userId, role: newRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Role updated to ${newRole}`);
            fetchUsers();
        } catch (err) {
            toast.error("Update failed");
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto mt-10 p-4 md:p-6">
            <div className="flex flex-col items-center mb-8">
                <UsersIcon className="w-12 h-12 text-primary mb-2" />
                <h2 className="text-3xl font-bold">Activity Log Management</h2>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Total", value: stats.total, icon: <UsersIcon />, color: "text-primary" },
                    { label: "Doctors", value: stats.doctors, icon: <Stethoscope />, color: "text-secondary" },
                    { label: "Admins", value: stats.admins, icon: <ShieldCheck />, color: "text-accent" },
                    { label: "Users", value: stats.users, icon: <User />, color: "text-neutral" },
                ].map((s) => (
                    <motion.div
                        key={s.label}
                        whileHover={{ y: -5 }}
                        className="stat bg-base-100 border border-base-200 shadow rounded-2xl p-4"
                    >
                        <div className={`stat-figure ${s.color} opacity-60`}>{s.icon}</div>
                        <div className="stat-title text-xs uppercase font-bold">{s.label}</div>
                        <div className={`stat-value ${s.color} text-2xl`}>
                            {s.value}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* FILTERS */}
            <div className="bg-base-200 p-4 rounded-2xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3.5 w-4 h-4 opacity-40" />
                    <input
                        name="search"
                        placeholder="Type to search name or email..."
                        className="input input-bordered w-full pl-10"
                        value={filters.search}
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-3.5 w-4 h-4 opacity-40" />
                    <select
                        name="role"
                        className="select select-bordered w-full pl-10"
                        value={filters.role}
                        onChange={handleFilterChange}
                    >
                        <option value="">All Roles</option>
                        <option value="user">User Only</option>
                        <option value="doctor">Doctors Only</option>
                        <option value="admin">Admins Only</option>
                    </select>
                </div>
                <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 w-4 h-4 opacity-40" />
                    <input
                        type={filters.registrationDate ? "date" : "text"}
                        onFocus={(e) => (e.target.type = "date")}
                        onBlur={(e) => (!e.target.value ? (e.target.type = "text") : null)}
                        placeholder="Register date"
                        name="registrationDate"
                        className="input input-bordered w-full pl-10"
                        value={filters.registrationDate}
                        onChange={handleFilterChange}
                    />
                </div>
            </div>

            {/* TABLE */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <span className="loading loading-dots loading-lg text-primary"></span>
                </div>
            ) : (
                <div className="overflow-x-auto bg-base-100 rounded-2xl border">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {filteredUsers.map((user) => (
                                    <motion.tr key={user._id}>
                                        <td>
                                            <div className="font-bold">{user.fullName || "N/A"}</div>
                                            <div className="text-[10px] opacity-40">{user._id}</div>
                                        </td>
                                        <td>{user.email || "N/A"}</td>
                                        <td>{user.userRole}</td>
                                        <td>
                                            {user.registrationDate
                                                ? new Date(user.registrationDate).toLocaleDateString()
                                                : "N/A"}
                                        </td>
                                        <td className="text-center">
                                            <select
                                                value={user.userRole}
                                                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                className="select select-xs select-bordered mr-2"
                                            >
                                                <option value="user">User</option>
                                                <option value="doctor">Doctor</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <button
                                                onClick={() => handleDelete(user._id)}
                                                className="btn btn-xs btn-error btn-outline"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>

                    {!filteredUsers.length && (
                        <div className="text-center py-20 opacity-50">
                            No users match your search.
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default Users;
