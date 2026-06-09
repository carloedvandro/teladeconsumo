import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  RefreshCw,
  ArrowUpCircle,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

import familyImgAsset from "@/assets/woman-phone.png.asset.json";
import icon3dData from "@/assets/icon-3d-data.png";
import icon3dPhone from "@/assets/icon-3d-phone.png";
import icon3dSms from "@/assets/icon-3d-sms.png";
import icon3dAutorenew from "@/assets/icon-3d-autorenew.png";
import icon3dBonus from "@/assets/icon-3d-bonus.png";
import icon3dAlert from "@/assets/icon-3d-alert.png";
import icon3dUpgradeAsset from "@/assets/icon-3d-upgrade.png.asset.json";
const familyImg = familyImgAsset.url;
const icon3dUpgrade = icon3dUpgradeAsset.url;


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

// Calcula dias até o próximo dia 6 (renovação mensal do ciclo).
function daysUntilCycleRenewal(renewalDay = 6, today = new Date()) {
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  let next = new Date(y, m, renewalDay);
  if (d >= renewalDay) next = new Date(y, m + 1, renewalDay);
  const ms = next.getTime() - new Date(y, m, d).getTime();
  return Math.round(ms / 86400000);
}

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

function ConsumoRing({ line, bonus = 0 }: { line: Line; bonus?: number }) {
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
        <div className="mt-2 text-xs text-[#6b6b6b]">
          consumidos de{" "}
          <span className="font-bold text-[#1a1a1a]">
            {line.total} GB
          </span>
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
        className="relative flex max-h-[85vh] w-full max-w-[480px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
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
  const [autoDebit, setAutoDebit] = useState(false);
  const [confirmAutoDebit, setConfirmAutoDebit] = useState(false);

  const baseLine = LINES[lineIdx];
  const bonusDebito = autoDebit ? 20 : 0;
  const franquiaTotal = baseLine.total + bonusDebito;
  const line: Line = { ...baseLine, total: franquiaTotal };
  const pct = Math.min(100, (line.used / line.total) * 100);
  const available = +(line.total - line.used).toFixed(2);
  const availPct = Math.round(100 - pct);
  const usedPct = Math.round(pct);
  const color = ringColor(pct);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const scheduleMidnight = () => {
      const n = new Date();
      const next = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 1);
      return window.setTimeout(() => {
        setNow(new Date());
        timer = scheduleMidnight();
      }, next.getTime() - n.getTime());
    };
    let timer = scheduleMidnight();
    const onFocus = () => setNow(new Date());
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setLastUpdated(new Date());
    const interval = window.setInterval(refresh, 60_000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastUpdatedDate = `${pad(lastUpdated.getDate())}/${pad(lastUpdated.getMonth() + 1)}/${lastUpdated.getFullYear()}`;
  const lastUpdatedTime = `${pad(lastUpdated.getHours())}:${pad(lastUpdated.getMinutes())}`;

  const cycleDaysLeft = daysUntilCycleRenewal(6, now);
  const cycleLabel =
    cycleDaysLeft === 0
      ? "hoje"
      : `em ${cycleDaysLeft} ${cycleDaysLeft === 1 ? "dia" : "dias"}`;


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
          <span className="font-semibold text-[#333]">{lastUpdatedDate}</span> às{" "}
          <span className="font-semibold text-[#333]">{lastUpdatedTime}</span>

        </p>


        {/* Hero card */}
        <section className="relative mt-6 overflow-hidden rounded-md">
          <img
            src={familyImg}
            alt="Família usando tablet"
            width={1280}
            height={768}
            className="h-[340px] w-full object-cover object-[center_15%] md:h-[520px]"
          />

          {/* Consumption panel overlay - centered/right like reference */}
          <div
            className="relative -mt-24 overflow-hidden rounded-md p-5 pb-10 md:absolute md:right-8 md:top-1/2 md:mx-0 md:mt-0 md:w-[520px] md:-translate-y-1/2 md:p-5 md:pb-8"
            style={{
              background: "rgba(255,255,255,0.74)",
              backdropFilter: "blur(6px)",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.45)",
            }}
          >
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
            <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center md:justify-center md:gap-4">
              <div className="self-center md:-ml-6 md:self-auto"><ConsumoRing line={line} bonus={bonusDebito} /></div>

              <div className="w-full md:w-[220px]">



                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[15px] font-semibold tracking-wide text-[#1a1a1a]">
                    {baseLine.plan}
                  </h2>
                  {bonusDebito > 0 && (
                    <span className="inline-flex items-center rounded-full bg-[#16a34a]/15 px-2 py-0.5 text-[10px] font-semibold text-[#15803d] ring-1 ring-[#16a34a]/30 animate-fade-in">
                      +{bonusDebito}GB liberado
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[#5a5a5a]">
                  Fim do ciclo{" "}
                  <span className="font-semibold text-[#1a1a1a]">{cycleLabel}</span>
                </p>

                <ul className="mt-5 text-sm">
                  <li className="flex items-center justify-between gap-4 border-b border-[#a8a8a8] py-3">
                    <span className="flex items-center gap-2 text-[#5a5a5a]">

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
                  <li className="flex items-center justify-between gap-4 border-b border-[#a8a8a8] py-3">
                    <span className="flex items-center gap-2 text-[#5a5a5a]">
                      <span className="inline-block h-3 w-3 rounded-full border-[3px] border-[#660099]" />
                      Disponíveis
                    </span>
                    <span className="font-semibold text-[#1a1a1a]">
                      {availPct}% - {formatGB(available)}
                    </span>
                  </li>
                </ul>

                {/* Renovação automática (integrada, sem card) */}
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 pt-0.5">
                    <span className="text-sm font-semibold text-[#1a1a1a]">Renovação automática</span>
                    <div className="mt-2.5 space-y-0.5">
                      {autoDebit ? (
                        <div
                          className="text-[11px] font-semibold text-[#660099] transition-all duration-500"
                          style={{ opacity: 1, transform: 'translateY(0)' }}
                        >
                          Débito automático ativo
                        </div>
                      ) : (
                        <div className="text-[11px] font-medium text-[#666] transition-all duration-500">
                          Ative e ganhe +20GB de bônus
                        </div>
                      )}

                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoDebit}
                    onClick={() => {
                      if (autoDebit) {
                        setAutoDebit(false);
                      } else {
                        setConfirmAutoDebit(true);
                      }
                    }}
                    className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 ${
                      autoDebit ? "bg-[#16a34a]" : "bg-[#bfbfbf]"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${
                        autoDebit ? "translate-x-[22px]" : "translate-x-[2px]"
                      }`}
                    />
                  </button>
                </div>


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

        {/* Upgrade card - separate block below hero */}
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
          <div className="px-1 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#444]">
              Linha
            </div>
            <div className="mt-1 text-[22px] font-bold tracking-tight text-[#660099]">
              {line.number}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "dados" as const, icon: icon3dData, label: "Dados", value: `${line.total} GB` },
              { key: "minutos" as const, icon: icon3dPhone, label: "Minutos", value: "Ilimitado" },
              { key: "sms" as const, icon: icon3dSms, label: "SMS", value: "Ilimitado" },
            ].map((card) => {
              const active = activeCard === card.key;
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => setActiveCard(active ? null : card.key)}
                  className="rounded-xl p-3 text-center transition"
                  style={{
                    background: active
                      ? "rgba(102,0,153,0.04)"
                      : "#ffffff",
                    border: active
                      ? "1px solid rgba(102,0,153,0.25)"
                      : "1px solid rgba(0,0,0,0.06)",
                    boxShadow: active
                      ? "0 0 18px -6px rgba(102,0,153,0.25)"
                      : "0 2px 8px -4px rgba(0,0,0,0.08)",
                  }}
                >
                  <img
                    src={card.icon}
                    alt=""
                    loading="lazy"
                    width={64}
                    height={64}
                    className="mx-auto h-16 w-16 object-contain"
                  />
                  <div className="mt-1.5 text-[11px] font-medium text-[#660099]">{card.label}</div>
                  <div className="text-[13px] font-bold text-[#1a1a1a]">{card.value}</div>
                </button>
              );
            })}
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

      {/* Upgrade modal - premium glass */}
      {upgradeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
          style={{ backdropFilter: "blur(4px)" }}
          onClick={() => {
            setUpgradeOpen(false);
            setSelectedPlan(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[88vh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl animate-scale-in"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(14px)",
              boxShadow:
                "0 20px 60px -10px rgba(102,0,153,0.25), 0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.5)",
            }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#660099]/10 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#660099] to-[#7a00b3] shadow-md">
                  <ArrowUpCircle className="h-4.5 w-4.5 text-white" strokeWidth={2.4} />
                </div>
                <h3 className="text-lg font-semibold text-[#660099]">Upgrade de plano</h3>
              </div>
              <button
                onClick={() => {
                  setUpgradeOpen(false);
                  setSelectedPlan(null);
                }}
                aria-label="Fechar"
                className="rounded-full p-1.5 text-[#666] transition hover:bg-[#660099]/10 hover:text-[#660099]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-5">
              <p className="mb-4 text-sm text-[#5a5a5a]">
                Escolha o melhor plano para você. A mudança entra em vigor no próximo ciclo.
              </p>
              <div className="space-y-3">
                {plans.map((p, idx) => {
                  const sel = selectedPlan === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlan(p.id)}
                      className={`group relative flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all duration-300 animate-fade-in ${
                        sel
                          ? "border-[#660099] bg-gradient-to-br from-[#f9f5fc] to-[#fff]"
                          : "border-[#e8e8ee] bg-white/70 hover:-translate-y-0.5 hover:border-[#cda8e0] hover:bg-white"
                      }`}
                      style={{
                        animationDelay: `${idx * 60}ms`,
                        boxShadow: sel
                          ? "0 8px 24px -8px rgba(102,0,153,0.30), inset 0 1px 0 rgba(255,255,255,0.8)"
                          : "0 1px 2px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.6)",
                      }}
                    >
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold text-[#1a1a1a]">{p.nome}</div>
                        <div className="mt-0.5 text-[11px] text-[#888]">{p.bonus}</div>
                        <div className="mt-2 text-sm font-semibold text-[#660099]">
                          {p.preco}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wide text-[#999]">Internet</div>
                          <div className="text-base font-bold text-[#1a1a1a]">{p.giga}</div>
                        </div>
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                            sel
                              ? "bg-gradient-to-br from-[#660099] to-[#7a00b3] shadow-[0_0_0_4px_rgba(102,0,153,0.15)]"
                              : "border-2 border-[#d4d4d8] bg-white"
                          }`}
                        >
                          {sel && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div
                className="mt-5 rounded-xl border border-[#660099]/10 p-4"
                style={{ background: "rgba(249,245,252,0.6)" }}
              >
                <div className="mb-1 text-sm font-semibold text-[#1a1a1a]">Receber confirmação por</div>
                <p className="mb-3 text-xs text-[#888]">Escolha os canais para receber a confirmação do upgrade.</p>
                <div className="space-y-2">
                  {[
                    { key: "email", label: "E-mail", checked: notifyEmail, set: setNotifyEmail },
                    { key: "whats", label: "WhatsApp", checked: notifyWhats, set: setNotifyWhats },
                    { key: "sms", label: "SMS", checked: notifySms, set: setNotifySms },
                  ].map((c) => (
                    <label
                      key={c.key}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-[#ececf2] bg-white/80 px-3 py-2 text-sm transition hover:border-[#cda8e0]"
                    >
                      <span className="text-[#333]">{c.label}</span>
                      <button
                        type="button"
                        onClick={() => c.set(!c.checked)}
                        className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
                          c.checked ? "bg-[#660099]" : "bg-[#ccc]"
                        }`}
                        aria-pressed={c.checked}
                        aria-label={`Notificar por ${c.label}`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
                            c.checked ? "left-[22px]" : "left-0.5"
                          }`}
                        />
                      </button>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-[#660099]/10 bg-white/60 px-6 py-4">
              <button
                disabled={!selectedPlan || (!notifyEmail && !notifyWhats && !notifySms)}
                onClick={() => {
                  const p = plans.find((x) => x.id === selectedPlan);
                  const canais = [
                    notifyEmail && "e-mail",
                    notifyWhats && "WhatsApp",
                    notifySms && "SMS",
                  ].filter(Boolean).join(", ");
                  console.log("Upgrade notification channels:", { email: notifyEmail, whatsapp: notifyWhats, sms: notifySms, plan: p?.nome });
                  setUpgradeOpen(false);
                  setSelectedPlan(null);
                  showToast(`Upgrade solicitado: ${p?.nome}. Confirmação enviada via ${canais}.`);
                }}
                className="group relative w-full overflow-hidden rounded-xl py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                style={{
                  background: "linear-gradient(135deg, #660099 0%, #7a00b3 100%)",
                  boxShadow:
                    "0 8px 20px -6px rgba(102,0,153,0.50), 0 2px 6px rgba(102,0,153,0.30), inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
              >
                <span className="relative z-10">Confirmar upgrade</span>
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0))",
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      )}


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
              <span className="font-semibold text-[#660099]">{cycleLabel}</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm Auto-Renewal Modal */}
      {confirmAutoDebit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-fade-in"
          style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          onClick={() => setConfirmAutoDebit(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[480px] overflow-hidden rounded-2xl p-5 sm:p-8 animate-slide-up"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow:
                "0 30px 60px -20px rgba(102,0,153,0.25), 0 18px 40px -15px rgba(0,0,0,0.18)",
            }}
          >

            {/* glow ring top */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[140%] -translate-x-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(102,0,153,0.18), rgba(102,0,153,0))",
              }}
            />

            <div className="relative flex items-center gap-3 sm:gap-4">
              <img
                src={icon3dAutorenew}
                alt="Renovação automática"
                width={56}
                height={56}
                loading="lazy"
                className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 object-contain"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-[17px] sm:text-[20px] font-semibold tracking-tight text-[#1a1a1a] leading-tight whitespace-nowrap">
                  Ativar Renovação Automática
                </h3>
                <p className="mt-0.5 text-xs font-medium text-[#660099]/80">
                  Função premium SmartVoz
                </p>
              </div>
            </div>

            <div className="relative mt-6 space-y-4">
              <p className="text-[14px] leading-relaxed text-[#4a4a4a]">
                Ao ativar a renovação automática, seu plano será renovado todos os meses utilizando o saldo disponível da sua carteira virtual/comissões.
              </p>

              {/* Bônus */}
              <div
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(102,0,153,0.06), rgba(102,0,153,0.02))",
                  border: "1px solid rgba(102,0,153,0.14)",
                  boxShadow:
                    "0 6px 18px -12px rgba(102,0,153,0.30), inset 0 1px 0 rgba(255,255,255,0.6)",
                }}
              >
                <img
                  src={icon3dBonus}
                  alt="Bônus de internet"
                  width={40}
                  height={40}
                  loading="lazy"
                  className="h-10 w-10 shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[#660099] leading-tight">
                    Bônus de internet liberado
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-[#660099]">
                    Seu plano receberá internet extra automaticamente.
                  </p>
                </div>
              </div>

              {/* Alerta */}
              <div
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(220,38,38,0.05), rgba(220,38,38,0.015))",
                  borderLeft: "3px solid #dc2626",
                  border: "1px solid rgba(220,38,38,0.18)",
                  borderLeftWidth: 3,
                }}
              >
                <img
                  src={icon3dAlert}
                  alt="Atenção"
                  width={40}
                  height={40}
                  loading="lazy"
                  className="h-10 w-10 shrink-0 object-contain"
                />
                <p className="text-[12.5px] leading-snug text-[#991b1b] flex-1">
                  <span className="font-semibold">Atenção:</span> após ativar, esta função não poderá ser desativada manualmente.
                </p>
              </div>

              <p className="text-[12px] leading-relaxed text-[#777]">
                Os valores da renovação serão descontados automaticamente do saldo disponível da sua conta.
              </p>
            </div>

            <div className="relative mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmAutoDebit(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#660099] transition hover:bg-[rgba(102,0,153,0.06)]"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(102,0,153,0.35)",
                  backdropFilter: "blur(8px)",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setAutoDebit(true);
                  setConfirmAutoDebit(false);
                  setToast("Renovação automática ativada · +20GB liberados");
                  setTimeout(() => setToast(null), 3000);
                }}
                className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg,#660099,#7a00b3)",
                  boxShadow:
                    "0 10px 28px -8px rgba(102,0,153,0.6), 0 4px 12px -2px rgba(102,0,153,0.4), inset 0 1px 0 rgba(255,255,255,0.35)",
                }}
              >
                Ativar
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-[#333] px-5 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
