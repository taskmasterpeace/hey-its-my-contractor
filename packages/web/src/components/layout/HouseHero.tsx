"use client";

interface HouseHeroProps {
  title: string;
  subtitle?: string | null;
  eyebrow?: string;
  badge?: string;
  imageUrl?: string;
  heightClass?: string;
}

const DEFAULT_HOUSE_IMAGE =
  "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1600&h=900&fit=crop";

export function HouseHero({
  title,
  subtitle,
  eyebrow,
  badge,
  imageUrl,
  heightClass = "h-[260px]",
}: HouseHeroProps) {
  const bg = imageUrl || DEFAULT_HOUSE_IMAGE;
  return (
    <div
      className={`relative ${heightClass} w-full overflow-hidden`}
      style={{
        borderRadius: 4,
        border: "1px solid var(--ft-rule)",
        backgroundImage: `linear-gradient(180deg, rgba(0,71,171,0.05) 0%, rgba(0,30,77,0.78) 100%), url("${bg}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {eyebrow && (
        <div
          className="absolute left-6 top-5 text-[10px] uppercase font-medium"
          style={{
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "0.18em",
          }}
        >
          {eyebrow}
        </div>
      )}

      <div className="absolute left-6 bottom-5 right-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1
            className="text-white font-bold leading-tight truncate"
            style={{
              fontSize: 36,
              letterSpacing: "-0.02em",
              textShadow: "0 1px 12px rgba(0,0,0,0.35)",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <div
              className="mt-1 text-sm truncate"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {subtitle}
            </div>
          )}
          <div
            className="mt-3 h-[6px] w-[96px] rounded-sm"
            style={{ background: "var(--ft-yellow)" }}
          />
        </div>
        {badge && (
          <div
            className="px-3 py-1.5 text-[10px] uppercase font-medium flex-shrink-0"
            style={{
              background: "rgba(15,26,31,0.85)",
              color: "#fff",
              letterSpacing: "0.1em",
              backdropFilter: "blur(8px)",
              borderRadius: 3,
            }}
          >
            {badge}
          </div>
        )}
      </div>
    </div>
  );
}
