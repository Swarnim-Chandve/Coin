"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Image from "next/image";
import { Button } from "../components/DemoComponents";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
// Add imports for modal and Zora Coins SDK
import Modal from "../components/Modal";
import { tradeCoin, getOnchainCoinDetails } from "@zoralabs/coins-sdk";
import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { baseSepolia } from "viem/chains";
// Add Inter font import at the top (for Next.js, add to _app or layout if needed):

function MemoryCard({ memory, onTip, comments, commentInputs, setComments, setCommentInputs, battleBadge }: {
  memory: any,
  onTip: (memory: any) => void,
  comments: { [coinAddress: string]: string[] },
  commentInputs: { [coinAddress: string]: string },
  setComments: React.Dispatch<React.SetStateAction<{ [coinAddress: string]: string[] }>>,
  setCommentInputs: React.Dispatch<React.SetStateAction<{ [coinAddress: string]: string }>>,
  battleBadge: { [coinAddress: string]: boolean },
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-5 flex flex-col items-center border border-gray-200 transition-transform duration-150 hover:scale-105 active:scale-100 mb-4">
      <Image src={memory.image} alt={memory.title} width={200} height={200} className="rounded-xl mb-3 object-cover shadow-md" />
      <div className="font-bold text-lg text-center mb-1 truncate w-full" title={memory.title}>{memory.title}</div>
      <div className="text-gray-600 text-sm text-center mb-2 line-clamp-2" title={memory.description}>{memory.description}</div>
      <div className="flex gap-2 mt-2">
        <a href={memory.zoraUrl} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="primary">View on Zora</Button>
        </a>
        <a href={`https://warpcast.com/~/compose?text=${encodeURIComponent(`Check out this memory on Rewind: \"${memory.title}\"`)}&embeds[]=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/frame/${memory.coinAddress}`)}`} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="secondary">Share</Button>
        </a>
        <Button size="sm" variant="secondary" onClick={() => onTip(memory)}>Tip with Coin</Button>
      </div>
      <div className="text-xs text-gray-400 mt-2 truncate w-full" title={memory.owner}>By: {memory.owner}</div>
      <div className="w-full mt-2">
        <div className="font-semibold text-xs mb-1">Comments:</div>
        <ul className="mb-2">
          {(comments[memory.coinAddress] || []).map((c, i) => <li key={i} className="text-xs text-gray-700">{c}</li>)}
        </ul>
        <div className="flex gap-1">
          <input
            type="text"
            value={commentInputs[memory.coinAddress] || ""}
            onChange={e => setCommentInputs(ci => ({...ci, [memory.coinAddress]: e.target.value}))}
            className="flex-1 border rounded px-2 py-1 text-xs"
            placeholder="Add a comment..."
          />
          <Button size="xs" variant="secondary" onClick={() => {
            if ((commentInputs[memory.coinAddress] || "").trim()) {
              setComments(cs => ({...cs, [memory.coinAddress]: [...(cs[memory.coinAddress] || []), commentInputs[memory.coinAddress]]}));
              setCommentInputs(ci => ({...ci, [memory.coinAddress]: ""}));
            }
          }}>Post</Button>
        </div>
      </div>
      {battleBadge[memory.coinAddress] && (
        <div className="text-xs text-yellow-600 font-bold mt-1">🏆 Battle Winner</div>
      )}
    </div>
  );
}

export default function GalleryPage() {
  const { address } = useAccount();
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [allMemories, setAllMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ total: number; uniqueMinters: number; recent: any[] } | null>(null);
  // Tip modal state
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const [tipMemory, setTipMemory] = useState<any | null>(null);
  const [tipAmount, setTipAmount] = useState("");
  const [tipStatus, setTipStatus] = useState<null | "idle" | "pending" | "success" | "error">(null);
  const [tipError, setTipError] = useState<string | null>(null);
  // Leaderboard state
  const [holders, setHolders] = useState<{ [coinAddress: string]: { address: string, balance: string }[] }>({});
  const [loadingHolders, setLoadingHolders] = useState<{ [coinAddress: string]: boolean }>({});
  // Add at the top of the component
  const [globalTippers, setGlobalTippers] = useState<{address: string, total: number}[]>([]);
  const [globalHolders, setGlobalHolders] = useState<{address: string, total: number}[]>([]);
  const [recentActivity, setRecentActivity] = useState<{address: string, amount: string, memory: string, time: string}[]>([]);
  // Add at the top of the component (after other state):
  const myTips = globalTippers.find(t => t.address === address)?.total || 0;
  const myMemories = allMemories.filter(m => m.owner?.toLowerCase() === address?.toLowerCase()).length;
  const myCoins = Object.values(holders).reduce((acc, arr) => acc + (arr.find(h => h.address?.toLowerCase() === address?.toLowerCase()) ? 1 : 0), 0);
  // Add at the top of the component:
  const [showConfetti, setShowConfetti] = useState(false);
  // At the top of the component:
  const [comments, setComments] = useState<{[coinAddress: string]: string[]}>({});
  const [commentInputs, setCommentInputs] = useState<{[coinAddress: string]: string}>({});
  // Add at the top of the component (after other state):
  const [battleModalOpen, setBattleModalOpen] = useState(false);
  const [battleMemories, setBattleMemories] = useState<any[]>([]);
  const [battleTips, setBattleTips] = useState<{[coinAddress: string]: number}>({});
  const [battleWinner, setBattleWinner] = useState<string | null>(null);
  const [battleBadge, setBattleBadge] = useState<{[coinAddress: string]: boolean}>({});
  const battleDuration = 5 * 60 * 1000; // 5 minutes
  const [battleEndTime, setBattleEndTime] = useState<number | null>(null);

  useEffect(() => {
    async function fetchMemories() {
      setLoading(true);
      const res = await fetch("/api/memories");
      const data = await res.json();
      setAllMemories(data.memories || []);
      setLoading(false);
    }
    async function fetchStats() {
      const res = await fetch("/api/memories/stats");
      const data = await res.json();
      setStats(data);
    }
    fetchMemories();
    fetchStats();
  }, [address]);

  useEffect(() => {
    if (address && tab === "all") {
      setTab("mine");
    }
  }, [address]);

  // Fetch holders for leaderboard when tip modal opens or on demand
  async function fetchHolders(coinAddress: string) {
    setLoadingHolders(prev => ({ ...prev, [coinAddress]: true }));
    try {
      const publicClient = createPublicClient({ chain: baseSepolia, transport: http(process.env.NEXT_PUBLIC_ZORA_RPC_URL!) });
      const details = await getOnchainCoinDetails({ coin: coinAddress, publicClient });
      // details.owners is an array of addresses, details.totalSupply, etc.
      // For demo, just show owners (balances not included in details.owners, so you may need to fetch balances per owner)
      setHolders(prev => ({ ...prev, [coinAddress]: (details.owners || []).map(addr => ({ address: addr, balance: "?" })) }));
    } catch (e) {
      setHolders(prev => ({ ...prev, [coinAddress]: [] }));
    } finally {
      setLoadingHolders(prev => ({ ...prev, [coinAddress]: false }));
    }
  }

  // Tip logic
  async function handleTip() {
    if (!tipMemory || !tipAmount || !address) return;
    setTipError(null);
    // Validate tip amount (must be > 0.0001 ETH)
    let parsedAmount: bigint;
    try {
      parsedAmount = parseEther(tipAmount);
    } catch {
      setTipError("Invalid ETH amount");
      return;
    }
    if (parsedAmount < parseEther("0.0001")) {
      setTipError("Tip amount must be at least 0.0001 ETH");
      return;
    }
    setTipStatus("pending");
    try {
      const publicClient = createPublicClient({ chain: baseSepolia, transport: http(process.env.NEXT_PUBLIC_ZORA_RPC_URL!) });
      const walletClient = createWalletClient({ account: address, chain: baseSepolia, transport: http(process.env.NEXT_PUBLIC_ZORA_RPC_URL!) });
      const buyParams = {
        direction: "buy" as const,
        target: tipMemory.coinAddress,
        args: {
          recipient: address,
          orderSize: parsedAmount,
          minAmountOut: 0n,
        },
      };
      await tradeCoin(buyParams, walletClient, publicClient);
      setTipStatus("success");
      // Optionally, refresh holders
      fetchHolders(tipMemory.coinAddress);
      setRecentActivity(prev => [{address, amount: tipAmount, memory: tipMemory.title, time: new Date().toLocaleTimeString()}, ...prev.slice(0,9)]);
      setGlobalTippers(prev => {
        const idx = prev.findIndex(t => t.address === address);
        const amt = parseFloat(tipAmount);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx].total += amt;
          return updated.sort((a,b) => b.total - a.total).slice(0,5);
        } else {
          return [...prev, {address, total: amt}].sort((a,b) => b.total - a.total).slice(0,5);
        }
      });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
      if (typeof window !== "undefined" && window.sdk?.haptics?.impactOccurred) {
        window.sdk.haptics.impactOccurred("medium");
      }
    } catch (e: any) {
      setTipStatus("error");
      setTipError(e?.message || "Failed to tip");
    }
  }

  // Debug: Log address and memory owners
  useEffect(() => {
    console.log('Connected address:', address);
    console.log('All memory owners:', allMemories.map(m => m.owner));
  }, [address, allMemories]);

  const mine = address ? allMemories.filter(m => m.owner?.toLowerCase() === address.toLowerCase()) : [];
  const memoriesToShow = tab === "all" ? allMemories : mine;

  function startBattle() {
    if (allMemories.length < 2) return;
    const shuffled = [...allMemories].sort(() => Math.random() - 0.5);
    setBattleMemories([shuffled[0], shuffled[1]]);
    setBattleTips({[shuffled[0].coinAddress]: 0, [shuffled[1].coinAddress]: 0});
    setBattleWinner(null);
    setBattleEndTime(Date.now() + battleDuration);
    setBattleModalOpen(true);
  }

  useEffect(() => {
    if (!battleModalOpen || !battleEndTime) return;
    const timer = setInterval(() => {
      if (Date.now() >= battleEndTime) {
        endBattle();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [battleModalOpen, battleEndTime]);

  function endBattle() {
    setBattleModalOpen(false);
    if (battleMemories.length === 2) {
      const [m1, m2] = battleMemories;
      const t1 = battleTips[m1.coinAddress] || 0;
      const t2 = battleTips[m2.coinAddress] || 0;
      let winner = null;
      if (t1 > t2) winner = m1.coinAddress;
      else if (t2 > t1) winner = m2.coinAddress;
      setBattleWinner(winner);
      if (winner) setBattleBadge(b => ({...b, [winner]: true}));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white py-10 px-2" style={{fontFamily: 'Inter, sans-serif'}}>
      <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-600 to-blue-500 shadow-lg mb-6 py-3 px-4 flex items-center justify-center" style={{fontFamily: 'Inter, sans-serif'}}>
        <span className="text-white text-2xl font-extrabold tracking-tight">Rewind Coins</span>
      </div>
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-3xl font-extrabold text-center mb-6">Memory Gallery</h1>
        {(globalTippers.length > 0 || globalHolders.length > 0) && (
          <div className="mb-8">
            <h2 className="text-xl font-extrabold text-gray-700 mb-2 mt-8 border-b-2 border-blue-200 pb-1 text-center">Leaderboard</h2>
            {globalTippers.length > 0 && (
              <div className="mb-2">
                <div className="font-semibold">Top Tippers:</div>
                <ul>
                  {globalTippers.map((t, i) => <li key={t.address}>{i+1}. {t.address.slice(0,8)}...{t.address.slice(-4)}: {t.total.toFixed(4)} ETH</li>)}
                </ul>
              </div>
            )}
            {globalHolders.length > 0 && (
              <div className="mb-2">
                <div className="font-semibold">Top Holders:</div>
                <ul>
                  {globalHolders.map((h, i) => <li key={h.address}>{i+1}. {h.address.slice(0,8)}...{h.address.slice(-4)}: {h.total} coins</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        {recentActivity.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-2 text-center">Recent Activity</h2>
            <ul>
              {recentActivity.map((a, i) => <li key={i}>{a.time}: {a.address.slice(0,8)}... tipped {a.amount} ETH to {a.memory}</li>)}
            </ul>
          </div>
        )}
        {address && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-2 text-center">My Stats</h2>
            <div className="flex flex-wrap justify-center gap-6">
              <div className="bg-green-50 rounded-lg px-4 py-2 text-green-800 font-bold text-lg shadow">Tips Sent: {myTips.toFixed(4)} ETH</div>
              <div className="bg-yellow-50 rounded-lg px-4 py-2 text-yellow-800 font-bold text-lg shadow">Coins Held: {myCoins}</div>
              <div className="bg-blue-50 rounded-lg px-4 py-2 text-blue-800 font-bold text-lg shadow">Memories Created: {myMemories}</div>
            </div>
          </div>
        )}
        {/* Leaderboard/Stats Section */}
        {stats && (
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-6 mb-4">
              <div className="bg-blue-50 rounded-lg px-4 py-2 text-blue-800 font-bold text-lg shadow">Total Memories: {stats.total}</div>
              <div className="bg-purple-50 rounded-lg px-4 py-2 text-purple-800 font-bold text-lg shadow">Unique Minters: {stats.uniqueMinters}</div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2 text-center">Most Recent Memories</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {stats.recent.map((memory) => (
                  <div key={memory.id} className="bg-gray-100 rounded-lg p-3 flex flex-col items-center shadow">
                    <Image src={memory.image} alt={memory.title} width={80} height={80} className="rounded mb-2 object-cover" />
                    <div className="font-semibold text-center text-base truncate w-full" title={memory.title}>{memory.title}</div>
                    <div className="text-xs text-gray-500 truncate w-full" title={memory.owner}>By: {memory.owner}</div>
                    {/* Leaderboard for this memory */}
                    <Button size="xs" variant="secondary" onClick={() => fetchHolders(memory.coinAddress)} disabled={loadingHolders[memory.coinAddress]}>Show Top Holders</Button>
                    {holders[memory.coinAddress] && (
                      <div className="mt-2 text-xs text-gray-700 w-full">
                        <div className="font-bold">Top Holders:</div>
                        <ul>
                          {holders[memory.coinAddress].length === 0 ? <li>No data</li> : holders[memory.coinAddress].map(h => <li key={h.address}>{h.address.slice(0, 8)}...{h.address.slice(-4)} (balance: {h.balance})</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Connect Wallet Button if not connected */}
        {!address && (
          <div className="flex justify-center mb-6">
            <ConnectWallet>
              <Button variant="primary" size="lg" className="rounded-full px-5 py-2 text-base font-semibold shadow-md transition bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-purple-600 hover:to-blue-600 focus:ring-4 focus:ring-blue-200">
                Connect Wallet
              </Button>
            </ConnectWallet>
          </div>
        )}
        <div className="flex justify-center mb-4">
          <Button variant="secondary" onClick={() => {
            if (allMemories.length > 0) {
              const random = allMemories[Math.floor(Math.random() * allMemories.length)];
              setTipMemory(random);
              setTipModalOpen(true);
            }
          }}>
            Surprise Me (Random Tip)
          </Button>
        </div>
        <div className="flex justify-center mb-4">
          <Button variant="primary" onClick={startBattle} disabled={allMemories.length < 2}>
            Start Coin Battle
          </Button>
        </div>
        <div className="flex justify-center gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg font-bold ${tab === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            onClick={() => setTab("all")}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-bold ${tab === "mine" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            onClick={() => setTab("mine")}
            disabled={!address}
            title={!address ? "Connect your wallet to see your memories" : undefined}
          >
            Mine
          </button>
        </div>
        {loading ? (
          <div className="text-center text-lg text-gray-500 py-10">Loading memories...</div>
        ) : memoriesToShow.length === 0 ? (
          <div className="text-center text-lg text-gray-400 py-10">
            {tab === "mine" && !address ? "Connect your wallet to see your memories." : "No memories found."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {memoriesToShow.map(memory => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onTip={(m) => { setTipMemory(m); setTipModalOpen(true); }}
                comments={comments}
                commentInputs={commentInputs}
                setComments={setComments}
                setCommentInputs={setCommentInputs}
                battleBadge={battleBadge}
              />
            ))}
          </div>
        )}
      </div>
      {/* Tip Modal */}
      {tipModalOpen && tipMemory && (
        <Modal open={tipModalOpen} onClose={() => { setTipModalOpen(false); setTipStatus(null); setTipError(null); }}>
          <div className="p-4">
            <h2 className="text-xl font-bold mb-2">Tip {tipMemory.title}</h2>
            <input
              type="number"
              min="0.001"
              step="0.001"
              placeholder="ETH amount"
              value={tipAmount}
              onChange={e => setTipAmount(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-2"
            />
            <Button onClick={handleTip} disabled={tipStatus === "pending" || !tipAmount || !!tipError}>Send Tip</Button>
            {tipStatus === "pending" && <div className="text-blue-600 mt-2">Sending tip...</div>}
            {tipStatus === "success" && (
              <>
                {showConfetti && <div className="text-4xl text-center animate-bounce mb-2">🎉🎉🎉🎉🎉</div>}
                <div className="text-green-600 mt-2">Tip sent! 🎉</div>
                <a
                  href={`https://warpcast.com/~/compose?text=${encodeURIComponent(`I just tipped ${tipAmount} ETH to ${tipMemory.title} on Rewind! Check it out: ${tipMemory.zoraUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2"
                >
                  <Button variant="secondary">Share to Farcaster</Button>
                </a>
              </>
            )}
            {tipStatus === "error" && <div className="text-red-600 mt-2">{tipError}</div>}
          </div>
        </Modal>
      )}
      {battleModalOpen && battleMemories.length === 2 && (
        <Modal open={battleModalOpen} onClose={endBattle}>
          <div className="flex flex-col items-center p-4">
            <h2 className="text-xl font-bold mb-4">Coin Battle!</h2>
            <div className="flex gap-6">
              {battleMemories.map((m, idx) => (
                <div key={m.coinAddress} className="bg-gray-100 rounded-lg p-4 flex flex-col items-center shadow min-w-[180px]">
                  <Image src={m.image} alt={m.title} width={80} height={80} className="rounded mb-2 object-cover" />
                  <div className="font-semibold text-center text-base truncate w-full" title={m.title}>{m.title}</div>
                  <div className="text-xs text-gray-500 truncate w-full mb-2" title={m.owner}>By: {m.owner}</div>
                  <div className="text-lg font-bold mb-2">Tips: {battleTips[m.coinAddress] || 0}</div>
                  <Button size="sm" variant="secondary" onClick={() => setBattleTips(t => ({...t, [m.coinAddress]: (t[m.coinAddress] || 0) + 1}))}>Tip for this!</Button>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-600">Battle ends in: {battleEndTime ? Math.max(0, Math.floor((battleEndTime - Date.now())/1000)) : 0}s</div>
            <Button className="mt-4" onClick={endBattle}>End Battle Now</Button>
          </div>
        </Modal>
      )}
    </div>
  );
} 