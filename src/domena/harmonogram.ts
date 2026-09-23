export type TypRat = 'rowne' | 'malejace';
export type NazwaWskaznika = 'POLSTR_1M' | 'WIBOR_3M';

export interface WpisSerii {
  od: string;
  stopa: number;
}

export interface Nadplata {
  miesiac: number;
  kwotaGr: number;
  tryb: 'obnizRate' | 'skrocOkres';
}

export interface ParametryKredytu {
  /** Kwota kredytu w groszach (liczba całkowita). */
  kwotaGr: number;
  liczbaRat: number;
  /** Marża banku jako ułamek, np. 0.0211 dla 2,11 pp. */
  marza: number;
  typRat: TypRat;
  wskaznik: NazwaWskaznika;
  /** Data pierwszej raty w formacie YYYY-MM-DD. */
  pierwszaRata: string;
  nadplaty?: Nadplata[];
}

export interface Rata {
  numer: number;
  data: string;
  kapitalGr: number;
  nadplataGr: number;
  odsetkiGr: number;
  rataGr: number;
  rekompensataGr: number;
  saldoPoSplacieGr: number;
}

export interface Harmonogram {
  raty: Rata[];
  sumaOdsetekGr: number;
  sumaRekompensatGr: number;
  rataPierwszaGr: number;
  rataOstatniaGr: number;
}

export function zaokraglijGrosze(wartosc: number): number {
  return Math.round(wartosc);
}

function czyRzeczywistaData(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const czesci = data.split('-').map(Number);
  const rok = czesci[0];
  const miesiac = czesci[1];
  const dzien = czesci[2];
  if (rok === undefined || miesiac === undefined || dzien === undefined) return false;
  const dataUtc = new Date(Date.UTC(rok, miesiac - 1, dzien));
  return dataUtc.getUTCFullYear() === rok
    && dataUtc.getUTCMonth() === miesiac - 1
    && dataUtc.getUTCDate() === dzien;
}

function sprawdzParametry(parametry: ParametryKredytu): void {
  if (!Number.isInteger(parametry.kwotaGr) || parametry.kwotaGr <= 0) {
    throw new Error('kwotaGr: dodatnia liczba całkowita groszy');
  }
  if (!Number.isInteger(parametry.liczbaRat) || parametry.liczbaRat <= 0) {
    throw new Error('liczbaRat: dodatnia liczba całkowita');
  }
  if (!Number.isFinite(parametry.marza) || parametry.marza < 0) {
    throw new Error('marza: nieujemna liczba jako ułamek');
  }
  if (!czyRzeczywistaData(parametry.pierwszaRata)) {
    throw new Error('pierwszaRata: rzeczywista data YYYY-MM-DD');
  }
}

function ostatniDzienMiesiaca(rok: number, miesiac: number): number {
  return new Date(Date.UTC(rok, miesiac + 1, 0)).getUTCDate();
}

function dodajMiesiace(data: string, liczbaMiesiecy: number): string {
  const poczatkowa = new Date(`${data}T00:00:00Z`);
  const dzien = poczatkowa.getUTCDate();
  const miesiacDocelowy = poczatkowa.getUTCMonth() + liczbaMiesiecy;
  const rok = poczatkowa.getUTCFullYear() + Math.floor(miesiacDocelowy / 12);
  const miesiac = ((miesiacDocelowy % 12) + 12) % 12;
  const bezpiecznyDzien = Math.min(dzien, ostatniDzienMiesiaca(rok, miesiac));
  return `${rok.toString().padStart(4, '0')}-${(miesiac + 1).toString().padStart(2, '0')}-${bezpiecznyDzien.toString().padStart(2, '0')}`;
}

function rataRowna(saldoGr: number, stopaMiesieczna: number, liczbaRat: number): number {
  if (stopaMiesieczna === 0) return zaokraglijGrosze(saldoGr / liczbaRat);
  const wspolczynnik = (1 + stopaMiesieczna) ** liczbaRat;
  return zaokraglijGrosze(saldoGr * stopaMiesieczna * wspolczynnik / (wspolczynnik - 1));
}

export function rekompensataArt40(
  kwotaGr: number,
  miesiac: number,
  stopaRoczna: number,
): number {
  if (miesiac < 1 || miesiac > 36) return 0;
  return zaokraglijGrosze(Math.min(kwotaGr * 0.03, kwotaGr * stopaRoczna));
}

export function policzHarmonogram(
  parametry: ParametryKredytu,
  seria: WpisSerii[],
): Harmonogram {
  sprawdzParametry(parametry);
  if (seria.length === 0) throw new Error('seria wskaźnika: nie może być pusta');
  const nadplaty = parametry.nadplaty ?? [];
  const nadplatyNaMiesiac = new Map(nadplaty.map((nadplata) => [nadplata.miesiac, nadplata]));
  if (nadplatyNaMiesiac.size !== nadplaty.length) {
    throw new Error('nadplaty: jeden miesiąc może mieć tylko jedną nadpłatę');
  }
  for (const nadplata of nadplaty) {
    if (!Number.isInteger(nadplata.miesiac) || nadplata.miesiac < 1 || nadplata.miesiac > parametry.liczbaRat) {
      throw new Error('nadplata.miesiac: miesiąc w zakresie harmonogramu');
    }
    if (!Number.isInteger(nadplata.kwotaGr) || nadplata.kwotaGr <= 0) {
      throw new Error('nadplata.kwotaGr: dodatnia liczba całkowita groszy');
    }
    if (nadplata.tryb !== 'obnizRate' && nadplata.tryb !== 'skrocOkres') {
      throw new Error('nadplata.tryb: obnizRate albo skrocOkres');
    }
  }

  let saldoGr = parametry.kwotaGr;
  let sumaOdsetekGr = 0;
  let sumaRekompensatGr = 0;
  let poprzedniaStopaMiesieczna: number | undefined;
  let aktualnaRataGr: number | undefined;
  const raty: Rata[] = [];

  for (let numer = 1; numer <= parametry.liczbaRat; numer += 1) {
    const data = dodajMiesiace(parametry.pierwszaRata, numer - 1);
    const wpis = seria.reduce((wybrany, biezacy) =>
      biezacy.od <= data ? biezacy : wybrany,
    );
    const stopaMiesieczna = (wpis.stopa + parametry.marza) / 12;
    const odsetkiGr = zaokraglijGrosze(saldoGr * stopaMiesieczna);
    const pozostaleRaty = parametry.liczbaRat - numer + 1;
    if (parametry.typRat === 'rowne'
      && (aktualnaRataGr === undefined || poprzedniaStopaMiesieczna !== stopaMiesieczna)) {
      aktualnaRataGr = rataRowna(saldoGr, stopaMiesieczna, pozostaleRaty);
    }
    poprzedniaStopaMiesieczna = stopaMiesieczna;
    const planowanaRataGr = parametry.typRat === 'rowne' && aktualnaRataGr !== undefined
      ? aktualnaRataGr
      : zaokraglijGrosze(saldoGr / pozostaleRaty) + odsetkiGr;
    const kapitalGr = numer === parametry.liczbaRat
      ? saldoGr
      : Math.min(saldoGr, Math.max(0, planowanaRataGr - odsetkiGr));
    const rataGr = kapitalGr + odsetkiGr;
    saldoGr -= kapitalGr;
    const nadplata = nadplatyNaMiesiac.get(numer);
    if (nadplata !== undefined && nadplata.kwotaGr > saldoGr) {
      throw new Error('nadplata.kwotaGr: nie może przekraczać salda');
    }
    const nadplataGr = nadplata?.kwotaGr ?? 0;
    const rekompensataGr = nadplata === undefined
      ? 0
      : rekompensataArt40(nadplataGr, numer, wpis.stopa + parametry.marza);
    saldoGr -= nadplataGr;
    sumaOdsetekGr += odsetkiGr;
    sumaRekompensatGr += rekompensataGr;
    raty.push({
      numer,
      data,
      kapitalGr,
      nadplataGr,
      odsetkiGr,
      rataGr,
      rekompensataGr,
      saldoPoSplacieGr: saldoGr,
    });
    if (nadplata?.tryb === 'obnizRate') aktualnaRataGr = undefined;
    if (saldoGr === 0) break;
  }

  return {
    raty,
    sumaOdsetekGr,
    sumaRekompensatGr,
    rataPierwszaGr: raty[0]?.rataGr ?? 0,
    rataOstatniaGr: raty.at(-1)?.rataGr ?? 0,
  };
}
