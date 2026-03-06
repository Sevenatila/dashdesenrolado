'use client';

import { useState, useEffect } from 'react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import {
  DollarSign,
  Users,
  TrendingUp,
  ShoppingCart,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { HublaDashboardMetrics } from '@/types/hubla';

interface HublaDashboardProps {
  className?: string;
}

export const HublaDashboard = ({ className }: HublaDashboardProps) => {
  const [metrics, setMetrics] = useState<HublaDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hubla/metrics');
      const data = await response.json();

      if (data.success) {
        setMetrics(data.data);
      } else {
        setError(data.error || 'Erro ao carregar métricas');
      }
    } catch (err) {
      setError('Erro de conexão com a API');
      console.error('Error fetching Hubla metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Atualizar métricas a cada 5 minutos
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Métricas Hubla</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 p-6 rounded-xl animate-pulse">
              <div className="h-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Métricas Hubla</h2>
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Métricas Hubla</h2>
        <div className="text-sm text-gray-500">
          {new Date(metrics.period.start_date).toLocaleDateString('pt-BR')} -{' '}
          {new Date(metrics.period.end_date).toLocaleDateString('pt-BR')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Vendas Totais"
          value={metrics.total_sales.toLocaleString('pt-BR')}
          icon={ShoppingCart}
          description="Total de vendas no período"
        />

        <MetricCard
          title="Receita Total"
          value={formatCurrency(metrics.total_revenue)}
          icon={DollarSign}
          description="Faturamento bruto"
        />

        <MetricCard
          title="Taxa de Conversão"
          value={formatPercentage(metrics.conversion_rate)}
          icon={TrendingUp}
          description="Leads convertidos em vendas"
        />

        <MetricCard
          title="Total de Leads"
          value={metrics.total_leads.toLocaleString('pt-BR')}
          icon={Users}
          description="Leads capturados"
        />

        <MetricCard
          title="Pagamentos Pendentes"
          value={metrics.pending_payments.toLocaleString('pt-BR')}
          icon={Clock}
          description="Aguardando confirmação"
        />

        <MetricCard
          title="Valor Reembolsado"
          value={formatCurrency(metrics.refunded_amount)}
          icon={AlertTriangle}
          description="Total de reembolsos"
        />
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Atualizar dados
        </button>
      </div>
    </div>
  );
};