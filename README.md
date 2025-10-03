<div align="center">
	<h1>Student Search</h1>
	<p><strong>Firebase-powered directory search for HKBUAS students.</strong></p>
</div>

## Prerequisites

- Node.js 18.18+ (or 20+)
- npm (ships with Node.js)
- A Firebase project with Authentication (Email/Password) and Firestore enabled

## Quick start

```powershell
git clone https://github.com/Johnsonaf/student-search.git
cd student-search
npm install
# create .env.local and populate the environment variables below
npm run dev
```

Then open <http://localhost:3000> to use the app.

## Environment variables

Create a `.env.local` file in the project root and provide the Firebase credentials that are safe for the browser. The app fails fast during boot if anything is missing, so double-check the names below:

```text
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

> These are the **public** keys from your Firebase console. Never commit the file to Git.

## Available scripts

| Command        | Description                                   |
| -------------- | --------------------------------------------- |
| `npm run dev`  | Start the development server with Turbopack.  |
| `npm run lint` | Run ESLint using the Next.js config.          |
| `npm run build`| Create a production build (uses Turbopack).   |
| `npm start`    | Serve the production build locally.           |

## Deploying

The repo is configured for Vercel. Create the same environment variables in your Vercel project (Project Settings → Environment Variables) and trigger a deployment. Vercel will automatically run `npm run build`.

## Architecture notes

- **Next.js 15 App Router** powers routing and server rendering.
- **Firebase Auth** guards the search page and handles email/password sign-in.
- **Firestore** stores student documents. Search happens client-side with fuzzy scoring to rank results.
- **Tailwind CSS** styles the UI (using the new Tailwind CSS v4 build pipeline).

## Troubleshooting

- Seeing a 404 on Vercel? Confirm you removed any custom rewrites and that deployment targets the `app` directory.
- Build failing with `Missing Firebase configuration value`? Ensure all environment variables listed above are set for the environment you're running in.
- Auth redirects repeatedly? Double-check that Firebase Authentication has your application's domain in the authorized list and that the email/password provider is enabled.

## License

This project is licensed under the MIT License.
