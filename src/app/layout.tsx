import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastContext";

export const metadata: Metadata = {
  title: "CRM — Korzinka Ishlab Chiqarish",
  description: "Korzinka ishlab chiqarish sexi uchun ERP/CRM boshqaruv tizimi",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            {/* Desktop layout: sidebar + main */}
            <div className="desktop-layout">
              <Sidebar />
              <main
                style={{
                  flex: 1,
                  overflow: "auto",
                  padding: "1.5rem",
                  background: "var(--bg-primary)",
                  transition: "background 0.3s ease",
                }}
              >
                {children}
              </main>
            </div>

            {/* Mobile layout: full content + bottom nav */}
            <div className="mobile-layout">
              <main
                style={{
                  flex: 1,
                  overflow: "auto",
                  padding: "0.875rem",
                  background: "var(--bg-primary)",
                  paddingBottom: "76px", /* above bottom nav */
                  minHeight: "100vh",
                }}
              >
                {children}
              </main>
              <BottomNav />
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
