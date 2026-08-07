import { Brand } from "@/components/brand";

type AuthShellProps = Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}>;

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className="auth-page">
      <aside className="auth-brand-panel">
        <Brand href="/login" />
        <div className="brand-copy">
          <h1>Tu próxima gran idea puede empezar con un video.</h1>
          <p>Encuentra nuevas perspectivas y mantén cerca el contenido que vale la pena recordar.</p>
        </div>
      </aside>
      <section className="auth-content">
        <div className="auth-card">
          <header className="auth-heading">
            <h2>{title}</h2>
            <p>{description}</p>
          </header>
          {children}
          {footer ? <footer className="auth-footer">{footer}</footer> : null}
        </div>
      </section>
    </main>
  );
}

