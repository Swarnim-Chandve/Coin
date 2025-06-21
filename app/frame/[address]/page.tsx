import { type Metadata } from "next";

type Props = {
  params: { address: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = params;

  // TODO: In a future step, we will fetch the coin's real metadata
  // using its contract address from the Zora protocol.
  const imageUrl = "https://i.imgur.com/gimI4aP.png"; // Placeholder
  const coinName = "My Awesome Memory"; // Placeholder
  const zoraUrl = `https://testnet.zora.co/coin/bsep:${address}`;

  return {
    title: coinName,
    description: "A memory minted on Rewind.",
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
      // Optional: Add a second button to mint their own
      "fc:frame:button:2": "Mint your own memory",
      "fc:frame:button:2:action": "link",
      "fc:frame:button:2:target": `https://[YOUR_APP_URL]`, // TODO: Replace with your app's URL
    },
  };
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