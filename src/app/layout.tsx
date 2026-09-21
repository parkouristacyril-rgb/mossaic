import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mosaic",
  description: "Creative intelligence for short-form video",
};

const NAV = [
  { href: "/", label: "Home" },
  { href: "/share", label: "Capture" },
  { href: "/patterns", label: "Patterns" },
  { href: "/entities", label: "Entities" },
  { href: "/ideas", label: "Video ideas" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand">MOSAIC</div>
            <nav>
              {NAV.map((item) => (
                <a key={item.href} className="nav-item" href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
