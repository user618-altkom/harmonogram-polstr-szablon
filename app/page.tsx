// Strona główna. Tu wchodzi ekran z Claude Design.
//
// Jak wkleić eksport z Claude Design (KARTA.md, tor równoległy):
// 1. W Claude Design wyeksportuj ekran jako komponent React z Tailwind, jeden plik, bez bibliotek UI.
// 2. Zastąp całą zawartość tego pliku wklejonym kodem.
// 3. Dopisz w pierwszej linii dyrektywę 'use client' (komponent trzyma stan formularza i robi fetch w przeglądarce).
// 4. Komponent ma być domyślnym eksportem: export default function Strona() { ... }.
// 5. Dane pobieraj przez fetch('/api/harmonogram?kwota=...&liczbaRat=...'), odpowiedź to JSON z tabelą rat.
// Podpięcie komponentu do route handlera robi agent w fazie 4.

"use client";
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

// ---------- typy ----------

export type Wskaznik = "POLSTR_1M" | "WIBOR_3M";
export type TypRat = "rowne" | "malejace";
export type TrybNadplaty = "obnizRate" | "skrocOkres";

export interface Rata {
  nr: number;
  data: string; // YYYY-MM-DD
  kapital: number;
  odsetki: number;
  rata: number;
  saldo: number;
}

export interface HarmonogramResponse {
  rataPierwszaGr: number;
  rataOstatniaGr: number;
  sumaOdsetekGr: number;
  raty: Rata[];
}

interface OdpowiedzApi {
  rataPierwszaGr: number;
  rataOstatniaGr: number;
  sumaOdsetekGr: number;
  raty: Array<{
    numer: number;
    data: string;
    kapitalGr: number;
    odsetkiGr: number;
    rataGr: number;
    saldoPoSplacieGr: number;
  }>;
}

export interface NadplataForm {
  id: number;
  miesiac: string;
  kwota: string;
  tryb: TrybNadplaty;
}

interface FormState {
  kwota: string;
  liczbaRat: string;
  pierwszaRata: string;
  marza: string;
  wskaznik: Wskaznik;
  typRat: TypRat;
  nadplaty: NadplataForm[];
}

type Errors = Partial<Record<string, string>>;

function jestOdpowiedzApi(dane: unknown): dane is OdpowiedzApi {
  if (!dane || typeof dane !== "object") return false;
  const odpowiedz = dane as Record<string, unknown>;
  return Number.isInteger(odpowiedz.rataPierwszaGr)
    && Number.isInteger(odpowiedz.rataOstatniaGr)
    && Number.isInteger(odpowiedz.sumaOdsetekGr)
    && Array.isArray(odpowiedz.raty)
    && odpowiedz.raty.every((rata) => {
      if (!rata || typeof rata !== "object") return false;
      const rekord = rata as Record<string, unknown>;
      return Number.isInteger(rekord.numer)
        && typeof rekord.data === "string"
        && Number.isInteger(rekord.kapitalGr)
        && Number.isInteger(rekord.odsetkiGr)
        && Number.isInteger(rekord.rataGr)
        && Number.isInteger(rekord.saldoPoSplacieGr);
    });
}

export interface KalkulatorHarmonogramuProps {
  /** Adres endpointu harmonogramu. Domyślnie "/api/harmonogram". */
  endpoint?: string;
}

/*
 * Kalkulator harmonogramu spłat kredytu hipotecznego (widok doradcy w oddziale).
 *
 * Odpowiedź GET /api/harmonogram: typ HarmonogramResponse poniżej.
 * Kwoty odpowiedzi API są w groszach i są konwertowane do złotych przed
 * przekazaniem do tabeli widoku.
 */

const WSKAZNIKI: { value: Wskaznik; label: string }[] = [
  { value: "POLSTR_1M", label: "POLSTR 1M" },
  { value: "WIBOR_3M", label: "WIBOR 3M" },
];

const TRYBY_NADPLATY: { value: TrybNadplaty; label: string }[] = [
  { value: "obnizRate", label: "Obniż ratę" },
  { value: "skrocOkres", label: "Skróć okres" },
];

// ---------- formatowanie i parsowanie ----------

// Własny formatter: Intl pl-PL nie grupuje liczb 4-cyfrowych (1234,56), a wymagany jest separator tysięcy zawsze.
export function formatKwota(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "–";
  const cents = Math.round(Math.abs(n) * 100);
  const intPart = Math.floor(cents / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const frac = String(cents % 100).padStart(2, "0");
  return `${n < 0 && cents !== 0 ? "−" : ""}${intPart},${frac}`;
}

// Do CSV: przecinek dziesiętny, bez separatora tysięcy – Excel w polskich ustawieniach czyta to jako liczbę.
function formatCsvLiczba(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2).replace(".", ",") : "";
}

function parseLiczba(text: unknown): number {
  if (typeof text !== "string") return NaN;
  const clean = text.replace(/[\s ]/g, "").replace(",", ".");
  if (clean === "" || !/^-?\d*\.?\d*$/.test(clean)) return NaN;
  return Number(clean);
}

function formatData(iso: string | undefined): string {
  if (!iso) return "–";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return y && m && d ? `${d}.${m}.${y}` : String(iso);
}

function pierwszyDzienNastepnegoMiesiaca(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-01`;
}

let nextId = 1;
const nowaNadplata = (): NadplataForm => ({ id: nextId++, miesiac: "", kwota: "", tryb: "obnizRate" });

// ---------- walidacja ----------

function waliduj(form: FormState): Errors {
  const errors: Errors = {};
  const kwota = parseLiczba(form.kwota);
  const liczbaRat = Number(form.liczbaRat);
  const marza = parseLiczba(form.marza);

  if (!(kwota > 0)) errors.kwota = "Podaj kwotę większą od zera.";
  if (!Number.isInteger(liczbaRat) || liczbaRat < 1 || liczbaRat > 420)
    errors.liczbaRat = "Liczba rat: liczba całkowita 1–420.";
  if (!form.pierwszaRata) errors.pierwszaRata = "Wybierz datę pierwszej raty.";
  if (!Number.isFinite(marza) || marza < 0 || marza > 20) errors.marza = "Marża: 0–20 pp.";

  form.nadplaty.forEach((n) => {
    const m = Number(n.miesiac);
    const k = parseLiczba(n.kwota);
    const msg: string[] = [];
    if (!Number.isInteger(m) || m < 1 || (Number.isInteger(liczbaRat) && m > liczbaRat))
      msg.push("miesiąc spoza zakresu rat");
    if (!(k > 0)) msg.push("kwota musi być dodatnia");
    if (msg.length) errors[`nadplata-${n.id}`] = msg.join(", ");
  });

  return errors;
}

// ---------- komponent ----------

export function KalkulatorHarmonogramu({ endpoint = "/api/harmonogram" }: KalkulatorHarmonogramuProps) {
  const [form, setForm] = useState<FormState>({
    kwota: "",
    liczbaRat: "360",
    pierwszaRata: pierwszyDzienNastepnegoMiesiaca(),
    marza: "",
    wskaznik: "POLSTR_1M",
    typRat: "rowne",
    nadplaty: [],
  });
  const [errors, setErrors] = useState<Errors>({});
  const [wynik, setWynik] = useState<HarmonogramResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const set =
    <K extends "kwota" | "liczbaRat" | "pierwszaRata" | "marza" | "wskaznik" | "typRat">(field: K) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value as FormState[K] }));

  const setNadplata = <K extends "miesiac" | "kwota" | "tryb">(id: number, field: K, value: NadplataForm[K]) =>
    setForm((f) => ({
      ...f,
      nadplaty: f.nadplaty.map((n) => (n.id === id ? { ...n, [field]: value } : n)),
    }));

  const dodajNadplate = () => setForm((f) => ({ ...f, nadplaty: [...f.nadplaty, nowaNadplata()] }));
  const usunNadplate = (id: number) =>
    setForm((f) => ({ ...f, nadplaty: f.nadplaty.filter((n) => n.id !== id) }));

  async function policz(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = waliduj(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const params = new URLSearchParams({
      kwota: String(parseLiczba(form.kwota)),
      liczbaRat: String(Number(form.liczbaRat)),
      marza: String(parseLiczba(form.marza)),
      wskaznik: form.wskaznik,
      typRat: form.typRat,
      pierwszaRata: form.pierwszaRata,
    });
    // Nadpłaty nie są w specyfikacji API – wysyłane tylko gdy są, jako JSON w parametrze "nadplaty".
    if (form.nadplaty.length) {
      params.set(
        "nadplaty",
        JSON.stringify(
          form.nadplaty.map((n) => ({
            miesiac: Number(n.miesiac),
            kwota: parseLiczba(n.kwota),
            tryb: n.tryb,
          }))
        )
      );
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setApiError("");
    try {
      const res = await fetch(`${endpoint}?${params.toString()}`, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!res.ok) {
        let msg = `Błąd serwera (${res.status}).`;
        try {
          const body: unknown = await res.json();
          if (body && typeof body === "object" && "blad" in body && typeof body.blad === "string")
            msg = body.blad;
        } catch {
          /* brak treści JSON */
        }
        throw new Error(msg);
      }
      const data: unknown = await res.json();
      if (!jestOdpowiedzApi(data)) throw new Error("Nieprawidłowa odpowiedź serwera.");
      setWynik({
        rataPierwszaGr: data.rataPierwszaGr,
        rataOstatniaGr: data.rataOstatniaGr,
        sumaOdsetekGr: data.sumaOdsetekGr,
        raty: data.raty.map((rata) => ({
          nr: rata.numer,
          data: rata.data,
          kapital: rata.kapitalGr / 100,
          odsetki: rata.odsetkiGr / 100,
          rata: rata.rataGr / 100,
          saldo: rata.saldoPoSplacieGr / 100,
        })),
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setWynik(null);
      setApiError(err instanceof Error && err.message ? err.message : "Nie udało się pobrać harmonogramu.");
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }

  const podsumowanie = useMemo(() => {
    if (!wynik) return null;
    const raty = wynik.raty;
    return {
      rataPierwsza: wynik.rataPierwszaGr / 100,
      rataOstatnia: wynik.rataOstatniaGr / 100,
      sumaOdsetek: wynik.sumaOdsetekGr / 100,
      liczbaRat: raty.length,
    };
  }, [wynik]);

  function eksportCsv() {
    if (!wynik) return;
    const naglowek = ["Nr", "Data", "Kapitał", "Odsetki", "Rata", "Saldo"];
    const wiersze = wynik.raty.map((r): (string | number)[] => [
      r.nr,
      formatData(r.data),
      formatCsvLiczba(r.kapital),
      formatCsvLiczba(r.odsetki),
      formatCsvLiczba(r.rata),
      formatCsvLiczba(r.saldo),
    ]);
    const csv = [naglowek, ...wiersze].map((w) => w.join(";")).join("\r\n");
    // BOM, żeby Excel poprawnie odczytał polskie znaki w UTF-8.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `harmonogram_${form.pierwszaRata || "kredyt"}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const inputCls = (err?: string) =>
    `w-full rounded-md border px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 ${
      err ? "border-red-600" : "border-slate-300"
    }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Harmonogram spłat kredytu hipotecznego</h1>
        <p className="mt-1 text-sm text-slate-600">
          Symulacja poglądowa. Oprocentowanie = wskaźnik referencyjny + marża.
        </p>

        <form onSubmit={policz} noValidate className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Pole label="Kwota kredytu (PLN)" htmlFor="kwota" error={errors.kwota}>
              <input
                id="kwota"
                inputMode="decimal"
                placeholder="np. 450 000"
                value={form.kwota}
                onChange={set("kwota")}
                className={inputCls(errors.kwota)}
              />
            </Pole>

            <Pole label="Liczba rat" htmlFor="liczbaRat" error={errors.liczbaRat}>
              <input
                id="liczbaRat"
                type="number"
                min="1"
                max="420"
                step="1"
                value={form.liczbaRat}
                onChange={set("liczbaRat")}
                className={inputCls(errors.liczbaRat)}
              />
            </Pole>

            <Pole label="Data pierwszej raty" htmlFor="pierwszaRata" error={errors.pierwszaRata}>
              <input
                id="pierwszaRata"
                type="date"
                value={form.pierwszaRata}
                onChange={set("pierwszaRata")}
                className={inputCls(errors.pierwszaRata)}
              />
            </Pole>

            <Pole label="Marża (pp)" htmlFor="marza" error={errors.marza}>
              <input
                id="marza"
                inputMode="decimal"
                placeholder="np. 1,85"
                value={form.marza}
                onChange={set("marza")}
                className={inputCls(errors.marza)}
              />
            </Pole>

            <Pole label="Wskaźnik referencyjny" htmlFor="wskaznik">
              <select id="wskaznik" value={form.wskaznik} onChange={set("wskaznik")} className={inputCls()}>
                {WSKAZNIKI.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </Pole>

            <fieldset>
              <legend className="mb-1 block text-sm font-medium text-slate-700">Typ rat</legend>
              <div className="flex gap-2">
                {(
                  [
                    { value: "rowne", label: "Równe" },
                    { value: "malejace", label: "Malejące" },
                  ] as { value: TypRat; label: string }[]
                ).map((t) => (
                  <label
                    key={t.value}
                    className={`flex-1 cursor-pointer rounded-md border px-3 py-2 text-center text-sm ${
                      form.typRat === t.value
                        ? "border-slate-800 bg-slate-800 text-white"
                        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="typRat"
                      value={t.value}
                      checked={form.typRat === t.value}
                      onChange={set("typRat")}
                      className="sr-only"
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Nadpłaty */}
          <div className="mt-6 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Nadpłaty</h2>
              <button
                type="button"
                onClick={dodajNadplate}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
              >
                + Dodaj nadpłatę
              </button>
            </div>

            {form.nadplaty.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Brak nadpłat.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {form.nadplaty.map((n) => {
                  const err = errors[`nadplata-${n.id}`];
                  return (
                    <li key={n.id}>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[8rem_1fr_12rem_auto] sm:items-center">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Nr raty"
                          aria-label="Miesiąc (numer raty)"
                          value={n.miesiac}
                          onChange={(e) => setNadplata(n.id, "miesiac", e.target.value)}
                          className={inputCls(err)}
                        />
                        <input
                          inputMode="decimal"
                          placeholder="Kwota (PLN)"
                          aria-label="Kwota nadpłaty"
                          value={n.kwota}
                          onChange={(e) => setNadplata(n.id, "kwota", e.target.value)}
                          className={inputCls(err)}
                        />
                        <select
                          aria-label="Tryb nadpłaty"
                          value={n.tryb}
                          onChange={(e) => setNadplata(n.id, "tryb", e.target.value as TrybNadplaty)}
                          className={inputCls()}
                        >
                          {TRYBY_NADPLATY.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => usunNadplate(n.id)}
                          className="rounded-md px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                          Usuń
                        </button>
                      </div>
                      {err && <p className="mt-1 text-xs text-red-700">{err}</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {loading ? "Liczę…" : "Policz"}
            </button>
            {apiError && (
              <p role="alert" className="text-sm text-red-700">
                {apiError}
              </p>
            )}
          </div>
        </form>

        {wynik && podsumowanie && (
          <section className="mt-8" aria-live="polite">
            <div className="grid gap-4 sm:grid-cols-3">
              <Kafel etykieta="Pierwsza rata" wartosc={podsumowanie.rataPierwsza} />
              <Kafel etykieta="Ostatnia rata" wartosc={podsumowanie.rataOstatnia} />
              <Kafel etykieta="Suma odsetek" wartosc={podsumowanie.sumaOdsetek} />
            </div>

            <div className="mt-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tabela rat ({podsumowanie.liczbaRat})</h2>
              <button
                type="button"
                onClick={eksportCsv}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100"
              >
                Eksport CSV
              </button>
            </div>

            <div className="mt-3 max-h-[32rem] overflow-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-100 text-slate-700">
                  <tr>
                    {["Nr", "Data", "Kapitał", "Odsetki", "Rata", "Saldo"].map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={`px-3 py-2 font-medium ${i < 2 ? "text-left" : "text-right"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {wynik.raty.map((r) => (
                    <tr key={r.nr} className="border-t border-slate-100 even:bg-slate-50">
                      <td className="px-3 py-1.5">{r.nr}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">{formatData(r.data)}</td>
                      <td className="px-3 py-1.5 text-right whitespace-nowrap">{formatKwota(r.kapital)}</td>
                      <td className="px-3 py-1.5 text-right whitespace-nowrap">{formatKwota(r.odsetki)}</td>
                      <td className="px-3 py-1.5 text-right whitespace-nowrap font-medium">{formatKwota(r.rata)}</td>
                      <td className="px-3 py-1.5 text-right whitespace-nowrap">{formatKwota(r.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Pole({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

function Kafel({ etykieta, wartosc }: { etykieta: string; wartosc: number | undefined }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-sm text-slate-600">{etykieta}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">
        {formatKwota(wartosc)} <span className="text-base font-normal text-slate-500">PLN</span>
      </div>
    </div>
  );
}

export default KalkulatorHarmonogramu;
