export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createCoin, DeployCurrency } from "@zoralabs/coins-sdk";
import { createWalletClient, createPublicClient, http, Hex, Address } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, symbol, cid } = body;
    if (!name || !symbol || !cid) {
      return NextResponse.json({ error: "Missing required fields (name, symbol, cid)" }, { status: 400 });
    }

    // Setup viem clients
    const rpcUrl = process.env.ZORA_RPC_URL!;
    const privateKey = process.env.ZORA_SERVER_PRIVATE_KEY! as Hex;

    // Create public and wallet clients
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    const account = privateKeyToAccount(privateKey);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    // Prepare coin params
    const payoutRecipient = walletClient.account.address as Address;
    const coinParams = {
      name,
      symbol,
      uri: cid.startsWith('ipfs://') ? cid : `ipfs://${cid}`,
      payoutRecipient,
      chainId: baseSepolia.id,
      currency: DeployCurrency.ETH,
    };

    // Log coin creation params
    console.log('Creating coin with params:', coinParams);

    // Create the coin
    const result = await createCoin(coinParams, walletClient, publicClient);

    // Log success
    console.log('Coin created successfully:', result);

    // Build Zora coin URL
    const zoraUrl = `https://testnet.zora.co/coin/bsep:${result.address}`;

    return NextResponse.json({
      success: true,
      txn: result.hash,
      address: result.address,
      zoraUrl,
    });
  } catch (err: any) {
    console.error('Create Coin error:', err);
    return NextResponse.json({ error: err.message || "Failed to create coin" }, { status: 500 });
  }
} 