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
const familyImg = familyImgAsset.url;

const PRELOAD_ICONS = [
  icon3dData,
  icon3dPhone,
  icon3dSms,
  icon3dAutorenew,
  icon3dBonus,
  icon3dAlert,
];


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Resumo de Consumo | Vivo" },
      {
        name: "description",
        content: "Acompanhe seu consumo de dados Vivo Móvel em tempo real.",
      },
    ],
    links: PRELOAD_ICONS.map((href) => ({ rel: "preload", as: "image", href })),
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

// O ciclo fecha todo dia 5 e renova no dia 6.
// Calcula dias até o próximo fechamento (dia 5).
function daysUntilCycleRenewal(closingDay = 5, today = new Date()) {
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  let next = new Date(y, m, closingDay);
  // Depois do fechamento (dia > 5), o próximo fim de ciclo é no mês seguinte.
  if (d > closingDay) next = new Date(y, m + 1, closingDay);
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

function ConsumoRing({
  line,
  bonus = 0,
  bisUsed = 0,
  bisTotal = 0,
}: {
  line: Line;
  bonus?: number;
  bisUsed?: number;
  bisTotal?: number;
}) {
  const pct = Math.min(100, (line.used / line.total) * 100);
  const p = Math.max(0.0001, pct);
  const tip = tipColor(pct);
  const bisPct =
    bisTotal > 0 ? Math.min(100, (bisUsed / bisTotal) * 100) : 0;

  // SVG-based ring for crisp rendering at any zoom level.
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 90;
  const strokeW = 10;
  const circ = 2 * Math.PI * r;

  // Inner Vivo Bis ring (green) — only renders when franquia hit 100%.
  const rBis = 74;
  const strokeBis = 6;
  const circBis = 2 * Math.PI * rBis;

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

        {/* Inner Vivo Bis ring (only when franquia at 100% and há bônus) */}
        {pct >= 100 && bisTotal > 0 && (
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            <circle
              cx={cx}
              cy={cy}
              r={rBis}
              fill="none"
              stroke="rgba(126,200,50,0.18)"
              strokeWidth={strokeBis}
            />
            <circle
              cx={cx}
              cy={cy}
              r={rBis}
              fill="none"
              stroke="#7ec832"
              strokeWidth={strokeBis}
              strokeLinecap="round"
              strokeDasharray={`${(bisPct / 100) * circBis} ${circBis}`}
              style={{ transition: "stroke-dasharray 600ms ease" }}
            />
          </g>
        )}

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
        {pct >= 100 && bisTotal > 0 && (
          <div
            className="mt-1.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              background: "rgba(126,200,50,0.15)",
              color: "#3d7a12",
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
              style={{ background: "#7ec832" }}
            />
            Vivo Bis: {bisUsed.toFixed(2)} / {bisTotal.toFixed(2)} GB
          </div>
        )}
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

const iconPreloadCache = new Map<string, Promise<void>>();

function preloadIcon(src: string) {
  const cached = iconPreloadCache.get(src);
  if (cached) return cached;

  if (typeof window === "undefined") return Promise.resolve();

  const promise = new Promise<void>((resolve) => {
    const img = new window.Image();
    const finish = () => {
      const decoded = img.decode?.();
      if (decoded) {
        decoded.catch(() => undefined).finally(resolve);
      } else {
        resolve();
      }
    };

    img.decoding = "sync";
    img.onload = finish;
    img.onerror = () => resolve();
    img.src = src;

    if (img.complete) finish();
  });

  iconPreloadCache.set(src, promise);
  return promise;
}

function preloadAllIcons() {
  return Promise.all(PRELOAD_ICONS.map(preloadIcon));
}

function ResumoConsumo() {
  const [lineIdx, setLineIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [expandOpen, setExpandOpen] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<"dados" | "minutos" | "sms" | null>("dados");
  const [historyTab, setHistoryTab] = useState<"consumo" | "vivobis">("consumo");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhats, setNotifyWhats] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [autoDebit, setAutoDebit] = useState(false);
  const [confirmAutoDebit, setConfirmAutoDebit] = useState(false);

  useEffect(() => {
    let mounted = true;
    preloadAllIcons().then(() => {
      if (mounted) setIconsReady(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const baseLine = LINES[lineIdx];
  const bonusDebito = autoDebit ? 25 : 0;
  const franquiaTotal = baseLine.total + bonusDebito;

  // Real-time consumption simulation:
  // increments live usage every few seconds so the ring updates in tempo real.
  // Ao atingir 100% da franquia, o excedente é debitado do Vivo Bis do mês anterior.
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const consumoAnterior = [
    20.9, 16.3, 25.1, 18.7, 22.4, 19.3,
    23.8, 19.5, 21.2, 17.4, 24.1, 15.6,
  ];
  const prevIdx = (currentMonth - 1 + 12) % 12;
  const sobrouAnterior = Math.max(
    0,
    franquiaTotal - consumoAnterior[prevIdx],
  );

  const [simExtra, setSimExtra] = useState(0);
  useEffect(() => {
    // Reset simulation whenever the base usage or franquia mudam.
    setSimExtra(0);
  }, [baseLine.used, franquiaTotal]);
  useEffect(() => {
    const maxExtra = Math.max(
      0,
      franquiaTotal + sobrouAnterior - baseLine.used,
    );
    if (simExtra >= maxExtra) return;
    const id = window.setInterval(() => {
      setSimExtra((prev) => {
        const next = +(prev + 0.05).toFixed(2);
        return next >= maxExtra ? maxExtra : next;
      });
    }, 4000);
    return () => window.clearInterval(id);
  }, [simExtra, franquiaTotal, sobrouAnterior, baseLine.used]);

  const rawUsed = +(baseLine.used + simExtra).toFixed(2);
  const liveUsed = Math.min(rawUsed, franquiaTotal + sobrouAnterior);
  const bisUsed = +Math.max(0, liveUsed - franquiaTotal).toFixed(2);
  const usedInFranquia = Math.min(liveUsed, franquiaTotal);

  const line: Line = { ...baseLine, used: usedInFranquia, total: franquiaTotal };
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

  const cycleDaysLeft = daysUntilCycleRenewal(5, now);
  const cycleLabel =
    cycleDaysLeft === 0
      ? "hoje"
      : `em ${cycleDaysLeft} ${cycleDaysLeft === 1 ? "dia" : "dias"}`;


  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  function openAfterIconsReady(openModal: () => void) {
    if (iconsReady) {
      openModal();
      return;
    }

    preloadAllIcons().then(() => {
      setIconsReady(true);
      openModal();
    });
  }

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
          <span suppressHydrationWarning className="font-semibold text-[#333]">{lastUpdatedDate}</span> às{" "}
          <span suppressHydrationWarning className="font-semibold text-[#333]">{lastUpdatedTime}</span>

        </p>


        {/* Hero card */}
        <section className="relative mt-6 overflow-hidden rounded-md">
          <img
            src={familyImg}
            alt="Família usando tablet"
            width={1280}
            height={768}
            className="h-[340px] w-full object-cover md:h-[520px]"
          />

          {/* Consumption panel overlay - centered/right like reference */}
          <div
            className="relative -mt-24 overflow-hidden rounded-md p-5 pb-10 md:absolute md:right-8 md:top-20 md:mx-0 md:mt-0 md:w-[520px] md:translate-y-0 md:p-5 md:pb-8"
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
              onClick={() => openAfterIconsReady(() => setExpandOpen(true))}
              className="group absolute bottom-0 right-0 h-10 w-10 text-[#660099] md:h-12 md:w-12"
              style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
            >
              <span className="absolute inset-0 bg-[#d9d9d9] transition-colors duration-200 group-hover:bg-[#e8e8e8]" />
              <Plus
                className="absolute bottom-1 right-1 h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                strokeWidth={2.75}
              />
            </button>
            <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center md:justify-center md:gap-4">
              <div className="self-center md:-ml-6 md:self-auto"><ConsumoRing line={line} bonus={bonusDebito} bisUsed={bisUsed} bisTotal={sobrouAnterior} /></div>

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
                          Ative e ganhe +25GB de bônus
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
                        openAfterIconsReady(() => setConfirmAutoDebit(true));
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
                  onClick={() => openAfterIconsReady(() => setDetailsOpen(true))}
                  className="mt-4 text-sm font-semibold text-[#660099] hover:underline"
                >
                  Ver detalhes do seu consumo &gt;
                </button>
              </div>
            </div>
          </div>

          {/* Upgrade card - inside hero art, below consumption card */}
          <button
            onClick={() => openAfterIconsReady(() => setUpgradeOpen(true))}
            className="relative mx-2 mt-4 flex w-[calc(100%-1rem)] items-center justify-between rounded-md px-6 py-5 shadow-sm transition hover:shadow-md md:absolute md:bottom-8 md:right-8 md:mx-0 md:mt-0 md:w-[520px]"
            style={{
              background: "rgba(255,255,255,0.74)",
              backdropFilter: "blur(6px)",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.45)",
            }}
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

        </section>


        
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
                    loading="eager" decoding="sync" fetchPriority="high"
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
            {/* Tabs */}
            <div
              className="mb-3 grid grid-cols-2 gap-1 rounded-full p-1"
              style={{
                background: "rgba(102,0,153,0.06)",
                border: "1px solid rgba(102,0,153,0.10)",
              }}
            >
              <button
                type="button"
                onClick={() => setHistoryTab("consumo")}
                className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition"
                style={{
                  background: historyTab === "consumo" ? "#ffffff" : "transparent",
                  color: historyTab === "consumo" ? "#660099" : "#7a5a8f",
                  boxShadow:
                    historyTab === "consumo"
                      ? "0 2px 6px -2px rgba(102,0,153,0.25)"
                      : "none",
                }}
              >
                Meu consumo disponível
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab("vivobis")}
                className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition"
                style={{
                  background: historyTab === "vivobis" ? "#ffffff" : "transparent",
                  color: historyTab === "vivobis" ? "#660099" : "#7a5a8f",
                  boxShadow:
                    historyTab === "vivobis"
                      ? "0 2px 6px -2px rgba(102,0,153,0.25)"
                      : "none",
                }}
              >
                Vivo Bis
              </button>
            </div>

            {historyTab === "consumo" && (
              <>
                <div className="mb-2 text-sm font-semibold text-[#333]">
                  Histórico mensal
                </div>
                <ul className="divide-y divide-[#eee] rounded-md border border-[#eee]">
                  {months
                    .slice()
                    .reverse()
                    .map((m) => {
                      const minutosVals = [820, 645, 712, 538, 690, 756, 623, 589, 701, 534, 678, 612];
                      const smsVals = [42, 31, 58, 24, 37, 45, 29, 51, 33, 48, 27, 40];
                      const i = m.idx;
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
              </>
            )}

            {historyTab === "vivobis" && (
              <>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#333]">
                      Vivo Bis · Internet acumulativa
                    </div>
                    <div className="text-[11px] leading-snug text-[#888]">
                      A internet que sobra do seu plano fica disponível no mês seguinte, por 30 dias.
                    </div>
                  </div>
                </div>




                {/* Visual diagram: como funciona o Vivo Bis */}
                {(() => {
                  const franquia = line.total;
                  const prevIdx = currentMonth - 1;
                  const prevUsado =
                    prevIdx >= 0 ? Math.min(franquia, consumoSimulado[prevIdx]) : 0;
                  const prevSobrou =
                    prevIdx >= 0 ? Math.max(0, franquia - consumoSimulado[prevIdx]) : 0;
                  const prevMesNome =
                    prevIdx >= 0 ? months[prevIdx].mes : "Mês anterior";
                  const curMesNome = months[currentMonth].mes;
                  // Heights proportional to franquia
                  const boxH = 132; // px total for franquia column
                  const sobrouH =
                    franquia > 0 ? (prevSobrou / franquia) * boxH : 0;
                  const usouH = boxH - sobrouH;
                  const bisH = sobrouH; // same GB carried
                  return (
                    <div
                      className="mb-3 rounded-xl border p-3"
                      style={{
                        borderColor: "rgba(102,0,153,0.12)",
                        background:
                          "linear-gradient(135deg, #faf6ff 0%, #f3ecfb 100%)",
                      }}
                    >
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#660099]">
                        Como funciona
                      </div>
                      <div className="flex items-end justify-center gap-6 pt-1">
                        {/* Franquia label */}
                        <div className="flex flex-col items-center justify-end pb-6 text-center">
                          <div className="text-[10px] leading-tight text-[#888]">
                            Franquia<br />mensal
                          </div>
                          <div className="mt-1 text-[13px] font-bold text-[#333]">
                            {formatGB(franquia)}
                          </div>
                        </div>

                        {/* 1º mês */}
                        <div className="flex flex-col items-center">
                          <div
                            className="w-[74px] overflow-hidden rounded-md shadow-sm"
                            style={{ height: boxH }}
                          >
                            {prevSobrou > 0 && (
                              <div
                                className="flex flex-col items-center justify-center text-white"
                                style={{
                                  height: sobrouH,
                                  background:
                                    "linear-gradient(180deg, #8ed14f, #6fb332)",
                                }}
                              >
                                <div className="text-[9px] font-semibold uppercase leading-none">
                                  Sobrou
                                </div>
                                <div className="mt-0.5 text-[12px] font-bold leading-none">
                                  {formatGB(prevSobrou)}
                                </div>
                              </div>
                            )}
                            <div
                              className="flex flex-col items-center justify-center text-white"
                              style={{
                                height: usouH,
                                background:
                                  "linear-gradient(180deg, #7b1fa2, #4a0072)",
                              }}
                            >
                              <div className="text-[9px] font-semibold uppercase leading-none">
                                Usou
                              </div>
                              <div className="mt-0.5 text-[12px] font-bold leading-none">
                                {formatGB(prevUsado)}
                              </div>
                            </div>
                          </div>
                          <div className="mt-1.5 text-[10px] font-medium text-[#888]">
                            {prevMesNome}
                          </div>
                        </div>

                        {/* Arrow */}
                        <div
                          className="pb-8 text-[#660099]"
                          aria-hidden
                          style={{ fontSize: 22, lineHeight: 1 }}
                        >
                          ↷
                        </div>

                        {/* 2º mês */}
                        <div className="flex flex-col items-center">
                          {prevSobrou > 0 && (
                            <div
                              className="mb-0.5 rounded-sm px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white"
                              style={{
                                background:
                                  "linear-gradient(90deg,#660099,#8e24aa)",
                              }}
                            >
                              Vivo Bis
                            </div>
                          )}
                          <div
                            className="w-[74px] overflow-hidden rounded-md shadow-sm"
                            style={{ height: boxH + bisH }}
                          >
                            {prevSobrou > 0 && (
                              <div
                                className="flex flex-col items-center justify-center text-white"
                                style={{
                                  height: bisH,
                                  background:
                                    "linear-gradient(180deg, #8ed14f, #6fb332)",
                                }}
                              >
                                <div className="text-[11px] font-bold leading-none">
                                  {formatGB(prevSobrou)}
                                </div>
                              </div>
                            )}
                            <div
                              className="flex flex-col items-center justify-center text-white"
                              style={{
                                height: boxH,
                                background:
                                  "linear-gradient(180deg, #7b1fa2, #4a0072)",
                              }}
                            >
                              <div className="text-[9px] font-semibold uppercase leading-none">
                                Franquia
                              </div>
                              <div className="mt-0.5 text-[13px] font-bold leading-none">
                                {formatGB(franquia)}
                              </div>
                            </div>
                          </div>
                          <div className="mt-1.5 text-[10px] font-medium text-[#888]">
                            {curMesNome}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-center text-[10px] leading-snug text-[#7a5a8f]">
                        O que sobrou vira <strong>Vivo Bis</strong> e soma à
                        franquia do mês seguinte por 30 dias.
                      </div>
                    </div>
                  );
                })()}

                <div className="mb-2 text-sm font-semibold text-[#333]">
                  Histórico Vivo Bis

                </div>
                <ul className="divide-y divide-[#eee] rounded-md border border-[#eee]">
                  {months
                    .slice()
                    .reverse()
                    .map((m) => {
                      const franquia = line.total;
                      const i = m.idx;
                      const prevIdx = i - 1;
                      const sobrouAnterior =
                        prevIdx >= 0
                          ? Math.max(0, franquia - consumoSimulado[prevIdx])
                          : 0;
                      const consumoMes = consumoSimulado[i];
                      const bisConsumido = Math.max(0, consumoMes - franquia);
                      const bisRestante = Math.max(
                        0,
                        sobrouAnterior - bisConsumido,
                      );
                      const isCurrent = i === currentMonth;

                      let statusLabel: string;
                      let statusBg: string;
                      let statusColor: string;
                      if (sobrouAnterior === 0) {
                        statusLabel = "Sem bônus";
                        statusBg = "rgba(0,0,0,0.05)";
                        statusColor = "#888";
                      } else if (isCurrent) {
                        statusLabel =
                          bisRestante > 0 ? "Disponível" : "Utilizado";
                        statusBg =
                          bisRestante > 0
                            ? "rgba(126,200,50,0.18)"
                            : "rgba(255,122,24,0.15)";
                        statusColor = bisRestante > 0 ? "#3d7a12" : "#b34e00";
                      } else if (bisConsumido >= sobrouAnterior) {
                        statusLabel = "Utilizado";
                        statusBg = "rgba(255,122,24,0.15)";
                        statusColor = "#b34e00";
                      } else {
                        statusLabel = "Expirado";
                        statusBg = "rgba(0,0,0,0.05)";
                        statusColor = "#888";
                      }

                      return (
                        <li
                          key={m.mes}
                          className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <div className="text-[#333]">{m.mes}</div>
                            <div className="text-xs text-[#888]">
                              Sobrou do mês anterior: {formatGB(sobrouAnterior)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{ background: statusBg, color: statusColor }}
                            >
                              {statusLabel}
                            </span>
                            <div className="min-w-[52px] text-right font-semibold text-[#660099]">
                              {formatGB(sobrouAnterior)}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </>
            )}
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
          <ConsumoRing line={line} bisUsed={bisUsed} bisTotal={sobrouAnterior} />
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
                loading="eager" decoding="sync" fetchPriority="high"
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
                  loading="eager" decoding="sync" fetchPriority="high"
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
                  loading="eager" decoding="sync" fetchPriority="high"
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
                  setToast("Renovação automática ativada · +25GB liberados");
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
