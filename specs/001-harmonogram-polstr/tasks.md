---

description: "Lista zadań dla kalkulatora harmonogramu spłat POLSTR"
---

# Tasks: Kalkulator harmonogramu spłat POLSTR

**Input**: Dokumenty projektowe z `/specs/001-harmonogram-polstr/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/harmonogram-api.md`, `quickstart.md`

**Tests**: Testy są wymagane przez specyfikację i konstytucję projektu.
Dla każdej zmiany logiki najpierw powstaje test, który początkowo musi
nie przechodzić.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Szkielet projektu już istnieje; zgodnie z KARTĄ nie ma zadań
inicjalizacyjnych w tej fazie.

Brak zadań.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ustalenie wspólnych typów i kontraktów blokujących historie
użytkownika.

**⚠️ CRITICAL**: Żadna historia użytkownika nie może rozpocząć implementacji
przed zakończeniem tej fazy.

- [ ] T001 Zdefiniować typy `Nadplata`, `Rata` i `Harmonogram` oraz rozszerzyć `ParametryKredytu` o opcjonalną listę nadpłat w `src/domena/harmonogram.ts`, zachowując kwoty jako całkowite grosze, `typRat` jako `rowne | malejace`, `wskaznik` jako `POLSTR_1M | WIBOR_3M`, a `tryb` jako `obnizRate | skrocOkres`
- [ ] T002 Dodać współdzielone walidatory rzeczywistej daty `YYYY-MM-DD`, dodatnich liczb całkowitych i nieujemnej marży w `src/domena/harmonogram.ts`
- [ ] T003 Ustalić funkcję wyboru wartości serii wskaźnika dla daty raty w `src/dane/wskazniki.ts`, z pierwszym wpisem dla dat wcześniejszych i ostatnim znanym wpisem dla dat późniejszych
- [ ] T004 Przygotować wspólne narzędzia dat miesięcznych, z jawną regułą dla dnia nieistniejącego w krótszym miesiącu (np. 31 stycznia → ostatni dzień lutego), oraz centralnego zaokrąglania do grosza w `src/domena/harmonogram.ts`, bez `Date.now()`, I/O i logowania

**Checkpoint**: Wspólne typy, walidacja, wybór wskaźnika i reguły pieniędzy są
gotowe; historie mogą być implementowane niezależnie.

---

## Phase 3: User Story 1 - Obliczenie harmonogramu kredytu (Priority: P1) 🎯 MVP

**Goal**: Użytkownik otrzymuje poprawny harmonogram rat równych dla danych
kontrolnych oraz może wybrać POLSTR 1M albo WIBOR 3M.

**Independent Test**: Test domeny dla 400 000 zł, 300 rat, stopy 3,55% + 2,11
pp potwierdza pierwszą ratę 2 494,72 zł, ostatnią 2 492,53 zł z tolerancją
0,05 zł oraz sumę kapitału 400 000 zł.

### Tests for User Story 1

- [ ] T005 [US1] Napisać test liczby kontrolnej rat równych ze stałą serią `0.0355` w `tests/harmonogram.test.ts`, oczekując pierwszej raty `249472` groszy, ostatniej `249253` grosze z tolerancją 5 groszy i sumy kapitału `40000000` groszy
- [ ] T006 [US1] Napisać test walidacji parametrów i rzeczywistej daty `2026-02-31` w `tests/harmonogram.test.ts`, oczekując jawnego błędu zamiast częściowego wyniku
- [ ] T007 [P] [US1] Napisać test odpowiedzi endpointu dla poprawnych parametrów i brakującego `wskaznik` w `tests/harmonogram-api.test.ts`, oczekując odpowiednio statusu 200 z polami `raty`, `sumaOdsetekGr`, `rataPierwszaGr`, `rataOstatniaGr` oraz statusu 400 z polem `blad`

### Implementation for User Story 1

- [ ] T008 [US1] Zaimplementować czystą funkcję wyliczającą oprocentowanie okresu jako wskaźnik plus marża i odsetki proste od salda w `src/domena/harmonogram.ts`
- [ ] T009 [US1] Zaimplementować ratę równą przeliczaną dla bieżącego salda i liczby pozostałych rat oraz korektę ostatniej raty w `src/domena/harmonogram.ts`
- [ ] T010 [US1] Zaimplementować generowanie dat rat i pojedynczych rekordów `Rata` w `src/domena/harmonogram.ts`, bez obliczeń finansowych w route handlerze
- [ ] T011 [US1] Zaktualizować `app/api/harmonogram/route.ts` tak, aby parsował kwoty do groszy bez wykonywania zaokrągleń finansowych w route, konwertował punkty procentowe na ułamki, walidował datę oraz zwracał kontrakt 200/400 opisany w `contracts/harmonogram-api.md`
- [ ] T012 [US1] Zaktualizować `tests/smoke.test.ts` tak, aby zastąpić oczekiwanie błędu „nie zaimplementowano” testem działającego harmonogramu i zachować test uporządkowania serii danych

**Checkpoint**: Historia P1 działa samodzielnie przez domenę i
`GET /api/harmonogram`; MVP można zweryfikować bez interfejsu graficznego.

---

## Phase 4: User Story 2 - Obsługa zmiennego wskaźnika i typów rat (Priority: P1)

**Goal**: Użytkownik może obliczyć raty malejące i poprawnie uwzględnić
zmiany POLSTR 1M oraz WIBOR 3M na granicy okresu.

**Independent Test**: Testy potwierdzają równy podział kapitału dla rat
malejących, zmianę odsetek po zmianie serii oraz użycie ostatniej znanej
wartości po końcu serii.

### Tests for User Story 2

- [ ] T013 [US2] Napisać test rat malejących z kontrolną kwotą kapitału i sprawdzeniem, że część kapitałowa jest stała, a kolejne raty maleją w `tests/harmonogram.test.ts`
- [ ] T014 [US2] Napisać test zmiany wskaźnika dokładnie w dniu raty oraz po ostatnim wpisie serii w `tests/harmonogram.test.ts`
- [ ] T015 [US2] Napisać test wyboru obu serii `POLSTR_1M` i `WIBOR_3M` w `tests/harmonogram.test.ts`, sprawdzając różne odsetki dla różnych danych

### Implementation for User Story 2

- [ ] T016 [US2] Zaimplementować stałą część kapitałową rat malejących jako pozostałe saldo podzielone przez liczbę pozostałych rat w `src/domena/harmonogram.ts`
- [ ] T017 [US2] Zintegrować wybór bieżącej stopy z datą raty w generatorze harmonogramu w `src/domena/harmonogram.ts`, tak aby wpis obowiązujący od dnia raty był użyty w tym okresie
- [ ] T018 [US2] Zaimplementować bezpieczną korektę końcowego kapitału i salda dla obu typów rat w `src/domena/harmonogram.ts`
- [ ] T019 [US2] Uzupełnić komunikaty błędów domeny dla niepoprawnego typu raty i wskaźnika w `src/domena/harmonogram.ts`

**Checkpoint**: Historie P1 dotyczące obliczeń rat równych i malejących oraz
zmiennych wskaźników działają razem i niezależnie od ekranu.

---

## Phase 5: User Story 3 - Nadpłata i eksport wyniku (Priority: P2)

**Goal**: Użytkownik może dodać nadpłaty w obu trybach, uzyskać zmieniony
harmonogram i wyeksportować tabelę do CSV.

**Independent Test**: Dla tej samej kwoty jedna nadpłata obniża przyszłą ratę
w trybie `obnizRate`, a w trybie `skrocOkres` kończy harmonogram nie później
niż wariant bez nadpłaty; eksport zawiera wszystkie wiersze tabeli.

### Tests for User Story 3

- [ ] T020 [US3] Napisać test nadpłaty `obnizRate`, sprawdzając zmniejszenie salda i przeliczenie kolejnej raty przy zachowaniu terminu w `tests/harmonogram.test.ts`
- [ ] T021 [US3] Napisać test nadpłaty `skrocOkres`, sprawdzając zachowanie raty docelowej, wcześniejsze zakończenie oraz zamknięcie salda w `tests/harmonogram.test.ts`
- [ ] T022 [US3] Napisać test odrzucenia nadpłaty ujemnej, poza harmonogramem albo większej od salda w `tests/harmonogram.test.ts`
- [ ] T023 [P] [US3] Napisać test parsowania URL-encoded JSON `nadplaty` w `tests/harmonogram-api.test.ts`, oczekując poprawnej konwersji złotych na grosze i błędu dla niepoprawnego JSON

### Implementation for User Story 3

- [ ] T024 [US3] Zaimplementować stosowanie nadpłaty po planowej racie i walidację pola `miesiac`, `kwotaGr` oraz `tryb` w `src/domena/harmonogram.ts`
- [ ] T025 [US3] Zaimplementować tryb `obnizRate` przez przeliczenie przyszłej raty przy zachowaniu pierwotnego terminu w `src/domena/harmonogram.ts`
- [ ] T026 [US3] Zaimplementować tryb `skrocOkres` przez zachowanie raty docelowej i wcześniejsze zakończenie po zamknięciu salda w `src/domena/harmonogram.ts`
- [ ] T027 [US3] Rozszerzyć parsowanie `nadplaty` i obsługę błędów w `app/api/harmonogram/route.ts` zgodnie z `contracts/harmonogram-api.md`
- [ ] T028 [US3] Zbudować formularz parametrów, listę nadpłat i prezentację pierwszej raty, ostatniej raty, sumy odsetek oraz tabeli w `app/page.tsx` jako komponent `'use client'` z Tailwind
- [ ] T029 [US3] Dodać eksport wszystkich widocznych kolumn i wierszy harmonogramu do CSV po stronie przeglądarki w `app/page.tsx`, bez biblioteki UI

**Checkpoint**: Wszystkie historie użytkownika są funkcjonalne; nadpłaty są
liczone w domenie, API je przyjmuje, a ekran pokazuje i eksportuje wynik.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ujednolicenie jakości, dokumentacji i walidacji całego MVP.

- [ ] T030 [P] Uzupełnić komentarze i nazwy domenowe po polsku w `src/domena/harmonogram.ts`, `src/dane/wskazniki.ts` i `app/api/harmonogram/route.ts`, usuwając szkielety oraz nieaktualne opisy
- [ ] T031 [P] Sprawdzić brak `any`, `@ts-ignore`, nieuzasadnionych rzutowań, podwójnego zaokrąglania i obliczeń finansowych w route handlerze w `src/domena/harmonogram.ts` i `app/api/harmonogram/route.ts`
- [ ] T032 [P] Zaktualizować opis uruchomienia i walidacji po implementacji w `specs/001-harmonogram-polstr/quickstart.md`
- [ ] T033 Uruchomić `npm test`, `npm run typecheck` i `npm run build`, a wyniki oraz ewentualne poprawki zapisać przed zakończeniem fazy w repozytorium
- [ ] T034 Uruchomić scenariusze z `specs/001-harmonogram-polstr/quickstart.md` na lokalnym serwerze i potwierdzić odpowiedzi API oraz eksport CSV

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Brak zadań; szkielet repozytorium już istnieje.
- **Foundational (Phase 2)**: Zależy od istniejącego szkieletu i blokuje
  wszystkie historie.
- **User Story 1 (Phase 3)**: Zależy od Phase 2; stanowi rekomendowane MVP.
- **User Story 2 (Phase 4)**: Zależy od Phase 2 i integruje generator
  utworzony w US1; musi zachować działanie US1.
- **User Story 3 (Phase 5)**: Zależy od Phase 2 oraz generatora z US1/US2,
  ponieważ nadpłaty zmieniają ich harmonogram.
- **Polish (Phase 6)**: Zależy od wszystkich historii objętych wydaniem.

### User Story Dependencies

- **US1 (P1)**: Po Phase 2, bez zależności od innych historii.
- **US2 (P1)**: Po Phase 2; współdzieli generator z US1, ale ma niezależne
  testy rat malejących i zmian wskaźnika.
- **US3 (P2)**: Po Phase 2; korzysta z typów i generatora, lecz ma
  niezależne testy nadpłat i API/UI.

### Within Each User Story

- Testy muszą powstać przed implementacją i początkowo nie przechodzić.
- Typy i walidacja muszą poprzedzać obliczenia.
- Domena musi być gotowa przed route handlerem i ekranem.
- Kontrakt API musi być zgodny przed integracją interfejsu.
- Po każdym checkpointcie należy uruchomić testy historii i zatrzymać się
  zgodnie z procesem fazowym projektu.

### Parallel Opportunities

- T001–T003 mogą być wykonane równolegle, bo dotyczą odrębnych elementów
  typów, walidacji i danych.
- T005–T007 mogą być napisane równolegle jako niezależne testy US1.
- T013–T015 mogą być napisane równolegle jako niezależne testy US2.
- T020–T023 mogą być napisane równolegle jako niezależne testy US3.
- Po Phase 2 różne historie mogą być realizowane równolegle przez osobne osoby,
  lecz zmiany w `src/domena/harmonogram.ts` wymagają koordynacji.
- T032 może być wykonane równolegle z kontrolą kodu przed wspólnym uruchomieniem bramek.

---

## Parallel Example: User Story 1

```text
Task: T005 test liczby kontrolnej w tests/harmonogram.test.ts
Task: T006 test walidacji daty w tests/harmonogram.test.ts
Task: T007 test kontraktu API w tests/harmonogram-api.test.ts
```

## Parallel Example: User Story 2

```text
Task: T013 test rat malejących w tests/harmonogram.test.ts
Task: T014 test granicy zmiany wskaźnika w tests/harmonogram.test.ts
Task: T015 test wyboru serii w tests/harmonogram.test.ts
```

## Parallel Example: User Story 3

```text
Task: T020 test trybu obnizRate w tests/harmonogram.test.ts
Task: T021 test trybu skrocOkres w tests/harmonogram.test.ts
Task: T022 test walidacji nadpłat w tests/harmonogram.test.ts
Task: T023 test parametru nadplaty w tests/harmonogram-api.test.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Pominąć Setup, ponieważ szkielet istnieje.
2. Wykonać Phase 2 jako blokującą podstawę.
3. Wykonać Phase 3 i zatrzymać się na checkpointcie US1.
4. Uruchomić test liczby kontrolnej, `npm run typecheck` oraz endpoint API.
5. Po review i scaleniu przejść do kolejnej fazy.

### Incremental Delivery

1. Phase 2 → wspólne typy i walidacja.
2. US1 → działające MVP obliczeń i API.
3. US2 → raty malejące i zmienne wskaźniki.
4. US3 → nadpłaty, ekran i eksport CSV.
5. Phase 6 → pełne quality gates i quickstart.

## Notes

- `[P]` oznacza zadanie możliwe do wykonania równolegle, bez zależności od
  nieukończonego zadania.
- Etykieta `[US1]`, `[US2]`, `[US3]` mapuje zadanie do historii ze specyfikacji.
- Każde zadanie zawiera konkretną ścieżkę pliku.
- Nie dodawać zależności zewnętrznych bez osobnej decyzji i uzasadnienia.
