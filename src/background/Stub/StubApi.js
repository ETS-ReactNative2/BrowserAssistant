import nanoid from 'nanoid';
import {
    AssistantTypes,
    RequestTypes,
    ResponseTypesPrefixes,
} from '../../lib/types';
import browserApi from '../browserApi';
import versions from '../versions';
import log from '../../lib/logger';
import stubHost from './StubHost';

class Api {
    isAppUpToDate = true;

    isExtensionUpdated = true;

    initHandler = (response) => {
        log.info(`response ${response.id}`, response);
        const { parameters } = response;

        // Ignore requests without identifying prefix ADG
        if (!response.requestId.startsWith(ResponseTypesPrefixes.ADG)) {
            return;
        }

        if (parameters && response.requestId.startsWith(ResponseTypesPrefixes.ADG_INIT)) {
            this.isAppUpToDate = (versions.apiVersion <= parameters.apiVersion);
            adguard.isAppUpToDate = this.isAppUpToDate;

            this.isExtensionUpdated = parameters.isValidatedOnHost;
            adguard.isExtensionUpdated = this.isExtensionUpdated;
        }

        browserApi.runtime.sendMessage(response);
    };

    init = async () => {
        try {
            await this.makeRequest({
                type: RequestTypes.init,
                parameters: {
                    ...versions,
                    type: AssistantTypes.nativeAssistant,
                },
            }, ResponseTypesPrefixes.ADG_INIT);
        } catch (error) {
            log.error(error.message);
        }
    };

    makeRequest = async (params, idPrefix = ResponseTypesPrefixes.ADG) => {
        const id = `${idPrefix}_${nanoid()}`;

        log.info(`request ${id}`, params);

        const request = { id, ...params };
        const response = stubHost.getStubResponse(request);

        return this.initHandler(response);
    };
}

const api = new Api();

export default api;
