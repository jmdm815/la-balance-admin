import "./globals.css";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Restaurant Admin Dashboard",
  description: "Kitchen dashboard for restaurant pickup orders"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <div className="logo-wrap">
              <Image src="/logo.svg" alt="Restaurant logo" width={110} height={76} priority />
              <div>
                <p className="brand-kicker">Kitchen Dashboard</p>
                <p className="brand-name">Order Management</p>
              </div>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
