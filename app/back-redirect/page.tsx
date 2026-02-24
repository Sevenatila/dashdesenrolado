'use client';

import { useEffect, useState } from 'react';

export default function BackRedirect() {
  const [showOffer, setShowOffer] = useState(false);

  useEffect(() => {
    // Detectar tentativa de saída da página
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      setShowOffer(true);
      return (e.returnValue = '');
    };

    // Detectar movimento do mouse para fora da janela (intent de fechar)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setShowOffer(true);
      }
    };

    // Detectar tecla ESC ou Alt+F4
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.altKey && e.key === 'F4')) {
        setShowOffer(true);
      }
    };

    // Detectar botão voltar do navegador
    const handlePopState = () => {
      setShowOffer(true);
      // Adicionar uma entrada no histórico para "travar" o usuário
      window.history.pushState(null, '', window.location.href);
    };

    // Adicionar eventos apenas após o pitch (simulado com delay)
    const timer = setTimeout(() => {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('mouseleave', handleMouseLeave);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('popstate', handlePopState);

      // Adicionar entrada inicial no histórico
      window.history.pushState(null, '', window.location.href);
    }, 5000); // Ativar após 5 segundos (ajuste conforme necessário)

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleCTAClick = () => {
    // Redirecionar para página de checkout
    window.location.href = 'https://pay.hub.la/DMBiMIrnZs2LLauExd9A';
  };

  if (!showOffer) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl mb-4">Assistindo VSL...</h1>
          <p>Aguarde o final do vídeo para ver uma oferta especial</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black flex items-center justify-center p-4">
      {/* Overlay para prevenir fechamento */}
      <div className="fixed inset-0 z-[9999] bg-black bg-opacity-95 flex items-center justify-center overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto my-8 overflow-hidden animate-fadeInUp">
          {/* Header */}
          <div className="bg-red-600 text-white text-center py-6 px-4">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              NÃO FECHE ESSA PÁGINA AINDA!
            </h1>
            <p className="text-xl opacity-90">
              Essa condição não estará disponível novamente.
            </p>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 text-center">
            <div className="mb-6">
              <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-4 leading-tight">
                Você acaba de desbloquear o <span className="text-red-600">Código da Reconquista</span> com <span className="text-green-600 text-2xl md:text-3xl font-bold">50% de desconto</span>
              </h2>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-6">
                <span className="text-lg md:text-2xl text-gray-500 line-through">DE R$97</span>
                <span className="text-2xl md:text-4xl font-bold text-red-600">Por apenas R$47</span>
              </div>

              <button
                onClick={handleCTAClick}
                className="bg-green-500 hover:bg-green-600 text-white text-lg md:text-xl font-bold py-3 md:py-4 px-6 md:px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 mb-4 w-full sm:w-auto"
              >
                🎯 QUERO RECONQUISTAR MINHA EX
              </button>

              <p className="text-xs md:text-sm text-gray-600 mb-6">
                Pagamento único • Acesso imediato • Oferta exclusiva desta página
              </p>
            </div>

            {/* Benefits */}
            <div className="bg-green-50 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Essa é sua oportunidade de…
              </h3>

              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-green-500 font-bold text-xl">✔</span>
                  <p className="text-gray-700">
                    Parar de se humilhar e voltar a ser o homem que ela admira, respeita e teme perder.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-500 font-bold text-xl">✔</span>
                  <p className="text-gray-700">
                    Evitar o erro invisível que impede 93% dos homens de reconquistarem a ex.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-500 font-bold text-xl">✔</span>
                  <p className="text-gray-700">
                    Acessar o SMS que faz ela te desbloquear mesmo após dias ou semanas em silêncio.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-500 font-bold text-xl">✔</span>
                  <p className="text-gray-700">
                    Ter em mãos o passo a passo para fazer ela repensar o término e colocar a aliança de volta em até 72 horas.
                  </p>
                </div>
              </div>
            </div>

            {/* Urgency */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-semibold">
                ⚠️ Assim que você sair desta página, essa condição especial será removida automaticamente.
              </p>
            </div>

            {/* Final CTA */}
            <button
              onClick={handleCTAClick}
              className="bg-red-600 hover:bg-red-700 text-white text-xl font-bold py-4 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 w-full md:w-auto animate-bounce"
            >
              💝 QUERO RECONQUISTAR MINHA EX
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}