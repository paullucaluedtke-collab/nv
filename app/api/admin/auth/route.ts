import { NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";

export async function POST(request: Request) {
    try {
        const { password } = await request.json();

        if (!ADMIN_PASSWORD) {
            return NextResponse.json(
                { error: "Admin password not configured on server" },
                { status: 500 }
            );
        }

        if (password === ADMIN_PASSWORD) {
            return NextResponse.json({ authenticated: true });
        }

        return NextResponse.json(
            { error: "Falsches Passwort" },
            { status: 401 }
        );
    } catch {
        return NextResponse.json(
            { error: "Invalid request" },
            { status: 400 }
        );
    }
}
