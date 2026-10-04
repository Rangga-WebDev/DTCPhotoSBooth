/** @format */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Link dengan transisi shutter; klik tengah / modifier tetap perilaku bawaan browser.
export default function ShutterLink({ href, children, onClick, ...props }) {
  const router = useRouter();
  const timerRef = useRef(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  function handleClick(event) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    event.preventDefault();
    setClosing(true);
    timerRef.current = window.setTimeout(() => router.push(href), 320);
  }

  return (
    <>
      <Link href={href} onClick={handleClick} {...props}>
        {children}
      </Link>
      {closing && (
        <div className="dtc-shutter dtc-shutter--close" aria-hidden="true" />
      )}
    </>
  );
}
