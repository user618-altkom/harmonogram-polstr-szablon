# Feature Specification: Kalkulator harmonogramu spłat POLSTR

**Feature Branch**: `001-harmonogram-polstr`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: Kalkulator harmonogramu spłat kredytu hipotecznego ze zmiennym oprocentowaniem opartym na POLSTR 1M lub WIBOR 3M, obsługujący raty równe, malejące i nadpłaty.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Obliczenie harmonogramu kredytu (Priority: P1)

Doradca bankowy wprowadza kwotę kredytu, liczbę rat, datę pierwszej raty,
marżę, typ raty oraz wskaźnik, aby otrzymać kompletny harmonogram spłat.

**Why this priority**: Jest to podstawowa wartość produktu i pozwala ocenić
koszt kredytu przed rozważeniem nadpłat.

**Independent Test**: Dla stałej serii wskaźnika użytkownik wprowadza dane
kontrolne i otrzymuje ratę pierwszą, ratę ostatnią, sumę odsetek oraz tabelę
wszystkich rat.

**Acceptance Scenarios**:

1. **Given** kredyt 400 000 zł, 300 rat równych, POLSTR 1M 3,55% i marża
   2,11 pp, **When** użytkownik uruchamia obliczenie, **Then** pierwsza rata
   wynosi 2 494,72 zł z tolerancją 0,05 zł, a ostatnia rata wyrównująca
   wynosi 2 492,53 zł z tolerancją 0,05 zł.
2. **Given** poprawne parametry kredytu, **When** użytkownik wybiera WIBOR 3M
   lub POLSTR 1M, **Then** harmonogram używa odpowiedniej serii wartości
   wskaźnika i pokazuje numer, datę, kapitał, odsetki, ratę oraz saldo każdej
   raty.

---

### User Story 2 - Obsługa zmiennego wskaźnika i typów rat (Priority: P1)

Użytkownik chce porównać raty równe i malejące oraz zobaczyć wpływ zmiany
wartości wskaźnika w trakcie spłaty.

**Why this priority**: Różne typy rat i aktualizacje wskaźnika bezpośrednio
zmieniają koszt oraz przebieg spłaty kredytu.

**Independent Test**: Użytkownik wykonuje dwa obliczenia na tych samych danych,
zmieniając typ raty albo serię wskaźnika, i porównuje wyniki tabeli oraz sumę
odsetek.

**Acceptance Scenarios**:

1. **Given** typ rat malejących, **When** użytkownik oblicza harmonogram,
   **Then** część kapitałowa jest zgodna z równym podziałem kapitału, a kolejne
   raty zmniejszają się wraz ze spadkiem odsetek.
2. **Given** seria wskaźnika z nową wartością od dnia raty, **When** obliczenie
   obejmuje ten dzień, **Then** oprocentowanie tego i kolejnych właściwych
   okresów uwzględnia nową wartość.
3. **Given** okres po ostatnim wpisie serii, **When** obliczenie obejmuje ten
   okres, **Then** obowiązuje ostatnia znana wartość wskaźnika.

---

### User Story 3 - Nadpłata i eksport wyniku (Priority: P2)

Użytkownik dodaje nadpłatę w wybranym miesiącu, wybiera obniżenie raty albo
skrócenie okresu, a następnie może pobrać wynik do dalszej analizy.

**Why this priority**: Nadpłaty są istotnym scenariuszem doradczym, ale
korzystają z wcześniej obliczonego harmonogramu.

**Independent Test**: Użytkownik dodaje jedną nadpłatę w każdym z dwóch trybów,
sprawdza saldo i długość harmonogramu, a następnie eksportuje tabelę.

**Acceptance Scenarios**:

1. **Given** nadpłata z trybem „obniż ratę”, **When** użytkownik oblicza
   harmonogram, **Then** saldo po miesiącu nadpłaty maleje, a przyszłe raty
   zostają obniżone bez nieuzasadnionego zwiększenia liczby rat.
2. **Given** nadpłata z trybem „skróć okres”, **When** użytkownik oblicza
   harmonogram, **Then** saldo maleje, liczba pozostałych rat jest mniejsza
   albo równa liczbie bez nadpłaty, a ostatnia rata zamyka saldo.
3. **Given** wyświetlona tabela harmonogramu, **When** użytkownik wybiera
   eksport CSV, **Then** pobierany plik zawiera wszystkie wiersze i kolumny
   pokazane w tabeli.

### Edge Cases

- Kwota kredytu i liczba rat muszą być dodatnie, a marża nieujemna; brakujące albo
  niepoprawne dane uniemożliwiają obliczenie i pokazują zrozumiały komunikat.
- Data pierwszej raty musi mieć format `YYYY-MM-DD`; niepoprawna data jest
  odrzucana.
- Nadpłata nie może być ujemna ani większa od aktualnego salda; nadpłata
  równa saldu kończy harmonogram.
- Nadpłata przypisana do miesiąca poza harmonogramem jest odrzucona lub
  zgłaszana jako błąd, bez cichego pominięcia.
- Zaokrąglenia nie mogą powodować ujemnego salda ani rozbieżności między
  kwotą kredytu a sumą części kapitałowych.
- Ostatnia rata może różnić się od rat wcześniejszych, aby dokładnie zamknąć
  saldo po zaokrągleniu.
- Zmiana wskaźnika dokładnie w dniu raty musi zostać przypisana do właściwego
  okresu, a nie do poprzedniej raty.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST przyjąć kwotę kredytu, liczbę rat, datę pierwszej
  raty, marżę w punktach procentowych, typ rat oraz wybrany wskaźnik.
- **FR-002**: System MUST obsługiwać wskaźniki POLSTR 1M i WIBOR 3M z ich
  seriami wartości okresowych.
- **FR-003**: System MUST obliczać oprocentowanie okresu jako wartość wskaźnika
  powiększoną o marżę.
- **FR-004**: System MUST aktualizować POLSTR 1M co miesiąc w dniu raty, a
  WIBOR 3M co kwartał zgodnie z seriami wartości.
- **FR-005**: System MUST stosować ostatnią znaną wartość wskaźnika po ostatnim
  wpisie serii.
- **FR-006**: System MUST obliczać raty równe i malejące oraz odsetki proste
  w okresie bez kapitalizacji w ramach miesiąca.
- **FR-007**: System MUST zaokrąglać kwoty do grosza w sposób zapewniający, że
  suma części kapitałowych jest równa kwocie kredytu.
- **FR-008**: System MUST obsługiwać nadpłaty z wyborem trybu „obniż ratę” albo
  „skróć okres” oraz uwzględniać je w dalszym harmonogramie.
- **FR-009**: System MUST udostępnić wynik zawierający numer i datę raty,
  część kapitałową, część odsetkową, ratę, saldo po spłacie oraz sumę
  odsetek za cały okres.
- **FR-010**: System MUST umożliwić użytkownikowi uruchomienie obliczenia
  i prezentować ratę pierwszą, ratę ostatnią, sumę odsetek oraz pełną tabelę.
- **FR-011**: System MUST umożliwić eksport pełnej tabeli harmonogramu do CSV
  po stronie przeglądarki.
- **FR-012**: System MUST zwracać czytelny komunikat błędu dla niepoprawnych
  lub niekompletnych parametrów i nie może prezentować wyniku pozornie
  poprawnego.
- **FR-013**: System MUST nie uwzględniać składania dziennych stawek POLSTR
  wstecz za okres odsetkowy w wersji MVP.

### Key Entities *(include if feature involves data)*

- **Parametry kredytu**: kwota, liczba rat, data pierwszej raty, marża, typ
  raty i wybrany wskaźnik.
- **Seria wskaźnika**: uporządkowane wartości wskaźnika z datą początku ich
  obowiązywania oraz informacją o częstotliwości zmian.
- **Nadpłata**: miesiąc, kwota i tryb zastosowania; zmienia saldo oraz dalszy
  przebieg harmonogramu.
- **Rata**: numer, data, część kapitałowa, część odsetkowa, łączna kwota raty
  i saldo po spłacie.
- **Harmonogram**: uporządkowana lista rat oraz suma odsetek za cały okres.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Użytkownik może przejść od wprowadzenia poprawnych parametrów do
  wyświetlenia wyniku w czasie krótszym niż 10 sekund.
- **SC-002**: Dla liczby kontrolnej system wyświetla pierwszą ratę
  2 494,72 zł i ostatnią ratę 2 492,53 zł, z tolerancją 0,05 zł.
- **SC-003**: Dla każdego poprawnego harmonogramu suma części kapitałowych
  różni się od kwoty kredytu o 0,00 zł po zaokrągleniu.
- **SC-004**: 100% poprawnych obliczeń uwzględnia zmianę wskaźnika, jeśli
  przypada ona na okres objęty harmonogramem.
- **SC-005**: Użytkownik może znaleźć ratę pierwszą, ratę ostatnią, sumę
  odsetek i dowolny wiersz tabeli bez dodatkowego obliczania danych.
- **SC-006**: Użytkownik może wyeksportować 100% wierszy wyświetlonego
  harmonogramu do pliku CSV.

## Assumptions

- Użytkownikiem MVP jest doradca bankowy lub osoba analizująca pojedynczy
  kredyt; logowanie i współdzielenie zapisanych kalkulacji są poza zakresem.
- Dane wskaźników dostarczone z produktem są przykładowe i obowiązują zgodnie
  z ich datami; użytkownik nie edytuje ich w formularzu.
- Kwoty prezentowane użytkownikowi są w złotych z dwoma miejscami po przecinku,
  a wewnętrzna reprezentacja i miejsce zaokrąglenia pozostają spójne z zasadami
  projektu.
- Jedna nadpłata może być przypisana do miesiąca; wiele nadpłat w różnych
  miesiącach jest obsługiwane jako lista.
- Wersja MVP nie obejmuje RRSO, rekompensaty za nadpłatę, okresowo stałej
  stopy ani składania dziennych stawek POLSTR.
- Interfejs i obliczenia są dostępne w języku polskim, bez potrzeby obsługi
  innych wersji językowych.
