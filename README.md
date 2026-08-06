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

## Admin Portal

Admin sign-in uses Netlify Identity. Passwords are managed by Netlify and are not included in the browser bundle.

To create the first administrator after deployment:

1. Open **Identity** in the Netlify project dashboard.
2. Set registration to **Invite only** under the Identity settings.
3. Invite the administrator's email address.
4. Open the invited user after acceptance, add the `admin` role, and save.
5. Sign in at `/portal/login` with the accepted Identity account.

The login page also handles invitation acceptance and password recovery links. Access to `/portal/admin` is restricted by the Netlify `admin` role and verified again in the application.
