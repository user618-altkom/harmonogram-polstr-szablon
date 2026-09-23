# Research: Kalkulator harmonogramu spłat POLSTR

## Algorytm rat równych przy zmiennym wskaźniku

**Decision**: Dla rat równych rata bazowa będzie przeliczana na początku
każdego okresu na podstawie bieżącego salda, liczby pozostałych rat i stopy
wskaźnik + marża. Wartość wskaźnika obowiązująca dokładnie od dnia raty
zostanie użyta w tym okresie.

**Rationale**: Zapewnia aktualizację POLSTR 1M co miesiąc i WIBOR 3M co
kwartał, a także jednoznacznie obsługuje granicę dnia raty. Spełnia model
MVP, który używa wartości okresowej wprost, bez składania stawek dziennych.

**Alternatives considered**: Utrwalanie stopy do kolejnego resetu bez jawnej
reguły granicy dnia oraz składanie dziennych stawek POLSTR. Pierwsza opcja
jest niejednoznaczna, druga jest wyłączona z MVP.

## Algorytm rat malejących

**Decision**: Część kapitałowa raty malejącej będzie równa pozostałemu
kapitałowi podzielonemu przez liczbę pozostałych rat, a część odsetkowa będzie
liczona od aktualnego salda i bieżącej stopy.

**Rationale**: Daje równy podział kapitału, malejące saldo i raty oraz
przewidywalne zachowanie przy zmianie wskaźnika.

**Alternatives considered**: Przeliczanie całej raty jak dla rat równych po
każdym resecie albo naliczanie dzienne. Pierwsza opcja łamałaby oczekiwanie
równego podziału kapitału, druga wykracza poza MVP.

## Nadpłata „obniż ratę”

**Decision**: Nadpłata jest stosowana w wskazanym miesiącu po zaplanowanej
spłacie kapitału i odsetek. Dla kolejnego okresu rata równa jest przeliczana
na podstawie nowego salda i liczby pozostałych rat; przy ratach malejących
nowa część kapitałowa wynika z nowego salda.

**Rationale**: Zachowuje pierwotny termin końcowy i obniża przyszłe raty,
zgodnie z nazwą trybu.

**Alternatives considered**: Zachowanie dotychczasowej raty i skrócenie
okresu — to semantyka drugiego trybu.

## Nadpłata „skróć okres”

**Decision**: Nadpłata jest stosowana po planowej racie, a dotychczasowa rata
pozostaje wartością docelową dla kolejnych okresów. Harmonogram kończy się,
gdy saldo zostanie zamknięte; ostatnia rata jest korygowana do pozostałego
salda i odsetek.

**Rationale**: Zachowuje poziom obciążenia i skraca liczbę rat, jednocześnie
gwarantując brak ujemnego salda.

**Alternatives considered**: Przeliczanie raty i zachowanie terminu końcowego
— odpowiada trybowi „obniż ratę”, a nie skróceniu okresu.

## Walidacja dat i serii

**Decision**: Warstwa wejściowa sprawdzi format i rzeczywistość daty
`YYYY-MM-DD`; domena zaakceptuje datę spoza zakresu serii i użyje pierwszego
znanego wpisu dla dat wcześniejszych oraz ostatniego znanego wpisu dla dat
 późniejszych, zgodnie z zakresem MVP.

**Rationale**: Regex nie odrzuca dat typu 2026-02-31. Jednocześnie kredyt nie
powinien wymagać danych historycznych poza dostarczoną serią, a reguła ostatniej
znanej wartości jest jawnie wymagana.

**Alternatives considered**: Sama walidacja regexem oraz odrzucanie każdej
daty poza zakresem serii. Pierwsza przepuszcza błędne daty, druga ogranicza
użyteczność dostarczonego modelu.

## Kontrakt API

**Decision**: Query string przyjmuje `kwota` w złotych, `marza` w punktach
procentowych, `liczbaRat`, `wskaznik`, `typRat` i `pierwszaRata`. Route
konwertuje złote na grosze i punkty procentowe na ułamek, a domena zwraca
jednoznaczny wynik JSON. Błędy wejścia i domeny są zwracane z polem `blad`
oraz statusem 400; poprawny wynik ma status 200.

**Rationale**: Zachowuje istniejący szkic route i prosty interfejs formularza.
Konwersje pozostają w adapterze, a wszystkie obliczenia finansowe w domenie.

**Alternatives considered**: Przyjmowanie groszy i ułamków w publicznym API
albo zmiana na 422. Obie opcje wymagałyby niepotrzebnej zmiany istniejącego
kontraktu MVP.
