import { Suspense } from "react";
import Explorer from "./explorer";
import "@xyflow/react/dist/style.css";
import "./explore.css";

export const metadata = { title: "Future Explorer" };

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="shell explorer"><div className="explore-loading" role="status">Opening your workspace…</div></div>}>
      <Explorer />
    </Suspense>
  );
}
