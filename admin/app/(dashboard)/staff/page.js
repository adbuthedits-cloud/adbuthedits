"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus, faShieldAlt, faHeadset, faPenNib, faTrash, faEdit,
    faToggleOn, faToggleOff, faUserTie, faBullhorn, faBook,
    faTimes, faCheck, faCopy, faRefresh, faShieldHalved, faExternalLinkAlt
} from "@fortawesome/free-solid-svg-icons";
import { getAuthToken, getAuthUser, hasPermission } from "../../../utils/auth";
import withPermission from "../../../components/withPermission";

// Role badge colors by common role name keywords
const ROLE_COLORS = {
    admin:     "text-red-400    bg-red-500/10    border-red-500/20",
    manager:   "text-orange-400 bg-orange-500/10 border-orange-500/20",
    editor:    "text-purple-400 bg-purple-500/10 border-purple-500/20",
    marketing: "text-pink-400   bg-pink-500/10   border-pink-500/20",
    content:   "text-blue-300   bg-blue-500/10   border-blue-500/20",
    support:   "text-cyan-400   bg-cyan-500/10   border-cyan-500/20",
};

const ROLE_ICONS = {
    admin:     faShieldAlt,
    manager:   faUserTie,
    editor:    faPenNib,
    marketing: faBullhorn,
    content:   faBook,
    support:   faHeadset,
};

function getRoleBadge(roleName = "") {
    const key = Object.keys(ROLE_COLORS).find(k => roleName.toLowerCase().includes(k)) || "support";
    return { color: ROLE_COLORS[key], icon: ROLE_ICONS[key] || faShieldHalved };
}

const WORDS = ["Creative", "Studio", "Design", "Vision", "Craft", "Smart", "Digital", "Elite", "Prime", "Pixel"];
const SYMBOLS = ["@", "#", "!", "$", "&"];

function generatePassword() {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const num = Math.floor(100 + Math.random() * 900);
    const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `Adbuth${word}${sym}${num}${suffix}`;
}

const emptyForm = { first_name: "", last_name: "", email: "", password: "", role_id: "" };

function StaffPage() {
    const user = getAuthUser();
    const canEdit = hasPermission(user, "staff", "edit");
    const canDelete = hasPermission(user, "staff", "delete");

    const [staff, setStaff] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState(null);
    const [selected, setSelected] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const authHeaders = { Authorization: `Bearer ${getAuthToken()}` };

    // Fetch staff and roles together
    const fetchData = useCallback(async () => {
        try {
            const [staffRes, rolesRes] = await Promise.all([
                axios.get(`${apiUrl}/api/admin/staff`, { headers: authHeaders }),
                axios.get(`${apiUrl}/api/admin/roles`, { headers: authHeaders }),
            ]);
            setStaff(staffRes.data);
            setRoles(rolesRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [apiUrl]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const getRoleById = (id) => roles.find(r => r.role_id === id || r.role_id === Number(id));
    const getRoleByName = (name) => roles.find(r => r.name?.toLowerCase() === name?.toLowerCase());

    const openAdd = () => {
        setFormData({ ...emptyForm, password: generatePassword(), role_id: roles[0]?.role_id || "" });
        setError("");
        setModalMode("add");
    };

    const openEdit = (member) => {
        setSelected(member);
        const roleId = member.role_id || getRoleByName(member.role)?.role_id || "";
        setFormData({
            first_name: member.first_name || "",
            last_name: member.last_name || "",
            email: member.email || "",
            password: "",
            role_id: roleId,
        });
        setError("");
        setModalMode("edit");
    };

    const closeModal = () => { setModalMode(null); setSelected(null); setError(""); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const headers = authHeaders;
            const payload = { ...formData };
            if (!payload.password) delete payload.password;

            if (modalMode === "add") {
                await axios.post(`${apiUrl}/api/admin/staff`, payload, { headers });
            } else {
                await axios.put(`${apiUrl}/api/admin/staff/${selected.admin_id}`, payload, { headers });
            }
            closeModal();
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || "An error occurred.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (member) => {
        try {
            await axios.put(`${apiUrl}/api/admin/staff/${member.admin_id}`,
                { is_active: !member.is_active },
                { headers: authHeaders }
            );
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update status.");
        }
    };

    const handleDelete = async (member) => {
        if (!confirm(`Delete ${member.first_name} ${member.last_name}? This cannot be undone.`)) return;
        try {
            await axios.delete(`${apiUrl}/api/admin/staff/${member.admin_id}`, { headers: authHeaders });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete staff member.");
        }
    };

    const copyPassword = () => {
        navigator.clipboard.writeText(formData.password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Stats: count staff per role
    const roleCounts = roles.map(role => ({
        ...role,
        count: staff.filter(s => s.role_id === role.role_id || s.role?.toLowerCase() === role.name?.toLowerCase()).length
    }));

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Staff Management</h1>
                    <p className="text-gray-400">Manage team members and their assigned roles</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/roles"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#2d1b4e] text-gray-400 hover:text-[#a78bfa] hover:border-[#a78bfa]/40 text-sm transition-colors">
                        <FontAwesomeIcon icon={faShieldHalved} className="text-sm" />
                        Manage Roles
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[10px]" />
                    </Link>
                    {canEdit && (
                        <button onClick={openAdd}
                            className="bg-[#7D287E] hover:bg-[#6a226b] text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-purple-900/30">
                            <FontAwesomeIcon icon={faPlus} className="text-sm" /> Add Member
                        </button>
                    )}
                </div>
            </div>

            {/* Role Stats */}
            {roleCounts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
                    {roleCounts.map(role => {
                        return (
                            <div key={role.role_id} className="bg-[#1E1628] rounded-xl p-4 border border-[#2d1b4e]">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 truncate">{role.name}</p>
                                <p className="text-2xl font-bold text-white">{role.count}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Staff Table */}
            {loading ? (
                <div className="text-center text-gray-400 py-20">Loading staff...</div>
            ) : (
                <div className="bg-[#1E1628] rounded-2xl border border-[#2d1b4e] overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#130C1C] border-b border-[#2d1b4e]">
                                {["Employee", "Employee ID", "Username", "Role", "Permissions", "Status", "Last Login", ""].map(h => (
                                    <th key={h} className="text-left px-5 py-3.5 text-[11px] text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map((member) => {
                                const roleObj = getRoleById(member.role_id) || getRoleByName(member.role);
                                const roleName = roleObj?.name || member.role || "Unknown";
                                const badge = getRoleBadge(roleName);
                                const isSuperAdmin = member.is_super_admin === true;
                                const moduleCount = roleObj ? Object.keys(roleObj.permissions || {}).length : 0;

                                return (
                                    <tr key={member.admin_id} className="border-b border-[#2d1b4e]/50 hover:bg-[#251832] transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7D287E] to-[#4a1070] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                                    {(member.first_name?.[0] || "").toUpperCase()}{(member.last_name?.[0] || "").toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium text-sm">{member.first_name} {member.last_name}</p>
                                                    <p className="text-[11px] text-gray-500">{member.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs font-mono text-[#c084fc] bg-[#7D287E]/10 px-2.5 py-1 rounded-md border border-[#7D287E]/20">
                                                {member.staff_id || "-"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-gray-300 font-mono">
                                            {member.username || "-"}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 w-fit font-medium ${badge.color}`}>
                                                <FontAwesomeIcon icon={badge.icon} className="text-[9px]" />
                                                {roleName}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {isSuperAdmin ? (
                                                <span className="text-xs text-green-400 font-medium">Full Access</span>
                                            ) : (
                                                <span className="text-xs text-gray-400">
                                                    {moduleCount > 0 ? `${moduleCount} modules` : "Role-based"}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {canEdit ? (
                                                <button type="button" onClick={() => handleToggleActive(member)}>
                                                    <FontAwesomeIcon
                                                        icon={member.is_active ? faToggleOn : faToggleOff}
                                                        className={`text-xl ${member.is_active ? "text-green-400" : "text-gray-600"}`}
                                                    />
                                                </button>
                                            ) : (
                                                <FontAwesomeIcon
                                                    icon={member.is_active ? faToggleOn : faToggleOff}
                                                    className={`text-xl ${member.is_active ? "text-green-400/40" : "text-gray-700"} cursor-not-allowed`}
                                                />
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-[11px] text-gray-500 whitespace-nowrap">
                                            {member.last_login
                                                ? new Date(member.last_login).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                                                : "Never"}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1.5">
                                                {canEdit && (
                                                    <button type="button" onClick={() => openEdit(member)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#7D287E]/20 transition-colors">
                                                        <FontAwesomeIcon icon={faEdit} className="text-sm" />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button type="button" onClick={() => handleDelete(member)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                                        <FontAwesomeIcon icon={faTrash} className="text-sm" />
                                                    </button>
                                                )}
                                                {!canEdit && !canDelete && (
                                                    <span className="text-[10px] text-gray-600 italic">View Only</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {staff.length === 0 && (
                        <div className="text-center py-20 text-gray-500">No staff members found.</div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {(modalMode === "add" || modalMode === "edit") && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-[#1E1628] rounded-2xl p-8 w-full max-w-lg border border-[#2d1b4e] shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-7">
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {modalMode === "add" ? "Add Staff Member" : "Edit Staff Member"}
                                    </h2>
                                    {modalMode === "add" && (
                                        <p className="text-xs text-gray-500 mt-0.5">A welcome email with credentials will be sent automatically.</p>
                                    )}
                                </div>
                                <button type="button" onClick={closeModal} className="text-gray-500 hover:text-white p-1 transition-colors">
                                    <FontAwesomeIcon icon={faTimes} className="text-lg" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Name */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">First Name</label>
                                        <input type="text" required
                                            className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#7D287E] transition-colors"
                                            value={formData.first_name}
                                            onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Last Name</label>
                                        <input type="text"
                                            className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#7D287E] transition-colors"
                                            value={formData.last_name}
                                            onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Email Address</label>
                                    <input type="email" required={modalMode === "add"}
                                        className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#7D287E] transition-colors"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">
                                        {modalMode === "edit" ? "New Password (leave blank to keep current)" : "Temporary Password"}
                                    </label>
                                    <div className="flex gap-2">
                                        <input type="text"
                                            required={modalMode === "add"}
                                            className="flex-1 bg-[#130C1C] border border-[#2d1b4e] rounded-lg px-4 py-2.5 text-[#fbbf24] text-sm font-mono outline-none focus:border-[#7D287E] transition-colors"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                        <button type="button" onClick={() => setFormData({ ...formData, password: generatePassword() })}
                                            title="Generate new password"
                                            className="px-3 py-2.5 bg-[#130C1C] border border-[#2d1b4e] rounded-lg text-gray-400 hover:text-white hover:border-[#7D287E] transition-colors">
                                            <FontAwesomeIcon icon={faRefresh} className="text-sm" />
                                        </button>
                                        <button type="button" onClick={copyPassword}
                                            title="Copy password"
                                            className={`px-3 py-2.5 border rounded-lg transition-colors ${copied ? "border-green-500 text-green-400 bg-green-500/10" : "bg-[#130C1C] border-[#2d1b4e] text-gray-400 hover:text-white hover:border-[#7D287E]"}`}>
                                            <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-sm" />
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-600 mt-1.5">Auto-generated branded password. Regenerate until satisfied.</p>
                                </div>

                                {/* Role - dynamic from Role Management */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-gray-400 text-xs uppercase tracking-wider">Role</label>
                                        <Link href="/roles" className="text-[11px] text-[#a78bfa] hover:underline flex items-center gap-1">
                                            <FontAwesomeIcon icon={faShieldHalved} className="text-[9px]" /> Manage Roles
                                        </Link>
                                    </div>
                                    <select
                                        className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#7D287E] transition-colors"
                                        value={formData.role_id}
                                        onChange={e => setFormData({ ...formData, role_id: e.target.value })}>
                                        <option value="">- Select a Role -</option>
                                        {roles.map(r => (
                                            <option key={r.role_id} value={r.role_id}>
                                                {r.name}{r.description ? ` - ${r.description}` : ""}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[11px] text-gray-600 mt-1.5">
                                        Permissions are inherited from the selected role. Configure roles in Role Management.
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                                )}

                                <div className="flex justify-end gap-3 pt-2 border-t border-[#2d1b4e] mt-4">
                                    <button type="button" onClick={closeModal}
                                        className="px-5 py-2.5 text-gray-400 hover:text-white text-sm transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={saving}
                                        className="bg-[#7D287E] hover:bg-[#6a226b] disabled:opacity-50 text-white px-7 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                                        {saving ? "Saving..." : (modalMode === "add" ? "Create & Send Invite" : "Save Changes")}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default withPermission(StaffPage, "staff");
