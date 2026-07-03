export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-6 sm:px-6">
      <div className="w-full max-w-md">
        {children}
      </div>
    </main>
  );
}