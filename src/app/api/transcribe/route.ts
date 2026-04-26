import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transcript } from "@/lib/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Verify auth session
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    if (!audioFile.name) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    // Determine MIME type — fall back to a safe default if browser sends empty/wrong type
    let mimeType = audioFile.type;
    if (!mimeType || mimeType === "application/octet-stream") {
      const ext = audioFile.name.split(".").pop()?.toLowerCase() ?? "";
      const extMap: Record<string, string> = {
        mp3: "audio/mpeg",
        wav: "audio/wav",
        ogg: "audio/ogg",
        webm: "audio/webm",
        mp4: "audio/mp4",
        m4a: "audio/mp4",
        flac: "audio/flac",
        aac: "audio/aac",
      };
      mimeType = extMap[ext] ?? "audio/mpeg";
    }

    console.log(`[transcribe] file="${audioFile.name}" type="${mimeType}" size=${audioFile.size}`);

    // Convert file to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    // Call Gemini 2.5 Flash (confirmed working with this API key)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Audio,
        },
      },
      "Please transcribe the audio content accurately. Return only the transcribed text, nothing else.",
    ]);

    // response.text() is a METHOD, not a property
    const transcriptText = result.response.text() ?? "Unable to transcribe audio";
    console.log(`[transcribe] result length=${transcriptText.length}`);

    // Store in database
    const [newTranscript] = await db
      .insert(transcript)
      .values({
        userId: session.user.id,
        fileName: audioFile.name,
        content: transcriptText,
      })
      .returning();

    return NextResponse.json({
      success: true,
      transcript: newTranscript,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[transcribe] Error:", msg);

    // Surface quota/API errors clearly
    if (msg.includes("429") || msg.includes("quota")) {
      return NextResponse.json(
        { error: "Gemini API quota exceeded. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Transcription failed: " + msg },
      { status: 500 }
    );
  }
}
