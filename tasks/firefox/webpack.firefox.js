const merge = require('webpack-merge');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipWebpackPlugin = require('zip-webpack-plugin');
const common = require('../webpack.common');
const { updateManifest } = require('../helpers');
const firefoxManifestDiff = require('./manifest.firefox');
const pJson = require('../../package');

const FIREFOX_PATH = 'firefox';

const plugins = [
    new CopyWebpackPlugin([
        {
            from: path.resolve(__dirname, '../manifest.common.json'),
            to: 'manifest.json',
            // eslint-disable-next-line no-unused-vars
            transform: (content, path) => updateManifest(content, firefoxManifestDiff),
        },
    ]),
];

const { NODE_ENV } = process.env;
if (NODE_ENV === 'beta' || NODE_ENV === 'release') {
    plugins.push(
        new ZipWebpackPlugin({
            path: '../',
            filename: `firefox-${NODE_ENV}-${pJson.version}.zip`,
        })
    );
}

const firefoxConfig = {
    output: {
        path: path.join(common.output.path, FIREFOX_PATH),
    },
    plugins,
};

module.exports = merge(common, firefoxConfig);
