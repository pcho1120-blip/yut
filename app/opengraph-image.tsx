import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "윷능력자";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function assetUrl(path: string) {
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  return new URL(path, base).toString();
}

export default async function Image() {
  const fontData = await fetch(assetUrl("/assets/pont/Cafe24Ssurround-v2.0.woff")).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "#dfc683",
          fontFamily: "Cafe24Ssurround",
        }}
      >
        <img
          src={assetUrl("/assets/generated/warm-hanok-game-background.png")}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(244,221,167,.92) 0%, rgba(244,221,167,.78) 38%, rgba(244,221,167,.2) 100%)",
          }}
        />
        <img
          src={assetUrl("/assets/generated/landing-final-characters/tiger-win-cutout.png")}
          alt=""
          style={{
            position: "absolute",
            left: 740,
            bottom: 34,
            width: 260,
            height: 260,
            objectFit: "contain",
            filter: "drop-shadow(0 18px 18px rgba(58,34,12,.28))",
          }}
        />
        <img
          src={assetUrl("/assets/generated/landing-final-characters/dragon-win-cutout.png")}
          alt=""
          style={{
            position: "absolute",
            right: 70,
            bottom: 36,
            width: 230,
            height: 230,
            objectFit: "contain",
            filter: "drop-shadow(0 18px 18px rgba(58,34,12,.28))",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 86,
            top: 64,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            width: 620,
          }}
        >
          <img
            src={assetUrl("/assets/generated/yut-neungnyeokja-logo.png")}
            alt="윷능력자"
            style={{
              width: 350,
              height: 260,
              objectFit: "contain",
              objectPosition: "left center",
              marginBottom: 4,
              filter: "drop-shadow(0 12px 10px rgba(58,34,12,.24))",
            }}
          />
          <div
            style={{
              display: "flex",
              marginBottom: 22,
              padding: "10px 18px",
              borderRadius: 999,
              background: "#297c78",
              color: "#fff8dc",
              fontSize: 28,
              fontWeight: 900,
              boxShadow: "0 8px 0 rgba(50,80,55,.26)",
            }}
          >
            전통 윷놀이 x 초능력 배틀
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              color: "#3a1f10",
              fontSize: 54,
              lineHeight: 1.08,
              fontWeight: 900,
              letterSpacing: 0,
            }}
          >
            <span>던지고, 업고, 잡고,</span>
            <span>마지막엔 초능력으로 역전</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Cafe24Ssurround",
          data: fontData,
          style: "normal",
          weight: 900,
        },
      ],
    },
  );
}
