"use client";

import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    pixTax: 0,
    cardTax: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          pixTax: data.pixTax || 0,
          cardTax: data.cardTax || 0
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Erro ao salvar configurações' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro de conexão' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: 'pixTax' | 'cardTax', value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue >= 0 && numValue <= 100) {
      setSettings(prev => ({
        ...prev,
        [field]: numValue
      }));
      setMessage(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Configurações</h1>
        <p className="text-gray-600">Configure as taxas dos métodos de pagamento</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Taxas de Pagamento</h2>

        <div className="space-y-6">
          {/* Taxa PIX */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taxa PIX (%)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.pixTax}
                onChange={(e) => handleInputChange('pixTax', e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              <span className="text-gray-500">%</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Taxa aplicada em pagamentos via PIX
            </p>
          </div>

          {/* Taxa Cartão */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taxa Cartão (%)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.cardTax}
                onChange={(e) => handleInputChange('cardTax', e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              <span className="text-gray-500">%</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Taxa aplicada em pagamentos via cartão de crédito/débito
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Preview do Cálculo</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Venda PIX de R$ 100,00:</span>
              <span className="font-medium">
                Líquido: R$ {(100 - (100 * settings.pixTax / 100)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Venda Cartão de R$ 100,00:</span>
              <span className="font-medium">
                Líquido: R$ {(100 - (100 * settings.cardTax / 100)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}