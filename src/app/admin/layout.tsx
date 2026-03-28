import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-950 font-sans antialiased text-slate-200">
            <AdminSidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                        <span>Admin</span>
                        <span>/</span>
                        <span className="text-white">Dashboard</span>
                    </div>
                </header>
                <div className="flex-1 overflow-hidden flex flex-col p-8 min-h-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
