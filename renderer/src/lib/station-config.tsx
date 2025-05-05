import { Activity, FILTransaction, FILTransactionProcessing } from 'src/typings'
import pDebounce from 'p-debounce'

export async function getOnboardingCompleted (): Promise<boolean> {
  return await window.electron.stationConfig.getOnboardingCompleted()
}

export async function setOnboardingCompleted (): Promise<void> {
  return await window.electron.stationConfig.setOnboardingCompleted()
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
  return await window.electron.stationConfig.getDestinationWalletAddress()
}

export async function setDestinationWalletAddress (address: string | undefined): Promise<void> {
  return await window.electron.stationConfig.setDestinationWalletAddress(address)
}

export async function getStationWalletAddress (): Promise<string> {
  return await window.electron.stationConfig.getStationWalletAddress()
}

export async function getStationWalletBalance (): Promise<string> {
  return await window.electron.stationConfig.getStationWalletBalance()
}

export const getStationWalletTransactionsHistory = pDebounce(
  async function (): Promise<(FILTransaction|FILTransactionProcessing)[]> {
    return await window.electron.stationConfig.getStationWalletTransactionsHistory()
  },
  0
)

export async function transferAllFundsToDestinationWallet (): Promise<void> {
  return await window.electron.stationConfig.transferAllFundsToDestinationWallet()
}

export function browseTransactionTracker (transactionHash: string): void {
  return window.electron.stationConfig.openExternalURL(`https://beryx.zondax.ch/v1/search/fil/mainnet/address/${transactionHash}`)
}

export function openExternalURL (url: string): void {
  return window.electron.stationConfig.openExternalURL(url)
}

export function openBeryx (): void {
  return window.electron.stationConfig.openExternalURL('https://beryx.io/')
}

export function showTermsOfService (): void {
  return window.electron.stationConfig.openExternalURL('https://pl-strflt.notion.site/Station-Terms-Conditions-e97da76bb89f49e280c2897aebe4c41f?pvs=4')
}

export function openDocsLink () {
  return window.electron.stationConfig.openExternalURL('https://docs.filstation.app/your-station-wallet')
}

export function toggleOpenAtLogin () {
  return window.electron.stationConfig.toggleOpenAtLogin()
}

export function isOpenAtLogin () {
  return window.electron.stationConfig.isOpenAtLogin()
}

export function exportSeedPhrase () {
  return window.electron.stationConfig.exportSeedPhrase()
}

export function importSeedPhrase () {
  return window.electron.stationConfig.importSeedPhrase()
}

export function saveModuleLogsAs () {
  return window.electron.stationConfig.saveModuleLogsAs()
}

export function checkForUpdates () {
  return window.electron.stationConfig.checkForUpdates()
}
