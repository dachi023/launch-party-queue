import { lazy } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { ClientOnly } from "./components/ClientOnly";
import "./app.css";

const SiteScene = lazy(() => import("./components/SiteScene.client"));
const MouseOrb = lazy(() => import("./components/MouseOrb.client"));

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Fraunces:ital,opsz,wght@0,9..144,400..900;1,9..144,400..900&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500;600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Launch Party Queue 🎉</title>
        <Meta />
        <Links />
      </head>
      <body>
        <div
          aria-hidden
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            maskImage:
              "radial-gradient(ellipse at 50% 45%, black 78%, rgba(0,0,0,0.75) 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at 50% 45%, black 78%, rgba(0,0,0,0.75) 100%)",
          }}
        >
          <ClientOnly>{() => <SiteScene />}</ClientOnly>
        </div>
        <div className="relative z-10">{children}</div>
        <div className="film-grain" aria-hidden />
        <ClientOnly>{() => <MouseOrb />}</ClientOnly>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "予期せぬエラーが発生しました。";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "ページが見つかりませんでした。"
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1 className="text-3xl font-bold">{message}</h1>
      <p className="mt-2">{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto bg-slate-100 dark:bg-slate-800 rounded mt-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
