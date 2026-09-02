# Immersive Dinner Menu

An interactive, ambient digital theatrical interface acting as a score for a live dinner experience for two.

## 🚀 Features

- **Guest Interface**: Multi-act sequence with cards, interactive timers, food/drink details, ambient audio toggles, and smooth spring physics gestures.
- **Host Dashboard**: Real-time control panel accessible via `#host` (with QR code generator and guest progress synchronization).
- **PWA & Standalone Ready**: Fullscreen standalone web application with offline caching (Service Worker), adaptive safe-area layouts, and customized icons.
- **Multi-language**: Seamless instant switching between Russian and English.
- **Dark Minimalist Aesthetic**: High-contrast, typography-focused design optimized for low-light dining atmospheres.

## 🛠️ Tech Stack

- **React 19** + **TypeScript**
- **Vite** + **@tailwindcss/vite 4**
- **Motion** (Framer Motion)
- **Vite PWA Plugin** (Workbox)
- **Lucide React**

---

## 📦 Local Development

1. **Clone repository**:
   ```bash
   git clone <your-repo-url>
   cd <your-repo-folder>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local dev server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## ⚡ Deployment to Vercel

1. Push this repository to **GitHub**.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"** -> **"Import Git Repository"**.
3. Vercel will automatically detect **Vite**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Click **Deploy**. SPA rewrites and PWA assets are configured via `vercel.json` out of the box!
