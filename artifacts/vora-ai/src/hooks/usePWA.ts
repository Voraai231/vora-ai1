import { useEffect, useState, useCallback } from "react";

type InstallState = "idle" | "available" | "installing" | "installed" | "ios-prompt";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function usePWA() {
  const [installState, setInstallState] = useState<InstallState>("idle");
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Detect standalone mode (already installed)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as any).standalone === true);
    setIsStandalone(standalone);

    if (standalone) {
      setInstallState("installed");
      return;
    }

    if (ios) {
      // iOS doesn't fire beforeinstallprompt — show manual instructions
      setInstallState("ios-prompt");
      return;
    }

    // Android / Desktop: listen for native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setInstallState("available");
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      deferredPrompt = null;
      setInstallState("installed");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (isIOS) {
      setInstallState("ios-prompt");
      return;
    }
    if (!deferredPrompt) return;
    setInstallState("installing");
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstallState("installed");
      } else {
        setInstallState("available");
      }
    } catch {
      setInstallState("available");
    }
    deferredPrompt = null;
  }, [isIOS]);

  const dismissIOSPrompt = useCallback(() => {
    setInstallState("idle");
  }, []);

  return {
    installState,
    isIOS,
    isStandalone,
    canInstall: installState === "available" || installState === "ios-prompt",
    triggerInstall,
    dismissIOSPrompt,
  };
}
