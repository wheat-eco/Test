'use client'

import { useState, useEffect } from 'react'
import { OKXUniversalConnectUI, THEME } from "@okxconnect/ui"
import { OKXSuiProvider } from "@okxconnect/sui-provider"
import { JsonRpcProvider, SuiObjectResponse } from '@mysten/sui.js'

export default function SuiWalletConnect() {
  const [okxUniversalConnectUI, setOkxUniversalConnectUI] = useState<any>(null)
  const [suiProvider, setSuiProvider] = useState<any>(null)
  const [connected, setConnected] = useState(false)
  const [accountInfo, setAccountInfo] = useState<{ address: string; publicKey: string } | null>(null)
  const [network, setNetwork] = useState<string>('mainnet')
  const [balance, setBalance] = useState<string>('0')
  const [objects, setObjects] = useState<SuiObjectResponse[]>([])

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
            chains: [`sui:${network}`]
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

  const switchNetwork = async (newNetwork: string) => {
    if (!connected || !suiProvider) return

    try {
      await suiProvider.switchNetwork(`sui:${newNetwork}`)
      setNetwork(newNetwork)
      if (accountInfo) {
        await fetchBalance(accountInfo.address)
        await fetchObjects(accountInfo.address)
      }
    } catch (error) {
      console.error("Failed to switch network:", error)
    }
  }

  const fetchBalance = async (address: string) => {
    const provider = new JsonRpcProvider(`https://fullnode.${network}.sui.io`)
    const balance = await provider.getBalance({
      owner: address,
    })
    setBalance(balance.totalBalance)
  }

  const fetchObjects = async (address: string) => {
    const provider = new JsonRpcProvider(`https://fullnode.${network}.sui.io`)
    const objectsResponse = await provider.getOwnedObjects({
      owner: address,
      options: { showContent: true },
    })
    setObjects(objectsResponse.data.slice(0, 5)) // Limit to first 5 objects for simplicity
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
          <p className="mb-2">Network: {network}</p>
          <p className="mb-2">Balance: {balance} SUI</p>
          <div className="mb-2">
            <button
              onClick={() => switchNetwork('mainnet')}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mr-2"
            >
              Mainnet
            </button>
            <button
              onClick={() => switchNetwork('testnet')}
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded"
            >
              Testnet
            </button>
          </div>
          <div className="mb-2">
            <h2 className="text-xl font-bold">Objects (First 5):</h2>
            <ul>
              {objects.map((obj, index) => (
                <li key={index} className="mb-1">
                  ID: {obj.data?.objectId}, Type: {obj.data?.type}
                </li>
              ))}
            </ul>
          </div>
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

