import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, User, Grid3x3, FileText, ChevronRight, Plus } from "lucide-react";
import familyImg from "@/assets/family-tablet.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Resumo de Consumo | Vivo" },
      { name: "description", content: "Acompanhe seu consumo de dados Vivo Móvel em tempo real." },
    ],
  }),
  component: ResumoConsumo,
});

const LINES = [
  { number: "(31) 97115-7584", used: 8, total: 8 },
  { number: "(32) 99963-0109", used: 1.1, total: 8 },
];

function ResumoConsumo() {
  const [lineIdx, setLineIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const line = LINES[lineIdx];
  const pct = Math.min(100, (line.used / line.total) * 100);
  const available = +(line.total - line.used).toFixed(2);
  const availPct = +(100 - pct).toFixed(0);
  const usedPct = +pct.toFixed(0);

  // SVG circle math
  const r = 90;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  // color: green when low, gradient red/orange when full
  const isFull = pct >= 99;
  const gradId = useMemo(() => `g-${lineIdx}`, [lineIdx]);

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      {/* Top purple bar */}
      <header className="bg-[#660099] text-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3">
          {/* Line selector */}
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex w-[260px] items-center justify-between rounded bg-white px-4 py-2 text-left text-[#333] shadow-sm"
            >
              <div>
                <div className="text-[11px] leading-tight text-[#660099]">Vivo Móvel</div>
                <div className="text-sm font-medium leading-tight">{line.number}</div>
              </div>
              <ChevronDown className={`h-4 w-4 text-[#660099] transition-transform ${open ? "rotate-180" : ""}`} />
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
            <button className="flex items-center gap-2 text-sm">
              <span className="inline-block h-5 w-5 rounded-full border border-white/70 bg-gradient-to-br from-white/30 to-transparent" />
              Pergunte à Aura
            </button>
            <button className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" /> HELENA <ChevronDown className="h-3 w-3" />
            </button>
            <button aria-label="Menu">
              <Grid3x3 className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 pt-8 pb-16">
        <h1 className="text-[42px] font-light leading-tight text-[#660099]">Resumo de Consumo</h1>
        <p className="mt-1 text-sm text-[#666]">
          Informação atualizada em <span className="font-semibold text-[#333]">17/01/2023</span> às{" "}
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

          {/* Consumption panel overlay */}
          <div className="absolute right-8 top-1/2 w-[640px] -translate-y-1/2 rounded-md bg-white/95 p-8 shadow-xl backdrop-blur">
            <div className="flex items-center gap-8">
              {/* Ring */}
              <div className="relative h-[220px] w-[220px] shrink-0">
                <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90">
                  <defs>
                    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e63329" />
                      <stop offset="50%" stopColor="#f08a1c" />
                      <stop offset="100%" stopColor="#b8d432" />
                    </linearGradient>
                  </defs>
                  {/* track */}
                  <circle
                    cx="110"
                    cy="110"
                    r={r}
                    fill="none"
                    stroke="#ececec"
                    strokeWidth="10"
                  />
                  {/* progress */}
                  <circle
                    cx="110"
                    cy="110"
                    r={r}
                    fill="none"
                    stroke={isFull ? `url(#${gradId})` : "#660099"}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${c}`}
                    className="transition-all duration-700 ease-out"
                  />
                  {/* green accent tip when not full */}
                  {!isFull && (
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
                  <div className="text-[44px] font-light leading-none text-[#222]">
                    {line.used % 1 === 0 ? line.used : line.used.toFixed(1)}
                    <span className="ml-1 text-xl text-[#666]">GB</span>
                  </div>
                  <div className="mt-2 text-xs text-[#666]">consumidos de {line.total} GB</div>
                </div>
              </div>

              {/* Right details */}
              <div className="flex-1">
                <h2 className="text-[15px] font-semibold tracking-wide text-[#333]">
                  VIVO CONTROLE 5GB II PLN
                </h2>
                <p className="mt-1 text-sm text-[#666]">
                  Fim do ciclo em <span className="font-semibold text-[#333]">3 dias</span>
                </p>

                <ul className="mt-5 space-y-3 text-sm">
                  <li className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-[#333]">
                      <span className="inline-block h-3 w-3 rounded-full border-2 border-[#f08a1c]" />
                      Meu Consumo
                    </span>
                    <span className="text-[#333]">
                      {usedPct}% - {line.used.toFixed(2)} GB
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-4 border-b border-[#eee] pb-3">
                    <span className="flex items-center gap-2 text-[#333]">
                      <span className="inline-block h-3 w-3 rounded-full border-2 border-[#660099]" />
                      Disponíveis
                    </span>
                    <span className="text-[#333]">
                      {availPct}% - {available.toFixed(2)} GB
                    </span>
                  </li>
                </ul>

                <button className="mt-4 text-sm font-semibold text-[#660099] hover:underline">
                  Ver detalhes do seu consumo &gt;
                </button>
              </div>
            </div>
          </div>

          <button
            aria-label="Expandir"
            className="absolute bottom-4 right-6 flex h-7 w-7 items-center justify-center rounded-full text-[#660099]"
          >
            <Plus className="h-5 w-5" />
          </button>
        </section>

        {/* Upgrade card */}
        <button className="mt-4 flex w-full items-center justify-between rounded-md bg-white px-6 py-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center gap-4">
            <FileText className="h-7 w-7 text-[#660099]" />
            <div className="text-left">
              <div className="text-[15px] font-semibold text-[#333]">
                Quer falar e navegar ainda mais?
              </div>
              <div className="text-sm text-[#666]">Faça um upgrade no seu plano agora</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[#660099]" />
        </button>

        <h2 className="mt-10 text-[32px] font-light text-[#660099]">Meus Créditos</h2>
      </main>
    </div>
  );
}
