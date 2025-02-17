import { browser } from '../../shared/globals';
import { mapHeaders } from '../../shared/headers';

import { sendMessage } from './messaging';

/** Track the number of redirects by request. */
const hops = new Map<string, string[]>();

/**
 * Generate `fetch::start` events from `devtools.network.onRequestFinished`.
 * These are forwarded to the content-script via the background-script.
 *
 * TODO: Find an event which can be used to trigger these earlier.
 */
const generateFetchStart = (request: chrome.devtools.network.Request) => {
    sendMessage({ fetchStart: { resource: request.request.url } });
};

/**
 * Get the entry response content directly from a `Request` or `Entry`.
 */
const getContent = (entry: chrome.devtools.network.Request): Promise<string> => {
    return new Promise((resolve) => {
        entry.getContent((content) => {
            resolve(content || '');
        });
    });
};

/**
 * Generate `fetch::end` events from `devtools.network.onRequestFinished`.
 * These are forwarded to the content-script via the background-script.
 */
const generateFetchEnd = async (entry: chrome.devtools.network.Request) => {
    const content = await getContent(entry);
    const url = entry.request.url;

    if (entry.response.redirectURL) {

        // Track hops on a redirect, using an existing list of hops if one exists.
        const urls = hops.has(url) ? hops.get(url)! : [];

        // Add the previous URL to the list and stash under the current requested URL.
        urls.push(url);
        hops.delete(url);
        hops.set(entry.response.redirectURL, urls);

    } else {

        const requestHops = hops.get(url) || [];
        const requestURL = requestHops.length ? requestHops[0] : url;

        // Otherwise generate a `fetch::end::*` event for the request.
        sendMessage({
            fetchEnd: {
                element: null, // Set by `content-script/connector`.
                request: {
                    headers: mapHeaders(entry.request.headers),
                    url: requestURL
                },
                resource: url,
                response: {
                    body: {
                        content,
                        rawContent: null as any,
                        rawResponse: null as any
                    },
                    charset: '', // Set by `content-script/connector`.
                    headers: mapHeaders(entry.response.headers),
                    hops: requestHops,
                    mediaType: '', // Set by `content-script/connector`.
                    statusCode: entry.response.status,
                    url
                }
            }
        });
    }

    hops.delete(url);
};

/**
 * Convert requests to `fetch::*` events and forward to the content-script via the background-script.
 */
const onRequestFinished = (request: chrome.devtools.network.Request) => {
    generateFetchStart(request);
    generateFetchEnd(request);
};

/**
 * Start listening for requests and generate `fetch::*` events.
 */
export const addNetworkListeners = () => {
    browser.devtools.network.onRequestFinished.addListener(onRequestFinished);
};

/**
 * Stop listening for network requests.
 */
export const removeNetworkListeners = () => {
    browser.devtools.network.onRequestFinished.removeListener(onRequestFinished);
};
