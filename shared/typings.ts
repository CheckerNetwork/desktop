import { ActivityEvent } from '@checkernetwork/node/dist/lib/activity'

export type FILTransactionStatus = 'succeeded' | 'processing' | 'failed'

export type FILTransaction = {
  hash: string;
  height: number;
  timestamp: number;
  status: FILTransactionStatus;
  outgoing: boolean;
  amount: string;
  address: string;
  error?: string;
}

export type Activity = ActivityEvent & {
  timestamp: Date;
  id: string;
}

// helper
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// FILTransaction with certain properties changed to optional
// A processing transaction can have all statuses, because we're briefly showing
// succeeded and failed ones in the same place as the processing one.
export type FILTransactionProcessing = PartialBy<FILTransaction, 'hash' | 'height'>
