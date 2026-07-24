# BrainSoap
--- --- --- --- --- --- --- --- --- --- --- --- --- ---
Browser extension to help you avoid extended scrolling by blocking your screen or redirecting you to a more productive site.

>[!NOTE]
> This project was created as a learning Project for DHBW Stuttgart. 

## Features
- tracking how much time you spend on diffrent sites
- actions when a limit is exceded
    - sending you a message
    - creating a popup 
    - showing an image with the popup
    - redirecting you to a diffrent URL
    - also in arbitrary combinations

### planned Features 

>[!NOTE]
>
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

### installing via zip file
not yet supported, the process to get an extension verified takes too long/is too complicated

### installing from scource
>[!NOTE] 
>
> this is not the way firefox intended extensions to be installed

you can only install from scource if you have a Firefox build which supports not certified extensions. This is for example a Firefox Developer build.
This section will roughly describe how to install an unsigned extension on such a Build.

1. type in `about:config` in your URL bar.
2. disable the setting `xpinstall.signatures.required`. This will allow you to install unsinged extensions.
    > [!CAUTION]
    > changeing these settings can mess up your browser pretty bad. 
    > dont go changing things if you dont know what it does.

3. download the extension files from this repository
4. create a zip file of the folders `assets`, `src` and the file `manifest.json`
5. follow the instructions from `installing via zip file` 

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
all code is verified with [web-ext](https://github.com/mozilla/web-ext). 
web-ext is a command line tool that allows you to test your extension locally. 
it also provides warnings for unsave code like inproperly sanitized variables. 

### unit tests
unit tests are applied to important central functionalitys, like the storage manager.
for browser dependent components a mock system is created to simulate actual browser behavior. 
This allows testing the components without installing the extension in an actual browser.

### stress tests
are perfomed on an installed installation to test how much it can handle without slowing down.
the Results can strongly depend on the mashine.

### Manual Tests
manual tests enshure all system work together as a whole.
