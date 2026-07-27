import { memo, useMemo } from "react";
import ForceGraph3D from "react-force-graph-3d";
import type { GraphData } from "@/types";

interface GraphGlobeProps {
  data: GraphData;
  onNodeClick?: (id: string) => void;
}

const GROUP_COLORS: Record<string, string> = {
  note: "#58a6ff",
  tag: "#3fb950",
  ghost: "#484f58",
};

const LARGE_VAULT = 500;

function GraphGlobeInner({ data, onNodeClick }: GraphGlobeProps) {
  const isLarge = data.nodes.length > LARGE_VAULT;

  const graphData = useMemo(
    () => ({
      nodes: data.nodes.map((n) => ({
        ...n,
        val: n.group === "tag" ? 2 : n.group === "ghost" ? 1 : 4,
      })),
      links: data.links.map((l) => ({ ...l })),
    }),
    [data],
  );

  return (
    <div className="graph-globe">
      <div className="graph-globe__glow" />
      {isLarge && (
        <div className="graph-globe__badge">
          Large vault — particles reduced for speed
        </div>
      )}
      <ForceGraph3D
        graphData={graphData}
        backgroundColor="rgba(0,0,0,0)"
        nodeLabel="label"
        nodeColor={(n) =>
          GROUP_COLORS[(n as { group: string }).group] ?? "#8b949e"
        }
        nodeOpacity={0.92}
        linkColor={() => "rgba(88,166,255,0.25)"}
        linkWidth={0.6}
        linkDirectionalParticles={isLarge ? 0 : 2}
        linkDirectionalParticleWidth={1.2}
        linkDirectionalParticleColor={() => "#58a6ff"}
        onNodeClick={(node) => onNodeClick?.((node as { id: string }).id)}
        enableNodeDrag
        showNavInfo={false}
      />
      <div className="graph-globe__hint">
        Drag nodes · Scroll to zoom · Click to open note
      </div>
    </div>
  );
}

export const GraphGlobe = memo(GraphGlobeInner);
