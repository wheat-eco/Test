'use client'

import { useState, useEffect } from 'react'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { fromB64, toB64 } from '@mysten/sui/utils'
import * as bip39 from '@scure/bip39'
import { SuiClient } from '@mysten/sui/client'

interface Account {
  address: string
  keypair: Ed25519Keypair
  mnemonic?: string
}

export default function WalletManager() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null)
  const [mnemonic, setMnemonic] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [suiClient, setSuiClient] = useState<SuiClient | null>(null)

  useEffect(() => {
    const client = new SuiClient({ url: 'https://fullnode.mainnet.sui.io' })
    setSuiClient(client)
  }, [])

  const createNewWallet = () => {
    const newMnemonic = bip39.generateMnemonic()
    const seed = bip39.mnemonicToSeedSync(newMnemonic)
    const keypair = Ed25519Keypair.deriveKeypair(newMnemonic)
    const newAccount: Account = {
      address: keypair.getPublicKey().toSuiAddress(),
      keypair,
      mnemonic: newMnemonic
    }
    setAccounts([...accounts, newAccount])
    setCurrentAccount(newAccount)
  }

  const importWallet = () => {
    let keypair: Ed25519Keypair
    if (mnemonic) {
      keypair = Ed25519Keypair.deriveKeypair(mnemonic)
    } else if (privateKey) {
      keypair = Ed25519Keypair.fromSecretKey(fromB64(privateKey))
    } else {
      alert('Please enter a mnemonic or private key')
      return
    }
    const newAccount: Account = {
      address: keypair.getPublicKey().toSuiAddress(),
      keypair,
      mnemonic: mnemonic || undefined
    }
    setAccounts([...accounts, newAccount])
    setCurrentAccount(newAccount)
    setMnemonic('')
    setPrivateKey('')
  }

  const switchAccount = (account: Account) => {
    setCurrentAccount(account)
  }

  const viewPrivateKey = () => {
    if (currentAccount) {
      alert(`Private Key: ${toB64(currentAccount.keypair.export().privateKey)}`)
    }
  }

  const viewMnemonic = () => {
    if (currentAccount && currentAccount.mnemonic) {
      alert(`Mnemonic: ${currentAccount.mnemonic}`)
    } else {
      alert('No mnemonic available for this account')
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Wallet Manager</h1>
      <button
        onClick={createNewWallet}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 w-full"
      >
        Create New Wallet
      </button>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter mnemonic"
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          className="border p-2 w-full mb-2"
        />
        <input
          type="text"
          placeholder="Enter private key"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          className="border p-2 w-full mb-2"
        />
        <button
          onClick={importWallet}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full"
        >
          Import Wallet
        </button>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Accounts</h2>
        {accounts.map((account, index) => (
          <div key={account.address} className="mb-2">
            <button
              onClick={() => switchAccount(account)}
              className={`py-2 px-4 rounded w-full ${
                currentAccount === account
                  ? 'bg-yellow-500 hover:bg-yellow-700'
                  : 'bg-gray-300 hover:bg-gray-400'
              } text-white font-bold`}
            >
              Account {index + 1}: {account.address.slice(0, 6)}...{account.address.slice(-4)}
            </button>
          </div>
        ))}
      </div>
      {currentAccount && (
        <div>
          <h2 className="text-xl font-bold mb-2">Current Account</h2>
          <p className="mb-2">Address: {currentAccount.address}</p>
          <button
            onClick={viewPrivateKey}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            View Private Key
          </button>
          <button
            onClick={viewMnemonic}
            className="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"
          >
            View Mnemonic
          </button>
        </div>
      )}
    </div>
  )
}

