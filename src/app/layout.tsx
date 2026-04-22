import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = { title: "UGC CRM — Genos" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex">
          {/* Sidebar */}
          <aside className="w-56 bg-[#111118] border-r border-[#1e1e2e] flex flex-col fixed h-full">
            <div className="p-4 border-b border-[#1e1e2e]">
              <h1 className="text-sm font-bold tracking-widest text-[#00FF88]">GENOS UGC</h1>
              <p className="text-[10px] text-[#666] mt-0.5">Creator Intelligence</p>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {[
                ["/", "Dashboard", "◉"],
                ["/campaigns", "Campaigns", "◈"],
                ["/videos", "Videos", "◇"],
                ["/analytics", "Analytics", "◐"],
                ["/income", "Income", "◎"],
                ["/import", "Import", "◑"],
                ["/settings", "Settings", "⚙"],
              ].map(([href, label, icon]) => (
                <Link
                  key={href}
                  href={href as string}
                  className="flex items-center gap-2 px-3 py-2 rounded text-xs text-[#888] hover:text-[#fff] hover:bg-[#1a1a2e] transition-colors"
                >
                  <span className="text-[10px]">{icon}</span>
                  {label}
                </Link>
              ))}
            </nav>
            <div className="p-3 border-t border-[#1e1e2e]">
              <p className="text-[10px] text-[#333]">Instance: Oracle</p>
              <p className="text-[10px] text-[#333]">April 22, 2026</p>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 ml-56">{children}</main>
        </div>
      </body>
    </html>
  );
}
