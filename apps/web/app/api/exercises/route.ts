import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const exercises = await prisma.exercise.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(exercises);
  } catch (e) {
    console.error("Exercises list error:", e);
    return NextResponse.json(
      { error: "Failed to load exercises" },
      { status: 500 }
    );
  }
}
