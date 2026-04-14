import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Guy Olympics Control Room",
  description: "Shared scoreboard, scouting report, and livestream board for the boys.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
