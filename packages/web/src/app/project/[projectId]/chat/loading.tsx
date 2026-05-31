export default function ChatLoading() {
  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 8rem)",
        background: "var(--ft-paper)",
        border: "1px solid var(--ft-rule)",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      {/* Rail skeleton */}
      <aside
        style={{
          width: 300,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--ft-rule)",
          background: "var(--ft-paper)",
        }}
      >
        {/* Rail header */}
        <div
          style={{
            padding: "16px 18px 14px",
            borderBottom: "1px solid var(--ft-rule)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div className="ft-skel" style={{ height: 10, width: 70 }} />
            <div
              className="ft-skel"
              style={{ height: 26, width: 64, borderRadius: 3 }}
            />
          </div>
          <div className="ft-skel" style={{ height: 18, width: 140 }} />
        </div>

        {/* Section: Channels */}
        <RailSectionSkeleton title="CHANNELS" rows={2} kind="square" />

        {/* Section: People */}
        <RailSectionSkeleton title="PEOPLE ON THIS PROJECT" rows={5} kind="round" />
      </aside>

      {/* Window skeleton */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <div
          style={{
            padding: "14px 24px",
            borderBottom: "1px solid var(--ft-rule)",
            background: "var(--ft-paper)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              className="ft-skel"
              style={{ width: 36, height: 36, borderRadius: 4 }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="ft-skel" style={{ height: 17, width: 160 }} />
              <div className="ft-skel" style={{ height: 11, width: 110 }} />
            </div>
          </div>
          <div
            className="ft-skel"
            style={{ height: 24, width: 90, borderRadius: 100 }}
          />
        </div>

        {/* Messages list */}
        <div
          style={{
            flex: 1,
            background: "var(--ft-paper-2)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            overflow: "hidden",
          }}
        >
          {/* Date divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              maxWidth: 360,
              width: "100%",
              alignSelf: "center",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--ft-rule)" }} />
            <div className="ft-skel" style={{ height: 10, width: 64 }} />
            <div style={{ flex: 1, height: 1, background: "var(--ft-rule)" }} />
          </div>

          <BubbleSkeleton mine={false} widths={[60, 38]} showHeader />
          <BubbleSkeleton mine={true} widths={[52]} showHeader />
          <BubbleSkeleton mine={false} widths={[72, 50, 32]} showHeader />
          <BubbleSkeleton mine={true} widths={[44]} showHeader />
          <BubbleSkeleton mine={false} widths={[60]} showHeader />
        </div>

        {/* Input */}
        <div
          style={{
            padding: "14px 24px",
            background: "var(--ft-paper-2)",
            borderTop: "1px solid var(--ft-rule)",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div className="ft-skel" style={{ flex: 1, height: 42, borderRadius: 3 }} />
          <div
            className="ft-skel"
            style={{ width: 42, height: 42, borderRadius: 3 }}
          />
          <div className="ft-skel" style={{ width: 90, height: 42, borderRadius: 3 }} />
        </div>
      </div>
    </div>
  );
}

function RailSectionSkeleton({
  title,
  rows,
  kind,
}: {
  title: string;
  rows: number;
  kind: "round" | "square";
}) {
  return (
    <div style={{ padding: "12px 0 4px" }}>
      <div
        className="mono"
        style={{
          padding: "0 18px 8px",
          fontSize: 9,
          color: "var(--ft-steel-2)",
          letterSpacing: "0.14em",
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr auto",
              gap: 10,
              alignItems: "center",
              padding: "10px 18px 10px 18px",
            }}
          >
            <div
              className="ft-skel"
              style={{
                width: 32,
                height: 32,
                borderRadius: kind === "round" ? 32 : 4,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
              <div className="ft-skel" style={{ height: 12, width: `${55 + ((i * 17) % 35)}%` }} />
              <div className="ft-skel" style={{ height: 10, width: `${40 + ((i * 13) % 40)}%` }} />
            </div>
            <div className="ft-skel" style={{ height: 10, width: 28 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BubbleSkeleton({
  mine,
  widths,
  showHeader,
}: {
  mine: boolean;
  widths: number[]; // percentages of available bubble width
  showHeader?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: mine ? "row-reverse" : "row",
        gap: 10,
        alignItems: "flex-end",
      }}
    >
      <div style={{ width: 28, flexShrink: 0 }}>
        {showHeader && (
          <div
            className="ft-skel"
            style={{ width: 28, height: 28, borderRadius: 28 }}
          />
        )}
      </div>
      <div style={{ maxWidth: 480, minWidth: 220, flex: "0 1 480px" }}>
        {showHeader && (
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: mine ? "flex-end" : "flex-start",
              marginBottom: 6,
            }}
          >
            <div className="ft-skel" style={{ height: 10, width: 80 }} />
            <div className="ft-skel" style={{ height: 10, width: 36 }} />
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            alignItems: mine ? "flex-end" : "flex-start",
          }}
        >
          {widths.map((w, i) => (
            <div
              key={i}
              className="ft-skel"
              style={{
                height: 36,
                width: `${w}%`,
                borderRadius: 3,
                minWidth: 70,
                background: mine
                  ? "linear-gradient(90deg, var(--ft-ink-soft) 0%, rgba(82,93,116,0.55) 50%, var(--ft-ink-soft) 100%)"
                  : undefined,
                backgroundSize: mine ? "200% 100%" : undefined,
                animation: mine ? "ft-shimmer 1.4s ease-in-out infinite" : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
