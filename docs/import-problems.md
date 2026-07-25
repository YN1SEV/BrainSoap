# unsere Import Probleme
eine Dokumentation
## Das Problem™
`manifest.json` war das Hauptproblem
weil Firefox komisch ist, funktionieren imports nicht out of the box.
unsere Methode um "imports" zu machen war sie in der richtigen Reihenfolge im manifest zu listen und aufs beste zu hoffen.
Dabei gibt es ein Paar Probleme!
die Form war ca. so

```
...
"background": {
    "scripts": [
      "src/utils/utils.js",
      "src/utils/defaults.js",
      "src/browser_handlers/storage_manager.js",
      "src/browser_handlers/tab_handler.js",
      "src/browser_handlers/actions_handler.js",
      "src/background/background.js"
    ],
}
...

```

1. es sind in der Standartform keine Imports/exports möglich (mit dem Fehler "imports/exports only at the top-level of a module")
2. demnach folgend konnten Scripte nicht wirklich zwischen Frontend und backend geteilt werden.
    wenn man versucht die Scripte im fronted zu importieren braucht man ein exports und dann wirft das backend wieder ein Fehler und wenn man wiederum sagt dann importier ich's auch da dann schmeissts nochmal ein Fehler?

genau ein gewaltiger Haufen Scheiße
## Lösung
1. weinen
2. manifest umstrukturieren.
    ```
    ...
    "background": {
    "scripts": [
        "src/background/background.js"
    ],
    "type": "module"
    }
    ...
    ```
    indem das Script als type module deklariert wurden hat der Browser es erlaubt imports durchzuführen.
3. import mit Dateiendungen machen.
    ein standard js import sieht ca. so aus `import { custom_storage } from "../browser_handlers/storage_manager";`
    damit Firefox es einem erlaubt `.js` Dateien zu importieren muss das aber so aussehen `import { custom_storage } from "../browser_handlers/storage_manager.js";
4. für alle verwendeten Dateien widerhohlen.