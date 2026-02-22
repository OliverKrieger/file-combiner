// sanitize, resolve paths, csv parsing

import path from "path";

export function parseCsvList(value) {
    if (!value) return [];
    return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export function sanitizeFilePart(input) {
    return (input ?? "")
        .toString()
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 80) || "combined";
}

export function resolveDir(p) {
    if (!p) return null;
    return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}