// ==UserScript==
// @name         Azota Bypass - sysadminhater
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Override Azota Status để bypass hàng chờ
// @match        *://*/*
// @grant        none
// ==/UserScript==
(function() {
    'use strict';
    const FAKE_RESPONSE = '{"value":true}';
    const FAKE_DATA = { value: true };
    const originalFetch = window.fetch;
    window.fetch = async function(input, ...args) {
        const url = typeof input === 'string' ? input : input?.url || '';
        if (url.includes('/ai/api/v1/student-practice/can-attempt-exam')) {
            console.log('[Tampermonkey] Intercepted fetch:', url);
            return new Response(FAKE_RESPONSE, {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return originalFetch.apply(this, [input, ...args]);
    };
    const OriginalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new OriginalXHR();
        let url = '';
        let intercepted = false;
        const originalOpen = xhr.open.bind(xhr);
        xhr.open = function(method, url_, ...rest) {
            url = url_;
            return originalOpen(method, url_, ...rest);
        };
        const originalSend = xhr.send.bind(xhr);
        xhr.send = function(...args) {
            if (url.includes('/can-attempt-exam') && !intercepted) {
                intercepted = true;
                Object.defineProperties(xhr, {
                    'readyState': { value: 4, writable: false },
                    'status': { value: 200, writable: false },
                    'statusText': { value: 'OK', writable: false },
                    'response': { value: FAKE_RESPONSE, writable: false },
                    'responseText': { value: FAKE_RESPONSE, writable: false },
                    'responseURL': { value: url, writable: false },
                    'responseXML': { value: null, writable: false },
                    'responseJSON': { get: function() { return FAKE_DATA; } },
                    'responseType': { value: '', writable: false },
                    'timeout': { value: 0, writable: false },
                    'withCredentials': { value: false, writable: false },
                    'channel': { value: null, writable: false },
                });
                setTimeout(() => {
                    if (xhr.onload) xhr.onload({ type: 'load', loaded: 200, total: 0, totalPerEtc: 0 });
                    xhr.dispatchEvent(new Event('load'));
                }, 0);
                return;
            }
            return originalSend.apply(xhr, args);
        };
        const originalHandler = xhr.onreadystatechange;
        xhr.onreadystatechange = function(e) {
            if (intercepted && xhr.readyState === 4) {
                return;
            }
            if (originalHandler) return originalHandler.call(xhr, e);
        };
        return xhr;
    };
    window.XMLHttpRequest.prototype = OriginalXHR.prototype;
    window.XMLHttpRequest.UNSENT = OriginalXHR.UNSENT;
    window.XMLHttpRequest.OPENED = OriginalXHR.OPENED;
    window.XMLHttpRequest.HEADERS_RECEIVED = OriginalXHR.HEADERS_RECEIVED;
    window.XMLHttpRequest.LOADING = OriginalXHR.LOADING;
    window.XMLHttpRequest.DONE = OriginalXHR.DONE;
})();