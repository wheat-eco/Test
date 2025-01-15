'use client'

import { useState, useEffect } from 'react'
import { OKXUniversalConnectUI, THEME } from "@okxconnect/ui"
import { OKXSuiProvider } from "@okxconnect/sui-provider"
import { SuiClient } from '@mysten/sui/client'
import { TransactionBlock } from '@mysten/sui/transactions'

export default function SuiWalletConnect() {
  const [okxUniversalConnectUI, setOkxUniversalConnectUI] = useState<any>(null)
  const [suiProvider, setSuiProvider] = useState<any>(null)
  const [suiClient, setSuiClient] = useState<SuiClient | null>(null)
  const [connected, setConnected] = useState(false)
  const [accountInfo, setAccountInfo] = useState<{ address: string; publicKey: string } | null>(null)
  const [balance, setBalance] = useState<string>('0')
  const [objects, setObjects] = useState<any[]>([])

  useEffect(() => {
    const initOKXConnect = async () => {
      const okxUI = await OKXUniversalConnectUI.init({
        dappMetaData: {
          icon: "https://static.okx.com/cdn/assets/imgs/247/58E63FEA47A2B7D7.png",
          name: "WheatChain Dapp"
        },
        actionsConfiguration: {
          returnStrategy: 'none',
          modals: "all"
        },
        language: "en_US",
        uiPreferences: {
          theme: THEME.LIGHT
        },
      })
      setOkxUniversalConnectUI(okxUI)
      const provider = new OKXSuiProvider(okxUI)
      setSuiProvider(provider)
      
      // Initialize SuiClient
      const client = new SuiClient({ url: 'https://fullnode.mainnet.sui.io' })
      setSuiClient(client)
    }

    initOKXConnect()
  }, [])

  const connectWallet = async () => {
    if (!okxUniversalConnectUI) return

    try {
      const session = await okxUniversalConnectUI.openModal({
        namespaces: {
          sui: {
            chains: ["sui:mainnet"]
          }
        }
      })

      if (session) {
        setConnected(true)
        const account = await suiProvider.getAccount()
        setAccountInfo(account)
        await fetchBalance(account.address)
        await fetchObjects(account.address)
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  const disconnectWallet = () => {
    setConnected(false)
    setAccountInfo(null)
    setBalance('0')
    setObjects([])
  }

  const fetchBalance = async (address: string) => {
    if (!suiClient) return
    const balance = await suiClient.getBalance({
      owner: address,
    })
    setBalance(balance.totalBalance)
  }

  const fetchObjects = async (address: string) => {
    if (!suiClient) return
    const objectsResponse = await suiClient.getOwnedObjects({
      owner: address,
      options: { showContent: true },
    })
    setObjects(objectsResponse.data.slice(0, 5)) // Limiting to first 5 objects for simplicity
  }

  const sendTransaction = async () => {
    if (!suiClient || !accountInfo) return

    const tx = new TransactionBlock()
    const [coin] = tx.splitCoins(tx.gas, [1000])
    tx.transferObjects([coin], tx.pure(accountInfo.address))

    try {
      const result = await suiProvider.signAndExecuteTransactionBlock({
        transactionBlock: tx,
      })
      console.log('Transaction result:', result)
      // Refresh balance and objects after transaction
      await fetchBalance(accountInfo.address)
      await fetchObjects(accountInfo.address)
    } catch (error) {
      console.error('Transaction failed:', error)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Sui Wallet Connect</h1>
      {!connected ? (
        <button
          onClick={connectWallet}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Connect Sui Wallet
        </button>
      ) : (
        <div>
          <p className="mb-2">Connected to Sui Wallet</p>
          <p className="mb-2">Address: {accountInfo?.address}</p>
          <p className="mb-2">Public Key: {accountInfo?.publicKey}</p>
          <p className="mb-2">Balance: {balance} SUI</p>
          <h2 className="text-xl font-bold mt-4 mb-2">Owned Objects (First 5):</h2>
          <ul className="mb-4">
            {objects.map((obj, index) => (
              <li key={index} className="mb-1">
                ID: {obj.data?.objectId}, Type: {obj.data?.type}
              </li>
            ))}
          </ul>
          <button
            onClick={sendTransaction}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Send Test Transaction
          </button>
          <button
            onClick={disconnectWallet}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}

