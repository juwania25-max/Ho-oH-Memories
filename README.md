# ✨Ho'oH Memories ✨

Y2K silver retro virtual photobooth built with React + Vite, ready to deploy to Vercel.

## Features
- Browser camera preview with permission handling
- Countdown timer: 3, 5, or 10 seconds
- Burst mode: captures 4 shots with a short interval
- Four-cut photo strip, with silver/chrome and pastel accent themes
- Upload images from the device gallery (up to 4)
- Filters: Original, Chrome, Mono, Dream, Warm
- Decorative stickers that can be positioned on the strip
- Export/download photo strip as a PNG
- QR code for sharing the deployed website URL
- Responsive mobile/desktop layout
- Photos stay in browser memory; this project has no photo-upload backend

## Run locally
Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the local URL Vite prints. Camera access works on `localhost` and secure HTTPS origins after browser permission is granted.

Test production build:

```bash
npm run build
npm run preview
```

## Deploy to Vercel (GitHub method)
1. Create a new GitHub repository, for example `hooh-memories`.
2. Upload the full contents of this project to the repository (including `src/`).
3. Go to https://vercel.com/new and import the GitHub repository.
4. Confirm settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Click Deploy. Vercel will provide a public URL once deployment succeeds.
6. Open the deployed URL on a phone, grant camera permission, and test capture/download.
7. Every push to the connected Git branch can trigger a new deployment.

## Share QR code
The QR panel encodes the current page URL. Before deployment, it will encode your local development URL, which is only accessible on your own network/device. After deploying, open the public Vercel URL and generate/scan the QR code to share the live website.

## Vercel CLI alternative
With Node.js installed:

```bash
npm install
npm run build
npx vercel
npx vercel --prod
```

Follow the CLI prompts to sign in and configure the project.

## Notes
- Camera requires permission and a secure context (HTTPS or localhost).
- Uploaded gallery photos are read locally by the browser and are not sent to a server.
- Photos and stickers are kept in memory; download your strip before refreshing.
- QR sharing shares the website URL, not the generated photo itself.
