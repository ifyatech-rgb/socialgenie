"use client";

import { useEffect } from "react";

const LINKS = [
  { rel: "preconnect", href: "https://api.anthropic.com" },
  { rel: "preconnect", href: "https://api.heygen.com" },
  { rel: "dns-prefetch", href: "https://api.anthropic.com" },
  { rel: "dns-prefetch", href: "https://api.heygen.com" },
];

export function PreconnectLinks() {
  useEffect(() => {
    const nodes: HTMLLinkElement[] = [];
    LINKS.forEach(({ rel, href }) => {
      const link = document.createElement("link");
      link.rel = rel;
      link.href = href;
      document.head.appendChild(link);
      nodes.push(link);
    });
    return () => nodes.forEach((n) => n.remove());
  }, []);
  return null;
}
