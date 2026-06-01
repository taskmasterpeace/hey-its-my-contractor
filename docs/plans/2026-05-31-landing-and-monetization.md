# MyFieldTime — Landing Page & Monetization Plan
**Date:** 2026-05-31
**Status:** Draft v1
**Owner:** Machine King Labs

---

## TL;DR

We just shipped an honest v1 landing page leaning into the **PortalLens** as our brand-defining visual. The fake social proof (2,500+ contractors, fabricated stats, made-up testimonials, fake logo cloud) is gone. Pricing is parked. The page now says what's true: this is new, it's free to try, it's being built in the open.

The next 6 months are about earning the right to claim real social proof: get **10 real contractors running real jobs on MyFieldTime**, replace every placeholder on the landing page with their words, faces, projects, and outcomes, and only then turn on paid tiers.

This doc covers: v1 launch (this push), image-pair rollout for multi-lens gallery, pricing strategy (two paths), ICP narrowing, distribution, and the case-study flywheel.

---

## Phase 0 — Honest Foundation (now → ~6 weeks)

### Landing page v1 — SHIPPED in this push
- ✅ PortalLens at 16:9, 300px default lens, lens metaphor extended into copy
- ✅ "See every phase" section with single lens + honest "more coming as we capture real builds" caption
- ✅ All fake claims removed
- ✅ "Why we built this" honest founder note (frames us as small, early, shipping fast, willing to do the work)
- ✅ Machine King Labs attribution in footer
- ✅ Watch Demo + Contact Sales → Coming Soon / removed
- ✅ Pricing section removed
- ✅ Final CTA: "Free while we're building this with you. No credit card. No fake testimonials. Just the tool."

### Multi-Lens Gallery Rollout (waiting on user-generated images)
**Spec for image generation:**
- Aspect ratio: **16:9**
- Recommended export: **1920 × 1200** (PNG or WebP)
- Same camera angle / framing for each pair (finished view ↔ construction-phase view of the same scene)

**Target categories (6 pairs to start):**
| Slot | Finished | Construction phase |
|---|---|---|
| 1 | Whole-home exterior (current) | Mid-build framing/wrap |
| 2 | Modern kitchen w/ island | Bare studs, plumbing rough-in |
| 3 | Finished bathroom | Cement board, no fixtures |
| 4 | New deck w/ railing | Joists laid out |
| 5 | Finished basement | Concrete walls, exposed joists |
| 6 | Sided/painted exterior | House wrap + sheathing |

**Implementation when images land:**
- Replace single-lens "See every phase" section with a tabbed gallery: one big lens, tabs to switch (`Whole Home / Kitchen / Bath / Deck / Basement / Exterior`)
- One lens visible at a time keeps focus; tabs preview what else is in the library
- Easy to add more tabs over time as we capture real customer projects

### Get 5-10 real users
- Hand-recruit. Personal network. Local trade groups. Subreddit r/Construction, r/HomeImprovement.
- They use it free. We onboard them ourselves. We sit in their meetings if needed.
- Every painful click = a Linear ticket (or whatever issue tracker we adopt).

---

## Phase 1 — First Paid Users (~6-12 weeks out)

### Pricing decision — two paths

#### Path A — Freemium + Usage-Based AI (RECOMMENDED)
**Why:** Contractors hate subscriptions but pay for tools that make money. Free tier kills trial friction. AI features have real per-use cost we should pass through.

| Tier | Price | What's in it |
|---|---|---|
| **Free Forever** | $0 | Unlimited projects, all core features (Calendar, Documents, Chat, Field Logs, Team, Photos w/o AI markup) |
| **Pay-as-you-go AI** | usage | $0.50 per meeting transcription, $0.25 per AI-generated image, $0.50 per AI research query |
| **Pro** | $29/mo | Unlimited AI usage, advanced reporting, e-signatures, change-order signatures, priority support |
| **Enterprise** | Custom | Multi-company, SSO, 3D site tours, dedicated CSM |

**Pros:** Low friction. Aligns our cost to user value. Easier upsell path. Honest.
**Cons:** Revenue is lumpy until Pro tier converts. Need usage metering infrastructure.

#### Path B — Per-Seat, Low Entry
**Why:** Predictable revenue. Matches how Jobber/Buildertrend win.

| Tier | Price | Seats |
|---|---|---|
| **Solo** | $19/mo | 1 user |
| **Crew** | $49/mo | up to 5 users |
| **Company** | $129/mo | unlimited users |
| **Enterprise** | Custom | + 3D tours, SSO |

**Pros:** Predictable. Easy to model. Matches industry.
**Cons:** Higher friction for trial. Doesn't align cost to value. Doesn't differentiate on AI.

#### Competitive context (for reference)
- Jobber: $69-$329/mo
- ServiceTitan: $300+/mo
- Houzz Pro: $85/mo
- Buildertrend: $399/mo

So $49 isn't crazy — it's the **cheap end**. The problem with showing $49 today is we haven't proven the value. Once we have 10 real users with documented outcomes ("Mike saved 8 hrs/week on admin"), $49 reads as obvious.

**Recommendation: Path A.** Easier to migrate users from A → B than reverse.

### Stripe wiring
- `STRIPE_SECRET_KEY` not yet configured per current `.env.local`
- Need: products + prices in Stripe dashboard, webhook for subscription events, billing portal link
- Existing SaaS scaffold already gates features by plan — wire in Stripe and we're live

### Onboarding goal
**First contractor → first project created → first photo uploaded in < 5 minutes.**
Measured. Tracked per signup. Optimize ruthlessly.

### Case Study #1
- Pick the most engaged of the early users
- Real story, real numbers (hours saved, jobs tracked, client feedback)
- Replace "Why we built this" section's last paragraph with this story
- Add a real testimonial card back to the page (just one, with face and company)

---

## Phase 2 — Distribution (Months 3-6)

### ICP — needs decision
The page right now is generic ("contractors and the people who work with them"). That's fine for week 1 but won't sustain growth. We need ONE crisp ICP for marketing.

**Candidate ICPs:**
1. **Solo handyman / GC under $1M revenue** — biggest market, most price-sensitive, hardest to retain
2. **Kitchen-and-bath remodelers ($500K-$5M)** — visual-heavy work (photo features sing), homeowner-facing (client portal matters), repeatable project structure
3. **Specialty trades (HVAC, electrical, plumbing)** — recurring service revenue, scheduling-heavy, less project-based
4. **Small custom-home builders ($1M-$10M)** — long projects, multi-stakeholder, exactly the multi-role architecture we built for
5. **Homeowner-side** (own the homeowner relationship, drag contractors in) — flips the funnel

**My recommendation: #2 (kitchen-and-bath remodelers).**
- Photo Documentation + Portal Lens story lands hardest where the work is visual
- They already think in "before / during / after"
- Project sizes ($25K-$200K) justify a SaaS spend better than handyman work
- Homeowner relationship is intense and well-documented → Client Portal wins
- Less saturated than handyman tools (Jobber owns that)

### Channel — pick ONE, go deep
- **SEO content** — answer the queries contractors actually search ("change order template free", "punch list app", "how to handle client requests during construction"). Long-tail compounds.
- **Trade-show physical presence** — Remodeling Show, NAHB, KBIS. Expensive but high-trust.
- **Facebook groups** — Where remodelers actually hang out. Risky (gets you banned if salesy) but cheap to test.
- **Referral incentive** — homeowner on platform invites their contractor → both get free Pro for 3 months. Network-effects play.
- **Google Ads** — buy intent traffic. Easy to measure. Expensive per click (~$5-15 for "contractor software").

**Recommendation: SEO content + referral incentive.** Both compound. Both can be built in-house.

### Content production
- 1 deeply useful post per week, contractor-search-intent driven
- Each post = a tool/template/checklist as the lead magnet
- Email capture → drip onboarding into product trial

---

## Phase 3 — Defensibility (6+ months)

### What makes this hard for competitors to copy
1. **Multi-stakeholder by design** — Homeowners and PMs are first-class users, not afterthoughts. ServiceTitan/Jobber treat clients as "send them an email" — we treat them as users with logins, opinions, and approval power.
2. **AI-native workflows** — meeting transcripts → auto-extract decisions/action items, photo recognition → auto-tag location/trade/phase, AI research assistant for materials/code questions. These get cheaper for us and stickier for users over time.
3. **Visual project memory** — the PortalLens metaphor extends into the product: every project has a draggable timeline of phases captured in photos. No competitor does this.
4. **3D site tours** (Enterprise) — Gaussian Splatting-based walk-throughs. Currently rare in trade software. We're early.

### Network effects to develop
- **Vetted homeowner pool** — homeowners on platform → reviewable / trustable for contractors taking new jobs
- **Contractor reputation** — completed projects, on-time %, change-order discipline → portable trust score
- **Marketplace edge** — eventually: homeowners with a project + contractors looking for work → matched, with platform taking a cut

---

## Open Questions (need answers from owner)

1. **ICP — confirm or push back on kitchen-and-bath remodeler recommendation.** This shapes copy, features, channel, everything.
2. **Pricing — Path A (freemium + usage) or Path B (per-seat)?** Default to A unless you push back.
3. **Machine King Labs role.** Is mkmlabs/MKLabs a portfolio play (link to other products, eventually shared auth)? Or just the "parent badge" forever? Affects whether we build a portfolio site.
4. **Demo video — actual video or animated walkthrough?** Watch Demo button is "Coming Soon" — need to figure out what fills it. Even a 60s screen-recording with voiceover would unblock it.
5. **Pre-launch goal.** What does "we earned the right to publish pricing" look like — 10 paid customers? 25 free users with retention? Pick a number, we work toward it.

---

## Immediate Next Steps (this week)

1. **Deploy current page to production** (this push) — blocked on Vercel link state question
2. **User generates first 2-3 real image pairs** (16:9, 1920×1200) — kitchen + bath are highest-priority
3. **Wire up tabbed LensGallery component** when first new pair arrives
4. **Reach out to 10 contractors in personal network** to be free pilot users
5. **Set up Stripe products** (don't enable yet, just provision) so we can flip the switch fast

---

## Appendix — Cuts Made in v1 Push

For the record, things removed from the landing page in commit:
- "Trusted by 2,500+ contractors nationwide" badge → "New — built in the open, free to try"
- Fake stats row (47% / 2.5x / 98%) → removed entirely
- Fake logo cloud (BuildRight Co., Apex Contractors, etc.) → removed
- Fake testimonials (Mike Thompson, Sarah Chen, James Wilson) → replaced with "Why we built this" honest founder note
- Pricing section (Free / Pro $49 / Enterprise) → removed, parked for Phase 1
- "Join 2,500+ contractors" in final CTA → "Free while we're building this with you"
- Watch Demo (no destination) → disabled "Coming Soon" button
- Footer Privacy/Terms/Support dead links → removed, replaced with Machine King Labs attribution
- Hero subhead → leans into lens metaphor: "See every phase of every project... Drag the lens below."
- New section: "Every project tells a story under the surface" — leans hard on the lens metaphor
- Nav rewrites: removed Pricing + Testimonials links, added "See it in action" + "Why we built it"
