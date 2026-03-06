'use client';

import { useState, useEffect } from 'react';
import { HublaDashboard } from '@/components/hubla/HublaDashboard';
import { HublaSalesTable } from '@/components/hubla/HublaSalesTable';

// Componente para input da URL do webhook (apenas client-side)
const WebhookUrlInput = () => {
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/hubla/webhook`);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="text"
        value={webhookUrl}
        readOnly
        className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
      />
      <button
        onClick={copyToClipboard}
        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
      >
        Copiar
      </button>
    </div>
  );
};

export default function HublaPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Hubla</h1>
              <p className="text-gray-600 mt-1">Acompanhe suas vendas e métricas em tempo real</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas principais */}
        <HublaDashboard />

        {/* Tabela de vendas */}
        <HublaSalesTable />

        {/* Configuração de webhook */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuração da Integração</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL do Webhook
              </label>
              <WebhookUrlInput />
              <p className="text-xs text-gray-500 mt-1">
                Configure esta URL na sua conta Hubla para receber webhooks
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Eventos Suportados</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• sale.created - Nova venda criada</li>
                  <li>• sale.updated - Venda atualizada</li>
                  <li>• payment.approved - Pagamento aprovado</li>
                  <li>• lead.created - Novo lead capturado</li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Configuração na Hubla</h4>
                <ol className="text-sm text-gray-600 space-y-1">
                  <li>1. Acesse Integrações → Webhooks</li>
                  <li>2. Clique em "Ativar Integração"</li>
                  <li>3. Cole a URL do webhook</li>
                  <li>4. Selecione os eventos desejados</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Status da última atualização */}
        <div className="text-center text-sm text-gray-500">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
}