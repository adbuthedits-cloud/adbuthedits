"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import AccessDenied from "../../../components/AccessDenied";
import withPermission from "../../../components/withPermission";
import { getAuthToken, getAuthUser, hasPermission } from "../../../utils/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faShieldHalved, faPlus, faEdit, faTrash, faSave, faTimes,
    faSpinner, faUsers, faCheckCircle, faCircleXmark
} from "@fortawesome/free-solid-svg-icons";

// All modules and their available actions
const ALL_MODULES = [
    { key: "dashboard",       label: "Dashboard",           actions: ["view"] },
    { key: "seo",             label: "SEO Management",      actions: ["view", "edit"] },
    { key: "orders",          label: "All Orders",          actions: ["view", "edit", "delete", "assign", "pickup"] },
    { key: "order_tracking",  label: "Order Tracking",      actions: ["view"] },
    { key: "my_tasks",        label: "My Tasks",            actions: ["view"] },
    { key: "products",        label: "All Products",     actions: ["view", "edit", "delete"] },
    { key: "master_data",     label: "Master Data",      actions: ["view", "edit", "delete"] },
    { key: "blogs",           label: "Blogs",            actions: ["view", "edit", "delete"] },
    { key: "blog_categories", label: "Blog Categories",  actions: ["view", "edit", "delete"] },
    { key: "reviews",         label: "Reviews",          actions: ["view", "edit", "delete"] },
    { key: "payments",        label: "Payments",         actions: ["view"] },
    { key: "enquiries",       label: "Enquiries",        actions: ["view", "edit"] },
    { key: "marketing",       label: "Coupons & Promo",  actions: ["view", "edit", "delete"] },
    { key: "users",           label: "Customers",        actions: ["view", "edit", "delete"] },
    { key: "staff",           label: "Staff Members",    actions: ["view", "edit", "delete"] },
    { key: "media_manager",   label: "Media Manager",    actions: ["view", "edit", "delete"] },
    { key: "settings",        label: "Settings",         actions: ["view", "edit"] },
];

function PermissionMatrix({ permissions, onChange, readOnly = false }) {
    const toggle = (moduleKey, action) => {
        if (readOnly) return;
        const current = permissions[moduleKey] || [];
        const next = current.includes(action)
            ? current.filter(a => a !== action)
            : [...current, action];
        onChange({ ...permissions, [moduleKey]: next });
    };

    return (
        <div className="overflow-x-auto rounded-xl border border-[#2d1b4e]">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-[#2d1b4e] text-gray-400">
                        <th className="text-left px-4 py-3 font-semibold">Module</th>
                        <th className="px-4 py-3 font-semibold text-blue-400">View</th>
                        <th className="px-4 py-3 font-semibold text-yellow-400">Edit</th>
                        <th className="px-4 py-3 font-semibold text-red-400">Delete</th>
                        <th className="px-4 py-3 font-semibold text-green-400">Assign</th>
                        <th className="px-4 py-3 font-semibold text-purple-400">Pickup</th>
                    </tr>
                </thead>
                <tbody>
                    {ALL_MODULES.map((mod, idx) => {
                        const granted = permissions[mod.key] || [];
                        return (
                            <tr key={mod.key} className={`border-t border-[#2d1b4e] ${idx % 2 === 0 ? "bg-[#1a1025]" : "bg-[#1e1530]"}`}>
                                <td className="px-4 py-3 text-gray-300 font-medium">{mod.label}</td>
                                {["view", "edit", "delete", "assign", "pickup"].map(action => {
                                    const available = mod.actions.includes(action);
                                    const checked = granted.includes(action);
                                    if (!available) {
                                        return <td key={action} className="px-4 py-3 text-center"><span className="text-gray-700">-</span></td>;
                                    }
                                    return (
                                        <td key={action} className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => toggle(mod.key, action)}
                                                disabled={readOnly}
                                                className={`w-8 h-8 rounded-full border-2 transition-all duration-200 flex items-center justify-center mx-auto ${
                                                    checked
                                                        ? action === "view"   ? "bg-blue-500 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                                                        : action === "edit"   ? "bg-yellow-500 border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]"
                                                        : action === "delete" ? "bg-red-500 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                                                        : action === "assign" ? "bg-green-500 border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                                                        : "bg-purple-500 border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                                                        : "border-gray-600 hover:border-gray-400"
                                                } ${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
                                            >
                                                {checked && <FontAwesomeIcon icon={faCheckCircle} className="text-white text-xs" />}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function RolesPage() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isClient, setIsClient] = useState(false);

    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState(null);
    const [editingRole, setEditingRole] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [newRole, setNewRole] = useState({ name: "", description: "", permissions: {} });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    useEffect(() => {
        setIsClient(true);
        const u = getAuthUser();
        const t = getAuthToken();
        setUser(u);
        setToken(t);
        
        if (t) {
            fetchRoles(t);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchRoles = async (authToken) => {
        const headers = { Authorization: `Bearer ${authToken}` };
        try {
            setLoading(true);
            const res = await axios.get(`${apiUrl}/api/admin/roles`, { headers });
            setRoles(res.data);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load roles");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRole = async () => {
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        try {
            setSaving(true);
            setError("");
            if (editingRole.role_id) {
                await axios.put(`${apiUrl}/api/admin/roles/${editingRole.role_id}`, editingRole, { headers });
                setSuccess("Role updated successfully!");
            }
            await fetchRoles(token);
            setSelectedRole(editingRole);
            setEditingRole(null);
        } catch (err) {
            setError(err.response?.data?.error || "Save failed");
        } finally {
            setSaving(false);
            setTimeout(() => setSuccess(""), 3000);
        }
    };

    const handleCreateRole = async () => {
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        try {
            setSaving(true);
            setError("");
            if (!newRole.name.trim()) { setError("Role name is required"); return; }
            await axios.post(`${apiUrl}/api/admin/roles`, newRole, { headers });
            setSuccess("Role created successfully!");
            setShowCreate(false);
            setNewRole({ name: "", description: "", permissions: {} });
            await fetchRoles(token);
        } catch (err) {
            setError(err.response?.data?.error || "Create failed");
        } finally {
            setSaving(false);
            setTimeout(() => setSuccess(""), 3000);
        }
    };

    const handleDeleteRole = async (role) => {
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
        try {
            await axios.delete(`${apiUrl}/api/admin/roles/${role.role_id}`, { headers });
            setSuccess("Role deleted");
            setSelectedRole(null);
            await fetchRoles(token);
        } catch (err) {
            setError(err.response?.data?.error || "Delete failed");
        } finally {
            setTimeout(() => setSuccess(""), 3000);
        }
    };

    if (!isClient) {
        return (
            <div className="flex items-center justify-center py-20">
                <FontAwesomeIcon icon={faSpinner} spin className="text-[#a78bfa] text-2xl" />
            </div>
        );
    }

    if (!hasPermission(user, "staff", "view")) {
        return (
            <div className="p-8">
                <AccessDenied module="Role Management" action="view" />
            </div>
        );
    }

    const isSuperAdmin = user?.is_super_admin === true;
    const canEdit = hasPermission(user, "staff", "edit") && isSuperAdmin;

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-lg bg-[#a78bfa]/10 border border-[#a78bfa]/20 flex items-center justify-center">
                            <FontAwesomeIcon icon={faShieldHalved} className="text-[#a78bfa]" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Role Management</h1>
                    </div>
                    <p className="text-gray-500 text-sm ml-13">Configure granular permissions for each staff role</p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#a78bfa] hover:bg-[#9061f9] text-[#1a1025] rounded-lg font-bold transition-all"
                    >
                        <FontAwesomeIcon icon={faPlus} /> Create New Role
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCircleXmark} /> {error}
                </div>
            )}
            {success && (
                <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheckCircle} /> {success}
                </div>
            )}

            {showCreate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Create New Role</h2>
                            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Role Name *</label>
                                <input
                                    value={newRole.name}
                                    onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                                    placeholder="e.g. Content Writer"
                                    className="w-full bg-[#2d1b4e] border border-[#3b2a5f] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#a78bfa]"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Description</label>
                                <input
                                    value={newRole.description}
                                    onChange={e => setNewRole({ ...newRole, description: e.target.value })}
                                    placeholder="Describe what this role can do"
                                    className="w-full bg-[#2d1b4e] border border-[#3b2a5f] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#a78bfa]"
                                />
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="text-sm text-gray-400 mb-3 block font-semibold">Permission Matrix</label>
                            <PermissionMatrix
                                permissions={newRole.permissions}
                                onChange={p => setNewRole({ ...newRole, permissions: p })}
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 bg-[#2d1b4e] hover:bg-[#3b2a5f] border border-[#3b2a5f] text-gray-300 rounded-lg text-sm">Cancel</button>
                            <button onClick={handleCreateRole} disabled={saving} className="px-5 py-2.5 bg-[#a78bfa] hover:bg-[#9061f9] text-[#1a1025] rounded-lg font-bold text-sm flex items-center gap-2">
                                {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
                                Create Role
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#2d1b4e]">
                            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">All Roles</h2>
                        </div>
                        {loading ? (
                            <div className="p-8 flex justify-center">
                                <FontAwesomeIcon icon={faSpinner} spin className="text-[#a78bfa] text-2xl" />
                            </div>
                        ) : (
                            <div className="divide-y divide-[#2d1b4e]">
                                {roles.map(role => (
                                    <button
                                        key={role.role_id}
                                        onClick={() => { setSelectedRole(role); setEditingRole(null); }}
                                        className={`w-full text-left px-4 py-4 hover:bg-[#2d1b4e]/50 transition-colors ${selectedRole?.role_id === role.role_id ? "bg-[#2d1b4e]" : ""}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-white font-medium text-sm">{role.name}</div>
                                                <div className="text-gray-500 text-xs mt-0.5">{role.description || "No description"}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {role.is_system && (
                                                    <span className="text-[10px] bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20 px-2 py-0.5 rounded-full">System</span>
                                                )}
                                                <div className="flex items-center gap-1 text-gray-500 text-xs">
                                                    <FontAwesomeIcon icon={faUsers} className="text-[10px]" />
                                                    <span>{Object.keys(role.permissions || {}).length} mods</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2">
                    {!selectedRole ? (
                        <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-xl h-64 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <FontAwesomeIcon icon={faShieldHalved} className="text-3xl mb-3 text-gray-600" />
                                <p>Select a role to view its permissions</p>
                            </div>
                        </div>
                    ) : editingRole ? (
                        <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white">Editing: {editingRole.name}</h2>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingRole(null)} className="px-4 py-2 bg-[#2d1b4e] hover:bg-[#3b2a5f] border border-[#3b2a5f] text-gray-300 rounded-lg text-sm flex items-center gap-2">
                                        <FontAwesomeIcon icon={faTimes} /> Cancel
                                    </button>
                                    <button onClick={handleSaveRole} disabled={saving} className="px-4 py-2 bg-[#a78bfa] hover:bg-[#9061f9] text-[#1a1025] rounded-lg font-bold text-sm flex items-center gap-2">
                                        {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />} Save
                                    </button>
                                </div>
                            </div>
                            <input
                                value={editingRole.description || ""}
                                onChange={e => setEditingRole({ ...editingRole, description: e.target.value })}
                                placeholder="Role description"
                                className="w-full bg-[#2d1b4e] border border-[#3b2a5f] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#a78bfa] mb-6 text-sm"
                            />
                            <PermissionMatrix
                                permissions={editingRole.permissions || {}}
                                onChange={p => setEditingRole({ ...editingRole, permissions: p })}
                            />
                        </div>
                    ) : (
                        <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        {selectedRole.name}
                                        {selectedRole.is_system && (
                                            <span className="text-xs bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20 px-2 py-0.5 rounded-full font-normal">System Role</span>
                                        )}
                                    </h2>
                                    <p className="text-gray-500 text-sm">{selectedRole.description || "No description"}</p>
                                </div>
                                {canEdit && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingRole({ ...selectedRole })}
                                            className="px-4 py-2 bg-[#2d1b4e] hover:bg-[#3b2a5f] border border-[#3b2a5f] text-gray-300 rounded-lg text-sm flex items-center gap-2"
                                        >
                                            <FontAwesomeIcon icon={faEdit} /> Edit Permissions
                                        </button>
                                        {!selectedRole.is_system && (
                                            <button
                                                onClick={() => handleDeleteRole(selectedRole)}
                                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-center gap-2"
                                            >
                                                <FontAwesomeIcon icon={faTrash} /> Delete
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <PermissionMatrix
                                permissions={selectedRole.permissions || {}}
                                onChange={() => {}}
                                readOnly={true}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default withPermission(RolesPage, 'staff');
