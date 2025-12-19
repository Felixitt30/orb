import React, { useState, useEffect } from 'react';
import { useStore } from '../store';

const NovaNodes = () => {
    const {
        isNovaNodesOpen,
        toggleNovaNodes,
        isDarkMode,
        novaNodes,
        fetchNovaData,
        stakeAVAX,
        claimNovaReward
    } = useStore();
    const [activeTab, setActiveTab] = useState('stake');
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (isNovaNodesOpen) {
            handleRefresh();
        }
    }, [isNovaNodesOpen]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchNovaData();
        setIsRefreshing(false);
    };

    if (!isNovaNodesOpen) return null;

    const styles = {
        overlay: {
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
        },
        container: {
            width: '100%',
            maxWidth: '960px',
            height: '85vh',
            backgroundColor: isDarkMode ? '#0a0a0f' : '#f8fafc',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            borderRadius: '28px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            color: isDarkMode ? '#fff' : '#0f172a',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative',
        },
        header: {
            padding: '24px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        },
        logo: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: 800,
            letterSpacing: '2px',
            fontSize: '1.25rem',
        },
        iconOrb: {
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #bd00ff, #ff0055)',
            borderRadius: '50%',
            boxShadow: '0 0 15px rgba(189, 0, 255, 0.6)',
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
        },
        closeBtn: {
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '8px',
        },
        statsBar: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            padding: '20px 32px',
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            gap: '24px',
        },
        statItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
        statLabel: { fontSize: '0.7rem', color: '#64748b', fontWeight: 600, letterSpacing: '1px' },
        statValue: { fontSize: '1.25rem', fontWeight: 800 },
        tabs: {
            display: 'flex',
            padding: '0 32px',
            gap: '32px',
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        },
        tabBtn: (active) => ({
            background: 'transparent',
            border: 'none',
            padding: '20px 0',
            color: active ? '#bd00ff' : '#64748b',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '1.5px',
            cursor: 'pointer',
            position: 'relative',
            borderBottom: active ? '2px solid #bd00ff' : '2px solid transparent',
            transition: 'all 0.2s',
        }),
        content: {
            flex: 1,
            padding: '32px',
            overflowY: 'auto',
        }
    };

    return (
        <div style={styles.overlay} onClick={() => toggleNovaNodes(false)}>
            <div style={styles.container} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <div style={{ ...styles.logo, cursor: 'pointer' }} onClick={handleRefresh}>
                        <div style={styles.iconOrb}></div>
                        <span>NOVA NODES</span>
                    </div>
                    <button style={styles.closeBtn} onClick={() => toggleNovaNodes(false)}>✕</button>
                </div>

                <div style={styles.statsBar}>
                    <div style={styles.statItem}>
                        <span style={styles.statLabel}>PROTOCOL TVL</span>
                        <span style={styles.statValue}>{Number(novaNodes.tvl).toLocaleString()} AVAX</span>
                    </div>
                    <div style={styles.statItem}>
                        <span style={styles.statLabel}>TOTAL NODES</span>
                        <span style={styles.statValue}>{novaNodes.totalNodes}</span>
                    </div>
                    <div style={styles.statItem}>
                        <span style={styles.statLabel}>NOVA PRICE</span>
                        <span style={styles.statValue}>${novaNodes.rewardTokenPrice}</span>
                    </div>
                </div>

                <div style={styles.tabs}>
                    <button style={styles.tabBtn(activeTab === 'stake')} onClick={() => setActiveTab('stake')}>STAKE & MINT</button>
                    <button style={styles.tabBtn(activeTab === 'nodes')} onClick={() => setActiveTab('nodes')}>MY NODES ({novaNodes.userNodes.length})</button>
                    <button style={styles.tabBtn(activeTab === 'rewards')} onClick={() => setActiveTab('rewards')}>REWARDS</button>
                </div>

                {novaNodes.userNodes.length > 0 && (
                    <div style={{
                        margin: '20px 32px 0',
                        padding: '12px 20px',
                        background: isDarkMode ? 'rgba(189, 0, 255, 0.05)' : 'rgba(189, 0, 255, 0.02)',
                        border: '1px solid rgba(189, 0, 255, 0.1)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>🧠</span>
                        <span style={{ fontSize: '0.8rem', color: isDarkMode ? '#bd00ff' : '#9333ea', fontWeight: 600 }}>
                            {novaNodes.userNodes.some(n => n.rarity === 'Rare' || n.rarity === 'Legendary')
                                ? "Your high-rarity nodes are in the top 15% for yield efficiency."
                                : "Pro Tip: Merging Common nodes has a 25% chance of creating an Uncommon node for higher APY."}
                        </span>
                    </div>
                )}

                <div style={styles.content}>
                    {activeTab === 'stake' && <StakeView isDarkMode={isDarkMode} onStake={stakeAVAX} balance={novaNodes.userAssetBalance} />}
                    {activeTab === 'nodes' && <NodesView isDarkMode={isDarkMode} nodes={novaNodes.userNodes} />}
                    {activeTab === 'rewards' && <RewardsView isDarkMode={isDarkMode} pending={novaNodes.pendingRewards} nodes={novaNodes.userNodes} onClaim={claimNovaReward} />}
                </div>
            </div>
            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

const StakeView = ({ isDarkMode, onStake, balance }) => {
    const [amount, setAmount] = useState('');
    const [isStaking, setIsStaking] = useState(false);

    const handleStake = async () => {
        if (!amount || isStaking) return;
        setIsStaking(true);
        try {
            await onStake(amount);
            setAmount('');
            alert('Stake successful! Token minted.');
        } catch (err) {
            console.error(err);
            if (err.code === 'ACTION_REJECTED' || err.code === 4001 || (err.message && err.message.includes('user rejected'))) {
                alert('Transaction cancelled. You rejected the request.');
            } else {
                alert('Stake failed: ' + (err.shortMessage || err.message));
            }
        } finally {
            setIsStaking(false);
        }
    };

    const styles = {
        grid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' },
        card: {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 1)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
            borderRadius: '20px',
            padding: '28px',
        },
        title: { fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' },
        desc: { fontSize: '0.9rem', color: '#64748b', marginBottom: '24px' },
        inputHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' },
        inputContainer: { marginBottom: '0' },
        inputBox: {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : '#f1f5f9',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            borderRadius: '12px',
            padding: '4px 16px',
            marginBottom: '24px',
        },
        input: {
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: isDarkMode ? '#fff' : '#000',
            padding: '12px 0',
            fontSize: '1.25rem',
            fontWeight: 700,
            outline: 'none',
        },
        btn: {
            width: '100%',
            background: isStaking ? '#333' : 'linear-gradient(90deg, #bd00ff, #ff0055)',
            border: 'none',
            color: '#fff',
            padding: '16px',
            borderRadius: '12px',
            fontWeight: 800,
            letterSpacing: '1px',
            cursor: isStaking ? 'wait' : 'pointer',
            opacity: isStaking ? 0.7 : 1,
            boxShadow: '0 10px 15px -3px rgba(189, 0, 255, 0.3)',
        }
    };

    return (
        <div style={styles.grid}>
            <div style={styles.card}>
                <div style={styles.title}>MINT NODE NFT</div>
                <div style={styles.desc}>Stake sAVAX to generate a Node NFT with randomized rarity.</div>
                <div style={styles.inputHeader}><span>Amount to Stake</span><span>Balance: {Number(balance).toFixed(2)} sAVAX</span></div>
                <div style={styles.inputBox}>
                    <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={styles.input} />
                    <span style={{ fontWeight: 700, color: '#64748b' }}>sAVAX</span>
                </div>
                <button style={styles.btn} onClick={handleStake} disabled={isStaking}>
                    {isStaking ? 'PROCESSING...' : 'STAKE & MINT NODE'}
                </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={styles.card}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px' }}>HOW IT WORKS</div>
                    <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                        <li>✨ <strong>Real Yield</strong>: Tokens earn from the protocol pool.</li>
                        <li>🧬 <strong>On-Chain Rarity</strong>: Rarity is determined at mint.</li>
                        <li>🌊 <strong>Liquid Stake</strong>: Represented as a tradeable NFT.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

const NodesView = ({ isDarkMode, nodes }) => {
    const styles = {
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' },
        card: {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 1)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
            borderRadius: '24px',
            padding: '24px',
            position: 'relative',
        },
        detailRow: { display: 'flex', justifyContent: 'space-between', marginTop: '16px' },
        label: { fontSize: '0.65rem', color: '#64748b' },
        value: { fontSize: '0.9rem', fontWeight: 700 }
    };

    if (nodes.length === 0) return <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>No nodes found. Stake sAVAX to mint your first node!</div>;

    return (
        <div style={styles.grid}>
            {nodes.map(node => (
                <div key={node.id} style={styles.card}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{node.id}</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: node.color, textTransform: 'uppercase' }}>{node.rarity}</div>
                    <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
                        <div style={{ width: '40px', height: '40px', backgroundColor: node.color, borderRadius: '50%', boxShadow: `0 0 20px ${node.color}` }}></div>
                    </div>
                    <div style={styles.detailRow}>
                        <div><div style={styles.label}>STAKED</div><div style={styles.value}>{Number(node.amount).toFixed(2)} sAVAX</div></div>
                        <div style={{ textAlign: 'right' }}><div style={styles.label}>BOOST</div><div style={styles.value}>{node.multiplier}</div></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const RewardsView = ({ isDarkMode, pending, nodes, onClaim }) => {
    const [isClaiming, setIsClaiming] = useState(false);

    const handleClaimAll = async () => {
        if (isClaiming || nodes.length === 0) return;
        setIsClaiming(true);
        try {
            for (const node of nodes) {
                await onClaim(node.tokenId);
            }
            alert('All rewards claimed successfully!');
        } catch (err) {
            alert('Claim failed: ' + err.message);
        } finally {
            setIsClaiming(false);
        }
    };

    const styles = {
        mainCard: {
            background: 'linear-gradient(135deg, rgba(189, 0, 255, 0.1) 0%, rgba(255, 0, 85, 0.05) 100%)',
            border: '1px solid rgba(189, 0, 255, 0.2)',
            borderRadius: '24px',
            padding: '40px',
            textAlign: 'center',
        },
        value: { fontSize: '2.5rem', fontWeight: 900, margin: '8px 0' },
        claimBtn: {
            background: isClaiming ? '#333' : (isDarkMode ? '#fff' : '#000'),
            color: isDarkMode ? '#000' : '#fff',
            border: 'none',
            padding: '16px 36px',
            borderRadius: '14px',
            fontWeight: 800,
            fontSize: '1rem',
            cursor: isClaiming ? 'wait' : 'pointer',
            opacity: isClaiming ? 0.7 : 1,
            marginTop: '24px'
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={styles.mainCard}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#bd00ff', letterSpacing: '2px' }}>PENDING REWARDS</div>
                <div style={styles.value}>{Number(pending).toFixed(6)} NOVA</div>
                <button style={styles.claimBtn} onClick={handleClaimAll} disabled={isClaiming || nodes.length === 0}>
                    {isClaiming ? 'CLAIMING...' : 'CLAIM ALL REWARDS'}
                </button>
            </div>
        </div>
    );
};

export default NovaNodes;
