# Implementation Plan: Kalkulator harmonogramu spłat POLSTR

**Branch**: `001-harmonogram-polstr` | **Date**: 2026-09-23 | **Spec**:
[spec.md](./spec.md)

**Input**: Feature specification from
`/specs/001-harmonogram-polstr/spec.md`

## Summary

Zaimplementować czysty moduł domenowy generujący harmonogram kredytu dla
POLSTR 1M i WIBOR 3M, rat równych i malejących oraz nadpłat. Dane wskaźników
pozostają w istniejących plikach JSON. Route handler będzie jedynie walidował
i konwertował parametry query string, a ekran pobierze wynik z endpointu i
wyeksportuje tabelę do CSV. Zaokrąglanie nastąpi w domenie, w jednym miejscu,
z korektą ostatniej raty.

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js 22+

**Primary Dependencies**: Next.js 16 App Router, React 19, Tailwind CSS 4,
Vitest 4; bez nowych zależności

**Storage**: Istniejące pliki `dane/polstr-1m.json` i `dane/wibor-3m.json`,
importowane przez `src/dane/wskazniki.ts`; brak bazy danych

**Testing**: Vitest w `tests/`, `npm run typecheck`, `npm run build`

**Target Platform**: Przeglądarka oraz środowisko serwerowe Vercel/Node.js

**Project Type**: Jedna aplikacja webowa Next.js z modułem domenowym i
route handlerem

**Performance Goals**: Poprawny harmonogram 300 rat wraz z listą nadpłat
wyświetlony w czasie krótszym niż 10 sekund

**Constraints**: Czysta domena bez React i I/O; kwoty w groszach; jedno
miejsce zaokrąglania; brak dziennych stawek POLSTR; route handler bez obliczeń;
brak nowych zależności

**Scale/Scope**: Pojedynczy harmonogram do typowego okresu 300 rat, dwa
wskaźniki, wiele nadpłat w kolejnych miesiącach, bez kont użytkowników i
zapisywania kalkulacji

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Czysta domena obliczeń**: PASS — obliczenia trafią do
  `src/domena/harmonogram.ts`, a route pozostanie adapterem wejścia/wyjścia.
- **TypeScript strict i język projektu**: PASS — plan nie dodaje wyjątków od
  strict typing ani nowych zależności; nazwy domenowe i dokumentacja są po
  polsku.
- **Test-first i liczby kontrolne**: PASS — plan obejmuje test liczby
  kontrolnej oraz osobne testy rat malejących, zmian wskaźnika, nadpłat i sumy
  kapitału.
- **Jednoznaczne pieniądze i wskaźniki**: PASS — wejściowe kwoty domeny będą
  w groszach, stopa jako ułamek, a zaokrąglenie będzie scentralizowane.
- **Prosty, etapowy rozwój**: PASS — zakres pozostaje MVP, bez nowych
  zależności; ekran i API są rozdzielone od domeny.
- **Quality gates**: PASS — po implementacji wymagane są `npm test`,
  `npm run typecheck` i `npm run build`.

## Project Structure

### Documentation (this feature)

```text
specs/001-harmonogram-polstr/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── harmonogram-api.md
└── tasks.md              # utworzy /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── domena/
│   └── harmonogram.ts       # typy, walidacja domenowa i czyste obliczenia
└── dane/
    └── wskazniki.ts         # import i wybór istniejących serii JSON

app/
├── api/
│   └── harmonogram/
│       └── route.ts         # parsowanie query string i odpowiedź JSON
└── page.tsx                 # formularz, wynik i eksport CSV

tests/
├── harmonogram.test.ts      # testy kontrolne i scenariusze domeny
└── smoke.test.ts            # test danych oraz testy szkieletu do aktualizacji
```

**Structure Decision**: Jedna aplikacja Next.js zgodna z istniejącym szkieletem.
Domena pozostaje niezależnym modułem czystych funkcji, dane są osobną warstwą,
a route i ekran są cienkimi adapterami. Nie tworzymy osobnych projektów
frontend/backend ani warstwy repozytorium, bo MVP nie ma zewnętrznej bazy.

## Complexity Tracking

Brak naruszeń konstytucji wymagających uzasadnienia.
