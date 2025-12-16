import { useState } from 'react'
import { useStore } from '../store'

export default function LegalPages() {
    const [activePage, setActivePage] = useState(null)
    const { appVersion, changelog } = useStore()

    const pages = {
        privacy: {
            title: 'Privacy Policy',
            icon: '🔒',
            content: `
# Privacy Policy

**Last Updated: December 14, 2024**

## Data We Collect

ORB collects minimal, non-sensitive data to provide our service:

- **Wallet Addresses**: Read-only connection to view portfolio balances
- **Email (optional)**: Only if you choose email authentication
- **Settings Preferences**: Stored locally on your device
- **Anonymous Usage Data**: Feature usage patterns (no financial data)

## What We Don't Collect

- Private keys or seed phrases
- Transaction history details
- Personal financial records
- Location data

## How We Use Your Data

- Display portfolio sentiment visualization
- Personalize your app experience
- Improve app stability and features

## Data Storage

- Settings are stored locally in your browser
- No financial data is transmitted to external servers
- Session data is encrypted and temporary

## Third-Party Services

- CoinGecko API for cryptocurrency prices
- Yahoo Finance for stock data
- Wallet providers (MetaMask, Phantom) for authentication

## Your Rights

- Delete your data anytime via Settings
- Export your preferences
- Disconnect wallets at any time

## Contact

Questions? Contact us at privacy@orb.app
            `
        },
        terms: {
            title: 'Terms of Service',
            icon: '📜',
            content: `
# Terms of Service

**Last Updated: December 14, 2024**

## Acceptance of Terms

By using ORB, you agree to these terms. If you don't agree, please don't use the app.

## Service Description

ORB is a portfolio visualization tool that displays market sentiment based on your connected assets. It is **informational only**.

## Disclaimers

- **Not Financial Advice**: ORB does not provide financial, investment, or trading advice
- **No Guarantees**: We don't guarantee accuracy of price data or sentiment calculations
- **Third-Party Data**: Price data comes from third-party APIs (CoinGecko, Yahoo Finance)

## User Responsibilities

- Keep your wallet credentials secure
- ORB never asks for private keys or seed phrases
- Report any suspicious activity

## Limitations of Liability

ORB is provided "as is" without warranties. We are not liable for:
- Financial losses based on app information
- Data accuracy or availability issues
- Third-party service interruptions

## Changes to Terms

We may update these terms. Continued use constitutes acceptance.

## Contact

Questions? Contact us at legal@orb.app
            `
        },
        disclaimer: {
            title: 'Disclaimer',
            icon: '⚠️',
            content: `
# Financial Disclaimer

**IMPORTANT: Please Read Carefully**

## Not Financial Advice

ORB is a **visualization tool only**. Nothing displayed in this app constitutes:
- Financial advice
- Investment recommendations
- Trading signals
- Portfolio management guidance

## Read-Only Access

**ORB does not access or control user funds.**

All wallet connections are read-only. We can only view public balance information.

## Data Accuracy

- Price data is sourced from third-party APIs
- Delays between real market prices and displayed data may occur
- Sentiment calculations are algorithmic estimates, not guarantees

## User Responsibility

You are solely responsible for your investment decisions. Always:
- Do your own research (DYOR)
- Consult qualified financial advisors
- Understand the risks of cryptocurrency and stock investments

## No Liability

ORB, its creators, and affiliates accept no liability for:
- Investment losses
- Decisions based on app information
- Data inaccuracies

**By using ORB, you acknowledge that you understand and accept these terms.**
            `
        },
        changelog: {
            title: "What's New",
            icon: '✨',
            content: null // Dynamic content
        }
    }

    const renderChangelog = () => {
        return changelog.map((release, idx) => (
            <div key={idx} style={{ marginBottom: 24 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 12
                }}>
                    <span style={{
                        background: idx === 0 ? '#22c55e' : '#4b5563',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600
                    }}>
                        v{release.version}
                    </span>
                    <span style={{ color: '#666', fontSize: 12 }}>{release.date}</span>
                    {idx === 0 && (
                        <span style={{
                            background: 'rgba(34, 197, 94, 0.2)',
                            color: '#22c55e',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600
                        }}>
                            LATEST
                        </span>
                    )}
                </div>
                <ul style={{
                    margin: 0,
                    paddingLeft: 20,
                    color: '#aaa',
                    fontSize: 13,
                    lineHeight: 1.8
                }}>
                    {release.changes.map((change, i) => (
                        <li key={i}>{change}</li>
                    ))}
                </ul>
            </div>
        ))
    }

    if (!activePage) return null

    const page = pages[activePage]

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: 20
        }}>
            <div style={{
                background: 'linear-gradient(145deg, #1a1a1a, #252525)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                width: '100%',
                maxWidth: 600,
                maxHeight: '80vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <h2 style={{
                        margin: 0,
                        color: '#fff',
                        fontSize: 18,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10
                    }}>
                        <span>{page.icon}</span>
                        {page.title}
                    </h2>
                    <button
                        onClick={() => setActivePage(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#666',
                            fontSize: 20,
                            cursor: 'pointer',
                            padding: 4
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    padding: 24,
                    overflowY: 'auto',
                    color: '#ccc',
                    fontSize: 14,
                    lineHeight: 1.7
                }}>
                    {activePage === 'changelog' ? (
                        <>
                            <div style={{
                                marginBottom: 20,
                                padding: '12px 16px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: 8
                            }}>
                                <div style={{ fontSize: 12, color: '#888' }}>Current Version</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
                                    ORB v{appVersion}
                                </div>
                            </div>
                            {renderChangelog()}
                        </>
                    ) : (
                        <div
                            style={{ whiteSpace: 'pre-wrap' }}
                            dangerouslySetInnerHTML={{
                                __html: page.content
                                    .replace(/^# (.+)$/gm, '<h1 style="color:#fff;font-size:22px;margin:20px 0 12px">$1</h1>')
                                    .replace(/^## (.+)$/gm, '<h2 style="color:#fff;font-size:16px;margin:16px 0 8px">$1</h2>')
                                    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff">$1</strong>')
                                    .replace(/^- (.+)$/gm, '<div style="padding-left:16px;margin:4px 0">• $1</div>')
                            }}
                        />
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 20px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    textAlign: 'center'
                }}>
                    <span style={{ color: '#666', fontSize: 11 }}>
                        ORB v{appVersion} • © 2024 All rights reserved
                    </span>
                </div>
            </div>
        </div>
    )
}

// Export a hook to control the modal
export function useLegalPages() {
    const [activePage, setActivePage] = useState(null)

    return {
        activePage,
        openPrivacy: () => setActivePage('privacy'),
        openTerms: () => setActivePage('terms'),
        openDisclaimer: () => setActivePage('disclaimer'),
        openChangelog: () => setActivePage('changelog'),
        close: () => setActivePage(null),
        LegalModal: () => activePage ? <LegalPages /> : null
    }
}
