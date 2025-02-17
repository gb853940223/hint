import { HintTest, testHint } from '@hint/utils-tests-helpers';
import { test } from '@hint/utils';

const { getHintPath } = test;
const hintPath = getHintPath(__filename);

// Headers.
const setCookie = (fields: string) => {
    return { 'set-cookie': fields };
};

// Headers that will pass.
const doubleQuotedValueHeader = setCookie(`cookieName="cookieValue"; Secure; HttpOnly`);
const standardHeader = setCookie(`cookieName=cookieValue; Secure; HttpOnly`);
const starnderHeaderLowerCase = setCookie(`cookieName=cookieValue; secure; httponly`);
const standardHeaderWithSecurePrefix = setCookie(`__Secure-ID=123; Secure; Domain=example.com; HttpOnly`);
const standardHeaderWithHostPrefix = setCookie(`__Host-ID=123; Secure; Path=/; HttpOnly`);

// Headers that will fail.
const noNameValueStringHeader = setCookie(`Max-Age=0; Secure; HttpOnly`);
const invalidAttributeHeader = setCookie(`cookieName=cookieValue; MaxAge=0; Secure; HttpOnly`);
const noSecureHeader = setCookie(`cookieName=cookieValue; HttpOnly`);
const noHttpOnlyHeader = setCookie(`cookieName=cookieValue; Secure`);

const invalidNameHeader = setCookie(`"cookieName"=cookieValue; Secure; HttpOnly`);
const invalidValueHeader = setCookie(`cookieName=cookie value; Secure; HttpOnly`);
const invalidDateFormatHeader = setCookie(`cookieName=cookieValue; expires=Wed, 31-Dec-97 23:59:59 GMT; Secure; HttpOnly`);
const trailingSemicolonHeader = setCookie(`cookieName=cookieValue;`);
const multipleErrorsHeader = setCookie(`"cookieName"=cookie value`);

const noPathHostPrefixHeader = setCookie(`__Host-id=1; Secure; HttpOnly`);
const hasDomainHostPrefixHeader = setCookie(`__Host-id=1; Secure; Path=/; domain=example.com; HttpOnly`);

const maxAgeOnlyHeader = setCookie(`cookieName=cookieValue; Max-Age=123; secure; httponly`);
const expiresOnlyHeader = setCookie(`cookieName=cookieValue; expires=Wed, 21 Oct 2015 07:28:00 GMT; secure; httponly`);
const bothMaxAgeAndExpireHeader = setCookie(`cookieName=cookieValue; Max-Age=123; expires=Wed, 21 Oct 2015 07:28:00 GMT; secure; httponly`);

// Error messages.
const messages = (cookieName: string = 'cookiename'): { [key: string]: string } => {
    return {
        hasDomainHostPrefixError: `set-cookie header contains '__Host-' prefix but the 'domain' directive is set.`,
        invalidAttributeError: `'set-cookie' header contains unknown attribute 'maxage'.`,
        invalidDateFormatError: `Invalid date format in 'expires' value of the 'set-cookie' header to set '${cookieName}'. The recommended format is: Wed, 31 Dec 1997 23:59:59 GMT`,
        invalidNameError: `'set-cookie' header to set '${cookieName}' has an invalid cookie name.`,
        invalidValueError: `'set-cookie' header to set '${cookieName}' has an invalid cookie value.`,
        maxAgeNoExpireWarning: `Internet Explorer (IE 6, IE 7, and IE 8) doesn't support 'max-age' directive in the 'set-cookie' header to set 'cookiename'.`,
        maxAgePrecedenceWarning: `The 'max-age' attribute takes precedence when both 'expires' and 'max-age' both exist.`,
        noHttpOnlyHeaderError: `'set-cookie' header to set '${cookieName}' doesn't have the 'httponly' directive.`,
        noNameValueStringError: `'set-cookie' header doesn't contain a cookie name-value string.`,
        noPathHasHostPrefixError: `set-cookie header contains '__Host-' prefix but the 'path' directive doesn't have a value of '/'.`,
        noSecureHeaderError: `'set-cookie' header to set '${cookieName}' doesn't have the 'secure' directive.`,
        trailingSemicolonError: `'set-cookie' header to set '${cookieName}' has trailing ';'`
    };
};

const defaultTests: HintTest[] = [
    {
        name: `Standard set-cookie header`,
        serverConfig: { '/': { headers: standardHeader } }
    },
    {
        name: `Cooke value is wrapped in double quotes`,
        serverConfig: { '/': { headers: doubleQuotedValueHeader } }
    },
    {
        name: `Directive names are in lowercases`,
        serverConfig: { '/': { headers: starnderHeaderLowerCase } }
    },
    {
        name: `Standard set-cookie header with '__secure' prefix`,
        serverConfig: { '/': { headers: standardHeaderWithSecurePrefix } }
    },
    {
        name: `Standard set-cookie header with '__Host' prefix`,
        serverConfig: { '/': { headers: standardHeaderWithHostPrefix } }
    },
    {
        name: `Header doesn't have cookie name-value-string`,
        reports: [{ message: messages().noNameValueStringError }],
        serverConfig: { '/': { headers: noNameValueStringHeader } }
    },
    {
        name: `Header contains unknown attributes`,
        reports: [{ message: messages().invalidAttributeError }],
        serverConfig: { '/': { headers: invalidAttributeHeader } }
    },
    {
        name: `Header doesn't have 'Secure' directive`,
        reports: [{ message: messages().noSecureHeaderError }],
        serverConfig: { '/': { headers: noSecureHeader } }
    },
    {
        name: `Header doesn't have 'HttpOnly' directive`,
        reports: [{ message: messages().noHttpOnlyHeaderError }],
        serverConfig: { '/': { headers: noHttpOnlyHeader } }
    },
    {
        name: `Cookie name contains invalid characters`,
        reports: [{ message: messages('"cookiename"').invalidNameError }],
        serverConfig: { '/': { headers: invalidNameHeader } }
    },
    {
        name: `Cookie value contains invalid characters`,
        reports: [{ message: messages().invalidValueError }],
        serverConfig: { '/': { headers: invalidValueHeader } }
    },
    {
        name: `'Expires' directive contains invalid date format`,
        reports: [{ message: messages().invalidDateFormatError }],
        serverConfig: { '/': { headers: invalidDateFormatHeader } }
    },
    {
        name: `Header contains trailing semicolon`,
        reports: [{ message: messages().trailingSemicolonError }],
        serverConfig: { '/': { headers: trailingSemicolonHeader } }
    },
    {
        name: `Header contains multiple errors`,
        reports: [
            { message: messages('"cookiename"').invalidNameError },
            { message: messages('"cookiename"').invalidValueError }
        ],
        serverConfig: { '/': { headers: multipleErrorsHeader } }
    },
    {
        name: `Cookie name has '__Host' prefix but doesn't have 'Path' directive`,
        reports: [{ message: messages().noPathHasHostPrefixError }],
        serverConfig: { '/': { headers: noPathHostPrefixHeader } }
    },
    {
        name: `Cookie name has '__Host' prefix but has 'Domain' directive set`,
        reports: [{ message: messages().hasDomainHostPrefixError }],
        serverConfig: { '/': { headers: hasDomainHostPrefixHeader } }
    }
];

const olderBrowserOnlyTests = [
    {
        name: `'Max-Age' only in old browsers (older browsers only)`,
        reports: [{ message: messages().maxAgeNoExpireWarning }],
        serverConfig: { '/': { headers: maxAgeOnlyHeader } }
    },
    {
        name: `Both 'Max-Age' and 'Expires' exist in new browsers (older browsers only)`,
        serverConfig: { '/': { headers: bothMaxAgeAndExpireHeader } }
    },
    {
        name: `'Expires' only in new browsers (older browsers only)`,
        serverConfig: { '/': { headers: expiresOnlyHeader } }
    },
    {
        name: `No 'Max-Age' or 'Expires' in new browsers (older browsers only)`,
        serverConfig: { '/': { headers: standardHeader } }
    }
];

const newBrowserOnlyTests = [
    {
        name: `Both 'Max-Age' and 'Expires' exist in new browsers (new browsers only)`,
        reports: [{ message: messages().maxAgePrecedenceWarning }],
        serverConfig: { '/': { headers: bothMaxAgeAndExpireHeader } }
    },
    {
        name: `'Max-Age' only in new browsers`,
        serverConfig: { '/': { headers: maxAgeOnlyHeader } }
    },
    {
        name: `'Expires' only in new browsers (new browsers only)`,
        serverConfig: { '/': { headers: expiresOnlyHeader } }
    },
    {
        name: `No 'Max-Age' or 'Expires' in new browsers (new browsers only)`,
        serverConfig: { '/': { headers: standardHeader } }
    }
];

const oldAndNewBrowsersTest = [
    {
        name: `'Max-Age' only in old browsers (old and new browsers)`,
        reports: [{ message: messages().maxAgeNoExpireWarning }],
        serverConfig: { '/': { headers: maxAgeOnlyHeader } }
    },
    {
        name: `Both 'Max-Age' and 'Expires' exist in new browsers (old and new browsers)`,
        serverConfig: { '/': { headers: bothMaxAgeAndExpireHeader } }
    },
    {
        name: `'Expires' only in new browsers (old and new browsers)`,
        serverConfig: { '/': { headers: expiresOnlyHeader } }
    },
    {
        name: `No 'Max-Age' or 'Expires' in new browsers (old and new browsers)`,
        serverConfig: { '/': { headers: standardHeader } }
    }
];

testHint(hintPath, defaultTests, {
    https: true,
    /*
     * Tests are skipped in `chrome` due to the absence of 'Set-Cookie' header.
     * Issue: https://bugs.chromium.org/p/chromium/issues/detail?id=692090.
     * TODO: Update the tests once the issue above is fixed.
     */
    ignoredConnectors: ['puppeteer']
});

testHint(hintPath, newBrowserOnlyTests, {
    browserslist: [
        '> 1%',
        'last 2 versions'
    ],
    https: true,
    ignoredConnectors: ['puppeteer']
});

testHint(hintPath, olderBrowserOnlyTests, {
    browserslist: [
        'ie 6', 'ie 7'
    ],
    https: true,
    ignoredConnectors: ['puppeteer']
});

testHint(hintPath, oldAndNewBrowsersTest, {
    browserslist: [
        'ie >= 6',
        'last 2 versions'
    ],
    https: true,
    ignoredConnectors: ['chrompuppeteerium']
});
