# Quickstart walidacji

## Wymagania

- Node.js 22 lub nowszy
- npm
- repozytorium z zainstalowanymi zależnościami

## Instalacja i testy

Z katalogu repozytorium uruchom:

```powershell
npm install
npm test
npm run typecheck
npm run build
```

Wszystkie polecenia muszą zakończyć się kodem 0.

## Walidacja liczby kontrolnej domeny

Test domenowy powinien wywołać `policzHarmonogram` z kwotą `40000000` groszy,
300 ratami równymi, stałą serią POLSTR `0.0355`, marżą `0.0211` i datą
`2026-10-01`. Oczekiwane wartości to:

- pierwsza rata: `249472` grosze z tolerancją 5 groszy,
- ostatnia rata: `249253` grosze z tolerancją 5 groszy,
- suma części kapitałowych: `40000000` groszy.

## Walidacja endpointu

Uruchom aplikację:

```powershell
npm run dev
```

Następnie otwórz:

```text
http://localhost:3000/api/harmonogram?kwota=400000&liczbaRat=300&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01
```

Odpowiedź 200 musi zawierać `raty`, `sumaOdsetekGr`, `rataPierwszaGr` i
`rataOstatniaGr`. Dla brakującego parametru, np. `wskaznik`, odpowiedź musi
mieć status 400 i pole `blad`.

## Walidacja interfejsu

Na stronie głównej wprowadź te same parametry, kliknij „Policz” i sprawdź:

1. widoczność pierwszej i ostatniej raty oraz sumy odsetek,
2. obecność numeru, daty, kapitału, odsetek, raty i salda w tabeli,
3. zmianę wyniku po wyborze rat malejących,
4. pobranie CSV zawierającego wszystkie widoczne wiersze.
