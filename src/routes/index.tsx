import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronDown,
  User,
  Grid3x3,
  FileText,
  ChevronRight,
  Plus,
  X,
  Check,
  Phone,
  MessageSquare,
  Wifi,
} from "lucide-react";
import familyImgAsset from "@/assets/family-tablet.jpg.asset.json";
const familyImg = familyImgAsset.url;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Resumo de Consumo | Vivo" },
      {
        name: "description",
        content: "Acompanhe seu consumo de dados Vivo Móvel em tempo real.",
      },
    ],
  }),
  component: ResumoConsumo,
});

type Line = {
  number: string;
  used: number; // GB
  total: number; // GB
  plan: string;
  cycleDays: number;
};

const LINES: Line[] = [
  {
    number: "(31) 97115-7584",
    used: 19.3,
    total: 50,
    plan: "SmartVoz 50GB",
    cycleDays: 3,
  },
  {
    number: "(32) 99963-0109",
    used: 23.3,
    total: 50,
    plan: "SmartVoz 50GB",
    cycleDays: 3,
  },
];

// Progress arc color: green → yellow → orange → red as it fills toward 100%
function ringColor(pct: number) {
  if (pct >= 95) return "#ff2a2a"; // red
  if (pct >= 75) return "#ff7a18"; // orange
  if (pct >= 45) return "#f4c20d"; // yellow
  return "#7ec832"; // green
}

function formatGB(gb: number) {
  if (gb < 1) return `${(gb * 1024).toFixed(0)} MB`;
  return `${gb.toFixed(1)} GB`;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)] as const;
}
function lerpColor(a: string, b: string, t: number) {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}
// Tip color interpolated across the full 0-100% spectrum so the arc tip
// shifts smoothly green → yellow → orange → red as consumption grows.
function tipColor(pct: number) {
  const p = Math.min(100, Math.max(0, pct));
  if (p <= 50) return lerpColor("#7ec832", "#f4c20d", p / 50);
  if (p <= 80) return lerpColor("#f4c20d", "#ff7a18", (p - 50) / 30);
  return lerpColor("#ff7a18", "#ff2a2a", (p - 80) / 20);
}

function ConsumoRing({ line }: { line: Line }) {
  const pct = Math.min(100, (line.used / line.total) * 100);
  const p = Math.max(0.0001, pct);
  const tip = tipColor(pct);

  // SVG-based ring for crisp rendering at any zoom level.
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 90;
  const strokeW = 10;
  const circ = 2 * Math.PI * r;

  // Smooth gradient arc: split the consumed portion into many tiny segments,
  // each painted with the interpolated color at its midpoint (green→yellow→
  // orange→red). Produces a seamless rastro of tones along the path.
  const STEPS = 80;
  const segments = Array.from({ length: STEPS }, (_, i) => {
    const from = (i / STEPS) * p;
    const to = ((i + 1) / STEPS) * p;
    const mid = (from + to) / 2;
    return { from, to, color: tipColor(mid) };
  });


  // Tip dot angle (0° = top, clockwise).
  const angle = (p / 100) * 360;
  const tipX = cx + r * Math.sin((angle * Math.PI) / 180);
  const tipY = cy - r * Math.cos((angle * Math.PI) / 180);

  return (
    <div className="relative h-[220px] w-[220px] shrink-0">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 h-full w-full"
        style={{ shapeRendering: "geometricPrecision" }}
      >
        {/* Purple base track (thin) */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#7b1fa2" strokeWidth={3} />

        {/* Colored consumed arc — rotate -90° so 0% sits at top */}
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {segments.map((s, i) => {
            const isFirst = i === 0;
            const isLast = i === segments.length - 1;
            const segLen = ((s.to - s.from) / 100) * circ + (isLast ? 0 : 0.6);

            const segOffset = (s.from / 100) * circ;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeW}
                strokeLinecap={isFirst || isLast ? "round" : "butt"}
                strokeDasharray={`${segLen} ${circ}`}
                strokeDashoffset={-segOffset}
              />
            );
          })}

        </g>

        {/* Tip marker — colored cap matching bar tone with soft shadow + tiny white dot */}
        {pct > 0 && (
          <>
            <defs>
              <filter id={`tipShadow-${line.number.replace(/\D/g,"")}`} x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#000" floodOpacity="0.55" />
              </filter>
            </defs>
            <circle
              cx={tipX}
              cy={tipY}
              r={strokeW / 2}
              fill={tip}
              filter={`url(#tipShadow-${line.number.replace(/\D/g,"")})`}
            />


            <circle cx={tipX} cy={tipY} r={1.6} fill="white" />
          </>
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[40px] font-semibold leading-none text-[#1a1a1a]">
          {line.used === 0
            ? 0
            : line.used < 1
              ? line.used.toFixed(2)
              : line.used.toFixed(1)}
          <span className="ml-1 text-lg font-semibold text-[#1a1a1a]">GB</span>
        </div>
        <div className="mt-2 text-xs text-[#9a9a9a]">
          consumidos de <span className="font-bold text-[#1a1a1a]">{line.total} GB</span>
        </div>
      </div>
    </div>
  );
}



function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#eee] bg-white px-6 py-4">
          <h3 className="text-lg font-semibold text-[#660099]">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-1 text-[#666] hover:bg-[#f3eaf7] hover:text-[#660099]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-[#eee] bg-white px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function ResumoConsumo() {
  const [lineIdx, setLineIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [expandOpen, setExpandOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<"dados" | "minutos" | "sms" | null>("dados");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhats, setNotifyWhats] = useState(true);
  const [notifySms, setNotifySms] = useState(true);

  const line = LINES[lineIdx];
  const pct = Math.min(100, (line.used / line.total) * 100);
  const available = +(line.total - line.used).toFixed(2);
  const availPct = Math.round(100 - pct);
  const usedPct = Math.round(pct);
  const color = ringColor(pct);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const consumoSimulado = [
    20.9, 16.3, 25.1, 18.7, 22.4, line.used,
    23.8, 19.5, 21.2, 17.4, 24.1, 15.6,
  ];

  const months = monthNames
    .map((nome, i) => ({
      mes: `${nome}/${currentYear}`,
      consumo: consumoSimulado[i],
      status: i === currentMonth ? "Em andamento" : "Fechado",
      idx: i,
    }))
    .filter((m) => m.idx <= currentMonth);



  const plans = [
    { id: "sv50", nome: "SmartVoz 50GB", giga: "50 GB", preco: "R$ 99,90/mês", bonus: "+ Apps ilimitados" },
    { id: "sv80", nome: "SmartVoz 80GB", giga: "80 GB", preco: "R$ 124,90/mês", bonus: "+ Disney+ incluso" },
    { id: "sv100", nome: "SmartVoz 100GB", giga: "100 GB", preco: "R$ 149,90/mês", bonus: "+ Netflix + Disney+" },
    
  ];

  return (
    <div className="min-h-screen bg-[#f3f3f3]">

      <main className="mx-auto max-w-[1400px] px-4 pt-6 pb-16 md:px-6 md:pt-8">
        <h1 className="text-[32px] font-semibold leading-tight text-[#660099] md:text-[42px]">
          Resumo de Consumo
        </h1>
        <p className="mt-1 text-sm text-[#666]">
          Informação atualizada em{" "}
          <span className="font-semibold text-[#333]">08/06/2026</span> às{" "}
          <span className="font-semibold text-[#333]">12:34</span>
        </p>


        {/* Hero card */}
        <section className="relative mt-6 overflow-hidden rounded-md">
          <img
            src={familyImg}
            alt="Família usando tablet"
            width={1280}
            height={768}
            className="h-[280px] w-full object-cover md:h-[400px]"
          />

          {/* Consumption panel overlay - centered/right like reference */}
          <div className="relative mx-4 -mt-24 overflow-hidden rounded-md bg-white/95 p-5 pb-10 shadow-xl backdrop-blur md:absolute md:right-8 md:top-1/2 md:mx-0 md:mt-0 md:w-[520px] md:-translate-y-1/2 md:p-5 md:pb-8">
            {/* Gray diagonal triangle in the corner with + near the tip */}
            <button
              aria-label="Ver histórico de consumo"
              onClick={() => setExpandOpen(true)}
              className="absolute bottom-0 right-0 h-10 w-10 text-[#660099] md:h-12 md:w-12"
              style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
            >
              <span className="absolute inset-0 bg-[#d9d9d9]" />
              <Plus
                className="absolute bottom-1 right-1 h-4 w-4"
                strokeWidth={2.75}
              />
            </button>
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-center md:gap-4">
              <div className="md:-ml-6"><ConsumoRing line={line} /></div>

              <div className="md:w-[220px]">


                <h2 className="text-[15px] font-semibold tracking-wide text-[#1a1a1a]">
                  {line.plan}
                </h2>
                <p className="mt-1 text-sm text-[#9a9a9a]">
                  Fim do ciclo em{" "}
                  <span className="font-semibold text-[#1a1a1a]">{line.cycleDays} dias</span>
                </p>

                <ul className="mt-5 text-sm">
                  <li className="flex items-center justify-between gap-4 border-b border-[#d9d9d9] py-3">
                    <span className="flex items-center gap-2 text-[#9a9a9a]">
                      <span
                        className="inline-block h-3 w-3 rounded-full border-[3px]"
                        style={{ borderColor: color }}
                      />
                      Meu Consumo
                    </span>
                    <span className="font-semibold text-[#1a1a1a]">
                      {usedPct}% - {formatGB(line.used)}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-4 border-b border-[#d9d9d9] py-3">
                    <span className="flex items-center gap-2 text-[#9a9a9a]">
                      <span className="inline-block h-3 w-3 rounded-full border-[3px] border-[#660099]" />
                      Disponíveis
                    </span>
                    <span className="font-semibold text-[#1a1a1a]">
                      {availPct}% - {formatGB(available)}
                    </span>
                  </li>
                </ul>

                <button
                  onClick={() => setDetailsOpen(true)}
                  className="mt-4 text-sm font-semibold text-[#660099] hover:underline"
                >
                  Ver detalhes do seu consumo &gt;
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Upgrade card */}
        <button
          onClick={() => setUpgradeOpen(true)}
          className="mt-4 flex w-full items-center justify-between rounded-md bg-white px-6 py-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <FileText className="h-7 w-7 text-[#660099]" />
            <div className="text-left">
              <div className="text-[15px] font-semibold text-[#333]">
                Quer falar e navegar ainda mais?
              </div>
              <div className="text-sm text-[#666]">
                Faça um upgrade no seu plano agora
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[#660099]" />
        </button>

        
      </main>

      {/* Details modal */}
      <Modal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Detalhes do seu consumo"
      >
        <div className="space-y-4">
          <div className="rounded-md bg-[#f9f5fc] p-4">
            <div className="text-xs text-[#660099]">Linha</div>
            <div className="text-sm font-semibold text-[#333]">{line.number}</div>
            <div className="mt-2 text-xs text-[#660099]">Plano</div>
            <div className="text-sm font-semibold text-[#333]">{line.plan}</div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setActiveCard(activeCard === "dados" ? null : "dados")}
              className={`rounded-md border p-3 text-center transition ${
                activeCard === "dados" ? "border-[#660099] bg-[#f9f5fc]" : "border-[#eee] hover:border-[#cda8e0]"
              }`}
            >
              <Wifi className="mx-auto h-5 w-5 text-[#660099]" />
              <div className="mt-1 text-xs text-[#666]">Dados</div>
              <div className="text-sm font-semibold text-[#333]">
                {line.total} GB
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveCard(activeCard === "minutos" ? null : "minutos")}
              className={`rounded-md border p-3 text-center transition ${
                activeCard === "minutos" ? "border-[#660099] bg-[#f9f5fc]" : "border-[#eee] hover:border-[#cda8e0]"
              }`}
            >
              <Phone className="mx-auto h-5 w-5 text-[#660099]" />
              <div className="mt-1 text-xs text-[#666]">Minutos</div>
              <div className="text-sm font-semibold text-[#333]">Ilimitado</div>
            </button>
            <button
              type="button"
              onClick={() => setActiveCard(activeCard === "sms" ? null : "sms")}
              className={`rounded-md border p-3 text-center transition ${
                activeCard === "sms" ? "border-[#660099] bg-[#f9f5fc]" : "border-[#eee] hover:border-[#cda8e0]"
              }`}
            >
              <MessageSquare className="mx-auto h-5 w-5 text-[#660099]" />
              <div className="mt-1 text-xs text-[#666]">SMS</div>
              <div className="text-sm font-semibold text-[#333]">Ilimitado</div>
            </button>
          </div>


          <div>
            <div className="mb-2 text-sm font-semibold text-[#333]">
              Histórico mensal
            </div>
            <ul className="divide-y divide-[#eee] rounded-md border border-[#eee]">
              {months.map((m, i) => {
                const minutosVals = [820, 645, 712, 538, 690, 756, 623, 589, 701, 534, 678, 612];
                const smsVals = [42, 31, 58, 24, 37, 45, 29, 51, 33, 48, 27, 40];
                const valor =
                  activeCard === "minutos"
                    ? `${minutosVals[i]} min`
                    : activeCard === "sms"
                      ? `${smsVals[i]} SMS`
                      : formatGB(m.consumo);
                return (
                  <li
                    key={m.mes}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="text-[#333]">{m.mes}</div>
                      <div className="text-xs text-[#888]">{m.status}</div>
                    </div>
                    <div className="font-semibold text-[#660099]">{valor}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Modal>

      {/* Upgrade modal */}
      <Modal
        open={upgradeOpen}
        onClose={() => {
          setUpgradeOpen(false);
          setSelectedPlan(null);
        }}
        title="Faça upgrade do seu plano"
        footer={
          <button
            disabled={!selectedPlan || (!notifyEmail && !notifyWhats && !notifySms)}
            onClick={() => {
              const p = plans.find((x) => x.id === selectedPlan);
              const canais = [
                notifyEmail && "e-mail",
                notifyWhats && "WhatsApp",
                notifySms && "SMS",
              ].filter(Boolean).join(", ");
              // TODO: integrar APIs reais (SendGrid/Resend, Twilio/WhatsApp Business, Twilio SMS)
              console.log("Upgrade notification channels:", { email: notifyEmail, whatsapp: notifyWhats, sms: notifySms, plan: p?.nome });
              setUpgradeOpen(false);
              setSelectedPlan(null);
              showToast(`Upgrade solicitado: ${p?.nome}. Confirmação enviada via ${canais}.`);
            }}
            className="w-full rounded-md bg-[#660099] py-3 text-sm font-semibold text-white transition hover:bg-[#520077] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirmar upgrade
          </button>
        }
      >
        <p className="mb-4 text-sm text-[#666]">
          Escolha o melhor plano para você. A mudança entra em vigor no próximo ciclo.
        </p>
        <div className="space-y-3">
          {plans.map((p) => {
            const sel = selectedPlan === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className={`flex w-full items-center justify-between rounded-md border-2 p-4 text-left transition ${
                  sel
                    ? "border-[#660099] bg-[#f9f5fc]"
                    : "border-[#eee] hover:border-[#cda8e0]"
                }`}
              >
                <div>
                  <div className="font-semibold text-[#333]">{p.nome}</div>
                  <div className="text-xs text-[#888]">{p.bonus}</div>
                  <div className="mt-1 text-sm font-semibold text-[#660099]">
                    {p.preco}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-[#888]">Internet</div>
                    <div className="text-sm font-semibold text-[#333]">{p.giga}</div>
                  </div>
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      sel ? "border-[#660099] bg-[#660099]" : "border-[#ccc]"
                    }`}
                  >
                    {sel && <Check className="h-4 w-4 text-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-md border border-[#eee] bg-[#fafafa] p-4">
          <div className="mb-2 text-sm font-semibold text-[#333]">Receber confirmação por</div>
          <p className="mb-3 text-xs text-[#888]">Escolha os canais para receber a confirmação do upgrade.</p>
          <div className="space-y-2">
            {[
              { key: "email", label: "E-mail", checked: notifyEmail, set: setNotifyEmail },
              { key: "whats", label: "WhatsApp", checked: notifyWhats, set: setNotifyWhats },
              { key: "sms", label: "SMS", checked: notifySms, set: setNotifySms },
            ].map((c) => (
              <label key={c.key} className="flex cursor-pointer items-center justify-between rounded-md border border-[#eee] bg-white px-3 py-2 text-sm">
                <span className="text-[#333]">{c.label}</span>
                <button
                  type="button"
                  onClick={() => c.set(!c.checked)}
                  className={`relative h-6 w-11 rounded-full transition ${c.checked ? "bg-[#660099]" : "bg-[#ccc]"}`}
                  aria-pressed={c.checked}
                  aria-label={`Notificar por ${c.label}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${c.checked ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      {/* Expanded view modal */}
      <Modal
        open={expandOpen}
        onClose={() => setExpandOpen(false)}
        title="Consumo detalhado"
      >
        <div className="flex flex-col items-center gap-4">
          <ConsumoRing line={line} />
          <div className="w-full space-y-2 text-sm">
            <div className="flex justify-between border-b border-[#eee] pb-2">
              <span className="text-[#666]">Plano</span>
              <span className="font-semibold text-[#660099]">{line.plan}</span>
            </div>
            <div className="flex justify-between border-b border-[#eee] pb-2">
              <span className="text-[#666]">Linha</span>
              <span className="font-semibold text-[#660099]">{line.number}</span>
            </div>
            <div className="flex justify-between border-b border-[#eee] pb-2">
              <span className="text-[#666]">Consumido</span>
              <span className="font-semibold text-[#660099]">{formatGB(line.used)}</span>
            </div>
            <div className="flex justify-between border-b border-[#eee] pb-2">
              <span className="text-[#666]">Disponível</span>
              <span className="font-semibold text-[#660099]">{formatGB(available)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666]">Fim do ciclo</span>
              <span className="font-semibold text-[#660099]">em {line.cycleDays} dias</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-[#333] px-5 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
