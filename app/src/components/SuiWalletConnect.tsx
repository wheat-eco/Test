'use client'

import { useState, useEffect } from 'react'
import { OKXUniversalConnectUI, THEME } from "@okxconnect/ui"
import { OKXSuiProvider } from "@okxconnect/sui-provider"

export default function SuiWalletConnect() {
  const [okxUniversalConnectUI, setOkxUniversalConnectUI] = useState<any>(null)
  const [suiProvider, setSuiProvider] = useState<any>(null)
  const [connected, setConnected] = useState(false)
  const [accountInfo, setAccountInfo] = useState<{ address: string; publicKey: string } | null>(null)

  useEffect(() => {
    const initOKXConnect = async () => {
      const okxUI = await OKXUniversalConnectUI.init({
        dappMetaData: {
          icon: "https://raw.githubusercontent.com/wheat-eco/Aptos-Tokens/refs/heads/main/logos/SWHIT.png",
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
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  const disconnectWallet = () => {
    setConnected(false)
    setAccountInfo(null)
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
