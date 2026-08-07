"use client";

import { fetchUserAttributes, getCurrentUser, signOut } from "aws-amplify/auth";
import { LogOut, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand } from "@/components/brand";
import { isAmplifyConfigured } from "@/components/providers/amplify-provider";

export default function VideosPage() {
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
      if (isAmplifyConfigured) {
        await signOut();
      }
      router.replace("/login");
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) {
    return <main className="placeholder-state" aria-live="polite">Cargando tu espacio...</main>;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Brand />
        <div className="user-menu">
          <span className="user-label">Hola, {displayName}</span>
          <button className="secondary-button" type="button" onClick={handleSignOut} disabled={signingOut}>
            <LogOut size={17} aria-hidden="true" />
            {signingOut ? "Saliendo..." : "Cerrar sesión"}
          </button>
        </div>
      </header>
      <main className="app-main">
        <section className="welcome-panel">
          <h1>Explorar videos</h1>
          <p>Tu sesión está lista. La búsqueda se incorporará en la siguiente entrega.</p>
        </section>
        <section className="placeholder-state">
          <div>
            <Search size={34} aria-hidden="true" />
            <p>El buscador estará disponible próximamente.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

