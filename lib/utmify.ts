export class UTMifyClient {
    private apiToken: string;
    private baseUrl = "https://api.utmify.com.br/api-credentials";

    constructor(apiToken: string) {
        this.apiToken = apiToken;
    }

    async getOrders(dateStart: string, dateEnd: string) {
        try {
            console.log(`[UTMify] Buscando ordens de ${dateStart} até ${dateEnd}...`);
            const url = `${this.baseUrl}/orders?date_start=${dateStart}&date_end=${dateEnd}`;
            const response = await fetch(url, {
                headers: { 'x-api-key': this.apiToken }
            });

            if (!response.ok) {
                console.error(`[UTMify] Falha na API: ${response.status} ${response.statusText}`);
                const errorBody = await response.text();
                console.error(`[UTMify] Detalhes do erro: ${errorBody}`);
                return null;
            }

            const data = await response.json();
            console.log(`[UTMify] Recebidas ${data?.length || 0} ordens.`);
            return data;
        } catch (error) {
            console.error("[UTMify] Erro na requisição:", error);
            return null;
        }
    }
}
