---
title: EduIDE LSP Extension
sidebar_label: EduIDE LSP Extension
---

# EduIDE LSP Extension

## Overview

The Theia LSP Extension is a specialized connector for Visual Studio Code and Eclipse Theia designed to interface with external, network-accessible Language Servers. Instead of following the traditional model of spawning and managing a local language server process within the workspace, this extension establishes a TCP connection to a pre-configured backend server.

This approach is particularly beneficial in cloud-based educational environments like EduIDE, where offloading resource-intensive language analysis (especially for Java) to dedicated infrastructure can improve the responsiveness of student workspaces.

## Key Features

- **External Connectivity**: Connects to language servers over TCP, allowing for distributed architectures where the IDE and the language server reside on different nodes.
- **Multi-Language Support**: Configured to activate for both Java and Rust programming languages.
- **Standard LSP Capabilities**: Provides core Language Server Protocol features including:
  - **Diagnostics**: Real-time error and warning reporting.
  - **Code Completion**: Context-aware code suggestions.
  - **Hover Information**: Documentation and type information on hover.
  - **Go to Definition**: Quick navigation to source code definitions.
- **Configurable Endpoints**: Allows specifying the host and port of the target language server.

## Technical Details

- **Tech Stack**: TypeScript
- **Framework**: VS Code Extension API
- **Key Dependencies**:
  - `vscode-languageclient`: Used to handle the communication protocol between the client and the server.
- **Engines**: Compatible with VS Code version `^1.105.0` and equivalent Theia versions.

## Integration

Within the EduIDE/Artemis ecosystem, this extension serves as the "thin" language intelligence layer. By connecting to external language servers, it allows EduIDE to provide a rich IDE experience without the heavy memory and CPU overhead typically associated with language servers like Eclipse JDT.LS or `rust-analyzer` running inside the student's container.

## Repository

[EduIDE/EduIDE-lsp-extension](https://github.com/EduIDE/EduIDE-lsp-extension)
