/* eslint-disable no-console */
const { promises: fs } = require('fs');
const path = require('path');
const Crx = require('crx');
const chalk = require('chalk');
const {
    CHROME_UPDATE_URL, MANIFEST_NAME, BROWSER_TYPES, BUILD_PATH, CHANNEL_MAP, CERTIFICATE_PATHS,
    CHROME_UPDATE_CRX, CHROME_UPDATER_FILENAME, CRX_NAME,
} = require('./consts');
const { updateManifest } = require('./helpers');
const config = require('../package');

const { CHANNEL_ENV } = process.env;
const { outputPath } = CHANNEL_MAP[CHANNEL_ENV];

const WRITE_PATH = path.resolve(__dirname, BUILD_PATH, outputPath);
const LOAD_PATH = path
    .resolve(__dirname, BUILD_PATH, outputPath, BROWSER_TYPES.CHROME);
const MANIFEST_PATH = path.resolve(
    __dirname, BUILD_PATH, outputPath, BROWSER_TYPES.CHROME, MANIFEST_NAME
);

const getPrivateKey = async () => {
    const certificatePath = CERTIFICATE_PATHS[CHANNEL_ENV];
    try {
        const privateKey = await fs.readFile(certificatePath);
        console.log(chalk.greenBright(`\nThe certificate is read from ${certificatePath}\n`));
        return privateKey;
    } catch (error) {
        console.error(chalk.redBright(`Can not create ${CRX_NAME} - the valid certificate is not found in ${certificatePath} - ${error.message}\n`));
        throw error;
    }
};

/**
 * Writes additionalProps to the chromeManifest
 *
 * @param chromeManifest {object}
 * @param [additionalProps] {object} - props to add in manifest
 */
const updateChromeManifest = async (chromeManifest, additionalProps) => {
    try {
        const updatedManifest = updateManifest(chromeManifest, additionalProps);
        await fs.writeFile(MANIFEST_PATH, updatedManifest);

        const info = chromeManifest && additionalProps
            ? `is updated with properties ${JSON.stringify(additionalProps)} to create ${CRX_NAME} at ${MANIFEST_PATH}`
            : 'is reset';

        console.log(chalk.greenBright(`${MANIFEST_NAME} ${info}\n`));
    } catch (error) {
        console.error(chalk.redBright(`Error: Can not update ${MANIFEST_NAME} - ${error.message}\n`));
        throw error;
    }
};

const createCrx = async (loadedFile) => {
    try {
        const crxBuffer = await loadedFile.pack();
        const writePath = path.resolve(WRITE_PATH, CRX_NAME);
        await fs.writeFile(writePath, crxBuffer);
        console.log(chalk.greenBright(`${CRX_NAME} saved to ${WRITE_PATH}\n`));
    } catch (error) {
        console.error(chalk.redBright(`Error: Can not create ${CRX_NAME} - ${error.message}\n`));
        throw error;
    }
};

const createXml = async (crx) => {
    const xmlBuffer = await crx.generateUpdateXML();
    const writeXmlPath = path.resolve(WRITE_PATH, CHROME_UPDATER_FILENAME);
    await fs.writeFile(writeXmlPath, xmlBuffer);
    console.log(chalk.greenBright(`${CHROME_UPDATER_FILENAME} saved to ${WRITE_PATH}\n`));
};

const generateChromeFiles = async () => {
    try {
        const chromeManifest = await fs.readFile(MANIFEST_PATH);
        const PRIVATE_KEY = await getPrivateKey();

        const crx = new Crx({
            codebase: CHROME_UPDATE_CRX,
            privateKey: PRIVATE_KEY,
            publicKey: config.name,
        });

        // Add to the chrome manifest `update_url` property
        // which is to be present while creating the crx file
        await updateChromeManifest(chromeManifest, { update_url: CHROME_UPDATE_URL });
        const loadedFile = await crx.load(LOAD_PATH);
        await createCrx(loadedFile);
        await createXml(crx);
        // Delete from the chrome manifest `update_url` property
        // after the crx file has been created - reset the manifest
        await updateChromeManifest(chromeManifest);
    } catch (error) {
        console.error(chalk.redBright(error.message));
        console.error(error);

        // Fail the task execution
        process.exit(1);
    }
};

generateChromeFiles();
