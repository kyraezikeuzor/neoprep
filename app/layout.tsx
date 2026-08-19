import type { Metadata } from "next";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tutormigo",
  description: "Get better at the SAT, one question at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:wght@400;500;600;700&family=Noto+Serif:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
        {/* Config must load before the MathJax bundle. Use \(...\) not $...$
            because stems often contain currency ($80). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.MathJax = {
                tex: {
                  inlineMath: [['\\\\(', '\\\\)']],
                  displayMath: [['\\\\[', '\\\\]']],
                  processEscapes: true
                },
                chtml: {
                  mtextInheritFont: true,
                  merrorInheritFont: true,
                  matchFontHeight: true,
                  scale: 1
                },
                options: {
                  skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
                }
              };
            `,
          }}
        />
      </head>
      <body className="h-full font-sans">
        <NextTopLoader
          color="#60A5FA"
          height={4}
          showSpinner={false}
          shadow={false}
          crawl
          speed={200}
          zIndex={9999}
        />
        {children}
        <Script
          id="mathjax-script"
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
