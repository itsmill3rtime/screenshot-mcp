#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Monitor, Window } from "node-screenshots";

const server = new McpServer({
  name: "screenshot-mcp",
  version: "1.0.0",
});

// Tool: list_windows — enumerate all monitors and visible windows
server.tool(
  "list_windows",
  "List all available monitors and open windows that can be captured. IMPORTANT: Always present the full list to the user and put your best-guess suggestion first (marked with suggested: true). Use this first to find the target ID, then call capture_monitor or capture_window.",
  {
    includeMinimized: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include minimized windows in the list"),
    suggest: z
      .string()
      .optional()
      .describe(
        "Optional search hint to suggest the best matching window. Matches against window title and app name (case-insensitive). The best match will be sorted first and marked with suggested: true."
      ),
  },
  async ({ includeMinimized, suggest }) => {
    try {
      const monitors = Monitor.all().map((m) => ({
        type: "monitor" as const,
        id: m.id(),
        name: m.name(),
        width: m.width(),
        height: m.height(),
        isPrimary: m.isPrimary(),
        scaleFactor: m.scaleFactor(),
      }));

      const allWindows = Window.all();
      const windows = allWindows
        .filter((w) => {
          if (w.width() <= 0 || w.height() <= 0) return false;
          const title = w.title();
          if (!title || title.trim() === "") return false;
          if (!includeMinimized && w.isMinimized()) return false;
          return true;
        })
        .map((w) => ({
          type: "window" as const,
          id: w.id(),
          title: w.title(),
          appName: w.appName(),
          width: w.width(),
          height: w.height(),
          isMinimized: w.isMinimized(),
          suggested: false,
        }));

      // Score and sort windows if a suggest hint is provided
      if (suggest) {
        const hint = suggest.toLowerCase();
        let bestIndex = -1;
        let bestScore = 0;

        for (let i = 0; i < windows.length; i++) {
          const w = windows[i];
          const title = w.title.toLowerCase();
          const app = w.appName.toLowerCase();
          let score = 0;

          // Exact substring matches score highest
          if (title.includes(hint)) score += 10;
          if (app.includes(hint)) score += 5;

          // Also check each word in the hint
          for (const word of hint.split(/\s+/)) {
            if (word && title.includes(word)) score += 2;
            if (word && app.includes(word)) score += 1;
          }

          if (score > bestScore) {
            bestScore = score;
            bestIndex = i;
          }
        }

        if (bestIndex >= 0 && bestScore > 0) {
          windows[bestIndex].suggested = true;
          const [suggested] = windows.splice(bestIndex, 1);
          windows.unshift(suggested);
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ monitors, windows }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error listing windows: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: capture_monitor — capture a full monitor/screen
server.tool(
  "capture_monitor",
  "Capture a screenshot of an entire monitor/screen. Use list_windows first to get monitor IDs. If no monitorId is provided, captures the primary monitor.",
  {
    monitorId: z
      .number()
      .optional()
      .describe(
        "Monitor ID from list_windows. Omit to capture the primary monitor."
      ),
  },
  async ({ monitorId }) => {
    try {
      const monitors = Monitor.all();

      let target: Monitor | undefined;
      if (monitorId !== undefined) {
        target = monitors.find((m) => m.id() === monitorId);
        if (!target) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Monitor with ID ${monitorId} not found. Available IDs: ${monitors.map((m) => m.id()).join(", ")}`,
              },
            ],
            isError: true,
          };
        }
      } else {
        target = monitors.find((m) => m.isPrimary()) ?? monitors[0];
        if (!target) {
          return {
            content: [
              { type: "text" as const, text: "No monitors found." },
            ],
            isError: true,
          };
        }
      }

      const image = target.captureImageSync();
      const buffer = image.toPngSync();
      const base64 = buffer.toString("base64");

      return {
        content: [
          {
            type: "text" as const,
            text: `Screenshot of monitor "${target.name()}" (${target.width()}x${target.height()})`,
          },
          {
            type: "image" as const,
            data: base64,
            mimeType: "image/png",
          },
        ],
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      let hint = "";
      if (
        process.platform === "darwin" &&
        msg.toLowerCase().includes("permission")
      ) {
        hint =
          "\n\nOn macOS, you must grant Screen Recording permission in System Settings > Privacy & Security > Screen Recording.";
      }
      return {
        content: [
          {
            type: "text" as const,
            text: `Error capturing monitor: ${msg}${hint}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: capture_window — capture a specific window
server.tool(
  "capture_window",
  "Capture a screenshot of a specific window. Use list_windows first to get the window ID.",
  {
    windowId: z
      .number()
      .describe("Window ID from list_windows."),
  },
  async ({ windowId }) => {
    try {
      const allWindows = Window.all();
      const target = allWindows.find((w) => w.id() === windowId);

      if (!target) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Window with ID ${windowId} not found. It may have been closed. Run list_windows again to see current windows.`,
            },
          ],
          isError: true,
        };
      }

      const image = target.captureImageSync();
      const buffer = image.toPngSync();
      const base64 = buffer.toString("base64");

      return {
        content: [
          {
            type: "text" as const,
            text: `Screenshot of window "${target.title()}" (${target.appName()}, ${target.width()}x${target.height()})`,
          },
          {
            type: "image" as const,
            data: base64,
            mimeType: "image/png",
          },
        ],
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      let hint = "";
      if (
        process.platform === "darwin" &&
        msg.toLowerCase().includes("permission")
      ) {
        hint =
          "\n\nOn macOS, you must grant Screen Recording permission in System Settings > Privacy & Security > Screen Recording.";
      }
      return {
        content: [
          {
            type: "text" as const,
            text: `Error capturing window: ${msg}${hint}`,
          },
        ],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Screenshot MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
