# plugin_datalayer

Concept to add data tracking into SFRA.


This plugin
* provides an implementation blueprint on website data tracking (server side data and client events)
* creates a sfra datalayer which could be used when connecting to other tracking providers like GTM, Tealium, ...


# SFRA Version
The plug-in is using version 6.3.0 of SFRA. 
But it should be compatible with older versions too, as there are no specific things being used from that particular version.


# Cartridge Path Considerations
The plugin\_datalyer cartridge needs to be installed in front of the app_storefront_base as it overloads a few templates.


# Installation

A set of cli command were added to allow a quick setup with SFRA.

Execute the following:
* `npm install`
* `npm run sfra:init`
* `npm run sfra:copy`

For now upload the cartridges using VSCode + Prophet, Studio, SFCC-CI or any other webdav enabled uploader.

