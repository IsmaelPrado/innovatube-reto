import Link from "next/link";
import { Play } from "lucide-react";

export function Brand({ href = "/" }: Readonly<{ href?: string }>) {
  return (
    <Link className="brand" href={href} aria-label="InnovaTube, inicio">
      <span className="brand-mark" aria-hidden="true">
        <Play size={18} fill="currentColor" />
      </span>
      <span>InnovaTube</span>
    </Link>
  );
}

