# Pilot profile - layout notes (design preview, pictures only)

Branch: feature/pilot-profile-design. Files: site/profile-preview/ (a.html, b.html, pp.css, theme.js, gen.py + build.py generate the HTML). Not linked from nav, noindex, sample data only. Theme by URL: ?t=midnight|pearl|champagne|amethyst.

## Inspiration (web research)
- Airbnb host profile: name, tenure, rating, review count on top, then personal detail - trust first.
- Strava: big stats, activity chart, trophy case, sidebar stats; privacy controls decide what others see.
- LinkedIn / Revolut: identity rail with avatar, verified marks, premium/metal tier badge.
- ForeFlight / Garmin Pilot: currency traffic lights (green/amber) and logbook totals.
- Apple: rings, glass, generous spacing, one accent colour.

## Sections (both options) and why
1. Header: avatar with gold ring (founding members), public handle (anonymous by default; verified email is private), "Commercial pilot - Cape Town", home aerodrome ICAO.
2. Licence and ratings chips: CPL(A), Night, FIR, Instructor grade. Self-declared now; licence-number check (one account per licence) is LATER. Never a licence photo (POPIA).
3. Founding member card: R149/month or R1,490/year, "price locked for life", member number. No fake "was" price (CPA s29/s41). Says members can vote on reviews.
4. Hours summary: total, last 90 days, night, aerodromes visited - from Logbook later.
5. Currency: day passengers, night, IR revalidation, medical - green/amber dots. Private by default, with "always check your own dates".
6. My ATO reviews: score, real cost to finish (range, not one number), "Incentivised review" label for reviews made in the "10 days free" campaign, upvote/downvote with "38 of 42 members agree" (only members vote).
7. Badges/milestones: first solo, night rated, founding member, 10 reviews, 25 aerodromes, bring 3 mates (referral), locked ones greyed (500 hours, ATPL).
8. Saved aerodromes: ICAO chips, home first.
9. What others see: privacy switches (hours, licence, home aerodrome, currency, link reviews to profile - off by default) and the POPIA note.
10. Share card button: WhatsApp-ready profile card (same idea as the ATO WhatsApp card).

## Option A - Credential card
Hero looks like a premium licence/credential: gold foil glow, gold ring avatar, chips, and a "machine-readable" footer line (WINGMAN PILOT / CPL(A) - ZA / SINCE 2026). Below: 4 stat tiles, a pill tab bar (Overview, Reviews, Logbook, Saved, Badges, Privacy), then two columns on desktop (currency + reviews left; membership, chart, badges, saved, privacy right). Phone is one clean column.
Why: strongest "bougie" first impression and identity; tabs keep a long page tidy as features grow.

## Option B - Cockpit bento
Desktop: sticky identity rail on the left (avatar, handle, chips, three currency rings Day/Night/IR, home aerodrome, Edit/Share) and a bento grid of glass tiles on the right with huge numbers (412.6 hrs). Phone: rail becomes the top card, then a 2-wide bento.
Why: Apple/Strava dashboard feel; currency visible at a glance; scales nicely to more tiles.

## Recommendation
A for the public profile others see (identity + trust), B's rings and big-number tiles for the owner's own view. They can be combined: A hero + B rings.

## Rules kept
No emoji, 4 site themes, existing glass box style, sample data only, nothing linked or live.

## Options C-G (Apple-style glass, animated)
Badges and circular currency rings are identical to B in all of them (shared ring() in more.py, .rings in fx.css). Shared fx.css/fx.js: ring fill, founding-badge shimmer, pointer tilt + glare, parallax, scroll reveals; all disabled under prefers-reduced-motion. `?still` shows everything for screenshots.
- C Liquid Glass: centred liquid hero with rings and stats, sticky segmented tabs.
- D Wallet: stacked tilting passes (licence, membership, currency), sticky on desktop.
- E Spatial: visionOS-style floating windows, bottom ornament tab bar, parallax depth.
- F Editorial: Apple product-page style, huge gradient type, chapter reveals.
- G Control Center: iOS-style modular tiles, 4-col phone / 8-col desktop.

## User profile archive: D2
Frozen copy of the approved D2 (Wallet, boarding-pass strip, Nippo title): site/profile-preview/d2.html (built by dref.py). Branch archive/user-profile-d2, base commit 04705171. Renders: /workspace/pilot_profile/d_refine/D2_{pearl,midnight,champagne,amethyst}_{iphone_390x844,desktop_1440x900}.png. Do not edit this branch; new work goes on a duplicate branch.
