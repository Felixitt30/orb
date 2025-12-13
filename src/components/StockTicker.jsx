import { useStore } from '../store'

export function StockTicker() {
    const { prices } = useStore()

    const stocks = [
        { key: 'apple', symbol: 'AAPL', name: 'Apple' },
        { key: 'tesla', symbol: 'TSLA', name: 'Tesla' },
        { key: 'nvidia', symbol: 'NVDA', name: 'NVIDIA' }
    ]

    const cryptos = [
        { key: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
        { key: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
        { key: 'solana', symbol: 'SOL', name: 'Solana' }
    ]

    const formatPrice = (price) => {
        if (!price || price === 0) return '$--'
        return price >= 1000
            ? `$${(price / 1000).toFixed(2)}k`
            : `$${price.toFixed(2)}`
    }

    const formatChange = (change) => {
        if (!change || !isFinite(change)) return '0.00%'
        const sign = change >= 0 ? '+' : ''
        return `${sign}${change.toFixed(2)}%`
    }

    return (
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '12px 20px',
            paddingLeft: 'calc(var(--safe-area-left, 0px) + 20px)',
            paddingRight: 'calc(var(--safe-area-right, 0px) + 20px)',
            paddingBottom: 'max(12px, var(--safe-area-bottom, 0px))',
            display: 'flex',
            gap: 30,
            overflowX: 'auto',
            fontSize: 13,
            fontFamily: 'monospace',
            pointerEvents: 'auto',
            zIndex: 100
        }}>
            {/* Stocks Section */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <span style={{ color: '#888', fontWeight: 'bold', fontSize: 11 }}>STOCKS</span>
                {stocks.map(({ key, symbol }) => {
                    const price = prices[key]
                    const change = price?.usd_24h_change || 0
                    const isPositive = change >= 0

                    return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{symbol}</span>
                            <span style={{ color: '#aaa' }}>{formatPrice(price?.usd)}</span>
                            <span style={{
                                color: isPositive ? '#00ff00' : '#ff4444',
                                fontSize: 11
                            }}>
                                {formatChange(change)}
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* Divider */}
            <div style={{ width: 1, background: 'rgba(255, 255, 255, 0.1)' }} />

            {/* Crypto Section */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <span style={{ color: '#888', fontWeight: 'bold', fontSize: 11 }}>CRYPTO</span>
                {cryptos.map(({ key, symbol }) => {
                    const price = prices[key]
                    const change = price?.usd_24h_change || 0
                    const isPositive = change >= 0

                    return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{symbol}</span>
                            <span style={{ color: '#aaa' }}>{formatPrice(price?.usd)}</span>
                            <span style={{
                                color: isPositive ? '#00ff00' : '#ff4444',
                                fontSize: 11
                            }}>
                                {formatChange(change)}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
