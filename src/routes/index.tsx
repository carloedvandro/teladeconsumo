import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import familyImg from "@/assets/family-tablet.jpg";

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
    used: 0.74,
    total: 8,
    plan: "VIVO CONTROLE 5GB II PLN",
    cycleDays: 3,
  },
  {
    number: "(32) 99963-0109",
    used: 1.1,
    total: 8,
    plan: "VIVO CONTROLE 5GB II PLN",
    cycleDays: 3,
  },
];

// Colour scale: green -> yellow -> orange -> red as usage climbs
function ringColor(pct: number) {
  if (pct >= 95) return "#e63329"; // red
  if (pct >= 80) return "#f08a1c"; // orange
  if (pct >= 50) return "#f0c419"; // yellow
  return "#660099"; // vivo purple (low usage like screenshot)
}

function formatGB(gb: number) {
  if (gb < 1) return `${(gb * 1024).toFixed(2)} MB`;
  return `${gb.toFixed(2)} GB`;
}

function ConsumoRing({ line }: { line: Line }) {
  const pct = Math.min(100, (line.used / line.total) * 100);
  const usedPct = Math.round(pct);
  const r = 90;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const color = ringColor(pct);
  const isFull = pct >= 99.5;
  const gradId = useMemo(
    () => `g-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  return (
    <div className="relative h-[220px] w-[220px] shrink-0">
      <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b8d432" />
            <stop offset="50%" stopColor="#f08a1c" />
            <stop offset="100%" stopColor="#e63329" />
          </linearGradient>
        </defs>
        <circle cx="110" cy="110" r={r} fill="none" stroke="#ececec" strokeWidth="10" />
        {pct > 0 && (
          <circle
            cx="110"
            cy="110"
            r={r}
            fill="none"
            stroke={isFull ? `url(#${gradId})` : color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            className="transition-all duration-700 ease-out"
          />
        )}
        {!isFull && pct > 0 && pct < 100 && (
          <circle
            cx="110"
            cy="110"
            r={r}
            fill="none"
            stroke="#b8d432"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${Math.min(dash, 14)} ${c}`}
            strokeDashoffset={-Math.max(0, dash - 14)}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {line.used === 0 ? (
          <>
            <div className="text-[44px] font-light leading-none text-[#222]">0%</div>
            <div className="mt-2 px-2 text-center text-[11px] text-[#666]">
              sem franquia contratada
            </div>
          </>
        ) : (
          <>
            <div className="text-[44px] font-light leading-none text-[#222]">
              {line.used < 1
                ? line.used.toFixed(2)
                : line.used % 1 === 0
                  ? line.used
                  : line.used.toFixed(line.used < 10 ? 1 : 2)}
              <span className="ml-1 text-xl text-[#666]">GB</span>
            </div>
            <div className="mt-2 text-xs text-[#666]">
              consumidos de {line.total} GB
            </div>
            <div className="mt-1 text-[11px] font-semibold" style={{ color }}>
              {usedPct}%
            </div>
          </>
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
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-[560px] overflow-y-auto rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#eee] px-6 py-4">
          <h3 className="text-lg font-semibold text-[#660099]">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-1 text-[#666] hover:bg-[#f3eaf7] hover:text-[#660099]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
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

  const months = [
    { mes: "Janeiro/2023", consumo: line.used, status: "Em andamento" },
    { mes: "Dezembro/2022", consumo: 6.42, status: "Fechado" },
    { mes: "Novembro/2022", consumo: 7.81, status: "Fechado" },
    { mes: "Outubro/2022", consumo: 4.15, status: "Fechado" },
    { mes: "Setembro/2022", consumo: 5.67, status: "Fechado" },
  ];

  const plans = [
    { id: "ctrl10", nome: "Vivo Controle 10GB", giga: "10 GB", preco: "R$ 79,99/mês", bonus: "+ Apps ilimitados" },
    { id: "pos15", nome: "Vivo Pós 15GB", giga: "15 GB", preco: "R$ 99,99/mês", bonus: "+ Disney+ incluso" },
    { id: "pos30", nome: "Vivo Pós 30GB", giga: "30 GB", preco: "R$ 129,99/mês", bonus: "+ Netflix + Disney+" },
    { id: "ili", nome: "Vivo Ilimitado", giga: "Ilimitado", preco: "R$ 189,99/mês", bonus: "+ Todos os streamings" },
  ];

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      {/* Top purple bar */}
      <header className="bg-[#660099] text-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3">
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex w-[260px] items-center justify-between rounded bg-white px-4 py-2 text-left text-[#333] shadow-sm"
            >
              <div>
                <div className="text-[11px] leading-tight text-[#660099]">Vivo Móvel</div>
                <div className="text-sm font-medium leading-tight">{line.number}</div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-[#660099] transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
            {open && (
              <ul className="absolute z-20 mt-1 w-[260px] overflow-hidden rounded bg-white text-[#333] shadow-lg">
                {LINES.map((l, i) => (
                  <li key={l.number}>
                    <button
                      onClick={() => {
                        setLineIdx(i);
                        setOpen(false);
                      }}
                      className={`flex w-full flex-col px-4 py-2 text-left hover:bg-[#f3eaf7] ${
                        i === lineIdx ? "bg-[#f3eaf7]" : ""
                      }`}
                    >
                      <span className="text-[11px] text-[#660099]">Vivo Móvel</span>
                      <span className="text-sm font-medium">{l.number}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav className="flex items-center gap-8">
            <button
              onClick={() => showToast("Aura: Olá Helena! Como posso ajudar?")}
              className="flex items-center gap-2 text-sm"
            >
              <span className="inline-block h-5 w-5 rounded-full border border-white/70 bg-gradient-to-br from-white/30 to-transparent" />
              Pergunte à Aura
            </button>
            <button className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" /> HELENA <ChevronDown className="h-3 w-3" />
            </button>
            <button aria-label="Menu" onClick={() => showToast("Menu aberto")}>
              <Grid3x3 className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 pt-8 pb-16">
        <h1 className="text-[42px] font-light leading-tight text-[#660099]">
          Resumo de Consumo
        </h1>
        <p className="mt-1 text-sm text-[#666]">
          Informação atualizada em{" "}
          <span className="font-semibold text-[#333]">17/01/2023</span> às{" "}
          <span className="font-semibold text-[#333]">12:34</span>
        </p>

        {/* Hero card */}
        <section className="relative mt-6 overflow-hidden rounded-md">
          <img
            src={familyImg}
            alt="Família usando tablet"
            width={1280}
            height={768}
            className="h-[460px] w-full object-cover"
          />

          {/* Consumption panel overlay - centered/right like reference */}
          <div className="absolute right-8 top-1/2 w-[640px] -translate-y-1/2 rounded-md bg-white/95 p-8 shadow-xl backdrop-blur">
            <div className="flex items-center gap-8">
              <ConsumoRing line={line} />

              <div className="flex-1">
                <h2 className="text-[15px] font-semibold tracking-wide text-[#333]">
                  {line.plan}
                </h2>
                <p className="mt-1 text-sm text-[#666]">
                  Fim do ciclo em{" "}
                  <span className="font-semibold text-[#333]">{line.cycleDays} dias</span>
                </p>

                <ul className="mt-5 space-y-3 text-sm">
                  <li className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-[#333]">
                      <span
                        className="inline-block h-3 w-3 rounded-full border-2"
                        style={{ borderColor: color }}
                      />
                      Meu Consumo
                    </span>
                    <span className="text-[#333]">
                      {usedPct}% - {formatGB(line.used)}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-4 border-b border-t border-[#eee] py-3">
                    <span className="flex items-center gap-2 text-[#333]">
                      <span className="inline-block h-3 w-3 rounded-full border-2 border-[#660099]" />
                      Disponíveis
                    </span>
                    <span className="text-[#333]">
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

          <button
            aria-label="Expandir"
            onClick={() => setExpandOpen(true)}
            className="absolute bottom-4 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#660099] shadow hover:bg-white"
          >
            <Plus className="h-5 w-5" />
          </button>
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

        <h2 className="mt-10 text-[32px] font-light text-[#660099]">Meus Créditos</h2>
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
            <div className="rounded-md border border-[#eee] p-3 text-center">
              <Wifi className="mx-auto h-5 w-5 text-[#660099]" />
              <div className="mt-1 text-xs text-[#666]">Dados</div>
              <div className="text-sm font-semibold text-[#333]">
                {formatGB(line.used)}
              </div>
            </div>
            <div className="rounded-md border border-[#eee] p-3 text-center">
              <Phone className="mx-auto h-5 w-5 text-[#660099]" />
              <div className="mt-1 text-xs text-[#666]">Minutos</div>
              <div className="text-sm font-semibold text-[#333]">Ilimitado</div>
            </div>
            <div className="rounded-md border border-[#eee] p-3 text-center">
              <MessageSquare className="mx-auto h-5 w-5 text-[#660099]" />
              <div className="mt-1 text-xs text-[#666]">SMS</div>
              <div className="text-sm font-semibold text-[#333]">Ilimitado</div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-[#333]">
              Histórico mensal
            </div>
            <ul className="divide-y divide-[#eee] rounded-md border border-[#eee]">
              {months.map((m) => (
                <li
                  key={m.mes}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <div>
                    <div className="text-[#333]">{m.mes}</div>
                    <div className="text-xs text-[#888]">{m.status}</div>
                  </div>
                  <div className="font-semibold text-[#660099]">
                    {formatGB(m.consumo)}
                  </div>
                </li>
              ))}
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
        <button
          disabled={!selectedPlan}
          onClick={() => {
            const p = plans.find((x) => x.id === selectedPlan);
            setUpgradeOpen(false);
            setSelectedPlan(null);
            showToast(`Upgrade solicitado: ${p?.nome}. Você receberá um SMS de confirmação.`);
          }}
          className="mt-5 w-full rounded-md bg-[#660099] py-3 text-sm font-semibold text-white transition hover:bg-[#520077] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirmar upgrade
        </button>
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
              <span className="font-semibold text-[#333]">{line.plan}</span>
            </div>
            <div className="flex justify-between border-b border-[#eee] pb-2">
              <span className="text-[#666]">Linha</span>
              <span className="font-semibold text-[#333]">{line.number}</span>
            </div>
            <div className="flex justify-between border-b border-[#eee] pb-2">
              <span className="text-[#666]">Consumido</span>
              <span className="font-semibold text-[#333]">{formatGB(line.used)}</span>
            </div>
            <div className="flex justify-between border-b border-[#eee] pb-2">
              <span className="text-[#666]">Disponível</span>
              <span className="font-semibold text-[#333]">{formatGB(available)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666]">Fim do ciclo</span>
              <span className="font-semibold text-[#333]">em {line.cycleDays} dias</span>
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
