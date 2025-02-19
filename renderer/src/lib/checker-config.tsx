import { Activity, FILTransaction, FILTransactionProcessing } from 'src/typings'
import pDebounce from 'p-debounce'

export async function getOnboardingCompleted (): Promise<boolean> {
  return await window.electron.checkerConfig.getOnboardingCompleted()
}

export async function setOnboardingCompleted (): Promise<void> {
  return await window.electron.checkerConfig.setOnboardingCompleted()
}

export async function getActivities (): Promise<Activity[]> {
  return await window.electron.getActivities()
}

export async function getTotalJobsCompleted (): Promise<number> {
  return await window.electron.getTotalJobsCompleted()
}

export async function getScheduledRewards () : Promise<string> {
  return await window.electron.getScheduledRewards()
}

export async function restartToUpdate (): Promise<void> {
  return await window.electron.restartToUpdate()
}

export function openReleaseNotes (): void {
  return window.electron.openReleaseNotes()
}

export async function getDestinationWalletAddress (): Promise<string | undefined> {
  return await window.electron.checkerConfig.getDestinationWalletAddress()
}

export async function setDestinationWalletAddress (address: string | undefined): Promise<void> {
  return await window.electron.checkerConfig.setDestinationWalletAddress(address)
}

export async function getCheckerWalletAddress (): Promise<string> {
  return await window.electron.checkerConfig.getCheckerWalletAddress()
}

export async function getCheckerWalletBalance (): Promise<string> {
  return await window.electron.checkerConfig.getCheckerWalletBalance()
}

export const getCheckerWalletTransactionsHistory = pDebounce(
  async function (): Promise<(FILTransaction|FILTransactionProcessing)[]> {
    return await window.electron.checkerConfig.getCheckerWalletTransactionsHistory()
  },
  0
)

export async function transferAllFundsToDestinationWallet (): Promise<void> {
  return await window.electron.checkerConfig.transferAllFundsToDestinationWallet()
}

export function browseTransactionTracker (transactionHash: string): void {
  return window.electron.checkerConfig.openExternalURL(`https://beryx.zondax.ch/v1/search/fil/mainnet/address/${transactionHash}`)
}

export function openExternalURL (url: string): void {
  return window.electron.checkerConfig.openExternalURL(url)
}

export function openBeryx (): void {
  return window.electron.checkerConfig.openExternalURL('https://beryx.io/')
}

export function showTermsOfService (): void {
  return window.electron.checkerConfig.openExternalURL('https://pl-strflt.notion.site/Station-Terms-Conditions-e97da76bb89f49e280c2897aebe4c41f?pvs=4')
}

export function openDocsLink () {
  return window.electron.checkerConfig.openExternalURL('https://docs.checker.network/your-checker-wallet')
}

export function toggleOpenAtLogin () {
  return window.electron.checkerConfig.toggleOpenAtLogin()
}

export function isOpenAtLogin () {
  return window.electron.checkerConfig.isOpenAtLogin()
}

export function exportSeedPhrase () {
  return window.electron.checkerConfig.exportSeedPhrase()
}

export function saveSubnetLogsAs () {
  return window.electron.checkerConfig.saveSubnetLogsAs()
}

export function checkForUpdates () {
  return window.electron.checkerConfig.checkForUpdates()
}
