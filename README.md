# webbzw

[![CD](https://github.com/BZFlagCommunity/webbzw/workflows/CD/badge.svg)](https://github.com/BZFlagCommunity/webbzw/actions)
[![Deno](https://img.shields.io/badge/Deno-v1.7.0+-blue)](https://deno.land)

Preview and edit BZW files on the web.

![screenshot](screenshot.png)

## Supported Features

- [x] Real-time preview
- [x] Syntax highlighting
- [x] Drag 'n drop files

The list of supported map features can be found in issue [#2](https://github.com/The-Noah/webbzw/issues/2).

## Building

> [Deno](https://deno.land/) v1.7.0+ is required to build the application.

**Build**
```sh
deno run --unstable --allow-read --allow-write --allow-env build.ts
```

**Live server with hot reloading**
```sh
deno run --unstable --allow-read --allow-write --allow-net --allow-run build.ts serve
```

## Contributing

Contributions welcome!
