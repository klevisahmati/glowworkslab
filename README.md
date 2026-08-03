# Glowworks.lab

A premium, responsive landing page for Glowworks.lab, an automotive interior upgrade studio in Rhodes, Greece. The site focuses exclusively on Glowworks.lab and showcases ambient lighting, custom steering wheels, starlight headliners, and in-car media upgrades.

## Key Features

- Responsive editorial landing page in Greek
- Local project imagery and Glowworks.lab branding
- Service portfolio and four-step appointment process
- Mobile navigation and reduced-motion support
- Appointment requests handled by Netlify Forms
- Accessible form success and error states

## Technology

- TanStack Start
- React 19
- TypeScript
- Vite
- Tailwind CSS 4 tooling with custom global CSS
- Lucide React icons
- Netlify Forms

## Run Locally

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The Vite development server runs on port `3000`. For Netlify platform emulation, use:

```bash
netlify dev --port 8889
```

Netlify Forms submissions are fully registered and processed after deployment. The hidden form definition is stored in `public/__forms.html`.
