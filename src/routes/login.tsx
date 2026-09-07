import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { User, Lock, Eye, EyeOff, ChevronRight } from "lucide-react";

import familyImgAsset from "@/assets/woman-phone.png.asset.json";

const familyImg = familyImgAsset.url;

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar na conta — Resumo de Consumo" },
      {
        name: "description",
        content:
          "Acesse sua conta para consultar franquia, consumo de dados e status da linha.",
      },
      { property: "og:title", content: "Entrar na conta — Resumo de Consumo" },
      {
        property: "og:description",
        content:
          "Acesse sua conta para consultar franquia, consumo de dados e status da linha.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      <main className="mx-auto max-w-[1400px] px-2 pt-6 pb-16 md:px-6 md:pt-8">
        <h1 className="text-[32px] font-semibold leading-tight text-[#660099] md:text-[42px]">
          Acesse sua conta
        </h1>
        <p className="mt-1 text-sm text-[#666]">
          Entre para acompanhar seu{" "}
          <span className="font-semibold text-[#333]">consumo</span> e o{" "}
          <span className="font-semibold text-[#333]">status da linha</span>.
        </p>

        <section className="relative mt-6 overflow-hidden rounded-md">
          <img
            src={familyImg}
            alt="Cliente utilizando o celular"
            width={1280}
            height={768}
            className="h-[360px] w-full object-cover object-[60%_20%] md:h-[520px]"
          />

          <div
            className="relative -mt-24 overflow-hidden rounded-md p-3 pb-8 md:absolute md:right-10 md:top-10 md:mx-0 md:mt-0 md:w-[480px] md:px-9 md:py-6 md:pb-9"
            style={{
              background: "rgba(255,255,255,0.74)",
              backdropFilter: "blur(6px)",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.45)",
            }}
          >
            <h2 className="text-[18px] font-semibold text-[#660099]">Login</h2>
            <p className="mt-1 text-sm text-[#5a5a5a]">
              Use seu número ou e-mail cadastrado.
            </p>

            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <label className="block">
                <span className="text-[13px] font-semibold text-[#1a1a1a]">
                  Número ou e-mail
                </span>
                <div className="mt-1.5 flex items-center gap-2 rounded-md bg-white/70 px-3 py-2.5 ring-1 ring-[#00000014] focus-within:ring-2 focus-within:ring-[#660099]/40">
                  <User className="h-4 w-4 shrink-0 text-[#660099]" />
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-9999"
                    className="w-full bg-transparent text-sm text-[#1a1a1a] outline-none placeholder:text-[#a0a0a6]"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-[13px] font-semibold text-[#1a1a1a]">
                  Senha
                </span>
                <div className="mt-1.5 flex items-center gap-2 rounded-md bg-white/70 px-3 py-2.5 ring-1 ring-[#00000014] focus-within:ring-2 focus-within:ring-[#660099]/40">
                  <Lock className="h-4 w-4 shrink-0 text-[#660099]" />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm text-[#1a1a1a] outline-none placeholder:text-[#a0a0a6]"
                  />
                  <button
                    type="button"
                    aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowPass((v) => !v)}
                    className="text-[#8a8a90] transition-colors hover:text-[#660099]"
                  >
                    {showPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between text-[13px]">
                <label className="flex items-center gap-2 text-[#5a5a5a]">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-[#660099]"
                  />
                  Lembrar de mim
                </label>
                <button
                  type="button"
                  className="font-semibold text-[#660099] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[#660099] px-4 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.01]"
              >
                Entrar
                <ChevronRight className="h-4 w-4" />
              </button>

              {sent && (
                <p className="rounded-md bg-[#16a34a]/12 px-3 py-2 text-[13px] font-semibold text-[#15803d]">
                  Exemplo de login: nenhum dado foi enviado.
                </p>
              )}
            </form>

            <p className="mt-4 text-center text-[13px] text-[#5a5a5a]">
              Ainda não tem cadastro?{" "}
              <button className="font-semibold text-[#660099] hover:underline">
                Criar conta
              </button>
            </p>
          </div>
        </section>

        <div className="mt-6">
          <Link
            to="/"
            className="text-sm font-semibold text-[#660099] hover:underline"
          >
            ← Voltar para o Resumo de Consumo
          </Link>
        </div>
      </main>
    </div>
  );
}
