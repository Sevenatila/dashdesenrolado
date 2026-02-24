import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const text = await req.text();
        const signature = req.headers.get("x-kiwify-signature");
        const secret = process.env.KIWIFY_SECRET;

        // Validar assinatura se o segredo estiver configurado
        if (secret && signature) {
            const expectedSignature = crypto
                .createHmac("sha1", secret)
                .update(text)
                .digest("hex");

            if (signature !== expectedSignature) {
                console.error("Kiwify Webhook: Invalid Signature");
                return NextResponse.json({ error: "Invalid Signature" }, { status: 401 });
            }
        }

        const body = JSON.parse(text);
        console.log("Kiwify Webhook Received:", body);

        const {
            order_id,
            order_status,
            amount,
            customer,
            tracking_parameters
        } = body;

        const statusMap: Record<string, string> = {
            'paid': 'PAID',
            'pending': 'PENDING',
            'refunded': 'REFUNDED',
            'refused': 'REFUSED',
            'chargedback': 'REFUNDED'
        };

        const status = statusMap[order_status] || 'PENDING';

        await prisma.sale.upsert({
            where: { externalId: order_id },
            update: {
                status: status,
                amount: amount / 100,
            },
            create: {
                platform: "KIWIFY",
                externalId: order_id,
                amount: amount / 100,
                status: status,
                customerEmail: customer?.email || 'unknown@email.com',
                utmSource: tracking_parameters?.utm_source,
                utmMedium: tracking_parameters?.utm_medium,
                utmCampaign: tracking_parameters?.utm_campaign,
                utmContent: tracking_parameters?.utm_content,
                utmTerm: tracking_parameters?.utm_term,
            }
        });

        return NextResponse.json({ status: "success" });
    } catch (error) {
        console.error("Kiwify Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
