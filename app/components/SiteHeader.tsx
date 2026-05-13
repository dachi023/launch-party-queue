import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type { Team } from "~/lib/db";

type Props = {
  active: "home" | "history";
  queued: number;
  teams: Team[];
  currentSlug: string | null;
};

export function SiteHeader({ active, queued, teams, currentSlug }: Props) {
  const current = teams.find((t) => t.slug === currentSlug) ?? null;
  const base = currentSlug ? `/t/${currentSlug}` : "/";

  return (
    <header className="sticky top-0 z-20 bg-[color:var(--paper)]/85 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">
        {/* Logo — left */}
        <Link to={base} className="flex items-center gap-2 group min-w-0 justify-self-start">
          <span className="text-xl group-hover:animate-wiggle">🍾</span>
          <span className="display font-bold tracking-tight text-sm sm:text-base text-[color:var(--ink)] truncate hidden sm:inline">
            Launch Party Queue
          </span>
          <span className="display font-bold tracking-tight text-sm text-[color:var(--ink)] inline sm:hidden">
            LPQ
          </span>
        </Link>

        {/* Center cluster — TeamSwitcher + Pending */}
        <div className="justify-self-center min-w-0 flex items-center gap-2 sm:gap-3">
          <TeamSwitcher teams={teams} current={current} />
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/5 shrink-0">
            <span className="size-2 rounded-full bg-[color:var(--accent)] animate-blink" />
            <span className="mono-label">Pending</span>
            <span className="tabnum text-sm font-bold text-[color:var(--ink)]">
              {String(queued).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Nav — right */}
        <nav className="flex items-center gap-1 text-xs sm:text-sm justify-self-end shrink-0">
          {currentSlug ? (
            <>
              <Link
                to={`/t/${currentSlug}`}
                className={
                  "px-2.5 sm:px-3 py-1.5 rounded-full transition border border-transparent " +
                  (active === "home"
                    ? "bg-[color:var(--ink)] text-[color:var(--paper)] shadow-[2px_2px_0_var(--accent-3)]"
                    : "text-[color:var(--ink)]/80 hover:bg-white/10")
                }
              >
                Queue
              </Link>
              <Link
                to={`/t/${currentSlug}/history`}
                className={
                  "px-2.5 sm:px-3 py-1.5 rounded-full transition border border-transparent " +
                  (active === "history"
                    ? "bg-[color:var(--ink)] text-[color:var(--paper)] shadow-[2px_2px_0_var(--accent-4)]"
                    : "text-[color:var(--ink)]/80 hover:bg-white/10")
                }
              >
                Archive
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

function TeamSwitcher({
  teams,
  current,
}: {
  teams: Team[];
  current: Team | null;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative max-w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition max-w-full text-[color:var(--ink)]"
      >
        <span className="size-2 rounded-full bg-[color:var(--accent-2)] shrink-0" />
        <span className="display text-xs sm:text-sm font-semibold tracking-tight truncate max-w-[6rem] sm:max-w-[140px]">
          {current?.name ?? "Select team"}
        </span>
        <span className="text-[10px] shrink-0">▾</span>
      </button>
      {open ? (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] paper-card rounded-2xl p-2 z-30">
          <div className="mono-label px-2 py-1">Teams</div>
          <ul className="max-h-72 overflow-y-auto">
            {teams.map((t) => {
              const isActive = t.slug === current?.slug;
              return (
                <li key={t.id}>
                  <Link
                    to={`/t/${t.slug}`}
                    onClick={() => setOpen(false)}
                    className={
                      "flex items-baseline justify-between gap-3 px-2 py-2 rounded-xl transition " +
                      (isActive
                        ? "bg-[color:var(--ink)] text-[color:var(--paper)]"
                        : "hover:bg-white/10 text-[color:var(--ink)]")
                    }
                  >
                    <span className="display font-semibold truncate">
                      {t.name}
                    </span>
                    <span
                      className={
                        "mono-label tabnum shrink-0 " +
                        (isActive ? "text-[color:var(--paper)]/70" : "")
                      }
                    >
                      /{t.slug}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-1 border-t border-white/10 pt-2">
            <Link
              to="/teams/new"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-2 py-2 rounded-xl text-[color:var(--ink)] hover:bg-[color:var(--accent)] hover:text-white transition"
            >
              <span className="display font-semibold">＋ New team</span>
              <span className="mono-label">create</span>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
