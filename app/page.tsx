"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { Name, Avatar } from "@coinbase/onchainkit/identity";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "./components/DemoComponents";
import Image from "next/image";


function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function CoinItPage() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const { isConnected: isWalletConnected, address } = useAccount();
  const [prompt, setPrompt] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    symbol: "",
    image: "",
    properties: [{ key: "", value: "" }],
    metadata: [{ key: "", value: "" }],
  });
  const [status, setStatus] = useState<
    "idle" | "ipfs" | "minting" | "success" | "error"
  >("idle");
  const [zoraUrl, setZoraUrl] = useState<string | null>(null);
  const [modalMsg, setModalMsg] = useState<string>("");

  // Frame ready for MiniKit
  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [isFrameReady, setFrameReady]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Show form 2 seconds after image is generated
  useEffect(() => {
    if (image) {
      setShowForm(false);
      sleep(2000).then(() => setShowForm(true));
      setFormData((prev) => ({ ...prev, image }));
    } else {
      setShowForm(false);
    }
  }, [image]);

  // Handle prompt submit
  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (prompt.trim() === "") return;
    setSubmittedPrompt(prompt);
    setPrompt("");
    setLoading(true);
    setImage(null);
    setError(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.image) {
        setImage(`data:image/png;base64,${data.image}`);
      } else {
        setError(data.error || "Failed to generate image");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle form field changes
  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string, idx?: number, isMeta?: boolean) {
    if (field === "properties" || field === "metadata") {
      const arr = isMeta ? [...formData.metadata] : [...formData.properties];
      if (idx !== undefined) {
        if (e.target.name === "key" || e.target.name === "value") {
          arr[idx][e.target.name as "key" | "value"] = e.target.value;
          setFormData((prev) => ({ ...prev, [field]: arr }));
        }
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    }
  }

  // Add/remove property/metadata fields
  function addKeyValue(field: "properties" | "metadata") {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], { key: "", value: "" }] }));
  }
  function removeKeyValue(field: "properties" | "metadata", idx: number) {
    setFormData((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== idx) }));
  }

  // Handle image upload
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData((prev) => ({ ...prev, image: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  }

  // Handle form submit (IPFS upload integration)
  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("ipfs");
    setModalMsg("Uploading metadata to IPFS...");
    try {
      // Prepare data for API
      const propertiesObj = Object.fromEntries(formData.properties.filter(p => p.key).map(p => [p.key, p.value]));
      const metadataObj = Object.fromEntries(formData.metadata.filter(m => m.key).map(m => [m.key, m.value]));
      const metadataToSend = {
        name: formData.name,
        description: formData.description,
        symbol: formData.symbol,
        image: formData.image,
        properties: propertiesObj,
        metadata: metadataObj,
      };
      const res = await fetch("/api/upload-ipfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadataToSend),
      });
      const data = await res.json();
      if (data.cid) {
        setStatus("minting");
        setModalMsg("Minting your coin on Zora...");
        // Call create coin API
        try {
          const coinRes = await fetch("/api/create-coin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cid: data.cid,
              ...metadataToSend,
            }),
          });
          const coinData = await coinRes.json();
          if (coinData.success && coinData.address) {
            const url = `https://testnet.zora.co/coin/bsep:${coinData.address}`;
            setZoraUrl(url);
            setStatus("success");
            setModalMsg("Your coin is live! View it on Zora below.");
          } else {
            setStatus("error");
            setModalMsg(coinData.message || coinData.error || "Failed to create coin");
          }
        } catch (coinErr: unknown) {
          setStatus("error");
          if (coinErr instanceof Error) {
            setModalMsg(coinErr.message);
          } else {
            setModalMsg("Unknown error during coin creation");
          }
        }
      } else {
        setStatus("error");
        setModalMsg(data.error || "Failed to upload to IPFS");
      }
    } catch (err: unknown) {
      setStatus("error");
      if (err instanceof Error) {
        setModalMsg(err.message);
      } else {
        setModalMsg("Failed to upload to IPFS");
      }
    }
  }

  const inFrameContext = context !== null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans mini-app-theme">
      {/* Debug info for troubleshooting */}
      <div className="fixed top-2 left-2 z-50 text-xs bg-white/80 px-2 py-1 rounded shadow text-gray-700">
        <span>inFrameContext: {String(inFrameContext)} | isWalletConnected: {String(isWalletConnected)}</span>
      </div>
      {/* App Title */}
      <header className="flex flex-col items-center pt-6 pb-2 w-full max-w-2xl mx-auto px-2 sm:px-4">
        <span className="font-extrabold text-4xl sm:text-5xl tracking-tight mb-2 text-center select-none text-black drop-shadow-lg" style={{letterSpacing: '-0.03em'}}>coin it</span>
        <div className="w-full max-w-md flex flex-col items-center mb-2">
          <div className="bg-white rounded-2xl shadow-md px-4 sm:px-8 py-4 flex flex-col items-center w-full">
            {address ? (
              <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                <Avatar address={address} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full ring-4 ring-[var(--app-accent)] shadow bg-gray-100 flex items-center justify-center text-4xl" />
                <span className="font-bold text-lg sm:text-xl max-w-[220px] truncate text-center text-gray-900">
                  <Name address={address} />
                </span>
              </div>
            ) : (
              <ConnectWallet>
                <Button variant="primary" size="lg" className="text-lg sm:text-xl px-6 sm:px-8 py-3 sm:py-4 rounded-2xl mt-1 bg-[var(--app-accent)] text-white shadow hover:bg-[var(--app-accent-hover)] focus:ring-4 focus:ring-[var(--app-accent-light)]">
                  Connect Wallet
                </Button>
              </ConnectWallet>
            )}
          </div>
        </div>
      </header>
      {/* Main Card Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-2 sm:px-4 w-full max-w-2xl mx-auto">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl px-4 sm:px-8 py-6 sm:py-8 flex flex-col items-center">
          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col items-center gap-4 sm:gap-6"
          >
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Type your prompt..."
              className="w-full px-4 py-3 sm:px-5 sm:py-4 rounded-xl border border-[var(--app-card-border)] bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] text-lg sm:text-xl shadow-sm"
              autoFocus
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-lg sm:text-xl py-3 sm:py-4 bg-[var(--app-accent)] text-white rounded-xl shadow-lg hover:bg-[var(--app-accent-hover)] focus:ring-4 focus:ring-[var(--app-accent-light)]"
              disabled={prompt.trim() === ""}
            >
              Submit
            </Button>
          </form>
          {submittedPrompt && (
            <div className="mt-4 sm:mt-6 text-gray-500 text-center text-base sm:text-lg animate-fade-in">
              <span>Last prompt: </span>
              <span className="font-mono">{submittedPrompt}</span>
            </div>
          )}
          {loading && (
            <div className="mt-4 sm:mt-6 text-lg text-[var(--app-accent)] animate-pulse">Generating image...</div>
          )}
          {error && (
            <div className="mt-4 sm:mt-6 text-lg text-red-500">{error}</div>
          )}
          {image && !loading && (
            <div className="mt-6 sm:mt-8 flex flex-col items-center w-full">
              <span className="text-xl sm:text-3xl font-extrabold text-gray-900 mb-4 sm:mb-6 text-center">Generated Image</span>
              <div className="w-full flex justify-center">
                <Image
                  src={image}
                  alt={submittedPrompt || "Generated image"}
                  width={384}
                  height={384}
                  className="rounded-xl shadow-lg border border-[var(--app-card-border)] max-w-full h-auto object-contain max-h-[50vh]"
                  style={{ maxWidth: '100%', height: 'auto', maxHeight: '50vh' }}
                  priority
                />
              </div>
            </div>
          )}
          {/* Status Modal: only show if status !== 'idle' */}
          {status !== "idle" && (
            <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40`} onClick={() => {
              if (status === "success") {
                setStatus("idle");
                setShowForm(false);
                setZoraUrl(null);
              } else if (status === "error") {
                setStatus("idle");
              }
            }}>
              <div
                className={`rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in flex flex-col items-center ${status === "success" ? "bg-green-50" : "bg-white"}`}
                onClick={e => e.stopPropagation()}
              >
                {status === "ipfs" && (
                  <>
                    <div className="mb-4 text-2xl font-bold text-center">Uploading to IPFS...</div>
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <div className="text-gray-600 text-center">{modalMsg}</div>
                  </>
                )}
                {status === "minting" && (
                  <>
                    <div className="mb-4 text-2xl font-bold text-center">Minting Coin...</div>
                    <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-4"></div>
                    <div className="text-gray-600 text-center">{modalMsg}</div>
                  </>
                )}
                {status === "success" && (
                  <>
                    <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" fill="#bbf7d0" />
                      <path d="M8 12l2.5 2.5L16 9" stroke="#22c55e" strokeWidth="2.5" />
                    </svg>
                    <div className="mb-4 text-2xl font-bold text-center text-green-700">Coin Created!</div>
                    <div className="mb-2 text-gray-700 text-center">{modalMsg}</div>
                    {zoraUrl && (
                      <a href={zoraUrl} target="_blank" rel="noopener noreferrer" className="block mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-lg shadow hover:bg-blue-700 transition">View on Zora</a>
                    )}
                    <button className="mt-6 text-blue-500 underline" onClick={() => { setStatus("idle"); setShowForm(false); setZoraUrl(null); }}>Close</button>
                  </>
                )}
                {status === "error" && (
                  <>
                    <div className="mb-4 text-2xl font-bold text-center text-red-600">Error</div>
                    <div className="mb-2 text-gray-700 text-center">{modalMsg}</div>
                    <button className="mt-6 text-blue-500 underline" onClick={() => setStatus("idle")}>Close</button>
                  </>
                )}
              </div>
            </div>
          )}
          {/* Form Modal: only show if showForm && status === 'idle' */}
          {showForm && status === "idle" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative animate-fade-in">
                <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowForm(false)}>&times;</button>
                <h2 className="text-3xl font-bold mb-6 text-gray-900 text-center">Create Your Memory Coin</h2>
                <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <input type="text" className="input flex-1 text-lg px-5 py-4 rounded-xl border border-gray-300 focus:border-blue-400" placeholder="Name (e.g. Summer 2009)" value={formData.name} onChange={e => handleFormChange(e, "name")}
                      required />
                    <input type="text" className="input flex-1 text-lg px-5 py-4 rounded-xl border border-gray-300 focus:border-blue-400" placeholder="Symbol (e.g. SUM09)" value={formData.symbol} onChange={e => handleFormChange(e, "symbol")}
                      required />
                  </div>
                  <textarea className="input text-lg px-5 py-4 rounded-xl border border-gray-300 focus:border-blue-400 min-h-[100px]" placeholder="Description (What makes this memory special?)" value={formData.description} onChange={e => handleFormChange(e, "description")} required />
                  <div>
                    <label className="block mb-1 font-medium text-lg">Image</label>
                    {formData.image && <Image src={formData.image} alt="Coin" width={128} height={128} className="rounded-lg mb-2" />}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-2" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-lg">Properties <span className="text-gray-400 text-sm">(e.g. Location, Year, People)</span></label>
                    {formData.properties.map((p, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input type="text" name="key" placeholder="Key" value={p.key} onChange={e => handleFormChange(e, "properties", i)} className="input flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-400 text-base" />
                        <input type="text" name="value" placeholder="Value" value={p.value} onChange={e => handleFormChange(e, "properties", i)} className="input flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-400 text-base" />
                        <button type="button" onClick={() => removeKeyValue("properties", i)} className="text-red-500 text-xl">&times;</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addKeyValue("properties")}
                      className="text-sm text-blue-500 mt-1">+ Add Property</button>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-lg">Metadata <span className="text-gray-400 text-sm">(e.g. Song, Mood, Weather)</span></label>
                    {formData.metadata.map((m, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input type="text" name="key" placeholder="Key" value={m.key} onChange={e => handleFormChange(e, "metadata", i, true)} className="input flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-400 text-base" />
                        <input type="text" name="value" placeholder="Value" value={m.value} onChange={e => handleFormChange(e, "metadata", i, true)} className="input flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-400 text-base" />
                        <button type="button" onClick={() => removeKeyValue("metadata", i)} className="text-red-500 text-xl">&times;</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addKeyValue("metadata")}
                      className="text-sm text-blue-500 mt-1">+ Add Metadata</button>
                  </div>
                  {/* Form summary for user review */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-800">Review Details</h3>
                    <div className="mb-1"><span className="font-medium">Name:</span> {formData.name}</div>
                    <div className="mb-1"><span className="font-medium">Symbol:</span> {formData.symbol}</div>
                    <div className="mb-1"><span className="font-medium">Description:</span> {formData.description}</div>
                    {formData.image && <Image src={formData.image} alt="Coin" width={96} height={96} className="rounded mb-2" />}
                    <div className="mb-1">
                      <span className="font-medium">Properties:</span>
                      <ul className="ml-4 list-disc">
                        {formData.properties.filter(p => p.key).map((p, i) => (
                          <li key={i}><span className="font-semibold">{p.key}:</span> {p.value}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mb-1">
                      <span className="font-medium">Metadata:</span>
                      <ul className="ml-4 list-disc">
                        {formData.metadata.filter(m => m.key).map((m, i) => (
                          <li key={i}><span className="font-semibold">{m.key}:</span> {m.value}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <Button type="submit" variant="primary" size="lg" className="w-full mt-4 py-4 text-lg">Upload to IPFS & Create Coin</Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
