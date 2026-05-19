import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      <AdminSidebar />
      <main className="pl-60">
        {children}
      </main>
    </div>
  );
}
