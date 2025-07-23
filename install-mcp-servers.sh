#!/bin/bash

# Sequential Thinking
claude mcp add sequential-thinking -s user -- npx -y u/modelcontextprotocol/server-sequential-thinking

# Filesystem
claude mcp add filesystem -s user -- npx -y u/modelcontextprotocol/server-filesystem ~/Dev/projects

# Puppeteer
claude mcp add puppeteer -s user -- npx -y @modelcontextprotocol/server-puppeteer

# Web Fetching
claude mcp add fetch -s user -- npx -y @kazuph/mcp-fetch

# ShadCN UI builder
claude mcp add shadcn-ui-mcp-server -s user -- npx -y @jpisnice/shadcn-ui-mcp-server

# Context7 MCP
claude mcp add context7 -- npx -y @upstash/context7-mcp

# Check whats been installed
claude mcp list