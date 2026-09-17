import { ImageResponse } from "next/og";

/** Imagem de prévia (Open Graph/Twitter Card) padrão do site - usada quando
 * qualquer link da GetFesta é compartilhado (WhatsApp, Instagram, etc.) e a
 * página não define uma imagem própria (ver app/layout.tsx:metadata.openGraph).
 * Gerada pelo próprio Next.js em runtime, sem precisar de um arquivo de
 * imagem estático - convenção de arquivo do App Router. */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fbf9f6",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            backgroundColor: "#ffe9e1",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -60,
            width: 260,
            height: 260,
            borderRadius: "50%",
            backgroundColor: "#fff3d6",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ fontSize: 120 }}>🎈</span>
          <span style={{ fontSize: 108, fontWeight: 800, color: "#1f2933", letterSpacing: -2 }}>
            Get<span style={{ color: "#ff6b4a" }}>Festa</span>
          </span>
        </div>
        <span style={{ marginTop: 28, fontSize: 34, fontWeight: 600, color: "#6b7684" }}>
          Quem faz sua festa acontecer
        </span>
      </div>
    ),
    { ...size }
  );
}
