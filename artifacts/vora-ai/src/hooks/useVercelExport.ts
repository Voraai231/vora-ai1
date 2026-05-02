import { useState } from "react";

export function useVercelExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToVercel = async (html: string, title: string, token: string) => {
    setIsExporting(true);
    try {
      const slug = (title || "vora-project").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const response = await fetch("https://api.vercel.com/v13/deployments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: slug,
          files: [
            {
              file: "index.html",
              data: btoa(unescape(encodeURIComponent(html))),
              encoding: "base64"
            }
          ],
          projectSettings: {
            framework: null
          }
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Deployment failed");
      }

      const data = await response.json();
      return data.url;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToVercel, isExporting };
}
