import './globals.css';

export const metadata = {
  title: 'Task Dashboard',
  description: 'Tasks, metadata, and email drafts'
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
