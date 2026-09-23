import { describe, expect, it } from 'vitest';
import {
  policzHarmonogram,
  rekompensataArt40,
  type ParametryKredytu,
} from '../src/domena/harmonogram';

const seriaStala = [{ od: '2026-10-01', stopa: 0.0355 }];

const parametryKontrolne: ParametryKredytu = {
  kwotaGr: 40_000_000,
  liczbaRat: 300,
  marza: 0.0211,
  typRat: 'rowne',
  wskaznik: 'POLSTR_1M',
  pierwszaRata: '2026-10-01',
};

describe('policzHarmonogram', () => {
  it('oblicza liczbę kontrolną rat równych', () => {
    const harmonogram = policzHarmonogram(parametryKontrolne, seriaStala);

    expect(harmonogram.raty[0]?.rataGr).toBe(249_472);
    expect(harmonogram.raty.at(-1)?.rataGr).toBe(249_253);
    expect(harmonogram.raty.reduce((suma, rata) => suma + rata.kapitalGr, 0)).toBe(40_000_000);
    expect(harmonogram.raty.at(-1)?.saldoPoSplacieGr).toBe(0);
  });

  it('odrzuca nieistniejącą datę kalendarzową', () => {
    expect(() =>
      policzHarmonogram({
        ...parametryKontrolne,
        pierwszaRata: '2026-02-31',
      }, seriaStala),
    ).toThrow('pierwszaRata');
  });
});

describe('rekompensataArt40', () => {
  it.each([
    { kwotaGr: 5_000_000, miesiac: 13, stopa: 0.06, oczekiwaneGr: 150_000 },
    { kwotaGr: 2_000_000, miesiac: 40, stopa: 0.06, oczekiwaneGr: 0 },
    { kwotaGr: 1_000_000, miesiac: 5, stopa: 0.02, oczekiwaneGr: 20_000 },
    { kwotaGr: 1_000_000, miesiac: 36, stopa: 0.06, oczekiwaneGr: 30_000 },
    { kwotaGr: 1_000_000, miesiac: 37, stopa: 0.06, oczekiwaneGr: 0 },
  ])('oblicza rekompensatę dla $miesiac. miesiąca', ({
    kwotaGr,
    miesiac,
    stopa,
    oczekiwaneGr,
  }) => {
    expect(rekompensataArt40(kwotaGr, miesiac, stopa)).toBe(oczekiwaneGr);
  });

  it('pokazuje rekompensatę w harmonogramie bez zmiany salda', () => {
    const parametry: ParametryKredytu = {
      kwotaGr: 30_000_000,
      liczbaRat: 240,
      marza: 0.0211,
      typRat: 'rowne',
      wskaznik: 'WIBOR_3M',
      pierwszaRata: '2027-10-01',
      nadplaty: [{ miesiac: 13, kwotaGr: 5_000_000, tryb: 'skrocOkres' }],
    };
    const seria = [{ od: '2027-10-01', stopa: 0.0455 }];
    const zRekompensata = policzHarmonogram(parametry, seria);

    expect(zRekompensata.raty[12]?.rekompensataGr).toBe(150_000);
    expect(zRekompensata.sumaRekompensatGr).toBe(150_000);
    expect(zRekompensata.raty[12]?.saldoPoSplacieGr).toBe(24_193_395);
  });

  it('rozróżnia skrócenie okresu i obniżenie raty po nadpłacie', () => {
    const wspólne: ParametryKredytu = {
      kwotaGr: 30_000_000,
      liczbaRat: 240,
      marza: 0.0211,
      typRat: 'rowne',
      wskaznik: 'WIBOR_3M',
      pierwszaRata: '2027-10-01',
    };
    const seria = [{ od: '2027-10-01', stopa: 0.0455 }];
    const obnizRate = policzHarmonogram({
      ...wspólne,
      nadplaty: [{ miesiac: 1, kwotaGr: 3_000_000, tryb: 'obnizRate' }],
    }, seria);
    const skrocOkres = policzHarmonogram({
      ...wspólne,
      nadplaty: [{ miesiac: 1, kwotaGr: 3_000_000, tryb: 'skrocOkres' }],
    }, seria);

    expect(obnizRate.raty).toHaveLength(240);
    expect(skrocOkres.raty.length).toBeLessThan(obnizRate.raty.length);
    expect(skrocOkres.raty[1]?.rataGr).toBe(skrocOkres.raty[0]?.rataGr);
  });
});
