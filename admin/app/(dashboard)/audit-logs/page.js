"use client";
import AdminLayout from "../../../components/AdminLayout";
import withPermission from "../../../components/withPermission";

function AuditLogsPage() {
    return (
        <AdminLayout>
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-2xl max-w-lg w-full shadow-2xl text-center px-6 py-16">
                    <div className="text-4xl mb-4">🚫</div>
                    <h1 className="text-2xl font-bold text-white mb-3">Audit Logs Removed</h1>
                    <p className="text-gray-400 text-sm">Audit log functionality has been removed from this system.</p>
                </div>
            </div>
        </AdminLayout>
    );
}

export default withPermission(AuditLogsPage, "staff");
