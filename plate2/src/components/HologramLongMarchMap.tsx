import { Compass, MapPin, RadioTower, X } from "lucide-react";
import { geoMercator, geoPath } from "d3-geo";
import { MouseEvent, useMemo, useState } from "react";
import chinaGeoJson from "../assets/china.geo.json";
import { marchNodes, routePoints, type MarchNode, type RoutePoint } from "../data/longMarchRoute";

const viewBox = { width: 1000, height: 760 };

const nodeLabelOffsets: Record<string, { dx: number; dy: number; anchor?: "start" | "middle" | "end" }> = {
  ruijin: { dx: 18, dy: 22 },
  zunyi: { dx: 18, dy: -20 },
  luding: { dx: 18, dy: 2 },
  "snow-grass": { dx: -18, dy: -18, anchor: "end" },
  wuqi: { dx: 18, dy: -22 },
  huining: { dx: 20, dy: 18 },
};

const provinceLabelOverrides: Record<string, { lng: number; lat: number }> = {
  内蒙古自治区: { lng: 111.75, lat: 40.84 },
};

const provinceCallouts = [
  {
    name: "香港",
    anchor: { lng: 114.17, lat: 22.32 },
    label: { x: 710, y: 632 },
  },
  {
    name: "澳门",
    anchor: { lng: 113.55, lat: 22.2 },
    label: { x: 710, y: 657 },
  },
];

type ProjectedPoint = RoutePoint & {
  x: number;
  y: number;
};

type ProjectedMarchNode = MarchNode & {
  x: number;
  y: number;
};

function toPath(points: ProjectedPoint[]) {
  if (!points.length) return "";
  const [first, ...rest] = points;
  return rest.reduce((path, point) => `${path} L ${point.x} ${point.y}`, `M ${first.x} ${first.y}`);
}

function getCardPosition(node: ProjectedMarchNode) {
  const left = node.x > 720 ? node.x - 292 : node.x + 34;
  const top = node.y > 560 ? node.y - 210 : node.y - 96;
  return { left, top };
}

export function HologramLongMarchMap() {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const mapModel = useMemo(() => {
    const geoData = chinaGeoJson as GeoJSON.FeatureCollection;
    const projection = geoMercator().fitExtent(
      [
        [88, 74],
        [920, 700],
      ],
      geoData,
    );
    const pathGenerator = geoPath(projection);

    const mapPaths = geoData.features.map((feature, index) => ({
      id: String(feature.properties?.id ?? index),
      name: String(feature.properties?.name ?? ""),
      d: pathGenerator(feature) ?? "",
      center:
        feature.properties?.name && provinceLabelOverrides[String(feature.properties.name)]
          ? projection([
              provinceLabelOverrides[String(feature.properties.name)].lng,
              provinceLabelOverrides[String(feature.properties.name)].lat,
            ])
          : Array.isArray(feature.properties?.cp)
            ? projection(feature.properties.cp as [number, number])
            : null,
    }));

    const project = <T extends RoutePoint>(point: T): T & { x: number; y: number } => {
      const projected = projection([point.lng, point.lat]);
      return {
        ...point,
        x: projected?.[0] ?? 0,
        y: projected?.[1] ?? 0,
      };
    };

    const projectedRoute = routePoints.map(project);
    const projectedNodes = marchNodes.map(project);

    return {
      mapPaths,
      projectedRoute,
      projectedNodes,
      callouts: provinceCallouts.map((callout) => ({
        ...callout,
        anchor: projection([callout.anchor.lng, callout.anchor.lat]) ?? [0, 0],
      })),
      routePath: toPath(projectedRoute),
    };
  }, []);

  const activeNode = useMemo(
    () => mapModel.projectedNodes.find((node) => node.id === activeNodeId) ?? null,
    [activeNodeId, mapModel.projectedNodes],
  );

  const closeCard = () => setActiveNodeId(null);

  const selectNode = (event: MouseEvent, node: ProjectedMarchNode) => {
    event.stopPropagation();
    setActiveNodeId(node.id);
  };

  return (
    <main className="war-room">
      <section className="command-shell" aria-label="中国工农红军长征路线图">
        <header className="map-header">
          <div>
            <p className="eyebrow">Holographic Campaign Sand Table</p>
            <h1>中国工农红军长征路线图</h1>
          </div>
          <div className="status-panel" aria-label="沙盘状态">
            <span><RadioTower size={16} /> 主路线</span>
            <span><Compass size={16} /> 2D 平面沙盘</span>
          </div>
        </header>

        <div className="map-stage" onClick={closeCard}>
          <div className="scanline" />
          <svg
            className="china-map"
            viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
            role="img"
            aria-label="带有长征主路线的中国地图沙盘"
          >
            <defs>
              <filter id="cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="0 0 0 0 0.1 0 0 0 0 0.95 0 0 0 0 0.85 0 0 0 0.7 0"
                />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="redRibbonGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="1 0 0 0 0.95 0 0.25 0 0 0.08 0 0 0.1 0 0.02 0 0 0 0.95 0"
                />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="mapFill" x1="15%" y1="10%" x2="90%" y2="85%">
                <stop offset="0%" stopColor="#0c3035" />
                <stop offset="52%" stopColor="#10282f" />
                <stop offset="100%" stopColor="#081922" />
              </linearGradient>
              <linearGradient id="ribbonGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff332a" stopOpacity="0.16" />
                <stop offset="28%" stopColor="#ff4b32" stopOpacity="0.92" />
                <stop offset="58%" stopColor="#ffc05c" stopOpacity="0.98" />
                <stop offset="100%" stopColor="#ff201c" stopOpacity="0.68" />
              </linearGradient>
              <linearGradient id="silkHighlight" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="42%" stopColor="#fff0c6" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="nodeCore" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff6cc" />
                <stop offset="38%" stopColor="#ffb14f" />
                <stop offset="100%" stopColor="#f52220" />
              </radialGradient>
              <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
                <path d="M 42 0 L 0 0 0 42" fill="none" stroke="#67fff0" strokeOpacity="0.1" strokeWidth="1" />
              </pattern>
            </defs>

            <rect className="grid-field" width="1000" height="760" fill="url(#grid)" />
            <ellipse className="sand-table-base" cx="505" cy="392" rx="455" ry="306" />
            <path className="route-theater" d={mapModel.routePath} />

            <g className="map-layer" filter="url(#cyanGlow)">
              {mapModel.mapPaths.map((feature) => (
                <path key={feature.id} className="province-shape" d={feature.d} />
              ))}
            </g>

            <g className="province-label-layer" aria-hidden="true">
              {mapModel.mapPaths.map((feature) => {
                if (!feature.center || !feature.name) return null;
                if (feature.name.includes("香港") || feature.name.includes("澳门")) return null;
                return (
                  <text key={feature.id} className="province-label" x={feature.center[0]} y={feature.center[1]}>
                    {feature.name.replace(/省|市|自治区|壮族|回族|维吾尔/g, "")}
                  </text>
                );
              })}
              {mapModel.callouts.map((callout) => (
                <g key={callout.name} className="province-callout">
                  <path
                    className="province-callout-line"
                    d={`M ${callout.anchor[0]} ${callout.anchor[1]} L ${callout.label.x - 10} ${callout.label.y - 4}`}
                  />
                  <circle className="province-callout-dot" cx={callout.anchor[0]} cy={callout.anchor[1]} r="2.4" />
                  <text className="province-callout-label" x={callout.label.x} y={callout.label.y}>
                    {callout.name}
                  </text>
                </g>
              ))}
            </g>

            <g className="route-layer" filter="url(#redRibbonGlow)">
              <path className="route-shadow" d={mapModel.routePath} />
              <path className="route-ribbon route-draw" d={mapModel.routePath} />
              <path className="route-glass route-draw" d={mapModel.routePath} />
              <path className="route-thread route-draw" d={mapModel.routePath} />
              <path className="route-energy" d={mapModel.routePath} />
            </g>

            <g className="node-layer">
              {mapModel.projectedNodes.map((node) => {
                const isActive = activeNodeId === node.id;
                const isHovered = hoveredNode === node.id;
                const labelOffset = nodeLabelOffsets[node.id] ?? { dx: 16, dy: -16 };
                return (
                  <g
                    key={node.id}
                    className={`route-node ${isActive ? "is-active" : ""} ${isHovered ? "is-hovered" : ""}`}
                    transform={`translate(${node.x} ${node.y})`}
                    onClick={(event) => selectNode(event, node)}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${node.name}节点`}
                  >
                    <circle className="node-pulse" r="14" />
                    <circle className="node-halo" r="9" />
                    <circle className="node-core" r="4.5" fill="url(#nodeCore)" />
                    <text
                      className="node-label"
                      x={labelOffset.dx}
                      y={labelOffset.dy}
                      textAnchor={labelOffset.anchor ?? "start"}
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {activeNode && (
            <article
              className="info-card"
              style={getCardPosition(activeNode)}
              onClick={(event) => event.stopPropagation()}
            >
              <button className="close-button" type="button" onClick={closeCard} aria-label="关闭详情">
                <X size={16} />
              </button>
              <div className="card-kicker"><MapPin size={15} /> 长征节点</div>
              <h2>{activeNode.name}</h2>
              <time>{activeNode.reachedAt}</time>
              <p className="event-text">{activeNode.event}</p>
              <p>{activeNode.description}</p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
