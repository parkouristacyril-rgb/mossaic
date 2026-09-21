import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mossaic — Creative Intelligence for Short-Form Video",
  description:
    "An AI system that watches every video you make and remembers what worked.",
};

// Set the theme from localStorage before first paint so there is no flash.
const THEME_BOOT = `(function(){try{var t=localStorage.getItem('mossaic-theme');}catch(e){}document.documentElement.dataset.theme=(t==='light'||t==='dark')?t:'dark';})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,300..700&family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="bg-noise">{children}</body>
    </html>
  );
}
