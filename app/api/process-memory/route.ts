import { NextRequest, NextResponse } from "next/server";
import got from "got";

export async function POST(req: NextRequest) {
  try {
    const { memoryInput } = await req.json();

    if (!memoryInput) {
      return NextResponse.json({ error: "No input provided." }, { status: 400 });
    }
    
    let url;
    try {
      url = new URL(memoryInput);
    } catch (error) {
      return NextResponse.json({ error: "The provided input is not a valid URL." }, { status: 400 });
    }

    if (url.hostname !== 'x.com' && url.hostname !== 'twitter.com') {
      return NextResponse.json({ error: "Currently, only Twitter/X.com links are supported." }, { status: 400 });
    }

    // Construct the fxtwitter API URL
    const pathParts = url.pathname.split('/');
    const statusId = pathParts.find(part => /^\d+$/.test(part)); // Find the numeric status ID
    
    if (!statusId) {
      throw new Error("Could not find a valid Tweet ID in the URL.");
    }

    const apiUrl = `https://api.fxtwitter.com/status/${statusId}`;
    console.log("DEBUG: Calling fxtwitter API at", apiUrl);
    const fxResponse: any = await got(apiUrl, { timeout: { request: 10000 } }).json();

    const tweet = fxResponse.tweet;
    if (!tweet) {
      throw new Error("Tweet data not found in fxtwitter response.");
    }

    const image = tweet.media?.photos?.[0]?.url;
    if (!image) {
      throw new Error("This tweet does not contain a photo to use as a memory.");
    }
    
    const title = `${tweet.author.name} (@${tweet.author.screen_name})`;
    const description = tweet.text;
    
    return NextResponse.json({ title, description, imageUrl: image });

  } catch (error) {
    console.error("Error processing memory:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: `Failed to process memory: ${message}` }, { status: 500 });
  }
} 