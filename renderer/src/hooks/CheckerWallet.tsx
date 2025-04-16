import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getDestinationWalletAddress,
  setDestinationWalletAddress,
  getCheckerWalletAddress,
  getCheckerWalletBalance,
  getCheckerWalletTransactionsHistory,
  transferAllFundsToDestinationWallet
} from 'src/lib/checker-config'
import {
  FILTransaction,
  FILTransactionProcessing,
  isFILTransactionConfirmed,
  isFILTransactionProcessing
} from 'src/typings'
import { ethAddressFromDelegated } from '@glif/filecoin-address'

export interface Wallet {
  checkerAddress: string;
  checkerAddress0x: string;
  destinationFilAddress: string | undefined;
  walletBalance: string | undefined;
  walletTransactions: FILTransaction[] | undefined;
  editDestinationAddress: (address: string|undefined) => void;
  processingTransaction: FILTransactionProcessing | undefined;
  dismissCurrentTransaction: () => void;
  transferAllFundsToDestinationWallet: () => Promise<void>;
}

const useWallet = (): Wallet => {
  const [checkerAddress, setCheckerAddress] = useState<string>('')
  const [destinationFilAddress, setDestinationFilAddress] = useState<string>()
  const [walletBalance, setWalletBalance] = useState<string>()
  const [walletTransactions, setWalletTransactions] = useState<FILTransaction[]>()
  const [processingTransaction, setProcessingTransaction] = useState<FILTransactionProcessing>()

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const processingTxRef = useRef<typeof processingTransaction>(undefined)
  processingTxRef.current = processingTransaction

  const setTransactions = useCallback((
    transactions: (FILTransaction | FILTransactionProcessing)[]
  ) => {
    const { processing, confirmed } = splitWalletTransactions(transactions)

    setWalletTransactions(confirmed)

    if (
      processingTxRef.current &&
      isFILTransactionProcessing(processingTxRef.current) &&
      !processing
    ) {
      const wasSuccessful = confirmed.find(tx => tx.hash === processingTxRef.current?.hash)
      setProcessingTransaction({
        ...processingTxRef.current,
        status: wasSuccessful ? 'succeeded' : 'failed'
      })
      setTimeout(() => {
        setProcessingTransaction(undefined)
      }, 10_000)
    } else if (processing) {
      setProcessingTransaction(processing)
      clearTimeout(timeoutRef.current)
    }
    setWalletTransactions(confirmed)
  }, [])

  const editDestinationAddress = async (address: string | undefined) => {
    await setDestinationWalletAddress(address)
    setDestinationFilAddress(address)
  }

  const dismissCurrentTransaction = () => {
    if (processingTransaction && processingTransaction.status !== 'processing') {
      setProcessingTransaction(undefined)
    }
  }

  // Load initial data

  useEffect(() => {
    const loadStoredInfo = async () => {
      setDestinationFilAddress(await getDestinationWalletAddress())
    }
    loadStoredInfo()
  }, [destinationFilAddress])

  useEffect(() => {
    const loadStoredInfo = async () => {
      setCheckerAddress(await getCheckerWalletAddress())
    }
    loadStoredInfo()
  }, [checkerAddress])

  useEffect(() => {
    const loadStoredInfo = async () => {
      setWalletBalance(await getCheckerWalletBalance())
    }
    loadStoredInfo()
  }, [])

  useEffect(() => {
    const loadStoredInfo = async () => {
      setTransactions(await getCheckerWalletTransactionsHistory())
    }
    loadStoredInfo()
  }, [setTransactions])

  // Subscribe to events

  useEffect(() => {
    const unsubscribeOnTransactionUpdate = window.electron.checkerEvents.onTransactionUpdate(
      setTransactions
    )
    return () => {
      unsubscribeOnTransactionUpdate()
    }
  }, [setTransactions])

  useEffect(() => {
    const unsubscribeOnBalanceUpdate = window.electron.checkerEvents.onBalanceUpdate(balance => {
      setWalletBalance(balance)
    })
    return () => {
      unsubscribeOnBalanceUpdate()
    }
  }, [walletBalance])

  return {
    checkerAddress,
    checkerAddress0x: checkerAddress !== ''
      ? ethAddressFromDelegated(checkerAddress)
      : '',
    destinationFilAddress,
    walletBalance,
    walletTransactions,
    editDestinationAddress,
    processingTransaction,
    dismissCurrentTransaction,
    transferAllFundsToDestinationWallet
  }
}

interface SplitTransactions {
  processing: FILTransactionProcessing | undefined;
  confirmed: FILTransaction[];
}

const splitWalletTransactions = (transactions: (FILTransaction|FILTransactionProcessing)[]): SplitTransactions => {
  return {
    processing: transactions.find(isFILTransactionProcessing),
    confirmed: transactions.filter(isFILTransactionConfirmed)
  }
}

export default useWallet
