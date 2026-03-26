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
git clone https://github.com/your-username/screenshot-mcp.git
cd screenshot-mcp
npm install
npm run build
```

### Configure

Add the server to your MCP client configuration. For example, in Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "screenshot": {
      "command": "node",
      "args": ["path/to/screenshot-mcp/dist/index.js"]
    }
  }
}
```

Or in Claude Code (`settings.json`):

```json
{
  "mcpServers": {
    "screenshot": {
      "command": "node",
      "args": ["path/to/screenshot-mcp/dist/index.js"]
    }
  }
}
```

Replace `path/to/screenshot-mcp` with the actual path to the cloned repo.

### Run Standalone (for testing)

```bash
npm start
```

The server communicates over **stdio** using the MCP protocol -- it is designed to be launched by an MCP client, not used directly from a terminal.

## Usage Examples

Once configured, your AI assistant can:

**List all windows with a suggestion:**
> "Take a screenshot of VS Code"

The assistant calls `list_windows` with `suggest: "VS Code"`, gets back the full window list with the best match marked `suggested: true`, and presents the options to you.

**Capture a specific monitor:**
> "Screenshot my second monitor"

The assistant calls `list_windows` to find monitor IDs, then calls `capture_monitor` with the appropriate ID.

**Capture a window:**
> "Grab a screenshot of my browser"

The assistant calls `list_windows` with `suggest: "browser"`, confirms the target with you, then calls `capture_window` with the selected window ID.

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
