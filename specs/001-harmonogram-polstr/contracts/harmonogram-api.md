# Kontrakt API harmonogramu

## `GET /api/harmonogram`

### Parametry query string

| Parametr | Format | Wymagany | Znaczenie |
|---|---|---:|---|
| `kwota` | dodatnia liczba w złotych | tak | kwota kredytu, np. `400000` |
| `liczbaRat` | dodatnia liczba całkowita | tak | liczba rat, np. `300` |
| `marza` | nieujemna liczba w punktach procentowych | tak | np. `2.11` |
| `wskaznik` | `POLSTR_1M` lub `WIBOR_3M` | tak | seria wskaźnika |
| `typRat` | `rowne` lub `malejace` | tak | typ rat |
| `pierwszaRata` | `YYYY-MM-DD` | tak | data pierwszej raty |
| `nadplaty` | URL-encoded JSON listy | nie | np. `[{"miesiac":6,"kwota":10000,"tryb":"obnizRate"}]` |

Brak parametru `nadplaty` oznacza pustą listę. Kwota nadpłaty w tym polu jest
podawana w złotych z dwoma miejscami po przecinku, a route konwertuje ją do
groszy przed wywołaniem domeny.

### Odpowiedź 200

```json
{
  "raty": [
    {
      "numer": 1,
      "data": "2026-10-01",
      "kapitalGr": 123456,
      "nadplataGr": 0,
      "odsetkiGr": 188667,
      "rataGr": 312123,
      "rekompensataGr": 0,
      "saldoPoSplacieGr": 39987654
    }
  ],
  "sumaOdsetekGr": 12345678,
  "sumaRekompensatGr": 0,
  "rataPierwszaGr": 312123,
  "rataOstatniaGr": 312000
}
```

Kwoty w odpowiedzi są liczbami całkowitymi w groszach. Ekran formatuje je
lokalnie jako złote z dwoma miejscami po przecinku.

### Odpowiedź 400

```json
{
  "blad": "marza: punkty procentowe, np. 2.11",
  "przyklad": "/api/harmonogram?kwota=400000&liczbaRat=300&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01"
}
```

Pole `przyklad` jest opcjonalne i może być zwracane przy błędzie parametrów.
System nie zwraca częściowego harmonogramu po błędzie.
