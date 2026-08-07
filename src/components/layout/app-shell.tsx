"use client";

import { fetchUserAttributes, getCurrentUser, signOut } from "aws-amplify/auth";
import {
  ChevronDown,
  Clapperboard,
  Heart,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Brand } from "@/components/brand";
import { isAmplifyConfigured } from "@/components/providers/amplify-provider";

type HeaderSearch = {
  value: string;
  placeholder: string;
  loading?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

type AppShellProps = Readonly<{
  children: React.ReactNode;
  search?: HeaderSearch;
}>;

const navigation = [
  { href: "/videos", label: "Videos", icon: Clapperboard },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
];

export function AppShell({ children, search }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [initials, setInitials] = useState("IT");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("innovatube-theme");
    if (storedTheme === "light" || storedTheme === "dark") setTheme(storedTheme);
  }, []);

  useEffect(() => {
    if (!isAmplifyConfigured) {
      setDisplayName("Entorno local");
      setInitials("EL");
      setLoading(false);
      return;
    }

    async function loadUser() {
      try {
        const [user, attributes] = await Promise.all([getCurrentUser(), fetchUserAttributes()]);
        const firstName = attributes.given_name?.trim();
        const familyName = attributes.family_name?.trim();
        setDisplayName(firstName ?? user.username);
        setInitials(
          `${firstName?.[0] ?? user.username[0] ?? "I"}${familyName?.[0] ?? ""}`.toUpperCase(),
        );
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    void loadUser();
  }, [router]);

  useEffect(() => {
    function closeMenus(event: PointerEvent) {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setSidebarOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeMenus);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem("innovatube-theme", nextTheme);
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      if (isAmplifyConfigured) await signOut();
      router.replace("/login");
    } finally {
      setSigningOut(false);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    search?.onSubmit();
  }

  if (loading) {
    return <main className="page-loader dark" aria-live="polite"><span className="dark-spinner" />Cargando tu espacio...</main>;
  }

  return (
    <div className="app-shell" data-theme={theme}>
      <button
        type="button"
        className={sidebarOpen ? "sidebar-backdrop visible" : "sidebar-backdrop"}
        onClick={() => setSidebarOpen(false)}
        aria-label="Cerrar navegación"
        tabIndex={sidebarOpen ? 0 : -1}
      />
      <aside className={sidebarOpen ? "app-sidebar open" : "app-sidebar"}>
        <div className="sidebar-brand-row">
          <Brand href="/videos" />
          <button type="button" className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Cerrar navegación">
            <X size={21} aria-hidden="true" />
          </button>
        </div>
        <nav className="sidebar-nav" aria-label="Navegación principal">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "sidebar-link active" : "sidebar-link"}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={21} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <p className="sidebar-caption">Tu espacio de video</p>
      </aside>

      <header className="app-header">
        <button type="button" className="mobile-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Abrir navegación">
          <Menu size={22} aria-hidden="true" />
        </button>
        {search ? (
          <form className="header-search" onSubmit={handleSearch} role="search">
            <Search size={20} aria-hidden="true" />
            <input
              value={search.value}
              onChange={(event) => search.onChange(event.target.value)}
              placeholder={search.placeholder}
              maxLength={120}
              aria-label={search.placeholder}
            />
            <button type="submit" disabled={search.loading} aria-label="Buscar" title="Buscar">
              {search.loading ? <span className="dark-spinner small" aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
            </button>
          </form>
        ) : <div />}

        <div className="header-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Activar tema claro" : "Activar tema oscuro"}
            title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
          >
            {theme === "dark" ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
          </button>
          <div className="profile-menu" ref={profileRef}>
            <button
              type="button"
              className="profile-trigger"
              onClick={() => setProfileOpen((current) => !current)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
            >
              <span className="profile-greeting">Hola, {displayName}</span>
              <ChevronDown size={16} aria-hidden="true" />
              <span className="profile-avatar" aria-hidden="true">{initials}</span>
            </button>
            {profileOpen && (
              <div className="profile-popover" role="menu">
                <div className="profile-summary">
                  <span className="profile-avatar large" aria-hidden="true">{initials}</span>
                  <div><strong>{displayName}</strong><span>Cuenta de InnovaTube</span></div>
                </div>
                <button type="button" role="menuitem" onClick={toggleTheme}>
                  {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
                  {theme === "dark" ? "Tema claro" : "Tema oscuro"}
                </button>
                <button type="button" role="menuitem" onClick={handleSignOut} disabled={signingOut}>
                  <LogOut size={18} aria-hidden="true" />
                  {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="app-content">{children}</div>
    </div>
  );
}
