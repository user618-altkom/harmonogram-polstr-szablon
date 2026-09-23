<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Modified principles: none
- Added sections: I–V, Ograniczenia techniczne i domenowe, Proces wytwarzania i jakość
- Removed sections: placeholder sections from the template
- Follow-up TODOs: none
-->

# Harmonogram POLSTR Constitution

## Core Principles

### I. Czysta domena obliczeń
Cała logika harmonogramu spłat MUST znajdować się w czystych funkcjach
TypeScript w `src/domena/`. Moduły domenowe MUST NOT używać Reacta, I/O,
odczytu plików, `Date.now()` ani logowania. Route handler MUST wyłącznie
parsować parametry żądania, wywoływać domenę i zwracać JSON; nie może zawierać
obliczeń, zaokrągleń ani pętli po ratach. Rozdział ten chroni testowalność i
zapobiega duplikowaniu reguł biznesowych w warstwach aplikacji.

### II. TypeScript strict i nazwy domenowe po polsku
Projekt MUST używać TypeScript z włączonym trybem strict i nie może zawierać
`any`, `@ts-ignore` ani nieuzasadnionych rzutowań omijających typy. Nazwy
pojęć domenowych MUST być pełne i po polsku, bez skrótów. Dokumenty, komentarze
w kodzie i komunikaty commitów MUST być pisane po polsku. Zasada zapewnia
czytelny kontrakt kodu dla domeny kredytowej i ogranicza błędy wynikające z
niejawnego typowania.

### III. Test-first i liczby kontrolne
Każda zmiana logiki obliczeń MUST być poprzedzona testem w Vitest, który
obejmuje konkretną liczbę kontrolną. Testy domeny i danych MUST znajdować się
w `tests/`. Minimalny zakres obejmuje raty równe, raty malejące, zmianę
wskaźnika, oba tryby nadpłaty oraz zgodność sumy kapitału z kwotą kredytu.
Cykl MUST przebiegać jako test, implementacja, refaktoryzacja. Dzięki temu
reguły finansowe są weryfikowane przed integracją z interfejsem.

### IV. Jednoznaczne pieniądze i wskaźniki
Kwoty MUST być reprezentowane w groszach jako liczby całkowite albo przez
jedną wyraźnie udokumentowaną decyzję o miejscu zaokrąglania. Zaokrąglanie do
grosza MUST odbywać się w jednym miejscu, a rata końcowa MUST wyrównywać sumę
części kapitałowych do kwoty kredytu. Serie POLSTR 1M i WIBOR 3M MUST być
wczytywane z `dane/*.json` przez `src/dane/`; po ostatnim wpisie obowiązuje
ostatnia znana wartość. Reguły te zapewniają powtarzalność wyników i
eliminują rozbieżności groszowe.

### V. Prosty, jawny i etapowy rozwój
MVP MUST pozostać ograniczone do wymagań opisanych w `BRIEF.md`; nowe
zależności wymagają uzasadnienia w zmianie i akceptacji przed dodaniem.
Implementacja MUST przebiegać fazami opisanymi w `tasks.md`, z osobnym PR-em
na fazę, review przed kolejną fazą i zatrzymaniem po zakończeniu wskazanej
fazy. Ekran MUST być komponentem `'use client'` w `app/page.tsx`, używać
Tailwind bez biblioteki UI i pobierać dane przez `/api/harmonogram`.
Ograniczenie zakresu chroni termin MVP i ułatwia niezależne sprawdzanie
logiki oraz interfejsu.

## Ograniczenia techniczne i domenowe

Projekt MUST używać Next.js App Router, TypeScript, Tailwind i Vitest.
Wskaźnik okresu jest sumą wartości wskaźnika i marży; POLSTR 1M zmienia się
co miesiąc, a WIBOR 3M co kwartał. Odsetki są proste w okresie, bez
kapitalizacji w ramach miesiąca. API `GET /api/harmonogram` zwraca tabelę rat
oraz sumę odsetek, a eksport CSV działa po stronie przeglądarki. Wdrożenie
produkcyjne MUST budować się przez `next build` na Vercel po zmianach w
gałęzi `main`.

## Proces wytwarzania i jakość

Przed zgłoszeniem gotowości MUST przejść `npm test`, `npm run typecheck` oraz
`npm run build`. Każda zmiana MUST zachować istniejące testy i konwencje,
a review kodu TypeScript MUST klasyfikować uwagi jako BŁĄD, RYZYKO albo STYL
i wskazywać plik oraz linię. Granice okresów, dat i ostatniej raty MUST mieć
jawne testy brzegowe. PR-y powinny być małe, opisowe i możliwe do niezależnego
zreviewowania; PR-y MUST być małe i opisowe, a komunikat commita MUST być
jednolinijkowy i opisowy.

## Governance

Konstytucja jest nadrzędna wobec lokalnych praktyk implementacyjnych.
Każda zmiana zasad wymaga aktualizacji tego pliku, raportu wpływu w komentarzu
HTML, podniesienia wersji zgodnie z SemVer oraz review w osobnym PR. Wersja
MAJOR oznacza usunięcie lub zmianę wstecznie niezgodnej zasady, MINOR dodanie
zasady lub istotne rozszerzenie zakresu, a PATCH doprecyzowanie bez zmiany
znaczenia. Zgodność z konstytucją MUST być sprawdzana podczas planowania,
implementacji i review; odstępstwa wymagają uzasadnienia w PR. Artefakty
spec-kit (`spec.md`, `plan.md`, `tasks.md`) są źródłem kolejności prac, ale
nie mogą naruszać tych zasad.

**Version**: 1.0.1 | **Ratified**: 2026-09-23 | **Last Amended**: 2026-09-23
