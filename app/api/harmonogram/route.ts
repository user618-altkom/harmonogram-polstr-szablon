import { NextResponse } from 'next/server';
import {
  policzHarmonogram,
  type Nadplata,
  type ParametryKredytu,
} from '../../../src/domena/harmonogram';
import { seriaWskaznika } from '../../../src/dane/wskazniki';

// Route handler jest cienki: parsuje parametry z query string, woła domenę, zwraca JSON.
// Żadnych obliczeń finansowych w tym pliku. Przeliczenie jednostek wejścia
// (złote na grosze, punkty procentowe na ułamek) to część parsowania kontraktu API.

const PRZYKLAD =
  '/api/harmonogram?kwota=400000&liczbaRat=300&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01';

function parsujParametry(szukane: URLSearchParams): ParametryKredytu | string {
  const kwota = Number(szukane.get('kwota'));
  const liczbaRat = Number(szukane.get('liczbaRat'));
  const marza = Number(szukane.get('marza'));
  const wskaznik = szukane.get('wskaznik');
  const typRat = szukane.get('typRat');
  const pierwszaRata = szukane.get('pierwszaRata') ?? '';
  const nadplatyTekst = szukane.get('nadplaty');

  if (!Number.isFinite(kwota) || kwota <= 0 || !Number.isInteger(Math.round(kwota * 100))) return 'kwota: liczba dodatnia w złotych, np. 400000';
  if (!Number.isInteger(liczbaRat) || liczbaRat <= 0) return 'liczbaRat: liczba całkowita dodatnia, np. 300';
  if (!Number.isFinite(marza) || marza < 0) return 'marza: punkty procentowe, np. 2.11';
  if (wskaznik !== 'POLSTR_1M' && wskaznik !== 'WIBOR_3M') return 'wskaznik: POLSTR_1M albo WIBOR_3M';
  if (typRat !== 'rowne' && typRat !== 'malejace') return 'typRat: rowne albo malejace';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pierwszaRata)) return 'pierwszaRata: data YYYY-MM-DD';

  let nadplaty = undefined;
  if (nadplatyTekst !== null) {
    try {
      const wartosc: unknown = JSON.parse(nadplatyTekst);
      if (!Array.isArray(wartosc)) return 'nadplaty: tablica obiektów';
      nadplaty = wartosc.map((nadplata): Nadplata => {
        if (!nadplata || typeof nadplata !== 'object') throw new Error('nadplaty: nieprawidłowy wpis');
        const rekord = nadplata as Record<string, unknown>;
        const kwotaNadplaty = Number(rekord.kwota);
        if (!Number.isFinite(kwotaNadplaty)) throw new Error('nadplaty.kwota: liczba w złotych');
        const tryb = rekord.tryb;
        if (tryb !== 'obnizRate' && tryb !== 'skrocOkres') {
          throw new Error('nadplaty.tryb: obnizRate albo skrocOkres');
        }
        return {
          miesiac: Number(rekord.miesiac),
          kwotaGr: Math.round(kwotaNadplaty * 100),
          tryb,
        };
      });
    } catch (blad) {
      return blad instanceof Error ? blad.message : 'nadplaty: nieprawidłowy JSON';
    }
  }

  return {
    kwotaGr: Math.round(kwota * 100),
    liczbaRat,
    marza: marza / 100,
    wskaznik,
    typRat,
    pierwszaRata,
    nadplaty,
  };
}

export function GET(request: Request) {
  const parametry = parsujParametry(new URL(request.url).searchParams);
  if (typeof parametry === 'string') {
    return NextResponse.json({ blad: parametry, przyklad: PRZYKLAD }, { status: 400 });
  }

  try {
    const harmonogram = policzHarmonogram(parametry, seriaWskaznika(parametry.wskaznik));
    return NextResponse.json(harmonogram);
  } catch (blad) {
    const komunikat = blad instanceof Error ? blad.message : String(blad);
    return NextResponse.json({ blad: komunikat }, { status: 400 });
  }
}
