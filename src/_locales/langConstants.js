/**
 * DO NOT IMPORT IN THIS FILE ANYTHING, BECAUSE IT IS ALSO USED IN EXTENSION CODEBASE
 */

const [twoskyConfig] = require('../../.twosky.json');

const { base_locale: BASE_LOCALE, project_id: PROJECT_ID, languages: LANGUAGES } = twoskyConfig;

const FILENAME = 'messages.json';

module.exports = {
    BASE_LOCALE,
    PROJECT_ID,
    LANGUAGES,
    FILENAME,
};
