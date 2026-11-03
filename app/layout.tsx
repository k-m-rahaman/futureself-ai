import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import Nav from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "FutureSelf AI · One Decision. Multiple Futures.", template: "%s · FutureSelf AI" },
  description: "Explore plausible paths, understand the trade-offs, and turn a decision into your next move.",
};
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={GeistSans.variable} data-scroll-behavior="smooth"><body><a className="skip-link" href="#content">Skip to content</a><Nav /><main id="content">{children}</main></body></html>;
}
