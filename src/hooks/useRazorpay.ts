import { useCallback } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(!!window.Razorpay);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface RazorpayOptions {
  amountInPaise: number;
  planName: string;
  description: string;
  userName?: string;
  userEmail?: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (error: string) => void;
}

export function useRazorpay() {
  const openCheckout = useCallback(async (opts: RazorpayOptions) => {
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId) {
      opts.onFailure("Razorpay key is not configured.");
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      opts.onFailure("Could not load payment gateway. Check your connection.");
      return;
    }

    const rzp = new window.Razorpay({
      key: keyId,
      amount: opts.amountInPaise,
      currency: "INR",
      name: "Vora AI",
      description: opts.description,
      image: "https://placehold.co/64x64/00ffff/0a0a0f?text=V",
      prefill: {
        name: opts.userName || "",
        email: opts.userEmail || "",
      },
      theme: {
        color: "#00ffff",
        backdrop_color: "rgba(10,10,15,0.85)",
      },
      modal: {
        animation: true,
        backdropclose: false,
      },
      handler: (response: { razorpay_payment_id: string }) => {
        opts.onSuccess(response.razorpay_payment_id);
      },
    });

    rzp.on("payment.failed", (response: any) => {
      opts.onFailure(response?.error?.description || "Payment failed.");
    });

    rzp.open();
  }, []);

  return { openCheckout };
}
