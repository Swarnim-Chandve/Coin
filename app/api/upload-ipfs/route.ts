import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, description, symbol, image, properties, metadata } = await req.json();
    if (!name || !description || !symbol || !image) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (typeof image !== "string" || !image.startsWith("data:image")) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }
    // Convert base64 image to Buffer
    const arr = image.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) {
      return NextResponse.json({ error: "Could not determine image MIME type." }, { status: 400 });
    }
    const mime = mimeMatch[1];
    const imageBuffer = Buffer.from(arr[1], "base64");
    // Upload image to Pinata
    const formData = new FormData();
    formData.append("file", new Blob([imageBuffer], { type: mime }), "coin-image.png");
    const imageRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: formData as any,
    });
    const imageData = await imageRes.json();
    if (!imageData.IpfsHash) {
      return NextResponse.json({ error: "Failed to upload image to Pinata" }, { status: 500 });
    }
    const imageCid = imageData.IpfsHash;
    // Build metadata JSON
    const metadataObj = {
      name,
      description,
      symbol,
      image: `ipfs://${imageCid}`,
      properties: properties || {},
      metadata: metadata || {},
    };
    // Upload metadata to Pinata
    const metaRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify(metadataObj),
    });
    const metaData = await metaRes.json();
    if (!metaData.IpfsHash) {
      return NextResponse.json({ error: "Failed to upload metadata to Pinata" }, { status: 500 });
    }
    return NextResponse.json({ cid: `ipfs://${metaData.IpfsHash}` });
  } catch (err: unknown) {
    let message = 'Failed to upload to IPFS';
    if (err instanceof Error) message = err.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 