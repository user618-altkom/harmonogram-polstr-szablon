import { describe, expect, it } from 'vitest';
import { GET } from '../app/api/harmonogram/route';

describe('GET /api/harmonogram', () => {
  it('zwraca harmonogram dla poprawnych parametrów', async () => {
    const odpowiedz = await GET(new Request(
      'http://localhost/api/harmonogram?kwota=400000&liczbaRat=300&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01',
    ));
    const dane = await odpowiedz.json();

    expect(odpowiedz.status).toBe(200);
    expect(dane).toEqual(expect.objectContaining({
      raty: expect.any(Array),
      sumaOdsetekGr: expect.any(Number),
      rataPierwszaGr: expect.any(Number),
      rataOstatniaGr: expect.any(Number),
    }));
  });

  it('zwraca 400 dla brakującego wskaźnika', async () => {
    const odpowiedz = await GET(new Request(
      'http://localhost/api/harmonogram?kwota=400000&liczbaRat=300&marza=2.11&typRat=rowne&pierwszaRata=2026-10-01',
    ));
    const dane = await odpowiedz.json();

    expect(odpowiedz.status).toBe(400);
    expect(dane).toEqual(expect.objectContaining({ blad: expect.any(String) }));
  });
});
