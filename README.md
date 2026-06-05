# BrainSoap
--- --- --- --- --- --- --- --- --- --- --- --- --- ---
Browser extension to help you avoid extended scrolling by blocking your screen or redirecting you to a more productive site.

# Notice
This project was created as a learning Project for DHBW Stuttgart. 

# Features
- tracking how much time you spend on diffrent sites
- actions when a limit is exceded
    - sending you a message
    - creating a popup 
    - redirecting you to a diffrent URL
    - also in arbitrary combinations

## planned Features 
>[!info]
> #### aka TO-DO list

- actual ui for settings
- image popup - not just the generic one
- better looking blocker popup
- adaptive ui 
- caching for browser storage




# Related repositorys
much thanks to [MDN](https://github.com/mdn/webextensions-examples.git) and [fnya](https://github.com/fnya/firefox-extensions-template.git) for providing examples. 
this was a great help in understanding how to create an extension and what you can do with them.


# Installation

## for contributing
1. pull this repo to your local machine.
2. get the mentioned repos for examples
3. more material will follow soon. This project is not complete yet, but it's a start!

## via temporary addon (firefox)
1. type in your url bar about:debugging 
2. go to This firefox
3. click load temporary Add-on
4. chose the manifest.json file from this repo. 
5. that should be it. you can now try the extension.


# Dev-Notes
- please abstract the browser interaction layer by topic. this makes it a lot easier to maintain multiple browsers
- javascript sucks but please make the code readable
- variables are treated diffrently by the storage manager from settings because settings are synced. variables are kept local to keep traffic low. 
- local ai inline completion is awesome!
- manifest_version in manifest.json is about the manifest protocol version, dont change it. 
- the scripts in the manifest are loaded in order how they are listed. plan accordingly
- when getting a url from the user sanitize it to turn it into the url id (see utils.js)
- maybe rework the settings loading option fallback,- right now it's kinda bad.
- Folder structure: 
    ```tree
    BrainSoap
    ├── assets
    │   ├── icons
    │   │   ├── icon16.png
    │   │   ├── icon32.png
    │   │   ├── icon48.png
    │   │   ├── icon128.png
    │   │   └── credits.txt
    │   ├── nav
    │   └── visuals
    ├── docs
    │   └── Ideas.md
    ├── src
    │   ├── background
    │   │   └── background.js
    │   ├── blocker_popup
    │   │   ├── blocker.js
    │   │   └── styles.css
    │   ├── browser_handlers
    │   │   ├── actions_handler.js
    │   │   ├── storage_manager.js
    │   │   └── tab_handler.js
    │   ├── full_page
    │   │   ├── charts.js
    │   │   ├── dashboard_nav.js
    │   │   ├── dashboard.css
    │   │   ├── dashboard.html
    │   │   ├── dashboard.js
    │   │   └── widgets_stats.js
    │   ├── quick_page
    │   │   ├── popup.css
    │   │   ├── popup.html
    │   │   └── popup.js
    │   ├── utils
    │   │   ├── defaults.js
    │   │   └── utils.js
    │   └── config.js
    ├── .gitignore
    ├── Ideas.md
    └── README.md
    ```
- only add a feature to the list when it is done.
