export class UTMifyClient {
    private apiToken: string;
    private baseUrl = "https://api.utmify.com.br/api-credentials";

    constructor(apiToken: string) {
        this.apiToken = apiToken;
    }

    async getOrders(dateStart: string, dateEnd: string) {
        try {
            const response = await fetch(`${this.baseUrl}/orders?date_start=${dateStart}&date_end=${dateEnd}`, {
                headers: { 'x-api-key': this.apiToken }
            });
            return await response.json();
        } catch (error) {
            console.error("UTMify API Error:", error);
            return null;
        }
    }
}
