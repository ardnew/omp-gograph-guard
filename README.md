# omp-gograph-guard

An OMP plugin for Go code searches.
It redirects shell searches for Go symbols (`grep`, `rg`, etc.) with calls to the [gograph](https://github.com/ozgurcd/gograph) MCP server.

## Requirements

- Node.js 20 or later.
- OMP with JavaScript extension support.
- `gograph` on the OMP `PATH`.
- The gograph MCP tools configured in OMP ([example](#mcp-server)).

## Installation

Run this command and restart OMP.

```sh
omp plugin install github:ardnew/omp-gograph-guard
```

> [!TIP]
> For a local installation, run `omp plugin install .` from this directory.

## Requirements

### Index

The hook guard only applies when a `gograph` index exists in the workspace.

Run this command in your Go repository to create the index:

```sh
gograph build . --precise
```

### MCP server

In your Go repository, add this server to `.omp/mcp.json`.
Keep the other server entries.

```json
{
  "mcpServers": {
    "gograph": {
      "type": "stdio",
      "command": "gograph",
      "args": ["mcp", "."]
    }
  }
}
```

Start OMP in that repository. Run `/mcp reload`, then `/mcp test gograph` in OMP to check the server connection.

See [OMP MCP configuration](https://github.com/can1357/oh-my-pi/blob/main/docs/mcp-config.md).
