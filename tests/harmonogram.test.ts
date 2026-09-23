import { describe, expect, it } from 'vitest';
import { policzHarmonogram, type ParametryKredytu } from '../src/domena/harmonogram';

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
