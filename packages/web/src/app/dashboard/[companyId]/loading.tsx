export default function DashboardLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--ft-paper-2)",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: "16px 28px",
          background: "var(--ft-paper)",
          borderBottom: "1px solid var(--ft-rule)",
          boxShadow: "inset 0 -3px 0 var(--ft-sky-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            className="ft-skel"
            style={{ width: 36, height: 36, borderRadius: 4 }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="ft-skel" style={{ height: 16, width: 180 }} />
            <div className="ft-skel" style={{ height: 11, width: 120 }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="ft-skel" style={{ height: 32, width: 90, borderRadius: 4 }} />
          <div className="ft-skel" style={{ height: 32, width: 110, borderRadius: 4 }} />
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          maxWidth: 1300,
          margin: "0 auto",
          padding: "28px 28px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Heading row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="ft-skel" style={{ height: 10, width: 70 }} />
            <div className="ft-skel" style={{ height: 26, width: 200 }} />
          </div>
          <div className="ft-skel" style={{ height: 36, width: 140, borderRadius: 4 }} />
        </div>

        {/* Project cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                background: "var(--ft-paper)",
                border: "1px solid var(--ft-rule)",
                borderRadius: 6,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Title + status */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <div className="ft-skel" style={{ height: 16, width: "75%" }} />
                  <div className="ft-skel" style={{ height: 11, width: "55%" }} />
                </div>
                <div
                  className="ft-skel"
                  style={{ height: 20, width: 64, borderRadius: 100 }}
                />
              </div>

              {/* Detail rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[0, 1, 2].map((n) => (
                  <div
                    key={n}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      className="ft-skel"
                      style={{ width: 14, height: 14, borderRadius: 2 }}
                    />
                    <div className="ft-skel" style={{ height: 11, width: `${60 + n * 8}%` }} />
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 6,
                  paddingTop: 10,
                  borderTop: "1px solid var(--ft-rule)",
                }}
              >
                <div className="ft-skel" style={{ height: 10, width: 80 }} />
                <div
                  className="ft-skel"
                  style={{ height: 28, width: 80, borderRadius: 3 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
