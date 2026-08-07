import { AlertCircle, Info } from "lucide-react";

export function AuthAlert({ children, kind = "error" }: Readonly<{ children: React.ReactNode; kind?: "error" | "info" }>) {
  const Icon = kind === "error" ? AlertCircle : Info;

  return (
    <div className={`form-alert${kind === "info" ? " info" : ""}`} role={kind === "error" ? "alert" : "status"}>
      <Icon size={18} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

