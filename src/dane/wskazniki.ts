import polstr1m from '../../dane/polstr-1m.json';
import wibor3m from '../../dane/wibor-3m.json';
import type { NazwaWskaznika, WpisSerii } from '../domena/harmonogram';

const SERIE: Record<NazwaWskaznika, WpisSerii[]> = {
  POLSTR_1M: polstr1m.wartosci,
  WIBOR_3M: wibor3m.wartosci,
};

/** Seria wartości wskaźnika z dane/*.json, uporządkowana rosnąco po dacie. */
export function seriaWskaznika(wskaznik: NazwaWskaznika): WpisSerii[] {
  return SERIE[wskaznik];
}

export function wpisSeriiDlaDaty(seria: WpisSerii[], data: string): WpisSerii {
  return seria.reduce((wybrany, biezacy) =>
    biezacy.od <= data ? biezacy : wybrany,
  );
}
