import { useState } from "react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { splitProject } from "@/lib/exportSource";

export interface ExportOptions {
  /** When true, the "Built with Vora AI" badge is omitted (Owner-only). */
  stripBadge?: boolean;
}

export function useZipExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportZip = async (
    html: string,
    prompt: string,
    title: string,
    options: ExportOptions = {}
  ) => {
    try {
      setIsExporting(true);
      const safeTitle = (title || "vora-project").trim();
      const folder = safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "vora-project";

      const project = splitProject(html, {
        title: safeTitle,
        prompt,
        stripBadge: options.stripBadge,
      });

      const zip = new JSZip();
      const root = zip.folder(folder)!;
      root.file("index.html", project.indexHtml);
      if (project.stylesCss) root.file("styles.css", project.stylesCss);
      if (project.scriptJs) root.file("script.js", project.scriptJs);
      root.file("README.md", project.readmeMd);
      root.file("package.json", project.packageJson);
      root.file("vercel.json", project.vercelJson);
      root.file(
        ".gitignore",
        ["node_modules", ".vercel", ".DS_Store", "*.log"].join("\n") + "\n"
      );

      const assetsFolder = root.folder("assets")!;
      for (const asset of project.assets) {
        assetsFolder.file(asset.name, asset.base64, { base64: true });
      }

      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `${folder}.zip`);
    } catch (err) {
      console.error("Export failed", err);
      throw err;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportZip, isExporting };
}
