
import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react'
import { ethers } from 'ethers'
import { useEffect } from 'react'
import { useStore } from '../store'

export default function Web3Sync() {
    const { address, isConnected } = useWeb3ModalAccount()
    const { walletProvider } = useWeb3ModalProvider()
    const setWeb3Provider = useStore(state => state.setWeb3Provider)

    useEffect(() => {
        if (isConnected && walletProvider && address) {
            // Create Ethers provider from the EIP1193 provider returned by Web3Modal
            const ethersProvider = new ethers.BrowserProvider(walletProvider)

            console.log("[Web3Sync] Synced WalletConnect provider to store", address)
            setWeb3Provider(ethersProvider, address)
        }
    }, [isConnected, walletProvider, address, setWeb3Provider])

    return null
}
