import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Tournament Ops Starter",
  description: "Shared scoreboard, scouting report, and livestream board for small tournaments.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
