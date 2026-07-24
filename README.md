# BrainSoap
--- --- --- --- --- --- --- --- --- --- --- --- --- ---
Browser extension to help you avoid extended scrolling by blocking your screen or redirecting you to a more productive site.

>[!NOTE]
> This project was created as a learning Project for DHBW Stuttgart.

## Features
- tracking how much time you spend on different sites
- actions when a limit is exceed
    - sending you a message
    - creating a popup
    - showing an image with the popup
    - redirecting you to a different URL
    - also in arbitrary combinations

### planned Features

>[!NOTE]
>**aka TO-DO list**

- custom image popup

## Related repositorys

Much Tanks to [MDN](https://github.com/mdn/webextensions-examples.git) and [fnya](https://github.com/fnya/firefox-extensions-template.git) for providing examples.
this was a great help in understanding how to create an extension and what you can do with them.

## Installation

### for contributing
1. pull this repo to your local machine.
2. get the mentioned repos for examples
3. more material will follow soon. This project is not complete yet, but it's a start!

### via temporary addon (firefox)
1. type in your url bar `about:debugging`
2. go to This Firefox
3. click load temporary Add-on
4. chose the `manifest.json` file from this repo.
5. that should be it. you can now try the extension.
  
### installing via zip file
1. get a zip file from this repo
2. open Firefox and go to `about:addons`
3. select the gear (tools for add-ons)
4. select install add-on from file
5. you are ready to use the extension

### installing from source
> [!NOTE]
>
> this is not the way Firefox intended extensions to be installed

you can only install from source if you have a Firefox build which supports not certified extensions. This is for example a Firefox Developer build.
This section will roughly describe how to install an unsigned extension on such a Build.

1. type in `about:config` in your URL bar.
2. disable the setting `xpinstall.signatures.required`. This will allow you to install unsigned extensions.
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
│   ├───icons
│   ├───misc
│   ├───nav
│   └───visuals
├───docs
├───src
│   ├───background
│   ├───browser
│   ├───content
│   ├───dev
│   │   └───fixtures
│   ├───services
│   ├───ui
│   │   ├───dashboard
│   │   │   ├───dev
│   │   │   ├───imported
│   │   │   ├───nav
│   │   │   ├───rules
│   │   │   ├───settings
│   │   │   └───stats
│   │   └───popup
│   └───utils
└───tests
```

## Testing process

### web-ext
all code is verified with [web-ext](https://github.com/mozilla/web-ext).
web-ext is a command line tool that allows you to test your extension locally.
it also provides warnings for unsafe code like improperly sanitized variables.

### unit tests
unit tests are applied to important central functionality, like the storage manager.
for browser dependent components a mock system is created to simulate actual browser behavior.
This allows testing the components without installing the extension in an actual browser.

### stress tests
are performed on an installed installation to test how much it can handle without slowing down.
the Results can strongly depend on the mashine.

### Manual Tests
manual tests ensure all systems work together as a whole. They are permormed regularly during development and before release.
