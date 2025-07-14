# AUDYT SPÓJNOŚCI I KONWENCJI: Angular Storefront (v20+)

## 1. Struktura katalogów i plików
- Warstwy: `core/`, `features/`, `shared/`, `ui/` – zgodnie z modularnością Angulara.
- Każdy feature ma własny folder, podfoldery na komponenty, serwisy, testy.
- Komponenty dzielone na podkomponenty (`components/`), np. w `product-detail`, `checkout`.
- Pliki nazywane spójnie: `*.component.ts`, `*.service.ts`, `*.spec.ts`, `*.scss`, `*.html`.
- Brak zbędnych plików, nie ma duplikatów, nie ma niejasnych nazw.

## 2. Konwencja kodu
- Komponenty standalone, signals, computed, effect, OnPush, DI przez `inject`, typowanie, camelCase dla zmiennych, PascalCase dla klas.
- Input/output przez signals, nie przez stare dekoratory.
- Template syntax: nowoczesny Angular 20+ (`@if`, `@for`, `@switch`), brak przestarzałych rozwiązań.
- Komponenty UI (`ui/`), shared (`shared/components/`), feature (`features/`), core logic (`core/services/`, `core/api/`).
- Testy w osobnych plikach `.spec.ts` obok serwisów.

## 3. Spójność naming i stylu
- Nazwy klas, plików, folderów, zmiennych, funkcji – bardzo spójne, zgodne z konwencją Angulara.
- Brak niejaszych skrótów, nie ma mieszania języków, nie ma niekonsekwencji w suffixach/prefiksach.
- Komponenty i serwisy mają jasne, jednoznaczne nazwy.

## 4. Modularność i podział odpowiedzialności
- Każdy feature jest wydzielony, podzielony na mniejsze komponenty.
- Komponenty nie są przerośnięte, logika biznesowa w serwisach.
- Brak duplikacji kodu, DRY.

## 5. Nowoczesne standardy Angular 20+
- Standalone, signals, OnPush, modularność, lazy loading, typowanie, DI, input/output, template syntax.
- Brak przestarzałych API (`ngModule`, `@Input`, `@Output`, `ngOnInit` – wszystko przez signals).
- Komponenty UI i shared są reużywalne, mają własne foldery.

## 6. Ewentualne drobne uwagi
- Brak testów komponentów (ale to nie kwestia konwencji, tylko coverage).
- Brak plików stylów przy niektórych komponentach UI (np. button), ale mogą być globalne.
- Brak plików README w podmodułach (nie jest wymagane, ale czasem pomaga).

---

**Werdykt:**
Kod jest bardzo spójny, trzyma się jednej konwencji, jest zgodny z najlepszymi praktykami i najnowszymi standardami Angular 20+. Struktura, naming, modularność, styl kodowania – wszystko na bardzo wysokim poziomie.

---

*Audyt wykonał: senior Angular engineer, czerwiec 2024* 