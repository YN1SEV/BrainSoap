# BrainSoap
--- --- --- --- --- --- --- --- --- --- --- --- --- ---
Browser extension to help you avoid extended scrolling by blocking your screen or redirecting you to a more productive site.

## Notice
This project was created as a learning Project for DHBW Stuttgart. 

## Features
- tracking how much time you spend on diffrent sites
- actions when a limit is exceded
    - sending you a message
    - creating a popup 
    - redirecting you to a diffrent URL
    - also in arbitrary combinations

### planned Features 
>[!info]
>**aka TO-DO list**
- custom image popup

## Related repositorys
much thanks to [MDN](https://github.com/mdn/webextensions-examples.git) and [fnya](https://github.com/fnya/firefox-extensions-template.git) for providing examples. 
this was a great help in understanding how to create an extension and what you can do with them.

## Installation

### for contributing
1. pull this repo to your local machine.
2. get the mentioned repos for examples
3. more material will follow soon. This project is not complete yet, but it's a start!

### via temporary addon (firefox)
1. type in your url bar about:debugging 
2. go to This firefox
3. click load temporary Add-on
4. chose the manifest.json file from this repo. 
5. that should be it. you can now try the extension.

### installing permanantly
not yet supported, the process to get an extension verified takes too long/is too complicated

## Folder structure: 
```
BrainSoap
├───assets
│   ├───icons
│   ├───misc
│   ├───nav
│   └───visuals
├───docs
└───src
    ├───background
    ├───browser
    ├───content
    ├───dev
    │   └───fixtures
    ├───services
    ├───ui
    │   ├───dashboard
    │   │   ├───dev
    │   │   ├───imported
    │   │   ├───nav
    │   │   ├───rules
    │   │   ├───settings
    │   │   └───stats
    │   └───popup
    └───utils
```

## Testing process

### web-ext
all code is verified with [web-ext](https://github.com/mozilla/web-ext) 
web-ext is a command line tool that allows you to test your extension locally. 
it also provides warnings for unsave code like inproperly sanitized variables. 

### unit tests
unit tests are applied to important central functionalitys

### Manual Tests
manual tests enshure all system work together as a whole.
