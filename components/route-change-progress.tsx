"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function RouteChangeProgress() {
  const pathname = usePathname();
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let NProgress: { start: () => void; done: () => void; configure: (o: { showSpinner: boolean }) => void } | null = null;
    try {
      NProgress = require("nprogress");
    } catch {
      return;
    }
    if (!NProgress) return;
    NProgress.configure({ showSpinner: false });

    const start = () => {
      if (doneTimerRef.current) {
        clearTimeout(doneTimerRef.current);
        doneTimerRef.current = null;
      }
      NProgress?.start();
    };

    const done = () => {
      NProgress?.done();
      if (doneTimerRef.current) {
        clearTimeout(doneTimerRef.current);
        doneTimerRef.current = null;
      }
    };

    const scheduleDone = () => {
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
      doneTimerRef.current = setTimeout(() => {
        done();
      }, 280);
    };

    start();
    scheduleDone();

    return () => {
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    };
  }, [pathname]);

  return null;
}
