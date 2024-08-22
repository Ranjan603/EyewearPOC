# plugin\_instorepickup: Storefront Reference Architecture (SFRA)

This is the repository for the plugin\_instorepickup plugin. This plugin enhances the app\_storefront\_base cartridge by providing "Buy Online Pickup In Store" functionality, including the following capabilities:

* Shoppers can search for stores by geographical radius.
* Shoppers can select a store for pickup.
* Shoppers can change the selected store by initiating another search.
* Shoppers can purchase multiple products and have different products delivered to different addresses, including to a store.
* Shoppers can review their order histories to see where orders were delivered.
* Shoppers can review order receipts and summaries to see where products were delivered.

# Cartridge Path Considerations
The plugin\_instorepickup plugin requires the app\_storefront\_base cartridge. In your cartridge path, include the cartridges in the following order:

```
plugin_instorepickup:app_storefront_base
```

# Template Conflicts
  
Each template in the following table is present in multiple cartridges. If the file exists in the app\_storefront\_base cartridge and in this plugin cartridge, the plugin template overrides the base template. The presence of a template file in multiple plugin cartridges indicates a conflict that you have to resolve in a customization cartridge. However, if you are using only one of the conflicting plugin cartridges, no action is necessary.
 
| Template File | Cartridge | Location |
| :--- | :--- | :--- |
|cartProductCard.isml|app\_storefront\_base|cartridge/templates/default/cart/productCard/cartProductCard.isml|
|cartProductCard.isml|plugin\_giftregistry|cartridge/templates/default/cart/productCard/cartProductCard.isml|
|cartProductCard.isml|plugin\_instorepickup|cartridge/templates/default/cart/productCard/cartProductCard.isml|
|cartShippingMethodSelection.isml|app\_storefront\_base|cartridge/templates/default/cart/cartShippingMethodSelection.isml|
|cartShippingMethodSelection.isml|plugin\_instorepickup|cartridge/templates/default/cart/cartShippingMethodSelection.isml|
|productAvailability.isml|app\_storefront\_base|cartridge/templates/default/product/components/productAvailability.isml|
|productAvailability.isml|plugin\_giftregistry|cartridge/templates/default/product/components/productAvailability.isml|
|productAvailability.isml|plugin\_instorepickup|cartridge/templates/default/product/components/productAvailability.isml|
|productAvailability.isml|plugin\_wishlists|cartridge/templates/default/product/components/productAvailability.isml|
|shipmentCard.isml|app\_storefront\_base|cartridge/templates/default/checkout/shipping/shipmentCard.isml|
|shipmentCard.isml|plugin\_instorepickup|cartridge/templates/default/checkout/shipping/shipmentCard.isml|
|shipmentSelectorOptions.isml|app\_storefront\_base|cartridge/templates/default/checkout/shipping/shipmentSelectorOptions.isml|
|shipmentSelectorOptions.isml|plugin\_instorepickup|cartridge/templates/default/checkout/shipping/shipmentSelectorOptions.isml|
|shippingCard.isml|app\_storefront\_base|cartridge/templates/default/checkout/shipping/shippingCard.isml|
|shippingCard.isml|plugin\_instorepickup|cartridge/templates/default/checkout/shipping/shippingCard.isml|
|shippingCardShippingAddress.isml|app\_storefront\_base|cartridge/templates/default/checkout/shipping/shippingCardShippingAddress.isml|
|shippingCardShippingAddress.isml|plugin\_instorepickup|cartridge/templates/default/checkout/shipping/shippingCardShippingAddress.isml|
|shippingTitle.isml|app\_storefront\_base|cartridge/templates/default/account/order/shippingTitle.isml|
|shippingTitle.isml|app\_storefront\_base|cartridge/templates/default/checkout/confirmation/shippingTitle.isml|
|shippingTitle.isml|app\_storefront\_base|cartridge/templates/default/checkout/shipping/shippingTitle.isml|
|shippingTitle.isml|plugin\_instorepickup|cartridge/templates/default/account/order/shippingTitle.isml|
|shippingTitle.isml|plugin\_instorepickup|cartridge/templates/default/checkout/confirmation/shippingTitle.isml|
|shippingTitle.isml|plugin\_instorepickup|cartridge/templates/default/checkout/shipping/shippingTitle.isml|

# Getting Started

1. Clone this repository. (The name of the top-level folder is plugin\_instorepickup.)
2. In the top-level plugin\_instorepickup folder, enter the following command: `npm install`. (This command installs all of the package dependencies required for this plugin.)
3. In the top-level plugin\_instorepickup folder, edit the paths.base property in the package.json file. This property should contain a relative path to the local directory containing the Storefront Reference Architecture repository. For example:
```
"paths": {
    "base": "../storefront-reference-architecture/cartridges/app_storefront_base/"
  }
```
4. In the top-level plugin\_instorepickup folder, enter the following command: `npm run compile:js && npm run compile:scss`
5. In the top-level plugin\_instorepickup folder, enter the following command: `npm run uploadCartridge`

# NPM scripts
Use the provided NPM scripts to compile and upload changes to your Sandbox.

## Compiling your application

* `npm run compile:scss` - Compiles all scss files into css.
* `npm run compile:js` - Compiles all js files and aggregates them.

## Linting your code

`npm run lint` - Execute linting for all JavaScript and SCSS files in the project. You should run this command before committing your code.

## Watching for changes and uploading

`npm run watch:static` - Watches js and scss files for changes, recompiles them and uploads result to the sandbox. Requires a valid dw.json file at the root that is configured for the sandbox to upload.

`npm run watch:cartridge` - Watches all cartridge files (except for static content) and uploads it to sandbox. Requires a valid dw.json file at the root that is configured for the sandbox to upload.

`npm run watch` - Watches everything and recompiles (if necessary) and uploads to the sandbox. Requires a valid dw.json file at the root that is configured for the sandbox to upload.

#Testing
## Running unit tests

You can run `npm test` to execute all unit tests in the project. Run `npm test --coverage` to get coverage information. Coverage will be available in `coverage` folder under root directory.

## Running integration tests (assiming we have instorepickup and base cartridges configured)

* This cartridge's Integration tests are located in ../plugin_instorepickup/test/integration
* Base cartridge's Integration tests are located in ../storefront-reference-architecture/test/integration
* All Tests in both cartridges should run, if the same file name and same tests name has been found, the overlay cartridge test will run, the same test in base will be ignored.

To run integration tests you can use the following command:

```
npm run test:integration
```

**Note:** Please note that short form of this command will try to locate URL of your sandbox by reading `dw.json` file in the root directory of your project. If you don't have `dw.json` file, integration tests will fail.
sample dw.json file (this file needs to be in the root of your project)
{
    "hostname": "devxx-sitegenesis-dw.demandware.net"
}

You can also supply URL of the sandbox on the command line:

```
npm run test:integration -- --baseUrl devxx-sitegenesis-dw.demandware.net
```

