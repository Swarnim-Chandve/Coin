"use client";

import { useMiniKit, useOpenUrl } from "@coinbase/onchainkit/minikit";
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
  const openUrl = useOpenUrl();
  const { isConnected: isWalletConnected, address } = useAccount();

  // Step 1: Memory Capture State
  const [memoryInput, setMemoryInput] = useState(""); // For URL or text
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{imageUrl: string; title: string; description: string;} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Step 2: Minting Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    symbol: "",
    image: "",
    metadata: [{ key: "", value: "" }],
  });
  const [status, setStatus] = useState<
    "idle" | "ipfs" | "minting" | "success" | "error"
  >("idle");
  const [zoraUrl, setZoraUrl] = useState<string | null>(null);
  const [modalMsg, setModalMsg] = useState<string>("");
  const [newCoinAddress, setNewCoinAddress] = useState<string | null>(null);

  // New: AI image generation state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Frame ready for MiniKit
  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [isFrameReady, setFrameReady]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // When a preview is generated, set up the minting form
  useEffect(() => {
    if (preview) {
      setFormData((prev) => ({
        ...prev,
        image: preview.imageUrl,
        name: preview.title,
        description: preview.description,
      }));
      // Wait a moment before showing the form to make the transition feel smoother
      sleep(500).then(() => setShowForm(true));
    } else {
      setShowForm(false);
    }
  }, [preview]);

  // Handle Memory Submission (Step 1)
  async function handleMemorySubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (memoryInput.trim() === "" && !uploadedFile) return;

    setLoading(true);
    setPreview(null);
    setError(null);
    
    try {
      // If a file is uploaded, skip process-memory and go straight to preview
      if (uploadedFile) {
        // Already handled in handleFileChange, so just return
        setLoading(false);
        return;
      }

      const res = await fetch("/api/process-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoryInput }),
      });

      const data = await res.json();

      if (res.ok) {
        setPreview(data);
      } else {
        setError(data.error || "Failed to process memory.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }
  
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setMemoryInput(''); // Clear text input if file is selected
      setLoading(true);
      setError(null);
      // Convert file to base64 and set as preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setPreview({
          imageUrl: base64,
          title: file.name || 'Uploaded Image',
          description: 'A memory minted from your uploaded file.'
        });
        setLoading(false);
      };
      reader.onerror = () => {
        setError('Failed to read file.');
        setLoading(false);
      };
      reader.readAsDataURL(file);
    }
  }

  // Handle form field changes
  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string, idx?: number) {
    if (field === "metadata") {
      const arr = [...formData.metadata];
      if (idx !== undefined) {
        if (e.target.name === "key" || e.target.name === "value") {
          arr[idx][e.target.name as "key" | "value"] = e.target.value;
          setFormData((prev) => ({ ...prev, metadata: arr }));
        }
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    }
  }

  // Add/remove property/metadata fields
  function addKeyValue() {
    setFormData((prev) => ({ ...prev, metadata: [...prev.metadata, { key: "", value: "" }] }));
  }
  function removeKeyValue(idx: number) {
    setFormData((prev) => ({ ...prev, metadata: prev.metadata.filter((_, i) => i !== idx) }));
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
    setModalMsg("Downloading image for upload...");

    try {
      // Step 1: Fetch the image from the external URL and convert to Base64
      const imageResponse = await fetch(formData.image);
      if (!imageResponse.ok) {
        throw new Error("Failed to download the image from the source URL.");
      }
      const imageBlob = await imageResponse.blob();
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });

      setModalMsg("Uploading metadata to IPFS...");

      // Step 2: Prepare data for the API with the Base64 image
      const metadataObj = Object.fromEntries(formData.metadata.filter(m => m.key).map(m => [m.key, m.value]));
      const metadataToSend = {
        name: formData.name,
        description: formData.description,
        symbol: formData.symbol,
        image: base64Image, // Use the converted image data
        metadata: metadataObj,
      };

      // Step 3: Call the IPFS upload API
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
            setNewCoinAddress(coinData.address);
            setStatus("success");
            setModalMsg("Your coin is live! View it on Zora below.");
            // New: Save memory to gallery
            try {
              await fetch("/api/memories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  image: formData.image,
                  title: formData.name,
                  description: formData.description,
                  owner: address,
                  coinAddress: coinData.address,
                  zoraUrl: url,
                }),
              });
            } catch (e) { /* ignore errors for now */ }
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

  // New: Generate image with Gemini API
  async function handleGenerateImage() {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: memoryInput }),
      });
      const data = await res.json();
      if (res.ok && data.image) {
        setPreview({
          imageUrl: `data:image/png;base64,${data.image}`,
          title: memoryInput.slice(0, 32) || 'AI Generated Memory',
          description: memoryInput,
        });
      } else {
        setAiError(data.error || 'Failed to generate image.');
      }
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Unknown error.');
    } finally {
      setAiLoading(false);
    }
  }

  const inFrameContext = context !== null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans mini-app-theme">
      {/* Main Header with Gallery Link */}
      <header className="flex flex-col items-center pt-6 pb-2 w-full max-w-2xl mx-auto px-2 sm:px-4">
        <div className="w-full flex justify-between items-center mb-2">
          <span className="font-extrabold text-4xl sm:text-5xl tracking-tight text-black drop-shadow-lg select-none" style={{letterSpacing: '-0.03em'}}>coin it</span>
          <a href="/gallery" className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-xl font-bold shadow hover:bg-blue-700 transition text-base">Gallery</a>
        </div>
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
      {/* Debug info for troubleshooting */}
      <div className="fixed top-2 left-2 z-50 text-xs bg-white/80 px-2 py-1 rounded shadow text-gray-700">
        <span>inFrameContext: {String(inFrameContext)} | isWalletConnected: {String(isWalletConnected)}</span>
      </div>
      {/* Main Card Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-2 sm:px-4 w-full max-w-2xl mx-auto">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl px-4 sm:px-8 py-6 sm:py-8 flex flex-col items-center">
          
          {/* Hide the initial form if a preview is ready */}
          {!preview && !loading && (
            <form
              onSubmit={handleMemorySubmit}
              className="w-full flex flex-col items-center gap-4 sm:gap-6 animate-fade-in"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center">What memory do you want to mint?</h2>
            
              <textarea
                ref={inputRef}
                value={memoryInput}
                onChange={e => {
                  setMemoryInput(e.target.value);
                  if (uploadedFile) setUploadedFile(null); // Clear file if user types
                }}
                placeholder="Paste a URL or type a memory..."
                className="w-full px-4 py-3 sm:px-5 sm:py-4 rounded-xl border border-[var(--app-card-border)] bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] text-lg sm:text-xl shadow-sm min-h-[100px]"
                autoFocus
                disabled={loading}
              />

              {/* New: AI image generation button for text-only input */}
              {memoryInput.trim() && !uploadedFile && (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full text-lg sm:text-xl py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl shadow-lg hover:from-purple-600 hover:to-blue-600 focus:ring-4 focus:ring-[var(--app-accent-light)]"
                  onClick={handleGenerateImage}
                  disabled={aiLoading}
                >
                  {aiLoading ? 'Generating Image...' : 'Generate Image with AI'}
                </Button>
              )}
              {aiError && <div className="text-red-500 text-sm mt-2">{aiError}</div>}

              <div className="w-full flex items-center justify-center">
                <span className="flex-grow border-t border-gray-200"></span>
                <span className="px-4 text-gray-500 font-medium">OR</span>
                <span className="flex-grow border-t border-gray-200"></span>
              </div>

              <label htmlFor="file-upload" className={`w-full cursor-pointer bg-white border-2 border-dashed border-gray-300 rounded-xl text-center py-6 px-4 hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] transition-colors ${loading ? 'opacity-50' : ''}`}>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} disabled={loading} />
                {uploadedFile ? (
                  <span className="font-semibold text-green-600">Selected: {uploadedFile.name}</span>
                ) : (
                  <span className="font-medium text-gray-600">Upload a file (image, screenshot...)</span>
                )}
              </label>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full text-lg sm:text-xl py-3 sm:py-4 bg-[var(--app-accent)] text-white rounded-xl shadow-lg hover:bg-[var(--app-accent-hover)] focus:ring-4 focus:ring-[var(--app-accent-light)]"
                disabled={ (memoryInput.trim() === "" && !uploadedFile) || loading }
              >
                Preview Memory
              </Button>
            </form>
          )}

          {loading && (
            <div className="mt-4 sm:mt-6 text-lg text-[var(--app-accent)] animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              Processing memory...
            </div>
          )}
          {error && (
            <div className="mt-4 sm:mt-6 text-lg text-red-500">{error}</div>
          )}
          {preview && !loading && (
            <div className="mt-6 sm:mt-8 flex flex-col items-center w-full animate-fade-in">
              <span className="text-xl sm:text-3xl font-extrabold text-gray-900 mb-4 sm:mb-6 text-center">Memory Preview</span>
              <div className="w-full flex justify-center mb-4">
                <Image
                  src={preview.imageUrl}
                  alt={preview.title || "Memory preview"}
                  width={384}
                  height={384}
                  className="rounded-xl shadow-lg border border-[var(--app-card-border)] max-w-full h-auto object-contain max-h-[50vh]"
                  style={{ maxWidth: '100%', height: 'auto', maxHeight: '50vh' }}
                  priority
                />
              </div>
              <Button
                onClick={() => setShowForm(true)}
                variant="primary"
                size="lg"
                className="w-full mt-4 py-4 text-lg"
              >
                Looks good, continue →
              </Button>
              <button
                onClick={() => setPreview(null)}
                className="mt-4 text-gray-500 hover:text-gray-700"
              >
                ← Start over
              </button>
            </div>
          )}
          {/* Status Modal: only show if status !== 'idle' */}
          {status !== "idle" && (
            <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40`} onClick={() => {
              if (status === "success") {
                setStatus("idle");
                setShowForm(false);
                setZoraUrl(null);
                setNewCoinAddress(null);
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
                    {newCoinAddress && (
                      <button
                        onClick={() => {
                          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                          const frameUrl = `${appUrl}/frame/${newCoinAddress}`;
                          const text = `I just minted a memory on Rewind: "${formData.name}"`;
                          const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(frameUrl)}`;
                          openUrl(shareUrl);
                        }}
                        className="block mt-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-lg shadow hover:bg-purple-700 transition"
                      >
                        Share on Farcaster
                      </button>
                    )}
                    <button className="mt-6 text-blue-500 underline" onClick={() => { setStatus("idle"); setShowForm(false); setZoraUrl(null); setNewCoinAddress(null); }}>Close</button>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg relative animate-fade-in max-h-[90vh] overflow-y-auto">
                <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowForm(false)}>&times;</button>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 text-center">Create Your Memory Coin</h2>
                <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                  {/* Name and Symbol */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input type="text" className="input flex-1 text-base px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-400" placeholder="Name (e.g. Summer 2009)" value={formData.name} onChange={e => handleFormChange(e, "name")}
                      required />
                    <input type="text" className="input flex-1 text-base px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-400" placeholder="Symbol (e.g. SUM09)" value={formData.symbol} onChange={e => handleFormChange(e, "symbol")}
                      required />
                  </div>
                  {/* Description */}
                  <textarea className="input text-base px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-400 min-h-[80px]" placeholder="Description (What makes this memory special?)" value={formData.description} onChange={e => handleFormChange(e, "description")} required />
                  
                  {/* Image and Metadata Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-medium text-base">Image</label>
                      {formData.image && <Image src={formData.image} alt="Coin" width={96} height={96} className="rounded-lg mb-2" />}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium text-base">Metadata <span className="text-gray-400 text-sm">(optional)</span></label>
                      {formData.metadata.map((m, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                          <input type="text" name="key" placeholder="Key" value={m.key} onChange={e => handleFormChange(e, "metadata", i)} className="input flex-1 px-3 py-2 rounded-md border border-gray-300 focus:border-blue-400 text-sm" />
                          <input type="text" name="value" placeholder="Value" value={m.value} onChange={e => handleFormChange(e, "metadata", i)} className="input flex-1 px-3 py-2 rounded-md border border-gray-300 focus:border-blue-400 text-sm" />
                          <button type="button" onClick={() => removeKeyValue(i)} className="text-red-500 text-lg">&times;</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addKeyValue()}
                        className="text-xs text-blue-500 mt-1">+ Add Metadata</button>
                    </div>
                  </div>

                  {/* Review Section (removed for space, functionality is implicit) */}
                  
                  <Button type="submit" variant="primary" size="lg" className="w-full mt-2 py-3 text-base">Upload to IPFS & Create Coin</Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
