# AdGuard Browser Assistant

## Build
* `yarn install`
* `yarn dev` / `yarn beta` / `yarn release`

Builds will be located in the `build` directory

## Lint
* `yarn lint`

## Tests
* `yarn test`

## Localisation
* `setup your project locales, directories in the file tasks/locales.js`
* `yarn locales:upload` used to upload base `en` locale
* `yarn locales:download` run to download and save all locales

## CRX Builds
* Put the repository with the `certificate.pem` file to the project root directory. 
* `yarn crx` create web extension files for Chromium and Google Chrome browsers. You must have the `certificate.pem` to run this command

## XPI Builds
* Put the repository with the `mozilla_credentials.json` file containing `apiKey` and `apiSecret` properties with the values of type string to the project root directory. 
* `yarn xpi` create web extension files for Mozilla Firefox browser. You must have the `mozilla_credentials.json` to run this commands

