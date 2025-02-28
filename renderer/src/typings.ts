import { Activity, FILTransaction, FILTransactionProcessing } from '../../shared/typings'
export type { FILTransactionStatus } from '../../shared/typings'
export type { Activity, FILTransaction, FILTransactionProcessing }

declare global {
  interface Window {
    electron: {
      checkerBuildVersion: string;

      getActivities(): Promise<Activity[]>;
      getTotalJobsCompleted(): Promise<number>;
      onJobStatsUpdated (callback: (totalJobCount: number) => void): () => void;
      getUpdaterStatus(): Promise<{readyToUpdate: boolean}>;
      openReleaseNotes(): void;
      restartToUpdate(): void;

      getScheduledRewards: () => Promise<string>;

      checkerConfig: {
        getOnboardingCompleted: () => Promise<boolean>;
        setOnboardingCompleted: () => Promise<void>;
        getCheckerWalletAddress: () => Promise<string>;
        getDestinationWalletAddress: () => Promise<string | undefined>;
        setDestinationWalletAddress: (address: string | undefined) => Promise<void>;
        getCheckerWalletBalance: () => Promise<string>;
        getCheckerWalletTransactionsHistory: () => Promise<(FILTransaction|FILTransactionProcessing)[]>;
        transferAllFundsToDestinationWallet: () => Promise<void>;
        openExternalURL: (url: string) => void;
        toggleOpenAtLogin: () => void;
        isOpenAtLogin: () => Promise<boolean>;
        exportSeedPhrase: () => void;
        saveSubnetLogsAs: () => void;
        checkForUpdates: () => void;
      };
      checkerEvents: {
        onActivityLogged: (callback: (activity: Activity) => void) => () => void;
        onJobProcessed: (callback: (value: number) => void) => () => void;
        onEarningsChanged: (callback: (value: number) => void) => () => void;
        onReadyToUpdate: (callback: () => void) => () => void;
        onTransactionUpdate:
        (callback: (allTransactions: (FILTransaction|FILTransactionProcessing)[]) => void) => () => void;
        onBalanceUpdate: (callback: (balance: string) => void) => () => void;
        onScheduledRewardsUpdate: (callback: (balance: string) => void) => () => void;
      };
    };
  }
}

export function isFILTransactionProcessing (
  tx: FILTransaction | FILTransactionProcessing
): tx is FILTransactionProcessing {
  return tx.status === 'processing'
}

export function isFILTransactionConfirmed (tx: FILTransaction | FILTransactionProcessing): tx is FILTransaction {
  return tx.status !== 'processing'
}
