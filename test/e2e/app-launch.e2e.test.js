'use strict'

const { expect, test } = require('@playwright/test')
const { _electron: electron } = require('playwright')
const path = require('path')

const TIMEOUT_MULTIPLIER = process.env.CI ? 10 : 1

const tmp = require('tmp')

// Running test cases one after another
// More examples: https://playwright.dev/docs/api/class-electron
test.describe.serial('Application launch', async () => {
  if (process.env.CI === 'true') test.setTimeout(120_000) // slow CI

  /** @type {import('playwright').ElectronApplication} */
  let electronApp

  /** @type {import('playwright').Page} */
  let mainWindow

  test('starts the electron app', async () => {
    test.slow()

    // Launch Electron app against sandbox fake HOME dir
    const checkerRootDir = tmp.dirSync({
      prefix: 'checker-',
      unsafeCleanup: true
    }).name
    electronApp = await electron.launch({
      args: [path.join(__dirname, '..', '..', 'main', 'index.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        CHECKER_ROOT: checkerRootDir,
        DISABLE_KEYTAR: 'true'
      },
      timeout: 30000 * TIMEOUT_MULTIPLIER
    })

    electronApp.process().stdout?.pipe(process.stdout)
    electronApp.process().stderr?.pipe(process.stderr)

    // Get the first window that the app opens, wait if necessary.
    mainWindow = await electronApp.firstWindow()
    console.log('WebUI location', await mainWindow.url())

    // Direct Electron console to Node terminal.
    mainWindow.on('console', msg => {
      Promise.all(
        msg.args().map(arg => arg.jsonValue())
      ).then(
        values => {
          console.log(`[WEBUI:${msg.type()}] ${values[0]}`, ...values.slice(1))
        },
        error => {
          console.log(
            `[WEBUI:${msg.type()}] %s -- cannot deserialize args.`,
            msg.text(),
            error
          )
        }
      )
    })

    mainWindow.on('pageerror', (err) => { throw err })

    await mainWindow.waitForLoadState()
  })

  test.afterAll(async () => {
    // Exit the app
    electronApp.close()
  })

  test('navigate to dashboard', async () => {
    await mainWindow.click('button:has-text("Continue")')
    await mainWindow.click('button:has-text("Continue")')
    await mainWindow.click('button:has-text("Create Wallet")')
    expect(new URL(await mainWindow.url()).pathname).toBe('/dashboard')
  })

  test('renders Dashboard page', async () => {
    expect(new URL(mainWindow.url()).pathname).toBe('/dashboard')
  })

  test('wait for "SPARK started." activity log', async () => {
    await mainWindow.waitForSelector(
      'div.activity-log span:has-text("SPARK started")',
      { timeout: 1000 * TIMEOUT_MULTIPLIER }
    )
  })
})
