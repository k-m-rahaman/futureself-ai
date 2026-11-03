"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, GitFork } from "lucide-react";
import "../app/landing.css";

const links = [
  { label: "Studio", href: "/studio" },
  { label: "Explore", href: "/explore" },
  { label: "Compare", href: "/compare" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "History", href: "/history" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="fs-nav">
      <div className="fs-nav-inner">
        <Link href="/" className="fs-brand" aria-label="FutureSelf AI home">
          <span className="fs-brand-mark"><GitFork size={19} aria-hidden="true" /></span>
          <span>FutureSelf<span className="fs-brand-ai"> AI</span></span>
        </Link>
        <nav className="fs-nav-links" aria-label="Main navigation">
          {links.map(({ label, href }) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <Link className="fs-nav-action" href="/studio">
          Start exploring <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
