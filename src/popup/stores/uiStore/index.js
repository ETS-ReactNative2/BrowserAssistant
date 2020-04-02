import { action, observable, computed } from 'mobx';
import {
    DEFAULT_MODAL_STATE,
    EVENT_TYPE_TO_MODAL_STATE_MAP,
    ORIGINAL_CERT_STATUS,
    HTTP_FILTERING_STATUS,
    SECURE_STATUS_MODAL_STATES,
    SWITCHER_TRANSITION_TIME,
} from '../consts';
import { checkSomeIsTrue } from '../../../lib/helpers';
import innerMessaging from '../../../lib/innerMessaging';
import tabs from '../../../background/tabs';

class UiStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    /**
     * Flag shows that extension has started to get information from native host on first start
     * @type {boolean}
     */
    @observable isLoading = true;

    /**
     * Flag is set to the true when popup executes requests to the background
     * @type {boolean}
     */
    @observable isPending = false;

    @observable certStatusModalState = { ...DEFAULT_MODAL_STATE };

    @observable secureStatusModalState = { ...DEFAULT_MODAL_STATE };

    @computed get isCertStatusModalOpen() {
        return checkSomeIsTrue(this.certStatusModalState);
    }

    @computed get isPageStatusModalOpen() {
        return checkSomeIsTrue(this.secureStatusModalState);
    }

    @computed get globalTabIndex() {
        return (this.isLoading ? -1 : 0);
    }

    @computed get secureStatusModalInfo() {
        const {
            pageProtocol, currentProtocol, originalCertStatus, isFilteringEnabled,
        } = this.rootStore.settingsStore;
        const { certStatus } = this;

        let modalInfo = SECURE_STATUS_MODAL_STATES[currentProtocol];

        if (pageProtocol.isHttps) {
            modalInfo = modalInfo[originalCertStatus];

            if (certStatus.isValid) {
                const protectionStatus = isFilteringEnabled
                    ? HTTP_FILTERING_STATUS.ENABLED : HTTP_FILTERING_STATUS.DISABLED;

                modalInfo = modalInfo[protectionStatus];
            }
        }
        return modalInfo || SECURE_STATUS_MODAL_STATES.default;
    }

    @computed get certStatus() {
        const { originalCertStatus } = this.rootStore.settingsStore;
        return ({
            isValid: originalCertStatus === ORIGINAL_CERT_STATUS.VALID,
            isInvalid: originalCertStatus === ORIGINAL_CERT_STATUS.INVALID,
            isBypassed: originalCertStatus === ORIGINAL_CERT_STATUS.BYPASSED,
            isNotFound: originalCertStatus === ORIGINAL_CERT_STATUS.NOTFOUND,
        });
    }

    @action
    updateCertStatusModalState = (eventType,
        newState = EVENT_TYPE_TO_MODAL_STATE_MAP[eventType]) => {
        this.certStatusModalState = {
            ...this.certStatusModalState,
            ...newState,
        };
    };

    @action
    resetCertStatusModalState = () => {
        this.certStatusModalState = DEFAULT_MODAL_STATE;
    };

    @action
    updateSecureStatusModalState = (eventType,
        newState = EVENT_TYPE_TO_MODAL_STATE_MAP[eventType]) => {
        this.secureStatusModalState = {
            ...this.secureStatusModalState,
            ...newState,
        };
    };

    @action
    setExtensionLoading = (isLoading) => {
        this.isLoading = isLoading;
    };

    @action
    setExtensionPending = (isPending) => {
        this.isPending = isPending;
    };
}

export default UiStore;
