'use client'

import { useState, useEffect } from 'react'
import { OKXUniversalConnectUI, THEME } from "@okxconnect/ui"
import { OKXSuiProvider } from "@okxconnect/sui-provider"

export default function SuiWalletConnect() {
  const [okxUniversalConnectUI, setOkxUniversalConnectUI] = useState < any > (null)
  const [suiProvider, setSuiProvider] = useState < any > (null)
  const [connected, setConnected] = useState(false)
  const [accountInfo, setAccountInfo] = useState < { address: string;publicKey: string } | null > (null)
  const [balances, setBalances] = useState < {
    [key: string]: string } > ({})
  const [objects, setObjects] = useState < any[] > ([])

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
        await fetchBalances(account.address)
        await fetchObjects(account.address)
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  const disconnectWallet = () => {
    setConnected(false)
    setAccountInfo(null)
    setBalances({})
    setObjects([])
  }

  const fetchBalances = async (address: string) => {
    if (!suiProvider) return
    try {
      const coins = await suiProvider.getCoins(address)
      const balanceMap: {
        [key: string]: string } = {}
      coins.forEach(coin => {
        const balance = (BigInt(coin.balance) / BigInt(1e9)).toString()
        balanceMap[coin.coinType] = balance
      })
      setBalances(balanceMap)
    } catch (error) {
      console.error("Failed to fetch balances:", error)
    }
  }

  const fetchObjects = async (address: string) => {
    if (!suiProvider) return
    try {
      const objectsResponse = await suiProvider.getOwnedObjects(address)
      setObjects(objectsResponse.slice(0, 5))
    } catch (error) {
      console.error("Failed to fetch objects:", error)
    }
  }

  const sendTransaction = async () => {
    if (!suiProvider || !accountInfo) return

    try {
      const tx = await suiProvider.buildTransferTransaction({
        amount: '1000000', // 0.001 SUI (1000000 MIST)
        recipient: accountInfo.address,
        gasBudget: '10000',
      })
      const result = await suiProvider.signAndExecuteTransaction(tx)
      console.log('Transaction result:', result)
      await fetchBalances(accountInfo.address)
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
          <h2 className="text-xl font-bold mt-4 mb-2">Balances:</h2>
          <ul className="mb-4">
            {Object.entries(balances).map(([coinType, balance]) => (
              <li key={coinType} className="mb-1">
                {coinType}: {balance} SUI
              </li>
            ))}
          </ul>
          <h2 className="text-xl font-bold mt-4 mb-2">Owned Objects (First 5):</h2>
          <ul className="mb-4">
            {objects.map((obj, index) => (
              <li key={index} className="mb-1">
                ID: {obj.objectId}, Type: {obj.type}
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