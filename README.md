# Filecoin Station

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](https://protocol.ai/)
[![](https://img.shields.io/badge/project-Filecoin-blue.svg?style=flat-square)](https://filecoin.io/)
[![ci](https://github.com/filecoin-station/desktop/actions/workflows/ci.yml/badge.svg)](https://github.com/filecoin-station/desktop/actions/workflows/ci.yml)

> [!CAUTION]
>
> **This repository is no longer mantained.**
>
> Filecoin Spark and Checker Network continue to operate in a permissioned architecture.
> See the [announcement](https://x.com/FilecoinCDN/status/1932472254245298504) for more details.

Filecoin Station is a desktop app that connects your computer’s idle resources
to the Filecoin network and rewards you with Filecoin. Taking part is simple,
just launch the app and start earning. Learn more at
[filstation.app](https://filstation.app).

## Install

Release notes and all versions of Filecoin Station can be found on the
[releases page](https://github.com/filecoin-station/desktop/releases).

Each release has packages for desktop platforms:

- Windows: `.exe`
- macOS: `.dmg`
- Linux: `.AppImage`

  Currently this application uses `libsecret`. Depending on your distribution,
  you will need to run the following command:

  - Debian/Ubuntu: `sudo apt-get install libsecret-1-dev`
  - Red Hat-based: `sudo yum install libsecret-devel`
  - Arch Linux: `sudo pacman -S libsecret`

## Documentation

See [`/docs`](./docs)

## Security

See [`SECURITY.md`](./SECURITY.md)

## License

[SPDX-License-Identifier: Apache-2.0 OR MIT](LICENSE.md)
