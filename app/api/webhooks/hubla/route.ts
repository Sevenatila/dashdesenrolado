import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Hubla Webhook Received:", body);

        const { data } = body;

        if (!data || !data.id) {
            return NextResponse.json({ status: "ignored", message: "No data id" });
        }

        const externalId = data.id.toString();

        const statusMap: Record<string, string> = {
            'confirmed': 'PAID',
            'pending': 'PENDING',
            'canceled': 'REFUSED',
            'refunded': 'REFUNDED'
        };

        const status = statusMap[data.status] || 'PENDING';

        await prisma.sale.upsert({
            where: { externalId },
            update: {
                status: status,
                amount: data.amount ? data.amount / 100 : undefined,
            },
            create: {
                platform: "HUBLA",
                externalId: externalId,
                amount: (data.amount || 0) / 100,
                status: status,
                customerEmail: data.buyer?.email || 'unknown@email.com',
                utmSource: data.utm_source,
                utmMedium: data.utm_medium,
                utmCampaign: data.utm_campaign,
            }
        });

        return NextResponse.json({ status: "success" });
    } catch (error) {
        console.error("Hubla Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
