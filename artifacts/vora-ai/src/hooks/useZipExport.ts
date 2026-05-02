import { useState } from "react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { useToast } from "@/hooks/use-toast";

export function useZipExport() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportZip = async (html: string, prompt: string, title: string) => {
    if (!html) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const safeName = (title || "vora-project").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      zip.file("index.html", html);

      zip.file("README.md", `# ${title || "Vora AI Project"}

Built with [Vora AI](https://vora.ai) — Speak it. Type it. Ship it.

## Prompt
\`\`\`
${prompt || "Custom generation"}
\`\`\`

## Deploy to Vercel
1. Install Vercel CLI: \`npm i -g vercel\`
2. Run: \`vercel\`

Or drag this folder into [vercel.com/new](https://vercel.com/new).

## Deploy to Netlify
Drag the folder into [app.netlify.com/drop](https://app.netlify.com/drop).
`);

      zip.file("vercel.json", JSON.stringify({
        cleanUrls: true,
        trailingSlash: false,
        headers: [{ source: "/(.*)", headers: [{ key: "X-Frame-Options", value: "DENY" }, { key: "X-Content-Type-Options", value: "nosniff" }] }]
      }, null, 2));

      zip.file("package.json", JSON.stringify({
        name: safeName,
        version: "1.0.0",
        private: true,
        scripts: {
          start: "npx serve .",
          deploy: "vercel"
        }
      }, null, 2));

      zip.file(".gitignore", "node_modules/\n.DS_Store\n.vercel\n");

      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
      saveAs(blob, `${safeName}.zip`);

      toast({ title: "Download ready!", description: `${safeName}.zip saved to your downloads.` });
    } catch (err) {
      console.error("Export failed", err);
      toast({ title: "Export failed", description: "Could not create ZIP file.", variant: "destructive" });
      throw err;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportZip, isExporting };
}
