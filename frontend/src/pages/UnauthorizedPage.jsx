export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="rounded-xl bg-white p-8 shadow">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p className="mt-2 text-sm text-slate-600">You do not have permission to view this page.</p>
      </div>
    </div>
  );
}
