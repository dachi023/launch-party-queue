import { lazy } from "react";
import { Link } from "react-router";
import type { Release } from "~/lib/db";
import { useCardTilt } from "./useCardTilt";
import { ClientOnly } from "./ClientOnly";

const MiniBottle = lazy(() => import("./MiniBottle.client"));

type Props = {
  release: Release;
  index: number;
  teamSlug: string;
};

const ROTATIONS = ["-1.6deg", "1.2deg", "-0.8deg", "1.8deg"];
const HAND_COLORS = ["#ff7a2b", "#6788ff", "#ff5fb8", "#f5ede0"];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "TBD";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function ReleaseCard({ release, index, teamSlug }: Props) {
  const { innerRef, onMove, onLeave } = useCardTilt(4);
  const rot = ROTATIONS[index % ROTATIONS.length]!;
  const handColor = HAND_COLORS[index % HAND_COLORS.length]!;

  return (
    <li
      className="tilt-perspective animate-pop-in"
      style={{ animationDelay: `${index * 50}ms` }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <Link
        to={`/t/${teamSlug}/releases/${release.id}`}
        className="block"
      >
        <article
          ref={innerRef}
          className="tilt-inner relative grid grid-cols-[88px_1fr] gap-4 items-center py-3.5 px-4 paper-card rounded-2xl group cursor-pointer hover:bg-[color:var(--paper-3)]/60 transition"
        >
          <div className="relative" style={{ transform: `rotate(${rot})` }}>
            <div
              className="size-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[color:var(--paper-2)] to-[color:var(--paper)] border-2 border-[color:var(--ink)]/30"
              style={{ boxShadow: "3px 3px 0 rgba(0,0,0,0.45)" }}
            >
              <ClientOnly
                fallback={
                  <div className="size-full flex items-center justify-center text-4xl">
                    🍾
                  </div>
                }
              >
                {() => <MiniBottle />}
              </ClientOnly>
            </div>
            <span
              className="absolute -top-3 -left-2 hand text-2xl"
              style={{ color: handColor, transform: "rotate(-12deg)" }}
            >
              №{String(index + 1).padStart(2, "0")}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {release.status === "scheduled" ? (
                <span className="chip chip-accent">Scheduled</span>
              ) : (
                <span className="chip chip-blue">Queued</span>
              )}
              <span className="mono-label tabnum">
                {formatDate(release.released_at)}
              </span>
            </div>
            <div className="display block mt-1 text-lg sm:text-xl font-semibold tracking-[-0.02em] leading-tight group-hover:text-[color:var(--accent)] transition truncate">
              {release.name}
            </div>
            <dl className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color:var(--ink)]/70">
              <div className="flex items-center gap-1.5">
                <span className="mono-label">Party</span>
                <span className="tabnum">
                  {formatDateTime(release.party_scheduled_at)}
                </span>
              </div>
              {release.party_venue ? (
                <div className="flex items-center gap-1.5">
                  <span className="mono-label">@</span>
                  <span className="truncate max-w-[18ch]">
                    {release.party_venue}
                  </span>
                </div>
              ) : null}
            </dl>
          </div>
        </article>
      </Link>
    </li>
  );
}
