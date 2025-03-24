<h1 align="center">
	<br>
	 :artificial_satellite:
	<br>
	<br>
	Station Core
	<br>
	<br>
	<br>
</h1>

> Station Core is a headless version of Filecoin Station suitable for running on
> all kinds of servers.

[![CI](https://github.com/filecoin-station/core/actions/workflows/ci.yml/badge.svg)](https://github.com/filecoin-station/core/actions/workflows/ci.yml)

## Deployment

Station Core supports different deployment options:

- [Docker](#docker)
- [Manual Deployment (Ubuntu)](#manual-deployment-ubuntu)

## Installation

> **Note**: Station Core requires Node.js, we recommend using the latest LTS
> version. You can install Node.js using your favorite package manager or get
> the official installer from
> [Node.js downloads](https://nodejs.org/en/download/).

With Node.js installed, run `npm` to install Station Core.

```bash
$ npm install -g @filecoin-station/core
```

## Usage

```bash
$ FIL_WALLET_ADDRESS=... PASSPHRASE=... station
```

## Common Configuration

Station Core is configured using environment variables (see
[The Twelve-Factor App](https://12factor.net/config)).

The following configuration options are shared by all Station commands:

- `$CACHE_ROOT` _(string; optional)_: Station stores temporary files (e.g.
  cached data) in this directory. Defaults to
  - Linux: `${XDG_CACHE_HOME:-~/.cache}/filecoin-station-core`
  - macOS: `~/Library/Caches/app.filstation.core`
  - Windows: `%TEMP%/Filecoin Station Core`
- `$STATE_ROOT` _(string; optional)_: Station stores logs and module state in
  this directory. Defaults to

  - Linux: `${XDG_STATE_HOME:-~/.local/state}/filecoin-station-core`
  - macOS: `~/Library/Application Support/app.filstation.core`
  - Windows: `%LOCALAPPDATA%/Filecoin Station Core`

  **IMPORTANT:** The`$STATE_ROOT` directory must be local to the computer
  running the Station. This directory must not be shared with other computers
  operated by the user, e.g. via Windows Domain profile or cloud storage like
  iCloud Drive, Dropbox and OneDrive.

## Commands

### `$ station`

Start a new Station process. The Station will run in foreground and can be
terminated by pressing Ctrl+C.

This command has the following additional configuration in addition to common
the configuration options described in
[Common Configuration](#common-configuration):

- `FIL_WALLET_ADDRESS` _(string; required)_: Address of the Filecoin wallet that
  will receive rewards. The value must be a mainnet address starting with
  `f410`, `0x`.

  `f1` addresses currently are not supported. Rewards for Station operators are
  administered by a FEVM smart contract. It is currently technically complex to
  make payments to f1 addresses.

  If you just want to give `core` a quick spin, you can use the address
  `0x000000000000000000000000000000000000dEaD`. Please note that any earnings
  sent there will be lost.

- `PASSPHRASE` _(string; optional)_: a passphrase to protect the Station
  instance private key stored in a file inside the `STATE_ROOT` directory.

- `MODULE_FILTER` _(string; optional)_: Run only the Zinnia module with the
  given name. Eg:
  - `MODULE_FILTER=spark`

This command outputs metrics and activity events:

```bash
$ station
{
  "totalJobsCompleted": 161,
  "rewardsScheduledForAddress": "0.041033208757289921"
}
[4/19/2023, 9:26:54 PM] INFO  Saturn Node will try to connect to the Saturn Orchestrator...
[4/19/2023, 9:26:54 PM] INFO  Saturn Node was able to connect to the Orchestrator and will now start connecting to the Saturn network...
...
```

```bash
$ station --json
{"type":"jobs-completed","total":161}
{"type":"activity:info","module":"Saturn","message":"Saturn Node will try to connect to the Saturn Orchestrator..."}
{"type":"activity:info","module":"Saturn","message":"Saturn Node was able to connect to the Orchestrator and will now start connecting to the Saturn network..."}
...
```

For the JSON output, the following event types exist:

- `jobs-completed`
  - `total`
- `activity:info`
  - `module`
  - `message`
- `activity:error`
  - `module`
  - `message`

Set the flag `--experimental` to run modules not yet considered safe for
production use. _Run this at your own risk!_

No modules currently in experimental mode.

### `$ station --help`

Show help.

```bash
$ station --help
Usage: station [options]

Options:
  -j, --json                      Output JSON                          [boolean]
      --experimental              Also run experimental modules        [boolean]
      --recreateStationIdOnError  Recreate Station ID if it is corrupted
                                                                       [boolean]
  -v, --version                   Show version number                  [boolean]
  -h, --help                      Show help                            [boolean]
```

### `$ station --version`

Show version number.

```bash
$ station --version
@filecoin-station/core: 1.0.1
```

## Docker

Deploy Station with [Docker](https://www.docker.com/). Please replace
`FIL_WALLET_ADDRESS` and ensure the passed `state` folder is persisted across
machine restarts.

```bash
$ docker run \
	--name station \
	--detach \
	--env FIL_WALLET_ADDRESS=0x000000000000000000000000000000000000dEaD \
        -v ./state:/home/node/.local/state/
	ghcr.io/CheckerNetwork/core
```

## Manual Deployment (Ubuntu)

On a fresh [Ubuntu](https://ubuntu.com/) machine:

```bash
# Install node.js
$ curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - &&\
sudo apt-get install -y nodejs

# Install core
$ npm install -g @filecoin-station/core

# Create systemd service
# Don't forget to replace FIL_WALLET_ADDRESS and User
$ sudo tee /etc/systemd/system/station.service > /dev/null <<EOF
[Unit]
Description=Filecoin Station Core
Documentation=https://github.com/filecoin-station/core
After=network.target

[Service]
Environment=FIL_WALLET_ADDRESS=XYZ
Type=simple
User=XYZ
ExecStart=/usr/bin/station
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start service
$ sudo systemctl daemon-reload
$ sudo systemctl start station
$ sudo systemctl status station

# Read logs
$ journalctl -u station.service
```

## Disclaimer

The CLI uses [Sentry](https://sentry.io) for error tracking.
[InfluxDB](https://www.influxdata.com/) is used for stats.

## Development

Publish a new version:

```bash
$ npm run release
```
