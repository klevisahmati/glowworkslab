# Glowworks.lab Project Guide

## Overview

This repository contains the single-page marketing website for Glowworks.lab, a custom automotive interior upgrade studio in Rhodes, Greece. The site presents the studio's work, explains its services and process, and collects appointment requests through Netlify Forms.

## Architecture

- **Framework:** TanStack Start with React 19 and file-based routing.
- **Styling:** Global custom CSS with Tailwind CSS available through the Vite plugin.
- **Deployment:** Netlify using the TanStack Start Netlify adapter.
- **Forms:** Netlify Forms with an AJAX submission from React and a static detection form in `public/__forms.html`.
- **Icons:** Lucide React.

## Key Directories

- `src/routes/` — Application routes. `index.tsx` contains the landing page and appointment form; `__root.tsx` defines metadata and the document shell.
- `src/styles.css` — Complete visual system, responsive layouts, animation, and component styling.
- `public/images/` — Glowworks logo and project photography used by the landing page.
- `public/__forms.html` — Hidden static form that allows Netlify to register the appointment form at build time.

## Conventions

- Use TypeScript and function components.
- Keep page copy in Greek unless a short English label is part of the established visual direction.
- Use PascalCase for components, camelCase for functions and state, and kebab-case for public asset names.
- Reuse CSS variables from `src/styles.css` for color and spacing decisions.
- Preserve the editorial dark/cyan/magenta aesthetic and responsive behavior.
- Keep all public-facing branding limited to Glowworks.lab.

## Non-Obvious Decisions

- The React form posts to `/__forms.html`, not `/`, because the TanStack Start SSR catch-all would otherwise intercept the request before Netlify Forms processes it.
- All form fields must remain mirrored in `public/__forms.html` whenever the visible form changes.
- The project photography is stored locally to avoid remote asset failures and improve visual consistency.

## Local Development

Use `npm run dev` for local development. Netlify Forms registration and submissions should be verified on a deployed preview because the platform form handler is not active in the standard Vite development server.
