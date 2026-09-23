# Model danych: Kalkulator harmonogramu spłat POLSTR

## ParametryKredytu

Wejście domeny reprezentujące jeden kredyt.

| Pole | Typ | Reguły |
|---|---|---|
| `kwotaGr` | liczba całkowita | większa od zera, kwota w groszach |
| `liczbaRat` | liczba całkowita | większa od zera |
| `marza` | liczba | nieujemna, ułamek punktów procentowych |
| `typRat` | `rowne` lub `malejace` | określa algorytm spłaty |
| `wskaznik` | `POLSTR_1M` lub `WIBOR_3M` | wybiera serię danych |
| `pierwszaRata` | tekst daty | rzeczywista data `YYYY-MM-DD` |
| `nadplaty` | lista Nadplata | opcjonalna, miesiące w zakresie harmonogramu |

## WpisSerii

Wartość wskaźnika obowiązująca od wskazanego dnia.

| Pole | Typ | Reguły |
|---|---|---|
| `od` | tekst daty | uporządkowana rosnąco |
| `stopa` | liczba | dodatni ułamek, np. `0.0355` |

Seria jest wybierana przez `wskaznik`. Dla daty raty wybierany jest ostatni
wpis, którego `od` nie jest późniejsza od daty raty; jeśli takiego wpisu nie
ma, używany jest pierwszy wpis serii.

## Nadplata

Jednorazowa dodatkowa spłata kapitału.

| Pole | Typ | Reguły |
|---|---|---|
| `miesiac` | liczba całkowita | od 1 do `liczbaRat` |
| `kwotaGr` | liczba całkowita | dodatnia i nie większa od salda |
| `tryb` | `obnizRate` lub `skrocOkres` | wpływa na przyszły harmonogram |

Nadpłata jest stosowana po racie o numerze `miesiac`. Dla `obnizRate`
przelicza przyszłą ratę przy zachowaniu terminu, a dla `skrocOkres` zachowuje
wartość raty docelowej i kończy harmonogram wcześniej.

## Rata

Pojedynczy wiersz wyniku.

| Pole | Typ | Reguły |
|---|---|---|
| `numer` | liczba całkowita | kolejny numer od 1 |
| `data` | tekst daty | data raty |
| `kapitalGr` | liczba całkowita | nieujemna część kapitałowa |
| `odsetkiGr` | liczba całkowita | nieujemne odsetki okresu |
| `rataGr` | liczba całkowita | suma kapitału i odsetek |
| `saldoPoSplacieGr` | liczba całkowita | nieujemne saldo po racie i nadpłacie |

## Harmonogram

Wynik obliczenia zawierający:

- `raty`: uporządkowaną listę Rata,
- `sumaOdsetekGr`: sumę wszystkich `odsetkiGr`,
- `rataPierwszaGr` i `rataOstatniaGr` jako wymagane agregaty dla
  ekranu i kontraktu API.

Relacje: jeden Harmonogram ma wiele Rat; jedna ParametryKredytu wybiera jedną
Serię wskaźnika i może zawierać wiele Nadplat.
