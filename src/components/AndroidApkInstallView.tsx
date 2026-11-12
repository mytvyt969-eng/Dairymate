import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Copy,
  CheckCheck,
  Terminal,
  Package,
  Share2,
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

export const AndroidApkInstallView: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [installAttempted, setInstallAttempted] = useState(false);

  const appUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://dairymate.app';

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCmd(key);
      setTimeout(() => setCopiedCmd(null), 2500);
    } catch {
      setCopiedCmd(key);
      setTimeout(() => setCopiedCmd(null), 2500);
    }
  };

  const handleDirectInstall = async () => {
    if (isInstallable) {
      await install();
    } else {
      setInstallAttempted(true);
    }
  };

  const handleDownloadCapacitorConfig = () => {
    const config = {
      appId: 'com.dairymate.attendance',
      appName: 'DairyMate',
      webDir: 'dist',
      bundledWebRuntime: false,
      server: {
        androidScheme: 'https',
      },
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'capacitor.config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBubblewrapManifest = () => {
    const twaManifest = {
      packageId: 'com.dairymate.attendance',
      host: appUrl.replace(/^https?:\/\//, ''),
      name: 'DairyMate — Daily Milk & Price Attendance Tracker',
      launcherName: 'DairyMate',
      display: 'standalone',
      themeColor: '#059669',
      navigationColor: '#FFFFFF',
      backgroundColor: '#F8FAFC',
      enableNotifications: false,
      startUrl: '/',
      iconUrl: `${appUrl}/pwa-512x512.png`,
      maskableIconUrl: `${appUrl}/pwa-maskable-512x512.png`,
      appVersionName: '1.0.0',
      appVersionCode: 1,
      shortcuts: [],
      generatorApp: 'bubblewrap-cli',
    };
    const blob = new Blob([JSON.stringify(twaManifest, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'twa-manifest.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const capacitorCommands = `npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug`;

  const bubblewrapCommands = `npm i -g @bubblewrap/cli
bubblewrap init --manifest ${appUrl}/manifest.webmanifest
bubblewrap build`;

  return (
    <div className="space-y-6">
      {/* Option 1: Direct Android WebAPK / Standalone Install */}
      <section
        aria-label="Direct Android App Installation"
        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-emerald-700">
                Recommended · Instant Offline Android App
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                Install DairyMate on Android (WebAPK)
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                DairyMate is configured with a full Android Web App Manifest, offline service
                worker, and maskable home-screen icons. When installed on Android Chrome, Android
                automatically generates and installs a signed native WebAPK onto your phone—no
                Unknown Sources warning required.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isInstalled ? (
              <span className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Installed on Device
              </span>
            ) : (
              <button
                type="button"
                onClick={handleDirectInstall}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isInstallable ? 'Install Android App Now' : 'How to Install on Android Phone'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => copyText(appUrl, 'url')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              {copiedCmd === 'url' ? (
                <>
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <span>Copied App Link</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Copy App Link for Phone</span>
                </>
              )}
            </button>
          </div>
        </div>

        {(installAttempted || !isInstallable) && !isInstalled && (
          <div className="mt-4 pt-3 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100 text-xs text-slate-700">
            <div className="pt-2 md:pt-0 md:pr-4">
              <strong className="font-semibold text-slate-900 block mb-1">
                Step 1: Open in Chrome on Android
              </strong>
              Open this app URL in Google Chrome on your Android phone:{' '}
              <span className="font-mono text-slate-900 break-all">{appUrl}</span>
            </div>
            <div className="pt-3 md:pt-0 md:px-4">
              <strong className="font-semibold text-slate-900 block mb-1">
                Step 2: Tap &ldquo;Install App&rdquo;
              </strong>
              {isIOS ? (
                <span>
                  On iPhone/iPad Safari, tap the <strong>Share</strong> icon at the bottom and
                  choose <strong>Add to Home Screen</strong>.
                </span>
              ) : (
                <span>
                  Tap the <strong>⋮ (Three Dots)</strong> menu in the top-right corner of Chrome and
                  select <strong>Install app</strong> (or <strong>Add to Home screen</strong>).
                </span>
              )}
            </div>
            <div className="pt-3 md:pt-0 md:pl-4">
              <strong className="font-semibold text-slate-900 block mb-1">
                Step 3: Launch Full-Screen Offline
              </strong>
              DairyMate appears in your Android app drawer with its emerald milk icon and works
              100% offline.
            </div>
          </div>
        )}
      </section>

      {/* Option 2 & 3: Standalone .apk File Generation (PWABuilder / Capacitor / Bubblewrap) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section
          aria-label="Generate Standalone APK File"
          className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-medium text-slate-500">
                  Method A · Cloud APK Packager (No Coding Required)
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  Download `.apk` via PWABuilder / Bubblewrap
                </h3>
              </div>
              <Package className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-700">
              <p>
                Because DairyMate serves a compliant Web App Manifest (
                <code className="font-mono text-slate-900">/manifest.webmanifest</code>) and
                512×512 PNG icons, you can package it into a signed standalone{' '}
                <code className="font-mono font-semibold text-slate-900">DairyMate.apk</code> in
                60 seconds:
              </p>

              <ol className="divide-y divide-slate-100">
                <li className="py-2.5">
                  <strong className="font-semibold text-slate-900">1. Copy your live URL:</strong>{' '}
                  <span className="font-mono text-slate-800">{appUrl}</span>
                </li>
                <li className="py-2.5">
                  <strong className="font-semibold text-slate-900">
                    2. Visit PWABuilder.com:
                  </strong>{' '}
                  Paste the URL into <strong>pwabuilder.com</strong>, click{' '}
                  <strong>Package for Stores</strong> → <strong>Android</strong> →{' '}
                  <strong>Download APK</strong>.
                </li>
                <li className="py-2.5">
                  <strong className="font-semibold text-slate-900">
                    3. Or run Google Bubblewrap CLI:
                  </strong>{' '}
                  Use the pre-configured <code className="font-mono">twa-manifest.json</code> below
                  to build a signed APK locally.
                </li>
              </ol>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-3 font-mono text-[11px] overflow-x-auto">
                <pre>{bubblewrapCommands}</pre>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadBubblewrapManifest}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download twa-manifest.json</span>
            </button>

            <button
              type="button"
              onClick={() => copyText(bubblewrapCommands, 'bubblewrap')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copiedCmd === 'bubblewrap' ? (
                <>
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <span>Copied CLI Commands</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Bubblewrap Commands</span>
                </>
              )}
            </button>
          </div>
        </section>

        <section
          aria-label="Build Native Android APK with Capacitor"
          className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-medium text-slate-500">
                  Method B · Android Studio / Gradle Build
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  Build Offline `.apk` with Capacitor
                </h3>
              </div>
              <Terminal className="w-5 h-5 text-slate-700 shrink-0" />
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-700">
              <p>
                We have included <code className="font-mono text-slate-900">capacitor.config.json</code>{' '}
                (<code className="font-mono text-slate-900">com.dairymate.attendance</code>) in the
                project root. Since <code className="font-mono">localStorage</code> is persisted on
                device, your attendance & milk rates work completely offline inside the native
                Android WebView.
              </p>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-3 font-mono text-[11px] overflow-x-auto">
                <pre>{capacitorCommands}</pre>
              </div>

              <p className="text-slate-500">
                Output APK path:{' '}
                <code className="font-mono text-slate-800">
                  android/app/build/outputs/apk/debug/app-debug.apk
                </code>
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCapacitorConfig}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download capacitor.config.json</span>
            </button>

            <button
              type="button"
              onClick={() => copyText(capacitorCommands, 'capacitor')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copiedCmd === 'capacitor' ? (
                <>
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <span>Copied Gradle Commands</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Build Commands</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
