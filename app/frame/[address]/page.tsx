import { type Metadata } from "next";
import { createPublicClient, http, getContract } from 'viem';
import { baseSepolia } from 'viem/chains';

type Props = {
  params: { address: string };
};

// Helper to convert IPFS URLs to gateway URLs
function ipfsToGateway(ipfsUrl: string) {
  if (!ipfsUrl || !ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl; // Return original if not a valid IPFS URL
  }
  const cid = ipfsUrl.substring(7);
  return `https://ipfs.io/ipfs/${cid}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = params;

  try {
    // 1. Setup a client to talk to the Base Sepolia blockchain
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(), // Uses public RPC
    });

    // 2. Read the coin's metadata URI from the contract
    const contractUri = await publicClient.readContract({
      address: `0x${address.startsWith('0x') ? address.substring(2) : address}`,
      abi: [{
        inputs: [],
        name: 'contractURI',
        outputs: [{ type: 'string', name: '' }],
        stateMutability: 'view',
        type: 'function',
      }],
      functionName: 'contractURI',
    });

    // 3. Fetch and parse the metadata JSON from the URI
    const metadataUrl = ipfsToGateway(contractUri);
    const metadataResponse = await fetch(metadataUrl);
    const coinMetadata = await metadataResponse.json();
    
    const coinName = coinMetadata.name || 'Untitled Memory';
    const imageUrl = ipfsToGateway(coinMetadata.image) || 'https://i.imgur.com/gimI4aP.png';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-url.vercel.app'; // Fallback
    const zoraUrl = `https://testnet.zora.co/coin/bsep:${address}`;

    // 4. Construct the frame with real data
    return {
      title: coinName,
      description: coinMetadata.description || "A memory minted on Rewind.",
      openGraph: {
        title: coinName,
        images: [imageUrl],
      },
      other: {
        "fc:frame": "vNext",
        "fc:frame:image": imageUrl,
        "fc:frame:button:1": "View on Zora",
        "fc:frame:button:1:action": "link",
        "fc:frame:button:1:target": zoraUrl,
        "fc:frame:button:2": "Mint your own memory",
        "fc:frame:button:2:action": "link",
        "fc:frame:button:2:target": appUrl,
      },
    };
  } catch (error) {
    console.error("Error generating frame metadata:", error);
    // Return a fallback frame in case of an error
    return {
      title: "Rewind Memory",
      other: {
        "fc:frame": "vNext",
        "fc:frame:image": "https://i.imgur.com/gimI4aP.png", // Generic fallback image
        "fc:frame:button:1": "Create your own",
        "fc:frame:button:1:action": "link",
        "fc:frame:button:1:target": process.env.NEXT_PUBLIC_APP_URL || "https://your-app-url.vercel.app",
      }
    }
  }
}

export default function FramePage({ params }: Props) {
  return (
    <div>
      <h1>A Farcaster frame for coin at address: {params.address}</h1>
      <p>
        This page is designed to be shared on Farcaster. It contains special meta
        tags that Farcaster clients use to render a Frame.
      </p>
    </div>
  );
} 