# BrainSoap
Browser extension to help you avoid extended scrolling by blocking your screen or redirecting you to a more productive site.

# Notice
This project was created as a learning Project for DHBW Stuttgart. 

# Related repositorys
much thanks to [MDN](https://github.com/mdn/webextensions-examples.git) and [fnya](https://github.com/fnya/firefox-extensions-template.git) for providing examples. 
this was a great help in understanding how to create an extension and what you can do with them.


# Installation
1.pull this repo to your local machine.
2.get the mentioned repos for examples
3.more material will follow soon. This project is not complete yet, but it's a start!

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


