/**
 * @preserve HTML5 Shiv 3.7.3 | @afarkas @jdalton @jon_neal @rem | MIT/GPL2 Licensed
 */
;(function (window, document) {
    /*jshint evil:true */
    /** version */
    var version = '3.7.3';

    /** Preset options */
    var options = window.html5 || {};

    /** Used to skip problem elements */
    var reSkip = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i;

    /** Not all elements can be cloned in IE **/
    var saveClones = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i;

    /** Detect whether the browser supports default html5 styles */
    var supportsHtml5Styles;

    /** Name of the expando, to work with multiple documents or to re-shiv one document */
    var expando = '_html5shiv';

    /** The id for the the documents expando */
    var expanID = 0;

    /** Cached data for each document */
    var expandoData = {};

    /** Detect whether the browser supports unknown elements */
    var supportsUnknownElements;

    (function () {
        try {
            var a = document.createElement('a');
            a.innerHTML = '<xyz></xyz>';
            //if the hidden property is implemented we can assume, that the browser supports basic HTML5 Styles
            supportsHtml5Styles = ('hidden' in a);

            supportsUnknownElements = a.childNodes.length == 1 || (function () {
                // assign a false positive if unable to shiv
                (document.createElement)('a');
                var frag = document.createDocumentFragment();
                return (
                    typeof frag.cloneNode == 'undefined' ||
                    typeof frag.createDocumentFragment == 'undefined' ||
                    typeof frag.createElement == 'undefined'
                );
            }());
        } catch (e) {
            // assign a false positive if detection fails => unable to shiv
            supportsHtml5Styles = true;
            supportsUnknownElements = true;
        }

    }());

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a style sheet with the given CSS text and adds it to the document.
     * @private
     * @param {Document} ownerDocument The document.
     * @param {String} cssText The CSS text.
     * @returns {StyleSheet} The style element.
     */
    function addStyleSheet(ownerDocument, cssText) {
        var p = ownerDocument.createElement('p'),
            parent = ownerDocument.getElementsByTagName('head')[0] || ownerDocument.documentElement;

        p.innerHTML = 'x<style>' + cssText + '</style>';
        return parent.insertBefore(p.lastChild, parent.firstChild);
    }

    /**
     * Returns the value of `html5.elements` as an array.
     * @private
     * @returns {Array} An array of shived element node names.
     */
    function getElements() {
        var elements = html5.elements;
        return typeof elements == 'string' ? elements.split(' ') : elements;
    }

    /**
     * Extends the built-in list of html5 elements
     * @memberOf html5
     * @param {String|Array} newElements whitespace separated list or array of new element names to shiv
     * @param {Document} ownerDocument The context document.
     */
    function addElements(newElements, ownerDocument) {
        var elements = html5.elements;
        if (typeof elements != 'string') {
            elements = elements.join(' ');
        }
        if (typeof newElements != 'string') {
            newElements = newElements.join(' ');
        }
        html5.elements = elements + ' ' + newElements;
        shivDocument(ownerDocument);
    }

    /**
     * Returns the data associated to the given document
     * @private
     * @param {Document} ownerDocument The document.
     * @returns {Object} An object of data.
     */
    function getExpandoData(ownerDocument) {
        var data = expandoData[ownerDocument[expando]];
        if (!data) {
            data = {};
            expanID++;
            ownerDocument[expando] = expanID;
            expandoData[expanID] = data;
        }
        return data;
    }

    /**
     * returns a shived element for the given nodeName and document
     * @memberOf html5
     * @param {String} nodeName name of the element
     * @param {Document|DocumentFragment} ownerDocument The context document.
     * @returns {Object} The shived element.
     */
    function createElement(nodeName, ownerDocument, data) {
        if (!ownerDocument) {
            ownerDocument = document;
        }
        if (supportsUnknownElements) {
            return ownerDocument.createElement(nodeName);
        }
        if (!data) {
            data = getExpandoData(ownerDocument);
        }
        var node;

        if (data.cache[nodeName]) {
            node = data.cache[nodeName].cloneNode();
        } else if (saveClones.test(nodeName)) {
            node = (data.cache[nodeName] = data.createElem(nodeName)).cloneNode();
        } else {
            node = data.createElem(nodeName);
        }

        // Avoid adding some elements to fragments in IE < 9 because
        // * Attributes like `name` or `type` cannot be set/changed once an element
        //   is inserted into a document/fragment
        // * Link elements with `src` attributes that are inaccessible, as with
        //   a 403 response, will cause the tab/window to crash
        // * Script elements appended to fragments will execute when their `src`
        //   or `text` property is set
        return node.canHaveChildren && !reSkip.test(nodeName) && !node.tagUrn ? data.frag.appendChild(node) : node;
    }

    /**
     * returns a shived DocumentFragment for the given document
     * @memberOf html5
     * @param {Document} ownerDocument The context document.
     * @returns {Object} The shived DocumentFragment.
     */
    function createDocumentFragment(ownerDocument, data) {
        if (!ownerDocument) {
            ownerDocument = document;
        }
        if (supportsUnknownElements) {
            return ownerDocument.createDocumentFragment();
        }
        data = data || getExpandoData(ownerDocument);
        var clone = data.frag.cloneNode(),
            i = 0,
            elems = getElements(),
            l = elems.length;
        for (; i < l; i++) {
            clone.createElement(elems[i]);
        }
        return clone;
    }

    /**
     * Shivs the `createElement` and `createDocumentFragment` methods of the document.
     * @private
     * @param {Document|DocumentFragment} ownerDocument The document.
     * @param {Object} data of the document.
     */
    function shivMethods(ownerDocument, data) {
        if (!data.cache) {
            data.cache = {};
            data.createElem = ownerDocument.createElement;
            data.createFrag = ownerDocument.createDocumentFragment;
            data.frag = data.createFrag();
        }


        ownerDocument.createElement = function (nodeName) {
            //abort shiv
            if (!html5.shivMethods) {
                return data.createElem(nodeName);
            }
            return createElement(nodeName, ownerDocument, data);
        };

        ownerDocument.createDocumentFragment = Function('h,f', 'return function(){' +
            'var n=f.cloneNode(),c=n.createElement;' +
            'h.shivMethods&&(' +
            // unroll the `createElement` calls
            getElements().join().replace(/[\w\-:]+/g, function (nodeName) {
                data.createElem(nodeName);
                data.frag.createElement(nodeName);
                return 'c("' + nodeName + '")';
            }) +
            ');return n}'
        )(html5, data.frag);
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Shivs the given document.
     * @memberOf html5
     * @param {Document} ownerDocument The document to shiv.
     * @returns {Document} The shived document.
     */
    function shivDocument(ownerDocument) {
        if (!ownerDocument) {
            ownerDocument = document;
        }
        var data = getExpandoData(ownerDocument);

        if (html5.shivCSS && !supportsHtml5Styles && !data.hasCSS) {
            data.hasCSS = !!addStyleSheet(ownerDocument,
                // corrects block display not defined in IE6/7/8/9
                'article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}' +
                // adds styling not present in IE6/7/8/9
                'mark{background:#FF0;color:#000}' +
                // hides non-rendered elements
                'template{display:none}'
            );
        }
        if (!supportsUnknownElements) {
            shivMethods(ownerDocument, data);
        }
        return ownerDocument;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * The `html5` object is exposed so that more elements can be shived and
     * existing shiving can be detected on iframes.
     * @type Object
     * @example
     *
     * // options can be changed before the script is included
     * html5 = { 'elements': 'mark section', 'shivCSS': false, 'shivMethods': false };
     */
    var html5 = {

        /**
         * An array or space separated string of node names of the elements to shiv.
         * @memberOf html5
         * @type Array|String
         */
        'elements': options.elements || 'abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output picture progress section summary template time video',

        /**
         * current version of html5shiv
         */
        'version': version,

        /**
         * A flag to indicate that the HTML5 style sheet should be inserted.
         * @memberOf html5
         * @type Boolean
         */
        'shivCSS': (options.shivCSS !== false),

        /**
         * Is equal to true if a browser supports creating unknown/HTML5 elements
         * @memberOf html5
         * @type boolean
         */
        'supportsUnknownElements': supportsUnknownElements,

        /**
         * A flag to indicate that the document's `createElement` and `createDocumentFragment`
         * methods should be overwritten.
         * @memberOf html5
         * @type Boolean
         */
        'shivMethods': (options.shivMethods !== false),

        /**
         * A string to describe the type of `html5` object ("default" or "default print").
         * @memberOf html5
         * @type String
         */
        'type': 'default',

        // shivs the document according to the specified `html5` object options
        'shivDocument': shivDocument,

        //creates a shived element
        createElement: createElement,

        //creates a shived documentFragment
        createDocumentFragment: createDocumentFragment,

        //extends list of elements
        addElements: addElements
    };

    /*--------------------------------------------------------------------------*/

    // expose html5
    window.html5 = html5;

    // shiv the document
    shivDocument(document);

    if (typeof module == 'object' && module.exports) {
        module.exports = html5;
    }

}(typeof window !== "undefined" ? window : this, document));



/*
css3-mediaqueries.js
author: Wouter van der Graaf <woutervandergraaf at gmail com> and Heath Beckett <https://github.com/heathcliff>
license: MIT
website: https://github.com/heathcliff/css3-mediaqueries-js
W3C spec: http://www.w3.org/TR/css3-mediaqueries/
*/

// true prototypal inheritance (http://javascript.crockford.com/prototypal.html)
if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}


// user agent sniffing shortcuts
var ua = {
    toString: function () {
        return navigator.userAgent;
    },
    test: function (s) {
        return this.toString().toLowerCase().indexOf(s.toLowerCase()) > -1;
    }
};
ua.version = (ua.toString().toLowerCase().match(/[\s\S]+(?:rv|it|ra|ie)[\/: ]([\d.]+)/) || [])[1];
ua.webkit = ua.test('webkit');
ua.gecko = ua.test('gecko') && !ua.webkit;
ua.opera = ua.test('opera');
ua.ie = ua.test('msie') && !ua.opera;
ua.ie6 = ua.ie && document.compatMode && typeof document.documentElement.style.maxHeight === 'undefined';
ua.ie7 = ua.ie && document.documentElement && typeof document.documentElement.style.maxHeight !== 'undefined' && typeof XDomainRequest === 'undefined';
ua.ie8 = ua.ie && typeof XDomainRequest !== 'undefined';



// initialize when DOM content is loaded
var domReady = function () {
    var fns = [];
    var init = function () {
        if (!arguments.callee.done) { // run init functions once
            arguments.callee.done = true;
            for (var i = 0; i < fns.length; i++) {
                fns[i]();
            }
        }
    };

    // listeners for different browsers
    if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', init, false);
    }
    if (ua.ie) {
        (function () {
            try {
                // throws errors until after ondocumentready
                document.documentElement.doScroll('left');
            }
            catch (e) {
                setTimeout(arguments.callee, 50);
                return;
            }
            // no errors, fire
            init();
        })();
        // trying to always fire before onload
        document.onreadystatechange = function () {
            if (document.readyState === 'complete') {
                document.onreadystatechange = null;
                init();
            }
        };
    }
    if (ua.webkit && document.readyState) {
        (function () {
            if (document.readyState !== 'loading') {
                init();
            }
            else {
                setTimeout(arguments.callee, 10);
            }
        })();
    }
    window.onload = init; // fallback

    return function (fn) { // add fn to init functions
        if (typeof fn === 'function') {
            fns[fns.length] = fn;
        }
        return fn;
    };
}();



// helper library for parsing css to objects
var cssHelper = function () {

    var regExp = {
        BLOCKS: /[^\s{][^{]*\{(?:[^{}]*\{[^{}]*\}[^{}]*|[^{}]*)*\}/g,
        BLOCKS_INSIDE: /[^\s{][^{]*\{[^{}]*\}/g,
        DECLARATIONS: /[a-zA-Z\-]+[^;]*:[^;]+;/g,
        RELATIVE_URLS: /url\(['"]?([^\/\)'"][^:\)'"]+)['"]?\)/g,
        // strip whitespace and comments, @import is evil
        REDUNDANT_COMPONENTS: /(?:\/\*([^*\\\\]|\*(?!\/))+\*\/|@import[^;]+;)/g,
        REDUNDANT_WHITESPACE: /\s*(,|:|;|\{|\})\s*/g,
        MORE_WHITESPACE: /\s{2,}/g,
        FINAL_SEMICOLONS: /;\}/g,
        NOT_WHITESPACE: /\S+/g
    };

    var parsed, parsing = false;

    var waiting = [];
    var wait = function (fn) {
        if (typeof fn === 'function') {
            waiting[waiting.length] = fn;
        }
    };
    var ready = function () {
        for (var i = 0; i < waiting.length; i++) {
            waiting[i](parsed);
        }
    };
    var events = {};
    var broadcast = function (n, v) {
        if (events[n]) {
            var listeners = events[n].listeners;
            if (listeners) {
                for (var i = 0; i < listeners.length; i++) {
                    listeners[i](v);
                }
            }
        }
    };

    var requestText = function (url, fnSuccess, fnFailure) {
        if (ua.ie && !window.XMLHttpRequest) {
            window.XMLHttpRequest = function () {
                return new ActiveXObject('Microsoft.XMLHTTP');
            };
        }
        if (!XMLHttpRequest) {
            return '';
        }
        var r = new XMLHttpRequest();
        try {
            r.open('get', url, true);
            r.setRequestHeader('X_REQUESTED_WITH', 'XMLHttpRequest');
        }
        catch (e) {
            fnFailure();
            return;
        }
        var done = false;
        setTimeout(function () {
            done = true;
        }, 5000);
        document.documentElement.style.cursor = 'progress';
        r.onreadystatechange = function () {
            if (r.readyState === 4 && !done) {
                if (!r.status && location.protocol === 'file:' ||
                    (r.status >= 200 && r.status < 300) ||
                    r.status === 304 ||
                    navigator.userAgent.indexOf('Safari') > -1 && typeof r.status === 'undefined') {
                    fnSuccess(r.responseText);
                }
                else {
                    fnFailure();
                }
                document.documentElement.style.cursor = '';
                r = null; // avoid memory leaks
            }
        };
        r.send('');
    };

    var sanitize = function (text) {
        text = text.replace(regExp.REDUNDANT_COMPONENTS, '');
        text = text.replace(regExp.REDUNDANT_WHITESPACE, '$1');
        text = text.replace(regExp.MORE_WHITESPACE, ' ');
        text = text.replace(regExp.FINAL_SEMICOLONS, '}'); // optional final semicolons
        return text;
    };

    var objects = {

        mediaQueryList: function (s) {
            var o = {};
            var idx = s.indexOf('{');
            var lt = s.substring(0, idx);
            s = s.substring(idx + 1, s.length - 1);
            var mqs = [], rs = [];

            // add media queries
            var qts = lt.toLowerCase().substring(7).split(',');
            for (var i = 0; i < qts.length; i++) { // parse each media query
                mqs[mqs.length] = objects.mediaQuery(qts[i], o);
            }

            // add rule sets
            var rts = s.match(regExp.BLOCKS_INSIDE);
            if (rts !== null) {
                for (i = 0; i < rts.length; i++) {
                    rs[rs.length] = objects.rule(rts[i], o);
                }
            }

            o.getMediaQueries = function () {
                return mqs;
            };
            o.getRules = function () {
                return rs;
            };
            o.getListText = function () {
                return lt;
            };
            o.getCssText = function () {
                return s;
            };
            return o;
        },

        mediaQuery: function (s, mql) {
            s = s || '';
            var not = false, type;
            var exp = [];
            var valid = true;
            var tokens = s.match(regExp.NOT_WHITESPACE);
            for (var i = 0; i < tokens.length; i++) {
                var token = tokens[i];
                if (!type && (token === 'not' || token === 'only')) { // 'not' and 'only' keywords
                    // keyword 'only' does nothing, as if it was not present
                    if (token === 'not') {
                        not = true;
                    }
                }
                else if (!type) { // media type
                    type = token;
                }
                else if (token.charAt(0) === '(') { // media feature expression
                    var pair = token.substring(1, token.length - 1).split(':');
                    exp[exp.length] = {
                        mediaFeature: pair[0],
                        value: pair[1] || null
                    };
                }
            }

            return {
                getList: function () {
                    return mql || null;
                },
                getValid: function () {
                    return valid;
                },
                getNot: function () {
                    return not;
                },
                getMediaType: function () {
                    return type;
                },
                getExpressions: function () {
                    return exp;
                }
            };
        },

        rule: function (s, mql) {
            var o = {};
            var idx = s.indexOf('{');
            var st = s.substring(0, idx);
            var ss = st.split(',');
            var ds = [];
            var dts = s.substring(idx + 1, s.length - 1).split(';');
            for (var i = 0; i < dts.length; i++) {
                ds[ds.length] = objects.declaration(dts[i], o);
            }

            o.getMediaQueryList = function () {
                return mql || null;
            };
            o.getSelectors = function () {
                return ss;
            };
            o.getSelectorText = function () {
                return st;
            };
            o.getDeclarations = function () {
                return ds;
            };
            o.getPropertyValue = function (n) {
                for (var i = 0; i < ds.length; i++) {
                    if (ds[i].getProperty() === n) {
                        return ds[i].getValue();
                    }
                }
                return null;
            };
            return o;
        },

        declaration: function (s, r) {
            var idx = s.indexOf(':');
            var p = s.substring(0, idx);
            var v = s.substring(idx + 1);
            return {
                getRule: function () {
                    return r || null;
                },
                getProperty: function () {
                    return p;
                },
                getValue: function () {
                    return v;
                }
            };
        }
    };

    var parseText = function (el) {
        if (typeof el.cssHelperText !== 'string') {
            return;
        }
        var o = {
            mediaQueryLists: [],
            rules: [],
            selectors: {},
            declarations: [],
            properties: {}
        };

        // parse blocks and collect media query lists and rules
        var mqls = o.mediaQueryLists;
        var ors = o.rules;
        var blocks = el.cssHelperText.match(regExp.BLOCKS);
        if (blocks !== null) {
            for (var i = 0; i < blocks.length; i++) {
                if (blocks[i].substring(0, 7) === '@media ') { // media query (list)
                    mqls[mqls.length] = objects.mediaQueryList(blocks[i]);
                    ors = o.rules = ors.concat(mqls[mqls.length - 1].getRules());
                }
                else { // regular rule set, page context (@page) or font description (@font-face)
                    ors[ors.length] = objects.rule(blocks[i]);
                }
            }
        }

        // collect selectors
        var oss = o.selectors;
        var collectSelectors = function (r) {
            var ss = r.getSelectors();
            for (var i = 0; i < ss.length; i++) {
                var n = ss[i];
                if (!oss[n]) {
                    oss[n] = [];
                }
                oss[n][oss[n].length] = r;
            }
        };
        for (i = 0; i < ors.length; i++) {
            collectSelectors(ors[i]);
        }

        // collect declarations
        var ods = o.declarations;
        for (i = 0; i < ors.length; i++) {
            ods = o.declarations = ods.concat(ors[i].getDeclarations());
        }

        // collect properties
        var ops = o.properties;
        for (i = 0; i < ods.length; i++) {
            var n = ods[i].getProperty();
            if (!ops[n]) {
                ops[n] = [];
            }
            ops[n][ops[n].length] = ods[i];
        }

        el.cssHelperParsed = o;
        parsed[parsed.length] = el;
        return o;
    };

    var parseEmbedded = function (el, s) {
        el.cssHelperText = sanitize(s || el.innerHTML); // bug in IE, where innerHTML gives us parsed css instead of raw literal
        return parseText(el);
    };

    var parse = function () {
        parsing = true;
        parsed = [];
        var linked = [];
        var finish = function () {
            for (var i = 0; i < linked.length; i++) {
                parseText(linked[i]);
            }
            var styles = document.getElementsByTagName('style');
            for (i = 0; i < styles.length; i++) {
                parseEmbedded(styles[i]);
            }
            parsing = false;
            ready();
        };
        var links = document.getElementsByTagName('link');
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            try {
                if (link.getAttribute('rel').indexOf('style') > -1 && link.href && link.href.length !== 0 && !link.disabled) {
                    linked[linked.length] = link;
                }
            } catch(e) {}
        }
        if (linked.length > 0) {
            var c = 0;
            var checkForFinish = function () {
                c++;
                if (c === linked.length) { // parse in right order, so after last link is read
                    finish();
                }
            };
            var processLink = function (link) {
                var href = link.href;
                requestText(href, function (text) {
                    // fix url's
                    text = sanitize(text).replace(regExp.RELATIVE_URLS, 'url(' + href.substring(0, href.lastIndexOf('/')) + '/$1)');
                    link.cssHelperText = text;
                    checkForFinish();
                }, checkForFinish);
            };
            for (i = 0; i < linked.length; i++) {
                processLink(linked[i]);
            }
        }
        else {
            finish();
        }
    };

    var types = {
        mediaQueryLists: 'array',
        rules: 'array',
        selectors: 'object',
        declarations: 'array',
        properties: 'object'
    };

    var collections = {
        mediaQueryLists: null,
        rules: null,
        selectors: null,
        declarations: null,
        properties: null
    };

    var addToCollection = function (name, v) {
        if (collections[name] !== null) {
            if (types[name] === 'array') {
                return (collections[name] = collections[name].concat(v));
            }
            else {
                var c = collections[name];
                for (var n in v) {
                    if (v.hasOwnProperty(n)) {
                        if (!c[n]) {
                            c[n] = v[n];
                        }
                        else {
                            c[n] = c[n].concat(v[n]);
                        }
                    }
                }
                return c;
            }
        }
    };

    var collect = function (name) {
        collections[name] = (types[name] === 'array') ? [] : {};
        for (var i = 0; i < parsed.length; i++) {
            addToCollection(name, parsed[i].cssHelperParsed[name]);
        }
        return collections[name];
    };

    // timer for broadcasting added elements
    domReady(function () {
        var els = document.body.getElementsByTagName('*');
        for (var i = 0; i < els.length; i++) {
            els[i].checkedByCssHelper = true;
        }

        if (document.implementation.hasFeature('MutationEvents', '2.0') || window.MutationEvent) {
            document.body.addEventListener('DOMNodeInserted', function (e) {
                var el = e.target;
                if (el.nodeType === 1) {
                    broadcast('DOMElementInserted', el);
                    el.checkedByCssHelper = true;
                }
            }, false);
        }
        else {
            setInterval(function () {
                var els = document.body.getElementsByTagName('*');
                for (var i = 0; i < els.length; i++) {
                    if (!els[i].checkedByCssHelper) {
                        broadcast('DOMElementInserted', els[i]);
                        els[i].checkedByCssHelper = true;
                    }
                }
            }, 1000);
        }
    });

    // viewport size
    var getViewportSize = function (d) {
        if (typeof window.innerWidth != 'undefined') {
            return window["inner" + d];
        }
        else if (typeof document.documentElement != 'undefined'
            && typeof document.documentElement.clientWidth != 'undefined'
            && document.documentElement.clientWidth != 0) {
            return document.documentElement["client" + d];
        }
    };

    // public static functions
    return {
        addStyle: function (s, process) {
            var el = document.createElement('style');
            el.setAttribute('type', 'text/css');
            document.getElementsByTagName('head')[0].appendChild(el);
            if (el.styleSheet) { // IE
                el.styleSheet.cssText = s;
            }
            else {
                el.appendChild(document.createTextNode(s));
            }
            el.addedWithCssHelper = true;
            if (typeof process === 'undefined' || process === true) {
                cssHelper.parsed(function (parsed) {
                    var o = parseEmbedded(el, s);
                    for (var n in o) {
                        if (o.hasOwnProperty(n)) {
                            addToCollection(n, o[n]);
                        }
                    }
                    broadcast('newStyleParsed', el);
                });
            }
            else {
                el.parsingDisallowed = true;
            }
            return el;
        },

        removeStyle: function (el) {
            return el.parentNode.removeChild(el);
        },

        parsed: function (fn) {
            if (parsing) {
                wait(fn);
            }
            else {
                if (typeof parsed !== 'undefined') {
                    if (typeof fn === 'function') {
                        fn(parsed);
                    }
                }
                else {
                    wait(fn);
                    parse();
                }
            }
        },

        mediaQueryLists: function (fn) {
            cssHelper.parsed(function (parsed) {
                fn(collections.mediaQueryLists || collect('mediaQueryLists'));
            });
        },

        rules: function (fn) {
            cssHelper.parsed(function (parsed) {
                fn(collections.rules || collect('rules'));
            });
        },

        selectors: function (fn) {
            cssHelper.parsed(function (parsed) {
                fn(collections.selectors || collect('selectors'));
            });
        },

        declarations: function (fn) {
            cssHelper.parsed(function (parsed) {
                fn(collections.declarations || collect('declarations'));
            });
        },

        properties: function (fn) {
            cssHelper.parsed(function (parsed) {
                fn(collections.properties || collect('properties'));
            });
        },

        broadcast: broadcast,

        addListener: function (n, fn) { // in case n is 'styleadd': added function is called everytime style is added and parsed
            if (typeof fn === 'function') {
                if (!events[n]) {
                    events[n] = {
                        listeners: []
                    };
                }
                events[n].listeners[events[n].listeners.length] = fn;
            }
        },

        removeListener: function (n, fn) {
            if (typeof fn === 'function' && events[n]) {
                var ls = events[n].listeners;
                for (var i = 0; i < ls.length; i++) {
                    if (ls[i] === fn) {
                        ls.splice(i, 1);
                        i -= 1;
                    }
                }
            }
        },

        getViewportWidth: function () {
            return getViewportSize("Width");
        },

        getViewportHeight: function () {
            return getViewportSize("Height");
        }
    };
}();



// function to test and apply parsed media queries against browser capabilities
domReady(function enableCssMediaQueries() {
    var meter;

    var regExp = {
        LENGTH_UNIT: /[0-9]+(em|ex|px|in|cm|mm|pt|pc)$/,
        RESOLUTION_UNIT: /[0-9]+(dpi|dpcm)$/,
        ASPECT_RATIO: /^[0-9]+\/[0-9]+$/,
        ABSOLUTE_VALUE: /^[0-9]*(\.[0-9]+)*$/
    };

    var styles = [];

    var nativeSupport = function () {
        // check support for media queries
        var id = 'css3-mediaqueries-test';
        var el = document.createElement('div');
        el.id = id;
        var style = cssHelper.addStyle('@media all and (width) { #' + id +
            ' { width: 1px !important; } }', false); // false means don't parse this temp style
        document.body.appendChild(el);
        var ret = el.offsetWidth === 1;
        style.parentNode.removeChild(style);
        el.parentNode.removeChild(el);
        nativeSupport = function () {
            return ret;
        };
        return ret;
    };

    var createMeter = function () { // create measuring element
        meter = document.createElement('div');
        meter.style.cssText = 'position:absolute;top:-9999em;left:-9999em;' +
            'margin:0;border:none;padding:0;width:1em;font-size:1em;'; // cssText is needed for IE, works for the others
        document.body.appendChild(meter);
        // meter must have browser default font size of 16px
        if (meter.offsetWidth !== 16) {
            meter.style.fontSize = 16 / meter.offsetWidth + 'em';
        }
        meter.style.width = '';
    };

    var measure = function (value) {
        meter.style.width = value;
        var amount = meter.offsetWidth;
        meter.style.width = '';
        return amount;
    };

    var testMediaFeature = function (feature, value) {
        // non-testable features: monochrome|min-monochrome|max-monochrome|scan|grid
        var l = feature.length;
        var min = (feature.substring(0, 4) === 'min-');
        var max = (!min && feature.substring(0, 4) === 'max-');

        if (value !== null) { // determine value type and parse to usable amount
            var valueType;
            var amount;
            if (regExp.LENGTH_UNIT.exec(value)) {
                valueType = 'length';
                amount = measure(value);
            }
            else if (regExp.RESOLUTION_UNIT.exec(value)) {
                valueType = 'resolution';
                amount = parseInt(value, 10);
                var unit = value.substring((amount + '').length);
            }
            else if (regExp.ASPECT_RATIO.exec(value)) {
                valueType = 'aspect-ratio';
                amount = value.split('/');
            }
            else if (regExp.ABSOLUTE_VALUE) {
                valueType = 'absolute';
                amount = value;
            }
            else {
                valueType = 'unknown';
            }
        }

        var width, height;
        if ('device-width' === feature.substring(l - 12, l)) { // screen width
            width = screen.width;
            if (value !== null) {
                if (valueType === 'length') {
                    return ((min && width >= amount) || (max && width < amount) || (!min && !max && width === amount));
                }
                else {
                    return false;
                }
            }
            else { // test width without value
                return width > 0;
            }
        }
        else if ('device-height' === feature.substring(l - 13, l)) { // screen height
            height = screen.height;
            if (value !== null) {
                if (valueType === 'length') {
                    return ((min && height >= amount) || (max && height < amount) || (!min && !max && height === amount));
                }
                else {
                    return false;
                }
            }
            else { // test height without value
                return height > 0;
            }
        }
        else if ('width' === feature.substring(l - 5, l)) { // viewport width
            width = document.documentElement.clientWidth || document.body.clientWidth; // the latter for IE quirks mode
            if (value !== null) {
                if (valueType === 'length') {
                    return ((min && width >= amount) || (max && width < amount) || (!min && !max && width === amount));
                }
                else {
                    return false;
                }
            }
            else { // test width without value
                return width > 0;
            }
        }
        else if ('height' === feature.substring(l - 6, l)) { // viewport height
            height = document.documentElement.clientHeight || document.body.clientHeight; // the latter for IE quirks mode
            if (value !== null) {
                if (valueType === 'length') {
                    return ((min && height >= amount) || (max && height < amount) || (!min && !max && height === amount));
                }
                else {
                    return false;
                }
            }
            else { // test height without value
                return height > 0;
            }
        }
        else if ('device-aspect-ratio' === feature.substring(l - 19, l)) { // screen aspect ratio
            return valueType === 'aspect-ratio' && screen.width * amount[1] === screen.height * amount[0];
        }
        else if ('color-index' === feature.substring(l - 11, l)) { // number of colors
            var colors = Math.pow(2, screen.colorDepth);
            if (value !== null) {
                if (valueType === 'absolute') {
                    return ((min && colors >= amount) || (max && colors < amount) || (!min && !max && colors === amount));
                }
                else {
                    return false;
                }
            }
            else { // test height without value
                return colors > 0;
            }
        }
        else if ('color' === feature.substring(l - 5, l)) { // bits per color component
            var color = screen.colorDepth;
            if (value !== null) {
                if (valueType === 'absolute') {
                    return ((min && color >= amount) || (max && color < amount) || (!min && !max && color === amount));
                }
                else {
                    return false;
                }
            }
            else { // test height without value
                return color > 0;
            }
        }
        else if ('resolution' === feature.substring(l - 10, l)) {
            var res;
            if (unit === 'dpcm') {
                res = measure('1cm');
            }
            else {
                res = measure('1in');
            }
            if (value !== null) {
                if (valueType === 'resolution') {
                    return ((min && res >= amount) || (max && res < amount) || (!min && !max && res === amount));
                }
                else {
                    return false;
                }
            }
            else { // test height without value
                return res > 0;
            }
        }
        else {
            return false;
        }
    };

    var testMediaQuery = function (mq) {
        var test = mq.getValid();
        var expressions = mq.getExpressions();
        var l = expressions.length;
        if (l > 0) {
            for (var i = 0; i < l && test; i++) {
                test = testMediaFeature(expressions[i].mediaFeature, expressions[i].value);
            }
            var not = mq.getNot();
            return (test && !not || not && !test);
        }
    };

    var testMediaQueryList = function (mql) {
        var mqs = mql.getMediaQueries();
        var t = {};
        for (var i = 0; i < mqs.length; i++) {
            if (testMediaQuery(mqs[i])) {
                t[mqs[i].getMediaType()] = true;
            }
        }
        var s = [], c = 0;
        for (var n in t) {
            if (t.hasOwnProperty(n)) {
                if (c > 0) {
                    s[c++] = ',';
                }
                s[c++] = n;
            }
        }
        if (s.length > 0) {
            styles[styles.length] = cssHelper.addStyle('@media ' + s.join('') + '{' + mql.getCssText() + '}', false);
        }
    };

    var testMediaQueryLists = function (mqls) {
        for (var i = 0; i < mqls.length; i++) {
            testMediaQueryList(mqls[i]);
        }
        if (ua.ie) {
            // force repaint in IE
            document.documentElement.style.display = 'block';
            setTimeout(function () {
                document.documentElement.style.display = '';
            }, 0);
            // delay broadcast somewhat for IE
            setTimeout(function () {
                cssHelper.broadcast('cssMediaQueriesTested');
            }, 100);
        }
        else {
            cssHelper.broadcast('cssMediaQueriesTested');
        }
    };

    var test = function () {
        for (var i = 0; i < styles.length; i++) {
            cssHelper.removeStyle(styles[i]);
        }
        styles = [];
        cssHelper.mediaQueryLists(testMediaQueryLists);
    };

    var scrollbarWidth = 0;
    var checkForResize = function () {
        var cvpw = cssHelper.getViewportWidth();
        var cvph = cssHelper.getViewportHeight();

        // determine scrollbar width in IE, see resizeHandler
        if (ua.ie) {
            var el = document.createElement('div');
            el.style.position = 'absolute';
            el.style.top = '-9999em';
            el.style.overflow = 'scroll';
            document.body.appendChild(el);
            scrollbarWidth = el.offsetWidth - el.clientWidth;
            document.body.removeChild(el);
        }

        var timer;
        var resizeHandler = function () {
            var vpw = cssHelper.getViewportWidth();
            var vph = cssHelper.getViewportHeight();
            // check whether vp size has really changed, because IE also triggers resize event when body size changes
            // 20px allowance to accomodate short appearance of scrollbars in IE in some cases
            if (Math.abs(vpw - cvpw) > scrollbarWidth || Math.abs(vph - cvph) > scrollbarWidth) {
                cvpw = vpw;
                cvph = vph;
                clearTimeout(timer);
                timer = setTimeout(function () {
                    if (!nativeSupport()) {
                        test();
                    }
                    else {
                        cssHelper.broadcast('cssMediaQueriesTested');
                    }
                }, 500);
            }
        };

        window.onresize = function () {
            var x = window.onresize || function () {}; // save original
            return function () {
                x();
                resizeHandler();
            };
        }();
    };

    // prevent jumping of layout by hiding everything before painting <body>
    var docEl = document.documentElement;
    docEl.style.marginLeft = '-32767px';

    // make sure it comes back after a while
    setTimeout(function () {
        docEl.style.marginTop = '';
    }, 20000);

    return function () {
        if (!nativeSupport()) { // if browser doesn't support media queries
            cssHelper.addListener('newStyleParsed', function (el) {
                testMediaQueryLists(el.cssHelperParsed.mediaQueryLists);
            });
            // return visibility after media queries are tested
            cssHelper.addListener('cssMediaQueriesTested', function () {
                // force repaint in IE by changing width
                if (ua.ie) {
                    docEl.style.width = '1px';
                }
                setTimeout(function () {
                    docEl.style.width = ''; // undo width
                    docEl.style.marginLeft = ''; // undo hide
                }, 0);
                // remove this listener to prevent following execution
                cssHelper.removeListener('cssMediaQueriesTested', arguments.callee);
            });
            createMeter();
            test();
        }
        else {
            docEl.style.marginLeft = ''; // undo visibility hidden
        }
        checkForResize();
    };
}());

// bonus: hotfix for IE6 SP1 (bug KB823727)
try {
    document.execCommand("BackgroundImageCache", false, true);
} catch (e) {}


/*
selectivizr v1.0.2 - (c) Keith Clark, freely distributable under the terms
of the MIT license.

selectivizr.com
*/
/*

Notes about this source
-----------------------

 * The #DEBUG_START and #DEBUG_END comments are used to mark blocks of code
   that will be removed prior to building a final release version (using a
   pre-compression script)


References:
-----------

 * CSS Syntax          : http://www.w3.org/TR/2003/WD-css3-syntax-20030813/#style
 * Selectors           : http://www.w3.org/TR/css3-selectors/#selectors
 * IE Compatability    : http://msdn.microsoft.com/en-us/library/cc351024(VS.85).aspx
 * W3C Selector Tests  : http://www.w3.org/Style/CSS/Test/CSS3/Selectors/current/html/tests/

*/

(function(win) {

    // If browser isn't IE, then stop execution! This handles the script
    // being loaded by non IE browsers because the developer didn't use
    // conditional comments.
    if (true) return;

    // =========================== Init Objects ============================

    var doc = document;
    var root = doc.documentElement;
    var xhr = getXHRObject();
    var ieVersion = /MSIE (\d+)/.exec(navigator.userAgent)[1];

    // If were not in standards mode, IE is too old / new or we can't create
    // an XMLHttpRequest object then we should get out now.
    if (doc.compatMode != 'CSS1Compat' || ieVersion<6 || ieVersion>8 || !xhr) {
        return;
    }


    // ========================= Common Objects ============================

    // Compatiable selector engines in order of CSS3 support. Note: '*' is
    // a placholder for the object key name. (basically, crude compression)
    var selectorEngines = {
        "NW"								: "*.Dom.select",
        "MooTools"							: "$$",
        "DOMAssistant"						: "*.$",
        "Prototype"							: "$$",
        "YAHOO"								: "*.util.Selector.query",
        "Sizzle"							: "*",
        "jQuery"							: "*",
        "dojo"								: "*.query"
    };

    var selectorMethod;
    var enabledWatchers 					= [];     // array of :enabled/:disabled elements to poll
    var ie6PatchID 							= 0;      // used to solve ie6's multiple class bug
    var patchIE6MultipleClasses				= true;   // if true adds class bloat to ie6
    var namespace 							= "slvzr";

    // Stylesheet parsing regexp's
    var RE_COMMENT							= /(\/\*[^*]*\*+([^\/][^*]*\*+)*\/)\s*/g;
    var RE_IMPORT							= /@import\s*(?:(?:(?:url\(\s*(['"]?)(.*)\1)\s*\))|(?:(['"])(.*)\3))[^;]*;/g;
    var RE_ASSET_URL 						= /\burl\(\s*(["']?)(?!data:)([^"')]+)\1\s*\)/g;
    var RE_PSEUDO_STRUCTURAL				= /^:(empty|(first|last|only|nth(-last)?)-(child|of-type))$/;
    var RE_PSEUDO_ELEMENTS					= /:(:first-(?:line|letter))/g;
    var RE_SELECTOR_GROUP					= /(^|})\s*([^\{]*?[\[:][^{]+)/g;
    var RE_SELECTOR_PARSE					= /([ +~>])|(:[a-z-]+(?:\(.*?\)+)?)|(\[.*?\])/g;
    var RE_LIBRARY_INCOMPATIBLE_PSEUDOS		= /(:not\()?:(hover|enabled|disabled|focus|checked|target|active|visited|first-line|first-letter)\)?/g;
    var RE_PATCH_CLASS_NAME_REPLACE			= /[^\w-]/g;

    // HTML UI element regexp's
    var RE_INPUT_ELEMENTS					= /^(INPUT|SELECT|TEXTAREA|BUTTON)$/;
    var RE_INPUT_CHECKABLE_TYPES			= /^(checkbox|radio)$/;

    // Broken attribute selector implementations (IE7/8 native [^=""], [$=""] and [*=""])
    var BROKEN_ATTR_IMPLEMENTATIONS			= ieVersion>6 ? /[\$\^*]=(['"])\1/ : null;

    // Whitespace normalization regexp's
    var RE_TIDY_TRAILING_WHITESPACE			= /([(\[+~])\s+/g;
    var RE_TIDY_LEADING_WHITESPACE			= /\s+([)\]+~])/g;
    var RE_TIDY_CONSECUTIVE_WHITESPACE		= /\s+/g;
    var RE_TIDY_TRIM_WHITESPACE				= /^\s*((?:[\S\s]*\S)?)\s*$/;

    // String constants
    var EMPTY_STRING						= "";
    var SPACE_STRING						= " ";
    var PLACEHOLDER_STRING					= "$1";

    // =========================== Patching ================================

    // --[ patchStyleSheet() ]----------------------------------------------
    // Scans the passed cssText for selectors that require emulation and
    // creates one or more patches for each matched selector.
    function patchStyleSheet( cssText ) {
        return cssText.replace(RE_PSEUDO_ELEMENTS, PLACEHOLDER_STRING).
        replace(RE_SELECTOR_GROUP, function(m, prefix, selectorText) {
            var selectorGroups = selectorText.split(",");
            for (var c = 0, cs = selectorGroups.length; c < cs; c++) {
                var selector = normalizeSelectorWhitespace(selectorGroups[c]) + SPACE_STRING;
                var patches = [];
                selectorGroups[c] = selector.replace(RE_SELECTOR_PARSE,
                    function(match, combinator, pseudo, attribute, index) {
                        if (combinator) {
                            if (patches.length>0) {
                                applyPatches( selector.substring(0, index), patches );
                                patches = [];
                            }
                            return combinator;
                        }
                        else {
                            var patch = (pseudo) ? patchPseudoClass( pseudo ) : patchAttribute( attribute );
                            if (patch) {
                                patches.push(patch);
                                return "." + patch.className;
                            }
                            return match;
                        }
                    }
                );
            }
            return prefix + selectorGroups.join(",");
        });
    };

    // --[ patchAttribute() ]-----------------------------------------------
    // returns a patch for an attribute selector.
    function patchAttribute( attr ) {
        return (!BROKEN_ATTR_IMPLEMENTATIONS || BROKEN_ATTR_IMPLEMENTATIONS.test(attr)) ?
            { className: createClassName(attr), applyClass: true } : null;
    };

    // --[ patchPseudoClass() ]---------------------------------------------
    // returns a patch for a pseudo-class
    function patchPseudoClass( pseudo ) {

        var applyClass = true;
        var className = createClassName(pseudo.slice(1));
        var isNegated = pseudo.substring(0, 5) == ":not(";
        var activateEventName;
        var deactivateEventName;

        // if negated, remove :not()
        if (isNegated) {
            pseudo = pseudo.slice(5, -1);
        }

        // bracket contents are irrelevant - remove them
        var bracketIndex = pseudo.indexOf("(")
        if (bracketIndex > -1) {
            pseudo = pseudo.substring(0, bracketIndex);
        }

        // check we're still dealing with a pseudo-class
        if (pseudo.charAt(0) == ":") {
            switch (pseudo.slice(1)) {

                case "root":
                    applyClass = function(e) {
                        return isNegated ? e != root : e == root;
                    }
                    break;

                case "target":
                    // :target is only supported in IE8
                    if (ieVersion == 8) {
                        applyClass = function(e) {
                            var handler = function() {
                                var hash = location.hash;
                                var hashID = hash.slice(1);
                                return isNegated ? (hash == EMPTY_STRING || e.id != hashID) : (hash != EMPTY_STRING && e.id == hashID);
                            };
                            addEvent( win, "hashchange", function() {
                                toggleElementClass(e, className, handler());
                            })
                            return handler();
                        }
                        break;
                    }
                    return false;

                case "checked":
                    applyClass = function(e) {
                        if (RE_INPUT_CHECKABLE_TYPES.test(e.type)) {
                            addEvent( e, "propertychange", function() {
                                if (event.propertyName == "checked") {
                                    toggleElementClass( e, className, e.checked !== isNegated );
                                }
                            })
                        }
                        return e.checked !== isNegated;
                    }
                    break;

                case "disabled":
                    isNegated = !isNegated;

                case "enabled":
                    applyClass = function(e) {
                        if (RE_INPUT_ELEMENTS.test(e.tagName)) {
                            addEvent( e, "propertychange", function() {
                                if (event.propertyName == "$disabled") {
                                    toggleElementClass( e, className, e.$disabled === isNegated );
                                }
                            });
                            enabledWatchers.push(e);
                            e.$disabled = e.disabled;
                            return e.disabled === isNegated;
                        }
                        return pseudo == ":enabled" ? isNegated : !isNegated;
                    }
                    break;

                case "focus":
                    activateEventName = "focus";
                    deactivateEventName = "blur";

                case "hover":
                    if (!activateEventName) {
                        activateEventName = "mouseenter";
                        deactivateEventName = "mouseleave";
                    }
                    applyClass = function(e) {
                        addEvent( e, isNegated ? deactivateEventName : activateEventName, function() {
                            toggleElementClass( e, className, true );
                        })
                        addEvent( e, isNegated ? activateEventName : deactivateEventName, function() {
                            toggleElementClass( e, className, false );
                        })
                        return isNegated;
                    }
                    break;

                // everything else
                default:
                    // If we don't support this pseudo-class don't create
                    // a patch for it
                    if (!RE_PSEUDO_STRUCTURAL.test(pseudo)) {
                        return false;
                    }
                    break;
            }
        }
        return { className: className, applyClass: applyClass };
    };

    // --[ applyPatches() ]-------------------------------------------------
    // uses the passed selector text to find DOM nodes and patch them
    function applyPatches(selectorText, patches) {
        var elms;

        // Although some selector libraries can find :checked :enabled etc.
        // we need to find all elements that could have that state because
        // it can be changed by the user.
        var domSelectorText = selectorText.replace(RE_LIBRARY_INCOMPATIBLE_PSEUDOS, EMPTY_STRING);

        // If the dom selector equates to an empty string or ends with
        // whitespace then we need to append a universal selector (*) to it.
        if (domSelectorText == EMPTY_STRING || domSelectorText.charAt(domSelectorText.length - 1) == SPACE_STRING) {
            domSelectorText += "*";
        }

        // Ensure we catch errors from the selector library
        try {
            elms = selectorMethod( domSelectorText );
        } catch (ex) {
            // #DEBUG_START
            log( "Selector '" + selectorText + "' threw exception '" + ex + "'" );
            // #DEBUG_END
        }


        if (elms) {
            for (var d = 0, dl = elms.length; d < dl; d++) {
                var elm = elms[d];
                var cssClasses = elm.className;
                for (var f = 0, fl = patches.length; f < fl; f++) {
                    var patch = patches[f];

                    if (!hasPatch(elm, patch)) {
                        if (patch.applyClass && (patch.applyClass === true || patch.applyClass(elm) === true)) {
                            cssClasses = toggleClass(cssClasses, patch.className, true );
                        }
                    }
                }
                elm.className = cssClasses;
            }
        }
    };

    // --[ hasPatch() ]-----------------------------------------------------
    // checks for the exsistence of a patch on an element
    function hasPatch( elm, patch ) {
        return new RegExp("(^|\\s)" + patch.className + "(\\s|$)").test(elm.className);
    };


    // =========================== Utility =================================

    function createClassName( className ) {
        return namespace + "-" + ((ieVersion == 6 && patchIE6MultipleClasses) ?
            ie6PatchID++
            :
            className.replace(RE_PATCH_CLASS_NAME_REPLACE, function(a) { return a.charCodeAt(0) }));
    };

    // --[ log() ]----------------------------------------------------------
    // #DEBUG_START
    function log( message ) {
        if (win.console) {
            win.console.log(message);
        }
    };
    // #DEBUG_END

    // --[ trim() ]---------------------------------------------------------
    // removes leading, trailing whitespace from a string
    function trim( text ) {
        return text.replace(RE_TIDY_TRIM_WHITESPACE, PLACEHOLDER_STRING);
    };

    // --[ normalizeWhitespace() ]------------------------------------------
    // removes leading, trailing and consecutive whitespace from a string
    function normalizeWhitespace( text ) {
        return trim(text).replace(RE_TIDY_CONSECUTIVE_WHITESPACE, SPACE_STRING);
    };

    // --[ normalizeSelectorWhitespace() ]----------------------------------
    // tidies whitespace around selector brackets and combinators
    function normalizeSelectorWhitespace( selectorText ) {
        return normalizeWhitespace(selectorText.
            replace(RE_TIDY_TRAILING_WHITESPACE, PLACEHOLDER_STRING).
            replace(RE_TIDY_LEADING_WHITESPACE, PLACEHOLDER_STRING)
        );
    };

    // --[ toggleElementClass() ]-------------------------------------------
    // toggles a single className on an element
    function toggleElementClass( elm, className, on ) {
        var oldClassName = elm.className;
        var newClassName = toggleClass(oldClassName, className, on);
        if (newClassName != oldClassName) {
            elm.className = newClassName;
            elm.parentNode.className += EMPTY_STRING;
        }
    };

    // --[ toggleClass() ]--------------------------------------------------
    // adds / removes a className from a string of classNames. Used to
    // manage multiple class changes without forcing a DOM redraw
    function toggleClass( classList, className, on ) {
        var re = RegExp("(^|\\s)" + className + "(\\s|$)");
        var classExists = re.test(classList);
        if (on) {
            return classExists ? classList : classList + SPACE_STRING + className;
        } else {
            return classExists ? trim(classList.replace(re, PLACEHOLDER_STRING)) : classList;
        }
    };

    // --[ addEvent() ]-----------------------------------------------------
    function addEvent(elm, eventName, eventHandler) {
        elm.attachEvent("on" + eventName, eventHandler);
    };

    // --[ getXHRObject() ]-------------------------------------------------
    function getXHRObject()
    {
        if (win.XMLHttpRequest) {
            return new XMLHttpRequest;
        }
        try	{
            return new ActiveXObject('Microsoft.XMLHTTP');
        } catch(e) {
            return null;
        }
    };

    // --[ loadStyleSheet() ]-----------------------------------------------
    function loadStyleSheet( url ) {
        xhr.open("GET", url, false);
        xhr.send();
        return (xhr.status==200) ? xhr.responseText : EMPTY_STRING;
    };

    // --[ resolveUrl() ]---------------------------------------------------
    // Converts a URL fragment to a fully qualified URL using the specified
    // context URL. Returns null if same-origin policy is broken
    function resolveUrl( url, contextUrl ) {

        function getProtocolAndHost( url ) {
            return url.substring(0, url.indexOf("/", 8));
        };

        // absolute path
        if (/^https?:\/\//i.test(url)) {
            return getProtocolAndHost(contextUrl) == getProtocolAndHost(url) ? url : null;
        }

        // root-relative path
        if (url.charAt(0)=="/")	{
            return getProtocolAndHost(contextUrl) + url;
        }

        // relative path
        var contextUrlPath = contextUrl.split(/[?#]/)[0]; // ignore query string in the contextUrl
        if (url.charAt(0) != "?" && contextUrlPath.charAt(contextUrlPath.length - 1) != "/") {
            contextUrlPath = contextUrlPath.substring(0, contextUrlPath.lastIndexOf("/") + 1);
        }

        return contextUrlPath + url;
    };

    // --[ parseStyleSheet() ]----------------------------------------------
    // Downloads the stylesheet specified by the URL, removes it's comments
    // and recursivly replaces @import rules with their contents, ultimately
    // returning the full cssText.
    function parseStyleSheet( url ) {
        if (url) {
            return loadStyleSheet(url).replace(RE_COMMENT, EMPTY_STRING).
            replace(RE_IMPORT, function( match, quoteChar, importUrl, quoteChar2, importUrl2 ) {
                return parseStyleSheet(resolveUrl(importUrl || importUrl2, url));
            }).
            replace(RE_ASSET_URL, function( match, quoteChar, assetUrl ) {
                quoteChar = quoteChar || EMPTY_STRING;
                return " url(" + quoteChar + resolveUrl(assetUrl, url) + quoteChar + ") ";
            });
        }
        return EMPTY_STRING;
    };

    // --[ init() ]---------------------------------------------------------
    function init() {
        // honour the <base> tag
        var url, stylesheet;
        var baseTags = doc.getElementsByTagName("BASE");
        var baseUrl = (baseTags.length > 0) ? baseTags[0].href : doc.location.href;

        /* Note: This code prevents IE from freezing / crashing when using
        @font-face .eot files but it modifies the <head> tag and could
        trigger the IE stylesheet limit. It will also cause FOUC issues.
        If you choose to use it, make sure you comment out the for loop
        directly below this comment.

        var head = doc.getElementsByTagName("head")[0];
        for (var c=doc.styleSheets.length-1; c>=0; c--) {
            stylesheet = doc.styleSheets[c]
            head.appendChild(doc.createElement("style"))
            var patchedStylesheet = doc.styleSheets[doc.styleSheets.length-1];

            if (stylesheet.href != EMPTY_STRING) {
                url = resolveUrl(stylesheet.href, baseUrl)
                if (url) {
                    patchedStylesheet.cssText = patchStyleSheet( parseStyleSheet( url ) )
                    stylesheet.disabled = true
                    setTimeout( function () {
                        stylesheet.owningElement.parentNode.removeChild(stylesheet.owningElement)
                    })
                }
            }
        }
        */

        for (var c = 0; c < doc.styleSheets.length; c++) {
            stylesheet = doc.styleSheets[c]
            if (stylesheet.href != EMPTY_STRING) {
                url = resolveUrl(stylesheet.href, baseUrl);
                if (url) {
                    stylesheet.cssText = patchStyleSheet( parseStyleSheet( url ) );
                }
            }
        }

        // :enabled & :disabled polling script (since we can't hook
        // onpropertychange event when an element is disabled)
        if (enabledWatchers.length > 0) {
            setInterval( function() {
                for (var c = 0, cl = enabledWatchers.length; c < cl; c++) {
                    var e = enabledWatchers[c];
                    if (e.disabled !== e.$disabled) {
                        if (e.disabled) {
                            e.disabled = false;
                            e.$disabled = true;
                            e.disabled = true;
                        }
                        else {
                            e.$disabled = e.disabled;
                        }
                    }
                }
            },250)
        }
    };

    // Bind selectivizr to the ContentLoaded event.
    ContentLoaded(win, function() {
        // Determine the "best fit" selector engine
        for (var engine in selectorEngines) {
            var members, member, context = win;
            if (win[engine]) {
                members = selectorEngines[engine].replace("*", engine).split(".");
                while ((member = members.shift()) && (context = context[member])) {}
                if (typeof context == "function") {
                    selectorMethod = context;
                    init();
                    return;
                }
            }
        }
    });


    /*
     * ContentLoaded.js by Diego Perini, modified for IE<9 only (to save space)
     *
     * Author: Diego Perini (diego.perini at gmail.com)
     * Summary: cross-browser wrapper for DOMContentLoaded
     * Updated: 20101020
     * License: MIT
     * Version: 1.2
     *
     * URL:
     * http://javascript.nwbox.com/ContentLoaded/
     * http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
     *
     */

    // @w window reference
    // @f function reference
    function ContentLoaded(win, fn) {

        var done = false, top = true,
            init = function(e) {
                if (e.type == "readystatechange" && doc.readyState != "complete") return;
                (e.type == "load" ? win : doc).detachEvent("on" + e.type, init, false);
                if (!done && (done = true)) fn.call(win, e.type || e);
            },
            poll = function() {
                try { root.doScroll("left"); } catch(e) { setTimeout(poll, 50); return; }
                init('poll');
            };

        if (doc.readyState == "complete") fn.call(win, EMPTY_STRING);
        else {
            if (doc.createEventObject && root.doScroll) {
                try { top = !win.frameElement; } catch(e) { }
                if (top) poll();
            }
            addEvent(doc,"readystatechange", init);
            addEvent(win,"load", init);
        }
    };
})(this);