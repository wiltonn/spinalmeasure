#!/bin/bash

# Sequential Thinking
claude mcp add sequential-thinking -s user -- npx -y u/modelcontextprotocol/server-sequential-thinking

# Filesystem
claude mcp add filesystem -s user -- npx -y u/modelcontextprotocol/server-filesystem ~/Dev/projects

# Playright
claude mcp add playwright npx @playwright/mcp@latest

# Web Fetching
claude mcp add fetch -s user -- npx -y @kazuph/mcp-fetch

# ShadCN UI builder
claude mcp add shadcn-ui-mcp-server -s user -- npx -y @jpisnice/shadcn-ui-mcp-server

# Context7 MCP
claude mcp add context7 -- npx -y @upstash/context7-mcp

# Neon
claude mcp add --transport http neon https://mcp.neon.tech/mcp

# Check whats been installed
claude mcp list