export default function ProjectLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--ft-paper-2)",
      }}
    >
      {/* Sidebar skeleton — deep-blue rail with yellow accent stripe */}
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(180deg, var(--ft-rail) 0%, var(--ft-rail-2) 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 3,
            background: "var(--ft-yellow)",
          }}
        />

        {/* Back link */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--ft-rail-rule)",
          }}
        >
          <div
            className="ft-skel-dark"
            style={{ height: 16, width: 140, borderRadius: 4 }}
          />
        </div>

        {/* Project header */}
        <div
          style={{
            padding: "20px 20px",
            borderBottom: "1px solid var(--ft-rail-rule)",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div
            className="ft-skel-dark"
            style={{ width: 48, height: 48, borderRadius: 4 }}
          />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="ft-skel-dark" style={{ height: 14, width: "75%" }} />
            <div className="ft-skel-dark" style={{ height: 11, width: "55%" }} />
          </div>
        </div>

        {/* Nav groups */}
        {[0, 1, 2].map((g) => (
          <div key={g} style={{ padding: "16px 0 0" }}>
            <div
              style={{
                padding: "0 18px 8px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                className="ft-skel-dark"
                style={{ height: 9, width: 90, borderRadius: 2 }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[0, 1, 2, 3].map((n) => (
                <div
                  key={n}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 16px 8px 18px",
                  }}
                >
                  <div
                    className="ft-skel-dark"
                    style={{ width: 16, height: 16, borderRadius: 2 }}
                  />
                  <div
                    className="ft-skel-dark"
                    style={{ height: 12, width: `${50 + ((g + n) % 4) * 12}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </aside>

      {/* Right side */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <div
          style={{
            padding: "16px 24px",
            background: "var(--ft-paper)",
            borderBottom: "1px solid var(--ft-rule)",
            boxShadow: "inset 0 -3px 0 var(--ft-sky-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div className="ft-skel" style={{ height: 22, width: 180 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              className="ft-skel"
              style={{ width: 32, height: 32, borderRadius: 32 }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="ft-skel" style={{ height: 12, width: 90 }} />
              <div className="ft-skel" style={{ height: 10, width: 70 }} />
            </div>
          </div>
        </div>

        {/* Content area */}
        <div
          style={{
            flex: 1,
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* Page title row */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="ft-skel" style={{ height: 26, width: 220 }} />
            <div className="ft-skel" style={{ height: 12, width: 320 }} />
          </div>

          {/* KPI strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: "var(--ft-paper)",
                  border: "1px solid var(--ft-rule)",
                  borderRadius: 4,
                  padding: "16px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div className="ft-skel" style={{ height: 10, width: 80 }} />
                <div className="ft-skel" style={{ height: 26, width: "60%" }} />
                <div className="ft-skel" style={{ height: 10, width: "40%" }} />
              </div>
            ))}
          </div>

          {/* Two-column content */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr",
              gap: 16,
              flex: 1,
              minHeight: 0,
            }}
          >
            {/* Left big card */}
            <div
              style={{
                background: "var(--ft-paper)",
                border: "1px solid var(--ft-rule)",
                borderRadius: 4,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div className="ft-skel" style={{ height: 14, width: 140 }} />
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "36px 1fr 60px",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <div
                    className="ft-skel"
                    style={{ width: 32, height: 32, borderRadius: 32 }}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div className="ft-skel" style={{ height: 12, width: "70%" }} />
                    <div className="ft-skel" style={{ height: 10, width: "45%" }} />
                  </div>
                  <div className="ft-skel" style={{ height: 10, width: 50 }} />
                </div>
              ))}
            </div>

            {/* Right card */}
            <div
              style={{
                background: "var(--ft-paper)",
                border: "1px solid var(--ft-rule)",
                borderRadius: 4,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div className="ft-skel" style={{ height: 14, width: 120 }} />
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    paddingBottom: 12,
                    borderBottom: "1px solid var(--ft-rule)",
                  }}
                >
                  <div className="ft-skel" style={{ height: 12, width: "85%" }} />
                  <div className="ft-skel" style={{ height: 10, width: "55%" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
