import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.tikTokAccount.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Account disconnected successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to disconnect account";
    console.error("Failed to disconnect account:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
