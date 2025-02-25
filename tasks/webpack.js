const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ZipWebpackPlugin = require('zip-webpack-plugin');
const webpack = require('webpack');
const {
    SRC_PATH,
    BUILD_PATH,
    CHROME_UPDATE_CRX,
    FIREFOX_UPDATE_XPI,
    BUILD_ENVS,
    BROWSER_TYPES,
} = require('./consts');
const { getOutputPathByBuildEnv, appendBuildEnvSuffix, updateManifest } = require('./helpers');

const BACKGROUND_PATH = path.resolve(__dirname, SRC_PATH, 'background');
const POPUP_PATH = path.resolve(__dirname, SRC_PATH, 'popup');
const CONTENT_SCRIPTS_PATH = path.resolve(__dirname, SRC_PATH, 'content-scripts');
const POST_INSTALL_PATH = path.resolve(__dirname, SRC_PATH, 'post-install');
const OPTIONS_UI_PATH = path.resolve(__dirname, SRC_PATH, 'options-ui');

const { BROWSER, BUILD_ENV } = process.env;

const IS_DEV = BUILD_ENV === BUILD_ENVS.DEV;

const OUTPUT_PATH = getOutputPathByBuildEnv(BUILD_ENV);

const cleanOptions = IS_DEV ? { cleanAfterEveryBuildPatterns: ['!**/*.json', '!assets/**/*'] } : {};

const plugins = [
    new CleanWebpackPlugin(cleanOptions),
    new CopyWebpackPlugin([
        {
            context: 'src',
            from: 'assets/',
            to: 'assets/',
        },
        {
            context: 'src',
            from: '_locales/',
            to: '_locales/',
            // Add build environment suffixes to the extension name in locale files
            transform: (content, path) => {
                // ignore all paths except messages.json
                if (path.indexOf('messages.json') === -1) {
                    return content;
                }
                const messages = JSON.parse(content.toString());
                if (messages && messages.name) {
                    // eslint-disable-next-line max-len
                    messages.name.message = appendBuildEnvSuffix(messages.name.message, BUILD_ENV);
                }
                return Buffer.from(JSON.stringify(messages, null, 4));
            },
        },
        {
            from: path.resolve(__dirname, './manifest.common.json'),
            to: 'manifest.json',
            // eslint-disable-next-line no-unused-vars
            transform: (content, path) => {
                // eslint-disable-next-line global-require,import/no-dynamic-require
                const manifestDiff = require(`./manifest.${BROWSER}`);
                return updateManifest(content, manifestDiff);
            },
        },
    ]),
    new webpack.NormalModuleReplacementPlugin(/\.\/ConsentAbstract/, ((resource) => {
        if (!resource.contextInfo.issuer.includes('background/consent/index.js')) {
            return;
        }
        if (process.env.BROWSER === BROWSER_TYPES.FIREFOX) {
            // eslint-disable-next-line no-param-reassign
            resource.request = resource.request.replace(/\.\/ConsentAbstract/, './ConsentFirefox');
        } else if (process.env.BROWSER === BROWSER_TYPES.CHROME
            || process.env.BROWSER === BROWSER_TYPES.EDGE) {
            // eslint-disable-next-line no-param-reassign
            resource.request = resource.request.replace(/\.\/ConsentAbstract/, './ConsentChrome');
        } else {
            throw new Error(`There is no proxy api for browser: ${process.env.BROWSER}`);
        }
    })),
    new HtmlWebpackPlugin({
        template: path.join(BACKGROUND_PATH, 'index.html'),
        filename: 'background.html',
        chunks: ['background'],
    }),
    new HtmlWebpackPlugin({
        template: path.join(POPUP_PATH, 'index.html'),
        filename: 'popup.html',
        chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
        template: path.join(POST_INSTALL_PATH, 'index.html'),
        filename: 'post-install.html',
        chunks: ['post-install'],
    }),
    new HtmlWebpackPlugin({
        template: path.join(OPTIONS_UI_PATH, 'index.html'),
        filename: 'options-ui.html',
        chunks: ['options-ui'],
    }),
    new ZipWebpackPlugin({
        path: '../',
        filename: `${BROWSER}.zip`,
    }),
];

const config = {
    mode: IS_DEV ? 'development' : 'production',
    devtool: IS_DEV ? 'eval-source-map' : false,
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
    },
    optimization: {
        minimize: false,
    },
    entry: {
        background: BACKGROUND_PATH,
        popup: POPUP_PATH,
        'content-scripts': CONTENT_SCRIPTS_PATH,
        'post-install': POST_INSTALL_PATH,
        'options-ui': OPTIONS_UI_PATH,
    },
    output: {
        path: path.resolve(__dirname, BUILD_PATH, OUTPUT_PATH, BROWSER),
        filename: '[name].js',
    },
    resolve: {
        extensions: ['*', '.js', '.jsx'],
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'string-replace-loader',
                options: {
                    multiple: [
                        { search: '{{UPDATE_URL_FIREFOX}}', replace: FIREFOX_UPDATE_XPI },
                        { search: '{{UPDATE_URL_CHROME}}', replace: CHROME_UPDATE_CRX },
                    ],
                },
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: { babelrc: true, compact: false },
            },
            {
                test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
                exclude: /node_modules/,
                loader: 'url-loader?limit=100000',
            },
            {
                test: /\.(css|pcss)$/,
                exclude: /node_modules/,
                use: [
                    'style-loader',
                    { loader: 'css-loader', options: { importLoaders: 1 } },
                    'postcss-loader',
                ],
            },
        ],
    },
    plugins,
};

module.exports = config;
