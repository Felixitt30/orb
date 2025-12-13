import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const usePortfolio = create(
    persist(
        (set, get) => ({
            assets: [],

            addAsset: (symbol, amount) =>
                set({
                    assets: [...get().assets, { symbol, amount }]
                }),

            updateAsset: (symbol, amount) =>
                set({
                    assets: get().assets.map(a =>
                        a.symbol === symbol ? { ...a, amount } : a
                    )
                }),

            removeAsset: (symbol) =>
                set({
                    assets: get().assets.filter(a => a.symbol !== symbol)
                })
        }),
        { name: 'orb-portfolio' }
    )
)