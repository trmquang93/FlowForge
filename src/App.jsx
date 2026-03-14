import { useState, useEffect, lazy, Suspense } from "react";
import LandingPage from "./pages/LandingPage";
import DocsPage from "./pages/DocsPage";
import { COLORS } from "./styles/theme";

const Drawd = lazy(() => import("./Drawd"));

function getRoute() {
  const hash = window.location.hash;
  if (hash === "#/editor") return "editor";
  if (hash === "#/docs") return "docs";
  return "landing";
}

export default function App() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    function onHashChange() {
      setRoute(getRoute());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (route === "editor") {
    return (
      <Suspense
        fallback={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
              background: COLORS.bg,
              color: COLORS.textMuted,
              fontSize: 14,
              fontFamily: "sans-serif",
            }}
          >
            Loading editor...
          </div>
        }
      >
        <Drawd />
      </Suspense>
    );
  }

  if (route === "docs") return <DocsPage />;

  return <LandingPage />;
}
