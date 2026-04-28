import { useState } from "react";
import { saveAs } from "file-saver";
import JSZip from "jszip";

export function useZipExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportZip = async (html: string, prompt: string, title: string) => {
    try {
      setIsExporting(true);
      const zip = new JSZip();
      
      zip.file("index.html", html);
      zip.file("README.md", `# Built with Vora AI\n\nPrompt: ${prompt}\n`);
      zip.file("vercel.json", JSON.stringify({ cleanUrls: true, trailingSlash: false }, null, 2));
      zip.file("package.json", JSON.stringify({ name: title.toLowerCase().replace(/\s+/g, '-'), version: "1.0.0", private: true }, null, 2));
      
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `${title || 'vora-project'}.zip`);
    } catch (err) {
      console.error("Export failed", err);
      throw err;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportZip, isExporting };
}
