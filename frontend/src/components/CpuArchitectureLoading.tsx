"use client";

import React from "react";

export interface CpuArchitectureLoadingProps {
  text?: string;
  subtext?: string;
  size?: "sm" | "md" | "lg";
}

const CpuArchitectureLoading = ({
  text = "CHURUPO",
  subtext = "Conectando con el servidor...",
  size = "md",
}: CpuArchitectureLoadingProps) => {
  const sizeMap = {
    sm: { width: 200, height: 100, fontSize: 14, subFontSize: 11 },
    md: { width: 300, height: 150, fontSize: 20, subFontSize: 14 },
    lg: { width: 400, height: 200, fontSize: 28, subFontSize: 16 },
  };

  const { width, height, fontSize, subFontSize } = sizeMap[size];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 40,
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 200 100"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Gradients adaptados al tema neo-brutalist */}
          <radialGradient id="cpu-accent-grad" fx="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="cpu-green-grad" fx="1">
            <stop offset="0%" stopColor="var(--accent-green)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="cpu-yellow-grad" fx="1">
            <stop offset="0%" stopColor="var(--accent-yellow)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="cpu-red-grad" fx="1">
            <stop offset="0%" stopColor="var(--accent-red)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="cpu-text-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--text-muted)">
              <animate
                attributeName="offset"
                values="-2; -1; 0"
                dur="3s"
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes="0; 0.5; 1"
                keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
              />
            </stop>
            <stop offset="25%" stopColor="var(--text-main)">
              <animate
                attributeName="offset"
                values="-1; 0; 1"
                dur="3s"
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes="0; 0.5; 1"
                keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
              />
            </stop>
            <stop offset="50%" stopColor="var(--text-muted)">
              <animate
                attributeName="offset"
                values="0; 1; 2"
                dur="3s"
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes="0; 0.5; 1"
                keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
              />
            </stop>
          </linearGradient>
          <filter id="cpu-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="2"
              dy="2"
              stdDeviation="0"
              floodColor="var(--border)"
              floodOpacity="1"
            />
          </filter>
          <marker
            id="cpu-dot-marker"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="16"
            markerHeight="16"
          >
            <circle cx="5" cy="5" r="2.5" fill="var(--accent)">
              <animate attributeName="r" values="0; 3; 2.5" dur="0.6s" />
            </circle>
          </marker>

          {/* Masks para los puntos animados */}
          <mask id="cpu-mask-1">
            <path d="M 10 20 h 79.5 q 5 0 5 5 v 24" strokeWidth="0.5" stroke="white" />
          </mask>
          <mask id="cpu-mask-2">
            <path d="M 180 10 h -69.7 q -5 0 -5 5 v 24" strokeWidth="0.5" stroke="white" />
          </mask>
          <mask id="cpu-mask-3">
            <path d="M 130 20 v 21.8 q 0 5 -5 5 h -10" strokeWidth="0.5" stroke="white" />
          </mask>
          <mask id="cpu-mask-4">
            <path d="M 170 80 v -21.8 q 0 -5 -5 -5 h -50" strokeWidth="0.5" stroke="white" />
          </mask>
        </defs>

        {/* Líneas de conexión con animación */}
        <g
          stroke="var(--border)"
          fill="none"
          strokeWidth="0.4"
          strokeDasharray="100 100"
          pathLength="100"
        >
          <path d="M 10 20 h 79.5 q 5 0 5 5 v 30">
            <animate
              attributeName="stroke-dashoffset"
              from="100"
              to="0"
              dur="1.2s"
              fill="freeze"
              calcMode="spline"
              keySplines="0.25,0.1,0.5,1"
              keyTimes="0; 1"
            />
          </path>
          <path d="M 180 10 h -69.7 q -5 0 -5 5 v 30">
            <animate
              attributeName="stroke-dashoffset"
              from="100"
              to="0"
              dur="1.2s"
              begin="0.1s"
              fill="freeze"
              calcMode="spline"
              keySplines="0.25,0.1,0.5,1"
              keyTimes="0; 1"
            />
          </path>
          <path d="M 130 20 v 21.8 q 0 5 -5 5 h -10">
            <animate
              attributeName="stroke-dashoffset"
              from="100"
              to="0"
              dur="1.2s"
              begin="0.2s"
              fill="freeze"
              calcMode="spline"
              keySplines="0.25,0.1,0.5,1"
              keyTimes="0; 1"
            />
          </path>
          <path d="M 170 80 v -21.8 q 0 -5 -5 -5 h -50">
            <animate
              attributeName="stroke-dashoffset"
              from="100"
              to="0"
              dur="1.2s"
              begin="0.3s"
              fill="freeze"
              calcMode="spline"
              keySplines="0.25,0.1,0.5,1"
              keyTimes="0; 1"
            />
          </path>
        </g>

        {/* Puntos animados en las líneas */}
        <g mask="url(#cpu-mask-1)">
          <circle cx="0" cy="0" r="6" fill="url(#cpu-accent-grad)">
            <animateMotion dur="2s" repeatCount="indefinite" path="M 10 20 h 79.5 q 5 0 5 5 v 24" />
          </circle>
        </g>
        <g mask="url(#cpu-mask-2)">
          <circle cx="0" cy="0" r="6" fill="url(#cpu-yellow-grad)">
            <animateMotion dur="2s" repeatCount="indefinite" begin="0.5s" path="M 180 10 h -69.7 q -5 0 -5 5 v 24" />
          </circle>
        </g>
        <g mask="url(#cpu-mask-3)">
          <circle cx="0" cy="0" r="6" fill="url(#cpu-green-grad)">
            <animateMotion dur="2s" repeatCount="indefinite" begin="1s" path="M 130 20 v 21.8 q 0 5 -5 5 h -10" />
          </circle>
        </g>
        <g mask="url(#cpu-mask-4)">
          <circle cx="0" cy="0" r="6" fill="url(#cpu-red-grad)">
            <animateMotion dur="2s" repeatCount="indefinite" begin="1.5s" path="M 170 80 v -21.8 q 0 -5 -5 -5 h -50" />
          </circle>
        </g>

        {/* Caja CPU con estilo neo-brutalist */}
        <g>
          {/* Conexiones del CPU */}
          <g fill="var(--border)">
            <rect x="93" y="37" width="2.5" height="5" rx="0.5" />
            <rect x="104" y="37" width="2.5" height="5" rx="0.5" />
            <rect x="116.3" y="44" width="2.5" height="5" rx="0.5" transform="rotate(90 116.25 45.5)" />
            <rect x="122.8" y="44" width="2.5" height="5" rx="0.5" transform="rotate(90 116.25 45.5)" />
          </g>
          {/* Caja principal */}
          <rect
            x="82"
            y="38"
            width="36"
            height="24"
            rx="0"
            fill="var(--bg-card)"
            stroke="var(--border)"
            strokeWidth="2"
            filter="url(#cpu-shadow)"
          />
          {/* Texto CPU */}
          <text
            x="100"
            y="54"
            fontSize="8"
            fill="url(#cpu-text-gradient)"
            fontWeight="800"
            letterSpacing="0.1em"
            textAnchor="middle"
            fontFamily="var(--font-heading), system-ui, sans-serif"
          >
            {text}
          </text>
        </g>
      </svg>

      {/* Texto de carga */}
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize,
            fontWeight: 800,
            fontFamily: "var(--font-heading), system-ui, sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-main)",
            marginBottom: 4,
          }}
        >
          {subtext}
        </p>
        <div
          style={{
            display: "flex",
            gap: 6,
            justifyContent: "center",
            marginTop: 12,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                background: "var(--accent)",
                border: "2px solid var(--border)",
                animation: `cpu-pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes cpu-pulse {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
};

export { CpuArchitectureLoading };
