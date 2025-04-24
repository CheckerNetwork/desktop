# Checker

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](https://protocol.ai/)
[![](https://img.shields.io/badge/project-Filecoin-blue.svg?style=flat-square)](https://filecoin.io/)
[![ci](https://github.com/CheckerNetwork/app/actions/workflows/ci.yml/badge.svg)](https://github.com/CheckerNetwork/app/actions/workflows/ci.yml)

Checker is a desktop app that connects your computer’s idle resources to the
Filecoin network and rewards you with Filecoin. Taking part is simple, just
launch the app and start earning. [Learn more](https://docs.checker.network/running-a-checker)

## Install

Release notes and all versions of Checker can be found on the
[releases page](https://github.com/CheckerNetwork/app/releases).

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
