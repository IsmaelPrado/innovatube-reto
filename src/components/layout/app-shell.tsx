"use client";

import { fetchUserAttributes, getCurrentUser, signOut } from "aws-amplify/auth";
import { Heart, LogOut, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand } from "@/components/brand";
import { isAmplifyConfigured } from "@/components/providers/amplify-provider";

const navigation = [
  { href: "/videos", label: "Videos", icon: Search },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!isAmplifyConfigured) {
      setDisplayName("Entorno local");
      setLoading(false);
      return;
    }

    async function loadUser() {
      try {
        const [user, attributes] = await Promise.all([getCurrentUser(), fetchUserAttributes()]);
        setDisplayName(attributes.given_name ?? user.username);
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    void loadUser();
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      if (isAmplifyConfigured) await signOut();
      router.replace("/login");
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) {
    return <main className="page-loader" aria-live="polite"><span className="dark-spinner" />Cargando tu espacio...</main>;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Brand />
        <nav className="app-nav" aria-label="Navegación principal">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={pathname === href ? "nav-link active" : "nav-link"}>
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="user-menu">
          <span className="user-label">Hola, {displayName}</span>
          <button className="header-icon-button" type="button" onClick={handleSignOut} disabled={signingOut} aria-label="Cerrar sesión" title="Cerrar sesión">
            <LogOut size={19} aria-hidden="true" />
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}

