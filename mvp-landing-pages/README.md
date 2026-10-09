# Free tools — zero-cost, monetizable micro-tools

A set of **pure client-side** tools. Each targets one vertical, runs entirely in
the browser (no backend, no paid API), and has **zero running cost**. Monetization
(affiliate + ads) is built in. Multilingual (zh / en / es, extensible).

| Folder | Tool | Vertical | What it does |
|--------|------|----------|--------------|
| `cold-email/` | ReplyBoost | B2B sales / founders | Scores a cold email (spam words, length, links, missing CTA) |
| `ecom-listing/` | ListRank | E-commerce sellers | Checks a product listing (title length, bullets, banned words, specs) |
| `realestate-listing/` | RentReturn | Real-estate investors | Rental calculator (cash flow, cap rate, cash-on-cash) |
| `proposal-rfp/` | BidList | Agencies / bidders | Splits an RFP into a tick-off compliance checklist |

> No AI API, no server compute — **running cost is $0**. Revenue scales with traffic.

---

## 💰 Monetization (already wired in — you just plug in IDs)

Each tool page has two built-in revenue surfaces. Both are zero-cost to run; you
earn in proportion to traffic.

### 1. Affiliate recommendations (the main earner)
Each page has a **"Sponsored"** block with 2 vertical-relevant cards. Steps:
1. Join affiliate programs relevant to each vertical, e.g.:
   - cold-email → cold-outreach SaaS (Instantly, Smartlead, lemlist), email finders (Hunter, Apollo)
   - ecom → Helium 10 / Jungle Scout, sourcing/fulfillment
   - realestate → deal-finding / landlord software (Stessa, Baselane), mortgage marketplaces
   - proposal → PandaDoc / Proposify, contract-template shops
2. In each `index.html`, search for `REPLACE-WITH-YOUR-AFFILIATE-LINK` and paste your referral links.

### 2. Display ads (AdSense)
1. Get approved for Google AdSense (needs the site live with some traffic).
2. In each `index.html`, find the `MONETIZATION — display ads` comment in `<head>`, paste your loader, uncomment.

### 3. (Later) Pro upsell
Collecting money via Stripe isn't a *running cost* — once there's demand we can add a
paid tier (export reports, bulk checks, saved templates), all still client-side.

---

## ✉️ Collect waitlist emails — Formspree (free)
Register at https://formspree.io, then replace `FORMSPREE_ENDPOINT` in each `index.html`.

---

## 🚀 Deploy (free, no code exposure)

The repo is private, so GitHub Pages won't serve it on the free plan. Use **Vercel**
(or Cloudflare Pages) connected to the repo — free, deploys the static `mvps/` folder.

This project is already deployed to Vercel; production: `https://mvps-ebon.vercel.app`
(per-tool at `/cold-email/`, `/ecom-listing/`, `/realestate-listing/`, `/proposal-rfp/`).
Re-deploys happen via `vercel deploy mvps --prod` (Root Directory = `mvps`).

---

## 🌍 Languages
UI is multilingual via an `I18N` block in each `index.html` (zh / en / es). Add a
language by copying a block and translating it; the language switcher picks it up.

---

## 📣 The one step only you can do: traffic
Affiliate + ads earn nothing without visitors. Share each tool where its audience
gathers (LinkedIn, niche subreddits, seller/agent communities), and improve on-page
SEO over time. That outreach uses your identity, so it has to be you.

## 📊 What "make money" realistically looks like here
Free tool + affiliate/ads is a **traffic business**: revenue ≈ visitors × conversion ×
payout. A few visitors earn cents; consistent traffic to a useful tool earns
meaningfully. The product is wired to monetize from day one — the lever is traffic.
