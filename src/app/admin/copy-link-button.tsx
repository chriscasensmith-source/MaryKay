"use client";

import { useState } from "react";

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(window.location.origin + "/");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="rounded-xl bg-accent-100 px-4 py-2 text-sm font-semibold text-accent-700 transition hover:bg-accent-200"
    >
      {copied ? "Copied!" : "Copy signup link"}
    </button>
  );
}
