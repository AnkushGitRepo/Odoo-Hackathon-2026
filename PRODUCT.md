# Product

## Register

product

## Platform

web

## Users

Operations staff at small/mid logistics companies, on desktop in a depot office and on
mobile in the yard. Four roles with distinct jobs: Fleet Managers keeping vehicles healthy
and utilized, Dispatchers creating and tracking trips under time pressure, Safety Officers
watching license validity and driver safety scores, and Financial Analysts tracking fuel,
maintenance, and per-vehicle ROI. Secondary audience: hackathon judges evaluating rule
enforcement and completeness in a short demo.

## Product Purpose

TransitOps replaces spreadsheets and paper logbooks with one system for the full transport
lifecycle: vehicle registry, driver compliance, trip dispatch, maintenance, fuel/expense
logging, and analytics. Success: a dispatcher can go from "cargo request" to a validated,
dispatched trip in under a minute, and the system makes invalid operations (overweight cargo,
expired license, double-booking) impossible rather than merely discouraged.

## Positioning

The system that won't let you dispatch a bad trip — every business rule is enforced, not
just displayed.

## Brand Personality

Dependable, operational, clear. The feel of a well-run control room: dense with live
information but never chaotic. Status is always one glance away (color-coded badges
everywhere). Confidence over flash.

## Anti-references

- Consumer-app playfulness (no confetti, no mascots) — this is an ops tool.
- Enterprise-ERP grayness (endless gray tables, modal mazes) — dense doesn't mean dull.
- Dashboard-template genericism (random gradient hero cards with meaningless sparklines).

## Design Principles

1. Status is the interface — every entity wears its state as a colored badge; transitions are visible and automatic.
2. Block early, explain why — validation errors appear inline at form time with the exact rule and numbers ("Capacity exceeded by 200 kg"), not after submit.
3. One glance per question — each KPI card answers exactly one operational question.
4. Demo-honest — every screen works with seeded data end-to-end; nothing is a static mock.

## Accessibility & Inclusion

Sensible defaults for a hackathon build: semantic HTML, keyboard-operable forms and dialogs,
visible focus states, WCAG AA contrast for text and status badges (badges also carry text
labels, never color alone), `prefers-reduced-motion` respected by GSAP animations.
