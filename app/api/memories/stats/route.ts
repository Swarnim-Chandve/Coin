import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: NextRequest) {
  const memories = await prisma.memory.findMany();
  const total = memories.length;
  const uniqueMinters = Array.from(new Set(memories.map(m => m.owner?.toLowerCase()))).filter(Boolean);
  const recent = memories.slice(-5).reverse().map(m => ({
    ...m,
    timestamp: m.timestamp.toString(),
  }));
  return NextResponse.json({
    total,
    uniqueMinters: uniqueMinters.length,
    recent,
  });
} 