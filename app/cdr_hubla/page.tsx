'use client';

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";

// VTurb Player Component
function VTurbPlayer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Avoid double init
    if (container.querySelector("vturb-smartplayer")) return;

    // Create the custom element in real DOM
    const player = document.createElement("vturb-smartplayer");
    player.id = "vid-68fda7c738d7cd51cf68c89a";
    player.style.display = "block";
    player.style.margin = "0 auto";
    player.style.width = "100%";
    player.style.maxWidth = "400px";
    container.appendChild(player);

    // Load the player script (only once)
    if (!document.getElementById("vturb-player-script")) {
      const s = document.createElement("script");
      s.id = "vturb-player-script";
      s.src =
        "https://scripts.converteai.net/8bd1f3e2-3951-434d-9919-f64436108dcd/players/68fda7c738d7cd51cf68c89a/v4/player.js";
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  return <div ref={containerRef} />;
}

// Protocol Loader Component
const protocolSteps = [
  "Gerando a mensagem exata que fura qualquer bloqueio e desperta saudade mesmo no silêncio",
  "Criando o gatilho oculto que faz ela duvidar da decisão de te deixar",
  "Gerando o texto perfeito pra reverter o desprezo e fazê-la procurar sua resposta",
  "Criando o efeito dominó que destrói o novo relacionamento e traz o foco de volta pra você",
  "Gerando a sequência proibida de mensagens que reabre a conversa sem parecer carência",
  "Criando a virada psicológica que muda completamente a forma como ela te enxerga",
  "Gerando Protocolo Personalizado!",
];

function ProtocolLoader({
  active,
  startDelay = 0,
  onComplete,
}: {
  active: boolean;
  startDelay?: number;
  onComplete: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [stepProgress, setStepProgress] = useState<number[]>(
    new Array(protocolSteps.length).fill(0)
  );
  const [done, setDone] = useState(false);
  const [delayComplete, setDelayComplete] = useState(false);

  useEffect(() => {
    if (!active) return;

    if (startDelay > 0) {
      // Iniciar carregamento imediatamente mas distribuir ao longo do delay
      setCurrentStep(0);

      // Completar após o delay total
      const delayTimer = setTimeout(() => {
        setDelayComplete(true);
      }, startDelay);

      return () => clearTimeout(delayTimer);
    } else {
      // Sem delay, iniciar imediatamente
      setDelayComplete(true);
      setCurrentStep(0);
    }
  }, [active, startDelay]);

  useEffect(() => {
    if (currentStep < 0 || currentStep >= protocolSteps.length) return;

    // Calcular duração baseada no delay total
    const totalDuration = startDelay > 0 ? startDelay : 15000; // 7min 12seg ou 15seg default
    const stepDuration = totalDuration / protocolSteps.length;
    const duration = stepDuration;
    const interval = 30;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setStepProgress((prev) => {
        const next = [...prev];
        next[currentStep] = progress;
        return next;
      });

      if (progress >= 100) {
        clearInterval(timer);
        if (currentStep < protocolSteps.length - 1) {
          setTimeout(() => setCurrentStep(currentStep + 1), 200);
        } else {
          setTimeout(() => {
            setDone(true);
            onComplete();
          }, 500);
        }
      }
    }, interval);

    return () => clearInterval(timer);
  }, [currentStep, onComplete]);

  return (
    <div className="animate-fadeInUp">
      <div className="text-center mb-8">
        <p className="text-red-400 font-semibold text-sm mb-1">
          Aguarde, estamos criando o seu
        </p>
        <h3 className="text-lg font-bold text-white">
          Protocolo Personalizado de Reconquista...
        </h3>
      </div>

      <div className="space-y-4">
        {protocolSteps.map((step, i) => (
          <div
            key={i}
            className={`transition-opacity duration-300 ${
              i <= currentStep ? "opacity-100" : "opacity-30"
            }`}
          >
            <div className="flex items-start gap-3 mb-2">
              <span
                className={`text-lg transition-all duration-300 ${
                  stepProgress[i] >= 100
                    ? "text-green-400 scale-110"
                    : "text-gray-500"
                }`}
              >
                {stepProgress[i] >= 100 ? "✅" : "⬜"}
              </span>
              <span className="text-sm text-gray-300 leading-snug flex-1">
                {step}
              </span>
              <span className="text-xs font-bold text-red-400 min-w-[36px] text-right tabular-nums">
                {Math.round(stepProgress[i])}%
              </span>
            </div>
            <div className="ml-9 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-100 ease-linear"
                style={{
                  width: `${stepProgress[i]}%`,
                  background:
                    stepProgress[i] >= 100
                      ? "#22c55e"
                      : "linear-gradient(90deg, #f59e0b, #ef4444)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {done && delayComplete && (
        <div className="mt-8 text-center animate-bounceIn">
          <div className="inline-flex items-center gap-2 bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-2xl px-6 py-4">
            <span className="text-3xl">✅</span>
            <div>
              <p className="text-red-400 font-extrabold text-lg">
                Protocolo Gerado!
              </p>
              <p className="text-red-300 text-sm">Resgate agora...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Countdown Component
function Countdown({ active }: { active: boolean }) {
  const [seconds, setSeconds] = useState(15 * 60 - 1);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setSeconds((s) => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [active]);

  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  const display = `${min.toString().padStart(2, "0")}:${sec
    .toString()
    .padStart(2, "0")}`;

  return (
    <div className="text-center py-6 my-6 bg-red-500/20 backdrop-blur-md rounded-2xl border border-red-400/20">
      <p className="text-sm font-medium text-gray-300 mb-1">Faltam</p>
      <div className="text-4xl font-black text-red-400 tracking-tight tabular-nums">
        {display}
      </div>
      <p className="text-sm font-medium text-gray-300 mt-1">
        para o acesso expirar!
      </p>
    </div>
  );
}

// Logo Component
function Logo({ className }: { className?: string }) {
  return (
    <div className={`text-center ${className || ""}`}>
      <Image
        src="/img/logo.webp"
        alt="Logo"
        width={200}
        height={80}
        className="h-12 w-auto mx-auto"
      />
    </div>
  );
}

// Quiz Option Component
function QuizOption({
  text,
  selected,
  onClick,
  index,
}: {
  text: string;
  selected: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={selected}
      className={`w-full p-4 text-left rounded-xl border transition-all duration-300 ${
        selected
          ? "bg-red-600/20 border-red-500 text-white scale-105"
          : "bg-black/30 backdrop-blur-md border-white/20 text-gray-200 hover:bg-white/20 hover:border-white/40 hover:scale-102"
      } ${selected ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className="text-sm font-medium">{text}</span>
    </button>
  );
}

// Bonus Card Component
function BonusCard({
  icon,
  title,
  oldPrice,
  description,
  index,
}: {
  icon: string;
  title: string;
  oldPrice: string;
  description: string;
  index: number;
}) {
  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
      <div className="flex items-start gap-4">
        <div className="text-3xl flex-shrink-0">{icon}</div>
        <div className="flex-1">
          <h4 className="font-bold text-white text-lg mb-2">{title}</h4>
          <p className="text-gray-300 text-sm mb-3">{description}</p>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 line-through text-sm">
              De R$ {oldPrice}
            </span>
            <span className="text-red-400 font-bold">por GRÁTIS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const questions = [
  {
    question: "Quando foi o término entre vocês?",
    options: [
      "Faz menos de 1 semana.",
      "Entre 1 e 4 semanas.",
      "Entre 1 e 3 meses.",
      "Mais de 3 meses.",
    ],
  },
  {
    question: "Vocês ainda têm algum tipo de contato hoje em dia?",
    options: [
      "Sim, conversamos de vez em quando.",
      "Ela fala comigo, mas é fria e distante.",
      "Só responde por educação.",
      "Não, ela me bloqueou em tudo.",
    ],
  },
  {
    question: "O que mais dói em você desde o término?",
    options: [
      "Solidão forte.",
      "Culpa e remorso.",
      "Ansiedade e medo do futuro.",
      "Imaginar que ela já tá ficando com outro cara.",
    ],
  },
  {
    question:
      "Se ela realmente se apaixonar por outro cara, o que aconteceria com você?",
    options: [
      "Eu perderia completamente o chão.",
      "Ficaria mal, mas tentaria seguir em frente.",
      "Tentaria reconquistar de qualquer jeito.",
      "Fingiria que não ligo, mas morreria por dentro.",
    ],
  },
  {
    question:
      "Quanto tempo você acha que ainda tem antes dela te esquecer de vez?",
    options: [
      "Poucos dias — sinto que já estou sendo substituído.",
      "Algumas semanas — ainda dá pra agir.",
      "Uns meses — acho que ela ainda sente algo.",
      "Não sei, mas tenho medo de descobrir.",
    ],
  },
];

const bonuses = [
  {
    icon: "✅",
    title: "Checklist Anti-Rejeição",
    oldPrice: "147,00",
    description:
      "Evite esses 7 erros da reconquista e aumente suas chances de voltar com ela ainda essa semana em 8x transformando cada um deles numa vantagem.",
  },
  {
    icon: "💬",
    title: "Código do Ciúme Instantâneo",
    oldPrice: "107,00",
    description:
      "Use essa frase na sua primeira conversa com ela e faça ela sentir um ciúme visceral de você — ao ponto dela lutar pela sua atenção e correr atrás de você.",
  },
  {
    icon: "💌",
    title: "A Carta Proibida de Último Recurso",
    oldPrice: "997,00",
    description:
      "Envie essa mensagem para ela HOJE e veja ela desbloquear você nas redes sociais e parar de agir com frieza, implorando pela sua atenção.",
  },
  {
    icon: "🔍",
    title: "O Dossiê do Rival Descartável",
    oldPrice: "297,00",
    description:
      "Se ela estiver ficando com outro cara, use essa técnica e transforme isso numa vantagem desleal para fazê-la esquecê-lo e voltar com você mais rápido.",
  },
  {
    icon: "💜",
    title: "Manual da Reativação das Emoções Ocultas",
    oldPrice: "197,00",
    description:
      "Use esses 5 gatilhos invisíveis para fazer a sua ex sentir todo aquele tesão do começo do relacionamento — mesmo que ela jure que te odeia.",
  },
];

export default function QuizV2() {
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(5).fill(null)
  );
  const [currentStep, setCurrentStep] = useState(0);
  // 0 = hero, 1-5 = questions, 6 = result, 7 = engage1, 8 = engage2, 9 = loading, 10 = sales
  const [protocolDone, setProtocolDone] = useState(false);
  const [salesActive, setSalesActive] = useState(false);
  const [showBackRedirect, setShowBackRedirect] = useState(false);

  function selectAnswer(questionIdx: number, optionIdx: number) {
    const newAnswers = [...answers];
    newAnswers[questionIdx] = optionIdx;
    setAnswers(newAnswers);
    setTimeout(() => setCurrentStep(questionIdx + 2), 800);
  }

  const handleProtocolComplete = useCallback(() => {
    setProtocolDone(true);
  }, []);


  // Back redirect logic (ativa após pergunta 1)
  useEffect(() => {
    if (currentStep < 1) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      setShowBackRedirect(true);
      return (e.returnValue = '');
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setShowBackRedirect(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.altKey && e.key === 'F4')) {
        setShowBackRedirect(true);
      }
    };

    const handlePopState = () => {
      setShowBackRedirect(true);
      // Adicionar uma entrada no histórico para "travar" o usuário
      window.history.pushState(null, '', window.location.href);
    };

    // Ativar eventos após 5 segundos
    const timer = setTimeout(() => {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('mouseleave', handleMouseLeave);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('popstate', handlePopState);

      // Adicionar entrada inicial no histórico
      window.history.pushState(null, '', window.location.href);
    }, 5000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentStep]);

  const nextStep = () => setCurrentStep(prev => prev + 1);

  const handleBackRedirectCTA = () => {
    window.location.href = 'https://pay.hub.la/DMBiMIrnZs2LLauExd9A';
  };

  const progress = currentStep <= 5 ? (currentStep / 5) * 100 : 100;

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: // Hero
        return (
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl animate-fadeInUp">
            <Logo className="pb-4" />

            <div className="text-center mb-8">
              <h1 className="text-[1.6rem] font-extrabold text-white leading-tight mb-3">
                Descubra como fazer sua ex sentir sua falta{" "}
                <span className="text-red-400">em 60 segundos</span>
              </h1>
              <div className="w-12 h-1 bg-red-500 rounded-full mx-auto mt-4 mb-6" />

              <Image
                src="/img/whatsapp-hero.webp"
                alt="Mensagem no WhatsApp"
                width={400}
                height={320}
                priority
                className="rounded-xl shadow-lg mx-auto mb-6"
              />
            </div>

            <div className="bg-gray-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-5 mb-6">
              <p className="text-base text-gray-200 leading-relaxed mb-4">
                <strong className="text-white">
                  Use essa mensagem psicológica e ela vai te procurar.
                </strong>{" "}
                Não importa se você traiu ela, se ela te bloqueou ou se ela está
                com outro cara agora.
              </p>
              <p className="text-base text-gray-300">
                Clique abaixo para fazer o teste e{" "}
                <strong className="text-white">
                  desbloquear essa mensagem.
                </strong>
              </p>
            </div>

            <div className="bg-red-500/10 border border-red-400/20 rounded-2xl p-5 mb-8 space-y-4">
              {[
                "Além dessa mensagem você receberá um protocolo personalizado de reconquista.",
                "Descobrirá qual é o erro que faz 93% dos homens perder a ex pra sempre e como evitá-lo.",
                "E também descobrirá o atalho sujo para trazê-la de volta já nas próximas 48 horas.",
              ].map((text, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-green-400 text-lg flex-shrink-0 mt-0.5">
                    ✅
                  </span>
                  <span className="text-[0.95rem] text-gray-200 leading-relaxed">
                    {text}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setCurrentStep(1)}
              className="w-full py-4 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-base rounded-2xl transition-all duration-150 shadow-lg shadow-red-500/20 cursor-pointer uppercase tracking-wide"
            >
              Quero reconquistar minha ex!
            </button>
          </div>
        );

      case 1: case 2: case 3: case 4: case 5: // Questions
        const qIdx = currentStep - 1;
        const q = questions[qIdx];
        return (
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl animate-fadeInUp">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs font-bold text-red-400 bg-red-400/20 backdrop-blur-md border border-red-400/20 px-3 py-1 rounded-full">
                Pergunta {qIdx + 1} de 5
              </span>
            </div>
            <h2 className="text-[1.35rem] font-bold text-white leading-snug mb-6">
              {q.question}
            </h2>
            <div className="space-y-3">
              {q.options.map((opt, oIdx) => (
                <QuizOption
                  key={oIdx}
                  text={opt}
                  selected={answers[qIdx] === oIdx}
                  onClick={() => selectAnswer(qIdx, oIdx)}
                  index={oIdx}
                />
              ))}
            </div>
            {answers[qIdx] !== null && (
              <div className="flex justify-center mt-6 animate-fadeIn">
                <span className="text-green-400 text-sm font-semibold flex items-center gap-1">
                  ✅ Resposta registrada
                </span>
              </div>
            )}
          </div>
        );

      case 6: // Result
        return (
          <div
            className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl animate-fadeInUp max-h-screen overflow-y-auto hide-scrollbar"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* Alert */}
            <div className="bg-amber-500/20 border-2 border-amber-400/30 backdrop-blur-md rounded-2xl p-4 text-center mb-8">
              <span className="text-2xl">⚠️</span>
              <p className="text-sm font-bold text-amber-300 mt-1">
                ATENÇÃO: Não saia dessa página!
              </p>
            </div>

            {/* Percentage */}
            <div className="text-center mb-10">
              <p className="text-base font-bold text-white mb-2">
                Suas chances de voltar com sua ex
              </p>
              <p className="text-sm font-semibold text-red-400 italic mb-3">
                SÃO DE APENAS
              </p>
              <div className="text-6xl font-black text-red-400 mb-3 animate-bounceIn">
                12%
              </div>
              <p className="text-[0.95rem] text-gray-300">
                — <em className="text-red-400 font-semibold">isso é crítico</em>{" "}
                — mas ao seguir esse protocolo você pode{" "}
                <strong className="text-white">GARANTIR que ela volte</strong>
              </p>
            </div>

            <div className="w-16 h-0.5 bg-gray-600 rounded mx-auto mb-10" />

            {/* Story */}
            <div className="space-y-4 text-[0.95rem] text-gray-300 leading-relaxed">
              <p className="text-lg font-bold text-white">Fala, irmão!</p>
              <p>
                Meu nome é{" "}
                <strong className="text-red-400">Lucas Krausche</strong>.
              </p>
              <p>E, eu sei exatamente o que você está passando.</p>
              <p>Te digo isso porque eu já estive do outro lado.</p>
              <p>
                Eu era apaixonado por uma mulher... mas, com o passar do tempo, o
                relacionamento foi caindo na rotina.
              </p>
              <p>
                Eu trabalhava demais, esquecia dos pequenos detalhes que faziam
                ela sorrir... e, sem perceber, fui magoando aos poucos a mulher
                que eu mais amava.
              </p>
              <p>
                Até que, um dia,{" "}
                <strong className="text-white">ela terminou comigo.</strong>
              </p>
              <p>
                Naquele momento, parecia que o meu mundo tinha desabado.
              </p>
              <p>
                Foi aí que começou o meu verdadeiro inferno emocional:
              </p>
              <p>
                Eu ligava sem parar, mandava mensagem atrás de mensagem, ficava
                online o tempo todo só pra ver se ela tinha visualizado minhas
                mensagens...
              </p>

              <Image
                src="/img/whatsapp-ligacoes.webp"
                alt="Ligações perdidas no WhatsApp"
                width={400}
                height={700}
                className="rounded-xl shadow-lg mx-auto my-4 w-full max-w-[300px]"
              />

              <p>
                O pior que quando ela postava um story,{" "}
                <span className="text-red-400 font-semibold">
                  eu imaginava logo que estava saindo com outro.
                </span>{" "}
                E isso me destruía por dentro e me deixava em crises e ansiedade.
              </p>
              <p>
                <strong className="text-white">E o pior...</strong> Era
                quando eu estava bloqueado.
              </p>
              <p>
                Eu vivia naquela angústia sem fim, me perguntando a cada minuto:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-gray-400 italic">
                <li>&quot;Será que ela ainda sente minha falta?&quot;</li>
                <li>&quot;Será que já me trocou por outro?&quot;</li>
                <li>
                  &quot;Será que eu ligo? Será que eu mando mensagem?&quot;
                </li>
              </ol>
              <p>
                E a verdade é que...{" "}
                <span className="text-red-400 font-semibold">
                  quanto mais eu corria atrás, mais ela se afastava.
                </span>
              </p>
              <p>
                Foi só então que eu percebi:{" "}
                <strong className="text-white">
                  O problema não era ela. O verdadeiro problema era eu não
                  entender a mente feminina.
                </strong>
              </p>
              <p>
                Eu não sabia como funcionava o{" "}
                <span className="text-blue-400 font-semibold">
                  desejo de uma mulher
                </span>
                ... e, por isso, eu fazia exatamente o oposto do que despertaria
                vontade de voltar nela.
              </p>
              <p>
                Mas ao invés de aceitar a derrota, eu decidi transformar essa dor
                em combustível.
              </p>
              <p>
                Eu mergulhei de cabeça nos estudos, fui atrás de respostas,
                conversei com muitos especialistas e descobri algo que mudou não
                só a minha vida, mas a de milhares de outras pessoas com quem eu
                já compartilhei esse segredo oculto...
              </p>
              <p>
                <span className="text-red-400 font-semibold">
                  Quanto mais você é disponível para uma mulher, mais ela se
                  afasta...
                </span>
              </p>
              <p>
                Porém, em apenas{" "}
                <strong className="text-white">3 etapas</strong>, você
                consegue fazer qualquer mulher comer nas suas mãos outra vez e se
                arrepender de ter terminado contigo{" "}
                <strong className="text-white">
                  (Mesmo que você tenha feito uma besteira muito grande).
                </strong>
              </p>
              <p>
                Ao longo dos últimos anos, eu me formei em{" "}
                <strong className="text-white">Psicanálise</strong>, e hoje
                sou{" "}
                <strong className="text-white">
                  Psicanalista Clínico especializado em relacionamentos e
                  comportamento humano.
                </strong>
              </p>

              <Image
                src="/img/lucas-evento.webp"
                alt="Lucas Krausche em evento"
                width={600}
                height={340}
                className="rounded-xl shadow-lg w-full my-4"
              />

              <p>
                Desde que comecei a compartilhar conteúdos sobre relacionamento,{" "}
                <span className="text-blue-400 font-semibold">
                  conquistei quase 2 milhões de seguidores em todas minhas redes
                  sociais.
                </span>
              </p>

              <Image
                src="/img/instagram.webp"
                alt="Perfil Instagram Lucas Krausche"
                width={500}
                height={120}
                className="rounded-xl shadow-lg w-full my-4"
              />

              <p>
                E aquela mulher que havia me deixado, depois que eu apliquei
                exatamente o mesmo{" "}
                <span className="text-blue-400 font-semibold">
                  truque de 3 etapas
                </span>{" "}
                que eu vou te revelar neste plano, hoje é{" "}
                <strong className="text-white">minha noiva.</strong>
              </p>

              <Image
                src="/img/lucas-noiva.webp"
                alt="Lucas Krausche e sua noiva"
                width={400}
                height={600}
                className="rounded-xl shadow-lg mx-auto my-4 w-full max-w-[320px]"
              />

              <p>
                E o melhor... Eu fundei o{" "}
                <span className="text-blue-400 font-semibold">
                  Clube das Deusas de Alto Valor
                </span>
                , um método exclusivo que ensina mulheres a curar traumas
                profundos para terem relacionamentos saudáveis. Hoje o Clube
                conta com mais de{" "}
                <strong className="text-white">2.800 alunas.</strong>
              </p>

              <Image
                src="/img/clube-deusas.webp"
                alt="Clube das Deusas de Alto Valor"
                width={600}
                height={600}
                className="rounded-xl shadow-lg w-full my-4"
              />
              <p>
                Mas isso me deu acesso a{" "}
                <strong className="text-white">TODOS</strong> os segredos
                mais ocultos da mente feminina... Segredos que agora eu vou te
                revelar para que a sua ex volte a sentir sua falta, se arrependa
                de ter te deixado e queira correr atrás de você ainda essa
                semana.
              </p>
            </div>

            <button
              onClick={() => setCurrentStep(7)}
              className="w-full mt-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:scale-[0.98] text-white font-bold text-base rounded-2xl transition-all duration-150 shadow-lg shadow-green-500/20 cursor-pointer uppercase tracking-wide"
            >
              Continuar Plano!
            </button>
          </div>
        );

      case 7: // Engage 1
        return (
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl animate-fadeInUp">
            <h2 className="text-[1.35rem] font-bold text-white text-center leading-snug mb-8">
              Você gostaria que, além da mensagem de 3 palavras, eu te mostrasse
              como fazer o cérebro dela sentir saudade e voltar correndo pra
              você, mesmo que ela esteja com outro?
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                "Sim, quero fazer ela sentir minha falta.",
                "Sim, se for direto e prático.",
              ].map((text, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(8)}
                  className="p-4 rounded-2xl border-2 border-red-400/30 bg-red-500/20 hover:border-red-400/50 hover:bg-red-500/30 active:scale-[0.97] transition-all text-[0.95rem] font-semibold text-white cursor-pointer text-center backdrop-blur-md"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        );

      case 8: // Engage 2
        return (
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl animate-fadeInUp">
            <h2 className="text-[1.35rem] font-bold text-white text-center leading-snug mb-8">
              Se existisse um vídeo curto de 60 segundos mostrando o passo a
              passo exato para fazer sua ex voltar nas próximas 48 horas, você se
              comprometeria a assistir esse vídeo até o final?
            </h2>
            <div className="space-y-3">
              {[
                "Sim, quero assistir agora.",
                "Sim, quero assistir e aplicar hoje.",
                "Sim, mas quero entender cada detalhe.",
              ].map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(9)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-white/20 bg-black/30 hover:border-red-400/40 hover:bg-red-500/20 active:scale-[0.97] transition-all text-left cursor-pointer backdrop-blur-md"
                >
                  <span className="w-6 h-6 rounded-full border-2 border-gray-400 flex-shrink-0" />
                  <span className="text-[0.95rem] font-medium text-gray-200">
                    {opt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );

      case 9: // Loading + VSL
        return (
          <>
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl animate-fadeInUp">
              {/* VTurb Video Player */}
              <div className="mb-8">
                <VTurbPlayer />
              </div>

              {currentStep === 9 && (
                <ProtocolLoader
                  active={true}
                  startDelay={432000}
                  onComplete={handleProtocolComplete}
                />
              )}

              {protocolDone && (
                <button
                  onClick={() => {
                    setSalesActive(true);
                    setCurrentStep(10);
                  }}
                  className="w-full mt-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:scale-[0.98] text-white font-bold text-base rounded-2xl transition-all duration-150 shadow-lg shadow-green-500/20 cursor-pointer uppercase tracking-wide animate-fadeInUp"
                >
                  Clique aqui para RECONQUISTAR sua ex!
                </button>
              )}
            </div>

          </>
        );

      case 10: // Sales
        return (
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl animate-fadeInUp max-h-screen overflow-y-auto hide-scrollbar">
            {/* Header - Protocol Complete */}
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                SEU PROTOCOLO PERSONALIZADO FOI GERADO!
              </h2>
              <p className="text-gray-300 text-[0.95rem] leading-relaxed">
                Agora você tem acesso aos <strong className="text-white">códigos diretos</strong> para
                fazer sua ex sentir sua falta e voltar correndo pra você...
              </p>
            </div>

            {/* Investment Framing */}
            <div className="bg-red-500/10 border border-red-400/30 rounded-2xl p-6 mb-8">
              <p className="text-center text-[0.95rem] text-gray-300 leading-relaxed">
                Você está prestes a investir na <strong className="text-white">segunda chance de reescrever sua história de amor</strong>.
                O mesmo protocolo que transformou homens destruídos em caras que reconquistaram o respeito,
                o desejo e o amor de suas ex-namoradas.
              </p>
            </div>

            {/* Choice Framework */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white text-center mb-6">
                AGORA VOCÊ TEM 2 OPÇÕES:
              </h3>
              <div className="space-y-4">
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">❌</span>
                    <div>
                      <p className="text-white font-semibold mb-2">OPÇÃO 1: Continuar com 12% de chance</p>
                      <p className="text-gray-300 text-sm">
                        Ficar travado, mandando mensagens aleatórias, sendo rejeitado e vendo ela se afastar cada vez mais...
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">❤️</span>
                    <div>
                      <p className="text-white font-semibold mb-2">OPÇÃO 2: Usar o protocolo que funcionou para 30.000+ casais</p>
                      <p className="text-gray-300 text-sm">
                        Aplicar a mesma estratégia psicológica que fez ela voltar a sentir desejo, saudade e querer lutar pelo seu relacionamento.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guarantee Section */}
            <div className="text-center mb-8">
              <div className="bg-amber-500/20 border border-amber-400/30 rounded-2xl p-6">
                <h3 className="text-xl font-extrabold text-white mb-3">
                  🛡️ GARANTIA INQUEBRÁVEL DE 90 DIAS
                </h3>
                <p className="text-gray-300 text-[0.95rem] leading-relaxed">
                  Se em 90 dias você não conseguir <strong className="text-white">NENHUM resultado</strong>,
                  eu devolvo 100% do seu dinheiro. Sem perguntas, sem complicação.
                </p>
                <p className="text-amber-300 font-semibold mt-3 text-sm">
                  Ou seja, o risco é todo MEU!
                </p>
              </div>
            </div>

            {/* First CTA */}
            <a
              href="https://pay.kiwify.com.br/2yjxPKj"
              className="block w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:scale-[0.98] text-white font-bold text-lg rounded-2xl transition-all duration-150 shadow-lg shadow-green-500/20 text-center uppercase tracking-wide mb-8"
            >
              🎯 QUERO RECONQUISTAR MINHA EX AGORA!
            </a>

            {/* Product Promise */}
            <div className="bg-red-500/10 border border-red-400/30 rounded-2xl p-6 mb-8">
              <h4 className="text-white font-bold text-center mb-3">
                O CÓDIGO DA RECONQUISTA entrega exatamente:
              </h4>
              <div className="space-y-2 text-gray-300 text-sm">
                <p>✅ <strong className="text-white">O QUE</strong> falar para despertar saudade visceral</p>
                <p>✅ <strong className="text-white">QUANDO</strong> enviar cada mensagem para máximo impacto</p>
                <p>✅ <strong className="text-white">COMO</strong> manter a mente dela viciada em você</p>
                <p>✅ <strong className="text-white">ONDE</strong> aplicar cada gatilho psicológico</p>
              </div>
            </div>

            {/* Bonuses Section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white text-center mb-6">
                🎁 + VOCÊ GANHA 5 BÔNUS EXCLUSIVOS:
              </h3>

              <div className="space-y-4">
                {bonuses.map((bonus, i) => (
                  <BonusCard key={i} {...bonus} index={i} />
                ))}
              </div>

              {/* Extra Bonuses */}
              <div className="mt-6 space-y-4">
                <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎥</span>
                    <div>
                      <h5 className="text-white font-bold">BÔNUS 6: Sessões Ao Vivo Semanais</h5>
                      <p className="text-gray-300 text-sm mt-1">
                        Acesso direto ao Lucas para tirar dúvidas e receber orientação personalizada.
                      </p>
                      <span className="text-purple-400 font-semibold text-sm">Valor: R$ 497</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">👥</span>
                    <div>
                      <h5 className="text-white font-bold">BÔNUS 7: Comunidade VIP Desenrolado</h5>
                      <p className="text-gray-300 text-sm mt-1">
                        Grupo privado de suporte com mais de 5.000 homens que reconquistaram suas ex.
                      </p>
                      <span className="text-red-400 font-semibold text-sm">Valor: R$ 297</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Value */}
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 mt-6 text-center">
                <p className="text-white font-bold text-lg">
                  VALOR TOTAL DOS BÔNUS: <span className="text-red-400 line-through">R$ 2.539</span>
                </p>
                <p className="text-red-400 font-bold text-xl">
                  HOJE POR APENAS: R$ 47
                </p>
              </div>
            </div>

            {/* Social Proof Section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white text-center mb-6">
                📱 VEJA OS RESULTADOS DOS NOSSOS ALUNOS:
              </h3>

              {/* Screenshot de Mensagens */}
              <div className="text-center mb-6">
                <img
                  src="/img/mensagens-dela.webp"
                  alt="Mensagens de sucesso dos alunos"
                  className="max-w-full mx-auto rounded-xl shadow-lg"
                  width="350"
                  height="600"
                />
              </div>

              <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
                <p className="text-gray-300 text-sm italic mb-2">
                  "Em menos de 24 horas ela me desbloqueou e disse que estava sentindo minha falta..."
                </p>
                <p className="text-blue-400 font-semibold text-sm">- Rafael, 28 anos</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
                <p className="text-gray-300 text-sm italic mb-2">
                  "Funciona mesmo! Ela que terminou comigo veio atrás pedindo uma nova chance."
                </p>
                <p className="text-blue-400 font-semibold text-sm">- Carlos, 32 anos</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
                <p className="text-gray-300 text-sm italic mb-2">
                  "Em 48h ela estava na minha porta chorando e pedindo perdão. Inacreditável!"
                </p>
                <p className="text-blue-400 font-semibold text-sm">- Bruno, 26 anos</p>
              </div>

              <div className="space-y-4">
                {[1, 2, 4, 6, 7].map((n) => (
                  <Image
                    key={n}
                    src={`/img/depoimento-${n}.webp`}
                    alt={`Depoimento de aluno ${n}`}
                    width={400}
                    height={500}
                    className="rounded-2xl shadow-lg w-full"
                  />
                ))}
              </div>
            </div>

            {/* Urgency Timer */}
            {salesActive && <Countdown active={salesActive} />}

            {/* Authority Reinforcement */}
            <div className="bg-red-600/20 border border-red-400/30 rounded-xl p-6 mb-8">
              <div className="text-center">
                <h4 className="text-white font-bold mb-3">QUEM SOU EU PARA TE ENSINAR ISSO?</h4>
                <div className="text-gray-300 text-sm space-y-2">
                  <p>✅ <strong className="text-white">Psicanalista Clínico</strong> especializado em relacionamentos</p>
                  <p>✅ <strong className="text-white">2 milhões de seguidores</strong> em todas as redes sociais</p>
                  <p>✅ <strong className="text-white">Reconquistei minha própria ex</strong> (hoje minha noiva)</p>
                  <p>✅ <strong className="text-white">30.000+ casais</strong> já reconquistaram usando meus métodos</p>
                  <p>✅ <strong className="text-white">Fundador do Clube das Deusas</strong> com 2.800 alunas</p>
                </div>
              </div>
            </div>

            {/* Final Push */}
            <div className="bg-red-600/20 border border-red-400/30 rounded-xl p-6 mb-8">
              <h4 className="text-white font-bold text-center mb-4">
                ⚠️ VOCÊ NÃO ESTÁ AQUI POR ACASO!
              </h4>
              <p className="text-gray-300 text-center text-[0.95rem] leading-relaxed">
                Se você chegou até aqui é porque o <strong className="text-white">universo está te dando uma segunda chance</strong>.
                A pergunta é: você vai aproveitar ou vai deixar ela passar?
              </p>
              <div className="mt-4 text-center">
                <p className="text-red-400 font-semibold text-sm">
                  Tome seu lugar... no centro dos pensamentos dela.
                </p>
              </div>
            </div>

            {/* Final CTA */}
            <a
              href="https://pay.kiwify.com.br/2yjxPKj"
              className="block w-full py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:scale-[0.98] text-white font-bold text-lg rounded-2xl transition-all duration-150 shadow-lg shadow-green-500/20 text-center uppercase tracking-wide mb-6"
            >
              💚 SIM! QUERO RECONQUISTAR MINHA EX AGORA!
            </a>

            {/* Final Guarantee Reminder */}
            <div className="text-center">
              <p className="text-gray-400 text-xs">
                🛡️ Lembre-se: 90 dias de garantia total. Risco zero para você.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/img/whatsapp-hero.webp')`,
          filter: 'blur(8px) brightness(0.2)',
          transform: 'scale(1.1)',
          zIndex: -2
        }}
      />

      {/* Dark overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black/50" style={{ zIndex: -1 }} />

      {/* Progress Bar */}
      {currentStep >= 1 && currentStep <= 5 && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Pergunta {currentStep} de 5</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-700/50 backdrop-blur-md rounded-full h-2 border border-white/10">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {renderCurrentStep()}
        </div>
      </div>

      {/* Back Redirect Global Overlay */}
      {showBackRedirect && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-95 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg sm:rounded-2xl shadow-2xl max-w-md sm:max-w-lg md:max-w-2xl w-full max-h-[95vh] overflow-y-auto animate-fadeInUp">
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
            <div className="p-4 sm:p-6 md:p-8 text-center">
              <div className="mb-6">
                <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-4 leading-tight">
                  Você acaba de desbloquear o <span className="text-red-600">Código da Reconquista</span> com <span className="text-green-600 text-2xl md:text-3xl font-bold">50% de desconto</span>
                </h2>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-6">
                  <span className="text-lg md:text-2xl text-gray-500 line-through">DE R$97</span>
                  <span className="text-2xl md:text-4xl font-bold text-red-600">Por apenas R$47</span>
                </div>

                <button
                  onClick={handleBackRedirectCTA}
                  className="bg-red-500 hover:bg-red-600 text-white text-lg md:text-xl font-bold py-3 md:py-4 px-6 md:px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 mb-4 w-full sm:w-auto"
                >
                  🎯 QUERO RECONQUISTAR MINHA EX
                </button>

                <p className="text-xs md:text-sm text-gray-600 mb-6">
                  Pagamento único • Acesso imediato • Oferta exclusiva desta página
                </p>
              </div>

              {/* Benefits */}
              <div className="bg-red-50 rounded-lg p-4 md:p-6 mb-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">
                  Essa é sua oportunidade de…
                </h3>

                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <span className="text-green-500 font-bold text-lg md:text-xl flex-shrink-0">✔</span>
                    <p className="text-gray-700 text-sm md:text-base">
                      Parar de se humilhar e voltar a ser o homem que ela admira, respeita e teme perder.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-green-500 font-bold text-lg md:text-xl flex-shrink-0">✔</span>
                    <p className="text-gray-700 text-sm md:text-base">
                      Evitar o erro invisível que impede 93% dos homens de reconquistarem a ex.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-green-500 font-bold text-lg md:text-xl flex-shrink-0">✔</span>
                    <p className="text-gray-700 text-sm md:text-base">
                      Acessar o SMS que faz ela te desbloquear mesmo após dias ou semanas em silêncio.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-green-500 font-bold text-lg md:text-xl flex-shrink-0">✔</span>
                    <p className="text-gray-700 text-sm md:text-base">
                      Ter em mãos o passo a passo para fazer ela repensar o término e colocar a aliança de volta em até 72 horas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Urgency */}
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 md:p-4 mb-4">
                <p className="text-red-800 font-semibold text-sm md:text-base text-center">
                  ⚠️ Assim que você sair desta página, essa condição especial será removida automaticamente.
                </p>
              </div>

              {/* Final CTA */}
              <button
                onClick={handleBackRedirectCTA}
                className="bg-red-600 hover:bg-red-700 text-white text-lg md:text-xl font-bold py-3 md:py-4 px-6 md:px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 w-full sm:w-auto animate-pulse"
              >
                💝 QUERO RECONQUISTAR MINHA EX
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }

        .animate-bounceIn {
          animation: bounceIn 0.8s ease-out;
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }

        .hover\\:scale-105:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}