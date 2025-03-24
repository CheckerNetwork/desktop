#!/usr/bin/env node

import { execa } from 'execa'
import fs from 'node:fs/promises'
import * as paths from '../lib/paths.js'

const pkg = JSON.parse(await fs.readFile(paths.packageJSON, 'utf8'))
pkg.sentryEnvironment = 'development'
await fs.writeFile(paths.packageJSON, JSON.stringify(pkg, null, 2) + '\n')
await execa('git', ['add', 'package.json'])
await execa('git', ['commit', '-m', 'chore: set sentry environment to development'])
await execa('git', ['push'])
