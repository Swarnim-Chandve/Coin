import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url!);
  const owner = searchParams.get("owner");
  let memories = await prisma.memory.findMany({
    orderBy: { timestamp: "desc" },
  });
  if (owner) {
    memories = memories.filter((m) => m.owner?.toLowerCase() === owner.toLowerCase());
  }
  // Convert BigInt to string for JSON serialization
  memories = memories.map(m => ({
    ...m,
    timestamp: m.timestamp.toString(),
  }));
  return NextResponse.json({ memories });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, title, description, owner, coinAddress, zoraUrl } = body;
    if (!image || !title || !owner || !coinAddress || !zoraUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const memory = await prisma.memory.create({
      data: {
        image,
        title,
        description,
        owner,
        coinAddress,
        zoraUrl,
        timestamp: BigInt(Date.now()),
      },
    });
    // Convert BigInt to string for JSON serialization
    const safeMemory = { ...memory, timestamp: memory.timestamp.toString() };
    return NextResponse.json({ success: true, memory: safeMemory });
  } catch (err: unknown) {
    let message = 'Failed to save memory';
    if (err instanceof Error) message = err.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 