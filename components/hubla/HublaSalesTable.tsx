'use client';

import { useState, useEffect } from 'react';
import { HublaSale, HublaSaleStatus } from '@/types/hubla';
import { Badge } from 'lucide-react';

interface HublaSalesTableProps {
  className?: string;
  limit?: number;
}

export const HublaSalesTable = ({ className, limit = 10 }: HublaSalesTableProps) => {
  const [sales, setSales] = useState<HublaSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      // Por enquanto, dados de exemplo
      // Em produção, você faria uma requisição para a API
      const mockSales: HublaSale[] = [
        {
          id: '1',
          product_id: 'prod_1',
          product_name: 'Curso de Reconquista',
          customer: {
            id: 'cust_1',
            name: 'João Silva',
            email: 'joao@email.com',
            created_at: new Date().toISOString()
          },
          amount: 97.00,
          currency: 'BRL',
          status: HublaSaleStatus.APPROVED,
          payment_method: 'credit_card',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setSales(mockSales);
    } catch (err) {
      setError('Erro ao carregar vendas');
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: HublaSaleStatus) => {
    const statusConfig = {
      [HublaSaleStatus.APPROVED]: {
        label: 'Aprovada',
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      [HublaSaleStatus.PENDING]: {
        label: 'Pendente',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      [HublaSaleStatus.CANCELLED]: {
        label: 'Cancelada',
        className: 'bg-red-100 text-red-800 border-red-200'
      },
      [HublaSaleStatus.REFUNDED]: {
        label: 'Reembolsada',
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      },
      [HublaSaleStatus.WAITING_PAYMENT]: {
        label: 'Aguardando Pagamento',
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      }
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className || ''}`}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas Recentes</h3>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className || ''}`}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas Recentes</h3>
          <div className="text-center py-8">
            <p className="text-gray-500">{error}</p>
            <button
              onClick={fetchSales}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className || ''}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Vendas Recentes</h3>
          <button
            onClick={fetchSales}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Atualizar
          </button>
        </div>

        {sales.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma venda encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Cliente</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Produto</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Valor</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sales.slice(0, limit).map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{sale.customer.name}</p>
                        <p className="text-xs text-gray-500">{sale.customer.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <p className="text-sm text-gray-900">{sale.product_name}</p>
                    </td>
                    <td className="py-3 px-2">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(sale.amount)}</p>
                    </td>
                    <td className="py-3 px-2">
                      {getStatusBadge(sale.status)}
                    </td>
                    <td className="py-3 px-2">
                      <p className="text-sm text-gray-500">{formatDate(sale.created_at)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};