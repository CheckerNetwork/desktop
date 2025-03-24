#!/usr/bin/env node

import fs from 'node:fs/promises'
import { execa } from 'execa'
import * as paths from '../lib/paths.js'

const pkg = JSON.parse(await fs.readFile(paths.packageJSON, 'utf8'))
pkg.sentryEnvironment = 'production'
await fs.writeFile(paths.packageJSON, JSON.stringify(pkg, null, 2) + '\n')
await execa('git', ['add', 'package.json'])
