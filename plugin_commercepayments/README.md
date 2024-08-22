#  plugin\_commercepayments: Storefront Reference Architecture (SFRA)

This is the repository for the plugin\_commercepayments plugin. This plugin enhances the app\_storefront\_base cartridge by providing payment functionality via Stripe, including the following capabilities:

* Shoppers can checkout with Express Checkout from product details, minicart, cart and checkout.
* Multi-step checkout is integrated with Stripe payments.

For information on setting up Salesforce Payments, see [Integrating Salesforce Payments with the Stripe Platform](https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2Fcontent%2Fb2c_commerce%2Ftopics%2Fsalesforce_payments%2Fb2c_salesforce_payments.html)

# The latest version

The latest Salesforce Payments version is 5.0.0

# Compatibility

| Salesforce Payments Plugin | SFRA | B2C Platform | Compatibility Mode | Comments |
| :--- | :--- |:-------------| :--- | :--- |
| [1.0.0](https://github.com/SalesforceCommerceCloud/plugin_commercepayments/releases/tag/v1.0.0) | 5.2.0 | 21.1         | 19.10 |
| [1.0.1](https://github.com/SalesforceCommerceCloud/plugin_commercepayments/releases/tag/v1.0.1) | 5.2.0 | 21.1         | 19.10 |
| [2.0.0](https://github.com/SalesforceCommerceCloud/plugin_commercepayments/releases/tag/v2.0.0) | 6.0.0 | 21.6         | 19.10 |
| [3.0.0](https://github.com/SalesforceCommerceCloud/plugin_commercepayments/releases/tag/v3.0.0) | 6.0.0 | 21.8         | 19.10 |
| [3.1.0](https://github.com/SalesforceCommerceCloud/plugin_commercepayments/releases/tag/v3.1.0) | 6.0.0 | 21.10        | 19.10 |
| [4.0.0](https://github.com/SalesforceCommerceCloud/plugin_commercepayments/releases/tag/v4.0.0) | 6.0.0 | 22.2         | 19.10 |
| [4.1.0](https://github.com/SalesforceCommerceCloud/plugin_commercepayments/releases/tag/v4.1.0) | 6.0.0 | 22.5         | 19.10 |
| [4.2.0](https://github.com/SalesforceCommerceCloud/plugin_commercepayments/releases/tag/v4.2.0) | 6.0.0 | 22.6         | 19.10 |
| ~~4.3.0~~ | 6.0.0 | 22.9         | 19.10 | DO NOT Use. Use 4.4.0 instead |
| [4.4.0](https://github.com/SalesforceCommerceCloud/plugin_commercepayments/releases/tag/v4.4.0) | 6.0.0 | 22.9         | 19.10 |
| [4.5.0](https://github.com/SalesforceCommerceCloud/plugin_commercepayments/releases/tag/v4.5.0) | 6.0.0 | 23.2         | 19.10 |
| [5.0.0](https://github.com/SalesforceCommerceCloud/plugin_commercepayments/releases/tag/v5.0.0) | 6.0.0 | 23.4         | 19.10 |

# Cartridge Path Considerations
The plugin\_commercepayments plugin requires the app\_storefront\_base cartridge. In your cartridge path, include the cartridges in the following order:

```
plugin_commercepayments:app_storefront_base
```

To use plugin_commercepayments with other SFRA plugin cartridges, See the README in plugin_cartridge_merge.

# Getting Started

1. Clone this repository. (The name of the top-level folder is plugin\_commercepayments.)
2. In the top-level plugin\_commercepayments folder, enter the following command: `npm install`. (This command installs all of the package dependencies required for this plugin.)
3. In the top-level plugin\_commercepayments folder, edit the paths.base property in the package.json file. This property should contain a relative path to the local directory containing the Storefront Reference Architecture repository. For example:
```
"paths": {
    "base": "../storefront-reference-architecture/cartridges/app_storefront_base/"
}
```
**Note:** Ensure the local directory contains the version of the Storefront Reference Architecture you intend to use in your cartridge path.

4. In the top-level plugin\_commercepayments folder, enter the following command: `npm run compile:js && npm run compile:scss && npm run resolve:isml` or `npm run build` which will compile the JS, SCSS and resolve ISML files.

5. In the top-level plugin\_commercepayments folder, enter the following command: `npm run uploadCartridge`

For information on Getting Started with SFRA, see [Get Started with SFRA](https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2Fcontent%2Fb2c_commerce%2Ftopics%2Fsfra%2Fb2c_sfra_setup.html).

# NPM scripts
Use the provided NPM scripts to compile and upload changes to your sandbox.

## Compiling your application

* `npm run compile:scss` - Compiles all scss files into css.
* `npm run compile:js` - Compiles all js files and aggregates them.
* `npm run resolve:isml` - Copies templates needed from the SFRA base cartridge to plugin_commercepayments/cartridge/templates/default/_base

**Note:** The plugin cartridge must be compiled after compiling storefront-reference-architecture (SFRA base) cartridge.

## Linting your code

`npm run lint` - Execute linting for all JavaScript and SCSS files in the project.

## Watching for changes and uploading

`npm run watch:static` - Watches js and scss files for changes, recompiles them and uploads result to the sandbox. Requires a valid dw.json file at the root that is configured for the sandbox to upload.

`npm run watch:cartridge` - Watches all cartridge files (except for static content) and uploads it to sandbox. Requires a valid dw.json file at the root that is configured for the sandbox to upload.

`npm run watch` - Watches everything and recompiles (if necessary) and uploads to the sandbox. Requires a valid dw.json file at the root that is configured for the sandbox to upload.
