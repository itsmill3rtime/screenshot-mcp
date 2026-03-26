#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, join } from "path";
import { createInterface } from "readline";
import { platform, homedir, env } from "os";

const SERVER_NAME = "screenshot";
const SCRIPT_PATH = resolve("dist/index.js");

const mcpEntry = {
  command: "node",
  args: [SCRIPT_PATH],
};

// -- Config file locations by platform and client --

function getConfigTargets() {
  const home = homedir();
  const os = platform();
  const targets = [];

  // Claude Desktop
  if (os === "win32") {
    const appData = env.APPDATA || join(home, "AppData", "Roaming");
    targets.push({
      name: "Claude Desktop",
      path: join(appData, "Claude", "claude_desktop_config.json"),
    });
  } else if (os === "darwin") {
    targets.push({
      name: "Claude Desktop",
      path: join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json"),
    });
  } else {
    targets.push({
      name: "Claude Desktop",
      path: join(home, ".config", "Claude", "claude_desktop_config.json"),
    });
  }

  // Claude Code (global settings)
  targets.push({
    name: "Claude Code (global)",
    path: join(home, ".claude", "settings.json"),
  });

  return targets;
}

// -- Helpers --

function readJsonFile(filePath) {
  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function preview(config) {
  return JSON.stringify(config, null, 2);
}

// -- Main --

async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log("");
  console.log("Screenshot MCP -- Setup");
  console.log("=======================");
  console.log("");
  console.log(`Server entry point: ${SCRIPT_PATH}`);

  if (!existsSync(SCRIPT_PATH)) {
    console.log("");
    console.log("WARNING: dist/index.js not found. Run 'npm run build' first.");
    console.log("");
  }

  const targets = getConfigTargets();

  console.log("");
  console.log("Available config targets:");
  console.log("");
  targets.forEach((t, i) => {
    const exists = existsSync(t.path);
    console.log(`  [${i + 1}] ${t.name}`);
    console.log(`      ${t.path}`);
    console.log(`      ${exists ? "File exists" : "Will be created"}`);
    console.log("");
  });

  const answer = await ask(
    rl,
    `Which config would you like to update? (1-${targets.length}, or "all", or "none"): `
  );

  const selected = [];
  const trimmed = answer.trim().toLowerCase();

  if (trimmed === "all") {
    selected.push(...targets);
  } else if (trimmed === "none" || trimmed === "n" || trimmed === "") {
    console.log("");
    console.log("No changes made. Here's the config snippet to add manually:");
    console.log("");
    console.log(preview({ mcpServers: { [SERVER_NAME]: mcpEntry } }));
    console.log("");
    rl.close();
    return;
  } else {
    for (const part of trimmed.split(/[,\s]+/)) {
      const idx = parseInt(part, 10) - 1;
      if (idx >= 0 && idx < targets.length) {
        selected.push(targets[idx]);
      }
    }
  }

  if (selected.length === 0) {
    console.log("Invalid selection. No changes made.");
    rl.close();
    return;
  }

  for (const target of selected) {
    console.log("");
    console.log(`--- ${target.name} ---`);
    console.log(`File: ${target.path}`);

    let config = readJsonFile(target.path) || {};

    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    const alreadyExists = config.mcpServers[SERVER_NAME];
    if (alreadyExists) {
      console.log("");
      console.log(`"${SERVER_NAME}" already exists in this config:`);
      console.log(preview(alreadyExists));
      console.log("");
      const overwrite = await ask(rl, "Overwrite? (y/N): ");
      if (overwrite.trim().toLowerCase() !== "y") {
        console.log("Skipped.");
        continue;
      }
    }

    config.mcpServers[SERVER_NAME] = mcpEntry;

    console.log("");
    console.log("Will write:");
    console.log(preview(config));
    console.log("");

    const confirm = await ask(rl, "Confirm? (Y/n): ");
    if (confirm.trim().toLowerCase() === "n") {
      console.log("Skipped.");
      continue;
    }

    // Ensure parent directory exists
    const parentDir = resolve(target.path, "..");
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }

    writeFileSync(target.path, JSON.stringify(config, null, 2) + "\n", "utf-8");
    console.log("Done.");
  }

  console.log("");
  console.log("Setup complete. Restart your MCP client to pick up the changes.");
  console.log("");
  rl.close();
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
