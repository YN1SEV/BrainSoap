# unsere Import Probleme
eine Dokumentation

## Das Problem™ 
manifest.json war das hauptproblem
weil firefox komisch ist, funktionieren imports nicht out of the box. 
unsere methode um "imports" zu machen war sie in der richtigen reihenfolge im manifest zu listen und aufs beste zu hoffen.
Dabei giebt es ein Paar Probleme!
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
1. es sind in der Standartform keine Imports/exports möglich (mit dem Fehler "imports/exports only at the toplevel of a module") 
2. demnach folgend konnten scripte nicht wirklich zwischen Frontend und backend geteilt werden. 
    wenn man versucht die scripte im frontend zu importieren braucht man ein exports und dann schmeisst das backend wieder ein fehler und wenn man wiederum sagt dann importier ich's auch da dann schmeissts nochmal ein fehler?

genau ein gewaltiger haufen Scheisse

## Lösung
1. weinen
2. manifest umstrukturieren.
    ```
    ...
    "background": {
    "scripts": [
        "src/utils/utils.js",
        "src/utils/defaults.js",
        "src/browser_handlers/tab_handler.js",
        "src/browser_handlers/actions_handler.js",
        "src/background/background.js"
    ],
    "type": "module"
    }
    ...
    ```
    indem die scripte als type module deklariert wurden hat der Browser es erlaubt imports durchzuführen.
3. import mit Dateiendungen machen. 
    ein standart js import sieht ca. so aus `import { custom_storage } from "../browser_handlers/storage_manager";`
    damit firefox es einem erlaubt js dateien zu importieren muss das aber so aussehen `import { custom_storage } from "../browser_handlers/storage_manager.js";`
