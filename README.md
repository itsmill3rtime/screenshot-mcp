# Screenshot MCP Server

A cross-platform [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server that gives AI assistants the ability to capture screenshots of your desktop, monitors, and individual application windows.

Built with TypeScript and [`node-screenshots`](https://github.com/nicehash/node-screenshots) for native screen capture on Windows, macOS, and Linux.

## Features

- **Capture any window** -- screenshot a specific application window by ID
- **Capture full monitors** -- screenshot an entire display, including multi-monitor setups
- **Smart window suggestion** -- pass a search hint and the server ranks the best match first
- **List all targets** -- enumerate every open window and monitor with dimensions, app names, and IDs
- **Zero dependencies on external tools** -- no ImageMagick, no Puppeteer, no browser required

## Tools

| Tool | Description |
|---|---|
| `list_windows` | List all monitors and open windows. Supports an optional `suggest` parameter to rank the best match first. |
| `capture_monitor` | Capture a full screenshot of a monitor. Defaults to the primary display. |
| `capture_window` | Capture a screenshot of a specific window by ID. |

## Quick Start

### Install

```bash
git clone https://github.com/itsmill3rtime/screenshot-mcp.git
cd screenshot-mcp
npm install
npm run build
```

### Configure (automatic)

Run the interactive setup to automatically add the server to your MCP client config:

```bash
npm run setup
```

The setup script will:
1. Detect your Claude Desktop and Claude Code config file locations
2. Show you exactly what it will write
3. Ask for confirmation before making any changes

### Configure (manual)

If you prefer to configure manually, add the following to your MCP client config.

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "screenshot": {
      "command": "node",
      "args": ["/absolute/path/to/screenshot-mcp/dist/index.js"]
    }
  }
}
```

**Claude Code** (`settings.json`):

```json
{
  "mcpServers": {
    "screenshot": {
      "command": "node",
      "args": ["/absolute/path/to/screenshot-mcp/dist/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/screenshot-mcp` with the actual path to the cloned repo.

### Run Standalone (for testing)

```bash
npm start
```

The server communicates over **stdio** using the MCP protocol -- it is designed to be launched by an MCP client, not used directly from a terminal.

## Usage Examples

Once configured, just describe what you need in natural language. The assistant will capture the screenshot, look at it, and respond.

### Bug Reports & Debugging

> "Take a screenshot of my browser. The login form is broken -- the submit button overlaps the password field on mobile view."

> "Screenshot the app. There's a weird rendering glitch in the sidebar when I expand the navigation tree."

> "Take a screenshot of Chrome. The API response is showing raw JSON instead of the formatted table we built."

> "Grab a screenshot of my terminal. The build is failing with a wall of errors and I can't figure out which one is the root cause."

> "Screenshot VS Code. I'm getting red squiggly lines everywhere after updating TypeScript but the code looks correct to me."

### UI & Design Feedback

> "Take a screenshot of the app. The spacing between the cards feels off compared to the Figma mockup -- can you compare?"

> "Screenshot my browser. The dark mode toggle works but some text is still black on the dark background."

> "Take a screenshot of the dashboard. The chart labels are overlapping at smaller breakpoints and I'm not sure how to fix it."

### Multi-Monitor & Window Targeting

> "Screenshot my second monitor. I have the docs open there and want to reference the API schema."

> "Take a screenshot of Figma. I need you to see the updated component designs before we start coding."

> "Screenshot Slack. There's a thread with the error logs from the QA team I want you to look at."

### General Workflow

> "Take a screenshot of my browser. Does this page look done enough to ship?"

> "Screenshot the app. I just deployed the fix -- can you verify the layout looks right now?"

> "Take a screenshot of my desktop. I have a few windows arranged with reference material -- use them to understand what I'm working on."

## Tool Reference

### `list_windows`

Returns all available monitors and open windows.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `includeMinimized` | `boolean` | No | Include minimized windows. Defaults to `false`. |
| `suggest` | `string` | No | Search hint to rank the best matching window first. Matches against title and app name (case-insensitive). |

**Response** -- JSON with `monitors` and `windows` arrays. When `suggest` is provided, the best match is sorted to the top and marked with `suggested: true`.

### `capture_monitor`

Captures a full screenshot of a monitor and returns it as a PNG image.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `monitorId` | `number` | No | Monitor ID from `list_windows`. Omit to capture the primary monitor. |

### `capture_window`

Captures a screenshot of a specific window and returns it as a PNG image.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `windowId` | `number` | Yes | Window ID from `list_windows`. |

## Platform Notes

| Platform | Status | Notes |
|---|---|---|
| **Windows** | Supported | Works out of the box. |
| **macOS** | Supported | Requires **Screen Recording** permission: System Settings > Privacy & Security > Screen Recording. |
| **Linux** | Supported | Works on X11. Wayland support depends on your compositor. |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Rebuild after changes
npm run build
```

The source lives in `src/index.ts`. After building, the compiled output is in `dist/`.

## Tech Stack

- **TypeScript** -- type-safe MCP server implementation
- **[@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)** -- official MCP SDK
- **[node-screenshots](https://github.com/nicehash/node-screenshots)** -- native screen capture bindings
- **[Zod](https://zod.dev/)** -- schema validation for tool parameters

## License

MIT
