import React from 'react';
import ReactDOM from 'react-dom';
import browser from 'webextension-polyfill';
import { Provider } from 'mobx-react';
import App from './components/App';
import './styles/main.pcss';
import log from '../lib/logger';

try {
    (async () => {
        const bgPage = await browser.runtime.getBackgroundPage();
        global.adguard = bgPage.adguard;
        ReactDOM.render(
            <Provider>
                <App />
            </Provider>,
            document.getElementById('root')
        );
    })();
} catch (error) {
    log.error(error.message);
}
