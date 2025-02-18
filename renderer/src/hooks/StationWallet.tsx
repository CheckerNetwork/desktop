import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getDestinationWalletAddress,
  setDestinationWalletAddress,
  getStationWalletAddress,
  getStationWalletBalance,
  getStationWalletTransactionsHistory,
  transferAllFundsToDestinationWallet
} from 'src/lib/station-config'
import {
  FILTransaction,
  FILTransactionProcessing,
  isFILTransactionConfirmed,
  isFILTransactionProcessing
} from 'src/typings'
import { ethAddressFromDelegated } from '@glif/filecoin-address'

export interface Wallet {
  stationAddress: string;
  stationAddress0x: string;
  destinationFilAddress: string | undefined;
  walletBalance: string | undefined;
  walletTransactions: FILTransaction[] | undefined;
  editDestinationAddress: (address: string|undefined) => void;
  processingTransaction: FILTransactionProcessing | undefined;
  dismissCurrentTransaction: () => void;
  transferAllFundsToDestinationWallet: () => Promise<void>;
}

const useWallet = (): Wallet => {
  const [stationAddress, setStationAddress] = useState<string>('')
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
      setStationAddress(await getStationWalletAddress())
    }
    loadStoredInfo()
  }, [stationAddress])

  useEffect(() => {
    const loadStoredInfo = async () => {
      setWalletBalance(await getStationWalletBalance())
    }
    loadStoredInfo()
  }, [])

  useEffect(() => {
    const loadStoredInfo = async () => {
      setTransactions(await getStationWalletTransactionsHistory())
    }
    loadStoredInfo()
  }, [setTransactions])

  // Subscribe to events

  useEffect(() => {
    const unsubscribeOnTransactionUpdate = window.electron.stationEvents.onTransactionUpdate(
      setTransactions
    )
    return () => {
      unsubscribeOnTransactionUpdate()
    }
  }, [setTransactions])

  useEffect(() => {
    const unsubscribeOnBalanceUpdate = window.electron.stationEvents.onBalanceUpdate(balance => {
      setWalletBalance(balance)
    })
    return () => {
      unsubscribeOnBalanceUpdate()
    }
  }, [walletBalance])

  return {
    stationAddress,
    stationAddress0x: stationAddress !== ''
      ? ethAddressFromDelegated(stationAddress)
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
