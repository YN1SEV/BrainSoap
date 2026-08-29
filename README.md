# BrainSoap
--- --- --- --- --- --- --- --- --- --- --- --- --- ---
A Browser extension to help you avoid extended scrolling by blocking your screen or redirecting you to a more productive site.

>[!NOTE]
> This project was created as a learning Project for DHBW Stuttgart.

## Features
- tracking how much time you spend on different sites
- actions when a limit is exceeded
    - sending you a message
    - creating a popup
    - showing an image with the popup
    - redirecting you to a different URL
    - also in arbitrary combinations

### planned Features

>[!NOTE]
>**aka TO-DO list**

- custom image popup

## Related repositories

Much thanks to [MDN](https://github.com/mdn/webextensions-examples.git) and [fnya](https://github.com/fnya/firefox-extensions-template.git) for providing examples.
this was a great help in understanding how to create an extension and what you can do with them.

## Installation

### Opera GX
1. run `bun run build` from the `BrainSoap` folder
2. open Opera GX and go to `opera://extensions`
3. enable developer mode
4. click load unpacked and choose `BrainSoap/dist/opera-gx`
5. the extension should now be available in Opera GX

### Opera GX release build
1. run `bun run build` from the `BrainSoap` folder
2. zip the contents of `BrainSoap/dist/opera-gx` if you want a distributable archive later
3. load the unpacked folder in Opera GX for local testing

### via release
1. head over to the releases
2. select one you like (we recommend the latest)
3. select the .xpi file
4. allow firefox to install the addon 
5. you are ready to use the extension

### via .xpi file
1. get a zip file from a release
2. open Firefox and go to `about:addons`
3. select the gear (tools for add-ons)
4. select install add-on from file
5. you are ready to use the extension

### via temporary addon (firefox)
> [!NOTE]
> This will be gone when you restart your browser

1. type in your url bar `about:debugging`
2. go to This Firefox
3. click load temporary Add-on
4. choose the `manifest.json` file from this repo. or the .xpi file from the release
5. that should be it. you can now try the extension.

### installing from source
> [!NOTE]
> this is not the way Firefox intended extensions to be installed

you can only install from source if you have a Firefox build which supports not certified extensions. This is for example a Firefox Developer build.
This section will roughly describe how to install an unsigned extension on such a Build.

1. type in `about:config` in your URL bar.
2. disable the setting `xpinstall.signatures.required`. This will allow you to install unsigned extensions.
> [!CAUTION]
> changing these settings can mess up your browser pretty bad.
> don't go changing things if you don't know what it does.
3. download the extension files from this repository
4. create a zip file of the folders `assets`, `src` and the file `manifest.json`
5. follow the instructions from `installing via zip file`

### build output

The Opera GX build script creates `BrainSoap/dist/opera-gx` with the same extension root layout that the manifest expects:

- `manifest.json`
- `assets/`
- `src/`

That folder can be loaded directly as an unpacked extension in Opera GX.

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
│   ├───config
│   ├───content
│   ├───services
│   ├───ui
│   │   ├───dashboard
│   │   │   ├───nav
│   │   │   ├───rules
│   │   │   ├───settings
│   │   │   ├───stats
│   │   │   └───vendor
│   │   └───popup
│   └───utils
└───tests
```

## Testing process
web-ext and unit tests are performed on any commit to the main or dev Branch
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
the Results can strongly depend on the machine.

### Manual Tests
manual tests ensure all systems work together as a whole. They are performed regularly during development and before release.
