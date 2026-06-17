import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | CarbonCoach AI",
    default: "CarbonCoach AI - Understand & Reduce Your Carbon Footprint",
  },
  description:
    "AI-powered insights to help you understand, track, simulate, and reduce your carbon footprint.",
  keywords: ["carbon footprint", "AI", "sustainability", "climate change"],
  other: {
    // Tells DarkReader to leave this page alone — our app has its own dark mode
    "darkreader-lock": "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth dark" suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" />
      </head>
      <body
        suppressHydrationWarning
        className="font-sans min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary"
      >
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}

