import nanoid from 'nanoid';
import browser from 'webextension-polyfill';
import {
    ASSISTANT_TYPES,
    MESSAGE_TYPES,
    HOST_TYPES,
    REQUEST_TYPES,
    RESPONSE_TYPE_PREFIXES,
} from '../lib/types';
import browserApi from '../lib/browserApi';
import versions from './versions';
import log from '../lib/logger';

const MAX_RETRY_TIMES = 5;

class Api {
    isAppUpToDate = true;

    isExtensionUpdated = true;

    retryTimes = MAX_RETRY_TIMES;

    responsesHandler = async (msg) => {
        log.info(`response ${msg.id}`, msg);
        // Ignore requests without identifying prefix ADG
        if (!msg.requestId.startsWith(RESPONSE_TYPE_PREFIXES.ADG)) {
            return;
        }

        await browserApi.runtime.sendMessage({
            type: MESSAGE_TYPES[msg.result.toUpperCase()],
            params: msg,
        });
    };

    init = () => {
        log.info('init');
        this.port = browser.runtime.connectNative(HOST_TYPES.browserExtensionHost);
        this.port.onMessage.addListener(this.responsesHandler);

        this.port.onDisconnect.addListener(
            () => this.makeReinit(MESSAGE_TYPES.SHOW_IS_NOT_INSTALLED)
        );

        this.initRequest();
        return this.port;
    };

    initRequest = async () => {
        try {
            const res = await this.makeRequest({
                type: REQUEST_TYPES.init,
                parameters: {
                    ...versions,
                    type: ASSISTANT_TYPES.nativeAssistant,
                },
            });

            const { parameters } = res;

            if (!res.requestId.startsWith(RESPONSE_TYPE_PREFIXES.ADG)) {
                return;
            }

            this.isAppUpToDate = (versions.apiVersion <= parameters.apiVersion);
            this.isExtensionUpdated = parameters.isValidatedOnHost;

            if (!this.isAppUpToDate || !this.isExtensionUpdated) {
                await browserApi.runtime.sendMessage({
                    type: MESSAGE_TYPES.SHOW_SETUP_INCORRECT,
                });
            }
        } catch (error) {
            log.error(error);
        }
    };

    deinit = () => {
        log.info('deinit');
        this.port.disconnect();
        this.port.onMessage.removeListener(this.responsesHandler);
    };

    reinit = async () => {
        await browserApi.runtime.sendMessage({ type: MESSAGE_TYPES.SHOW_RELOAD });
        this.deinit();
        this.init();
    };

    makeReinit = async (message = MESSAGE_TYPES.SHOW_SETUP_INCORRECT) => {
        this.retryTimes -= 1;

        if (this.retryTimes) {
            this.reinit();
        } else {
            this.deinit();
            await browserApi.runtime.sendMessage({ type: message });
            this.retryTimes = MAX_RETRY_TIMES;

            log.error('Disconnected from native host: could not find correct app manifest or host is not responding');
        }
    };

    makeRequest = async (params, idPrefix = RESPONSE_TYPE_PREFIXES.ADG) => {
        const id = `${idPrefix}_${nanoid()}`;

        const RESPONSE_TIMEOUT_MS = 60 * 1000;
        log.info(`request ${id}`, params);

        return new Promise((resolve, reject) => {
            const messageHandler = (msg) => {
                const { requestId, result } = msg;

                const timerId = setTimeout(() => {
                    reject(new Error('Native host is not responding.'));
                    this.port.onMessage.removeListener(messageHandler);
                }, RESPONSE_TIMEOUT_MS);

                if (id === requestId) {
                    this.port.onMessage.removeListener(messageHandler);
                    clearTimeout(timerId);

                    if (MESSAGE_TYPES[result.toUpperCase()] === MESSAGE_TYPES.OK) {
                        return resolve(msg);
                    }

                    if (MESSAGE_TYPES[result.toUpperCase()] === MESSAGE_TYPES.ERROR) {
                        this.makeReinit();
                        return reject(new Error(`Native host responded with status: ${result}.`));
                    }
                }
                return '';
            };

            try {
                this.port.postMessage({ id, ...params });
            } catch (error) {
                log.error(error);

                this.port.onMessage.removeListener(messageHandler);
                this.makeReinit();
            }
            this.port.onMessage.addListener(messageHandler);
        });
    };
}


const api = new Api();

export default api;
