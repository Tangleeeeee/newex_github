import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1f36",
        }}
      >
        <span style={{ fontSize: 120, fontWeight: 700, color: "#f59e0b", fontStyle: "italic" }}>n</span>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
