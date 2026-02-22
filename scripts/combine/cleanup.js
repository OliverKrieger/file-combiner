import fs from "fs";
import path from "path";

/**
 * Deletes prior outputs that belong to a given output base name.
 * Any file whose name starts with the base name (or temp variant) is removed.
 */
export function cleanupPreviousOutputs(outputDir, outputBaseName) {
    if (!fs.existsSync(outputDir)) return;

    for (const entry of fs.readdirSync(outputDir, { withFileTypes: true })) {
        if (!entry.isFile()) continue;

        const name = entry.name;

        // matches:
        //  combined_vault.md
        //  combined_vault_part_1.md
        //  .combined_vault.md.<timestamp>.tmp
        if (
            name.startsWith(outputBaseName) ||
            name.startsWith(`.${outputBaseName}`)
        ) {
            fs.rmSync(path.join(outputDir, name), { force: true });
        }
    }
}