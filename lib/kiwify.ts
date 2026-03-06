import prisma from '@/lib/prisma';
import { KiwifyWebhookEvent, KiwifySale, KiwifyMetrics } from '@/types/kiwify';

const KIWIFY_TOKEN = process.env.KIWIFY_TOKEN;

export class KiwifyService {
    static async validateWebhook(token: string): Promise<boolean> {
        return token === KIWIFY_TOKEN;
    }

    static async processWebhookEvent(event: KiwifyWebhookEvent): Promise<void> {
        try {
            console.log(`Processing Kiwify event: ${event.event}`);

            switch (event.event) {
                case 'sale.created':
                case 'sale.approved':
                    await this.handleSaleCreated(event);
                    break;

                case 'sale.refunded':
                    await this.handleSaleRefunded(event);
                    break;

                case 'sale.cancelled':
                case 'sale.chargeback':
                    await this.handleSaleCancelled(event);
                    break;

                case 'cart.abandoned':
                    await this.handleCartAbandoned(event);
                    break;

                case 'subscription.created':
                case 'subscription.renewed':
                    await this.handleSubscriptionCreated(event);
                    break;

                case 'subscription.cancelled':
                    await this.handleSubscriptionCancelled(event);
                    break;

                default:
                    console.log(`Unhandled Kiwify event: ${event.event}`);
            }
        } catch (error) {
            console.error('Error processing Kiwify webhook:', error);
            throw error;
        }
    }

    static async handleSaleCreated(event: KiwifyWebhookEvent): Promise<void> {
        const { data } = event;

        await prisma.sale.create({
            data: {
                platform: 'KIWIFY',
                externalId: data.sale_id || event.id,
                productName: data.product_name || 'Produto Kiwify',
                customerEmail: data.customer_email || '',
                customerName: data.customer_name || '',
                amount: data.amount || 0,
                status: data.status || 'approved',
                paymentMethod: data.payment_method || 'unknown',
                affiliateId: data.affiliate_id,
                affiliateName: data.affiliate_name,
                commission: data.commission || 0,
                utmSource: data.utm_source,
                utmMedium: data.utm_medium,
                utmCampaign: data.utm_campaign,
                createdAt: data.created_at ? new Date(data.created_at) : new Date(),
            },
        });

        await this.updateDailyMetrics(new Date(), data.amount || 0, 'sale');
    }

    static async handleSaleRefunded(event: KiwifyWebhookEvent): Promise<void> {
        const { data } = event;

        if (data.sale_id) {
            await prisma.sale.updateMany({
                where: {
                    platform: 'KIWIFY',
                    externalId: data.sale_id,
                },
                data: {
                    status: 'refunded',
                },
            });
        }

        await this.updateDailyMetrics(new Date(), data.amount || 0, 'refund');
    }

    static async handleSaleCancelled(event: KiwifyWebhookEvent): Promise<void> {
        const { data } = event;

        if (data.sale_id) {
            await prisma.sale.updateMany({
                where: {
                    platform: 'KIWIFY',
                    externalId: data.sale_id,
                },
                data: {
                    status: 'cancelled',
                },
            });
        }
    }

    static async handleCartAbandoned(event: KiwifyWebhookEvent): Promise<void> {
        const { data } = event;

        await prisma.metric.create({
            data: {
                platform: 'KIWIFY',
                type: 'cart_abandoned',
                value: 1,
                metadata: {
                    customerEmail: data.customer_email,
                    productName: data.product_name,
                    amount: data.amount,
                },
                date: new Date(),
            },
        });
    }

    static async handleSubscriptionCreated(event: KiwifyWebhookEvent): Promise<void> {
        const { data } = event;

        await prisma.metric.create({
            data: {
                platform: 'KIWIFY',
                type: 'subscription_created',
                value: data.amount || 0,
                metadata: {
                    customerEmail: data.customer_email,
                    productName: data.product_name,
                },
                date: new Date(),
            },
        });

        await this.updateDailyMetrics(new Date(), data.amount || 0, 'subscription');
    }

    static async handleSubscriptionCancelled(event: KiwifyWebhookEvent): Promise<void> {
        const { data } = event;

        await prisma.metric.create({
            data: {
                platform: 'KIWIFY',
                type: 'subscription_cancelled',
                value: 1,
                metadata: {
                    customerEmail: data.customer_email,
                    productName: data.product_name,
                },
                date: new Date(),
            },
        });
    }

    static async updateDailyMetrics(
        date: Date,
        amount: number,
        type: 'sale' | 'refund' | 'subscription'
    ): Promise<void> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const existingMetric = await prisma.dailyPerformance.findFirst({
            where: {
                date: startOfDay,
                platform: 'KIWIFY',
            },
        });

        if (existingMetric) {
            const updates: any = {};

            if (type === 'sale' || type === 'subscription') {
                updates.sales = (existingMetric.sales || 0) + 1;
                updates.revenue = (existingMetric.revenue || 0) + amount;
            } else if (type === 'refund') {
                updates.refunds = (existingMetric.refunds || 0) + 1;
            }

            await prisma.dailyPerformance.update({
                where: { id: existingMetric.id },
                data: updates,
            });
        } else {
            await prisma.dailyPerformance.create({
                data: {
                    date: startOfDay,
                    platform: 'KIWIFY',
                    sales: type === 'sale' || type === 'subscription' ? 1 : 0,
                    revenue: type === 'sale' || type === 'subscription' ? amount : 0,
                    refunds: type === 'refund' ? 1 : 0,
                    leads: 0,
                    impressions: 0,
                    clicks: 0,
                    spend: 0,
                    cpl: 0,
                    cpa: 0,
                    roi: 0,
                },
            });
        }
    }

    static async getMetrics(startDate?: Date, endDate?: Date): Promise<KiwifyMetrics> {
        const dateFilter = startDate && endDate ? {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        } : {};

        const sales = await prisma.sale.findMany({
            where: {
                platform: 'KIWIFY',
                ...dateFilter,
            },
        });

        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
        const refundedSales = sales.filter(sale => sale.status === 'refunded');
        const totalRefunds = refundedSales.length;
        const refundedAmount = refundedSales.reduce((sum, sale) => sum + (sale.amount || 0), 0);

        const abandonedCartsCount = await prisma.metric.count({
            where: {
                platform: 'KIWIFY',
                type: 'cart_abandoned',
                date: dateFilter.createdAt,
            },
        });

        const activeSubscriptionsCount = await prisma.metric.count({
            where: {
                platform: 'KIWIFY',
                type: 'subscription_created',
                date: dateFilter.createdAt,
            },
        });

        const cancelledSubscriptionsCount = await prisma.metric.count({
            where: {
                platform: 'KIWIFY',
                type: 'subscription_cancelled',
                date: dateFilter.createdAt,
            },
        });

        return {
            totalSales,
            totalRevenue,
            totalRefunds,
            refundedAmount,
            conversionRate: abandonedCartsCount > 0 ? (totalSales / (totalSales + abandonedCartsCount)) * 100 : 0,
            averageTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
            abandonedCarts: abandonedCartsCount,
            activeSubscriptions: activeSubscriptionsCount - cancelledSubscriptionsCount,
        };
    }

    static async getRecentSales(limit = 10): Promise<KiwifySale[]> {
        const sales = await prisma.sale.findMany({
            where: {
                platform: 'KIWIFY',
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });

        return sales.map(sale => ({
            id: sale.id,
            productId: sale.externalId,
            productName: sale.productName || '',
            customerEmail: sale.customerEmail || '',
            customerName: sale.customerName || '',
            amount: sale.amount || 0,
            status: sale.status || '',
            paymentMethod: sale.paymentMethod || '',
            createdAt: sale.createdAt,
            affiliate: sale.affiliateId ? {
                id: sale.affiliateId,
                name: sale.affiliateName || '',
                commission: sale.commission || 0,
            } : undefined,
            utmParams: {
                source: sale.utmSource || undefined,
                medium: sale.utmMedium || undefined,
                campaign: sale.utmCampaign || undefined,
            },
        }));
    }
}