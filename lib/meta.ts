export class MetaAdsClient {
    private accessToken: string;
    private adAccountId: string;
    private baseUrl = "https://graph.facebook.com/v19.0";

    constructor(accessToken: string, adAccountId: string) {
        this.accessToken = accessToken;
        this.adAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
    }

    async getDailyMetrics(date: string) {
        const url = `${this.baseUrl}/${this.adAccountId}/insights?fields=spend,clicks,impressions&time_range={'since':'${date}','until':'${date}'}&access_token=${this.accessToken}`;

        try {
            const response = await fetch(url);
            const result = await response.json();

            if (result.data && result.data.length > 0) {
                const metrics = result.data[0];
                return {
                    spend: parseFloat(metrics.spend || "0"),
                    clicks: parseInt(metrics.clicks || "0"),
                    impressions: parseInt(metrics.impressions || "0")
                };
            }
            return { spend: 0, clicks: 0, impressions: 0 };
        } catch (error) {
            console.error("Meta Ads API Error:", error);
            throw error;
        }
    }
}
