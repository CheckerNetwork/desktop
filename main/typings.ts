import { Activity, FILTransaction, FILTransactionProcessing } from '../shared/typings'
export type { FILTransactionStatus } from '../shared/typings'
export type { Activity, FILTransaction, FILTransactionProcessing }

export interface BeryxTransaction {
  height: number;
  canonical: boolean;
  tx_timestamp: string;
  tipset_cid: string;
  block_cid: string;
  level: number;
  gas_used: string;
  tx_cid: string;
  id: string;
  parent_id: string;
  search_id: string;
  tx_from: string;
  tx_to: string;
  amount: number;
  status: 'Ok' | 'Fail';
  tx_type: string;
}

export interface BeryxTransactionsResponse {
  transactions: BeryxTransaction[];
  next_cursor: string;
}

export interface Context {
  recordActivity(activity: Activity): void;
  getActivities(): Activity[];
  setTotalJobsCompleted(count: number): void;
  getTotalJobsCompleted(): number;
  setScheduledRewardsForAddress(balance: string): void;
  getScheduledRewardsForAddress(): string;

  getScheduledRewards(): string;
  getWalletBalance(): string;

  showUI: () => void;
  isShowingUI: boolean;
  loadWebUIFromDist: import('electron-serve').loadURL;
  manualCheckForUpdates: () => void;
  saveModuleLogsAs: () => Promise<void>;

  openReleaseNotes: () => void;
  restartToUpdate: () => void;
  getUpdaterStatus: () => {readyToUpdate: boolean};
  openExternalURL: (url: string) => void;

  transactionUpdate: (transactions: (FILTransaction|FILTransactionProcessing)[]) => void;
  balanceUpdate: (balance:string) => void;

  toggleOpenAtLogin: () => void;
  isOpenAtLogin: () => boolean;
  exportSeedPhrase: () => void;
  importSeedPhrase: () => void;
}

export interface WalletSeed {
  seed: string;
  isNew: boolean;
}
