/*
 * jQuery Mousewheel 3.1.13
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 */

(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node/CommonJS style for Browserify
    module.exports = factory;
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function ($) {

  var toFix = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
      toBind = ('onwheel' in document || document.documentMode >= 9) ? ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
      slice = Array.prototype.slice,
      nullLowestDeltaTimeout, lowestDelta;

  if ($.event.fixHooks) {
    for (var i = toFix.length; i;) {
      $.event.fixHooks[toFix[--i]] = $.event.mouseHooks;
    }
  }

  var special = $.event.special.mousewheel = {
    version: '3.1.12',

    setup: function () {
      if (this.addEventListener) {
        for (var i = toBind.length; i;) {
          this.addEventListener(toBind[--i], handler, false);
        }
      } else {
        this.onmousewheel = handler;
      }
      // Store the line height and page height for this particular element
      $.data(this, 'mousewheel-line-height', special.getLineHeight(this));
      $.data(this, 'mousewheel-page-height', special.getPageHeight(this));
    },

    teardown: function () {
      if (this.removeEventListener) {
        for (var i = toBind.length; i;) {
          this.removeEventListener(toBind[--i], handler, false);
        }
      } else {
        this.onmousewheel = null;
      }
      // Clean up the data we added to the element
      $.removeData(this, 'mousewheel-line-height');
      $.removeData(this, 'mousewheel-page-height');
    },

    getLineHeight: function (elem) {
      var $elem = $(elem),
          $parent = $elem['offsetParent' in $.fn ? 'offsetParent' : 'parent']();
      if (!$parent.length) {
        $parent = $('body');
      }
      return parseInt($parent.css('fontSize'), 10) || parseInt($elem.css('fontSize'), 10) || 16;
    },

    getPageHeight: function (elem) {
      return $(elem).height();
    },

    settings: {
      adjustOldDeltas: true, // see shouldAdjustOldDeltas() below
      normalizeOffset: true  // calls getBoundingClientRect for each event
    }
  };

  $.fn.extend({
    mousewheel: function (fn) {
      return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
    },

    unmousewheel: function (fn) {
      return this.unbind('mousewheel', fn);
    }
  });

  function handler(event) {
    var orgEvent = event || window.event,
        args = slice.call(arguments, 1),
        delta = 0,
        deltaX = 0,
        deltaY = 0,
        absDelta = 0,
        offsetX = 0,
        offsetY = 0;
    event = $.event.fix(orgEvent);
    event.type = 'mousewheel';

    // Old school scrollwheel delta
    if ('detail' in orgEvent) {
      deltaY = orgEvent.detail * -1;
    }
    if ('wheelDelta' in orgEvent) {
      deltaY = orgEvent.wheelDelta;
    }
    if ('wheelDeltaY' in orgEvent) {
      deltaY = orgEvent.wheelDeltaY;
    }
    if ('wheelDeltaX' in orgEvent) {
      deltaX = orgEvent.wheelDeltaX * -1;
    }

    // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
    if ('axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
      deltaX = deltaY * -1;
      deltaY = 0;
    }

    // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
    delta = deltaY === 0 ? deltaX : deltaY;

    // New school wheel delta (wheel event)
    if ('deltaY' in orgEvent) {
      deltaY = orgEvent.deltaY * -1;
      delta = deltaY;
    }
    if ('deltaX' in orgEvent) {
      deltaX = orgEvent.deltaX;
      if (deltaY === 0) {
        delta = deltaX * -1;
      }
    }

    // No change actually happened, no reason to go any further
    if (deltaY === 0 && deltaX === 0) {
      return;
    }

    // Need to convert lines and pages to pixels if we aren't already in pixels
    // There are three delta modes:
    //   * deltaMode 0 is by pixels, nothing to do
    //   * deltaMode 1 is by lines
    //   * deltaMode 2 is by pages
    if (orgEvent.deltaMode === 1) {
      var lineHeight = $.data(this, 'mousewheel-line-height');
      delta *= lineHeight;
      deltaY *= lineHeight;
      deltaX *= lineHeight;
    } else if (orgEvent.deltaMode === 2) {
      var pageHeight = $.data(this, 'mousewheel-page-height');
      delta *= pageHeight;
      deltaY *= pageHeight;
      deltaX *= pageHeight;
    }

    // Store lowest absolute delta to normalize the delta values
    absDelta = Math.max(Math.abs(deltaY), Math.abs(deltaX));

    if (!lowestDelta || absDelta < lowestDelta) {
      lowestDelta = absDelta;

      // Adjust older deltas if necessary
      if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
        lowestDelta /= 40;
      }
    }

    // Adjust older deltas if necessary
    if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
      // Divide all the things by 40!
      delta /= 40;
      deltaX /= 40;
      deltaY /= 40;
    }

    // Get a whole, normalized value for the deltas
    delta = Math[delta >= 1 ? 'floor' : 'ceil'](delta / lowestDelta);
    deltaX = Math[deltaX >= 1 ? 'floor' : 'ceil'](deltaX / lowestDelta);
    deltaY = Math[deltaY >= 1 ? 'floor' : 'ceil'](deltaY / lowestDelta);

    // Normalise offsetX and offsetY properties
    if (special.settings.normalizeOffset && this.getBoundingClientRect) {
      var boundingRect = this.getBoundingClientRect();
      offsetX = event.clientX - boundingRect.left;
      offsetY = event.clientY - boundingRect.top;
    }

    // Add information to the event object
    event.deltaX = deltaX;
    event.deltaY = deltaY;
    event.deltaFactor = lowestDelta;
    event.offsetX = offsetX;
    event.offsetY = offsetY;
    // Go ahead and set deltaMode to 0 since we converted to pixels
    // Although this is a little odd since we overwrite the deltaX/Y
    // properties with normalized deltas.
    event.deltaMode = 0;

    // Add event and delta to the front of the arguments
    args.unshift(event, delta, deltaX, deltaY);

    // Clearout lowestDelta after sometime to better
    // handle multiple device types that give different
    // a different lowestDelta
    // Ex: trackpad = 3 and mouse wheel = 120
    if (nullLowestDeltaTimeout) {
      clearTimeout(nullLowestDeltaTimeout);
    }
    nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);

    return ($.event.dispatch || $.event.handle).apply(this, args);
  }

  function nullLowestDelta() {
    lowestDelta = null;
  }

  function shouldAdjustOldDeltas(orgEvent, absDelta) {
    // If this is an older event and the delta is divisable by 120,
    // then we are assuming that the browser is treating this as an
    // older mouse wheel event and that we should divide the deltas
    // by 40 to try and get a more usable deltaFactor.
    // Side note, this actually impacts the reported scroll distance
    // in older browsers and can cause scrolling to be slower than native.
    // Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
    return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
  }

}));

/**
 * awaSlide v1.0
 */

;(function ($) {

  var defaults = {

    // GENERAL
    mode: 'horizontal',
    slideSelector: '',
    infiniteLoop: true,
    hideControlOnEnd: false,
    speed: 500,
    slideMargin: 0,
    startSlide: 0,
    adaptiveHeight: false,
    adaptiveHeightSpeed: 500,
    video: false,
    useCSS: true,
    preloadImages: 'visible',
    responsive: true,

    // TOUCH
    touchEnabled: true,
    swipeThreshold: 50,
    oneToOneTouch: true,
    preventDefaultSwipeX: true,
    preventDefaultSwipeY: false,

    // PAGER
    pager: true,
    pagerType: 'dot',

    // CONTROLS
    controls: true,
    autoControls: false,

    // AUTO
    auto: false,
    pause: 4000,
    autoStart: true,
    autoDirection: 'next',
    stopAutoOnClick: false,
    autoHover: false,
    autoDelay: 0,
    autoSlideForOnePage: false,

    // CAROUSEL
    minSlides: 1,
    maxSlides: 1,
    moveSlides: 0,
    slideWidth: 0,
    shrinkItems: false,
    fitSlideWidth: false,

    // CALLBACKS
    onSliderLoad: function () {
      return true;
    },
    onSlideBefore: function () {
      return true;
    },
    onSlideAfter: function () {
      return true;
    },
    onSlideNext: function () {
      return true;
    },
    onSlidePrev: function () {
      return true;
    },
    onSliderResize: function () {
      return true;
    },
    onAutoChange: function () {
      return true;
    }
  };

  $.fn.awaSlide = function (options) {

    if (this.length === 0) {
      return this;
    }

    if (this.length > 1) {
      this.each(function () {
        $(this).awaSlide(options);
      });
      return this;
    }

    var slider = {},
        el = this,
        windowWidth = $(window).width(),
        windowHeight = $(window).height();

    if ($(el).data('awaSlide')) {
      return;
    }

    /**
     * ===================================================================================
     * = PRIVATE FUNCTIONS
     * ===================================================================================
     */

    /**
     * Initializes namespace settings to be used throughout plugin
     */
    var init = function () {
      if ($(el).data('awa-slide')) {
        return;
      }
      slider.settings = $.extend({}, defaults, options);
      slider.settings.slideWidth = parseInt(slider.settings.slideWidth);
      slider.children = el.children(slider.settings.slideSelector);
      if (slider.children.length < slider.settings.minSlides) {
        slider.settings.minSlides = slider.children.length;
      }
      if (slider.children.length < slider.settings.maxSlides) {
        slider.settings.maxSlides = slider.children.length;
      }
      slider.active = {index: slider.settings.startSlide};
      slider.carousel = slider.settings.minSlides > 1 || slider.settings.maxSlides > 1 ? true : false;
      if (slider.carousel) {
        slider.settings.preloadImages = 'all';
      }
      slider.minThreshold = (slider.settings.minSlides * slider.settings.slideWidth) + ((slider.settings.minSlides - 1)
          * slider.settings.slideMargin);
      slider.maxThreshold = (slider.settings.maxSlides * slider.settings.slideWidth) + ((slider.settings.maxSlides - 1)
          * slider.settings.slideMargin);
      slider.working = false;
      slider.controls = {};
      slider.interval = null;
      slider.animProp = slider.settings.mode === 'vertical' ? 'top' : 'left';
      slider.usingCSS = slider.settings.useCSS && slider.settings.mode !== 'fade' && (function () {
        var div = document.createElement('div'),
            props = ['WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
        for (var i = 0; i < props.length; i++) {
          if (div.style[props[i]] !== undefined) {
            slider.cssPrefix = props[i].replace('Perspective', '').toLowerCase();
            slider.animProp = '-' + slider.cssPrefix + '-transform';
            return true;
          }
        }
        return false;
      }());
      if (slider.settings.mode === 'vertical') {
        slider.settings.maxSlides = slider.settings.minSlides;
      }
      el.data('origStyle', el.attr('style'));
      el.children(slider.settings.slideSelector).each(function () {
        $(this).data('origStyle', $(this).attr('style'));
      });

      setup();
    };

    /**
     * Performs all DOM and CSS modifications
     */
    var setup = function () {
      var preloadSelector = slider.children.eq(slider.settings.startSlide);

      el.wrap('<div class="awa-slide"><div class="awa-slide__viewport"></div></div>');
      slider.viewport = el.parent();

      slider.loader = $('<div class="awa-slide__loading" />');
      slider.viewport.prepend(slider.loader);
      el.css({
        width: slider.settings.mode === 'horizontal' ? (slider.children.length * 1000 + 215) + '%' : 'auto',
        position: 'relative'
      });
      if (slider.usingCSS && slider.settings.easing) {
        el.css('-' + slider.cssPrefix + '-transition-timing-function', slider.settings.easing);
      } else if (!slider.settings.easing) {
        slider.settings.easing = 'swing';
      }
      slider.viewport.css({
        width: '100%',
        overflow: 'hidden',
        position: 'relative'
      });
      slider.viewport.parent().css({
        maxWidth: getViewportMaxWidth()
      });
      slider.children.css({
        'float': slider.settings.mode === 'horizontal' ? 'left' : 'none',
        listStyle: 'none',
        position: 'relative'
      });
      slider.children.css('width', getSlideWidth());
      if (slider.settings.mode === 'horizontal' && slider.settings.slideMargin > 0) {
        slider.children.css('marginRight', slider.settings.slideMargin);
      }
      if (slider.settings.mode === 'vertical' && slider.settings.slideMargin > 0) {
        slider.children.css('marginBottom', slider.settings.slideMargin);
      }
      if (slider.settings.mode === 'fade') {
        slider.children.css({
          position: 'absolute',
          zIndex: 0,
          display: 'none'
        });
        slider.children.eq(slider.settings.startSlide).css({zIndex: '1', display: 'block'});
      }
      slider.controls.el = $('<div class="awa-slide__controls" />');
      slider.active.last = slider.settings.startSlide === getPagerQty() - 1;
      if (slider.settings.video) {
        el.fitVids();
      }
      if (slider.settings.preloadImages === 'all') {
        preloadSelector = slider.children;
      }
      if (slider.settings.controls) {
        appendControls();
      }
      if (slider.settings.auto && slider.settings.autoControls) {
        appendControlsAuto();
      }
      if (slider.settings.pager) {
        appendPager();
      }
      if (slider.settings.controls || slider.settings.autoControls || slider.settings.pager) {
        slider.viewport.after(slider.controls.el);
      }
      loadElements(preloadSelector, start);
    };

    var loadElements = function (selector, callback) {
      var total = selector.find('img:not([src=""]), iframe').length,
          count = 0;
      if (total === 0) {
        callback();
        return;
      }
      selector.find('img:not([src=""]), iframe').each(function () {
        $(this).one('load error', function () {
          if (++count === total) {
            callback();
          }
        }).each(function () {
          if (this.complete || this.src == '') {
            $(this).trigger('load');
          }
        });
      });
    };

    /**
     * Start the slider
     */
    var start = function () {
      if (slider.settings.infiniteLoop && slider.settings.mode !== 'fade') {
        var slice = slider.settings.mode === 'vertical' ? slider.settings.minSlides : slider.settings.maxSlides,
            sliceAppend = slider.children.slice(0, slice).clone(true).addClass('awa-slide__item--clone'),
            slicePrepend = slider.children.slice(-slice).clone(true).addClass('awa-slide__item--clone');
        el.append(sliceAppend).prepend(slicePrepend);
      }

      slider.loader.remove();
      setSlidePosition();
      if (slider.settings.mode === 'vertical') {
        slider.settings.adaptiveHeight = true;
      }
      slider.viewport.height(getViewportHeight());
      el.redrawSlider();
      slider.settings.onSliderLoad.call(el, slider.active.index);
      slider.initialized = true;
      if (slider.settings.responsive) {
        $(window).bind('resize', resizeWindow);
      }
      if (slider.settings.auto && slider.settings.autoStart && (getPagerQty() > 1 || slider.settings.autoSlideForOnePage)) {
        initAuto();
      }
      if (slider.settings.pager) {
        updatePagerActive(slider.settings.startSlide);
      }
      if (slider.settings.controls) {
        updateDirectionControls();
      }
      if (slider.settings.touchEnabled) {
        initTouch();
      }

    };

    /**
     * Returns the calculated height of the viewport, used to determine either adaptiveHeight or the maxHeight value
     */
    var getViewportHeight = function () {
      var height = 0;
      var children = $();
      if (slider.settings.mode !== 'vertical' && !slider.settings.adaptiveHeight) {
        children = slider.children;
      } else {
        if (!slider.carousel) {
          children = slider.children.eq(slider.active.index);
        } else {
          var currentIndex = slider.settings.moveSlides === 1 ? slider.active.index : slider.active.index * getMoveBy();
          children = slider.children.eq(currentIndex);
          for (i = 1; i <= slider.settings.maxSlides - 1; i++) {
            if (currentIndex + i >= slider.children.length) {
              children = children.add(slider.children.eq(i - 1));
            } else {
              children = children.add(slider.children.eq(currentIndex + i));
            }
          }
        }
      }
      if (slider.settings.mode === 'vertical') {
        children.each(function (index) {
          height += $(this).outerHeight();
        });
        if (slider.settings.slideMargin > 0) {
          height += slider.settings.slideMargin * (slider.settings.minSlides - 1);
        }
      } else {
        height = Math.max.apply(Math, children.map(function () {
          return $(this).outerHeight(false);
        }).get());
      }

      if (slider.viewport.css('box-sizing') === 'border-box') {
        height += parseFloat(slider.viewport.css('padding-top')) + parseFloat(slider.viewport.css('padding-bottom')) +
            parseFloat(slider.viewport.css('border-top-width')) + parseFloat(slider.viewport.css('border-bottom-width'));
      } else if (slider.viewport.css('box-sizing') === 'padding-box') {
        height += parseFloat(slider.viewport.css('padding-top')) + parseFloat(slider.viewport.css('padding-bottom'));
      }

      return height;
    };

    /**
     * Returns the calculated width to be used for the outer wrapper / viewport
     */
    var getViewportMaxWidth = function () {
      var width = '100%';
      var children = $();
      if (slider.settings.fitSlideWidth) {
        children = slider.children;
        width = '';
        children.each(function (index) {
          width += $(this).outerWidth() + slider.settings.slideMargin;
        });
      } else {
        if (slider.settings.slideWidth > 0) {
          if (slider.settings.mode === 'horizontal') {
            width = (slider.settings.maxSlides * slider.settings.slideWidth) + ((slider.settings.maxSlides - 1)
                * slider.settings.slideMargin);
          } else {
            width = slider.settings.slideWidth;
          }
        }
      }

      return width;
    };

    /**
     * Returns the calculated width to be applied to each slide
     */
    var getSlideWidth = function () {
      var newElWidth = slider.settings.slideWidth,
          wrapWidth = slider.viewport.width();
      if (slider.settings.slideWidth === 0 ||
          (slider.settings.slideWidth > wrapWidth && !slider.carousel) ||
          slider.settings.mode === 'vertical') {
        newElWidth = wrapWidth;
      } else if (slider.settings.maxSlides > 1 && slider.settings.mode === 'horizontal') {
        if (wrapWidth > slider.maxThreshold) {
        } else if (wrapWidth < slider.minThreshold) {
          newElWidth = (wrapWidth - (slider.settings.slideMargin * (slider.settings.minSlides - 1))) / slider.settings.minSlides;
        } else if (slider.settings.shrinkItems) {
          newElWidth = Math.floor((wrapWidth + slider.settings.slideMargin) / (Math.ceil((wrapWidth + slider.settings.slideMargin)
              / (newElWidth + slider.settings.slideMargin))) - slider.settings.slideMargin);
        }
      }

      if (slider.settings.fitSlideWidth) {
        newElWidth = "max-content";
      }

      return newElWidth;
    };

    /**
     * Returns the number of slides currently visible in the viewport (includes partially visible slides)
     */
    var getNumberSlidesShowing = function () {
      var slidesShowing = 1,
          childWidth = null;
      if (slider.settings.mode === 'horizontal' && slider.settings.slideWidth > 0) {
        if (slider.viewport.width() < slider.minThreshold) {
          slidesShowing = slider.settings.minSlides;
        } else if (slider.viewport.width() > slider.maxThreshold) {
          slidesShowing = slider.settings.maxSlides;
        } else {
          childWidth = slider.children.first().width() + slider.settings.slideMargin;
          slidesShowing = Math.floor((slider.viewport.width() +
              slider.settings.slideMargin) / childWidth) || 1;
        }
      } else if (slider.settings.mode === 'vertical') {
        slidesShowing = slider.settings.minSlides;
      }
      return slidesShowing;
    };

    /**
     * Returns the number of pages (one full viewport of slides is one "page")
     */
    var getPagerQty = function () {
      var pagerQty = 0,
          breakPoint = 0,
          counter = 0;
      if (slider.settings.moveSlides > 0) {
        if (slider.settings.infiniteLoop) {
          pagerQty = Math.ceil(slider.children.length / getMoveBy());
        } else {
          while (breakPoint < slider.children.length) {
            ++pagerQty;
            breakPoint = counter + getNumberSlidesShowing();
            counter += slider.settings.moveSlides <= getNumberSlidesShowing() ? slider.settings.moveSlides : getNumberSlidesShowing();
          }
          return counter;
        }
      } else {
        pagerQty = Math.ceil(slider.children.length / getNumberSlidesShowing());
      }
      return pagerQty;
    };

    /**
     * Returns the number of individual slides by which to shift the slider
     */
    var getMoveBy = function () {
      if (slider.settings.moveSlides > 0 && slider.settings.moveSlides <= getNumberSlidesShowing()) {
        return slider.settings.moveSlides;
      }
      return getNumberSlidesShowing();
    };

    /**
     * Sets the slider's (el) left or top position
     */
    var setSlidePosition = function () {
      var position, lastChild, lastShowingIndex;
      if (slider.children.length > slider.settings.maxSlides && slider.active.last && !slider.settings.infiniteLoop) {
        if (slider.settings.mode === 'horizontal') {
          lastChild = slider.children.last();
          position = lastChild.position();
          setPositionProperty(-(position.left - (slider.viewport.width() - lastChild.outerWidth())), 'reset', 0);
        } else if (slider.settings.mode === 'vertical') {
          lastShowingIndex = slider.children.length - slider.settings.minSlides;
          position = slider.children.eq(lastShowingIndex).position();
          setPositionProperty(-position.top, 'reset', 0);
        }
      } else {
        position = slider.children.eq(slider.active.index * getMoveBy()).position();
        if (slider.active.index === getPagerQty() - 1) {
          slider.active.last = true;
        }
        if (position !== undefined) {
          if (slider.settings.mode === 'horizontal') {
            setPositionProperty(-position.left, 'reset', 0);
          }
          else if (slider.settings.mode === 'vertical') {
            setPositionProperty(-position.top, 'reset', 0);
          }
        }
      }
    };

    /**
     * Sets the el's animating property position (which in turn will sometimes animate el).
     * If using CSS, sets the transform property. If not using CSS, sets the top / left property.
     *
     * @param value (int)
     *  - the animating property's value
     *
     * @param type (string) 'slide', 'reset'
     *  - the type of instance for which the function is being
     *
     * @param duration (int)
     *  - the amount of time (in ms) the transition should occupy
     *
     * @param params (array) optional
     *  - an optional parameter containing any variables that need to be passed in
     */
    var setPositionProperty = function (value, type, duration, params) {
      var animateObj, propValue;
      // use CSS transform
      if (slider.usingCSS) {
        // determine the translate3d value
        propValue = slider.settings.mode === 'vertical' ? 'translate3d(0, ' + value + 'px, 0)' : 'translate3d(' + value + 'px, 0, 0)';
        // add the CSS transition-duration
        el.css('-' + slider.cssPrefix + '-transition-duration', duration / 1000 + 's');
        if (type === 'slide') {
          // set the property value
          el.css(slider.animProp, propValue);
          if (duration !== 0) {
            // bind a callback method - executes when CSS transition completes
            el.bind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function (e) {
              //make sure it's the correct one
              if (!$(e.target).is(el)) {
                return;
              }
              // unbind the callback
              el.unbind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd');
              updateAfterSlideTransition();
            });
          } else { //duration = 0
            updateAfterSlideTransition();
          }
        } else if (type === 'reset') {
          el.css(slider.animProp, propValue);
        } else if (type === 'ticker') {
          // make the transition use 'linear'
          el.css('-' + slider.cssPrefix + '-transition-timing-function', 'linear');
          el.css(slider.animProp, propValue);
          if (duration !== 0) {
            el.bind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function (e) {
              //make sure it's the correct one
              if (!$(e.target).is(el)) {
                return;
              }
              // unbind the callback
              el.unbind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd');
              // reset the position
              setPositionProperty(params.resetValue, 'reset', 0);
              // start the loop again
              tickerLoop();
            });
          } else { //duration = 0
            setPositionProperty(params.resetValue, 'reset', 0);
            tickerLoop();
          }
        }
        // use JS animate
      } else {
        animateObj = {};
        animateObj[slider.animProp] = value;
        if (type === 'slide') {
          el.animate(animateObj, duration, slider.settings.easing, function () {
            updateAfterSlideTransition();
          });
        } else if (type === 'reset') {
          el.css(slider.animProp, value);
        } else if (type === 'ticker') {
          el.animate(animateObj, duration, 'linear', function () {
            setPositionProperty(params.resetValue, 'reset', 0);
            // run the recursive loop after animation
            tickerLoop();
          });
        }
      }
    };

    /**
     * Populates the pager with proper amount of pages
     */
    var populatePager = function () {
      var pagerHtml = '',
          linkContent = '',
          pagerQty = getPagerQty();
      for (var i = 0; i < pagerQty; i++) {
        linkContent = '';
        linkContent = "0" + (i + 1);
        slider.pagerEl.addClass('awa-slide__default-pager');
        pagerHtml += '<span class="awa-slide__pager-item"><a href="" data-slide-index="' + i + '" class="awa-slide__pager-link">'
            + linkContent + '</a></span>';
      }
      slider.pagerEl.html(pagerHtml);
    };

    /**
     * Appends the pager to the controls element
     */
    var appendPager = function () {
      slider.pagerEl = $('<div class="awa-slide__pager" />');
      slider.controls.el.addClass('awa-slide__pager--has').append(slider.pagerEl);
      populatePager();
      slider.pagerEl.on('click touchend', 'a', clickPagerBind);
    };

    /**
     * Appends prev / next controls to the controls element
     */
    var appendControls = function () {
      slider.controls.next = $('<a class="awa-slide__next" href="">Next</a>');
      slider.controls.prev = $('<a class="awa-slide__prev" href="">Prev</a>');
      slider.controls.next.bind('click touchend', clickNextBind);
      slider.controls.prev.bind('click touchend', clickPrevBind);

      slider.controls.directionEl = $('<div class="awa-slide__controls-direction" />');
      slider.controls.directionEl.append(slider.controls.prev).append(slider.controls.next);
      slider.controls.el.addClass('awa-slide__controls-direction--has').append(slider.controls.directionEl);
    };

    /**
     * Appends start / stop auto controls to the controls element
     */
    var appendControlsAuto = function () {
      slider.controls.start = $('<div class="awa-slide__controls-auto-item"><a class="awa-slide__start" href="">start</a></div>');
      slider.controls.stop = $('<div class="awa-slide__controls-auto-item"><a class="awa-slide__stop" href="">stop</a></div>');
      slider.controls.autoEl = $('<div class="awa-slide__controls-auto" />');
      slider.controls.autoEl.on('click', '.awa-slide__start', clickStartBind);
      slider.controls.autoEl.on('click', '.awa-slide__stop', clickStopBind);
      slider.controls.autoEl.append(slider.controls.start).append(slider.controls.stop);
      slider.controls.el.addClass('awa-slide__controls-auto--has').append(slider.controls.autoEl);
      updateAutoControls(slider.settings.autoStart ? 'stop' : 'start');
    };

    /**
     * Click next binding
     *
     * @param e (event)
     *  - DOM event object
     */
    var clickNextBind = function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (slider.controls.el.hasClass('disabled')) {
        return;
      }
      if (slider.settings.auto && slider.settings.stopAutoOnClick) {
        el.stopAuto();
      }
      el.goToNextSlide();
    };

    /**
     * Click prev binding
     *
     * @param e (event)
     *  - DOM event object
     */
    var clickPrevBind = function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (slider.controls.el.hasClass('disabled')) {
        return;
      }
      if (slider.settings.auto && slider.settings.stopAutoOnClick) {
        el.stopAuto();
      }
      el.goToPrevSlide();
    };

    /**
     * Click start binding
     *
     * @param e (event)
     *  - DOM event object
     */
    var clickStartBind = function (e) {
      el.startAuto();
      e.preventDefault();
    };

    /**
     * Click stop binding
     *
     * @param e (event)
     *  - DOM event object
     */
    var clickStopBind = function (e) {
      el.stopAuto();
      e.preventDefault();
    };

    /**
     * Click pager binding
     *
     * @param e (event)
     *  - DOM event object
     */
    var clickPagerBind = function (e) {
      var pagerLink, pagerIndex;
      e.preventDefault();
      if (slider.controls.el.hasClass('disabled')) {
        return;
      }
      if (slider.settings.auto && slider.settings.stopAutoOnClick) {
        el.stopAuto();
      }
      pagerLink = $(e.currentTarget);
      if (pagerLink.attr('data-slide-index') !== undefined) {
        pagerIndex = parseInt(pagerLink.attr('data-slide-index'));
        if (pagerIndex !== slider.active.index) {
          el.goToSlide(pagerIndex);
        }
      }
    };

    /**
     * Updates the pager links with an active class
     *
     * @param slideIndex (int)
     *  - index of slide to make active
     */
    var updatePagerActive = function (slideIndex) {
      var len = slider.children.length;
      if (slider.settings.pagerType === 'num') {
        if (slider.settings.maxSlides > 1) {
          len = Math.ceil(slider.children.length / slider.settings.maxSlides);
        }
        slider.pagerEl.html((slideIndex + 1) + '/' + len);
        return;
      }
      slider.pagerEl.find('a').removeClass('awa-slide_pager-link--active');
      slider.pagerEl.each(function (i, el) {
        $(el).find('a').eq(slideIndex).addClass('awa-slide_pager-link--active');
      });
    };

    /**
     * Performs needed actions after a slide transition
     */
    var updateAfterSlideTransition = function () {
      if (slider.settings.infiniteLoop) {
        var position = '';
        if (slider.active.index === 0) {
          position = slider.children.eq(0).position();
        } else if (slider.active.index === getPagerQty() - 1 && slider.carousel) {
          position = slider.children.eq((getPagerQty() - 1) * getMoveBy()).position();
        } else if (slider.active.index === slider.children.length - 1) {
          position = slider.children.eq(slider.children.length - 1).position();
        }
        if (position) {
          if (slider.settings.mode === 'horizontal') {
            setPositionProperty(-position.left, 'reset', 0);
          }
          else if (slider.settings.mode === 'vertical') {
            setPositionProperty(-position.top, 'reset', 0);
          }
        }
      }
      slider.working = false;
      slider.settings.onSlideAfter.call(el, slider.children.eq(slider.active.index), slider.oldIndex, slider.active.index);
    };

    /**
     * Updates the auto controls state (either active, or combined switch)
     *
     * @param state (string) "start", "stop"
     *  - the new state of the auto show
     */
    var updateAutoControls = function (state) {
      slider.controls.autoEl.find('a').removeClass('awa--active');
      slider.controls.autoEl.find('a:not(.awa__' + state + ')').addClass('awa--active');
    };

    /**
     * Updates the direction controls (checks if either should be hidden)
     */
    var updateDirectionControls = function () {
      var prevText = slider.controls.prev.attr('class'), nextText = slider.controls.next.attr('class');
      if (getPagerQty() === 1) {
        slider.controls.prev.addClass('disabled');
        slider.controls.next.addClass('disabled');
      } else if (!slider.settings.infiniteLoop && slider.settings.hideControlOnEnd) {
        if (slider.active.index === 0) {
          slider.controls.prev.addClass('disabled');
          slider.controls.next.removeClass('disabled');
        } else if (slider.active.index === getPagerQty() - 1) {
          slider.controls.next.addClass('disabled');
          slider.controls.prev.removeClass('disabled');
        } else {
          slider.controls.prev.removeClass('disabled');
          slider.controls.next.removeClass('disabled');
        }
      }
    };
    /* auto start and stop functions */
    var windowFocusHandler = function () {
      el.startAuto();
    };
    var windowBlurHandler = function () {
      el.stopAuto();
    };
    /**
     * Initializes the auto process
     */
    var initAuto = function () {
      if (slider.settings.autoDelay > 0) {
        var timeout = setTimeout(el.startAuto, slider.settings.autoDelay);
      } else {
        el.startAuto();

        $(window).focus(windowFocusHandler).blur(windowBlurHandler);
      }
      if (slider.settings.autoHover) {
        el.hover(function () {
          if (slider.interval) {
            el.stopAuto(true);
            slider.autoPaused = true;
          }
        }, function () {
          if (slider.autoPaused) {
            el.startAuto(true);
            slider.autoPaused = null;
          }
        });
      }
    };

    /**
     * Check if el is on screen
     */
    var isOnScreen = function (el) {
      var win = $(window),
          viewport = {
            top: win.scrollTop(),
            left: win.scrollLeft()
          },
          bounds = el.offset();

      viewport.right = viewport.left + win.width();
      viewport.bottom = viewport.top + win.height();
      bounds.right = bounds.left + el.outerWidth();
      bounds.bottom = bounds.top + el.outerHeight();

      return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top
          > bounds.bottom));
    };

    /**
     * Initializes touch events
     */
    var initTouch = function () {
      slider.touch = {
        start: {x: 0, y: 0},
        end: {x: 0, y: 0}
      };
      slider.viewport.bind('touchstart', onTouchStart);
      slider.viewport.on('click', '.awa-slide a', function (e) {
        if (slider.viewport.hasClass('click-disabled')) {
          e.preventDefault();
          slider.viewport.removeClass('click-disabled');
        }
      });
    };

    /**
     * Event handler for "touchstart"
     *
     * @param e (event)
     *  - DOM event object
     */
    var onTouchStart = function (e) {
      slider.controls.el.addClass('disabled');

      if (slider.working) {
        e.preventDefault();
        slider.controls.el.removeClass('disabled');
      } else {
        slider.touch.originalPos = el.position();
        var orig = e.originalEvent,
            touchPoints = (typeof orig.changedTouches !== 'undefined') ? orig.changedTouches : [orig];
        slider.touch.start.x = touchPoints[0].pageX;
        slider.touch.start.y = touchPoints[0].pageY;

        if (slider.viewport.get(0).setPointerCapture) {
          slider.pointerId = orig.pointerId;
          slider.viewport.get(0).setPointerCapture(slider.pointerId);
        }
        slider.viewport.bind('touchmove', onTouchMove);
        slider.viewport.bind('touchend', onTouchEnd);
      }
    };

    /**
     * Event handler for "touchmove"
     *
     * @param e (event)
     *  - DOM event object
     */
    var onTouchMove = function (e) {
      var orig = e.originalEvent,
          touchPoints = (typeof orig.changedTouches !== 'undefined') ? orig.changedTouches : [orig],
          xMovement = Math.abs(touchPoints[0].pageX - slider.touch.start.x),
          yMovement = Math.abs(touchPoints[0].pageY - slider.touch.start.y),
          value = 0,
          change = 0;

      if ((xMovement * 3) > yMovement && slider.settings.preventDefaultSwipeX) {
        e.preventDefault();
      } else if ((yMovement * 3) > xMovement && slider.settings.preventDefaultSwipeY) {
        e.preventDefault();
      }
      if (slider.settings.mode !== 'fade' && slider.settings.oneToOneTouch) {
        if (slider.settings.mode === 'horizontal') {
          change = touchPoints[0].pageX - slider.touch.start.x;
          value = slider.touch.originalPos.left + change;
        } else {
          change = touchPoints[0].pageY - slider.touch.start.y;
          value = slider.touch.originalPos.top + change;
        }
        setPositionProperty(value, 'reset', 0);
      }
    };

    /**
     * Event handler for "touchend"
     *
     * @param e (event)
     *  - DOM event object
     */
    var onTouchEnd = function (e) {
      slider.viewport.unbind('touchmove', onTouchMove);
      slider.controls.el.removeClass('disabled');
      var orig = e.originalEvent,
          touchPoints = (typeof orig.changedTouches !== 'undefined') ? orig.changedTouches : [orig],
          value = 0,
          distance = 0;
      slider.touch.end.x = touchPoints[0].pageX;
      slider.touch.end.y = touchPoints[0].pageY;
      if (slider.settings.mode === 'fade') {
        distance = Math.abs(slider.touch.start.x - slider.touch.end.x);
        if (distance >= slider.settings.swipeThreshold) {
          if (slider.touch.start.x > slider.touch.end.x) {
            el.goToNextSlide();
          } else {
            el.goToPrevSlide();
          }
          el.stopAuto();
        }
      } else {
        if (slider.settings.mode === 'horizontal') {
          distance = slider.touch.end.x - slider.touch.start.x;
          value = slider.touch.originalPos.left;
        } else {
          distance = slider.touch.end.y - slider.touch.start.y;
          value = slider.touch.originalPos.top;
        }
        if (!slider.settings.infiniteLoop && ((slider.active.index === 0 && distance > 0) || (slider.active.last && distance < 0))) {
          setPositionProperty(value, 'reset', 200);
        } else {
          if (Math.abs(distance) >= slider.settings.swipeThreshold) {
            if (distance < 0) {
              el.goToNextSlide();
            } else {
              el.goToPrevSlide();
            }
            el.stopAuto();
          } else {
            setPositionProperty(value, 'reset', 200);
          }
        }
      }
      slider.viewport.unbind('touchend', onTouchEnd);
      if (slider.viewport.get(0).releasePointerCapture) {
        slider.viewport.get(0).releasePointerCapture(slider.pointerId);
      }
    };

    /**
     * Window resize event callback
     */
    var resizeWindow = function (e) {
      if (!slider.initialized) {
        return;
      }
      if (slider.working) {
        window.setTimeout(resizeWindow, 10);
      } else {
        var windowWidthNew = $(window).width(),
            windowHeightNew = $(window).height();
        if (windowWidth !== windowWidthNew || windowHeight !== windowHeightNew) {
          windowWidth = windowWidthNew;
          windowHeight = windowHeightNew;
          el.redrawSlider();
          slider.settings.onSliderResize.call(el, slider.active.index);
        }
      }
    };

    /**
     * Returns index according to present page range
     *
     * @param slideOndex (int)
     *  - the desired slide index
     */
    var setSlideIndex = function (slideIndex) {
      if (slideIndex < 0) {
        if (slider.settings.infiniteLoop) {
          return getPagerQty() - 1;
        } else {
          return slider.active.index;
        }
      } else if (slideIndex >= getPagerQty()) {
        if (slider.settings.infiniteLoop) {
          return 0;
        } else {
          return slider.active.index;
        }
      } else {
        return slideIndex;
      }
    };

    /**
     * ===================================================================================
     * = PUBLIC FUNCTIONS
     * ===================================================================================
     */

    /**
     * Performs slide transition to the specified slide
     *
     * @param slideIndex (int)
     *  - the destination slide's index (zero-based)
     *
     * @param direction (string)
     *  - INTERNAL USE ONLY - the direction of travel ("prev" / "next")
     */
    el.goToSlide = function (slideIndex, direction) {
      var performTransition = true,
          moveBy = 0,
          position = {left: 0, top: 0},
          lastChild = null,
          lastShowingIndex, eq, value, requestEl;
      slider.oldIndex = slider.active.index;
      slider.active.index = setSlideIndex(slideIndex);

      if (slider.working || slider.active.index === slider.oldIndex) {
        return;
      }
      slider.working = true;

      performTransition = slider.settings.onSlideBefore.call(el, slider.children.eq(slider.active.index), slider.oldIndex,
          slider.active.index);

      if (typeof (performTransition) !== 'undefined' && !performTransition) {
        slider.active.index = slider.oldIndex;
        slider.working = false;
        return;
      }

      if (direction === 'next') {
        if (!slider.settings.onSlideNext.call(el, slider.children.eq(slider.active.index), slider.oldIndex, slider.active.index)) {
          performTransition = false;
        }
      } else if (direction === 'prev') {
        if (!slider.settings.onSlidePrev.call(el, slider.children.eq(slider.active.index), slider.oldIndex, slider.active.index)) {
          performTransition = false;
        }
      }

      slider.active.last = slider.active.index >= getPagerQty() - 1;
      if (slider.settings.pager) {
        updatePagerActive(slider.active.index);
      }
      if (slider.settings.controls) {
        updateDirectionControls();
      }
      if (slider.settings.mode === 'fade') {
        if (slider.settings.adaptiveHeight && slider.viewport.height() !== getViewportHeight()) {
          slider.viewport.animate({height: getViewportHeight()}, slider.settings.adaptiveHeightSpeed);
        }
        slider.children.filter(':visible').fadeOut(slider.settings.speed).css({zIndex: 0});
        slider.children.eq(slider.active.index).css('zIndex', '1' + 1).fadeIn(slider.settings.speed, function () {
          $(this).css('zIndex', '1');
          updateAfterSlideTransition();
        });
      } else {
        if (slider.settings.adaptiveHeight && slider.viewport.height() !== getViewportHeight()) {
          slider.viewport.animate({height: getViewportHeight()}, slider.settings.adaptiveHeightSpeed);
        }
        if (!slider.settings.infiniteLoop && slider.carousel && slider.active.last) {
          if (slider.settings.mode === 'horizontal') {
            lastChild = slider.children.eq(slider.children.length - 1);
            position = lastChild.position();
            moveBy = slider.viewport.width() - lastChild.outerWidth();
          } else {
            lastShowingIndex = slider.children.length - slider.settings.minSlides;
            position = slider.children.eq(lastShowingIndex).position();
          }
        } else if (slider.carousel && slider.active.last && direction === 'prev') {
          eq = slider.settings.moveSlides === 1 ? slider.settings.maxSlides - getMoveBy() : ((getPagerQty() - 1) * getMoveBy())
              - (slider.children.length - slider.settings.maxSlides);
          lastChild = el.children('.awa-slide__item--clone').eq(eq);
          position = lastChild.position();
        } else if (direction === 'next' && slider.active.index === 0) {
          position = el.find('> .awa-slide__item--clone').eq(slider.settings.maxSlides).position();
          slider.active.last = false;
        } else if (slideIndex >= 0) {
          requestEl = slideIndex * parseInt(getMoveBy());
          position = slider.children.eq(requestEl).position();
        }

        /* If the position doesn't exist
         * (e.g. if you destroy the slider on a next click),
         * it doesn't throw an error.
         */
        if (typeof (position) !== 'undefined') {
          value = slider.settings.mode === 'horizontal' ? -(position.left - moveBy) : -position.top;
          setPositionProperty(value, 'slide', slider.settings.speed);
        }
        slider.working = false;
      }
    };

    /**
     * Transitions to the next slide in the show
     */
    el.goToNextSlide = function () {
      if (!slider.settings.infiniteLoop && slider.active.last) {
        return;
      }
      if (slider.working == true) {
        return;
      }
      var pagerIndex = parseInt(slider.active.index) + 1;
      el.goToSlide(pagerIndex, 'next');
    };

    /**
     * Transitions to the prev slide in the show
     */
    el.goToPrevSlide = function () {
      if (!slider.settings.infiniteLoop && slider.active.index === 0) {
        return;
      }
      if (slider.working == true) {
        return;
      }
      var pagerIndex = parseInt(slider.active.index) - 1;
      el.goToSlide(pagerIndex, 'prev');
    };

    /**
     * Starts the auto show
     *
     * @param preventControlUpdate (boolean)
     *  - if true, auto controls state will not be updated
     */
    el.startAuto = function (preventControlUpdate) {
      if (slider.interval) {
        return;
      }
      slider.interval = setInterval(function () {
        if (slider.settings.autoDirection === 'next') {
          el.goToNextSlide();
        } else {
          el.goToPrevSlide();
        }
      }, slider.settings.pause);
      slider.settings.onAutoChange.call(el, true);
      if (slider.settings.autoControls && preventControlUpdate !== true) {
        updateAutoControls('stop');
      }
    };

    /**
     * Stops the auto show
     *
     * @param preventControlUpdate (boolean)
     *  - if true, auto controls state will not be updated
     */
    el.stopAuto = function (preventControlUpdate) {
      if (!slider.interval) {
        return;
      }
      clearInterval(slider.interval);
      slider.interval = null;
      slider.settings.onAutoChange.call(el, false);
      if (slider.settings.autoControls && preventControlUpdate !== true) {
        updateAutoControls('start');
      }
    };

    /**
     * Returns current slide index (zero-based)
     */
    el.getCurrentSlide = function () {
      return slider.active.index;
    };

    /**
     * Returns current slide element
     */
    el.getCurrentSlideElement = function () {
      return slider.children.eq(slider.active.index);
    };

    /**
     * Returns a slide element
     * @param index (int)
     *  - The index (zero-based) of the element you want returned.
     */
    el.getSlideElement = function (index) {
      return slider.children.eq(index);
    };

    /**
     * Returns number of slides in show
     */
    el.getSlideCount = function () {
      return slider.children.length;
    };

    /**
     * Return slider.working variable
     */
    el.isWorking = function () {
      return slider.working;
    };

    /**
     * Update all dynamic slider elements
     */
    el.redrawSlider = function () {
      slider.children.add(el.find('.awa-slide__item--clone')).outerWidth(getSlideWidth());
      slider.viewport.css('height', getViewportHeight());
      setSlidePosition();
      if (slider.active.last) {
        slider.active.index = getPagerQty() - 1;
      }
      if (slider.active.index >= getPagerQty()) {
        slider.active.last = true;
      }
      if (slider.settings.pager) {
        populatePager();
        updatePagerActive(slider.active.index);
      }
    };

    /**
     * Destroy the current instance of the slider (revert everything back to original state)
     */
    el.destroySlider = function () {
      if (!slider.initialized) {
        return;
      }
      slider.initialized = false;
      $('.awa-slide__item--clone', this).remove();
      slider.children.each(function () {
        if ($(this).data('origStyle') !== undefined) {
          $(this).attr('style', $(this).data('origStyle'));
        } else {
          $(this).removeAttr('style');
        }
      });
      if ($(this).data('origStyle') !== undefined) {
        this.attr('style', $(this).data('origStyle'));
      } else {
        $(this).removeAttr('style');
      }
      $(this).unwrap().unwrap();
      if (slider.controls.el) {
        slider.controls.el.remove();
      }
      if (slider.controls.next) {
        slider.controls.next.remove();
      }
      if (slider.controls.prev) {
        slider.controls.prev.remove();
      }
      if (slider.pagerEl && slider.settings.controls) {
        slider.pagerEl.remove();
      }
      if (slider.controls.autoEl) {
        slider.controls.autoEl.remove();
      }
      clearInterval(slider.interval);
      if (slider.settings.responsive) {
        $(window).unbind('resize', resizeWindow);
      }
      $(this).removeData('awa-slide');
      $(window).off('blur', windowBlurHandler).off('focus', windowFocusHandler);
    };

    /**
     * Reload the slider (revert all DOM changes, and re-initialize)
     */
    el.reloadSlider = function (settings) {
      if (settings !== undefined) {
        options = settings;
      }
      el.destroySlider();
      init();
      $(el).data('awa-slide', this);
    };

    init();

    $(el).data('awa-slide', this);

    return this;
  };

})(jQuery);


/*
 * VERSION: 1.20.3
 * DATE: 2017-10-02
 * UPDATES AND DOCS AT: http://greensock.com
 *
 * Includes all of the following: TweenLite, TweenMax, TimelineLite, TimelineMax, EasePack, CSSPlugin, RoundPropsPlugin, BezierPlugin, AttrPlugin, DirectionalRotationPlugin
 *
 * @license Copyright (c) 2008-2017, GreenSock. All rights reserved.
 * This work is subject to the terms at http://greensock.com/standard-license or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 *
 * @author: Jack Doyle, jack@greensock.com
 **/
var _gsScope = (typeof(module) !== "undefined" && module.exports && typeof(global) !== "undefined") ? global : this || window; //helps ensure compatibility with AMD/RequireJS and CommonJS/Node
(_gsScope._gsQueue || (_gsScope._gsQueue = [])).push(function () {

  "use strict";

  _gsScope._gsDefine("TweenMax", ["core.Animation", "core.SimpleTimeline", "TweenLite"], function (Animation, SimpleTimeline, TweenLite) {

    var _slice = function (a) { //don't use [].slice because that doesn't work in IE8 with a NodeList that's returned by querySelectorAll()
          var b = [],
              l = a.length,
              i;
          for (i = 0; i !== l; b.push(a[i++])) {
            ;
          }
          return b;
        },
        _applyCycle = function (vars, targets, i) {
          var alt = vars.cycle,
              p, val;
          for (p in alt) {
            val = alt[p];
            vars[p] = (typeof(val) === "function") ? val(i, targets[i]) : val[i % val.length];
          }
          delete vars.cycle;
        },
        TweenMax = function (target, duration, vars) {
          TweenLite.call(this, target, duration, vars);
          this._cycle = 0;
          this._yoyo = (this.vars.yoyo === true || !!this.vars.yoyoEase);
          this._repeat = this.vars.repeat || 0;
          this._repeatDelay = this.vars.repeatDelay || 0;
          if (this._repeat) {
            this._uncache(true); //ensures that if there is any repeat, the totalDuration will get recalculated to accurately report it.
          }
          this.render = TweenMax.prototype.render; //speed optimization (avoid prototype lookup on this "hot" method)
        },
        _tinyNum = 0.0000000001,
        TweenLiteInternals = TweenLite._internals,
        _isSelector = TweenLiteInternals.isSelector,
        _isArray = TweenLiteInternals.isArray,
        p = TweenMax.prototype = TweenLite.to({}, 0.1, {}),
        _blankArray = [];

    TweenMax.version = "1.20.3";
    p.constructor = TweenMax;
    p.kill()._gc = false;
    TweenMax.killTweensOf = TweenMax.killDelayedCallsTo = TweenLite.killTweensOf;
    TweenMax.getTweensOf = TweenLite.getTweensOf;
    TweenMax.lagSmoothing = TweenLite.lagSmoothing;
    TweenMax.ticker = TweenLite.ticker;
    TweenMax.render = TweenLite.render;

    p.invalidate = function () {
      this._yoyo = (this.vars.yoyo === true || !!this.vars.yoyoEase);
      this._repeat = this.vars.repeat || 0;
      this._repeatDelay = this.vars.repeatDelay || 0;
      this._yoyoEase = null;
      this._uncache(true);
      return TweenLite.prototype.invalidate.call(this);
    };

    p.updateTo = function (vars, resetDuration) {
      var curRatio = this.ratio,
          immediate = this.vars.immediateRender || vars.immediateRender,
          p;
      if (resetDuration && this._startTime < this._timeline._time) {
        this._startTime = this._timeline._time;
        this._uncache(false);
        if (this._gc) {
          this._enabled(true, false);
        } else {
          this._timeline.insert(this, this._startTime - this._delay); //ensures that any necessary re-sequencing of Animations in the timeline occurs to make sure the rendering order is correct.
        }
      }
      for (p in vars) {
        this.vars[p] = vars[p];
      }
      if (this._initted || immediate) {
        if (resetDuration) {
          this._initted = false;
          if (immediate) {
            this.render(0, true, true);
          }
        } else {
          if (this._gc) {
            this._enabled(true, false);
          }
          if (this._notifyPluginsOfEnabled && this._firstPT) {
            TweenLite._onPluginEvent("_onDisable", this); //in case a plugin like MotionBlur must perform some cleanup tasks
          }
          if (this._time / this._duration > 0.998) { //if the tween has finished (or come extremely close to finishing), we just need to rewind it to 0 and then render it again at the end which forces it to re-initialize (parsing the new vars). We allow tweens that are close to finishing (but haven't quite finished) to work this way too because otherwise, the values are so small when determining where to project the starting values that binary math issues creep in and can make the tween appear to render incorrectly when run backwards.
            var prevTime = this._totalTime;
            this.render(0, true, false);
            this._initted = false;
            this.render(prevTime, true, false);
          } else {
            this._initted = false;
            this._init();
            if (this._time > 0 || immediate) {
              var inv = 1 / (1 - curRatio),
                  pt = this._firstPT, endValue;
              while (pt) {
                endValue = pt.s + pt.c;
                pt.c *= inv;
                pt.s = endValue - pt.c;
                pt = pt._next;
              }
            }
          }
        }
      }
      return this;
    };

    p.render = function (time, suppressEvents, force) {
      if (!this._initted) {
        if (this._duration === 0 && this.vars.repeat) { //zero duration tweens that render immediately have render() called from TweenLite's constructor, before TweenMax's constructor has finished setting _repeat, _repeatDelay, and _yoyo which are critical in determining totalDuration() so we need to call invalidate() which is a low-kb way to get those set properly.
          this.invalidate();
        }
      }
      var totalDur = (!this._dirty) ? this._totalDuration : this.totalDuration(),
          prevTime = this._time,
          prevTotalTime = this._totalTime,
          prevCycle = this._cycle,
          duration = this._duration,
          prevRawPrevTime = this._rawPrevTime,
          isComplete, callback, pt, cycleDuration, r, type, pow, rawPrevTime, yoyoEase;
      if (time >= totalDur - 0.0000001 && time >= 0) { //to work around occasional floating point math artifacts.
        this._totalTime = totalDur;
        this._cycle = this._repeat;
        if (this._yoyo && (this._cycle & 1) !== 0) {
          this._time = 0;
          this.ratio = this._ease._calcEnd ? this._ease.getRatio(0) : 0;
        } else {
          this._time = duration;
          this.ratio = this._ease._calcEnd ? this._ease.getRatio(1) : 1;
        }
        if (!this._reversed) {
          isComplete = true;
          callback = "onComplete";
          force = (force || this._timeline.autoRemoveChildren); //otherwise, if the animation is unpaused/activated after it's already finished, it doesn't get removed from the parent timeline.
        }
        if (duration === 0) {
          if (this._initted || !this.vars.lazy || force) { //zero-duration tweens are tricky because we must discern the momentum/direction of time in order to determine whether the starting values should be rendered or the ending values. If the "playhead" of its timeline goes past the zero-duration tween in the forward direction or lands directly on it, the end values should be rendered, but if the timeline's "playhead" moves past it in the backward direction (from a postitive time to a negative time), the starting values must be rendered.
            if (this._startTime === this._timeline._duration) { //if a zero-duration tween is at the VERY end of a timeline and that timeline renders at its end, it will typically add a tiny bit of cushion to the render time to prevent rounding errors from getting in the way of tweens rendering their VERY end. If we then reverse() that timeline, the zero-duration tween will trigger its onReverseComplete even though technically the playhead didn't pass over it again. It's a very specific edge case we must accommodate.
              time = 0;
            }
            if (prevRawPrevTime < 0 || (time <= 0 && time >= -0.0000001) || (prevRawPrevTime === _tinyNum && this.data
                    !== "isPause")) {
              if (prevRawPrevTime !== time) { //note: when this.data is "isPause", it's a callback added by addPause() on a timeline that we should not be triggered when LEAVING its exact start time. In other words, tl.addPause(1).play(1) shouldn't pause.
                force = true;
                if (prevRawPrevTime > _tinyNum) {
                  callback = "onReverseComplete";
                }
              }
            }
            this._rawPrevTime = rawPrevTime = (!suppressEvents || time || prevRawPrevTime === time) ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
          }
        }

      } else if (time < 0.0000001) { //to work around occasional floating point math artifacts, round super small values to 0.
        this._totalTime = this._time = this._cycle = 0;
        this.ratio = this._ease._calcEnd ? this._ease.getRatio(0) : 0;
        if (prevTotalTime !== 0 || (duration === 0 && prevRawPrevTime > 0)) {
          callback = "onReverseComplete";
          isComplete = this._reversed;
        }
        if (time < 0) {
          this._active = false;
          if (duration === 0) {
            if (this._initted || !this.vars.lazy || force) { //zero-duration tweens are tricky because we must discern the momentum/direction of time in order to determine whether the starting values should be rendered or the ending values. If the "playhead" of its timeline goes past the zero-duration tween in the forward direction or lands directly on it, the end values should be rendered, but if the timeline's "playhead" moves past it in the backward direction (from a postitive time to a negative time), the starting values must be rendered.
              if (prevRawPrevTime >= 0) {
                force = true;
              }
              this._rawPrevTime = rawPrevTime = (!suppressEvents || time || prevRawPrevTime === time) ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
            }
          }
        }
        if (!this._initted) { //if we render the very beginning (time == 0) of a fromTo(), we must force the render (normal tweens wouldn't need to render at a time of 0 when the prevTime was also 0). This is also mandatory to make sure overwriting kicks in immediately.
          force = true;
        }
      } else {
        this._totalTime = this._time = time;
        if (this._repeat !== 0) {
          cycleDuration = duration + this._repeatDelay;
          this._cycle = (this._totalTime / cycleDuration) >> 0; //originally _totalTime % cycleDuration but floating point errors caused problems, so I normalized it. (4 % 0.8 should be 0 but some browsers report it as 0.79999999!)
          if (this._cycle !== 0) {
            if (this._cycle === this._totalTime / cycleDuration && prevTotalTime <= time) {
              this._cycle--; //otherwise when rendered exactly at the end time, it will act as though it is repeating (at the beginning)
            }
          }
          this._time = this._totalTime - (this._cycle * cycleDuration);
          if (this._yoyo) {
            if ((this._cycle & 1) !== 0) {
              this._time = duration - this._time;
              yoyoEase = this._yoyoEase || this.vars.yoyoEase; //note: we don't set this._yoyoEase in _init() like we do other properties because it's TweenMax-specific and doing it here allows us to optimize performance (most tweens don't have a yoyoEase). Note that we also must skip the this.ratio calculation further down right after we _init() in this function, because we're doing it here.
              if (yoyoEase) {
                if (!this._yoyoEase) {
                  if (yoyoEase === true && !this._initted) { //if it's not initted and yoyoEase is true, this._ease won't have been populated yet so we must discern it here.
                    yoyoEase = this.vars.ease;
                    this._yoyoEase = yoyoEase = !yoyoEase ? TweenLite.defaultEase : (yoyoEase instanceof Ease) ? yoyoEase
                        : (typeof(yoyoEase) === "function") ? new Ease(yoyoEase, this.vars.easeParams) : Ease.map[yoyoEase]
                            || TweenLite.defaultEase;
                  } else {
                    this._yoyoEase = yoyoEase = (yoyoEase === true) ? this._ease : (yoyoEase instanceof Ease) ? yoyoEase
                        : Ease.map[yoyoEase];
                  }
                }
                this.ratio = yoyoEase ? 1 - yoyoEase.getRatio((duration - this._time) / duration) : 0;
              }
            }
          }
          if (this._time > duration) {
            this._time = duration;
          } else if (this._time < 0) {
            this._time = 0;
          }
        }

        if (this._easeType && !yoyoEase) {
          r = this._time / duration;
          type = this._easeType;
          pow = this._easePower;
          if (type === 1 || (type === 3 && r >= 0.5)) {
            r = 1 - r;
          }
          if (type === 3) {
            r *= 2;
          }
          if (pow === 1) {
            r *= r;
          } else if (pow === 2) {
            r *= r * r;
          } else if (pow === 3) {
            r *= r * r * r;
          } else if (pow === 4) {
            r *= r * r * r * r;
          }

          if (type === 1) {
            this.ratio = 1 - r;
          } else if (type === 2) {
            this.ratio = r;
          } else if (this._time / duration < 0.5) {
            this.ratio = r / 2;
          } else {
            this.ratio = 1 - (r / 2);
          }

        } else if (!yoyoEase) {
          this.ratio = this._ease.getRatio(this._time / duration);
        }

      }

      if (prevTime === this._time && !force && prevCycle === this._cycle) {
        if (prevTotalTime !== this._totalTime) {
          if (this._onUpdate) {
            if (!suppressEvents) { //so that onUpdate fires even during the repeatDelay - as long as the totalTime changed, we should trigger onUpdate.
              this._callback("onUpdate");
            }
          }
        }
        return;
      } else if (!this._initted) {
        this._init();
        if (!this._initted || this._gc) { //immediateRender tweens typically won't initialize until the playhead advances (_time is greater than 0) in order to ensure that overwriting occurs properly. Also, if all of the tweening properties have been overwritten (which would cause _gc to be true, as set in _init()), we shouldn't continue otherwise an onStart callback could be called for example.
          return;
        } else if (!force && this._firstPT && ((this.vars.lazy !== false && this._duration) || (this.vars.lazy && !this._duration))) { //we stick it in the queue for rendering at the very end of the tick - this is a performance optimization because browsers invalidate styles and force a recalculation if you read, write, and then read style data (so it's better to read/read/read/write/write/write than read/write/read/write/read/write). The down side, of course, is that usually you WANT things to render immediately because you may have code running right after that which depends on the change. Like imagine running TweenLite.set(...) and then immediately after that, creating a nother tween that animates the same property to another value; the starting values of that 2nd tween wouldn't be accurate if lazy is true.
          this._time = prevTime;
          this._totalTime = prevTotalTime;
          this._rawPrevTime = prevRawPrevTime;
          this._cycle = prevCycle;
          TweenLiteInternals.lazyTweens.push(this);
          this._lazy = [time, suppressEvents];
          return;
        }
        //_ease is initially set to defaultEase, so now that init() has run, _ease is set properly and we need to recalculate the ratio. Overall this is faster than using conditional logic earlier in the method to avoid having to set ratio twice because we only init() once but renderTime() gets called VERY frequently.
        if (this._time && !isComplete && !yoyoEase) {
          this.ratio = this._ease.getRatio(this._time / duration);
        } else if (isComplete && this._ease._calcEnd && !yoyoEase) {
          this.ratio = this._ease.getRatio((this._time === 0) ? 0 : 1);
        }
      }
      if (this._lazy !== false) {
        this._lazy = false;
      }

      if (!this._active) {
        if (!this._paused && this._time !== prevTime && time >= 0) {
          this._active = true; //so that if the user renders a tween (as opposed to the timeline rendering it), the timeline is forced to re-render and align it with the proper time/frame on the next rendering cycle. Maybe the tween already finished but the user manually re-renders it as halfway done.
        }
      }
      if (prevTotalTime === 0) {
        if (this._initted === 2 && time > 0) {
          //this.invalidate();
          this._init(); //will just apply overwriting since _initted of (2) means it was a from() tween that had immediateRender:true
        }
        if (this._startAt) {
          if (time >= 0) {
            this._startAt.render(time, true, force);
          } else if (!callback) {
            callback = "_dummyGS"; //if no callback is defined, use a dummy value just so that the condition at the end evaluates as true because _startAt should render AFTER the normal render loop when the time is negative. We could handle this in a more intuitive way, of course, but the render loop is the MOST important thing to optimize, so this technique allows us to avoid adding extra conditional logic in a high-frequency area.
          }
        }
        if (this.vars.onStart) {
          if (this._totalTime !== 0 || duration === 0) {
            if (!suppressEvents) {
              this._callback("onStart");
            }
          }
        }
      }

      pt = this._firstPT;
      while (pt) {
        if (pt.f) {
          pt.t[pt.p](pt.c * this.ratio + pt.s);
        } else {
          pt.t[pt.p] = pt.c * this.ratio + pt.s;
        }
        pt = pt._next;
      }

      if (this._onUpdate) {
        if (time < 0) {
          if (this._startAt && this._startTime) { //if the tween is positioned at the VERY beginning (_startTime 0) of its parent timeline, it's illegal for the playhead to go back further, so we should not render the recorded startAt values.
            this._startAt.render(time, true, force); //note: for performance reasons, we tuck this conditional logic inside less traveled areas (most tweens don't have an onUpdate). We'd just have it at the end before the onComplete, but the values should be updated before any onUpdate is called, so we ALSO put it here and then if it's not called, we do so later near the onComplete.
          }
        }
        if (!suppressEvents) {
          if (this._totalTime !== prevTotalTime || callback) {
            this._callback("onUpdate");
          }
        }
      }
      if (this._cycle !== prevCycle) {
        if (!suppressEvents) {
          if (!this._gc) {
            if (this.vars.onRepeat) {
              this._callback("onRepeat");
            }
          }
        }
      }
      if (callback) {
        if (!this._gc || force) { //check gc because there's a chance that kill() could be called in an onUpdate
          if (time < 0 && this._startAt && !this._onUpdate && this._startTime) { //if the tween is positioned at the VERY beginning (_startTime 0) of its parent timeline, it's illegal for the playhead to go back further, so we should not render the recorded startAt values.
            this._startAt.render(time, true, force);
          }
          if (isComplete) {
            if (this._timeline.autoRemoveChildren) {
              this._enabled(false, false);
            }
            this._active = false;
          }
          if (!suppressEvents && this.vars[callback]) {
            this._callback(callback);
          }
          if (duration === 0 && this._rawPrevTime === _tinyNum && rawPrevTime !== _tinyNum) { //the onComplete or onReverseComplete could trigger movement of the playhead and for zero-duration tweens (which must discern direction) that land directly back on their start time, we don't want to fire again on the next render. Think of several addPause()'s in a timeline that forces the playhead to a certain spot, but what if it's already paused and another tween is tweening the "time" of the timeline? Each time it moves [forward] past that spot, it would move back, and since suppressEvents is true, it'd reset _rawPrevTime to _tinyNum so that when it begins again, the callback would fire (so ultimately it could bounce back and forth during that tween). Again, this is a very uncommon scenario, but possible nonetheless.
            this._rawPrevTime = 0;
          }
        }
      }
    };

//---- STATIC FUNCTIONS -----------------------------------------------------------------------------------------------------------

    TweenMax.to = function (target, duration, vars) {
      return new TweenMax(target, duration, vars);
    };

    TweenMax.from = function (target, duration, vars) {
      vars.runBackwards = true;
      vars.immediateRender = (vars.immediateRender != false);
      return new TweenMax(target, duration, vars);
    };

    TweenMax.fromTo = function (target, duration, fromVars, toVars) {
      toVars.startAt = fromVars;
      toVars.immediateRender = (toVars.immediateRender != false && fromVars.immediateRender != false);
      return new TweenMax(target, duration, toVars);
    };

    TweenMax.staggerTo = TweenMax.allTo = function (targets, duration, vars, stagger, onCompleteAll, onCompleteAllParams,
        onCompleteAllScope) {
      stagger = stagger || 0;
      var delay = 0,
          a = [],
          finalComplete = function () {
            if (vars.onComplete) {
              vars.onComplete.apply(vars.onCompleteScope || this, arguments);
            }
            onCompleteAll.apply(onCompleteAllScope || vars.callbackScope || this, onCompleteAllParams || _blankArray);
          },
          cycle = vars.cycle,
          fromCycle = (vars.startAt && vars.startAt.cycle),
          l, copy, i, p;
      if (!_isArray(targets)) {
        if (typeof(targets) === "string") {
          targets = TweenLite.selector(targets) || targets;
        }
        if (_isSelector(targets)) {
          targets = _slice(targets);
        }
      }
      targets = targets || [];
      if (stagger < 0) {
        targets = _slice(targets);
        targets.reverse();
        stagger *= -1;
      }
      l = targets.length - 1;
      for (i = 0; i <= l; i++) {
        copy = {};
        for (p in vars) {
          copy[p] = vars[p];
        }
        if (cycle) {
          _applyCycle(copy, targets, i);
          if (copy.duration != null) {
            duration = copy.duration;
            delete copy.duration;
          }
        }
        if (fromCycle) {
          fromCycle = copy.startAt = {};
          for (p in vars.startAt) {
            fromCycle[p] = vars.startAt[p];
          }
          _applyCycle(copy.startAt, targets, i);
        }
        copy.delay = delay + (copy.delay || 0);
        if (i === l && onCompleteAll) {
          copy.onComplete = finalComplete;
        }
        a[i] = new TweenMax(targets[i], duration, copy);
        delay += stagger;
      }
      return a;
    };

    TweenMax.staggerFrom = TweenMax.allFrom = function (targets, duration, vars, stagger, onCompleteAll, onCompleteAllParams,
        onCompleteAllScope) {
      vars.runBackwards = true;
      vars.immediateRender = (vars.immediateRender != false);
      return TweenMax.staggerTo(targets, duration, vars, stagger, onCompleteAll, onCompleteAllParams, onCompleteAllScope);
    };

    TweenMax.staggerFromTo = TweenMax.allFromTo = function (targets, duration, fromVars, toVars, stagger, onCompleteAll,
        onCompleteAllParams, onCompleteAllScope) {
      toVars.startAt = fromVars;
      toVars.immediateRender = (toVars.immediateRender != false && fromVars.immediateRender != false);
      return TweenMax.staggerTo(targets, duration, toVars, stagger, onCompleteAll, onCompleteAllParams, onCompleteAllScope);
    };

    TweenMax.delayedCall = function (delay, callback, params, scope, useFrames) {
      return new TweenMax(callback, 0, {
        delay: delay,
        onComplete: callback,
        onCompleteParams: params,
        callbackScope: scope,
        onReverseComplete: callback,
        onReverseCompleteParams: params,
        immediateRender: false,
        useFrames: useFrames,
        overwrite: 0
      });
    };

    TweenMax.set = function (target, vars) {
      return new TweenMax(target, 0, vars);
    };

    TweenMax.isTweening = function (target) {
      return (TweenLite.getTweensOf(target, true).length > 0);
    };

    var _getChildrenOf = function (timeline, includeTimelines) {
          var a = [],
              cnt = 0,
              tween = timeline._first;
          while (tween) {
            if (tween instanceof TweenLite) {
              a[cnt++] = tween;
            } else {
              if (includeTimelines) {
                a[cnt++] = tween;
              }
              a = a.concat(_getChildrenOf(tween, includeTimelines));
              cnt = a.length;
            }
            tween = tween._next;
          }
          return a;
        },
        getAllTweens = TweenMax.getAllTweens = function (includeTimelines) {
          return _getChildrenOf(Animation._rootTimeline, includeTimelines).concat(
              _getChildrenOf(Animation._rootFramesTimeline, includeTimelines));
        };

    TweenMax.killAll = function (complete, tweens, delayedCalls, timelines) {
      if (tweens == null) {
        tweens = true;
      }
      if (delayedCalls == null) {
        delayedCalls = true;
      }
      var a = getAllTweens((timelines != false)),
          l = a.length,
          allTrue = (tweens && delayedCalls && timelines),
          isDC, tween, i;
      for (i = 0; i < l; i++) {
        tween = a[i];
        if (allTrue || (tween instanceof SimpleTimeline) || ((isDC = (tween.target === tween.vars.onComplete)) && delayedCalls) || (tweens
                && !isDC)) {
          if (complete) {
            tween.totalTime(tween._reversed ? 0 : tween.totalDuration());
          } else {
            tween._enabled(false, false);
          }
        }
      }
    };

    TweenMax.killChildTweensOf = function (parent, complete) {
      if (parent == null) {
        return;
      }
      var tl = TweenLiteInternals.tweenLookup,
          a, curParent, p, i, l;
      if (typeof(parent) === "string") {
        parent = TweenLite.selector(parent) || parent;
      }
      if (_isSelector(parent)) {
        parent = _slice(parent);
      }
      if (_isArray(parent)) {
        i = parent.length;
        while (--i > -1) {
          TweenMax.killChildTweensOf(parent[i], complete);
        }
        return;
      }
      a = [];
      for (p in tl) {
        curParent = tl[p].target.parentNode;
        while (curParent) {
          if (curParent === parent) {
            a = a.concat(tl[p].tweens);
          }
          curParent = curParent.parentNode;
        }
      }
      l = a.length;
      for (i = 0; i < l; i++) {
        if (complete) {
          a[i].totalTime(a[i].totalDuration());
        }
        a[i]._enabled(false, false);
      }
    };

    var _changePause = function (pause, tweens, delayedCalls, timelines) {
      tweens = (tweens !== false);
      delayedCalls = (delayedCalls !== false);
      timelines = (timelines !== false);
      var a = getAllTweens(timelines),
          allTrue = (tweens && delayedCalls && timelines),
          i = a.length,
          isDC, tween;
      while (--i > -1) {
        tween = a[i];
        if (allTrue || (tween instanceof SimpleTimeline) || ((isDC = (tween.target === tween.vars.onComplete)) && delayedCalls)
            || (tweens && !isDC)) {
          tween.paused(pause);
        }
      }
    };

    TweenMax.pauseAll = function (tweens, delayedCalls, timelines) {
      _changePause(true, tweens, delayedCalls, timelines);
    };

    TweenMax.resumeAll = function (tweens, delayedCalls, timelines) {
      _changePause(false, tweens, delayedCalls, timelines);
    };

    TweenMax.globalTimeScale = function (value) {
      var tl = Animation._rootTimeline,
          t = TweenLite.ticker.time;
      if (!arguments.length) {
        return tl._timeScale;
      }
      value = value || _tinyNum; //can't allow zero because it'll throw the math off
      tl._startTime = t - ((t - tl._startTime) * tl._timeScale / value);
      tl = Animation._rootFramesTimeline;
      t = TweenLite.ticker.frame;
      tl._startTime = t - ((t - tl._startTime) * tl._timeScale / value);
      tl._timeScale = Animation._rootTimeline._timeScale = value;
      return value;
    };


//---- GETTERS / SETTERS ----------------------------------------------------------------------------------------------------------

    p.progress = function (value, suppressEvents) {
      return (!arguments.length) ? this._time / this.duration() : this.totalTime(this.duration() * ((this._yoyo && (this._cycle & 1)
          !== 0) ? 1 - value : value) + (this._cycle * (this._duration + this._repeatDelay)), suppressEvents);
    };

    p.totalProgress = function (value, suppressEvents) {
      return (!arguments.length) ? this._totalTime / this.totalDuration() : this.totalTime(this.totalDuration() * value,
          suppressEvents);
    };

    p.time = function (value, suppressEvents) {
      if (!arguments.length) {
        return this._time;
      }
      if (this._dirty) {
        this.totalDuration();
      }
      if (value > this._duration) {
        value = this._duration;
      }
      if (this._yoyo && (this._cycle & 1) !== 0) {
        value = (this._duration - value) + (this._cycle * (this._duration + this._repeatDelay));
      } else if (this._repeat !== 0) {
        value += this._cycle * (this._duration + this._repeatDelay);
      }
      return this.totalTime(value, suppressEvents);
    };

    p.duration = function (value) {
      if (!arguments.length) {
        return this._duration; //don't set _dirty = false because there could be repeats that haven't been factored into the _totalDuration yet. Otherwise, if you create a repeated TweenMax and then immediately check its duration(), it would cache the value and the totalDuration would not be correct, thus repeats wouldn't take effect.
      }
      return Animation.prototype.duration.call(this, value);
    };

    p.totalDuration = function (value) {
      if (!arguments.length) {
        if (this._dirty) {
          //instead of Infinity, we use 999999999999 so that we can accommodate reverses
          this._totalDuration = (this._repeat === -1) ? 999999999999 : this._duration * (this._repeat + 1) + (this._repeatDelay
              * this._repeat);
          this._dirty = false;
        }
        return this._totalDuration;
      }
      return (this._repeat === -1) ? this : this.duration((value - (this._repeat * this._repeatDelay)) / (this._repeat + 1));
    };

    p.repeat = function (value) {
      if (!arguments.length) {
        return this._repeat;
      }
      this._repeat = value;
      return this._uncache(true);
    };

    p.repeatDelay = function (value) {
      if (!arguments.length) {
        return this._repeatDelay;
      }
      this._repeatDelay = value;
      return this._uncache(true);
    };

    p.yoyo = function (value) {
      if (!arguments.length) {
        return this._yoyo;
      }
      this._yoyo = value;
      return this;
    };

    return TweenMax;

  }, true);

  /*
 * ----------------------------------------------------------------
 * TimelineLite
 * ----------------------------------------------------------------
 */
  _gsScope._gsDefine("TimelineLite", ["core.Animation", "core.SimpleTimeline", "TweenLite"],
      function (Animation, SimpleTimeline, TweenLite) {

        var TimelineLite = function (vars) {
              SimpleTimeline.call(this, vars);
              this._labels = {};
              this.autoRemoveChildren = (this.vars.autoRemoveChildren === true);
              this.smoothChildTiming = (this.vars.smoothChildTiming === true);
              this._sortChildren = true;
              this._onUpdate = this.vars.onUpdate;
              var v = this.vars,
                  val, p;
              for (p in v) {
                val = v[p];
                if (_isArray(val)) {
                  if (val.join("").indexOf("{self}") !== -1) {
                    v[p] = this._swapSelfInParams(val);
                  }
                }
              }
              if (_isArray(v.tweens)) {
                this.add(v.tweens, 0, v.align, v.stagger);
              }
            },
            _tinyNum = 0.0000000001,
            TweenLiteInternals = TweenLite._internals,
            _internals = TimelineLite._internals = {},
            _isSelector = TweenLiteInternals.isSelector,
            _isArray = TweenLiteInternals.isArray,
            _lazyTweens = TweenLiteInternals.lazyTweens,
            _lazyRender = TweenLiteInternals.lazyRender,
            _globals = _gsScope._gsDefine.globals,
            _copy = function (vars) {
              var copy = {}, p;
              for (p in vars) {
                copy[p] = vars[p];
              }
              return copy;
            },
            _applyCycle = function (vars, targets, i) {
              var alt = vars.cycle,
                  p, val;
              for (p in alt) {
                val = alt[p];
                vars[p] = (typeof(val) === "function") ? val(i, targets[i]) : val[i % val.length];
              }
              delete vars.cycle;
            },
            _pauseCallback = _internals.pauseCallback = function () {
            },
            _slice = function (a) { //don't use [].slice because that doesn't work in IE8 with a NodeList that's returned by querySelectorAll()
              var b = [],
                  l = a.length,
                  i;
              for (i = 0; i !== l; b.push(a[i++])) {
                ;
              }
              return b;
            },
            p = TimelineLite.prototype = new SimpleTimeline();

        TimelineLite.version = "1.20.3";
        p.constructor = TimelineLite;
        p.kill()._gc = p._forcingPlayhead = p._hasPause = false;

        /* might use later...
		//translates a local time inside an animation to the corresponding time on the root/global timeline, factoring in all nesting and timeScales.
		function localToGlobal(time, animation) {
			while (animation) {
				time = (time / animation._timeScale) + animation._startTime;
				animation = animation.timeline;
			}
			return time;
		}

		//translates the supplied time on the root/global timeline into the corresponding local time inside a particular animation, factoring in all nesting and timeScales
		function globalToLocal(time, animation) {
			var scale = 1;
			time -= localToGlobal(0, animation);
			while (animation) {
				scale *= animation._timeScale;
				animation = animation.timeline;
			}
			return time * scale;
		}
		*/

        p.to = function (target, duration, vars, position) {
          var Engine = (vars.repeat && _globals.TweenMax) || TweenLite;
          return duration ? this.add(new Engine(target, duration, vars), position) : this.set(target, vars, position);
        };

        p.from = function (target, duration, vars, position) {
          return this.add(((vars.repeat && _globals.TweenMax) || TweenLite).from(target, duration, vars), position);
        };

        p.fromTo = function (target, duration, fromVars, toVars, position) {
          var Engine = (toVars.repeat && _globals.TweenMax) || TweenLite;
          return duration ? this.add(Engine.fromTo(target, duration, fromVars, toVars), position) : this.set(target, toVars, position);
        };

        p.staggerTo = function (targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams, onCompleteAllScope) {
          var tl = new TimelineLite({
                onComplete: onCompleteAll,
                onCompleteParams: onCompleteAllParams,
                callbackScope: onCompleteAllScope,
                smoothChildTiming: this.smoothChildTiming
              }),
              cycle = vars.cycle,
              copy, i;
          if (typeof(targets) === "string") {
            targets = TweenLite.selector(targets) || targets;
          }
          targets = targets || [];
          if (_isSelector(targets)) { //senses if the targets object is a selector. If it is, we should translate it into an array.
            targets = _slice(targets);
          }
          stagger = stagger || 0;
          if (stagger < 0) {
            targets = _slice(targets);
            targets.reverse();
            stagger *= -1;
          }
          for (i = 0; i < targets.length; i++) {
            copy = _copy(vars);
            if (copy.startAt) {
              copy.startAt = _copy(copy.startAt);
              if (copy.startAt.cycle) {
                _applyCycle(copy.startAt, targets, i);
              }
            }
            if (cycle) {
              _applyCycle(copy, targets, i);
              if (copy.duration != null) {
                duration = copy.duration;
                delete copy.duration;
              }
            }
            tl.to(targets[i], duration, copy, i * stagger);
          }
          return this.add(tl, position);
        };

        p.staggerFrom = function (targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams, onCompleteAllScope) {
          vars.immediateRender = (vars.immediateRender != false);
          vars.runBackwards = true;
          return this.staggerTo(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams, onCompleteAllScope);
        };

        p.staggerFromTo = function (targets, duration, fromVars, toVars, stagger, position, onCompleteAll, onCompleteAllParams,
            onCompleteAllScope) {
          toVars.startAt = fromVars;
          toVars.immediateRender = (toVars.immediateRender != false && fromVars.immediateRender != false);
          return this.staggerTo(targets, duration, toVars, stagger, position, onCompleteAll, onCompleteAllParams, onCompleteAllScope);
        };

        p.call = function (callback, params, scope, position) {
          return this.add(TweenLite.delayedCall(0, callback, params, scope), position);
        };

        p.set = function (target, vars, position) {
          position = this._parseTimeOrLabel(position, 0, true);
          if (vars.immediateRender == null) {
            vars.immediateRender = (position === this._time && !this._paused);
          }
          return this.add(new TweenLite(target, 0, vars), position);
        };

        TimelineLite.exportRoot = function (vars, ignoreDelayedCalls) {
          vars = vars || {};
          if (vars.smoothChildTiming == null) {
            vars.smoothChildTiming = true;
          }
          var tl = new TimelineLite(vars),
              root = tl._timeline,
              hasNegativeStart, time, tween, next;
          if (ignoreDelayedCalls == null) {
            ignoreDelayedCalls = true;
          }
          root._remove(tl, true);
          tl._startTime = 0;
          tl._rawPrevTime = tl._time = tl._totalTime = root._time;
          tween = root._first;
          while (tween) {
            next = tween._next;
            if (!ignoreDelayedCalls || !(tween instanceof TweenLite && tween.target === tween.vars.onComplete)) {
              time = tween._startTime - tween._delay;
              if (time < 0) {
                hasNegativeStart = 1;
              }
              tl.add(tween, time);
            }
            tween = next;
          }
          root.add(tl, 0);
          if (hasNegativeStart) { //calling totalDuration() will force the adjustment necessary to shift the children forward so none of them start before zero, and moves the timeline backwards the same amount, so the playhead is still aligned where it should be globally, but the timeline doesn't have illegal children that start before zero.
            tl.totalDuration();
          }
          return tl;
        };

        p.add = function (value, position, align, stagger) {
          var curTime, l, i, child, tl, beforeRawTime;
          if (typeof(position) !== "number") {
            position = this._parseTimeOrLabel(position, 0, true, value);
          }
          if (!(value instanceof Animation)) {
            if ((value instanceof Array) || (value && value.push && _isArray(value))) {
              align = align || "normal";
              stagger = stagger || 0;
              curTime = position;
              l = value.length;
              for (i = 0; i < l; i++) {
                if (_isArray(child = value[i])) {
                  child = new TimelineLite({tweens: child});
                }
                this.add(child, curTime);
                if (typeof(child) !== "string" && typeof(child) !== "function") {
                  if (align === "sequence") {
                    curTime = child._startTime + (child.totalDuration() / child._timeScale);
                  } else if (align === "start") {
                    child._startTime -= child.delay();
                  }
                }
                curTime += stagger;
              }
              return this._uncache(true);
            } else if (typeof(value) === "string") {
              return this.addLabel(value, position);
            } else if (typeof(value) === "function") {
              value = TweenLite.delayedCall(0, value);
            } else {
              throw("Cannot add " + value + " into the timeline; it is not a tween, timeline, function, or string.");
            }
          }

          SimpleTimeline.prototype.add.call(this, value, position);

          if (value._time) { //in case, for example, the _startTime is moved on a tween that has already rendered. Imagine it's at its end state, then the startTime is moved WAY later (after the end of this timeline), it should render at its beginning.
            value.render((this.rawTime() - value._startTime) * value._timeScale, false, false);
          }

          //if the timeline has already ended but the inserted tween/timeline extends the duration, we should enable this timeline again so that it renders properly. We should also align the playhead with the parent timeline's when appropriate.
          if (this._gc || this._time === this._duration) if (!this._paused) if (this._duration < this.duration()) {
            //in case any of the ancestors had completed but should now be enabled...
            tl = this;
            beforeRawTime = (tl.rawTime() > value._startTime); //if the tween is placed on the timeline so that it starts BEFORE the current rawTime, we should align the playhead (move the timeline). This is because sometimes users will create a timeline, let it finish, and much later append a tween and expect it to run instead of jumping to its end state. While technically one could argue that it should jump to its end state, that's not what users intuitively expect.
            while (tl._timeline) {
              if (beforeRawTime && tl._timeline.smoothChildTiming) {
                tl.totalTime(tl._totalTime, true); //moves the timeline (shifts its startTime) if necessary, and also enables it.
              } else if (tl._gc) {
                tl._enabled(true, false);
              }
              tl = tl._timeline;
            }
          }

          return this;
        };

        p.remove = function (value) {
          if (value instanceof Animation) {
            this._remove(value, false);
            var tl = value._timeline = value.vars.useFrames ? Animation._rootFramesTimeline : Animation._rootTimeline; //now that it's removed, default it to the root timeline so that if it gets played again, it doesn't jump back into this timeline.
            value._startTime = (value._paused ? value._pauseTime : tl._time) - ((!value._reversed ? value._totalTime : value.totalDuration()
                - value._totalTime) / value._timeScale); //ensure that if it gets played again, the timing is correct.
            return this;
          } else if (value instanceof Array || (value && value.push && _isArray(value))) {
            var i = value.length;
            while (--i > -1) {
              this.remove(value[i]);
            }
            return this;
          } else if (typeof(value) === "string") {
            return this.removeLabel(value);
          }
          return this.kill(null, value);
        };

        p._remove = function (tween, skipDisable) {
          SimpleTimeline.prototype._remove.call(this, tween, skipDisable);
          var last = this._last;
          if (!last) {
            this._time = this._totalTime = this._duration = this._totalDuration = 0;
          } else if (this._time > this.duration()) {
            this._time = this._duration;
            this._totalTime = this._totalDuration;
          }
          return this;
        };

        p.append = function (value, offsetOrLabel) {
          return this.add(value, this._parseTimeOrLabel(null, offsetOrLabel, true, value));
        };

        p.insert = p.insertMultiple = function (value, position, align, stagger) {
          return this.add(value, position || 0, align, stagger);
        };

        p.appendMultiple = function (tweens, offsetOrLabel, align, stagger) {
          return this.add(tweens, this._parseTimeOrLabel(null, offsetOrLabel, true, tweens), align, stagger);
        };

        p.addLabel = function (label, position) {
          this._labels[label] = this._parseTimeOrLabel(position);
          return this;
        };

        p.addPause = function (position, callback, params, scope) {
          var t = TweenLite.delayedCall(0, _pauseCallback, params, scope || this);
          t.vars.onComplete = t.vars.onReverseComplete = callback;
          t.data = "isPause";
          this._hasPause = true;
          return this.add(t, position);
        };

        p.removeLabel = function (label) {
          delete this._labels[label];
          return this;
        };

        p.getLabelTime = function (label) {
          return (this._labels[label] != null) ? this._labels[label] : -1;
        };

        p._parseTimeOrLabel = function (timeOrLabel, offsetOrLabel, appendIfAbsent, ignore) {
          var clippedDuration, i;
          //if we're about to add a tween/timeline (or an array of them) that's already a child of this timeline, we should remove it first so that it doesn't contaminate the duration().
          if (ignore instanceof Animation && ignore.timeline === this) {
            this.remove(ignore);
          } else if (ignore && ((ignore instanceof Array) || (ignore.push && _isArray(ignore)))) {
            i = ignore.length;
            while (--i > -1) {
              if (ignore[i] instanceof Animation && ignore[i].timeline === this) {
                this.remove(ignore[i]);
              }
            }
          }
          clippedDuration = (typeof(timeOrLabel) === "number" && !offsetOrLabel) ? 0 : (this.duration() > 99999999999)
              ? this.recent().endTime(false) : this._duration; //in case there's a child that infinitely repeats, users almost never intend for the insertion point of a new child to be based on a SUPER long value like that so we clip it and assume the most recently-added child's endTime should be used instead.
          if (typeof(offsetOrLabel) === "string") {
            return this._parseTimeOrLabel(offsetOrLabel,
                (appendIfAbsent && typeof(timeOrLabel) === "number" && this._labels[offsetOrLabel] == null) ? timeOrLabel - clippedDuration
                    : 0, appendIfAbsent);
          }
          offsetOrLabel = offsetOrLabel || 0;
          if (typeof(timeOrLabel) === "string" && (isNaN(timeOrLabel) || this._labels[timeOrLabel] != null)) { //if the string is a number like "1", check to see if there's a label with that name, otherwise interpret it as a number (absolute value).
            i = timeOrLabel.indexOf("=");
            if (i === -1) {
              if (this._labels[timeOrLabel] == null) {
                return appendIfAbsent ? (this._labels[timeOrLabel] = clippedDuration + offsetOrLabel) : offsetOrLabel;
              }
              return this._labels[timeOrLabel] + offsetOrLabel;
            }
            offsetOrLabel = parseInt(timeOrLabel.charAt(i - 1) + "1", 10) * Number(timeOrLabel.substr(i + 1));
            timeOrLabel = (i > 1) ? this._parseTimeOrLabel(timeOrLabel.substr(0, i - 1), 0, appendIfAbsent) : clippedDuration;
          } else if (timeOrLabel == null) {
            timeOrLabel = clippedDuration;
          }
          return Number(timeOrLabel) + offsetOrLabel;
        };

        p.seek = function (position, suppressEvents) {
          return this.totalTime((typeof(position) === "number") ? position : this._parseTimeOrLabel(position), (suppressEvents !== false));
        };

        p.stop = function () {
          return this.paused(true);
        };

        p.gotoAndPlay = function (position, suppressEvents) {
          return this.play(position, suppressEvents);
        };

        p.gotoAndStop = function (position, suppressEvents) {
          return this.pause(position, suppressEvents);
        };

        p.render = function (time, suppressEvents, force) {
          if (this._gc) {
            this._enabled(true, false);
          }
          var prevTime = this._time,
              totalDur = (!this._dirty) ? this._totalDuration : this.totalDuration(),
              prevStart = this._startTime,
              prevTimeScale = this._timeScale,
              prevPaused = this._paused,
              tween, isComplete, next, callback, internalForce, pauseTween, curTime;
          if (prevTime !== this._time) { //if totalDuration() finds a child with a negative startTime and smoothChildTiming is true, things get shifted around internally so we need to adjust the time accordingly. For example, if a tween starts at -30 we must shift EVERYTHING forward 30 seconds and move this timeline's startTime backward by 30 seconds so that things align with the playhead (no jump).
            time += this._time - prevTime;
          }
          if (time >= totalDur - 0.0000001 && time >= 0) { //to work around occasional floating point math artifacts.
            this._totalTime = this._time = totalDur;
            if (!this._reversed) if (!this._hasPausedChild()) {
              isComplete = true;
              callback = "onComplete";
              internalForce = !!this._timeline.autoRemoveChildren; //otherwise, if the animation is unpaused/activated after it's already finished, it doesn't get removed from the parent timeline.
              if (this._duration === 0) if ((time <= 0 && time >= -0.0000001) || this._rawPrevTime < 0 || this._rawPrevTime
                  === _tinyNum) if (this._rawPrevTime !== time && this._first) {
                internalForce = true;
                if (this._rawPrevTime > _tinyNum) {
                  callback = "onReverseComplete";
                }
              }
            }
            this._rawPrevTime = (this._duration || !suppressEvents || time || this._rawPrevTime === time) ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration timeline or tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
            time = totalDur + 0.0001; //to avoid occasional floating point rounding errors - sometimes child tweens/timelines were not being fully completed (their progress might be 0.999999999999998 instead of 1 because when _time - tween._startTime is performed, floating point errors would return a value that was SLIGHTLY off). Try (999999999999.7 - 999999999999) * 1 = 0.699951171875 instead of 0.7.

          } else if (time < 0.0000001) { //to work around occasional floating point math artifacts, round super small values to 0.
            this._totalTime = this._time = 0;
            if (prevTime !== 0 || (this._duration === 0 && this._rawPrevTime !== _tinyNum && (this._rawPrevTime > 0 || (time < 0
                    && this._rawPrevTime >= 0)))) {
              callback = "onReverseComplete";
              isComplete = this._reversed;
            }
            if (time < 0) {
              this._active = false;
              if (this._timeline.autoRemoveChildren && this._reversed) { //ensures proper GC if a timeline is resumed after it's finished reversing.
                internalForce = isComplete = true;
                callback = "onReverseComplete";
              } else if (this._rawPrevTime >= 0 && this._first) { //when going back beyond the start, force a render so that zero-duration tweens that sit at the very beginning render their start values properly. Otherwise, if the parent timeline's playhead lands exactly at this timeline's startTime, and then moves backwards, the zero-duration tweens at the beginning would still be at their end state.
                internalForce = true;
              }
              this._rawPrevTime = time;
            } else {
              this._rawPrevTime = (this._duration || !suppressEvents || time || this._rawPrevTime === time) ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration timeline or tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
              if (time === 0 && isComplete) { //if there's a zero-duration tween at the very beginning of a timeline and the playhead lands EXACTLY at time 0, that tween will correctly render its end values, but we need to keep the timeline alive for one more render so that the beginning values render properly as the parent's playhead keeps moving beyond the begining. Imagine obj.x starts at 0 and then we do tl.set(obj, {x:100}).to(obj, 1, {x:200}) and then later we tl.reverse()...the goal is to have obj.x revert to 0. If the playhead happens to land on exactly 0, without this chunk of code, it'd complete the timeline and remove it from the rendering queue (not good).
                tween = this._first;
                while (tween && tween._startTime === 0) {
                  if (!tween._duration) {
                    isComplete = false;
                  }
                  tween = tween._next;
                }
              }
              time = 0; //to avoid occasional floating point rounding errors (could cause problems especially with zero-duration tweens at the very beginning of the timeline)
              if (!this._initted) {
                internalForce = true;
              }
            }

          } else {

            if (this._hasPause && !this._forcingPlayhead && !suppressEvents) {
              if (time >= prevTime) {
                tween = this._first;
                while (tween && tween._startTime <= time && !pauseTween) {
                  if (!tween._duration) {
                    if (tween.data === "isPause" && !tween.ratio && !(tween._startTime === 0 && this._rawPrevTime
                            === 0)) {
                      pauseTween = tween;
                    }
                  }
                  tween = tween._next;
                }
              } else {
                tween = this._last;
                while (tween && tween._startTime >= time && !pauseTween) {
                  if (!tween._duration) {
                    if (tween.data === "isPause" && tween._rawPrevTime > 0) {
                      pauseTween = tween;
                    }
                  }
                  tween = tween._prev;
                }
              }
              if (pauseTween) {
                this._time = time = pauseTween._startTime;
                this._totalTime = time + (this._cycle * (this._totalDuration + this._repeatDelay));
              }
            }

            this._totalTime = this._time = this._rawPrevTime = time;
          }
          if ((this._time === prevTime || !this._first) && !force && !internalForce && !pauseTween) {
            return;
          } else if (!this._initted) {
            this._initted = true;
          }

          if (!this._active) if (!this._paused && this._time !== prevTime && time > 0) {
            this._active = true;  //so that if the user renders the timeline (as opposed to the parent timeline rendering it), it is forced to re-render and align it with the proper time/frame on the next rendering cycle. Maybe the timeline already finished but the user manually re-renders it as halfway done, for example.
          }

          if (prevTime === 0) {
            if (this.vars.onStart) {
              if (this._time !== 0 || !this._duration) {
                if (!suppressEvents) {
                  this._callback("onStart");
                }
              }
            }
          }

          curTime = this._time;
          if (curTime >= prevTime) {
            tween = this._first;
            while (tween) {
              next = tween._next; //record it here because the value could change after rendering...
              if (curTime !== this._time || (this._paused && !prevPaused)) { //in case a tween pauses or seeks the timeline when rendering, like inside of an onUpdate/onComplete
                break;
              } else if (tween._active || (tween._startTime <= curTime && !tween._paused && !tween._gc)) {
                if (pauseTween === tween) {
                  this.pause();
                }
                if (!tween._reversed) {
                  tween.render((time - tween._startTime) * tween._timeScale, suppressEvents, force);
                } else {
                  tween.render(((!tween._dirty) ? tween._totalDuration : tween.totalDuration()) - ((time - tween._startTime)
                      * tween._timeScale), suppressEvents, force);
                }
              }
              tween = next;
            }
          } else {
            tween = this._last;
            while (tween) {
              next = tween._prev; //record it here because the value could change after rendering...
              if (curTime !== this._time || (this._paused && !prevPaused)) { //in case a tween pauses or seeks the timeline when rendering, like inside of an onUpdate/onComplete
                break;
              } else if (tween._active || (tween._startTime <= prevTime && !tween._paused && !tween._gc)) {
                if (pauseTween === tween) {
                  pauseTween = tween._prev; //the linked list is organized by _startTime, thus it's possible that a tween could start BEFORE the pause and end after it, in which case it would be positioned before the pause tween in the linked list, but we should render it before we pause() the timeline and cease rendering. This is only a concern when going in reverse.
                  while (pauseTween && pauseTween.endTime() > this._time) {
                    pauseTween.render(
                        (pauseTween._reversed ? pauseTween.totalDuration() - ((time - pauseTween._startTime) * pauseTween._timeScale)
                            : (time - pauseTween._startTime) * pauseTween._timeScale), suppressEvents, force);
                    pauseTween = pauseTween._prev;
                  }
                  pauseTween = null;
                  this.pause();
                }
                if (!tween._reversed) {
                  tween.render((time - tween._startTime) * tween._timeScale, suppressEvents, force);
                } else {
                  tween.render(((!tween._dirty) ? tween._totalDuration : tween.totalDuration()) - ((time - tween._startTime)
                      * tween._timeScale), suppressEvents, force);
                }
              }
              tween = next;
            }
          }

          if (this._onUpdate) if (!suppressEvents) {
            if (_lazyTweens.length) { //in case rendering caused any tweens to lazy-init, we should render them because typically when a timeline finishes, users expect things to have rendered fully. Imagine an onUpdate on a timeline that reports/checks tweened values.
              _lazyRender();
            }
            this._callback("onUpdate");
          }

          if (callback) if (!this._gc) if (prevStart === this._startTime || prevTimeScale !== this._timeScale) if (this._time === 0
              || totalDur >= this.totalDuration()) { //if one of the tweens that was rendered altered this timeline's startTime (like if an onComplete reversed the timeline), it probably isn't complete. If it is, don't worry, because whatever call altered the startTime would complete if it was necessary at the new time. The only exception is the timeScale property. Also check _gc because there's a chance that kill() could be called in an onUpdate
            if (isComplete) {
              if (_lazyTweens.length) { //in case rendering caused any tweens to lazy-init, we should render them because typically when a timeline finishes, users expect things to have rendered fully. Imagine an onComplete on a timeline that reports/checks tweened values.
                _lazyRender();
              }
              if (this._timeline.autoRemoveChildren) {
                this._enabled(false, false);
              }
              this._active = false;
            }
            if (!suppressEvents && this.vars[callback]) {
              this._callback(callback);
            }
          }
        };

        p._hasPausedChild = function () {
          var tween = this._first;
          while (tween) {
            if (tween._paused || ((tween instanceof TimelineLite) && tween._hasPausedChild())) {
              return true;
            }
            tween = tween._next;
          }
          return false;
        };

        p.getChildren = function (nested, tweens, timelines, ignoreBeforeTime) {
          ignoreBeforeTime = ignoreBeforeTime || -9999999999;
          var a = [],
              tween = this._first,
              cnt = 0;
          while (tween) {
            if (tween._startTime < ignoreBeforeTime) {
              //do nothing
            } else if (tween instanceof TweenLite) {
              if (tweens !== false) {
                a[cnt++] = tween;
              }
            } else {
              if (timelines !== false) {
                a[cnt++] = tween;
              }
              if (nested !== false) {
                a = a.concat(tween.getChildren(true, tweens, timelines));
                cnt = a.length;
              }
            }
            tween = tween._next;
          }
          return a;
        };

        p.getTweensOf = function (target, nested) {
          var disabled = this._gc,
              a = [],
              cnt = 0,
              tweens, i;
          if (disabled) {
            this._enabled(true, true); //getTweensOf() filters out disabled tweens, and we have to mark them as _gc = true when the timeline completes in order to allow clean garbage collection, so temporarily re-enable the timeline here.
          }
          tweens = TweenLite.getTweensOf(target);
          i = tweens.length;
          while (--i > -1) {
            if (tweens[i].timeline === this || (nested && this._contains(tweens[i]))) {
              a[cnt++] = tweens[i];
            }
          }
          if (disabled) {
            this._enabled(false, true);
          }
          return a;
        };

        p.recent = function () {
          return this._recent;
        };

        p._contains = function (tween) {
          var tl = tween.timeline;
          while (tl) {
            if (tl === this) {
              return true;
            }
            tl = tl.timeline;
          }
          return false;
        };

        p.shiftChildren = function (amount, adjustLabels, ignoreBeforeTime) {
          ignoreBeforeTime = ignoreBeforeTime || 0;
          var tween = this._first,
              labels = this._labels,
              p;
          while (tween) {
            if (tween._startTime >= ignoreBeforeTime) {
              tween._startTime += amount;
            }
            tween = tween._next;
          }
          if (adjustLabels) {
            for (p in labels) {
              if (labels[p] >= ignoreBeforeTime) {
                labels[p] += amount;
              }
            }
          }
          return this._uncache(true);
        };

        p._kill = function (vars, target) {
          if (!vars && !target) {
            return this._enabled(false, false);
          }
          var tweens = (!target) ? this.getChildren(true, true, false) : this.getTweensOf(target),
              i = tweens.length,
              changed = false;
          while (--i > -1) {
            if (tweens[i]._kill(vars, target)) {
              changed = true;
            }
          }
          return changed;
        };

        p.clear = function (labels) {
          var tweens = this.getChildren(false, true, true),
              i = tweens.length;
          this._time = this._totalTime = 0;
          while (--i > -1) {
            tweens[i]._enabled(false, false);
          }
          if (labels !== false) {
            this._labels = {};
          }
          return this._uncache(true);
        };

        p.invalidate = function () {
          var tween = this._first;
          while (tween) {
            tween.invalidate();
            tween = tween._next;
          }
          return Animation.prototype.invalidate.call(this);
          ;
        };

        p._enabled = function (enabled, ignoreTimeline) {
          if (enabled === this._gc) {
            var tween = this._first;
            while (tween) {
              tween._enabled(enabled, true);
              tween = tween._next;
            }
          }
          return SimpleTimeline.prototype._enabled.call(this, enabled, ignoreTimeline);
        };

        p.totalTime = function (time, suppressEvents, uncapped) {
          this._forcingPlayhead = true;
          var val = Animation.prototype.totalTime.apply(this, arguments);
          this._forcingPlayhead = false;
          return val;
        };

        p.duration = function (value) {
          if (!arguments.length) {
            if (this._dirty) {
              this.totalDuration(); //just triggers recalculation
            }
            return this._duration;
          }
          if (this.duration() !== 0 && value !== 0) {
            this.timeScale(this._duration / value);
          }
          return this;
        };

        p.totalDuration = function (value) {
          if (!arguments.length) {
            if (this._dirty) {
              var max = 0,
                  tween = this._last,
                  prevStart = 999999999999,
                  prev, end;
              while (tween) {
                prev = tween._prev; //record it here in case the tween changes position in the sequence...
                if (tween._dirty) {
                  tween.totalDuration(); //could change the tween._startTime, so make sure the tween's cache is clean before analyzing it.
                }
                if (tween._startTime > prevStart && this._sortChildren && !tween._paused && !this._calculatingDuration) { //in case one of the tweens shifted out of order, it needs to be re-inserted into the correct position in the sequence
                  this._calculatingDuration = 1; //prevent endless recursive calls - there are methods that get triggered that check duration/totalDuration when we add(), like _parseTimeOrLabel().
                  this.add(tween, tween._startTime - tween._delay);
                  this._calculatingDuration = 0;
                } else {
                  prevStart = tween._startTime;
                }
                if (tween._startTime < 0 && !tween._paused) { //children aren't allowed to have negative startTimes unless smoothChildTiming is true, so adjust here if one is found.
                  max -= tween._startTime;
                  if (this._timeline.smoothChildTiming) {
                    this._startTime += tween._startTime / this._timeScale;
                    this._time -= tween._startTime;
                    this._totalTime -= tween._startTime;
                    this._rawPrevTime -= tween._startTime;
                  }
                  this.shiftChildren(-tween._startTime, false, -9999999999);
                  prevStart = 0;
                }
                end = tween._startTime + (tween._totalDuration / tween._timeScale);
                if (end > max) {
                  max = end;
                }
                tween = prev;
              }
              this._duration = this._totalDuration = max;
              this._dirty = false;
            }
            return this._totalDuration;
          }
          return (value && this.totalDuration()) ? this.timeScale(this._totalDuration / value) : this;
        };

        p.paused = function (value) {
          if (!value) { //if there's a pause directly at the spot from where we're unpausing, skip it.
            var tween = this._first,
                time = this._time;
            while (tween) {
              if (tween._startTime === time && tween.data === "isPause") {
                tween._rawPrevTime = 0; //remember, _rawPrevTime is how zero-duration tweens/callbacks sense directionality and determine whether or not to fire. If _rawPrevTime is the same as _startTime on the next render, it won't fire.
              }
              tween = tween._next;
            }
          }
          return Animation.prototype.paused.apply(this, arguments);
        };

        p.usesFrames = function () {
          var tl = this._timeline;
          while (tl._timeline) {
            tl = tl._timeline;
          }
          return (tl === Animation._rootFramesTimeline);
        };

        p.rawTime = function (wrapRepeats) {
          return (wrapRepeats && (this._paused || (this._repeat && this.time() > 0 && this.totalProgress() < 1))) ? this._totalTime
              % (this._duration + this._repeatDelay) : this._paused ? this._totalTime : (this._timeline.rawTime(wrapRepeats)
              - this._startTime) * this._timeScale;
        };

        return TimelineLite;

      }, true);

  /*
 * ----------------------------------------------------------------
 * TimelineMax
 * ----------------------------------------------------------------
 */
  _gsScope._gsDefine("TimelineMax", ["TimelineLite", "TweenLite", "easing.Ease"], function (TimelineLite, TweenLite, Ease) {

    var TimelineMax = function (vars) {
          TimelineLite.call(this, vars);
          this._repeat = this.vars.repeat || 0;
          this._repeatDelay = this.vars.repeatDelay || 0;
          this._cycle = 0;
          this._yoyo = (this.vars.yoyo === true);
          this._dirty = true;
        },
        _tinyNum = 0.0000000001,
        TweenLiteInternals = TweenLite._internals,
        _lazyTweens = TweenLiteInternals.lazyTweens,
        _lazyRender = TweenLiteInternals.lazyRender,
        _globals = _gsScope._gsDefine.globals,
        _easeNone = new Ease(null, null, 1, 0),
        p = TimelineMax.prototype = new TimelineLite();

    p.constructor = TimelineMax;
    p.kill()._gc = false;
    TimelineMax.version = "1.20.3";

    p.invalidate = function () {
      this._yoyo = (this.vars.yoyo === true);
      this._repeat = this.vars.repeat || 0;
      this._repeatDelay = this.vars.repeatDelay || 0;
      this._uncache(true);
      return TimelineLite.prototype.invalidate.call(this);
    };

    p.addCallback = function (callback, position, params, scope) {
      return this.add(TweenLite.delayedCall(0, callback, params, scope), position);
    };

    p.removeCallback = function (callback, position) {
      if (callback) {
        if (position == null) {
          this._kill(null, callback);
        } else {
          var a = this.getTweensOf(callback, false),
              i = a.length,
              time = this._parseTimeOrLabel(position);
          while (--i > -1) {
            if (a[i]._startTime === time) {
              a[i]._enabled(false, false);
            }
          }
        }
      }
      return this;
    };

    p.removePause = function (position) {
      return this.removeCallback(TimelineLite._internals.pauseCallback, position);
    };

    p.tweenTo = function (position, vars) {
      vars = vars || {};
      var copy = {ease: _easeNone, useFrames: this.usesFrames(), immediateRender: false},
          Engine = (vars.repeat && _globals.TweenMax) || TweenLite,
          duration, p, t;
      for (p in vars) {
        copy[p] = vars[p];
      }
      copy.time = this._parseTimeOrLabel(position);
      duration = (Math.abs(Number(copy.time) - this._time) / this._timeScale) || 0.001;
      t = new Engine(this, duration, copy);
      copy.onStart = function () {
        t.target.paused(true);
        if (t.vars.time !== t.target.time() && duration === t.duration()) { //don't make the duration zero - if it's supposed to be zero, don't worry because it's already initting the tween and will complete immediately, effectively making the duration zero anyway. If we make duration zero, the tween won't run at all.
          t.duration(Math.abs(t.vars.time - t.target.time()) / t.target._timeScale);
        }
        if (vars.onStart) { //in case the user had an onStart in the vars - we don't want to overwrite it.
          vars.onStart.apply(vars.onStartScope || vars.callbackScope || t, vars.onStartParams || []); //don't use t._callback("onStart") or it'll point to the copy.onStart and we'll get a recursion error.
        }
      };
      return t;
    };

    p.tweenFromTo = function (fromPosition, toPosition, vars) {
      vars = vars || {};
      fromPosition = this._parseTimeOrLabel(fromPosition);
      vars.startAt = {onComplete: this.seek, onCompleteParams: [fromPosition], callbackScope: this};
      vars.immediateRender = (vars.immediateRender !== false);
      var t = this.tweenTo(toPosition, vars);
      return t.duration((Math.abs(t.vars.time - fromPosition) / this._timeScale) || 0.001);
    };

    p.render = function (time, suppressEvents, force) {
      if (this._gc) {
        this._enabled(true, false);
      }
      var prevTime = this._time,
          totalDur = (!this._dirty) ? this._totalDuration : this.totalDuration(),
          dur = this._duration,
          prevTotalTime = this._totalTime,
          prevStart = this._startTime,
          prevTimeScale = this._timeScale,
          prevRawPrevTime = this._rawPrevTime,
          prevPaused = this._paused,
          prevCycle = this._cycle,
          tween, isComplete, next, callback, internalForce, cycleDuration, pauseTween, curTime;
      if (prevTime !== this._time) { //if totalDuration() finds a child with a negative startTime and smoothChildTiming is true, things get shifted around internally so we need to adjust the time accordingly. For example, if a tween starts at -30 we must shift EVERYTHING forward 30 seconds and move this timeline's startTime backward by 30 seconds so that things align with the playhead (no jump).
        time += this._time - prevTime;
      }
      if (time >= totalDur - 0.0000001 && time >= 0) { //to work around occasional floating point math artifacts.
        if (!this._locked) {
          this._totalTime = totalDur;
          this._cycle = this._repeat;
        }
        if (!this._reversed) {
          if (!this._hasPausedChild()) {
            isComplete = true;
            callback = "onComplete";
            internalForce = !!this._timeline.autoRemoveChildren; //otherwise, if the animation is unpaused/activated after it's already finished, it doesn't get removed from the parent timeline.
            if (this._duration === 0) {
              if ((time <= 0 && time >= -0.0000001) || prevRawPrevTime < 0 || prevRawPrevTime
                  === _tinyNum) {
                if (prevRawPrevTime !== time && this._first) {
                  internalForce = true;
                  if (prevRawPrevTime > _tinyNum) {
                    callback = "onReverseComplete";
                  }
                }
              }
            }
          }
        }
        this._rawPrevTime = (this._duration || !suppressEvents || time || this._rawPrevTime === time) ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration timeline or tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
        if (this._yoyo && (this._cycle & 1) !== 0) {
          this._time = time = 0;
        } else {
          this._time = dur;
          time = dur + 0.0001; //to avoid occasional floating point rounding errors - sometimes child tweens/timelines were not being fully completed (their progress might be 0.999999999999998 instead of 1 because when _time - tween._startTime is performed, floating point errors would return a value that was SLIGHTLY off). Try (999999999999.7 - 999999999999) * 1 = 0.699951171875 instead of 0.7. We cannot do less then 0.0001 because the same issue can occur when the duration is extremely large like 999999999999 in which case adding 0.00000001, for example, causes it to act like nothing was added.
        }

      } else if (time < 0.0000001) { //to work around occasional floating point math artifacts, round super small values to 0.
        if (!this._locked) {
          this._totalTime = this._cycle = 0;
        }
        this._time = 0;
        if (prevTime !== 0 || (dur === 0 && prevRawPrevTime !== _tinyNum && (prevRawPrevTime > 0 || (time < 0 && prevRawPrevTime >= 0))
                && !this._locked)) { //edge case for checking time < 0 && prevRawPrevTime >= 0: a zero-duration fromTo() tween inside a zero-duration timeline (yeah, very rare)
          callback = "onReverseComplete";
          isComplete = this._reversed;
        }
        if (time < 0) {
          this._active = false;
          if (this._timeline.autoRemoveChildren && this._reversed) {
            internalForce = isComplete = true;
            callback = "onReverseComplete";
          } else if (prevRawPrevTime >= 0 && this._first) { //when going back beyond the start, force a render so that zero-duration tweens that sit at the very beginning render their start values properly. Otherwise, if the parent timeline's playhead lands exactly at this timeline's startTime, and then moves backwards, the zero-duration tweens at the beginning would still be at their end state.
            internalForce = true;
          }
          this._rawPrevTime = time;
        } else {
          this._rawPrevTime = (dur || !suppressEvents || time || this._rawPrevTime === time) ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration timeline or tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
          if (time === 0 && isComplete) { //if there's a zero-duration tween at the very beginning of a timeline and the playhead lands EXACTLY at time 0, that tween will correctly render its end values, but we need to keep the timeline alive for one more render so that the beginning values render properly as the parent's playhead keeps moving beyond the begining. Imagine obj.x starts at 0 and then we do tl.set(obj, {x:100}).to(obj, 1, {x:200}) and then later we tl.reverse()...the goal is to have obj.x revert to 0. If the playhead happens to land on exactly 0, without this chunk of code, it'd complete the timeline and remove it from the rendering queue (not good).
            tween = this._first;
            while (tween && tween._startTime === 0) {
              if (!tween._duration) {
                isComplete = false;
              }
              tween = tween._next;
            }
          }
          time = 0; //to avoid occasional floating point rounding errors (could cause problems especially with zero-duration tweens at the very beginning of the timeline)
          if (!this._initted) {
            internalForce = true;
          }
        }

      } else {
        if (dur === 0 && prevRawPrevTime < 0) { //without this, zero-duration repeating timelines (like with a simple callback nested at the very beginning and a repeatDelay) wouldn't render the first time through.
          internalForce = true;
        }
        this._time = this._rawPrevTime = time;
        if (!this._locked) {
          this._totalTime = time;
          if (this._repeat !== 0) {
            cycleDuration = dur + this._repeatDelay;
            this._cycle = (this._totalTime / cycleDuration) >> 0; //originally _totalTime % cycleDuration but floating point errors caused problems, so I normalized it. (4 % 0.8 should be 0 but it gets reported as 0.79999999!)
            if (this._cycle !== 0) {
              if (this._cycle === this._totalTime / cycleDuration && prevTotalTime <= time) {
                this._cycle--; //otherwise when rendered exactly at the end time, it will act as though it is repeating (at the beginning)
              }
            }
            this._time = this._totalTime - (this._cycle * cycleDuration);
            if (this._yoyo) {
              if ((this._cycle & 1) !== 0) {
                this._time = dur - this._time;
              }
            }
            if (this._time > dur) {
              this._time = dur;
              time = dur + 0.0001; //to avoid occasional floating point rounding error
            } else if (this._time < 0) {
              this._time = time = 0;
            } else {
              time = this._time;
            }
          }
        }

        if (this._hasPause && !this._forcingPlayhead && !suppressEvents) {
          time = this._time;
          if (time >= prevTime || (this._repeat && prevCycle !== this._cycle)) {
            tween = this._first;
            while (tween && tween._startTime <= time && !pauseTween) {
              if (!tween._duration) {
                if (tween.data === "isPause" && !tween.ratio && !(tween._startTime === 0 && this._rawPrevTime
                        === 0)) {
                  pauseTween = tween;
                }
              }
              tween = tween._next;
            }
          } else {
            tween = this._last;
            while (tween && tween._startTime >= time && !pauseTween) {
              if (!tween._duration) {
                if (tween.data === "isPause" && tween._rawPrevTime > 0) {
                  pauseTween = tween;
                }
              }
              tween = tween._prev;
            }
          }
          if (pauseTween && pauseTween._startTime < dur) {
            this._time = time = pauseTween._startTime;
            this._totalTime = time + (this._cycle * (this._totalDuration + this._repeatDelay));
          }
        }

      }

      if (this._cycle !== prevCycle) if (!this._locked) {
        /*
				make sure children at the end/beginning of the timeline are rendered properly. If, for example,
				a 3-second long timeline rendered at 2.9 seconds previously, and now renders at 3.2 seconds (which
				would get transated to 2.8 seconds if the timeline yoyos or 0.2 seconds if it just repeats), there
				could be a callback or a short tween that's at 2.95 or 3 seconds in which wouldn't render. So
				we need to push the timeline to the end (and/or beginning depending on its yoyo value). Also we must
				ensure that zero-duration tweens at the very beginning or end of the TimelineMax work.
				*/
        var backwards = (this._yoyo && (prevCycle & 1) !== 0),
            wrap = (backwards === (this._yoyo && (this._cycle & 1) !== 0)),
            recTotalTime = this._totalTime,
            recCycle = this._cycle,
            recRawPrevTime = this._rawPrevTime,
            recTime = this._time;

        this._totalTime = prevCycle * dur;
        if (this._cycle < prevCycle) {
          backwards = !backwards;
        } else {
          this._totalTime += dur;
        }
        this._time = prevTime; //temporarily revert _time so that render() renders the children in the correct order. Without this, tweens won't rewind correctly. We could arhictect things in a "cleaner" way by splitting out the rendering queue into a separate method but for performance reasons, we kept it all inside this method.

        this._rawPrevTime = (dur === 0) ? prevRawPrevTime - 0.0001 : prevRawPrevTime;
        this._cycle = prevCycle;
        this._locked = true; //prevents changes to totalTime and skips repeat/yoyo behavior when we recursively call render()
        prevTime = (backwards) ? 0 : dur;
        this.render(prevTime, suppressEvents, (dur === 0));
        if (!suppressEvents) {
          if (!this._gc) {
            if (this.vars.onRepeat) {
              this._cycle = recCycle; //in case the onRepeat alters the playhead or invalidates(), we shouldn't stay locked or use the previous cycle.
              this._locked = false;
              this._callback("onRepeat");
            }
          }
        }
        if (prevTime !== this._time) { //in case there's a callback like onComplete in a nested tween/timeline that changes the playhead position, like via seek(), we should just abort.
          return;
        }
        if (wrap) {
          this._cycle = prevCycle; //if there's an onRepeat, we reverted this above, so make sure it's set properly again. We also unlocked in that scenario, so reset that too.
          this._locked = true;
          prevTime = (backwards) ? dur + 0.0001 : -0.0001;
          this.render(prevTime, true, false);
        }
        this._locked = false;
        if (this._paused && !prevPaused) { //if the render() triggered callback that paused this timeline, we should abort (very rare, but possible)
          return;
        }
        this._time = recTime;
        this._totalTime = recTotalTime;
        this._cycle = recCycle;
        this._rawPrevTime = recRawPrevTime;
      }

      if ((this._time === prevTime || !this._first) && !force && !internalForce && !pauseTween) {
        if (prevTotalTime !== this._totalTime) {
          if (this._onUpdate) {
            if (!suppressEvents) { //so that onUpdate fires even during the repeatDelay - as long as the totalTime changed, we should trigger onUpdate.
              this._callback("onUpdate");
            }
          }
        }
        return;
      } else if (!this._initted) {
        this._initted = true;
      }

      if (!this._active) {
        if (!this._paused && this._totalTime !== prevTotalTime && time > 0) {
          this._active = true;  //so that if the user renders the timeline (as opposed to the parent timeline rendering it), it is forced to re-render and align it with the proper time/frame on the next rendering cycle. Maybe the timeline already finished but the user manually re-renders it as halfway done, for example.
        }
      }

      if (prevTotalTime === 0) {
        if (this.vars.onStart) {
          if (this._totalTime !== 0 || !this._totalDuration) {
            if (!suppressEvents) {
              this._callback("onStart");
            }
          }
        }
      }

      curTime = this._time;
      if (curTime >= prevTime) {
        tween = this._first;
        while (tween) {
          next = tween._next; //record it here because the value could change after rendering...
          if (curTime !== this._time || (this._paused && !prevPaused)) { //in case a tween pauses or seeks the timeline when rendering, like inside of an onUpdate/onComplete
            break;
          } else if (tween._active || (tween._startTime <= this._time && !tween._paused && !tween._gc)) {
            if (pauseTween === tween) {
              this.pause();
            }
            if (!tween._reversed) {
              tween.render((time - tween._startTime) * tween._timeScale, suppressEvents, force);
            } else {
              tween.render(((!tween._dirty) ? tween._totalDuration : tween.totalDuration()) - ((time - tween._startTime)
                  * tween._timeScale), suppressEvents, force);
            }
          }
          tween = next;
        }
      } else {
        tween = this._last;
        while (tween) {
          next = tween._prev; //record it here because the value could change after rendering...
          if (curTime !== this._time || (this._paused && !prevPaused)) { //in case a tween pauses or seeks the timeline when rendering, like inside of an onUpdate/onComplete
            break;
          } else if (tween._active || (tween._startTime <= prevTime && !tween._paused && !tween._gc)) {
            if (pauseTween === tween) {
              pauseTween = tween._prev; //the linked list is organized by _startTime, thus it's possible that a tween could start BEFORE the pause and end after it, in which case it would be positioned before the pause tween in the linked list, but we should render it before we pause() the timeline and cease rendering. This is only a concern when going in reverse.
              while (pauseTween && pauseTween.endTime() > this._time) {
                pauseTween.render(
                    (pauseTween._reversed ? pauseTween.totalDuration() - ((time - pauseTween._startTime) * pauseTween._timeScale)
                        : (time - pauseTween._startTime) * pauseTween._timeScale), suppressEvents, force);
                pauseTween = pauseTween._prev;
              }
              pauseTween = null;
              this.pause();
            }
            if (!tween._reversed) {
              tween.render((time - tween._startTime) * tween._timeScale, suppressEvents, force);
            } else {
              tween.render(((!tween._dirty) ? tween._totalDuration : tween.totalDuration()) - ((time - tween._startTime)
                  * tween._timeScale), suppressEvents, force);
            }
          }
          tween = next;
        }
      }

      if (this._onUpdate) {
        if (!suppressEvents) {
          if (_lazyTweens.length) { //in case rendering caused any tweens to lazy-init, we should render them because typically when a timeline finishes, users expect things to have rendered fully. Imagine an onUpdate on a timeline that reports/checks tweened values.
            _lazyRender();
          }
          this._callback("onUpdate");
        }
      }
      if (callback) {
        if (!this._locked) {
          if (!this._gc) {
            if (prevStart === this._startTime || prevTimeScale
                !== this._timeScale) {
              if (this._time === 0 || totalDur >= this.totalDuration()) { //if one of the tweens that was rendered altered this timeline's startTime (like if an onComplete reversed the timeline), it probably isn't complete. If it is, don't worry, because whatever call altered the startTime would complete if it was necessary at the new time. The only exception is the timeScale property. Also check _gc because there's a chance that kill() could be called in an onUpdate
                if (isComplete) {
                  if (_lazyTweens.length) { //in case rendering caused any tweens to lazy-init, we should render them because typically when a timeline finishes, users expect things to have rendered fully. Imagine an onComplete on a timeline that reports/checks tweened values.
                    _lazyRender();
                  }
                  if (this._timeline.autoRemoveChildren) {
                    this._enabled(false, false);
                  }
                  this._active = false;
                }
                if (!suppressEvents && this.vars[callback]) {
                  this._callback(callback);
                }
              }
            }
          }
        }
      }
    };

    p.getActive = function (nested, tweens, timelines) {
      if (nested == null) {
        nested = true;
      }
      if (tweens == null) {
        tweens = true;
      }
      if (timelines == null) {
        timelines = false;
      }
      var a = [],
          all = this.getChildren(nested, tweens, timelines),
          cnt = 0,
          l = all.length,
          i, tween;
      for (i = 0; i < l; i++) {
        tween = all[i];
        if (tween.isActive()) {
          a[cnt++] = tween;
        }
      }
      return a;
    };

    p.getLabelAfter = function (time) {
      if (!time) {
        if (time !== 0) { //faster than isNan()
          time = this._time;
        }
      }
      var labels = this.getLabelsArray(),
          l = labels.length,
          i;
      for (i = 0; i < l; i++) {
        if (labels[i].time > time) {
          return labels[i].name;
        }
      }
      return null;
    };

    p.getLabelBefore = function (time) {
      if (time == null) {
        time = this._time;
      }
      var labels = this.getLabelsArray(),
          i = labels.length;
      while (--i > -1) {
        if (labels[i].time < time) {
          return labels[i].name;
        }
      }
      return null;
    };

    p.getLabelsArray = function () {
      var a = [],
          cnt = 0,
          p;
      for (p in this._labels) {
        a[cnt++] = {time: this._labels[p], name: p};
      }
      a.sort(function (a, b) {
        return a.time - b.time;
      });
      return a;
    };

    p.invalidate = function () {
      this._locked = false; //unlock and set cycle in case invalidate() is called from inside an onRepeat
      return TimelineLite.prototype.invalidate.call(this);
    };

//---- GETTERS / SETTERS -------------------------------------------------------------------------------------------------------

    p.progress = function (value, suppressEvents) {
      return (!arguments.length) ? (this._time / this.duration()) || 0 : this.totalTime(this.duration() * ((this._yoyo && (this._cycle
          & 1) !== 0) ? 1 - value : value) + (this._cycle * (this._duration + this._repeatDelay)), suppressEvents);
    };

    p.totalProgress = function (value, suppressEvents) {
      return (!arguments.length) ? (this._totalTime / this.totalDuration()) || 0 : this.totalTime(this.totalDuration() * value,
          suppressEvents);
    };

    p.totalDuration = function (value) {
      if (!arguments.length) {
        if (this._dirty) {
          TimelineLite.prototype.totalDuration.call(this); //just forces refresh
          //Instead of Infinity, we use 999999999999 so that we can accommodate reverses.
          this._totalDuration = (this._repeat === -1) ? 999999999999 : this._duration * (this._repeat + 1) + (this._repeatDelay
              * this._repeat);
        }
        return this._totalDuration;
      }
      return (this._repeat === -1 || !value) ? this : this.timeScale(this.totalDuration() / value);
    };

    p.time = function (value, suppressEvents) {
      if (!arguments.length) {
        return this._time;
      }
      if (this._dirty) {
        this.totalDuration();
      }
      if (value > this._duration) {
        value = this._duration;
      }
      if (this._yoyo && (this._cycle & 1) !== 0) {
        value = (this._duration - value) + (this._cycle * (this._duration + this._repeatDelay));
      } else if (this._repeat !== 0) {
        value += this._cycle * (this._duration + this._repeatDelay);
      }
      return this.totalTime(value, suppressEvents);
    };

    p.repeat = function (value) {
      if (!arguments.length) {
        return this._repeat;
      }
      this._repeat = value;
      return this._uncache(true);
    };

    p.repeatDelay = function (value) {
      if (!arguments.length) {
        return this._repeatDelay;
      }
      this._repeatDelay = value;
      return this._uncache(true);
    };

    p.yoyo = function (value) {
      if (!arguments.length) {
        return this._yoyo;
      }
      this._yoyo = value;
      return this;
    };

    p.currentLabel = function (value) {
      if (!arguments.length) {
        return this.getLabelBefore(this._time + 0.00000001);
      }
      return this.seek(value, true);
    };

    return TimelineMax;

  }, true);

  /*
 * ----------------------------------------------------------------
 * BezierPlugin
 * ----------------------------------------------------------------
 */
  (function () {

    var _RAD2DEG = 180 / Math.PI,
        _r1 = [],
        _r2 = [],
        _r3 = [],
        _corProps = {},
        _globals = _gsScope._gsDefine.globals,
        Segment = function (a, b, c, d) {
          if (c === d) { //if c and d match, the final autoRotate value could lock at -90 degrees, so differentiate them slightly.
            c = d - (d - b) / 1000000;
          }
          if (a === b) { //if a and b match, the starting autoRotate value could lock at -90 degrees, so differentiate them slightly.
            b = a + (c - a) / 1000000;
          }
          this.a = a;
          this.b = b;
          this.c = c;
          this.d = d;
          this.da = d - a;
          this.ca = c - a;
          this.ba = b - a;
        },
        _correlate = ",x,y,z,left,top,right,bottom,marginTop,marginLeft,marginRight,marginBottom,paddingLeft,paddingTop,paddingRight,paddingBottom,backgroundPosition,backgroundPosition_y,",
        cubicToQuadratic = function (a, b, c, d) {
          var q1 = {a: a},
              q2 = {},
              q3 = {},
              q4 = {c: d},
              mab = (a + b) / 2,
              mbc = (b + c) / 2,
              mcd = (c + d) / 2,
              mabc = (mab + mbc) / 2,
              mbcd = (mbc + mcd) / 2,
              m8 = (mbcd - mabc) / 8;
          q1.b = mab + (a - mab) / 4;
          q2.b = mabc + m8;
          q1.c = q2.a = (q1.b + q2.b) / 2;
          q2.c = q3.a = (mabc + mbcd) / 2;
          q3.b = mbcd - m8;
          q4.b = mcd + (d - mcd) / 4;
          q3.c = q4.a = (q3.b + q4.b) / 2;
          return [q1, q2, q3, q4];
        },
        _calculateControlPoints = function (a, curviness, quad, basic, correlate) {
          var l = a.length - 1,
              ii = 0,
              cp1 = a[0].a,
              i, p1, p2, p3, seg, m1, m2, mm, cp2, qb, r1, r2, tl;
          for (i = 0; i < l; i++) {
            seg = a[ii];
            p1 = seg.a;
            p2 = seg.d;
            p3 = a[ii + 1].d;

            if (correlate) {
              r1 = _r1[i];
              r2 = _r2[i];
              tl = ((r2 + r1) * curviness * 0.25) / (basic ? 0.5 : _r3[i] || 0.5);
              m1 = p2 - (p2 - p1) * (basic ? curviness * 0.5 : (r1 !== 0 ? tl / r1 : 0));
              m2 = p2 + (p3 - p2) * (basic ? curviness * 0.5 : (r2 !== 0 ? tl / r2 : 0));
              mm = p2 - (m1 + (((m2 - m1) * ((r1 * 3 / (r1 + r2)) + 0.5) / 4) || 0));
            } else {
              m1 = p2 - (p2 - p1) * curviness * 0.5;
              m2 = p2 + (p3 - p2) * curviness * 0.5;
              mm = p2 - (m1 + m2) / 2;
            }
            m1 += mm;
            m2 += mm;

            seg.c = cp2 = m1;
            if (i !== 0) {
              seg.b = cp1;
            } else {
              seg.b = cp1 = seg.a + (seg.c - seg.a) * 0.6; //instead of placing b on a exactly, we move it inline with c so that if the user specifies an ease like Back.easeIn or Elastic.easeIn which goes BEYOND the beginning, it will do so smoothly.
            }

            seg.da = p2 - p1;
            seg.ca = cp2 - p1;
            seg.ba = cp1 - p1;

            if (quad) {
              qb = cubicToQuadratic(p1, cp1, cp2, p2);
              a.splice(ii, 1, qb[0], qb[1], qb[2], qb[3]);
              ii += 4;
            } else {
              ii++;
            }

            cp1 = m2;
          }
          seg = a[ii];
          seg.b = cp1;
          seg.c = cp1 + (seg.d - cp1) * 0.4; //instead of placing c on d exactly, we move it inline with b so that if the user specifies an ease like Back.easeOut or Elastic.easeOut which goes BEYOND the end, it will do so smoothly.
          seg.da = seg.d - seg.a;
          seg.ca = seg.c - seg.a;
          seg.ba = cp1 - seg.a;
          if (quad) {
            qb = cubicToQuadratic(seg.a, cp1, seg.c, seg.d);
            a.splice(ii, 1, qb[0], qb[1], qb[2], qb[3]);
          }
        },
        _parseAnchors = function (values, p, correlate, prepend) {
          var a = [],
              l, i, p1, p2, p3, tmp;
          if (prepend) {
            values = [prepend].concat(values);
            i = values.length;
            while (--i > -1) {
              if (typeof((tmp = values[i][p])) === "string") {
                if (tmp.charAt(1) === "=") {
                  values[i][p] = prepend[p] + Number(tmp.charAt(0) + tmp.substr(2)); //accommodate relative values. Do it inline instead of breaking it out into a function for speed reasons
                }
              }
            }
          }
          l = values.length - 2;
          if (l < 0) {
            a[0] = new Segment(values[0][p], 0, 0, values[0][p]);
            return a;
          }
          for (i = 0; i < l; i++) {
            p1 = values[i][p];
            p2 = values[i + 1][p];
            a[i] = new Segment(p1, 0, 0, p2);
            if (correlate) {
              p3 = values[i + 2][p];
              _r1[i] = (_r1[i] || 0) + (p2 - p1) * (p2 - p1);
              _r2[i] = (_r2[i] || 0) + (p3 - p2) * (p3 - p2);
            }
          }
          a[i] = new Segment(values[i][p], 0, 0, values[i + 1][p]);
          return a;
        },
        bezierThrough = function (values, curviness, quadratic, basic, correlate, prepend) {
          var obj = {},
              props = [],
              first = prepend || values[0],
              i, p, a, j, r, l, seamless, last;
          correlate = (typeof(correlate) === "string") ? "," + correlate + "," : _correlate;
          if (curviness == null) {
            curviness = 1;
          }
          for (p in values[0]) {
            props.push(p);
          }
          //check to see if the last and first values are identical (well, within 0.05). If so, make seamless by appending the second element to the very end of the values array and the 2nd-to-last element to the very beginning (we'll remove those segments later)
          if (values.length > 1) {
            last = values[values.length - 1];
            seamless = true;
            i = props.length;
            while (--i > -1) {
              p = props[i];
              if (Math.abs(first[p] - last[p]) > 0.05) { //build in a tolerance of +/-0.05 to accommodate rounding errors.
                seamless = false;
                break;
              }
            }
            if (seamless) {
              values = values.concat(); //duplicate the array to avoid contaminating the original which the user may be reusing for other tweens
              if (prepend) {
                values.unshift(prepend);
              }
              values.push(values[1]);
              prepend = values[values.length - 3];
            }
          }
          _r1.length = _r2.length = _r3.length = 0;
          i = props.length;
          while (--i > -1) {
            p = props[i];
            _corProps[p] = (correlate.indexOf("," + p + ",") !== -1);
            obj[p] = _parseAnchors(values, p, _corProps[p], prepend);
          }
          i = _r1.length;
          while (--i > -1) {
            _r1[i] = Math.sqrt(_r1[i]);
            _r2[i] = Math.sqrt(_r2[i]);
          }
          if (!basic) {
            i = props.length;
            while (--i > -1) {
              if (_corProps[p]) {
                a = obj[props[i]];
                l = a.length - 1;
                for (j = 0; j < l; j++) {
                  r = (a[j + 1].da / _r2[j] + a[j].da / _r1[j]) || 0;
                  _r3[j] = (_r3[j] || 0) + r * r;
                }
              }
            }
            i = _r3.length;
            while (--i > -1) {
              _r3[i] = Math.sqrt(_r3[i]);
            }
          }
          i = props.length;
          j = quadratic ? 4 : 1;
          while (--i > -1) {
            p = props[i];
            a = obj[p];
            _calculateControlPoints(a, curviness, quadratic, basic, _corProps[p]); //this method requires that _parseAnchors() and _setSegmentRatios() ran first so that _r1, _r2, and _r3 values are populated for all properties
            if (seamless) {
              a.splice(0, j);
              a.splice(a.length - j, j);
            }
          }
          return obj;
        },
        _parseBezierData = function (values, type, prepend) {
          type = type || "soft";
          var obj = {},
              inc = (type === "cubic") ? 3 : 2,
              soft = (type === "soft"),
              props = [],
              a, b, c, d, cur, i, j, l, p, cnt, tmp;
          if (soft && prepend) {
            values = [prepend].concat(values);
          }
          if (values == null || values.length < inc + 1) {
            throw "invalid Bezier data";
          }
          for (p in values[0]) {
            props.push(p);
          }
          i = props.length;
          while (--i > -1) {
            p = props[i];
            obj[p] = cur = [];
            cnt = 0;
            l = values.length;
            for (j = 0; j < l; j++) {
              a = (prepend == null) ? values[j][p] : (typeof((tmp = values[j][p])) === "string" && tmp.charAt(1) === "=") ? prepend[p]
                  + Number(tmp.charAt(0) + tmp.substr(2)) : Number(tmp);
              if (soft) {
                if (j > 1) {
                  if (j < l - 1) {
                    cur[cnt++] = (a + cur[cnt - 2]) / 2;
                  }
                }
              }
              cur[cnt++] = a;
            }
            l = cnt - inc + 1;
            cnt = 0;
            for (j = 0; j < l; j += inc) {
              a = cur[j];
              b = cur[j + 1];
              c = cur[j + 2];
              d = (inc === 2) ? 0 : cur[j + 3];
              cur[cnt++] = tmp = (inc === 3) ? new Segment(a, b, c, d) : new Segment(a, (2 * b + a) / 3, (2 * b + c) / 3, c);
            }
            cur.length = cnt;
          }
          return obj;
        },
        _addCubicLengths = function (a, steps, resolution) {
          var inc = 1 / resolution,
              j = a.length,
              d, d1, s, da, ca, ba, p, i, inv, bez, index;
          while (--j > -1) {
            bez = a[j];
            s = bez.a;
            da = bez.d - s;
            ca = bez.c - s;
            ba = bez.b - s;
            d = d1 = 0;
            for (i = 1; i <= resolution; i++) {
              p = inc * i;
              inv = 1 - p;
              d = d1 - (d1 = (p * p * da + 3 * inv * (p * ca + inv * ba)) * p);
              index = j * resolution + i - 1;
              steps[index] = (steps[index] || 0) + d * d;
            }
          }
        },
        _parseLengthData = function (obj, resolution) {
          resolution = resolution >> 0 || 6;
          var a = [],
              lengths = [],
              d = 0,
              total = 0,
              threshold = resolution - 1,
              segments = [],
              curLS = [], //current length segments array
              p, i, l, index;
          for (p in obj) {
            _addCubicLengths(obj[p], a, resolution);
          }
          l = a.length;
          for (i = 0; i < l; i++) {
            d += Math.sqrt(a[i]);
            index = i % resolution;
            curLS[index] = d;
            if (index === threshold) {
              total += d;
              index = (i / resolution) >> 0;
              segments[index] = curLS;
              lengths[index] = total;
              d = 0;
              curLS = [];
            }
          }
          return {length: total, lengths: lengths, segments: segments};
        },

        BezierPlugin = _gsScope._gsDefine.plugin({
          propName: "bezier",
          priority: -1,
          version: "1.3.8",
          API: 2,
          global: true,

          //gets called when the tween renders for the first time. This is where initial values should be recorded and any setup routines should run.
          init: function (target, vars, tween) {
            this._target = target;
            if (vars instanceof Array) {
              vars = {values: vars};
            }
            this._func = {};
            this._mod = {};
            this._props = [];
            this._timeRes = (vars.timeResolution == null) ? 6 : parseInt(vars.timeResolution, 10);
            var values = vars.values || [],
                first = {},
                second = values[0],
                autoRotate = vars.autoRotate || tween.vars.orientToBezier,
                p, isFunc, i, j, prepend;

            this._autoRotate = autoRotate ? (autoRotate instanceof Array) ? autoRotate : [["x", "y", "rotation",
              ((autoRotate === true) ? 0 : Number(autoRotate) || 0)]] : null;
            for (p in second) {
              this._props.push(p);
            }

            i = this._props.length;
            while (--i > -1) {
              p = this._props[i];

              this._overwriteProps.push(p);
              isFunc = this._func[p] = (typeof(target[p]) === "function");
              first[p] = (!isFunc) ? parseFloat(target[p]) : target[((p.indexOf("set") || typeof(target["get" + p.substr(3)])
                  !== "function") ? p : "get" + p.substr(3))]();
              if (!prepend) {
                if (first[p] !== values[0][p]) {
                  prepend = first;
                }
              }
            }
            this._beziers = (vars.type !== "cubic" && vars.type !== "quadratic" && vars.type !== "soft") ? bezierThrough(values,
                isNaN(vars.curviness) ? 1 : vars.curviness, false, (vars.type === "thruBasic"), vars.correlate, prepend) : _parseBezierData(
                values, vars.type, first);
            this._segCount = this._beziers[p].length;

            if (this._timeRes) {
              var ld = _parseLengthData(this._beziers, this._timeRes);
              this._length = ld.length;
              this._lengths = ld.lengths;
              this._segments = ld.segments;
              this._l1 = this._li = this._s1 = this._si = 0;
              this._l2 = this._lengths[0];
              this._curSeg = this._segments[0];
              this._s2 = this._curSeg[0];
              this._prec = 1 / this._curSeg.length;
            }

            if ((autoRotate = this._autoRotate)) {
              this._initialRotations = [];
              if (!(autoRotate[0] instanceof Array)) {
                this._autoRotate = autoRotate = [autoRotate];
              }
              i = autoRotate.length;
              while (--i > -1) {
                for (j = 0; j < 3; j++) {
                  p = autoRotate[i][j];
                  this._func[p] = (typeof(target[p]) === "function") ? target[((p.indexOf("set") || typeof(target["get" + p.substr(3)])
                      !== "function") ? p : "get" + p.substr(3))] : false;
                }
                p = autoRotate[i][2];
                this._initialRotations[i] = (this._func[p] ? this._func[p].call(this._target) : this._target[p]) || 0;
                this._overwriteProps.push(p);
              }
            }
            this._startRatio = tween.vars.runBackwards ? 1 : 0; //we determine the starting ratio when the tween inits which is always 0 unless the tween has runBackwards:true (indicating it's a from() tween) in which case it's 1.
            return true;
          },

          //called each time the values should be updated, and the ratio gets passed as the only parameter (typically it's a value between 0 and 1, but it can exceed those when using an ease like Elastic.easeOut or Back.easeOut, etc.)
          set: function (v) {
            var segments = this._segCount,
                func = this._func,
                target = this._target,
                notStart = (v !== this._startRatio),
                curIndex, inv, i, p, b, t, val, l, lengths, curSeg;
            if (!this._timeRes) {
              curIndex = (v < 0) ? 0 : (v >= 1) ? segments - 1 : (segments * v) >> 0;
              t = (v - (curIndex * (1 / segments))) * segments;
            } else {
              lengths = this._lengths;
              curSeg = this._curSeg;
              v *= this._length;
              i = this._li;
              //find the appropriate segment (if the currently cached one isn't correct)
              if (v > this._l2 && i < segments - 1) {
                l = segments - 1;
                while (i < l && (this._l2 = lengths[++i]) <= v) {
                }
                this._l1 = lengths[i - 1];
                this._li = i;
                this._curSeg = curSeg = this._segments[i];
                this._s2 = curSeg[(this._s1 = this._si = 0)];
              } else if (v < this._l1 && i > 0) {
                while (i > 0 && (this._l1 = lengths[--i]) >= v) {
                }
                if (i === 0 && v < this._l1) {
                  this._l1 = 0;
                } else {
                  i++;
                }
                this._l2 = lengths[i];
                this._li = i;
                this._curSeg = curSeg = this._segments[i];
                this._s1 = curSeg[(this._si = curSeg.length - 1) - 1] || 0;
                this._s2 = curSeg[this._si];
              }
              curIndex = i;
              //now find the appropriate sub-segment (we split it into the number of pieces that was defined by "precision" and measured each one)
              v -= this._l1;
              i = this._si;
              if (v > this._s2 && i < curSeg.length - 1) {
                l = curSeg.length - 1;
                while (i < l && (this._s2 = curSeg[++i]) <= v) {
                }
                this._s1 = curSeg[i - 1];
                this._si = i;
              } else if (v < this._s1 && i > 0) {
                while (i > 0 && (this._s1 = curSeg[--i]) >= v) {
                }
                if (i === 0 && v < this._s1) {
                  this._s1 = 0;
                } else {
                  i++;
                }
                this._s2 = curSeg[i];
                this._si = i;
              }
              t = ((i + (v - this._s1) / (this._s2 - this._s1)) * this._prec) || 0;
            }
            inv = 1 - t;

            i = this._props.length;
            while (--i > -1) {
              p = this._props[i];
              b = this._beziers[p][curIndex];
              val = (t * t * b.da + 3 * inv * (t * b.ca + inv * b.ba)) * t + b.a;
              if (this._mod[p]) {
                val = this._mod[p](val, target);
              }
              if (func[p]) {
                target[p](val);
              } else {
                target[p] = val;
              }
            }

            if (this._autoRotate) {
              var ar = this._autoRotate,
                  b2, x1, y1, x2, y2, add, conv;
              i = ar.length;
              while (--i > -1) {
                p = ar[i][2];
                add = ar[i][3] || 0;
                conv = (ar[i][4] === true) ? 1 : _RAD2DEG;
                b = this._beziers[ar[i][0]];
                b2 = this._beziers[ar[i][1]];

                if (b && b2) { //in case one of the properties got overwritten.
                  b = b[curIndex];
                  b2 = b2[curIndex];

                  x1 = b.a + (b.b - b.a) * t;
                  x2 = b.b + (b.c - b.b) * t;
                  x1 += (x2 - x1) * t;
                  x2 += ((b.c + (b.d - b.c) * t) - x2) * t;

                  y1 = b2.a + (b2.b - b2.a) * t;
                  y2 = b2.b + (b2.c - b2.b) * t;
                  y1 += (y2 - y1) * t;
                  y2 += ((b2.c + (b2.d - b2.c) * t) - y2) * t;

                  val = notStart ? Math.atan2(y2 - y1, x2 - x1) * conv + add : this._initialRotations[i];

                  if (this._mod[p]) {
                    val = this._mod[p](val, target); //for modProps
                  }

                  if (func[p]) {
                    target[p](val);
                  } else {
                    target[p] = val;
                  }
                }
              }
            }
          }
        }),
        p = BezierPlugin.prototype;

    BezierPlugin.bezierThrough = bezierThrough;
    BezierPlugin.cubicToQuadratic = cubicToQuadratic;
    BezierPlugin._autoCSS = true; //indicates that this plugin can be inserted into the "css" object using the autoCSS feature of TweenLite
    BezierPlugin.quadraticToCubic = function (a, b, c) {
      return new Segment(a, (2 * b + a) / 3, (2 * b + c) / 3, c);
    };

    BezierPlugin._cssRegister = function () {
      var CSSPlugin = _globals.CSSPlugin;
      if (!CSSPlugin) {
        return;
      }
      var _internals = CSSPlugin._internals,
          _parseToProxy = _internals._parseToProxy,
          _setPluginRatio = _internals._setPluginRatio,
          CSSPropTween = _internals.CSSPropTween;
      _internals._registerComplexSpecialProp("bezier", {
        parser: function (t, e, prop, cssp, pt, plugin) {
          if (e instanceof Array) {
            e = {values: e};
          }
          plugin = new BezierPlugin();
          var values = e.values,
              l = values.length - 1,
              pluginValues = [],
              v = {},
              i, p, data;
          if (l < 0) {
            return pt;
          }
          for (i = 0; i <= l; i++) {
            data = _parseToProxy(t, values[i], cssp, pt, plugin, (l !== i));
            pluginValues[i] = data.end;
          }
          for (p in e) {
            v[p] = e[p]; //duplicate the vars object because we need to alter some things which would cause problems if the user plans to reuse the same vars object for another tween.
          }
          v.values = pluginValues;
          pt = new CSSPropTween(t, "bezier", 0, 0, data.pt, 2);
          pt.data = data;
          pt.plugin = plugin;
          pt.setRatio = _setPluginRatio;
          if (v.autoRotate === 0) {
            v.autoRotate = true;
          }
          if (v.autoRotate && !(v.autoRotate instanceof Array)) {
            i = (v.autoRotate === true) ? 0 : Number(v.autoRotate);
            v.autoRotate = (data.end.left != null) ? [["left", "top", "rotation", i, false]] : (data.end.x != null) ? [["x", "y",
              "rotation", i, false]] : false;
          }
          if (v.autoRotate) {
            if (!cssp._transform) {
              cssp._enableTransforms(false);
            }
            data.autoRotate = cssp._target._gsTransform;
            data.proxy.rotation = data.autoRotate.rotation || 0;
            cssp._overwriteProps.push("rotation");
          }
          plugin._onInitTween(data.proxy, v, cssp._tween);
          return pt;
        }
      });
    };

    p._mod = function (lookup) {
      var op = this._overwriteProps,
          i = op.length,
          val;
      while (--i > -1) {
        val = lookup[op[i]];
        if (val && typeof(val) === "function") {
          this._mod[op[i]] = val;
        }
      }
    };

    p._kill = function (lookup) {
      var a = this._props,
          p, i;
      for (p in this._beziers) {
        if (p in lookup) {
          delete this._beziers[p];
          delete this._func[p];
          i = a.length;
          while (--i > -1) {
            if (a[i] === p) {
              a.splice(i, 1);
            }
          }
        }
      }
      a = this._autoRotate;
      if (a) {
        i = a.length;
        while (--i > -1) {
          if (lookup[a[i][2]]) {
            a.splice(i, 1);
          }
        }
      }
      return this._super._kill.call(this, lookup);
    };

  }());

  /*
 * ----------------------------------------------------------------
 * CSSPlugin
 * ----------------------------------------------------------------
 */
  _gsScope._gsDefine("plugins.CSSPlugin", ["plugins.TweenPlugin", "TweenLite"], function (TweenPlugin, TweenLite) {

    /** @constructor **/
    var CSSPlugin = function () {
          TweenPlugin.call(this, "css");
          this._overwriteProps.length = 0;
          this.setRatio = CSSPlugin.prototype.setRatio; //speed optimization (avoid prototype lookup on this "hot" method)
        },
        _globals = _gsScope._gsDefine.globals,
        _hasPriority, //turns true whenever a CSSPropTween instance is created that has a priority other than 0. This helps us discern whether or not we should spend the time organizing the linked list or not after a CSSPlugin's _onInitTween() method is called.
        _suffixMap, //we set this in _onInitTween() each time as a way to have a persistent variable we can use in other methods like _parse() without having to pass it around as a parameter and we keep _parse() decoupled from a particular CSSPlugin instance
        _cs, //computed style (we store this in a shared variable to conserve memory and make minification tighter
        _overwriteProps, //alias to the currently instantiating CSSPlugin's _overwriteProps array. We use this closure in order to avoid having to pass a reference around from method to method and aid in minification.
        _specialProps = {},
        p = CSSPlugin.prototype = new TweenPlugin("css");

    p.constructor = CSSPlugin;
    CSSPlugin.version = "1.20.3";
    CSSPlugin.API = 2;
    CSSPlugin.defaultTransformPerspective = 0;
    CSSPlugin.defaultSkewType = "compensated";
    CSSPlugin.defaultSmoothOrigin = true;
    p = "px"; //we'll reuse the "p" variable to keep file size down
    CSSPlugin.suffixMap = {
      top: p,
      right: p,
      bottom: p,
      left: p,
      width: p,
      height: p,
      fontSize: p,
      padding: p,
      margin: p,
      perspective: p,
      lineHeight: ""
    };

    var _numExp = /(?:\-|\.|\b)(\d|\.|e\-)+/g,
        _relNumExp = /(?:\d|\-\d|\.\d|\-\.\d|\+=\d|\-=\d|\+=.\d|\-=\.\d)+/g,
        _valuesExp = /(?:\+=|\-=|\-|\b)[\d\-\.]+[a-zA-Z0-9]*(?:%|\b)/gi, //finds all the values that begin with numbers or += or -= and then a number. Includes suffixes. We use this to split complex values apart like "1px 5px 20px rgb(255,102,51)"
        _NaNExp = /(?![+-]?\d*\.?\d+|[+-]|e[+-]\d+)[^0-9]/g, //also allows scientific notation and doesn't kill the leading -/+ in -= and +=
        _suffixExp = /(?:\d|\-|\+|=|#|\.)*/g,
        _opacityExp = /opacity *= *([^)]*)/i,
        _opacityValExp = /opacity:([^;]*)/i,
        _alphaFilterExp = /alpha\(opacity *=.+?\)/i,
        _rgbhslExp = /^(rgb|hsl)/,
        _capsExp = /([A-Z])/g,
        _camelExp = /-([a-z])/gi,
        _urlExp = /(^(?:url\(\"|url\())|(?:(\"\))$|\)$)/gi, //for pulling out urls from url(...) or url("...") strings (some browsers wrap urls in quotes, some don't when reporting things like backgroundImage)
        _camelFunc = function (s, g) {
          return g.toUpperCase();
        },
        _horizExp = /(?:Left|Right|Width)/i,
        _ieGetMatrixExp = /(M11|M12|M21|M22)=[\d\-\.e]+/gi,
        _ieSetMatrixExp = /progid\:DXImageTransform\.Microsoft\.Matrix\(.+?\)/i,
        _commasOutsideParenExp = /,(?=[^\)]*(?:\(|$))/gi, //finds any commas that are not within parenthesis
        _complexExp = /[\s,\(]/i, //for testing a string to find if it has a space, comma, or open parenthesis (clues that it's a complex value)
        _DEG2RAD = Math.PI / 180,
        _RAD2DEG = 180 / Math.PI,
        _forcePT = {},
        _dummyElement = {style: {}},
        _doc = _gsScope.document || {
          createElement: function () {
            return _dummyElement;
          }
        },
        _createElement = function (type, ns) {
          return _doc.createElementNS ? _doc.createElementNS(ns || "http://www.w3.org/1999/xhtml", type) : _doc.createElement(type);
        },
        _tempDiv = _createElement("div"),
        _tempImg = _createElement("img"),
        _internals = CSSPlugin._internals = {_specialProps: _specialProps}, //provides a hook to a few internal methods that we need to access from inside other plugins
        _agent = (_gsScope.navigator || {}).userAgent || "",
        _autoRound,
        _reqSafariFix, //we won't apply the Safari transform fix until we actually come across a tween that affects a transform property (to maintain best performance).

        _isSafari,
        _isFirefox, //Firefox has a bug that causes 3D transformed elements to randomly disappear unless a repaint is forced after each update on each element.
        _isSafariLT6, //Safari (and Android 4 which uses a flavor of Safari) has a bug that prevents changes to "top" and "left" properties from rendering properly if changed on the same frame as a transform UNLESS we set the element's WebkitBackfaceVisibility to hidden (weird, I know). Doing this for Android 3 and earlier seems to actually cause other problems, though (fun!)
        _ieVers,
        _supportsOpacity = (function () { //we set _isSafari, _ieVers, _isFirefox, and _supportsOpacity all in one function here to reduce file size slightly, especially in the minified version.
          var i = _agent.indexOf("Android"),
              a = _createElement("a");
          _isSafari = (_agent.indexOf("Safari") !== -1 && _agent.indexOf("Chrome") === -1 && (i === -1 || parseFloat(
              _agent.substr(i + 8, 2)) > 3));
          _isSafariLT6 = (_isSafari && (parseFloat(_agent.substr(_agent.indexOf("Version/") + 8, 2)) < 6));
          _isFirefox = (_agent.indexOf("Firefox") !== -1);
          if ((/MSIE ([0-9]{1,}[\.0-9]{0,})/).exec(_agent) || (/Trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/).exec(_agent)) {
            _ieVers = parseFloat(RegExp.$1);
          }
          if (!a) {
            return false;
          }
          a.style.cssText = "top:1px;opacity:.55;";
          return /^0.55/.test(a.style.opacity);
        }()),
        _getIEOpacity = function (v) {
          return (_opacityExp.test(((typeof(v) === "string") ? v : (v.currentStyle ? v.currentStyle.filter : v.style.filter) || ""))
              ? (parseFloat(RegExp.$1) / 100) : 1);
        },
        _log = function (s) {//for logging messages, but in a way that won't throw errors in old versions of IE.
          if (_gsScope.console) {
            console.log(s);
          }
        },
        _target, //when initting a CSSPlugin, we set this variable so that we can access it from within many other functions without having to pass it around as params
        _index, //when initting a CSSPlugin, we set this variable so that we can access it from within many other functions without having to pass it around as params

        _prefixCSS = "", //the non-camelCase vendor prefix like "-o-", "-moz-", "-ms-", or "-webkit-"
        _prefix = "", //camelCase vendor prefix like "O", "ms", "Webkit", or "Moz".

        // @private feed in a camelCase property name like "transform" and it will check to see if it is valid as-is or if it needs a vendor prefix. It returns the corrected camelCase property name (i.e. "WebkitTransform" or "MozTransform" or "transform" or null if no such property is found, like if the browser is IE8 or before, "transform" won't be found at all)
        _checkPropPrefix = function (p, e) {
          e = e || _tempDiv;
          var s = e.style,
              a, i;
          if (s[p] !== undefined) {
            return p;
          }
          p = p.charAt(0).toUpperCase() + p.substr(1);
          a = ["O", "Moz", "ms", "Ms", "Webkit"];
          i = 5;
          while (--i > -1 && s[a[i] + p] === undefined) {
          }
          if (i >= 0) {
            _prefix = (i === 3) ? "ms" : a[i];
            _prefixCSS = "-" + _prefix.toLowerCase() + "-";
            return _prefix + p;
          }
          return null;
        },

        _getComputedStyle = _doc.defaultView ? _doc.defaultView.getComputedStyle : function () {
        },

        /**
         * @private Returns the css style for a particular property of an element. For example, to get whatever the current "left" css value for an element with an ID of "myElement", you could do:
         * var currentLeft = CSSPlugin.getStyle( document.getElementById("myElement"), "left");
         *
         * @param {!Object} t Target element whose style property you want to query
         * @param {!string} p Property name (like "left" or "top" or "marginTop", etc.)
         * @param {Object=} cs Computed style object. This just provides a way to speed processing if you're going to get several properties on the same element in quick succession - you can reuse the result of the getComputedStyle() call.
         * @param {boolean=} calc If true, the value will not be read directly from the element's "style" property (if it exists there), but instead the getComputedStyle() result will be used. This can be useful when you want to ensure that the browser itself is interpreting the value.
         * @param {string=} dflt Default value that should be returned in the place of null, "none", "auto" or "auto auto".
         * @return {?string} The current property value
         */
        _getStyle = CSSPlugin.getStyle = function (t, p, cs, calc, dflt) {
          var rv;
          if (!_supportsOpacity) {
            if (p === "opacity") { //several versions of IE don't use the standard "opacity" property - they use things like filter:alpha(opacity=50), so we parse that here.
              return _getIEOpacity(t);
            }
          }
          if (!calc && t.style[p]) {
            rv = t.style[p];
          } else if ((cs = cs || _getComputedStyle(t))) {
            rv = cs[p] || cs.getPropertyValue(p) || cs.getPropertyValue(p.replace(_capsExp, "-$1").toLowerCase());
          } else if (t.currentStyle) {
            rv = t.currentStyle[p];
          }
          return (dflt != null && (!rv || rv === "none" || rv === "auto" || rv === "auto auto")) ? dflt : rv;
        },

        /**
         * @private Pass the target element, the property name, the numeric value, and the suffix (like "%", "em", "px", etc.) and it will spit back the equivalent pixel number.
         * @param {!Object} t Target element
         * @param {!string} p Property name (like "left", "top", "marginLeft", etc.)
         * @param {!number} v Value
         * @param {string=} sfx Suffix (like "px" or "%" or "em")
         * @param {boolean=} recurse If true, the call is a recursive one. In some browsers (like IE7/8), occasionally the value isn't accurately reported initially, but if we run the function again it will take effect.
         * @return {number} value in pixels
         */
        _convertToPixels = _internals.convertToPixels = function (t, p, v, sfx, recurse) {
          if (sfx === "px" || (!sfx && p !== "lineHeight")) {
            return v;
          }
          if (sfx === "auto" || !v) {
            return 0;
          }
          var horiz = _horizExp.test(p),
              node = t,
              style = _tempDiv.style,
              neg = (v < 0),
              precise = (v === 1),
              pix, cache, time;
          if (neg) {
            v = -v;
          }
          if (precise) {
            v *= 100;
          }
          if (p === "lineHeight" && !sfx) { //special case of when a simple lineHeight (without a unit) is used. Set it to the value, read back the computed value, and then revert.
            cache = _getComputedStyle(t).lineHeight;
            t.style.lineHeight = v;
            pix = parseFloat(_getComputedStyle(t).lineHeight);
            t.style.lineHeight = cache;
          } else if (sfx === "%" && p.indexOf("border") !== -1) {
            pix = (v / 100) * (horiz ? t.clientWidth : t.clientHeight);
          } else {
            style.cssText = "border:0 solid red;position:" + _getStyle(t, "position") + ";line-height:0;";
            if (sfx === "%" || !node.appendChild || sfx.charAt(0) === "v" || sfx === "rem") {
              node = t.parentNode || _doc.body;
              if (_getStyle(node, "display").indexOf("flex") !== -1) { //Edge and IE11 have a bug that causes offsetWidth to report as 0 if the container has display:flex and the child is position:relative. Switching to position: absolute solves it.
                style.position = "absolute";
              }
              cache = node._gsCache;
              time = TweenLite.ticker.frame;
              if (cache && horiz && cache.time === time) { //performance optimization: we record the width of elements along with the ticker frame so that we can quickly get it again on the same tick (seems relatively safe to assume it wouldn't change on the same tick)
                return cache.width * v / 100;
              }
              style[(horiz ? "width" : "height")] = v + sfx;
            } else {
              style[(horiz ? "borderLeftWidth" : "borderTopWidth")] = v + sfx;
            }
            node.appendChild(_tempDiv);
            pix = parseFloat(_tempDiv[(horiz ? "offsetWidth" : "offsetHeight")]);
            node.removeChild(_tempDiv);
            if (horiz && sfx === "%" && CSSPlugin.cacheWidths !== false) {
              cache = node._gsCache = node._gsCache || {};
              cache.time = time;
              cache.width = pix / v * 100;
            }
            if (pix === 0 && !recurse) {
              pix = _convertToPixels(t, p, v, sfx, true);
            }
          }
          if (precise) {
            pix /= 100;
          }
          return neg ? -pix : pix;
        },
        _calculateOffset = _internals.calculateOffset = function (t, p, cs) { //for figuring out "top" or "left" in px when it's "auto". We need to factor in margin with the offsetLeft/offsetTop
          if (_getStyle(t, "position", cs) !== "absolute") {
            return 0;
          }
          var dim = ((p === "left") ? "Left" : "Top"),
              v = _getStyle(t, "margin" + dim, cs);
          return t["offset" + dim] - (_convertToPixels(t, p, parseFloat(v), v.replace(_suffixExp, "")) || 0);
        },

        // @private returns at object containing ALL of the style properties in camelCase and their associated values.
        _getAllStyles = function (t, cs) {
          var s = {},
              i, tr, p;
          if ((cs = cs || _getComputedStyle(t, null))) {
            if ((i = cs.length)) {
              while (--i > -1) {
                p = cs[i];
                if (p.indexOf("-transform") === -1 || _transformPropCSS === p) { //Some webkit browsers duplicate transform values, one non-prefixed and one prefixed ("transform" and "WebkitTransform"), so we must weed out the extra one here.
                  s[p.replace(_camelExp, _camelFunc)] = cs.getPropertyValue(p);
                }
              }
            } else { //some browsers behave differently - cs.length is always 0, so we must do a for...in loop.
              for (i in cs) {
                if (i.indexOf("Transform") === -1 || _transformProp === i) { //Some webkit browsers duplicate transform values, one non-prefixed and one prefixed ("transform" and "WebkitTransform"), so we must weed out the extra one here.
                  s[i] = cs[i];
                }
              }
            }
          } else if ((cs = t.currentStyle || t.style)) {
            for (i in cs) {
              if (typeof(i) === "string" && s[i] === undefined) {
                s[i.replace(_camelExp, _camelFunc)] = cs[i];
              }
            }
          }
          if (!_supportsOpacity) {
            s.opacity = _getIEOpacity(t);
          }
          tr = _getTransform(t, cs, false);
          s.rotation = tr.rotation;
          s.skewX = tr.skewX;
          s.scaleX = tr.scaleX;
          s.scaleY = tr.scaleY;
          s.x = tr.x;
          s.y = tr.y;
          if (_supports3D) {
            s.z = tr.z;
            s.rotationX = tr.rotationX;
            s.rotationY = tr.rotationY;
            s.scaleZ = tr.scaleZ;
          }
          if (s.filters) {
            delete s.filters;
          }
          return s;
        },

        // @private analyzes two style objects (as returned by _getAllStyles()) and only looks for differences between them that contain tweenable values (like a number or color). It returns an object with a "difs" property which refers to an object containing only those isolated properties and values for tweening, and a "firstMPT" property which refers to the first MiniPropTween instance in a linked list that recorded all the starting values of the different properties so that we can revert to them at the end or beginning of the tween - we don't want the cascading to get messed up. The forceLookup parameter is an optional generic object with properties that should be forced into the results - this is necessary for className tweens that are overwriting others because imagine a scenario where a rollover/rollout adds/removes a class and the user swipes the mouse over the target SUPER fast, thus nothing actually changed yet and the subsequent comparison of the properties would indicate they match (especially when px rounding is taken into consideration), thus no tweening is necessary even though it SHOULD tween and remove those properties after the tween (otherwise the inline styles will contaminate things). See the className SpecialProp code for details.
        _cssDif = function (t, s1, s2, vars, forceLookup) {
          var difs = {},
              style = t.style,
              val, p, mpt;
          for (p in s2) {
            if (p !== "cssText") {
              if (p !== "length") {
                if (isNaN(p)) {
                  if (s1[p] !== (val = s2[p]) || (forceLookup
                          && forceLookup[p])) {
                    if (p.indexOf("Origin") === -1) {
                      if (typeof(val) === "number" || typeof(val) === "string") {
                        difs[p] = (val === "auto" && (p === "left" || p === "top")) ? _calculateOffset(t, p) : ((val === "" || val
                            === "auto"
                            || val === "none") && typeof(s1[p]) === "string" && s1[p].replace(_NaNExp, "") !== "") ? 0 : val; //if the ending value is defaulting ("" or "auto"), we check the starting value and if it can be parsed into a number (a string which could have a suffix too, like 700px), then we swap in 0 for "" or "auto" so that things actually tween.
                        if (style[p] !== undefined) { //for className tweens, we must remember which properties already existed inline - the ones that didn't should be removed when the tween isn't in progress because they were only introduced to facilitate the transition between classes.
                          mpt = new MiniPropTween(style, p, style[p], mpt);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          if (vars) {
            for (p in vars) { //copy properties (except className)
              if (p !== "className") {
                difs[p] = vars[p];
              }
            }
          }
          return {difs: difs, firstMPT: mpt};
        },
        _dimensions = {width: ["Left", "Right"], height: ["Top", "Bottom"]},
        _margins = ["marginLeft", "marginRight", "marginTop", "marginBottom"],

        /**
         * @private Gets the width or height of an element
         * @param {!Object} t Target element
         * @param {!string} p Property name ("width" or "height")
         * @param {Object=} cs Computed style object (if one exists). Just a speed optimization.
         * @return {number} Dimension (in pixels)
         */
        _getDimension = function (t, p, cs) {
          if ((t.nodeName + "").toLowerCase() === "svg") { //Chrome no longer supports offsetWidth/offsetHeight on SVG elements.
            return (cs || _getComputedStyle(t))[p] || 0;
          } else if (t.getCTM && _isSVG(t)) {
            return t.getBBox()[p] || 0;
          }
          var v = parseFloat((p === "width") ? t.offsetWidth : t.offsetHeight),
              a = _dimensions[p],
              i = a.length;
          cs = cs || _getComputedStyle(t, null);
          while (--i > -1) {
            v -= parseFloat(_getStyle(t, "padding" + a[i], cs, true)) || 0;
            v -= parseFloat(_getStyle(t, "border" + a[i] + "Width", cs, true)) || 0;
          }
          return v;
        },

        // @private Parses position-related complex strings like "top left" or "50px 10px" or "70% 20%", etc. which are used for things like transformOrigin or backgroundPosition. Optionally decorates a supplied object (recObj) with the following properties: "ox" (offsetX), "oy" (offsetY), "oxp" (if true, "ox" is a percentage not a pixel value), and "oxy" (if true, "oy" is a percentage not a pixel value)
        _parsePosition = function (v, recObj) {
          if (v === "contain" || v === "auto" || v === "auto auto") { //note: Firefox uses "auto auto" as default whereas Chrome uses "auto".
            return v + " ";
          }
          if (v == null || v === "") {
            v = "0 0";
          }
          var a = v.split(" "),
              x = (v.indexOf("left") !== -1) ? "0%" : (v.indexOf("right") !== -1) ? "100%" : a[0],
              y = (v.indexOf("top") !== -1) ? "0%" : (v.indexOf("bottom") !== -1) ? "100%" : a[1],
              i;
          if (a.length > 3 && !recObj) { //multiple positions
            a = v.split(", ").join(",").split(",");
            v = [];
            for (i = 0; i < a.length; i++) {
              v.push(_parsePosition(a[i]));
            }
            return v.join(",");
          }
          if (y == null) {
            y = (x === "center") ? "50%" : "0";
          } else if (y === "center") {
            y = "50%";
          }
          if (x === "center" || (isNaN(parseFloat(x)) && (x + "").indexOf("=") === -1)) { //remember, the user could flip-flop the values and say "bottom center" or "center bottom", etc. "center" is ambiguous because it could be used to describe horizontal or vertical, hence the isNaN(). If there's an "=" sign in the value, it's relative.
            x = "50%";
          }
          v = x + " " + y + ((a.length > 2) ? " " + a[2] : "");
          if (recObj) {
            recObj.oxp = (x.indexOf("%") !== -1);
            recObj.oyp = (y.indexOf("%") !== -1);
            recObj.oxr = (x.charAt(1) === "=");
            recObj.oyr = (y.charAt(1) === "=");
            recObj.ox = parseFloat(x.replace(_NaNExp, ""));
            recObj.oy = parseFloat(y.replace(_NaNExp, ""));
            recObj.v = v;
          }
          return recObj || v;
        },

        /**
         * @private Takes an ending value (typically a string, but can be a number) and a starting value and returns the change between the two, looking for relative value indicators like += and -= and it also ignores suffixes (but make sure the ending value starts with a number or +=/-= and that the starting value is a NUMBER!)
         * @param {(number|string)} e End value which is typically a string, but could be a number
         * @param {(number|string)} b Beginning value which is typically a string but could be a number
         * @return {number} Amount of change between the beginning and ending values (relative values that have a "+=" or "-=" are recognized)
         */
        _parseChange = function (e, b) {
          if (typeof(e) === "function") {
            e = e(_index, _target);
          }
          return (typeof(e) === "string" && e.charAt(1) === "=") ? parseInt(e.charAt(0) + "1", 10) * parseFloat(e.substr(2))
              : (parseFloat(e) - parseFloat(b)) || 0;
        },

        /**
         * @private Takes a value and a default number, checks if the value is relative, null, or numeric and spits back a normalized number accordingly. Primarily used in the _parseTransform() function.
         * @param {Object} v Value to be parsed
         * @param {!number} d Default value (which is also used for relative calculations if "+=" or "-=" is found in the first parameter)
         * @return {number} Parsed value
         */
        _parseVal = function (v, d) {
          if (typeof(v) === "function") {
            v = v(_index, _target);
          }
          return (v == null) ? d : (typeof(v) === "string" && v.charAt(1) === "=") ? parseInt(v.charAt(0) + "1", 10) * parseFloat(
              v.substr(2)) + d : parseFloat(v) || 0;
        },

        /**
         * @private Translates strings like "40deg" or "40" or 40rad" or "+=40deg" or "270_short" or "-90_cw" or "+=45_ccw" to a numeric radian angle. Of course a starting/default value must be fed in too so that relative values can be calculated properly.
         * @param {Object} v Value to be parsed
         * @param {!number} d Default value (which is also used for relative calculations if "+=" or "-=" is found in the first parameter)
         * @param {string=} p property name for directionalEnd (optional - only used when the parsed value is directional ("_short", "_cw", or "_ccw" suffix). We need a way to store the uncompensated value so that at the end of the tween, we set it to exactly what was requested with no directional compensation). Property name would be "rotation", "rotationX", or "rotationY"
         * @param {Object=} directionalEnd An object that will store the raw end values for directional angles ("_short", "_cw", or "_ccw" suffix). We need a way to store the uncompensated value so that at the end of the tween, we set it to exactly what was requested with no directional compensation.
         * @return {number} parsed angle in radians
         */
        _parseAngle = function (v, d, p, directionalEnd) {
          var min = 0.000001,
              cap, split, dif, result, isRelative;
          if (typeof(v) === "function") {
            v = v(_index, _target);
          }
          if (v == null) {
            result = d;
          } else if (typeof(v) === "number") {
            result = v;
          } else {
            cap = 360;
            split = v.split("_");
            isRelative = (v.charAt(1) === "=");
            dif = (isRelative ? parseInt(v.charAt(0) + "1", 10) * parseFloat(split[0].substr(2)) : parseFloat(split[0])) * ((v.indexOf(
                "rad") === -1) ? 1 : _RAD2DEG) - (isRelative ? 0 : d);
            if (split.length) {
              if (directionalEnd) {
                directionalEnd[p] = d + dif;
              }
              if (v.indexOf("short") !== -1) {
                dif = dif % cap;
                if (dif !== dif % (cap / 2)) {
                  dif = (dif < 0) ? dif + cap : dif - cap;
                }
              }
              if (v.indexOf("_cw") !== -1 && dif < 0) {
                dif = ((dif + cap * 9999999999) % cap) - ((dif / cap) | 0) * cap;
              } else if (v.indexOf("ccw") !== -1 && dif > 0) {
                dif = ((dif - cap * 9999999999) % cap) - ((dif / cap) | 0) * cap;
              }
            }
            result = d + dif;
          }
          if (result < min && result > -min) {
            result = 0;
          }
          return result;
        },

        _colorLookup = {
          aqua: [0, 255, 255],
          lime: [0, 255, 0],
          silver: [192, 192, 192],
          black: [0, 0, 0],
          maroon: [128, 0, 0],
          teal: [0, 128, 128],
          blue: [0, 0, 255],
          navy: [0, 0, 128],
          white: [255, 255, 255],
          fuchsia: [255, 0, 255],
          olive: [128, 128, 0],
          yellow: [255, 255, 0],
          orange: [255, 165, 0],
          gray: [128, 128, 128],
          purple: [128, 0, 128],
          green: [0, 128, 0],
          red: [255, 0, 0],
          pink: [255, 192, 203],
          cyan: [0, 255, 255],
          transparent: [255, 255, 255, 0]
        },

        _hue = function (h, m1, m2) {
          h = (h < 0) ? h + 1 : (h > 1) ? h - 1 : h;
          return ((((h * 6 < 1) ? m1 + (m2 - m1) * h * 6 : (h < 0.5) ? m2 : (h * 3 < 2) ? m1 + (m2 - m1) * (2 / 3 - h) * 6 : m1) * 255)
              + 0.5) | 0;
        },

        /**
         * @private Parses a color (like #9F0, #FF9900, rgb(255,51,153) or hsl(108, 50%, 10%)) into an array with 3 elements for red, green, and blue or if toHSL parameter is true, it will populate the array with hue, saturation, and lightness values. If a relative value is found in an hsl() or hsla() string, it will preserve those relative prefixes and all the values in the array will be strings instead of numbers (in all other cases it will be populated with numbers).
         * @param {(string|number)} v The value the should be parsed which could be a string like #9F0 or rgb(255,102,51) or rgba(255,0,0,0.5) or it could be a number like 0xFF00CC or even a named color like red, blue, purple, etc.
         * @param {(boolean)} toHSL If true, an hsl() or hsla() value will be returned instead of rgb() or rgba()
         * @return {Array.<number>} An array containing red, green, and blue (and optionally alpha) in that order, or if the toHSL parameter was true, the array will contain hue, saturation and lightness (and optionally alpha) in that order. Always numbers unless there's a relative prefix found in an hsl() or hsla() string and toHSL is true.
         */
        _parseColor = CSSPlugin.parseColor = function (v, toHSL) {
          var a, r, g, b, h, s, l, max, min, d, wasHSL;
          if (!v) {
            a = _colorLookup.black;
          } else if (typeof(v) === "number") {
            a = [v >> 16, (v >> 8) & 255, v & 255];
          } else {
            if (v.charAt(v.length - 1) === ",") { //sometimes a trailing comma is included and we should chop it off (typically from a comma-delimited list of values like a textShadow:"2px 2px 2px blue, 5px 5px 5px rgb(255,0,0)" - in this example "blue," has a trailing comma. We could strip it out inside parseComplex() but we'd need to do it to the beginning and ending values plus it wouldn't provide protection from other potential scenarios like if the user passes in a similar value.
              v = v.substr(0, v.length - 1);
            }
            if (_colorLookup[v]) {
              a = _colorLookup[v];
            } else if (v.charAt(0) === "#") {
              if (v.length === 4) { //for shorthand like #9F0
                r = v.charAt(1);
                g = v.charAt(2);
                b = v.charAt(3);
                v = "#" + r + r + g + g + b + b;
              }
              v = parseInt(v.substr(1), 16);
              a = [v >> 16, (v >> 8) & 255, v & 255];
            } else if (v.substr(0, 3) === "hsl") {
              a = wasHSL = v.match(_numExp);
              if (!toHSL) {
                h = (Number(a[0]) % 360) / 360;
                s = Number(a[1]) / 100;
                l = Number(a[2]) / 100;
                g = (l <= 0.5) ? l * (s + 1) : l + s - l * s;
                r = l * 2 - g;
                if (a.length > 3) {
                  a[3] = Number(a[3]);
                }
                a[0] = _hue(h + 1 / 3, r, g);
                a[1] = _hue(h, r, g);
                a[2] = _hue(h - 1 / 3, r, g);
              } else if (v.indexOf("=") !== -1) { //if relative values are found, just return the raw strings with the relative prefixes in place.
                return v.match(_relNumExp);
              }
            } else {
              a = v.match(_numExp) || _colorLookup.transparent;
            }
            a[0] = Number(a[0]);
            a[1] = Number(a[1]);
            a[2] = Number(a[2]);
            if (a.length > 3) {
              a[3] = Number(a[3]);
            }
          }
          if (toHSL && !wasHSL) {
            r = a[0] / 255;
            g = a[1] / 255;
            b = a[2] / 255;
            max = Math.max(r, g, b);
            min = Math.min(r, g, b);
            l = (max + min) / 2;
            if (max === min) {
              h = s = 0;
            } else {
              d = max - min;
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
              h = (max === r) ? (g - b) / d + (g < b ? 6 : 0) : (max === g) ? (b - r) / d + 2 : (r - g) / d + 4;
              h *= 60;
            }
            a[0] = (h + 0.5) | 0;
            a[1] = (s * 100 + 0.5) | 0;
            a[2] = (l * 100 + 0.5) | 0;
          }
          return a;
        },
        _formatColors = function (s, toHSL) {
          var colors = s.match(_colorExp) || [],
              charIndex = 0,
              parsed = "",
              i, color, temp;
          if (!colors.length) {
            return s;
          }
          for (i = 0; i < colors.length; i++) {
            color = colors[i];
            temp = s.substr(charIndex, s.indexOf(color, charIndex) - charIndex);
            charIndex += temp.length + color.length;
            color = _parseColor(color, toHSL);
            if (color.length === 3) {
              color.push(1);
            }
            parsed += temp + (toHSL ? "hsla(" + color[0] + "," + color[1] + "%," + color[2] + "%," + color[3] : "rgba(" + color.join(
                ",")) + ")";
          }
          return parsed + s.substr(charIndex);
        },
        _colorExp = "(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#(?:[0-9a-f]{3}){1,2}\\b"; //we'll dynamically build this Regular Expression to conserve file size. After building it, it will be able to find rgb(), rgba(), # (hexadecimal), and named color values like red, blue, purple, etc.

    for (p in _colorLookup) {
      _colorExp += "|" + p + "\\b";
    }
    _colorExp = new RegExp(_colorExp + ")", "gi");

    CSSPlugin.colorStringFilter = function (a) {
      var combined = a[0] + " " + a[1],
          toHSL;
      if (_colorExp.test(combined)) {
        toHSL = (combined.indexOf("hsl(") !== -1 || combined.indexOf("hsla(") !== -1);
        a[0] = _formatColors(a[0], toHSL);
        a[1] = _formatColors(a[1], toHSL);
      }
      _colorExp.lastIndex = 0;
    };

    if (!TweenLite.defaultStringFilter) {
      TweenLite.defaultStringFilter = CSSPlugin.colorStringFilter;
    }

    /**
     * @private Returns a formatter function that handles taking a string (or number in some cases) and returning a consistently formatted one in terms of delimiters, quantity of values, etc. For example, we may get boxShadow values defined as "0px red" or "0px 0px 10px rgb(255,0,0)" or "0px 0px 20px 20px #F00" and we need to ensure that what we get back is described with 4 numbers and a color. This allows us to feed it into the _parseComplex() method and split the values up appropriately. The neat thing about this _getFormatter() function is that the dflt defines a pattern as well as a default, so for example, _getFormatter("0px 0px 0px 0px #777", true) not only sets the default as 0px for all distances and #777 for the color, but also sets the pattern such that 4 numbers and a color will always get returned.
     * @param {!string} dflt The default value and pattern to follow. So "0px 0px 0px 0px #777" will ensure that 4 numbers and a color will always get returned.
     * @param {boolean=} clr If true, the values should be searched for color-related data. For example, boxShadow values typically contain a color whereas borderRadius don't.
     * @param {boolean=} collapsible If true, the value is a top/left/right/bottom style one that acts like margin or padding, where if only one value is received, it's used for all 4; if 2 are received, the first is duplicated for 3rd (bottom) and the 2nd is duplicated for the 4th spot (left), etc.
     * @return {Function} formatter function
     */
    var _getFormatter = function (dflt, clr, collapsible, multi) {
          if (dflt == null) {
            return function (v) {
              return v;
            };
          }
          var dColor = clr ? (dflt.match(_colorExp) || [""])[0] : "",
              dVals = dflt.split(dColor).join("").match(_valuesExp) || [],
              pfx = dflt.substr(0, dflt.indexOf(dVals[0])),
              sfx = (dflt.charAt(dflt.length - 1) === ")") ? ")" : "",
              delim = (dflt.indexOf(" ") !== -1) ? " " : ",",
              numVals = dVals.length,
              dSfx = (numVals > 0) ? dVals[0].replace(_numExp, "") : "",
              formatter;
          if (!numVals) {
            return function (v) {
              return v;
            };
          }
          if (clr) {
            formatter = function (v) {
              var color, vals, i, a;
              if (typeof(v) === "number") {
                v += dSfx;
              } else if (multi && _commasOutsideParenExp.test(v)) {
                a = v.replace(_commasOutsideParenExp, "|").split("|");
                for (i = 0; i < a.length; i++) {
                  a[i] = formatter(a[i]);
                }
                return a.join(",");
              }
              color = (v.match(_colorExp) || [dColor])[0];
              vals = v.split(color).join("").match(_valuesExp) || [];
              i = vals.length;
              if (numVals > i--) {
                while (++i < numVals) {
                  vals[i] = collapsible ? vals[(((i - 1) / 2) | 0)] : dVals[i];
                }
              }
              return pfx + vals.join(delim) + delim + color + sfx + (v.indexOf("inset") !== -1 ? " inset" : "");
            };
            return formatter;

          }
          formatter = function (v) {
            var vals, a, i;
            if (typeof(v) === "number") {
              v += dSfx;
            } else if (multi && _commasOutsideParenExp.test(v)) {
              a = v.replace(_commasOutsideParenExp, "|").split("|");
              for (i = 0; i < a.length; i++) {
                a[i] = formatter(a[i]);
              }
              return a.join(",");
            }
            vals = v.match(_valuesExp) || [];
            i = vals.length;
            if (numVals > i--) {
              while (++i < numVals) {
                vals[i] = collapsible ? vals[(((i - 1) / 2) | 0)] : dVals[i];
              }
            }
            return pfx + vals.join(delim) + sfx;
          };
          return formatter;
        },

        /**
         * @private returns a formatter function that's used for edge-related values like marginTop, marginLeft, paddingBottom, paddingRight, etc. Just pass a comma-delimited list of property names related to the edges.
         * @param {!string} props a comma-delimited list of property names in order from top to left, like "marginTop,marginRight,marginBottom,marginLeft"
         * @return {Function} a formatter function
         */
        _getEdgeParser = function (props) {
          props = props.split(",");
          return function (t, e, p, cssp, pt, plugin, vars) {
            var a = (e + "").split(" "),
                i;
            vars = {};
            for (i = 0; i < 4; i++) {
              vars[props[i]] = a[i] = a[i] || a[(((i - 1) / 2) >> 0)];
            }
            return cssp.parse(t, vars, pt, plugin);
          };
        },

        // @private used when other plugins must tween values first, like BezierPlugin or ThrowPropsPlugin, etc. That plugin's setRatio() gets called first so that the values are updated, and then we loop through the MiniPropTweens which handle copying the values into their appropriate slots so that they can then be applied correctly in the main CSSPlugin setRatio() method. Remember, we typically create a proxy object that has a bunch of uniquely-named properties that we feed to the sub-plugin and it does its magic normally, and then we must interpret those values and apply them to the css because often numbers must get combined/concatenated, suffixes added, etc. to work with css, like boxShadow could have 4 values plus a color.
        _setPluginRatio = _internals._setPluginRatio = function (v) {
          this.plugin.setRatio(v);
          var d = this.data,
              proxy = d.proxy,
              mpt = d.firstMPT,
              min = 0.000001,
              val, pt, i, str, p;
          while (mpt) {
            val = proxy[mpt.v];
            if (mpt.r) {
              val = Math.round(val);
            } else if (val < min && val > -min) {
              val = 0;
            }
            mpt.t[mpt.p] = val;
            mpt = mpt._next;
          }
          if (d.autoRotate) {
            d.autoRotate.rotation = d.mod ? d.mod(proxy.rotation, this.t) : proxy.rotation; //special case for ModifyPlugin to hook into an auto-rotating bezier
          }
          //at the end, we must set the CSSPropTween's "e" (end) value dynamically here because that's what is used in the final setRatio() method. Same for "b" at the beginning.
          if (v === 1 || v === 0) {
            mpt = d.firstMPT;
            p = (v === 1) ? "e" : "b";
            while (mpt) {
              pt = mpt.t;
              if (!pt.type) {
                pt[p] = pt.s + pt.xs0;
              } else if (pt.type === 1) {
                str = pt.xs0 + pt.s + pt.xs1;
                for (i = 1; i < pt.l; i++) {
                  str += pt["xn" + i] + pt["xs" + (i + 1)];
                }
                pt[p] = str;
              }
              mpt = mpt._next;
            }
          }
        },

        /**
         * @private @constructor Used by a few SpecialProps to hold important values for proxies. For example, _parseToProxy() creates a MiniPropTween instance for each property that must get tweened on the proxy, and we record the original property name as well as the unique one we create for the proxy, plus whether or not the value needs to be rounded plus the original value.
         * @param {!Object} t target object whose property we're tweening (often a CSSPropTween)
         * @param {!string} p property name
         * @param {(number|string|object)} v value
         * @param {MiniPropTween=} next next MiniPropTween in the linked list
         * @param {boolean=} r if true, the tweened value should be rounded to the nearest integer
         */
        MiniPropTween = function (t, p, v, next, r) {
          this.t = t;
          this.p = p;
          this.v = v;
          this.r = r;
          if (next) {
            next._prev = this;
            this._next = next;
          }
        },

        /**
         * @private Most other plugins (like BezierPlugin and ThrowPropsPlugin and others) can only tween numeric values, but CSSPlugin must accommodate special values that have a bunch of extra data (like a suffix or strings between numeric values, etc.). For example, boxShadow has values like "10px 10px 20px 30px rgb(255,0,0)" which would utterly confuse other plugins. This method allows us to split that data apart and grab only the numeric data and attach it to uniquely-named properties of a generic proxy object ({}) so that we can feed that to virtually any plugin to have the numbers tweened. However, we must also keep track of which properties from the proxy go with which CSSPropTween values and instances. So we create a linked list of MiniPropTweens. Each one records a target (the original CSSPropTween), property (like "s" or "xn1" or "xn2") that we're tweening and the unique property name that was used for the proxy (like "boxShadow_xn1" and "boxShadow_xn2") and whether or not they need to be rounded. That way, in the _setPluginRatio() method we can simply copy the values over from the proxy to the CSSPropTween instance(s). Then, when the main CSSPlugin setRatio() method runs and applies the CSSPropTween values accordingly, they're updated nicely. So the external plugin tweens the numbers, _setPluginRatio() copies them over, and setRatio() acts normally, applying css-specific values to the element.
         * This method returns an object that has the following properties:
         *  - proxy: a generic object containing the starting values for all the properties that will be tweened by the external plugin.  This is what we feed to the external _onInitTween() as the target
         *  - end: a generic object containing the ending values for all the properties that will be tweened by the external plugin. This is what we feed to the external plugin's _onInitTween() as the destination values
         *  - firstMPT: the first MiniPropTween in the linked list
         *  - pt: the first CSSPropTween in the linked list that was created when parsing. If shallow is true, this linked list will NOT attach to the one passed into the _parseToProxy() as the "pt" (4th) parameter.
         * @param {!Object} t target object to be tweened
         * @param {!(Object|string)} vars the object containing the information about the tweening values (typically the end/destination values) that should be parsed
         * @param {!CSSPlugin} cssp The CSSPlugin instance
         * @param {CSSPropTween=} pt the next CSSPropTween in the linked list
         * @param {TweenPlugin=} plugin the external TweenPlugin instance that will be handling tweening the numeric values
         * @param {boolean=} shallow if true, the resulting linked list from the parse will NOT be attached to the CSSPropTween that was passed in as the "pt" (4th) parameter.
         * @return An object containing the following properties: proxy, end, firstMPT, and pt (see above for descriptions)
         */
        _parseToProxy = _internals._parseToProxy = function (t, vars, cssp, pt, plugin, shallow) {
          var bpt = pt,
              start = {},
              end = {},
              transform = cssp._transform,
              oldForce = _forcePT,
              i, p, xp, mpt, firstPT;
          cssp._transform = null;
          _forcePT = vars;
          pt = firstPT = cssp.parse(t, vars, pt, plugin);
          _forcePT = oldForce;
          //break off from the linked list so the new ones are isolated.
          if (shallow) {
            cssp._transform = transform;
            if (bpt) {
              bpt._prev = null;
              if (bpt._prev) {
                bpt._prev._next = null;
              }
            }
          }
          while (pt && pt !== bpt) {
            if (pt.type <= 1) {
              p = pt.p;
              end[p] = pt.s + pt.c;
              start[p] = pt.s;
              if (!shallow) {
                mpt = new MiniPropTween(pt, "s", p, mpt, pt.r);
                pt.c = 0;
              }
              if (pt.type === 1) {
                i = pt.l;
                while (--i > 0) {
                  xp = "xn" + i;
                  p = pt.p + "_" + xp;
                  end[p] = pt.data[xp];
                  start[p] = pt[xp];
                  if (!shallow) {
                    mpt = new MiniPropTween(pt, xp, p, mpt, pt.rxp[xp]);
                  }
                }
              }
            }
            pt = pt._next;
          }
          return {proxy: start, end: end, firstMPT: mpt, pt: firstPT};
        },

        /**
         * @constructor Each property that is tweened has at least one CSSPropTween associated with it. These instances store important information like the target, property, starting value, amount of change, etc. They can also optionally have a number of "extra" strings and numeric values named xs1, xn1, xs2, xn2, xs3, xn3, etc. where "s" indicates string and "n" indicates number. These can be pieced together in a complex-value tween (type:1) that has alternating types of data like a string, number, string, number, etc. For example, boxShadow could be "5px 5px 8px rgb(102, 102, 51)". In that value, there are 6 numbers that may need to tween and then pieced back together into a string again with spaces, suffixes, etc. xs0 is special in that it stores the suffix for standard (type:0) tweens, -OR- the first string (prefix) in a complex-value (type:1) CSSPropTween -OR- it can be the non-tweening value in a type:-1 CSSPropTween. We do this to conserve memory.
         * CSSPropTweens have the following optional properties as well (not defined through the constructor):
         *  - l: Length in terms of the number of extra properties that the CSSPropTween has (default: 0). For example, for a boxShadow we may need to tween 5 numbers in which case l would be 5; Keep in mind that the start/end values for the first number that's tweened are always stored in the s and c properties to conserve memory. All additional values thereafter are stored in xn1, xn2, etc.
         *  - xfirst: The first instance of any sub-CSSPropTweens that are tweening properties of this instance. For example, we may split up a boxShadow tween so that there's a main CSSPropTween of type:1 that has various xs* and xn* values associated with the h-shadow, v-shadow, blur, color, etc. Then we spawn a CSSPropTween for each of those that has a higher priority and runs BEFORE the main CSSPropTween so that the values are all set by the time it needs to re-assemble them. The xfirst gives us an easy way to identify the first one in that chain which typically ends at the main one (because they're all prepende to the linked list)
         *  - plugin: The TweenPlugin instance that will handle the tweening of any complex values. For example, sometimes we don't want to use normal subtweens (like xfirst refers to) to tween the values - we might want ThrowPropsPlugin or BezierPlugin some other plugin to do the actual tweening, so we create a plugin instance and store a reference here. We need this reference so that if we get a request to round values or disable a tween, we can pass along that request.
         *  - data: Arbitrary data that needs to be stored with the CSSPropTween. Typically if we're going to have a plugin handle the tweening of a complex-value tween, we create a generic object that stores the END values that we're tweening to and the CSSPropTween's xs1, xs2, etc. have the starting values. We store that object as data. That way, we can simply pass that object to the plugin and use the CSSPropTween as the target.
         *  - setRatio: Only used for type:2 tweens that require custom functionality. In this case, we call the CSSPropTween's setRatio() method and pass the ratio each time the tween updates. This isn't quite as efficient as doing things directly in the CSSPlugin's setRatio() method, but it's very convenient and flexible.
         * @param {!Object} t Target object whose property will be tweened. Often a DOM element, but not always. It could be anything.
         * @param {string} p Property to tween (name). For example, to tween element.width, p would be "width".
         * @param {number} s Starting numeric value
         * @param {number} c Change in numeric value over the course of the entire tween. For example, if element.width starts at 5 and should end at 100, c would be 95.
         * @param {CSSPropTween=} next The next CSSPropTween in the linked list. If one is defined, we will define its _prev as the new instance, and the new instance's _next will be pointed at it.
         * @param {number=} type The type of CSSPropTween where -1 = a non-tweening value, 0 = a standard simple tween, 1 = a complex value (like one that has multiple numbers in a comma- or space-delimited string like border:"1px solid red"), and 2 = one that uses a custom setRatio function that does all of the work of applying the values on each update.
         * @param {string=} n Name of the property that should be used for overwriting purposes which is typically the same as p but not always. For example, we may need to create a subtween for the 2nd part of a "clip:rect(...)" tween in which case "p" might be xs1 but "n" is still "clip"
         * @param {boolean=} r If true, the value(s) should be rounded
         * @param {number=} pr Priority in the linked list order. Higher priority CSSPropTweens will be updated before lower priority ones. The default priority is 0.
         * @param {string=} b Beginning value. We store this to ensure that it is EXACTLY what it was when the tween began without any risk of interpretation issues.
         * @param {string=} e Ending value. We store this to ensure that it is EXACTLY what the user defined at the end of the tween without any risk of interpretation issues.
         */
        CSSPropTween = _internals.CSSPropTween = function (t, p, s, c, next, type, n, r, pr, b, e) {
          this.t = t; //target
          this.p = p; //property
          this.s = s; //starting value
          this.c = c; //change value
          this.n = n || p; //name that this CSSPropTween should be associated to (usually the same as p, but not always - n is what overwriting looks at)
          if (!(t instanceof CSSPropTween)) {
            _overwriteProps.push(this.n);
          }
          this.r = r; //round (boolean)
          this.type = type || 0; //0 = normal tween, -1 = non-tweening (in which case xs0 will be applied to the target's property, like tp.t[tp.p] = tp.xs0), 1 = complex-value SpecialProp, 2 = custom setRatio() that does all the work
          if (pr) {
            this.pr = pr;
            _hasPriority = true;
          }
          this.b = (b === undefined) ? s : b;
          this.e = (e === undefined) ? s + c : e;
          if (next) {
            this._next = next;
            next._prev = this;
          }
        },

        _addNonTweeningNumericPT = function (target, prop, start, end, next, overwriteProp) { //cleans up some code redundancies and helps minification. Just a fast way to add a NUMERIC non-tweening CSSPropTween
          var pt = new CSSPropTween(target, prop, start, end - start, next, -1, overwriteProp);
          pt.b = start;
          pt.e = pt.xs0 = end;
          return pt;
        },

        /**
         * Takes a target, the beginning value and ending value (as strings) and parses them into a CSSPropTween (possibly with child CSSPropTweens) that accommodates multiple numbers, colors, comma-delimited values, etc. For example:
         * sp.parseComplex(element, "boxShadow", "5px 10px 20px rgb(255,102,51)", "0px 0px 0px red", true, "0px 0px 0px rgb(0,0,0,0)", pt);
         * It will walk through the beginning and ending values (which should be in the same format with the same number and type of values) and figure out which parts are numbers, what strings separate the numeric/tweenable values, and then create the CSSPropTweens accordingly. If a plugin is defined, no child CSSPropTweens will be created. Instead, the ending values will be stored in the "data" property of the returned CSSPropTween like: {s:-5, xn1:-10, xn2:-20, xn3:255, xn4:0, xn5:0} so that it can be fed to any other plugin and it'll be plain numeric tweens but the recomposition of the complex value will be handled inside CSSPlugin's setRatio().
         * If a setRatio is defined, the type of the CSSPropTween will be set to 2 and recomposition of the values will be the responsibility of that method.
         *
         * @param {!Object} t Target whose property will be tweened
         * @param {!string} p Property that will be tweened (its name, like "left" or "backgroundColor" or "boxShadow")
         * @param {string} b Beginning value
         * @param {string} e Ending value
         * @param {boolean} clrs If true, the value could contain a color value like "rgb(255,0,0)" or "#F00" or "red". The default is false, so no colors will be recognized (a performance optimization)
         * @param {(string|number|Object)} dflt The default beginning value that should be used if no valid beginning value is defined or if the number of values inside the complex beginning and ending values don't match
         * @param {?CSSPropTween} pt CSSPropTween instance that is the current head of the linked list (we'll prepend to this).
         * @param {number=} pr Priority in the linked list order. Higher priority properties will be updated before lower priority ones. The default priority is 0.
         * @param {TweenPlugin=} plugin If a plugin should handle the tweening of extra properties, pass the plugin instance here. If one is defined, then NO subtweens will be created for any extra properties (the properties will be created - just not additional CSSPropTween instances to tween them) because the plugin is expected to do so. However, the end values WILL be populated in the "data" property, like {s:100, xn1:50, xn2:300}
         * @param {function(number)=} setRatio If values should be set in a custom function instead of being pieced together in a type:1 (complex-value) CSSPropTween, define that custom function here.
         * @return {CSSPropTween} The first CSSPropTween in the linked list which includes the new one(s) added by the parseComplex() call.
         */
        _parseComplex = CSSPlugin.parseComplex = function (t, p, b, e, clrs, dflt, pt, pr, plugin, setRatio) {
          //DEBUG: _log("parseComplex: "+p+", b: "+b+", e: "+e);
          b = b || dflt || "";
          if (typeof(e) === "function") {
            e = e(_index, _target);
          }
          pt = new CSSPropTween(t, p, 0, 0, pt, (setRatio ? 2 : 1), null, false, pr, b, e);
          e += ""; //ensures it's a string
          if (clrs && _colorExp.test(e + b)) { //if colors are found, normalize the formatting to rgba() or hsla().
            e = [b, e];
            CSSPlugin.colorStringFilter(e);
            b = e[0];
            e = e[1];
          }
          var ba = b.split(", ").join(",").split(" "), //beginning array
              ea = e.split(", ").join(",").split(" "), //ending array
              l = ba.length,
              autoRound = (_autoRound !== false),
              i, xi, ni, bv, ev, bnums, enums, bn, hasAlpha, temp, cv, str, useHSL;
          if (e.indexOf(",") !== -1 || b.indexOf(",") !== -1) {
            if ((e + b).indexOf("rgb") !== -1 || (e + b).indexOf("hsl") !== -1) { //keep rgb(), rgba(), hsl(), and hsla() values together! (remember, we're splitting on spaces)
              ba = ba.join(" ").replace(_commasOutsideParenExp, ", ").split(" ");
              ea = ea.join(" ").replace(_commasOutsideParenExp, ", ").split(" ");
            } else {
              ba = ba.join(" ").split(",").join(", ").split(" ");
              ea = ea.join(" ").split(",").join(", ").split(" ");
            }
            l = ba.length;
          }
          if (l !== ea.length) {
            //DEBUG: _log("mismatched formatting detected on " + p + " (" + b + " vs " + e + ")");
            ba = (dflt || "").split(" ");
            l = ba.length;
          }
          pt.plugin = plugin;
          pt.setRatio = setRatio;
          _colorExp.lastIndex = 0;
          for (i = 0; i < l; i++) {
            bv = ba[i];
            ev = ea[i];
            bn = parseFloat(bv);
            //if the value begins with a number (most common). It's fine if it has a suffix like px
            if (bn || bn === 0) {
              pt.appendXtra("", bn, _parseChange(ev, bn), ev.replace(_relNumExp, ""), (autoRound && ev.indexOf("px") !== -1), true);

              //if the value is a color
            } else if (clrs && _colorExp.test(bv)) {
              str = ev.indexOf(")") + 1;
              str = ")" + (str ? ev.substr(str) : ""); //if there's a comma or ) at the end, retain it.
              useHSL = (ev.indexOf("hsl") !== -1 && _supportsOpacity);
              temp = ev; //original string value so we can look for any prefix later.
              bv = _parseColor(bv, useHSL);
              ev = _parseColor(ev, useHSL);
              hasAlpha = (bv.length + ev.length > 6);
              if (hasAlpha && !_supportsOpacity && ev[3] === 0) { //older versions of IE don't support rgba(), so if the destination alpha is 0, just use "transparent" for the end color
                pt["xs" + pt.l] += pt.l ? " transparent" : "transparent";
                pt.e = pt.e.split(ea[i]).join("transparent");
              } else {
                if (!_supportsOpacity) { //old versions of IE don't support rgba().
                  hasAlpha = false;
                }
                if (useHSL) {
                  pt.appendXtra(temp.substr(0, temp.indexOf("hsl")) + (hasAlpha ? "hsla(" : "hsl("), bv[0], _parseChange(ev[0], bv[0]),
                      ",", false, true)
                  .appendXtra("", bv[1], _parseChange(ev[1], bv[1]), "%,", false)
                  .appendXtra("", bv[2], _parseChange(ev[2], bv[2]), (hasAlpha ? "%," : "%" + str), false);
                } else {
                  pt.appendXtra(temp.substr(0, temp.indexOf("rgb")) + (hasAlpha ? "rgba(" : "rgb("), bv[0], ev[0] - bv[0], ",", true,
                      true)
                  .appendXtra("", bv[1], ev[1] - bv[1], ",", true)
                  .appendXtra("", bv[2], ev[2] - bv[2], (hasAlpha ? "," : str), true);
                }

                if (hasAlpha) {
                  bv = (bv.length < 4) ? 1 : bv[3];
                  pt.appendXtra("", bv, ((ev.length < 4) ? 1 : ev[3]) - bv, str, false);
                }
              }
              _colorExp.lastIndex = 0; //otherwise the test() on the RegExp could move the lastIndex and taint future results.

            } else {
              bnums = bv.match(_numExp); //gets each group of numbers in the beginning value string and drops them into an array

              //if no number is found, treat it as a non-tweening value and just append the string to the current xs.
              if (!bnums) {
                pt["xs" + pt.l] += (pt.l || pt["xs" + pt.l]) ? " " + ev : ev;

                //loop through all the numbers that are found and construct the extra values on the pt.
              } else {
                enums = ev.match(_relNumExp); //get each group of numbers in the end value string and drop them into an array. We allow relative values too, like +=50 or -=.5
                if (!enums || enums.length !== bnums.length) {
                  //DEBUG: _log("mismatched formatting detected on " + p + " (" + b + " vs " + e + ")");
                  return pt;
                }
                ni = 0;
                for (xi = 0; xi < bnums.length; xi++) {
                  cv = bnums[xi];
                  temp = bv.indexOf(cv, ni);
                  pt.appendXtra(bv.substr(ni, temp - ni), Number(cv), _parseChange(enums[xi], cv), "",
                      (autoRound && bv.substr(temp + cv.length, 2) === "px"), (xi === 0));
                  ni = temp + cv.length;
                }
                pt["xs" + pt.l] += bv.substr(ni);
              }
            }
          }
          //if there are relative values ("+=" or "-=" prefix), we need to adjust the ending value to eliminate the prefixes and combine the values properly.
          if (e.indexOf("=") !== -1) {
            if (pt.data) {
              str = pt.xs0 + pt.data.s;
              for (i = 1; i < pt.l; i++) {
                str += pt["xs" + i] + pt.data["xn" + i];
              }
              pt.e = str + pt["xs" + i];
            }
          }
          if (!pt.l) {
            pt.type = -1;
            pt.xs0 = pt.e;
          }
          return pt.xfirst || pt;
        },
        i = 9;

    p = CSSPropTween.prototype;
    p.l = p.pr = 0; //length (number of extra properties like xn1, xn2, xn3, etc.
    while (--i > 0) {
      p["xn" + i] = 0;
      p["xs" + i] = "";
    }
    p.xs0 = "";
    p._next = p._prev = p.xfirst = p.data = p.plugin = p.setRatio = p.rxp = null;

    /**
     * Appends and extra tweening value to a CSSPropTween and automatically manages any prefix and suffix strings. The first extra value is stored in the s and c of the main CSSPropTween instance, but thereafter any extras are stored in the xn1, xn2, xn3, etc. The prefixes and suffixes are stored in the xs0, xs1, xs2, etc. properties. For example, if I walk through a clip value like "rect(10px, 5px, 0px, 20px)", the values would be stored like this:
     * xs0:"rect(", s:10, xs1:"px, ", xn1:5, xs2:"px, ", xn2:0, xs3:"px, ", xn3:20, xn4:"px)"
     * And they'd all get joined together when the CSSPlugin renders (in the setRatio() method).
     * @param {string=} pfx Prefix (if any)
     * @param {!number} s Starting value
     * @param {!number} c Change in numeric value over the course of the entire tween. For example, if the start is 5 and the end is 100, the change would be 95.
     * @param {string=} sfx Suffix (if any)
     * @param {boolean=} r Round (if true).
     * @param {boolean=} pad If true, this extra value should be separated by the previous one by a space. If there is no previous extra and pad is true, it will automatically drop the space.
     * @return {CSSPropTween} returns itself so that multiple methods can be chained together.
     */
    p.appendXtra = function (pfx, s, c, sfx, r, pad) {
      var pt = this,
          l = pt.l;
      pt["xs" + l] += (pad && (l || pt["xs" + l])) ? " " + pfx : pfx || "";
      if (!c) {
        if (l !== 0 && !pt.plugin) { //typically we'll combine non-changing values right into the xs to optimize performance, but we don't combine them when there's a plugin that will be tweening the values because it may depend on the values being split apart, like for a bezier, if a value doesn't change between the first and second iteration but then it does on the 3rd, we'll run into trouble because there's no xn slot for that value!
          pt["xs" + l] += s + (sfx || "");
          return pt;
        }
      }
      pt.l++;
      pt.type = pt.setRatio ? 2 : 1;
      pt["xs" + pt.l] = sfx || "";
      if (l > 0) {
        pt.data["xn" + l] = s + c;
        pt.rxp["xn" + l] = r; //round extra property (we need to tap into this in the _parseToProxy() method)
        pt["xn" + l] = s;
        if (!pt.plugin) {
          pt.xfirst = new CSSPropTween(pt, "xn" + l, s, c, pt.xfirst || pt, 0, pt.n, r, pt.pr);
          pt.xfirst.xs0 = 0; //just to ensure that the property stays numeric which helps modern browsers speed up processing. Remember, in the setRatio() method, we do pt.t[pt.p] = val + pt.xs0 so if pt.xs0 is "" (the default), it'll cast the end value as a string. When a property is a number sometimes and a string sometimes, it prevents the compiler from locking in the data type, slowing things down slightly.
        }
        return pt;
      }
      pt.data = {s: s + c};
      pt.rxp = {};
      pt.s = s;
      pt.c = c;
      pt.r = r;
      return pt;
    };

    /**
     * @constructor A SpecialProp is basically a css property that needs to be treated in a non-standard way, like if it may contain a complex value like boxShadow:"5px 10px 15px rgb(255, 102, 51)" or if it is associated with another plugin like ThrowPropsPlugin or BezierPlugin. Every SpecialProp is associated with a particular property name like "boxShadow" or "throwProps" or "bezier" and it will intercept those values in the vars object that's passed to the CSSPlugin and handle them accordingly.
     * @param {!string} p Property name (like "boxShadow" or "throwProps")
     * @param {Object=} options An object containing any of the following configuration options:
     *                      - defaultValue: the default value
     *                      - parser: A function that should be called when the associated property name is found in the vars. This function should return a CSSPropTween instance and it should ensure that it is properly inserted into the linked list. It will receive 4 paramters: 1) The target, 2) The value defined in the vars, 3) The CSSPlugin instance (whose _firstPT should be used for the linked list), and 4) A computed style object if one was calculated (this is a speed optimization that allows retrieval of starting values quicker)
     *                      - formatter: a function that formats any value received for this special property (for example, boxShadow could take "5px 5px red" and format it to "5px 5px 0px 0px red" so that both the beginning and ending values have a common order and quantity of values.)
     *                      - prefix: if true, we'll determine whether or not this property requires a vendor prefix (like Webkit or Moz or ms or O)
     *                      - color: set this to true if the value for this SpecialProp may contain color-related values like rgb(), rgba(), etc.
     *                      - priority: priority in the linked list order. Higher priority SpecialProps will be updated before lower priority ones. The default priority is 0.
     *                      - multi: if true, the formatter should accommodate a comma-delimited list of values, like boxShadow could have multiple boxShadows listed out.
     *                      - collapsible: if true, the formatter should treat the value like it's a top/right/bottom/left value that could be collapsed, like "5px" would apply to all, "5px, 10px" would use 5px for top/bottom and 10px for right/left, etc.
     *                      - keyword: a special keyword that can [optionally] be found inside the value (like "inset" for boxShadow). This allows us to validate beginning/ending values to make sure they match (if the keyword is found in one, it'll be added to the other for consistency by default).
     */
    var SpecialProp = function (p, options) {
          options = options || {};
          this.p = options.prefix ? _checkPropPrefix(p) || p : p;
          _specialProps[p] = _specialProps[this.p] = this;
          this.format = options.formatter || _getFormatter(options.defaultValue, options.color, options.collapsible, options.multi);
          if (options.parser) {
            this.parse = options.parser;
          }
          this.clrs = options.color;
          this.multi = options.multi;
          this.keyword = options.keyword;
          this.dflt = options.defaultValue;
          this.pr = options.priority || 0;
        },

        //shortcut for creating a new SpecialProp that can accept multiple properties as a comma-delimited list (helps minification). dflt can be an array for multiple values (we don't do a comma-delimited list because the default value may contain commas, like rect(0px,0px,0px,0px)). We attach this method to the SpecialProp class/object instead of using a private _createSpecialProp() method so that we can tap into it externally if necessary, like from another plugin.
        _registerComplexSpecialProp = _internals._registerComplexSpecialProp = function (p, options, defaults) {
          if (typeof(options) !== "object") {
            options = {parser: defaults}; //to make backwards compatible with older versions of BezierPlugin and ThrowPropsPlugin
          }
          var a = p.split(","),
              d = options.defaultValue,
              i, temp;
          defaults = defaults || [d];
          for (i = 0; i < a.length; i++) {
            options.prefix = (i === 0 && options.prefix);
            options.defaultValue = defaults[i] || d;
            temp = new SpecialProp(a[i], options);
          }
        },

        //creates a placeholder special prop for a plugin so that the property gets caught the first time a tween of it is attempted, and at that time it makes the plugin register itself, thus taking over for all future tweens of that property. This allows us to not mandate that things load in a particular order and it also allows us to log() an error that informs the user when they attempt to tween an external plugin-related property without loading its .js file.
        _registerPluginProp = _internals._registerPluginProp = function (p) {
          if (!_specialProps[p]) {
            var pluginName = p.charAt(0).toUpperCase() + p.substr(1) + "Plugin";
            _registerComplexSpecialProp(p, {
              parser: function (t, e, p, cssp, pt, plugin, vars) {
                var pluginClass = _globals.com.greensock.plugins[pluginName];
                if (!pluginClass) {
                  _log("Error: " + pluginName + " js file not loaded.");
                  return pt;
                }
                pluginClass._cssRegister();
                return _specialProps[p].parse(t, e, p, cssp, pt, plugin, vars);
              }
            });
          }
        };

    p = SpecialProp.prototype;

    /**
     * Alias for _parseComplex() that automatically plugs in certain values for this SpecialProp, like its property name, whether or not colors should be sensed, the default value, and priority. It also looks for any keyword that the SpecialProp defines (like "inset" for boxShadow) and ensures that the beginning and ending values have the same number of values for SpecialProps where multi is true (like boxShadow and textShadow can have a comma-delimited list)
     * @param {!Object} t target element
     * @param {(string|number|object)} b beginning value
     * @param {(string|number|object)} e ending (destination) value
     * @param {CSSPropTween=} pt next CSSPropTween in the linked list
     * @param {TweenPlugin=} plugin If another plugin will be tweening the complex value, that TweenPlugin instance goes here.
     * @param {function=} setRatio If a custom setRatio() method should be used to handle this complex value, that goes here.
     * @return {CSSPropTween=} First CSSPropTween in the linked list
     */
    p.parseComplex = function (t, b, e, pt, plugin, setRatio) {
      var kwd = this.keyword,
          i, ba, ea, l, bi, ei;
      //if this SpecialProp's value can contain a comma-delimited list of values (like boxShadow or textShadow), we must parse them in a special way, and look for a keyword (like "inset" for boxShadow) and ensure that the beginning and ending BOTH have it if the end defines it as such. We also must ensure that there are an equal number of values specified (we can't tween 1 boxShadow to 3 for example)
      if (this.multi) {
        if (_commasOutsideParenExp.test(e) || _commasOutsideParenExp.test(b)) {
          ba = b.replace(_commasOutsideParenExp, "|").split("|");
          ea = e.replace(_commasOutsideParenExp, "|").split("|");
        } else if (kwd) {
          ba = [b];
          ea = [e];
        }
      }
      if (ea) {
        l = (ea.length > ba.length) ? ea.length : ba.length;
        for (i = 0; i < l; i++) {
          b = ba[i] = ba[i] || this.dflt;
          e = ea[i] = ea[i] || this.dflt;
          if (kwd) {
            bi = b.indexOf(kwd);
            ei = e.indexOf(kwd);
            if (bi !== ei) {
              if (ei === -1) { //if the keyword isn't in the end value, remove it from the beginning one.
                ba[i] = ba[i].split(kwd).join("");
              } else if (bi === -1) { //if the keyword isn't in the beginning, add it.
                ba[i] += " " + kwd;
              }
            }
          }
        }
        b = ba.join(", ");
        e = ea.join(", ");
      }
      return _parseComplex(t, this.p, b, e, this.clrs, this.dflt, pt, this.pr, plugin, setRatio);
    };

    /**
     * Accepts a target and end value and spits back a CSSPropTween that has been inserted into the CSSPlugin's linked list and conforms with all the conventions we use internally, like type:-1, 0, 1, or 2, setting up any extra property tweens, priority, etc. For example, if we have a boxShadow SpecialProp and call:
     * this._firstPT = sp.parse(element, "5px 10px 20px rgb(2550,102,51)", "boxShadow", this);
     * It should figure out the starting value of the element's boxShadow, compare it to the provided end value and create all the necessary CSSPropTweens of the appropriate types to tween the boxShadow. The CSSPropTween that gets spit back should already be inserted into the linked list (the 4th parameter is the current head, so prepend to that).
     * @param {!Object} t Target object whose property is being tweened
     * @param {Object} e End value as provided in the vars object (typically a string, but not always - like a throwProps would be an object).
     * @param {!string} p Property name
     * @param {!CSSPlugin} cssp The CSSPlugin instance that should be associated with this tween.
     * @param {?CSSPropTween} pt The CSSPropTween that is the current head of the linked list (we'll prepend to it)
     * @param {TweenPlugin=} plugin If a plugin will be used to tween the parsed value, this is the plugin instance.
     * @param {Object=} vars Original vars object that contains the data for parsing.
     * @return {CSSPropTween} The first CSSPropTween in the linked list which includes the new one(s) added by the parse() call.
     */
    p.parse = function (t, e, p, cssp, pt, plugin, vars) {
      return this.parseComplex(t.style, this.format(_getStyle(t, this.p, _cs, false, this.dflt)), this.format(e), pt, plugin);
    };

    /**
     * Registers a special property that should be intercepted from any "css" objects defined in tweens. This allows you to handle them however you want without CSSPlugin doing it for you. The 2nd parameter should be a function that accepts 3 parameters:
     *  1) Target object whose property should be tweened (typically a DOM element)
     *  2) The end/destination value (could be a string, number, object, or whatever you want)
     *  3) The tween instance (you probably don't need to worry about this, but it can be useful for looking up information like the duration)
     *
     * Then, your function should return a function which will be called each time the tween gets rendered, passing a numeric "ratio" parameter to your function that indicates the change factor (usually between 0 and 1). For example:
     *
     * CSSPlugin.registerSpecialProp("myCustomProp", function(target, value, tween) {
     *      var start = target.style.width;
     *      return function(ratio) {
     *              target.style.width = (start + value * ratio) + "px";
     *              console.log("set width to " + target.style.width);
     *          }
     * }, 0);
     *
     * Then, when I do this tween, it will trigger my special property:
     *
     * TweenLite.to(element, 1, {css:{myCustomProp:100}});
     *
     * In the example, of course, we're just changing the width, but you can do anything you want.
     *
     * @param {!string} name Property name (or comma-delimited list of property names) that should be intercepted and handled by your function. For example, if I define "myCustomProp", then it would handle that portion of the following tween: TweenLite.to(element, 1, {css:{myCustomProp:100}})
     * @param {!function(Object, Object, Object, string):function(number)} onInitTween The function that will be called when a tween of this special property is performed. The function will receive 4 parameters: 1) Target object that should be tweened, 2) Value that was passed to the tween, 3) The tween instance itself (rarely used), and 4) The property name that's being tweened. Your function should return a function that should be called on every update of the tween. That function will receive a single parameter that is a "change factor" value (typically between 0 and 1) indicating the amount of change as a ratio. You can use this to determine how to set the values appropriately in your function.
     * @param {number=} priority Priority that helps the engine determine the order in which to set the properties (default: 0). Higher priority properties will be updated before lower priority ones.
     */
    CSSPlugin.registerSpecialProp = function (name, onInitTween, priority) {
      _registerComplexSpecialProp(name, {
        parser: function (t, e, p, cssp, pt, plugin, vars) {
          var rv = new CSSPropTween(t, p, 0, 0, pt, 2, p, false, priority);
          rv.plugin = plugin;
          rv.setRatio = onInitTween(t, e, cssp._tween, p);
          return rv;
        }, priority: priority
      });
    };

    //transform-related methods and properties
    CSSPlugin.useSVGTransformAttr = true; //Safari and Firefox both have some rendering bugs when applying CSS transforms to SVG elements, so default to using the "transform" attribute instead (users can override this).
    var _transformProps = ("scaleX,scaleY,scaleZ,x,y,z,skewX,skewY,rotation,rotationX,rotationY,perspective,xPercent,yPercent").split(","),
        _transformProp = _checkPropPrefix("transform"), //the Javascript (camelCase) transform property, like msTransform, WebkitTransform, MozTransform, or OTransform.
        _transformPropCSS = _prefixCSS + "transform",
        _transformOriginProp = _checkPropPrefix("transformOrigin"),
        _supports3D = (_checkPropPrefix("perspective") !== null),
        Transform = _internals.Transform = function () {
          this.perspective = parseFloat(CSSPlugin.defaultTransformPerspective) || 0;
          this.force3D = (CSSPlugin.defaultForce3D === false || !_supports3D) ? false : CSSPlugin.defaultForce3D || "auto";
        },
        _SVGElement = _gsScope.SVGElement,
        _useSVGTransformAttr,
        //Some browsers (like Firefox and IE) don't honor transform-origin properly in SVG elements, so we need to manually adjust the matrix accordingly. We feature detect here rather than always doing the conversion for certain browsers because they may fix the problem at some point in the future.

        _createSVG = function (type, container, attributes) {
          var element = _doc.createElementNS("http://www.w3.org/2000/svg", type),
              reg = /([a-z])([A-Z])/g,
              p;
          for (p in attributes) {
            element.setAttributeNS(null, p.replace(reg, "$1-$2").toLowerCase(), attributes[p]);
          }
          container.appendChild(element);
          return element;
        },
        _docElement = _doc.documentElement || {},
        _forceSVGTransformAttr = (function () {
          //IE and Android stock don't support CSS transforms on SVG elements, so we must write them to the "transform" attribute. We populate this variable in the _parseTransform() method, and only if/when we come across an SVG element
          var force = _ieVers || (/Android/i.test(_agent) && !_gsScope.chrome),
              svg, rect, width;
          if (_doc.createElementNS && !force) { //IE8 and earlier doesn't support SVG anyway
            svg = _createSVG("svg", _docElement);
            rect = _createSVG("rect", svg, {width: 100, height: 50, x: 100});
            width = rect.getBoundingClientRect().width;
            rect.style[_transformOriginProp] = "50% 50%";
            rect.style[_transformProp] = "scaleX(0.5)";
            force = (width === rect.getBoundingClientRect().width && !(_isFirefox && _supports3D)); //note: Firefox fails the test even though it does support CSS transforms in 3D. Since we can't push 3D stuff into the transform attribute, we force Firefox to pass the test here (as long as it does truly support 3D).
            _docElement.removeChild(svg);
          }
          return force;
        })(),
        _parseSVGOrigin = function (e, local, decoratee, absolute, smoothOrigin, skipRecord) {
          var tm = e._gsTransform,
              m = _getMatrix(e, true),
              v, x, y, xOrigin, yOrigin, a, b, c, d, tx, ty, determinant, xOriginOld, yOriginOld;
          if (tm) {
            xOriginOld = tm.xOrigin; //record the original values before we alter them.
            yOriginOld = tm.yOrigin;
          }
          if (!absolute || (v = absolute.split(" ")).length < 2) {
            b = e.getBBox();
            if (b.x === 0 && b.y === 0 && b.width + b.height === 0) { //some browsers (like Firefox) misreport the bounds if the element has zero width and height (it just assumes it's at x:0, y:0), thus we need to manually grab the position in that case.
              b = {
                x: parseFloat(e.hasAttribute("x") ? e.getAttribute("x") : e.hasAttribute("cx") ? e.getAttribute("cx") : 0) || 0,
                y: parseFloat(e.hasAttribute("y") ? e.getAttribute("y") : e.hasAttribute("cy") ? e.getAttribute("cy") : 0) || 0,
                width: 0,
                height: 0
              };
            }
            local = _parsePosition(local).split(" ");
            v = [(local[0].indexOf("%") !== -1 ? parseFloat(local[0]) / 100 * b.width : parseFloat(local[0])) + b.x,
              (local[1].indexOf("%") !== -1 ? parseFloat(local[1]) / 100 * b.height : parseFloat(local[1])) + b.y];
          }
          decoratee.xOrigin = xOrigin = parseFloat(v[0]);
          decoratee.yOrigin = yOrigin = parseFloat(v[1]);
          if (absolute && m !== _identity2DMatrix) { //if svgOrigin is being set, we must invert the matrix and determine where the absolute point is, factoring in the current transforms. Otherwise, the svgOrigin would be based on the element's non-transformed position on the canvas.
            a = m[0];
            b = m[1];
            c = m[2];
            d = m[3];
            tx = m[4];
            ty = m[5];
            determinant = (a * d - b * c);
            if (determinant) { //if it's zero (like if scaleX and scaleY are zero), skip it to avoid errors with dividing by zero.
              x = xOrigin * (d / determinant) + yOrigin * (-c / determinant) + ((c * ty - d * tx) / determinant);
              y = xOrigin * (-b / determinant) + yOrigin * (a / determinant) - ((a * ty - b * tx) / determinant);
              xOrigin = decoratee.xOrigin = v[0] = x;
              yOrigin = decoratee.yOrigin = v[1] = y;
            }
          }
          if (tm) { //avoid jump when transformOrigin is changed - adjust the x/y values accordingly
            if (skipRecord) {
              decoratee.xOffset = tm.xOffset;
              decoratee.yOffset = tm.yOffset;
              tm = decoratee;
            }
            if (smoothOrigin || (smoothOrigin !== false && CSSPlugin.defaultSmoothOrigin !== false)) {
              x = xOrigin - xOriginOld;
              y = yOrigin - yOriginOld;
              //originally, we simply adjusted the x and y values, but that would cause problems if, for example, you created a rotational tween part-way through an x/y tween. Managing the offset in a separate variable gives us ultimate flexibility.
              //tm.x -= x - (x * m[0] + y * m[2]);
              //tm.y -= y - (x * m[1] + y * m[3]);
              tm.xOffset += (x * m[0] + y * m[2]) - x;
              tm.yOffset += (x * m[1] + y * m[3]) - y;
            } else {
              tm.xOffset = tm.yOffset = 0;
            }
          }
          if (!skipRecord) {
            e.setAttribute("data-svg-origin", v.join(" "));
          }
        },
        _getBBoxHack = function (swapIfPossible) { //works around issues in some browsers (like Firefox) that don't correctly report getBBox() on SVG elements inside a <defs> element and/or <mask>. We try creating an SVG, adding it to the documentElement and toss the element in there so that it's definitely part of the rendering tree, then grab the bbox and if it works, we actually swap out the original getBBox() method for our own that does these extra steps whenever getBBox is needed. This helps ensure that performance is optimal (only do all these extra steps when absolutely necessary...most elements don't need it).
          var svg = _createElement("svg", (this.ownerSVGElement && this.ownerSVGElement.getAttribute("xmlns"))
              || "http://www.w3.org/2000/svg"),
              oldParent = this.parentNode,
              oldSibling = this.nextSibling,
              oldCSS = this.style.cssText,
              bbox;
          _docElement.appendChild(svg);
          svg.appendChild(this);
          this.style.display = "block";
          if (swapIfPossible) {
            try {
              bbox = this.getBBox();
              this._originalGetBBox = this.getBBox;
              this.getBBox = _getBBoxHack;
            } catch (e) {
            }
          } else if (this._originalGetBBox) {
            bbox = this._originalGetBBox();
          }
          if (oldSibling) {
            oldParent.insertBefore(this, oldSibling);
          } else {
            oldParent.appendChild(this);
          }
          _docElement.removeChild(svg);
          this.style.cssText = oldCSS;
          return bbox;
        },
        _getBBox = function (e) {
          try {
            return e.getBBox(); //Firefox throws errors if you try calling getBBox() on an SVG element that's not rendered (like in a <symbol> or <defs>). https://bugzilla.mozilla.org/show_bug.cgi?id=612118
          } catch (error) {
            return _getBBoxHack.call(e, true);
          }
        },
        _isSVG = function (e) { //reports if the element is an SVG on which getBBox() actually works
          return !!(_SVGElement && e.getCTM && (!e.parentNode || e.ownerSVGElement) && _getBBox(e));
        },
        _identity2DMatrix = [1, 0, 0, 1, 0, 0],
        _getMatrix = function (e, force2D) {
          var tm = e._gsTransform || new Transform(),
              rnd = 100000,
              style = e.style,
              isDefault, s, m, n, dec, none;
          if (_transformProp) {
            s = _getStyle(e, _transformPropCSS, null, true);
          } else if (e.currentStyle) {
            //for older versions of IE, we need to interpret the filter portion that is in the format: progid:DXImageTransform.Microsoft.Matrix(M11=6.123233995736766e-17, M12=-1, M21=1, M22=6.123233995736766e-17, sizingMethod='auto expand') Notice that we need to swap b and c compared to a normal matrix.
            s = e.currentStyle.filter.match(_ieGetMatrixExp);
            s = (s && s.length === 4) ? [s[0].substr(4), Number(s[2].substr(4)), Number(s[1].substr(4)), s[3].substr(4), (tm.x || 0),
              (tm.y || 0)].join(",") : "";
          }
          isDefault = (!s || s === "none" || s === "matrix(1, 0, 0, 1, 0, 0)");
          if (_transformProp && ((none = (!_getComputedStyle(e) || _getComputedStyle(e).display === "none")) || !e.parentNode)) { //note: Firefox returns null for getComputedStyle() if the element is in an iframe that has display:none. https://bugzilla.mozilla.org/show_bug.cgi?id=548397
            if (none) { //browsers don't report transforms accurately unless the element is in the DOM and has a display value that's not "none". Firefox and Microsoft browsers have a partial bug where they'll report transforms even if display:none BUT not any percentage-based values like translate(-50%, 8px) will be reported as if it's translate(0, 8px).
              n = style.display;
              style.display = "block";
            }
            if (!e.parentNode) {
              dec = 1; //flag
              _docElement.appendChild(e);
            }
            s = _getStyle(e, _transformPropCSS, null, true);
            isDefault = (!s || s === "none" || s === "matrix(1, 0, 0, 1, 0, 0)");
            if (n) {
              style.display = n;
            } else if (none) {
              _removeProp(style, "display");
            }
            if (dec) {
              _docElement.removeChild(e);
            }
          }
          if (tm.svg || (e.getCTM && _isSVG(e))) {
            if (isDefault && (style[_transformProp] + "").indexOf("matrix") !== -1) { //some browsers (like Chrome 40) don't correctly report transforms that are applied inline on an SVG element (they don't get included in the computed style), so we double-check here and accept matrix values
              s = style[_transformProp];
              isDefault = 0;
            }
            m = e.getAttribute("transform");
            if (isDefault && m) {
              if (m.indexOf("matrix") !== -1) { //just in case there's a "transform" value specified as an attribute instead of CSS style. Accept either a matrix() or simple translate() value though.
                s = m;
                isDefault = 0;
              } else if (m.indexOf("translate") !== -1) {
                s = "matrix(1,0,0,1," + m.match(/(?:\-|\b)[\d\-\.e]+\b/gi).join(",") + ")";
                isDefault = 0;
              }
            }
          }
          if (isDefault) {
            return _identity2DMatrix;
          }
          //split the matrix values out into an array (m for matrix)
          m = (s || "").match(_numExp) || [];
          i = m.length;
          while (--i > -1) {
            n = Number(m[i]);
            m[i] = (dec = n - (n |= 0)) ? ((dec * rnd + (dec < 0 ? -0.5 : 0.5)) | 0) / rnd + n : n; //convert strings to Numbers and round to 5 decimal places to avoid issues with tiny numbers. Roughly 20x faster than Number.toFixed(). We also must make sure to round before dividing so that values like 0.9999999999 become 1 to avoid glitches in browser rendering and interpretation of flipped/rotated 3D matrices. And don't just multiply the number by rnd, floor it, and then divide by rnd because the bitwise operations max out at a 32-bit signed integer, thus it could get clipped at a relatively low value (like 22,000.00000 for example).
          }
          return (force2D && m.length > 6) ? [m[0], m[1], m[4], m[5], m[12], m[13]] : m;
        },

        /**
         * Parses the transform values for an element, returning an object with x, y, z, scaleX, scaleY, scaleZ, rotation, rotationX, rotationY, skewX, and skewY properties. Note: by default (for performance reasons), all skewing is combined into skewX and rotation but skewY still has a place in the transform object so that we can record how much of the skew is attributed to skewX vs skewY. Remember, a skewY of 10 looks the same as a rotation of 10 and skewX of -10.
         * @param {!Object} t target element
         * @param {Object=} cs computed style object (optional)
         * @param {boolean=} rec if true, the transform values will be recorded to the target element's _gsTransform object, like target._gsTransform = {x:0, y:0, z:0, scaleX:1...}
         * @param {boolean=} parse if true, we'll ignore any _gsTransform values that already exist on the element, and force a reparsing of the css (calculated style)
         * @return {object} object containing all of the transform properties/values like {x:0, y:0, z:0, scaleX:1...}
         */
        _getTransform = _internals.getTransform = function (t, cs, rec, parse) {
          if (t._gsTransform && rec && !parse) {
            return t._gsTransform; //if the element already has a _gsTransform, use that. Note: some browsers don't accurately return the calculated style for the transform (particularly for SVG), so it's almost always safest to just use the values we've already applied rather than re-parsing things.
          }
          var tm = rec ? t._gsTransform || new Transform() : new Transform(),
              invX = (tm.scaleX < 0), //in order to interpret things properly, we need to know if the user applied a negative scaleX previously so that we can adjust the rotation and skewX accordingly. Otherwise, if we always interpret a flipped matrix as affecting scaleY and the user only wants to tween the scaleX on multiple sequential tweens, it would keep the negative scaleY without that being the user's intent.
              min = 0.00002,
              rnd = 100000,
              zOrigin = _supports3D ? parseFloat(_getStyle(t, _transformOriginProp, cs, false, "0 0 0").split(" ")[2]) || tm.zOrigin
                  || 0 : 0,
              defaultTransformPerspective = parseFloat(CSSPlugin.defaultTransformPerspective) || 0,
              m, i, scaleX, scaleY, rotation, skewX;

          tm.svg = !!(t.getCTM && _isSVG(t));
          if (tm.svg) {
            _parseSVGOrigin(t, _getStyle(t, _transformOriginProp, cs, false, "50% 50%") + "", tm, t.getAttribute("data-svg-origin"));
            _useSVGTransformAttr = CSSPlugin.useSVGTransformAttr || _forceSVGTransformAttr;
          }
          m = _getMatrix(t);
          if (m !== _identity2DMatrix) {

            if (m.length === 16) {
              //we'll only look at these position-related 6 variables first because if x/y/z all match, it's relatively safe to assume we don't need to re-parse everything which risks losing important rotational information (like rotationX:180 plus rotationY:180 would look the same as rotation:180 - there's no way to know for sure which direction was taken based solely on the matrix3d() values)
              var a11 = m[0], a21 = m[1], a31 = m[2], a41 = m[3],
                  a12 = m[4], a22 = m[5], a32 = m[6], a42 = m[7],
                  a13 = m[8], a23 = m[9], a33 = m[10],
                  a14 = m[12], a24 = m[13], a34 = m[14],
                  a43 = m[11],
                  angle = Math.atan2(a32, a33),
                  t1, t2, t3, t4, cos, sin;
              //we manually compensate for non-zero z component of transformOrigin to work around bugs in Safari
              if (tm.zOrigin) {
                a34 = -tm.zOrigin;
                a14 = a13 * a34 - m[12];
                a24 = a23 * a34 - m[13];
                a34 = a33 * a34 + tm.zOrigin - m[14];
              }
              //note for possible future consolidation: rotationX: Math.atan2(a32, a33), rotationY: Math.atan2(-a31, Math.sqrt(a33 * a33 + a32 * a32)), rotation: Math.atan2(a21, a11), skew: Math.atan2(a12, a22). However, it doesn't seem to be quite as reliable as the full-on backwards rotation procedure.
              tm.rotationX = angle * _RAD2DEG;
              //rotationX
              if (angle) {
                cos = Math.cos(-angle);
                sin = Math.sin(-angle);
                t1 = a12 * cos + a13 * sin;
                t2 = a22 * cos + a23 * sin;
                t3 = a32 * cos + a33 * sin;
                a13 = a12 * -sin + a13 * cos;
                a23 = a22 * -sin + a23 * cos;
                a33 = a32 * -sin + a33 * cos;
                a43 = a42 * -sin + a43 * cos;
                a12 = t1;
                a22 = t2;
                a32 = t3;
              }
              //rotationY
              angle = Math.atan2(-a31, a33);
              tm.rotationY = angle * _RAD2DEG;
              if (angle) {
                cos = Math.cos(-angle);
                sin = Math.sin(-angle);
                t1 = a11 * cos - a13 * sin;
                t2 = a21 * cos - a23 * sin;
                t3 = a31 * cos - a33 * sin;
                a23 = a21 * sin + a23 * cos;
                a33 = a31 * sin + a33 * cos;
                a43 = a41 * sin + a43 * cos;
                a11 = t1;
                a21 = t2;
                a31 = t3;
              }
              //rotationZ
              angle = Math.atan2(a21, a11);
              tm.rotation = angle * _RAD2DEG;
              if (angle) {
                cos = Math.cos(angle);
                sin = Math.sin(angle);
                t1 = a11 * cos + a21 * sin;
                t2 = a12 * cos + a22 * sin;
                t3 = a13 * cos + a23 * sin;
                a21 = a21 * cos - a11 * sin;
                a22 = a22 * cos - a12 * sin;
                a23 = a23 * cos - a13 * sin;
                a11 = t1;
                a12 = t2;
                a13 = t3;
              }

              if (tm.rotationX && Math.abs(tm.rotationX) + Math.abs(tm.rotation) > 359.9) { //when rotationY is set, it will often be parsed as 180 degrees different than it should be, and rotationX and rotation both being 180 (it looks the same), so we adjust for that here.
                tm.rotationX = tm.rotation = 0;
                tm.rotationY = 180 - tm.rotationY;
              }

              //skewX
              angle = Math.atan2(a12, a22);

              //scales
              tm.scaleX = ((Math.sqrt(a11 * a11 + a21 * a21 + a31 * a31) * rnd + 0.5) | 0) / rnd;
              tm.scaleY = ((Math.sqrt(a22 * a22 + a32 * a32) * rnd + 0.5) | 0) / rnd;
              tm.scaleZ = ((Math.sqrt(a13 * a13 + a23 * a23 + a33 * a33) * rnd + 0.5) | 0) / rnd;
              a11 /= tm.scaleX;
              a12 /= tm.scaleY;
              a21 /= tm.scaleX;
              a22 /= tm.scaleY;
              if (Math.abs(angle) > min) {
                tm.skewX = angle * _RAD2DEG;
                a12 = 0; //unskews
                if (tm.skewType !== "simple") {
                  tm.scaleY *= 1 / Math.cos(angle); //by default, we compensate the scale based on the skew so that the element maintains a similar proportion when skewed, so we have to alter the scaleY here accordingly to match the default (non-adjusted) skewing that CSS does (stretching more and more as it skews).
                }

              } else {
                tm.skewX = 0;
              }

              /* //for testing purposes
						var transform = "matrix3d(",
							comma = ",",
							zero = "0";
						a13 /= tm.scaleZ;
						a23 /= tm.scaleZ;
						a31 /= tm.scaleX;
						a32 /= tm.scaleY;
						a33 /= tm.scaleZ;
						transform += ((a11 < min && a11 > -min) ? zero : a11) + comma + ((a21 < min && a21 > -min) ? zero : a21) + comma + ((a31 < min && a31 > -min) ? zero : a31);
						transform += comma + ((a41 < min && a41 > -min) ? zero : a41) + comma + ((a12 < min && a12 > -min) ? zero : a12) + comma + ((a22 < min && a22 > -min) ? zero : a22);
						transform += comma + ((a32 < min && a32 > -min) ? zero : a32) + comma + ((a42 < min && a42 > -min) ? zero : a42) + comma + ((a13 < min && a13 > -min) ? zero : a13);
						transform += comma + ((a23 < min && a23 > -min) ? zero : a23) + comma + ((a33 < min && a33 > -min) ? zero : a33) + comma + ((a43 < min && a43 > -min) ? zero : a43) + comma;
						transform += a14 + comma + a24 + comma + a34 + comma + (tm.perspective ? (1 + (-a34 / tm.perspective)) : 1) + ")";
						console.log(transform);
						document.querySelector(".test").style[_transformProp] = transform;
						*/

              tm.perspective = a43 ? 1 / ((a43 < 0) ? -a43 : a43) : 0;
              tm.x = a14;
              tm.y = a24;
              tm.z = a34;
              if (tm.svg) {
                tm.x -= tm.xOrigin - (tm.xOrigin * a11 - tm.yOrigin * a12);
                tm.y -= tm.yOrigin - (tm.yOrigin * a21 - tm.xOrigin * a22);
              }

            } else if ((!_supports3D || parse || !m.length || tm.x !== m[4] || tm.y !== m[5] || (!tm.rotationX && !tm.rotationY))) { //sometimes a 6-element matrix is returned even when we performed 3D transforms, like if rotationX and rotationY are 180. In cases like this, we still need to honor the 3D transforms. If we just rely on the 2D info, it could affect how the data is interpreted, like scaleY might get set to -1 or rotation could get offset by 180 degrees. For example, do a TweenLite.to(element, 1, {css:{rotationX:180, rotationY:180}}) and then later, TweenLite.to(element, 1, {css:{rotationX:0}}) and without this conditional logic in place, it'd jump to a state of being unrotated when the 2nd tween starts. Then again, we need to honor the fact that the user COULD alter the transforms outside of CSSPlugin, like by manually applying new css, so we try to sense that by looking at x and y because if those changed, we know the changes were made outside CSSPlugin and we force a reinterpretation of the matrix values. Also, in Webkit browsers, if the element's "display" is "none", its calculated style value will always return empty, so if we've already recorded the values in the _gsTransform object, we'll just rely on those.
              var k = (m.length >= 6),
                  a = k ? m[0] : 1,
                  b = m[1] || 0,
                  c = m[2] || 0,
                  d = k ? m[3] : 1;
              tm.x = m[4] || 0;
              tm.y = m[5] || 0;
              scaleX = Math.sqrt(a * a + b * b);
              scaleY = Math.sqrt(d * d + c * c);
              rotation = (a || b) ? Math.atan2(b, a) * _RAD2DEG : tm.rotation || 0; //note: if scaleX is 0, we cannot accurately measure rotation. Same for skewX with a scaleY of 0. Therefore, we default to the previously recorded value (or zero if that doesn't exist).
              skewX = (c || d) ? Math.atan2(c, d) * _RAD2DEG + rotation : tm.skewX || 0;
              tm.scaleX = scaleX;
              tm.scaleY = scaleY;
              tm.rotation = rotation;
              tm.skewX = skewX;
              if (_supports3D) {
                tm.rotationX = tm.rotationY = tm.z = 0;
                tm.perspective = defaultTransformPerspective;
                tm.scaleZ = 1;
              }
              if (tm.svg) {
                tm.x -= tm.xOrigin - (tm.xOrigin * a + tm.yOrigin * c);
                tm.y -= tm.yOrigin - (tm.xOrigin * b + tm.yOrigin * d);
              }
            }
            if (Math.abs(tm.skewX) > 90 && Math.abs(tm.skewX) < 270) {
              if (invX) {
                tm.scaleX *= -1;
                tm.skewX += (tm.rotation <= 0) ? 180 : -180;
                tm.rotation += (tm.rotation <= 0) ? 180 : -180;
              } else {
                tm.scaleY *= -1;
                tm.skewX += (tm.skewX <= 0) ? 180 : -180;
              }
            }
            tm.zOrigin = zOrigin;
            //some browsers have a hard time with very small values like 2.4492935982947064e-16 (notice the "e-" towards the end) and would render the object slightly off. So we round to 0 in these cases. The conditional logic here is faster than calling Math.abs(). Also, browsers tend to render a SLIGHTLY rotated object in a fuzzy way, so we need to snap to exactly 0 when appropriate.
            for (i in tm) {
              if (tm[i] < min) {
                if (tm[i] > -min) {
                  tm[i] = 0;
                }
              }
            }
          }
          //DEBUG: _log("parsed rotation of " + t.getAttribute("id")+": "+(tm.rotationX)+", "+(tm.rotationY)+", "+(tm.rotation)+", scale: "+tm.scaleX+", "+tm.scaleY+", "+tm.scaleZ+", position: "+tm.x+", "+tm.y+", "+tm.z+", perspective: "+tm.perspective+ ", origin: "+ tm.xOrigin+ ","+ tm.yOrigin);
          if (rec) {
            t._gsTransform = tm; //record to the object's _gsTransform which we use so that tweens can control individual properties independently (we need all the properties to accurately recompose the matrix in the setRatio() method)
            if (tm.svg) { //if we're supposed to apply transforms to the SVG element's "transform" attribute, make sure there aren't any CSS transforms applied or they'll override the attribute ones. Also clear the transform attribute if we're using CSS, just to be clean.
              if (_useSVGTransformAttr && t.style[_transformProp]) {
                TweenLite.delayedCall(0.001, function () { //if we apply this right away (before anything has rendered), we risk there being no transforms for a brief moment and it also interferes with adjusting the transformOrigin in a tween with immediateRender:true (it'd try reading the matrix and it wouldn't have the appropriate data in place because we just removed it).
                  _removeProp(t.style, _transformProp);
                });
              } else if (!_useSVGTransformAttr && t.getAttribute("transform")) {
                TweenLite.delayedCall(0.001, function () {
                  t.removeAttribute("transform");
                });
              }
            }
          }
          return tm;
        },

        //for setting 2D transforms in IE6, IE7, and IE8 (must use a "filter" to emulate the behavior of modern day browser transforms)
        _setIETransformRatio = function (v) {
          var t = this.data, //refers to the element's _gsTransform object
              ang = -t.rotation * _DEG2RAD,
              skew = ang + t.skewX * _DEG2RAD,
              rnd = 100000,
              a = ((Math.cos(ang) * t.scaleX * rnd) | 0) / rnd,
              b = ((Math.sin(ang) * t.scaleX * rnd) | 0) / rnd,
              c = ((Math.sin(skew) * -t.scaleY * rnd) | 0) / rnd,
              d = ((Math.cos(skew) * t.scaleY * rnd) | 0) / rnd,
              style = this.t.style,
              cs = this.t.currentStyle,
              filters, val;
          if (!cs) {
            return;
          }
          val = b; //just for swapping the variables an inverting them (reused "val" to avoid creating another variable in memory). IE's filter matrix uses a non-standard matrix configuration (angle goes the opposite way, and b and c are reversed and inverted)
          b = -c;
          c = -val;
          filters = cs.filter;
          style.filter = ""; //remove filters so that we can accurately measure offsetWidth/offsetHeight
          var w = this.t.offsetWidth,
              h = this.t.offsetHeight,
              clip = (cs.position !== "absolute"),
              m = "progid:DXImageTransform.Microsoft.Matrix(M11=" + a + ", M12=" + b + ", M21=" + c + ", M22=" + d,
              ox = t.x + (w * t.xPercent / 100),
              oy = t.y + (h * t.yPercent / 100),
              dx, dy;

          //if transformOrigin is being used, adjust the offset x and y
          if (t.ox != null) {
            dx = ((t.oxp) ? w * t.ox * 0.01 : t.ox) - w / 2;
            dy = ((t.oyp) ? h * t.oy * 0.01 : t.oy) - h / 2;
            ox += dx - (dx * a + dy * b);
            oy += dy - (dx * c + dy * d);
          }

          if (!clip) {
            m += ", sizingMethod='auto expand')";
          } else {
            dx = (w / 2);
            dy = (h / 2);
            //translate to ensure that transformations occur around the correct origin (default is center).
            m += ", Dx=" + (dx - (dx * a + dy * b) + ox) + ", Dy=" + (dy - (dx * c + dy * d) + oy) + ")";
          }
          if (filters.indexOf("DXImageTransform.Microsoft.Matrix(") !== -1) {
            style.filter = filters.replace(_ieSetMatrixExp, m);
          } else {
            style.filter = m + " " + filters; //we must always put the transform/matrix FIRST (before alpha(opacity=xx)) to avoid an IE bug that slices part of the object when rotation is applied with alpha.
          }

          //at the end or beginning of the tween, if the matrix is normal (1, 0, 0, 1) and opacity is 100 (or doesn't exist), remove the filter to improve browser performance.
          if (v === 0 || v === 1) {
            if (a === 1) {
              if (b === 0) {
                if (c === 0) {
                  if (d === 1) {
                    if (!clip || m.indexOf("Dx=0, Dy=0")
                        !== -1) {
                      if (!_opacityExp.test(filters) || parseFloat(RegExp.$1) === 100) {
                        if (filters.indexOf("gradient("
                                && filters.indexOf("Alpha")) === -1) {
                          style.removeAttribute("filter");
                        }
                      }
                    }
                  }
                }
              }
            }
          }

          //we must set the margins AFTER applying the filter in order to avoid some bugs in IE8 that could (in rare scenarios) cause them to be ignored intermittently (vibration).
          if (!clip) {
            var mult = (_ieVers < 8) ? 1 : -1, //in Internet Explorer 7 and before, the box model is broken, causing the browser to treat the width/height of the actual rotated filtered image as the width/height of the box itself, but Microsoft corrected that in IE8. We must use a negative offset in IE8 on the right/bottom
                marg, prop, dif;
            dx = t.ieOffsetX || 0;
            dy = t.ieOffsetY || 0;
            t.ieOffsetX = Math.round((w - ((a < 0 ? -a : a) * w + (b < 0 ? -b : b) * h)) / 2 + ox);
            t.ieOffsetY = Math.round((h - ((d < 0 ? -d : d) * h + (c < 0 ? -c : c) * w)) / 2 + oy);
            for (i = 0; i < 4; i++) {
              prop = _margins[i];
              marg = cs[prop];
              //we need to get the current margin in case it is being tweened separately (we want to respect that tween's changes)
              val = (marg.indexOf("px") !== -1) ? parseFloat(marg) : _convertToPixels(this.t, prop, parseFloat(marg),
                  marg.replace(_suffixExp, "")) || 0;
              if (val !== t[prop]) {
                dif = (i < 2) ? -t.ieOffsetX : -t.ieOffsetY; //if another tween is controlling a margin, we cannot only apply the difference in the ieOffsets, so we essentially zero-out the dx and dy here in that case. We record the margin(s) later so that we can keep comparing them, making this code very flexible.
              } else {
                dif = (i < 2) ? dx - t.ieOffsetX : dy - t.ieOffsetY;
              }
              style[prop] = (t[prop] = Math.round(val - dif * ((i === 0 || i === 2) ? 1 : mult))) + "px";
            }
          }
        },

        /* translates a super small decimal to a string WITHOUT scientific notation
			_safeDecimal = function(n) {
				var s = (n < 0 ? -n : n) + "",
					a = s.split("e-");
				return (n < 0 ? "-0." : "0.") + new Array(parseInt(a[1], 10) || 0).join("0") + a[0].split(".").join("");
			},
			*/

        _setTransformRatio = _internals.set3DTransformRatio = _internals.setTransformRatio = function (v) {
          var t = this.data, //refers to the element's _gsTransform object
              style = this.t.style,
              angle = t.rotation,
              rotationX = t.rotationX,
              rotationY = t.rotationY,
              sx = t.scaleX,
              sy = t.scaleY,
              sz = t.scaleZ,
              x = t.x,
              y = t.y,
              z = t.z,
              isSVG = t.svg,
              perspective = t.perspective,
              force3D = t.force3D,
              skewY = t.skewY,
              skewX = t.skewX,
              t1, a11, a12, a13, a21, a22, a23, a31, a32, a33, a41, a42, a43,
              zOrigin, min, cos, sin, t2, transform, comma, zero, skew, rnd;
          if (skewY) { //for performance reasons, we combine all skewing into the skewX and rotation values. Remember, a skewY of 10 degrees looks the same as a rotation of 10 degrees plus a skewX of 10 degrees.
            skewX += skewY;
            angle += skewY;
          }

          //check to see if we should render as 2D (and SVGs must use 2D when _useSVGTransformAttr is true)
          if (((((v === 1 || v === 0) && force3D === "auto" && (this.tween._totalTime === this.tween._totalDuration
                  || !this.tween._totalTime)) || !force3D) && !z && !perspective && !rotationY && !rotationX && sz === 1)
              || (_useSVGTransformAttr && isSVG) || !_supports3D) { //on the final render (which could be 0 for a from tween), if there are no 3D aspects, render in 2D to free up memory and improve performance especially on mobile devices. Check the tween's totalTime/totalDuration too in order to make sure it doesn't happen between repeats if it's a repeating tween.

            //2D
            if (angle || skewX || isSVG) {
              angle *= _DEG2RAD;
              skew = skewX * _DEG2RAD;
              rnd = 100000;
              a11 = Math.cos(angle) * sx;
              a21 = Math.sin(angle) * sx;
              a12 = Math.sin(angle - skew) * -sy;
              a22 = Math.cos(angle - skew) * sy;
              if (skew && t.skewType === "simple") { //by default, we compensate skewing on the other axis to make it look more natural, but you can set the skewType to "simple" to use the uncompensated skewing that CSS does
                t1 = Math.tan(skew - skewY * _DEG2RAD);
                t1 = Math.sqrt(1 + t1 * t1);
                a12 *= t1;
                a22 *= t1;
                if (skewY) {
                  t1 = Math.tan(skewY * _DEG2RAD);
                  t1 = Math.sqrt(1 + t1 * t1);
                  a11 *= t1;
                  a21 *= t1;
                }
              }
              if (isSVG) {
                x += t.xOrigin - (t.xOrigin * a11 + t.yOrigin * a12) + t.xOffset;
                y += t.yOrigin - (t.xOrigin * a21 + t.yOrigin * a22) + t.yOffset;
                if (_useSVGTransformAttr && (t.xPercent || t.yPercent)) { //The SVG spec doesn't support percentage-based translation in the "transform" attribute, so we merge it into the matrix to simulate it.
                  min = this.t.getBBox();
                  x += t.xPercent * 0.01 * min.width;
                  y += t.yPercent * 0.01 * min.height;
                }
                min = 0.000001;
                if (x < min) {
                  if (x > -min) {
                    x = 0;
                  }
                }
                if (y < min) {
                  if (y > -min) {
                    y = 0;
                  }
                }
              }
              transform = (((a11 * rnd) | 0) / rnd) + "," + (((a21 * rnd) | 0) / rnd) + "," + (((a12 * rnd) | 0) / rnd) + "," + (((a22
                  * rnd) | 0) / rnd) + "," + x + "," + y + ")";
              if (isSVG && _useSVGTransformAttr) {
                this.t.setAttribute("transform", "matrix(" + transform);
              } else {
                //some browsers have a hard time with very small values like 2.4492935982947064e-16 (notice the "e-" towards the end) and would render the object slightly off. So we round to 5 decimal places.
                style[_transformProp] = ((t.xPercent || t.yPercent) ? "translate(" + t.xPercent + "%," + t.yPercent + "%) matrix("
                    : "matrix(") + transform;
              }
            } else {
              style[_transformProp] = ((t.xPercent || t.yPercent) ? "translate(" + t.xPercent + "%," + t.yPercent + "%) matrix("
                  : "matrix(") + sx + ",0,0," + sy + "," + x + "," + y + ")";
            }
            return;

          }
          if (_isFirefox) { //Firefox has a bug (at least in v25) that causes it to render the transparent part of 32-bit PNG images as black when displayed inside an iframe and the 3D scale is very small and doesn't change sufficiently enough between renders (like if you use a Power4.easeInOut to scale from 0 to 1 where the beginning values only change a tiny amount to begin the tween before accelerating). In this case, we force the scale to be 0.00002 instead which is visually the same but works around the Firefox issue.
            min = 0.0001;
            if (sx < min && sx > -min) {
              sx = sz = 0.00002;
            }
            if (sy < min && sy > -min) {
              sy = sz = 0.00002;
            }
            if (perspective && !t.z && !t.rotationX && !t.rotationY) { //Firefox has a bug that causes elements to have an odd super-thin, broken/dotted black border on elements that have a perspective set but aren't utilizing 3D space (no rotationX, rotationY, or z).
              perspective = 0;
            }
          }
          if (angle || skewX) {
            angle *= _DEG2RAD;
            cos = a11 = Math.cos(angle);
            sin = a21 = Math.sin(angle);
            if (skewX) {
              angle -= skewX * _DEG2RAD;
              cos = Math.cos(angle);
              sin = Math.sin(angle);
              if (t.skewType === "simple") { //by default, we compensate skewing on the other axis to make it look more natural, but you can set the skewType to "simple" to use the uncompensated skewing that CSS does
                t1 = Math.tan((skewX - skewY) * _DEG2RAD);
                t1 = Math.sqrt(1 + t1 * t1);
                cos *= t1;
                sin *= t1;
                if (t.skewY) {
                  t1 = Math.tan(skewY * _DEG2RAD);
                  t1 = Math.sqrt(1 + t1 * t1);
                  a11 *= t1;
                  a21 *= t1;
                }
              }
            }
            a12 = -sin;
            a22 = cos;

          } else if (!rotationY && !rotationX && sz === 1 && !perspective && !isSVG) { //if we're only translating and/or 2D scaling, this is faster...
            style[_transformProp] = ((t.xPercent || t.yPercent) ? "translate(" + t.xPercent + "%," + t.yPercent + "%) translate3d("
                : "translate3d(") + x + "px," + y + "px," + z + "px)" + ((sx !== 1 || sy !== 1) ? " scale(" + sx + "," + sy + ")" : "");
            return;
          } else {
            a11 = a22 = 1;
            a12 = a21 = 0;
          }
          // KEY  INDEX   AFFECTS a[row][column]
          // a11  0       rotation, rotationY, scaleX
          // a21  1       rotation, rotationY, scaleX
          // a31  2       rotationY, scaleX
          // a41  3       rotationY, scaleX
          // a12  4       rotation, skewX, rotationX, scaleY
          // a22  5       rotation, skewX, rotationX, scaleY
          // a32  6       rotationX, scaleY
          // a42  7       rotationX, scaleY
          // a13  8       rotationY, rotationX, scaleZ
          // a23  9       rotationY, rotationX, scaleZ
          // a33  10      rotationY, rotationX, scaleZ
          // a43  11      rotationY, rotationX, perspective, scaleZ
          // a14  12      x, zOrigin, svgOrigin
          // a24  13      y, zOrigin, svgOrigin
          // a34  14      z, zOrigin
          // a44  15
          // rotation: Math.atan2(a21, a11)
          // rotationY: Math.atan2(a13, a33) (or Math.atan2(a13, a11))
          // rotationX: Math.atan2(a32, a33)
          a33 = 1;
          a13 = a23 = a31 = a32 = a41 = a42 = 0;
          a43 = (perspective) ? -1 / perspective : 0;
          zOrigin = t.zOrigin;
          min = 0.000001; //threshold below which browsers use scientific notation which won't work.
          comma = ",";
          zero = "0";
          angle = rotationY * _DEG2RAD;
          if (angle) {
            cos = Math.cos(angle);
            sin = Math.sin(angle);
            a31 = -sin;
            a41 = a43 * -sin;
            a13 = a11 * sin;
            a23 = a21 * sin;
            a33 = cos;
            a43 *= cos;
            a11 *= cos;
            a21 *= cos;
          }
          angle = rotationX * _DEG2RAD;
          if (angle) {
            cos = Math.cos(angle);
            sin = Math.sin(angle);
            t1 = a12 * cos + a13 * sin;
            t2 = a22 * cos + a23 * sin;
            a32 = a33 * sin;
            a42 = a43 * sin;
            a13 = a12 * -sin + a13 * cos;
            a23 = a22 * -sin + a23 * cos;
            a33 = a33 * cos;
            a43 = a43 * cos;
            a12 = t1;
            a22 = t2;
          }
          if (sz !== 1) {
            a13 *= sz;
            a23 *= sz;
            a33 *= sz;
            a43 *= sz;
          }
          if (sy !== 1) {
            a12 *= sy;
            a22 *= sy;
            a32 *= sy;
            a42 *= sy;
          }
          if (sx !== 1) {
            a11 *= sx;
            a21 *= sx;
            a31 *= sx;
            a41 *= sx;
          }

          if (zOrigin || isSVG) {
            if (zOrigin) {
              x += a13 * -zOrigin;
              y += a23 * -zOrigin;
              z += a33 * -zOrigin + zOrigin;
            }
            if (isSVG) { //due to bugs in some browsers, we need to manage the transform-origin of SVG manually
              x += t.xOrigin - (t.xOrigin * a11 + t.yOrigin * a12) + t.xOffset;
              y += t.yOrigin - (t.xOrigin * a21 + t.yOrigin * a22) + t.yOffset;
            }
            if (x < min && x > -min) {
              x = zero;
            }
            if (y < min && y > -min) {
              y = zero;
            }
            if (z < min && z > -min) {
              z = 0; //don't use string because we calculate perspective later and need the number.
            }
          }

          //optimized way of concatenating all the values into a string. If we do it all in one shot, it's slower because of the way browsers have to create temp strings and the way it affects memory. If we do it piece-by-piece with +=, it's a bit slower too. We found that doing it in these sized chunks works best overall:
          transform = ((t.xPercent || t.yPercent) ? "translate(" + t.xPercent + "%," + t.yPercent + "%) matrix3d(" : "matrix3d(");
          transform += ((a11 < min && a11 > -min) ? zero : a11) + comma + ((a21 < min && a21 > -min) ? zero : a21) + comma + ((a31 < min
              && a31 > -min) ? zero : a31);
          transform += comma + ((a41 < min && a41 > -min) ? zero : a41) + comma + ((a12 < min && a12 > -min) ? zero : a12) + comma
              + ((a22 < min && a22 > -min) ? zero : a22);
          if (rotationX || rotationY || sz !== 1) { //performance optimization (often there's no rotationX or rotationY, so we can skip these calculations)
            transform += comma + ((a32 < min && a32 > -min) ? zero : a32) + comma + ((a42 < min && a42 > -min) ? zero : a42) + comma
                + ((a13 < min && a13 > -min) ? zero : a13);
            transform += comma + ((a23 < min && a23 > -min) ? zero : a23) + comma + ((a33 < min && a33 > -min) ? zero : a33) + comma
                + ((a43 < min && a43 > -min) ? zero : a43) + comma;
          } else {
            transform += ",0,0,0,0,1,0,";
          }
          transform += x + comma + y + comma + z + comma + (perspective ? (1 + (-z / perspective)) : 1) + ")";

          style[_transformProp] = transform;
        };

    p = Transform.prototype;
    p.x = p.y = p.z = p.skewX = p.skewY = p.rotation = p.rotationX = p.rotationY = p.zOrigin = p.xPercent = p.yPercent = p.xOffset = p.yOffset = 0;
    p.scaleX = p.scaleY = p.scaleZ = 1;

    _registerComplexSpecialProp(
        "transform,scale,scaleX,scaleY,scaleZ,x,y,z,rotation,rotationX,rotationY,rotationZ,skewX,skewY,shortRotation,shortRotationX,shortRotationY,shortRotationZ,transformOrigin,svgOrigin,transformPerspective,directionalRotation,parseTransform,force3D,skewType,xPercent,yPercent,smoothOrigin",
        {
          parser: function (t, e, parsingProp, cssp, pt, plugin, vars) {
            if (cssp._lastParsedTransform === vars) {
              return pt;
            } //only need to parse the transform once, and only if the browser supports it.
            cssp._lastParsedTransform = vars;
            var scaleFunc = (vars.scale && typeof(vars.scale) === "function") ? vars.scale : 0, //if there's a function-based "scale" value, swap in the resulting numeric value temporarily. Otherwise, if it's called for both scaleX and scaleY independently, they may not match (like if the function uses Math.random()).
                swapFunc;
            if (typeof(vars[parsingProp]) === "function") { //whatever property triggers the initial parsing might be a function-based value in which case it already got called in parse(), thus we don't want to call it again in here. The most efficient way to avoid this is to temporarily swap the value directly into the vars object, and then after we do all our parsing in this function, we'll swap it back again.
              swapFunc = vars[parsingProp];
              vars[parsingProp] = e;
            }
            if (scaleFunc) {
              vars.scale = scaleFunc(_index, t);
            }
            var originalGSTransform = t._gsTransform,
                style = t.style,
                min = 0.000001,
                i = _transformProps.length,
                v = vars,
                endRotations = {},
                transformOriginString = "transformOrigin",
                m1 = _getTransform(t, _cs, true, v.parseTransform),
                orig = v.transform && ((typeof(v.transform) === "function") ? v.transform(_index, _target) : v.transform),
                m2, copy, has3D, hasChange, dr, x, y, matrix, p;
            m1.skewType = v.skewType || m1.skewType || CSSPlugin.defaultSkewType;
            cssp._transform = m1;
            if (orig && typeof(orig) === "string" && _transformProp) { //for values like transform:"rotate(60deg) scale(0.5, 0.8)"
              copy = _tempDiv.style; //don't use the original target because it might be SVG in which case some browsers don't report computed style correctly.
              copy[_transformProp] = orig;
              copy.display = "block"; //if display is "none", the browser often refuses to report the transform properties correctly.
              copy.position = "absolute";
              _doc.body.appendChild(_tempDiv);
              m2 = _getTransform(_tempDiv, null, false);
              if (m1.skewType === "simple") { //the default _getTransform() reports the skewX/scaleY as if skewType is "compensated", thus we need to adjust that here if skewType is "simple".
                m2.scaleY *= Math.cos(m2.skewX * _DEG2RAD);
              }
              if (m1.svg) { //if it's an SVG element, x/y part of the matrix will be affected by whatever we use as the origin and the offsets, so compensate here...
                x = m1.xOrigin;
                y = m1.yOrigin;
                m2.x -= m1.xOffset;
                m2.y -= m1.yOffset;
                if (v.transformOrigin || v.svgOrigin) { //if this tween is altering the origin, we must factor that in here. The actual work of recording the transformOrigin values and setting up the PropTween is done later (still inside this function) so we cannot leave the changes intact here - we only want to update the x/y accordingly.
                  orig = {};
                  _parseSVGOrigin(t, _parsePosition(v.transformOrigin), orig, v.svgOrigin, v.smoothOrigin, true);
                  x = orig.xOrigin;
                  y = orig.yOrigin;
                  m2.x -= orig.xOffset - m1.xOffset;
                  m2.y -= orig.yOffset - m1.yOffset;
                }
                if (x || y) {
                  matrix = _getMatrix(_tempDiv, true);
                  m2.x -= x - (x * matrix[0] + y * matrix[2]);
                  m2.y -= y - (x * matrix[1] + y * matrix[3]);
                }
              }
              _doc.body.removeChild(_tempDiv);
              if (!m2.perspective) {
                m2.perspective = m1.perspective; //tweening to no perspective gives very unintuitive results - just keep the same perspective in that case.
              }
              if (v.xPercent != null) {
                m2.xPercent = _parseVal(v.xPercent, m1.xPercent);
              }
              if (v.yPercent != null) {
                m2.yPercent = _parseVal(v.yPercent, m1.yPercent);
              }
            } else if (typeof(v) === "object") { //for values like scaleX, scaleY, rotation, x, y, skewX, and skewY or transform:{...} (object)
              m2 = {
                scaleX: _parseVal((v.scaleX != null) ? v.scaleX : v.scale, m1.scaleX),
                scaleY: _parseVal((v.scaleY != null) ? v.scaleY : v.scale, m1.scaleY),
                scaleZ: _parseVal(v.scaleZ, m1.scaleZ),
                x: _parseVal(v.x, m1.x),
                y: _parseVal(v.y, m1.y),
                z: _parseVal(v.z, m1.z),
                xPercent: _parseVal(v.xPercent, m1.xPercent),
                yPercent: _parseVal(v.yPercent, m1.yPercent),
                perspective: _parseVal(v.transformPerspective, m1.perspective)
              };
              dr = v.directionalRotation;
              if (dr != null) {
                if (typeof(dr) === "object") {
                  for (copy in dr) {
                    v[copy] = dr[copy];
                  }
                } else {
                  v.rotation = dr;
                }
              }
              if (typeof(v.x) === "string" && v.x.indexOf("%") !== -1) {
                m2.x = 0;
                m2.xPercent = _parseVal(v.x, m1.xPercent);
              }
              if (typeof(v.y) === "string" && v.y.indexOf("%") !== -1) {
                m2.y = 0;
                m2.yPercent = _parseVal(v.y, m1.yPercent);
              }

              m2.rotation = _parseAngle(
                  ("rotation" in v) ? v.rotation : ("shortRotation" in v) ? v.shortRotation + "_short" : ("rotationZ" in v)
                      ? v.rotationZ : m1.rotation, m1.rotation, "rotation", endRotations);
              if (_supports3D) {
                m2.rotationX = _parseAngle(
                    ("rotationX" in v) ? v.rotationX : ("shortRotationX" in v) ? v.shortRotationX + "_short" : m1.rotationX || 0,
                    m1.rotationX, "rotationX", endRotations);
                m2.rotationY = _parseAngle(
                    ("rotationY" in v) ? v.rotationY : ("shortRotationY" in v) ? v.shortRotationY + "_short" : m1.rotationY || 0,
                    m1.rotationY, "rotationY", endRotations);
              }
              m2.skewX = _parseAngle(v.skewX, m1.skewX);
              m2.skewY = _parseAngle(v.skewY, m1.skewY);
            }
            if (_supports3D && v.force3D != null) {
              m1.force3D = v.force3D;
              hasChange = true;
            }

            has3D = (m1.force3D || m1.z || m1.rotationX || m1.rotationY || m2.z || m2.rotationX || m2.rotationY || m2.perspective);
            if (!has3D && v.scale != null) {
              m2.scaleZ = 1; //no need to tween scaleZ.
            }

            while (--i > -1) {
              p = _transformProps[i];
              orig = m2[p] - m1[p];
              if (orig > min || orig < -min || v[p] != null || _forcePT[p] != null) {
                hasChange = true;
                pt = new CSSPropTween(m1, p, m1[p], orig, pt);
                if (p in endRotations) {
                  pt.e = endRotations[p]; //directional rotations typically have compensated values during the tween, but we need to make sure they end at exactly what the user requested
                }
                pt.xs0 = 0; //ensures the value stays numeric in setRatio()
                pt.plugin = plugin;
                cssp._overwriteProps.push(pt.n);
              }
            }

            orig = v.transformOrigin;
            if (m1.svg && (orig || v.svgOrigin)) {
              x = m1.xOffset; //when we change the origin, in order to prevent things from jumping we adjust the x/y so we must record those here so that we can create PropTweens for them and flip them at the same time as the origin
              y = m1.yOffset;
              _parseSVGOrigin(t, _parsePosition(orig), m2, v.svgOrigin, v.smoothOrigin);
              pt = _addNonTweeningNumericPT(m1, "xOrigin", (originalGSTransform ? m1 : m2).xOrigin, m2.xOrigin, pt,
                  transformOriginString); //note: if there wasn't a transformOrigin defined yet, just start with the destination one; it's wasteful otherwise, and it causes problems with fromTo() tweens. For example, TweenLite.to("#wheel", 3, {rotation:180, transformOrigin:"50% 50%", delay:1}); TweenLite.fromTo("#wheel", 3, {scale:0.5, transformOrigin:"50% 50%"}, {scale:1, delay:2}); would cause a jump when the from values revert at the beginning of the 2nd tween.
              pt = _addNonTweeningNumericPT(m1, "yOrigin", (originalGSTransform ? m1 : m2).yOrigin, m2.yOrigin, pt,
                  transformOriginString);
              if (x !== m1.xOffset || y !== m1.yOffset) {
                pt = _addNonTweeningNumericPT(m1, "xOffset", (originalGSTransform ? x : m1.xOffset), m1.xOffset, pt,
                    transformOriginString);
                pt = _addNonTweeningNumericPT(m1, "yOffset", (originalGSTransform ? y : m1.yOffset), m1.yOffset, pt,
                    transformOriginString);
              }
              orig = "0px 0px"; //certain browsers (like firefox) completely botch transform-origin, so we must remove it to prevent it from contaminating transforms. We manage it ourselves with xOrigin and yOrigin
            }
            if (orig || (_supports3D && has3D && m1.zOrigin)) { //if anything 3D is happening and there's a transformOrigin with a z component that's non-zero, we must ensure that the transformOrigin's z-component is set to 0 so that we can manually do those calculations to get around Safari bugs. Even if the user didn't specifically define a "transformOrigin" in this particular tween (maybe they did it via css directly).
              if (_transformProp) {
                hasChange = true;
                p = _transformOriginProp;
                orig = (orig || _getStyle(t, p, _cs, false, "50% 50%")) + ""; //cast as string to avoid errors
                pt = new CSSPropTween(style, p, 0, 0, pt, -1, transformOriginString);
                pt.b = style[p];
                pt.plugin = plugin;
                if (_supports3D) {
                  copy = m1.zOrigin;
                  orig = orig.split(" ");
                  m1.zOrigin = ((orig.length > 2 && !(copy !== 0 && orig[2] === "0px")) ? parseFloat(orig[2]) : copy) || 0; //Safari doesn't handle the z part of transformOrigin correctly, so we'll manually handle it in the _set3DTransformRatio() method.
                  pt.xs0 = pt.e = orig[0] + " " + (orig[1] || "50%") + " 0px"; //we must define a z value of 0px specifically otherwise iOS 5 Safari will stick with the old one (if one was defined)!
                  pt = new CSSPropTween(m1, "zOrigin", 0, 0, pt, -1, pt.n); //we must create a CSSPropTween for the _gsTransform.zOrigin so that it gets reset properly at the beginning if the tween runs backward (as opposed to just setting m1.zOrigin here)
                  pt.b = copy;
                  pt.xs0 = pt.e = m1.zOrigin;
                } else {
                  pt.xs0 = pt.e = orig;
                }

                //for older versions of IE (6-8), we need to manually calculate things inside the setRatio() function. We record origin x and y (ox and oy) and whether or not the values are percentages (oxp and oyp).
              } else {
                _parsePosition(orig + "", m1);
              }
            }
            if (hasChange) {
              cssp._transformType = (!(m1.svg && _useSVGTransformAttr) && (has3D || this._transformType === 3)) ? 3 : 2; //quicker than calling cssp._enableTransforms();
            }
            if (swapFunc) {
              vars[parsingProp] = swapFunc;
            }
            if (scaleFunc) {
              vars.scale = scaleFunc;
            }
            return pt;
          }, prefix: true
        });

    _registerComplexSpecialProp("boxShadow", {
      defaultValue: "0px 0px 0px 0px #999",
      prefix: true,
      color: true,
      multi: true,
      keyword: "inset"
    });

    _registerComplexSpecialProp("borderRadius", {
      defaultValue: "0px", parser: function (t, e, p, cssp, pt, plugin) {
        e = this.format(e);
        var props = ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"],
            style = t.style,
            ea1, i, es2, bs2, bs, es, bn, en, w, h, esfx, bsfx, rel, hn, vn, em;
        w = parseFloat(t.offsetWidth);
        h = parseFloat(t.offsetHeight);
        ea1 = e.split(" ");
        for (i = 0; i < props.length; i++) { //if we're dealing with percentages, we must convert things separately for the horizontal and vertical axis!
          if (this.p.indexOf("border")) { //older browsers used a prefix
            props[i] = _checkPropPrefix(props[i]);
          }
          bs = bs2 = _getStyle(t, props[i], _cs, false, "0px");
          if (bs.indexOf(" ") !== -1) {
            bs2 = bs.split(" ");
            bs = bs2[0];
            bs2 = bs2[1];
          }
          es = es2 = ea1[i];
          bn = parseFloat(bs);
          bsfx = bs.substr((bn + "").length);
          rel = (es.charAt(1) === "=");
          if (rel) {
            en = parseInt(es.charAt(0) + "1", 10);
            es = es.substr(2);
            en *= parseFloat(es);
            esfx = es.substr((en + "").length - (en < 0 ? 1 : 0)) || "";
          } else {
            en = parseFloat(es);
            esfx = es.substr((en + "").length);
          }
          if (esfx === "") {
            esfx = _suffixMap[p] || bsfx;
          }
          if (esfx !== bsfx) {
            hn = _convertToPixels(t, "borderLeft", bn, bsfx); //horizontal number (we use a bogus "borderLeft" property just because the _convertToPixels() method searches for the keywords "Left", "Right", "Top", and "Bottom" to determine of it's a horizontal or vertical property, and we need "border" in the name so that it knows it should measure relative to the element itself, not its parent.
            vn = _convertToPixels(t, "borderTop", bn, bsfx); //vertical number
            if (esfx === "%") {
              bs = (hn / w * 100) + "%";
              bs2 = (vn / h * 100) + "%";
            } else if (esfx === "em") {
              em = _convertToPixels(t, "borderLeft", 1, "em");
              bs = (hn / em) + "em";
              bs2 = (vn / em) + "em";
            } else {
              bs = hn + "px";
              bs2 = vn + "px";
            }
            if (rel) {
              es = (parseFloat(bs) + en) + esfx;
              es2 = (parseFloat(bs2) + en) + esfx;
            }
          }
          pt = _parseComplex(style, props[i], bs + " " + bs2, es + " " + es2, false, "0px", pt);
        }
        return pt;
      }, prefix: true, formatter: _getFormatter("0px 0px 0px 0px", false, true)
    });
    _registerComplexSpecialProp("borderBottomLeftRadius,borderBottomRightRadius,borderTopLeftRadius,borderTopRightRadius", {
      defaultValue: "0px", parser: function (t, e, p, cssp, pt, plugin) {
        return _parseComplex(t.style, p, this.format(_getStyle(t, p, _cs, false, "0px 0px")), this.format(e), false, "0px", pt);
      }, prefix: true, formatter: _getFormatter("0px 0px", false, true)
    });
    _registerComplexSpecialProp("backgroundPosition", {
      defaultValue: "0 0", parser: function (t, e, p, cssp, pt, plugin) {
        var bp = "background-position",
            cs = (_cs || _getComputedStyle(t, null)),
            bs = this.format(((cs) ? _ieVers ? cs.getPropertyValue(bp + "-x") + " " + cs.getPropertyValue(bp + "-y")
                : cs.getPropertyValue(bp) : t.currentStyle.backgroundPositionX + " " + t.currentStyle.backgroundPositionY) || "0 0"), //Internet Explorer doesn't report background-position correctly - we must query background-position-x and background-position-y and combine them (even in IE10). Before IE9, we must do the same with the currentStyle object and use camelCase
            es = this.format(e),
            ba, ea, i, pct, overlap, src;
        if ((bs.indexOf("%") !== -1) !== (es.indexOf("%") !== -1) && es.split(",").length < 2) {
          src = _getStyle(t, "backgroundImage").replace(_urlExp, "");
          if (src && src !== "none") {
            ba = bs.split(" ");
            ea = es.split(" ");
            _tempImg.setAttribute("src", src); //set the temp IMG's src to the background-image so that we can measure its width/height
            i = 2;
            while (--i > -1) {
              bs = ba[i];
              pct = (bs.indexOf("%") !== -1);
              if (pct !== (ea[i].indexOf("%") !== -1)) {
                overlap = (i === 0) ? t.offsetWidth - _tempImg.width : t.offsetHeight - _tempImg.height;
                ba[i] = pct ? (parseFloat(bs) / 100 * overlap) + "px" : (parseFloat(bs) / overlap * 100) + "%";
              }
            }
            bs = ba.join(" ");
          }
        }
        return this.parseComplex(t.style, bs, es, pt, plugin);
      }, formatter: _parsePosition
    });
    _registerComplexSpecialProp("backgroundSize", {
      defaultValue: "0 0", formatter: function (v) {
        v += ""; //ensure it's a string
        return _parsePosition(v.indexOf(" ") === -1 ? v + " " + v : v); //if set to something like "100% 100%", Safari typically reports the computed style as just "100%" (no 2nd value), but we should ensure that there are two values, so copy the first one. Otherwise, it'd be interpreted as "100% 0" (wrong).
      }
    });
    _registerComplexSpecialProp("perspective", {defaultValue: "0px", prefix: true});
    _registerComplexSpecialProp("perspectiveOrigin", {defaultValue: "50% 50%", prefix: true});
    _registerComplexSpecialProp("transformStyle", {prefix: true});
    _registerComplexSpecialProp("backfaceVisibility", {prefix: true});
    _registerComplexSpecialProp("userSelect", {prefix: true});
    _registerComplexSpecialProp("margin", {parser: _getEdgeParser("marginTop,marginRight,marginBottom,marginLeft")});
    _registerComplexSpecialProp("padding", {parser: _getEdgeParser("paddingTop,paddingRight,paddingBottom,paddingLeft")});
    _registerComplexSpecialProp("clip", {
      defaultValue: "rect(0px,0px,0px,0px)", parser: function (t, e, p, cssp, pt, plugin) {
        var b, cs, delim;
        if (_ieVers < 9) { //IE8 and earlier don't report a "clip" value in the currentStyle - instead, the values are split apart into clipTop, clipRight, clipBottom, and clipLeft. Also, in IE7 and earlier, the values inside rect() are space-delimited, not comma-delimited.
          cs = t.currentStyle;
          delim = _ieVers < 8 ? " " : ",";
          b = "rect(" + cs.clipTop + delim + cs.clipRight + delim + cs.clipBottom + delim + cs.clipLeft + ")";
          e = this.format(e).split(",").join(delim);
        } else {
          b = this.format(_getStyle(t, this.p, _cs, false, this.dflt));
          e = this.format(e);
        }
        return this.parseComplex(t.style, b, e, pt, plugin);
      }
    });
    _registerComplexSpecialProp("textShadow", {defaultValue: "0px 0px 0px #999", color: true, multi: true});
    _registerComplexSpecialProp("autoRound,strictUnits", {
      parser: function (t, e, p, cssp, pt) {
        return pt;
      }
    }); //just so that we can ignore these properties (not tween them)
    _registerComplexSpecialProp("border", {
      defaultValue: "0px solid #000", parser: function (t, e, p, cssp, pt, plugin) {
        var bw = _getStyle(t, "borderTopWidth", _cs, false, "0px"),
            end = this.format(e).split(" "),
            esfx = end[0].replace(_suffixExp, "");
        if (esfx !== "px") { //if we're animating to a non-px value, we need to convert the beginning width to that unit.
          bw = (parseFloat(bw) / _convertToPixels(t, "borderTopWidth", 1, esfx)) + esfx;
        }
        return this.parseComplex(t.style,
            this.format(bw + " " + _getStyle(t, "borderTopStyle", _cs, false, "solid") + " " + _getStyle(t, "borderTopColor", _cs,
                false, "#000")), end.join(" "), pt, plugin);
      }, color: true, formatter: function (v) {
        var a = v.split(" ");
        return a[0] + " " + (a[1] || "solid") + " " + (v.match(_colorExp) || ["#000"])[0];
      }
    });
    _registerComplexSpecialProp("borderWidth",
        {parser: _getEdgeParser("borderTopWidth,borderRightWidth,borderBottomWidth,borderLeftWidth")}); //Firefox doesn't pick up on borderWidth set in style sheets (only inline).
    _registerComplexSpecialProp("float,cssFloat,styleFloat", {
      parser: function (t, e, p, cssp, pt, plugin) {
        var s = t.style,
            prop = ("cssFloat" in s) ? "cssFloat" : "styleFloat";
        return new CSSPropTween(s, prop, 0, 0, pt, -1, p, false, 0, s[prop], e);
      }
    });

    //opacity-related
    var _setIEOpacityRatio = function (v) {
      var t = this.t, //refers to the element's style property
          filters = t.filter || _getStyle(this.data, "filter") || "",
          val = (this.s + this.c * v) | 0,
          skip;
      if (val === 100) { //for older versions of IE that need to use a filter to apply opacity, we should remove the filter if opacity hits 1 in order to improve performance, but make sure there isn't a transform (matrix) or gradient in the filters.
        if (filters.indexOf("atrix(") === -1 && filters.indexOf("radient(") === -1 && filters.indexOf("oader(") === -1) {
          t.removeAttribute("filter");
          skip = (!_getStyle(this.data, "filter")); //if a class is applied that has an alpha filter, it will take effect (we don't want that), so re-apply our alpha filter in that case. We must first remove it and then check.
        } else {
          t.filter = filters.replace(_alphaFilterExp, "");
          skip = true;
        }
      }
      if (!skip) {
        if (this.xn1) {
          t.filter = filters = filters || ("alpha(opacity=" + val + ")"); //works around bug in IE7/8 that prevents changes to "visibility" from being applied properly if the filter is changed to a different alpha on the same frame.
        }
        if (filters.indexOf("pacity") === -1) { //only used if browser doesn't support the standard opacity style property (IE 7 and 8). We omit the "O" to avoid case-sensitivity issues
          if (val !== 0 || !this.xn1) { //bugs in IE7/8 won't render the filter properly if opacity is ADDED on the same frame/render as "visibility" changes (this.xn1 is 1 if this tween is an "autoAlpha" tween)
            t.filter = filters + " alpha(opacity=" + val + ")"; //we round the value because otherwise, bugs in IE7/8 can prevent "visibility" changes from being applied properly.
          }
        } else {
          t.filter = filters.replace(_opacityExp, "opacity=" + val);
        }
      }
    };
    _registerComplexSpecialProp("opacity,alpha,autoAlpha", {
      defaultValue: "1", parser: function (t, e, p, cssp, pt, plugin) {
        var b = parseFloat(_getStyle(t, "opacity", _cs, false, "1")),
            style = t.style,
            isAutoAlpha = (p === "autoAlpha");
        if (typeof(e) === "string" && e.charAt(1) === "=") {
          e = ((e.charAt(0) === "-") ? -1 : 1) * parseFloat(e.substr(2)) + b;
        }
        if (isAutoAlpha && b === 1 && _getStyle(t, "visibility", _cs) === "hidden" && e !== 0) { //if visibility is initially set to "hidden", we should interpret that as intent to make opacity 0 (a convenience)
          b = 0;
        }
        if (_supportsOpacity) {
          pt = new CSSPropTween(style, "opacity", b, e - b, pt);
        } else {
          pt = new CSSPropTween(style, "opacity", b * 100, (e - b) * 100, pt);
          pt.xn1 = isAutoAlpha ? 1 : 0; //we need to record whether or not this is an autoAlpha so that in the setRatio(), we know to duplicate the setting of the alpha in order to work around a bug in IE7 and IE8 that prevents changes to "visibility" from taking effect if the filter is changed to a different alpha(opacity) at the same time. Setting it to the SAME value first, then the new value works around the IE7/8 bug.
          style.zoom = 1; //helps correct an IE issue.
          pt.type = 2;
          pt.b = "alpha(opacity=" + pt.s + ")";
          pt.e = "alpha(opacity=" + (pt.s + pt.c) + ")";
          pt.data = t;
          pt.plugin = plugin;
          pt.setRatio = _setIEOpacityRatio;
        }
        if (isAutoAlpha) { //we have to create the "visibility" PropTween after the opacity one in the linked list so that they run in the order that works properly in IE8 and earlier
          pt = new CSSPropTween(style, "visibility", 0, 0, pt, -1, null, false, 0, ((b !== 0) ? "inherit" : "hidden"),
              ((e === 0) ? "hidden" : "inherit"));
          pt.xs0 = "inherit";
          cssp._overwriteProps.push(pt.n);
          cssp._overwriteProps.push(p);
        }
        return pt;
      }
    });

    var _removeProp = function (s, p) {
          if (p) {
            if (s.removeProperty) {
              if (p.substr(0, 2) === "ms" || p.substr(0, 6) === "webkit") { //Microsoft and some Webkit browsers don't conform to the standard of capitalizing the first prefix character, so we adjust so that when we prefix the caps with a dash, it's correct (otherwise it'd be "ms-transform" instead of "-ms-transform" for IE9, for example)
                p = "-" + p;
              }
              s.removeProperty(p.replace(_capsExp, "-$1").toLowerCase());
            } else { //note: old versions of IE use "removeAttribute()" instead of "removeProperty()"
              s.removeAttribute(p);
            }
          }
        },
        _setClassNameRatio = function (v) {
          this.t._gsClassPT = this;
          if (v === 1 || v === 0) {
            this.t.setAttribute("class", (v === 0) ? this.b : this.e);
            var mpt = this.data, //first MiniPropTween
                s = this.t.style;
            while (mpt) {
              if (!mpt.v) {
                _removeProp(s, mpt.p);
              } else {
                s[mpt.p] = mpt.v;
              }
              mpt = mpt._next;
            }
            if (v === 1 && this.t._gsClassPT === this) {
              this.t._gsClassPT = null;
            }
          } else if (this.t.getAttribute("class") !== this.e) {
            this.t.setAttribute("class", this.e);
          }
        };
    _registerComplexSpecialProp("className", {
      parser: function (t, e, p, cssp, pt, plugin, vars) {
        var b = t.getAttribute("class") || "", //don't use t.className because it doesn't work consistently on SVG elements; getAttribute("class") and setAttribute("class", value") is more reliable.
            cssText = t.style.cssText,
            difData, bs, cnpt, cnptLookup, mpt;
        pt = cssp._classNamePT = new CSSPropTween(t, p, 0, 0, pt, 2);
        pt.setRatio = _setClassNameRatio;
        pt.pr = -11;
        _hasPriority = true;
        pt.b = b;
        bs = _getAllStyles(t, _cs);
        //if there's a className tween already operating on the target, force it to its end so that the necessary inline styles are removed and the class name is applied before we determine the end state (we don't want inline styles interfering that were there just for class-specific values)
        cnpt = t._gsClassPT;
        if (cnpt) {
          cnptLookup = {};
          mpt = cnpt.data; //first MiniPropTween which stores the inline styles - we need to force these so that the inline styles don't contaminate things. Otherwise, there's a small chance that a tween could start and the inline values match the destination values and they never get cleaned.
          while (mpt) {
            cnptLookup[mpt.p] = 1;
            mpt = mpt._next;
          }
          cnpt.setRatio(1);
        }
        t._gsClassPT = pt;
        pt.e = (e.charAt(1) !== "=") ? e : b.replace(new RegExp("(?:\\s|^)" + e.substr(2) + "(?![\\w-])"), "") + ((e.charAt(0) === "+")
            ? " " + e.substr(2) : "");
        t.setAttribute("class", pt.e);
        difData = _cssDif(t, bs, _getAllStyles(t), vars, cnptLookup);
        t.setAttribute("class", b);
        pt.data = difData.firstMPT;
        t.style.cssText = cssText; //we recorded cssText before we swapped classes and ran _getAllStyles() because in cases when a className tween is overwritten, we remove all the related tweening properties from that class change (otherwise class-specific stuff can't override properties we've directly set on the target's style object due to specificity).
        pt = pt.xfirst = cssp.parse(t, difData.difs, pt, plugin); //we record the CSSPropTween as the xfirst so that we can handle overwriting propertly (if "className" gets overwritten, we must kill all the properties associated with the className part of the tween, so we can loop through from xfirst to the pt itself)
        return pt;
      }
    });

    var _setClearPropsRatio = function (v) {
      if (v === 1 || v === 0) {
        if (this.data._totalTime === this.data._totalDuration && this.data.data !== "isFromStart") { //this.data refers to the tween. Only clear at the END of the tween (remember, from() tweens make the ratio go from 1 to 0, so we can't just check that and if the tween is the zero-duration one that's created internally to render the starting values in a from() tween, ignore that because otherwise, for example, from(...{height:100, clearProps:"height", delay:1}) would wipe the height at the beginning of the tween and after 1 second, it'd kick back in).
          var s = this.t.style,
              transformParse = _specialProps.transform.parse,
              a, p, i, clearTransform, transform;
          if (this.e === "all") {
            s.cssText = "";
            clearTransform = true;
          } else {
            a = this.e.split(" ").join("").split(",");
            i = a.length;
            while (--i > -1) {
              p = a[i];
              if (_specialProps[p]) {
                if (_specialProps[p].parse === transformParse) {
                  clearTransform = true;
                } else {
                  p = (p === "transformOrigin") ? _transformOriginProp : _specialProps[p].p; //ensures that special properties use the proper browser-specific property name, like "scaleX" might be "-webkit-transform" or "boxShadow" might be "-moz-box-shadow"
                }
              }
              _removeProp(s, p);
            }
          }
          if (clearTransform) {
            _removeProp(s, _transformProp);
            transform = this.t._gsTransform;
            if (transform) {
              if (transform.svg) {
                this.t.removeAttribute("data-svg-origin");
                this.t.removeAttribute("transform");
              }
              delete this.t._gsTransform;
            }
          }

        }
      }
    };
    _registerComplexSpecialProp("clearProps", {
      parser: function (t, e, p, cssp, pt) {
        pt = new CSSPropTween(t, p, 0, 0, pt, 2);
        pt.setRatio = _setClearPropsRatio;
        pt.e = e;
        pt.pr = -10;
        pt.data = cssp._tween;
        _hasPriority = true;
        return pt;
      }
    });

    p = "bezier,throwProps,physicsProps,physics2D".split(",");
    i = p.length;
    while (i--) {
      _registerPluginProp(p[i]);
    }

    p = CSSPlugin.prototype;
    p._firstPT = p._lastParsedTransform = p._transform = null;

    //gets called when the tween renders for the first time. This kicks everything off, recording start/end values, etc.
    p._onInitTween = function (target, vars, tween, index) {
      if (!target.nodeType) { //css is only for dom elements
        return false;
      }
      this._target = _target = target;
      this._tween = tween;
      this._vars = vars;
      _index = index;
      _autoRound = vars.autoRound;
      _hasPriority = false;
      _suffixMap = vars.suffixMap || CSSPlugin.suffixMap;
      _cs = _getComputedStyle(target, "");
      _overwriteProps = this._overwriteProps;
      var style = target.style,
          v, pt, pt2, first, last, next, zIndex, tpt, threeD;
      if (_reqSafariFix) {
        if (style.zIndex === "") {
          v = _getStyle(target, "zIndex", _cs);
          if (v === "auto" || v === "") {
            //corrects a bug in [non-Android] Safari that prevents it from repainting elements in their new positions if they don't have a zIndex set. We also can't just apply this inside _parseTransform() because anything that's moved in any way (like using "left" or "top" instead of transforms like "x" and "y") can be affected, so it is best to ensure that anything that's tweening has a z-index. Setting "WebkitPerspective" to a non-zero value worked too except that on iOS Safari things would flicker randomly. Plus zIndex is less memory-intensive.
            this._addLazySet(style, "zIndex", 0);
          }
        }
      }

      if (typeof(vars) === "string") {
        first = style.cssText;
        v = _getAllStyles(target, _cs);
        style.cssText = first + ";" + vars;
        v = _cssDif(target, v, _getAllStyles(target)).difs;
        if (!_supportsOpacity && _opacityValExp.test(vars)) {
          v.opacity = parseFloat(RegExp.$1);
        }
        vars = v;
        style.cssText = first;
      }

      if (vars.className) { //className tweens will combine any differences they find in the css with the vars that are passed in, so {className:"myClass", scale:0.5, left:20} would work.
        this._firstPT = pt = _specialProps.className.parse(target, vars.className, "className", this, null, null, vars);
      } else {
        this._firstPT = pt = this.parse(target, vars, null);
      }

      if (this._transformType) {
        threeD = (this._transformType === 3);
        if (!_transformProp) {
          style.zoom = 1; //helps correct an IE issue.
        } else if (_isSafari) {
          _reqSafariFix = true;
          //if zIndex isn't set, iOS Safari doesn't repaint things correctly sometimes (seemingly at random).
          if (style.zIndex === "") {
            zIndex = _getStyle(target, "zIndex", _cs);
            if (zIndex === "auto" || zIndex === "") {
              this._addLazySet(style, "zIndex", 0);
            }
          }
          //Setting WebkitBackfaceVisibility corrects 3 bugs:
          // 1) [non-Android] Safari skips rendering changes to "top" and "left" that are made on the same frame/render as a transform update.
          // 2) iOS Safari sometimes neglects to repaint elements in their new positions. Setting "WebkitPerspective" to a non-zero value worked too except that on iOS Safari things would flicker randomly.
          // 3) Safari sometimes displayed odd artifacts when tweening the transform (or WebkitTransform) property, like ghosts of the edges of the element remained. Definitely a browser bug.
          //Note: we allow the user to override the auto-setting by defining WebkitBackfaceVisibility in the vars of the tween.
          if (_isSafariLT6) {
            this._addLazySet(style, "WebkitBackfaceVisibility", this._vars.WebkitBackfaceVisibility || (threeD ? "visible" : "hidden"));
          }
        }
        pt2 = pt;
        while (pt2 && pt2._next) {
          pt2 = pt2._next;
        }
        tpt = new CSSPropTween(target, "transform", 0, 0, null, 2);
        this._linkCSSP(tpt, null, pt2);
        tpt.setRatio = _transformProp ? _setTransformRatio : _setIETransformRatio;
        tpt.data = this._transform || _getTransform(target, _cs, true);
        tpt.tween = tween;
        tpt.pr = -1; //ensures that the transforms get applied after the components are updated.
        _overwriteProps.pop(); //we don't want to force the overwrite of all "transform" tweens of the target - we only care about individual transform properties like scaleX, rotation, etc. The CSSPropTween constructor automatically adds the property to _overwriteProps which is why we need to pop() here.
      }

      if (_hasPriority) {
        //reorders the linked list in order of pr (priority)
        while (pt) {
          next = pt._next;
          pt2 = first;
          while (pt2 && pt2.pr > pt.pr) {
            pt2 = pt2._next;
          }
          if ((pt._prev = pt2 ? pt2._prev : last)) {
            pt._prev._next = pt;
          } else {
            first = pt;
          }
          if ((pt._next = pt2)) {
            pt2._prev = pt;
          } else {
            last = pt;
          }
          pt = next;
        }
        this._firstPT = first;
      }
      return true;
    };

    p.parse = function (target, vars, pt, plugin) {
      var style = target.style,
          p, sp, bn, en, bs, es, bsfx, esfx, isStr, rel;
      for (p in vars) {
        es = vars[p]; //ending value string
        if (typeof(es) === "function") {
          es = es(_index, _target);
        }
        sp = _specialProps[p]; //SpecialProp lookup.
        if (sp) {
          pt = sp.parse(target, es, p, this, pt, plugin, vars);
        } else if (p.substr(0, 2) === "--") { //for tweening CSS variables (which always start with "--"). To maximize performance and simplicity, we bypass CSSPlugin altogether and just add a normal property tween to the tween instance itself.
          this._tween._propLookup[p] = this._addTween.call(this._tween, target.style, "setProperty", _getComputedStyle(
              target).getPropertyValue(p) + "", es + "", p, false, p);
          continue;
        } else {
          bs = _getStyle(target, p, _cs) + "";
          isStr = (typeof(es) === "string");
          if (p === "color" || p === "fill" || p === "stroke" || p.indexOf("Color") !== -1 || (isStr && _rgbhslExp.test(es))) { //Opera uses background: to define color sometimes in addition to backgroundColor:
            if (!isStr) {
              es = _parseColor(es);
              es = ((es.length > 3) ? "rgba(" : "rgb(") + es.join(",") + ")";
            }
            pt = _parseComplex(style, p, bs, es, true, "transparent", pt, 0, plugin);

          } else if (isStr && _complexExp.test(es)) {
            pt = _parseComplex(style, p, bs, es, true, null, pt, 0, plugin);

          } else {
            bn = parseFloat(bs);
            bsfx = (bn || bn === 0) ? bs.substr((bn + "").length) : ""; //remember, bs could be non-numeric like "normal" for fontWeight, so we should default to a blank suffix in that case.

            if (bs === "" || bs === "auto") {
              if (p === "width" || p === "height") {
                bn = _getDimension(target, p, _cs);
                bsfx = "px";
              } else if (p === "left" || p === "top") {
                bn = _calculateOffset(target, p, _cs);
                bsfx = "px";
              } else {
                bn = (p !== "opacity") ? 0 : 1;
                bsfx = "";
              }
            }

            rel = (isStr && es.charAt(1) === "=");
            if (rel) {
              en = parseInt(es.charAt(0) + "1", 10);
              es = es.substr(2);
              en *= parseFloat(es);
              esfx = es.replace(_suffixExp, "");
            } else {
              en = parseFloat(es);
              esfx = isStr ? es.replace(_suffixExp, "") : "";
            }

            if (esfx === "") {
              esfx = (p in _suffixMap) ? _suffixMap[p] : bsfx; //populate the end suffix, prioritizing the map, then if none is found, use the beginning suffix.
            }

            es = (en || en === 0) ? (rel ? en + bn : en) + esfx : vars[p]; //ensures that any += or -= prefixes are taken care of. Record the end value before normalizing the suffix because we always want to end the tween on exactly what they intended even if it doesn't match the beginning value's suffix.
            //if the beginning/ending suffixes don't match, normalize them...
            if (bsfx !== esfx) {
              if (esfx !== "" || p === "lineHeight") {
                if (en || en === 0) {
                  if (bn) { //note: if the beginning value (bn) is 0, we don't need to convert units!
                    bn = _convertToPixels(target, p, bn, bsfx);
                    if (esfx === "%") {
                      bn /= _convertToPixels(target, p, 100, "%") / 100;
                      if (vars.strictUnits !== true) { //some browsers report only "px" values instead of allowing "%" with getComputedStyle(), so we assume that if we're tweening to a %, we should start there too unless strictUnits:true is defined. This approach is particularly useful for responsive designs that use from() tweens.
                        bs = bn + "%";
                      }

                    } else if (esfx === "em" || esfx === "rem" || esfx === "vw" || esfx === "vh") {
                      bn /= _convertToPixels(target, p, 1, esfx);

                      //otherwise convert to pixels.
                    } else if (esfx !== "px") {
                      en = _convertToPixels(target, p, en, esfx);
                      esfx = "px"; //we don't use bsfx after this, so we don't need to set it to px too.
                    }
                    if (rel) {
                      if (en || en === 0) {
                        es = (en + bn) + esfx; //the changes we made affect relative calculations, so adjust the end value here.
                      }
                    }
                  }
                }
              }
            }

            if (rel) {
              en += bn;
            }

            if ((bn || bn === 0) && (en || en === 0)) { //faster than isNaN(). Also, previously we required en !== bn but that doesn't really gain much performance and it prevents _parseToProxy() from working properly if beginning and ending values match but need to get tweened by an external plugin anyway. For example, a bezier tween where the target starts at left:0 and has these points: [{left:50},{left:0}] wouldn't work properly because when parsing the last point, it'd match the first (current) one and a non-tweening CSSPropTween would be recorded when we actually need a normal tween (type:0) so that things get updated during the tween properly.
              pt = new CSSPropTween(style, p, bn, en - bn, pt, 0, p, (_autoRound !== false && (esfx === "px" || p === "zIndex")), 0, bs,
                  es);
              pt.xs0 = esfx;
              //DEBUG: _log("tween "+p+" from "+pt.b+" ("+bn+esfx+") to "+pt.e+" with suffix: "+pt.xs0);
            } else if (style[p] === undefined || !es && (es + "" === "NaN" || es == null)) {
              _log("invalid " + p + " tween value: " + vars[p]);
            } else {
              pt = new CSSPropTween(style, p, en || bn || 0, 0, pt, -1, p, false, 0, bs, es);
              pt.xs0 = (es === "none" && (p === "display" || p.indexOf("Style") !== -1)) ? bs : es; //intermediate value should typically be set immediately (end value) except for "display" or things like borderTopStyle, borderBottomStyle, etc. which should use the beginning value during the tween.
              //DEBUG: _log("non-tweening value "+p+": "+pt.xs0);
            }
          }
        }
        if (plugin) {
          if (pt && !pt.plugin) {
            pt.plugin = plugin;
          }
        }
      }
      return pt;
    };

    //gets called every time the tween updates, passing the new ratio (typically a value between 0 and 1, but not always (for example, if an Elastic.easeOut is used, the value can jump above 1 mid-tween). It will always start and 0 and end at 1.
    p.setRatio = function (v) {
      var pt = this._firstPT,
          min = 0.000001,
          val, str, i;
      //at the end of the tween, we set the values to exactly what we received in order to make sure non-tweening values (like "position" or "float" or whatever) are set and so that if the beginning/ending suffixes (units) didn't match and we normalized to px, the value that the user passed in is used here. We check to see if the tween is at its beginning in case it's a from() tween in which case the ratio will actually go from 1 to 0 over the course of the tween (backwards).
      if (v === 1 && (this._tween._time === this._tween._duration || this._tween._time === 0)) {
        while (pt) {
          if (pt.type !== 2) {
            if (pt.r && pt.type !== -1) {
              val = Math.round(pt.s + pt.c);
              if (!pt.type) {
                pt.t[pt.p] = val + pt.xs0;
              } else if (pt.type === 1) { //complex value (one that typically has multiple numbers inside a string, like "rect(5px,10px,20px,25px)"
                i = pt.l;
                str = pt.xs0 + val + pt.xs1;
                for (i = 1; i < pt.l; i++) {
                  str += pt["xn" + i] + pt["xs" + (i + 1)];
                }
                pt.t[pt.p] = str;
              }
            } else {
              pt.t[pt.p] = pt.e;
            }
          } else {
            pt.setRatio(v);
          }
          pt = pt._next;
        }

      } else if (v || !(this._tween._time === this._tween._duration || this._tween._time === 0) || this._tween._rawPrevTime
          === -0.000001) {
        while (pt) {
          val = pt.c * v + pt.s;
          if (pt.r) {
            val = Math.round(val);
          } else if (val < min) {
            if (val > -min) {
              val = 0;
            }
          }
          if (!pt.type) {
            pt.t[pt.p] = val + pt.xs0;
          } else if (pt.type === 1) { //complex value (one that typically has multiple numbers inside a string, like "rect(5px,10px,20px,25px)"
            i = pt.l;
            if (i === 2) {
              pt.t[pt.p] = pt.xs0 + val + pt.xs1 + pt.xn1 + pt.xs2;
            } else if (i === 3) {
              pt.t[pt.p] = pt.xs0 + val + pt.xs1 + pt.xn1 + pt.xs2 + pt.xn2 + pt.xs3;
            } else if (i === 4) {
              pt.t[pt.p] = pt.xs0 + val + pt.xs1 + pt.xn1 + pt.xs2 + pt.xn2 + pt.xs3 + pt.xn3 + pt.xs4;
            } else if (i === 5) {
              pt.t[pt.p] = pt.xs0 + val + pt.xs1 + pt.xn1 + pt.xs2 + pt.xn2 + pt.xs3 + pt.xn3 + pt.xs4 + pt.xn4 + pt.xs5;
            } else {
              str = pt.xs0 + val + pt.xs1;
              for (i = 1; i < pt.l; i++) {
                str += pt["xn" + i] + pt["xs" + (i + 1)];
              }
              pt.t[pt.p] = str;
            }

          } else if (pt.type === -1) { //non-tweening value
            pt.t[pt.p] = pt.xs0;

          } else if (pt.setRatio) { //custom setRatio() for things like SpecialProps, external plugins, etc.
            pt.setRatio(v);
          }
          pt = pt._next;
        }

        //if the tween is reversed all the way back to the beginning, we need to restore the original values which may have different units (like % instead of px or em or whatever).
      } else {
        while (pt) {
          if (pt.type !== 2) {
            pt.t[pt.p] = pt.b;
          } else {
            pt.setRatio(v);
          }
          pt = pt._next;
        }
      }
    };

    /**
     * @private
     * Forces rendering of the target's transforms (rotation, scale, etc.) whenever the CSSPlugin's setRatio() is called.
     * Basically, this tells the CSSPlugin to create a CSSPropTween (type 2) after instantiation that runs last in the linked
     * list and calls the appropriate (3D or 2D) rendering function. We separate this into its own method so that we can call
     * it from other plugins like BezierPlugin if, for example, it needs to apply an autoRotation and this CSSPlugin
     * doesn't have any transform-related properties of its own. You can call this method as many times as you
     * want and it won't create duplicate CSSPropTweens.
     *
     * @param {boolean} threeD if true, it should apply 3D tweens (otherwise, just 2D ones are fine and typically faster)
     */
    p._enableTransforms = function (threeD) {
      this._transform = this._transform || _getTransform(this._target, _cs, true); //ensures that the element has a _gsTransform property with the appropriate values.
      this._transformType = (!(this._transform.svg && _useSVGTransformAttr) && (threeD || this._transformType === 3)) ? 3 : 2;
    };

    var lazySet = function (v) {
      this.t[this.p] = this.e;
      this.data._linkCSSP(this, this._next, null, true); //we purposefully keep this._next even though it'd make sense to null it, but this is a performance optimization, as this happens during the while (pt) {} loop in setRatio() at the bottom of which it sets pt = pt._next, so if we null it, the linked list will be broken in that loop.
    };
    /** @private Gives us a way to set a value on the first render (and only the first render). **/
    p._addLazySet = function (t, p, v) {
      var pt = this._firstPT = new CSSPropTween(t, p, 0, 0, this._firstPT, 2);
      pt.e = v;
      pt.setRatio = lazySet;
      pt.data = this;
    };

    /** @private **/
    p._linkCSSP = function (pt, next, prev, remove) {
      if (pt) {
        if (next) {
          next._prev = pt;
        }
        if (pt._next) {
          pt._next._prev = pt._prev;
        }
        if (pt._prev) {
          pt._prev._next = pt._next;
        } else if (this._firstPT === pt) {
          this._firstPT = pt._next;
          remove = true; //just to prevent resetting this._firstPT 5 lines down in case pt._next is null. (optimized for speed)
        }
        if (prev) {
          prev._next = pt;
        } else if (!remove && this._firstPT === null) {
          this._firstPT = pt;
        }
        pt._next = next;
        pt._prev = prev;
      }
      return pt;
    };

    p._mod = function (lookup) {
      var pt = this._firstPT;
      while (pt) {
        if (typeof(lookup[pt.p]) === "function" && lookup[pt.p] === Math.round) { //only gets called by RoundPropsPlugin (ModifyPlugin manages all the rendering internally for CSSPlugin properties that need modification). Remember, we handle rounding a bit differently in this plugin for performance reasons, leveraging "r" as an indicator that the value should be rounded internally..
          pt.r = 1;
        }
        pt = pt._next;
      }
    };

    //we need to make sure that if alpha or autoAlpha is killed, opacity is too. And autoAlpha affects the "visibility" property.
    p._kill = function (lookup) {
      var copy = lookup,
          pt, p, xfirst;
      if (lookup.autoAlpha || lookup.alpha) {
        copy = {};
        for (p in lookup) { //copy the lookup so that we're not changing the original which may be passed elsewhere.
          copy[p] = lookup[p];
        }
        copy.opacity = 1;
        if (copy.autoAlpha) {
          copy.visibility = 1;
        }
      }
      if (lookup.className && (pt = this._classNamePT)) { //for className tweens, we need to kill any associated CSSPropTweens too; a linked list starts at the className's "xfirst".
        xfirst = pt.xfirst;
        if (xfirst && xfirst._prev) {
          this._linkCSSP(xfirst._prev, pt._next, xfirst._prev._prev); //break off the prev
        } else if (xfirst === this._firstPT) {
          this._firstPT = pt._next;
        }
        if (pt._next) {
          this._linkCSSP(pt._next, pt._next._next, xfirst._prev);
        }
        this._classNamePT = null;
      }
      pt = this._firstPT;
      while (pt) {
        if (pt.plugin && pt.plugin !== p && pt.plugin._kill) { //for plugins that are registered with CSSPlugin, we should notify them of the kill.
          pt.plugin._kill(lookup);
          p = pt.plugin;
        }
        pt = pt._next;
      }
      return TweenPlugin.prototype._kill.call(this, copy);
    };

    //used by cascadeTo() for gathering all the style properties of each child element into an array for comparison.
    var _getChildStyles = function (e, props, targets) {
      var children, i, child, type;
      if (e.slice) {
        i = e.length;
        while (--i > -1) {
          _getChildStyles(e[i], props, targets);
        }
        return;
      }
      children = e.childNodes;
      i = children.length;
      while (--i > -1) {
        child = children[i];
        type = child.type;
        if (child.style) {
          props.push(_getAllStyles(child));
          if (targets) {
            targets.push(child);
          }
        }
        if ((type === 1 || type === 9 || type === 11) && child.childNodes.length) {
          _getChildStyles(child, props, targets);
        }
      }
    };

    /**
     * Typically only useful for className tweens that may affect child elements, this method creates a TweenLite
     * and then compares the style properties of all the target's child elements at the tween's start and end, and
     * if any are different, it also creates tweens for those and returns an array containing ALL of the resulting
     * tweens (so that you can easily add() them to a TimelineLite, for example). The reason this functionality is
     * wrapped into a separate static method of CSSPlugin instead of being integrated into all regular className tweens
     * is because it creates entirely new tweens that may have completely different targets than the original tween,
     * so if they were all lumped into the original tween instance, it would be inconsistent with the rest of the API
     * and it would create other problems. For example:
     *  - If I create a tween of elementA, that tween instance may suddenly change its target to include 50 other elements (unintuitive if I specifically defined the target I wanted)
     *  - We can't just create new independent tweens because otherwise, what happens if the original/parent tween is reversed or pause or dropped into a TimelineLite for tight control? You'd expect that tween's behavior to affect all the others.
     *  - Analyzing every style property of every child before and after the tween is an expensive operation when there are many children, so this behavior shouldn't be imposed on all className tweens by default, especially since it's probably rare that this extra functionality is needed.
     *
     * @param {Object} target object to be tweened
     * @param {number} Duration in seconds (or frames for frames-based tweens)
     * @param {Object} Object containing the end values, like {className:"newClass", ease:Linear.easeNone}
     * @return {Array} An array of TweenLite instances
     */
    CSSPlugin.cascadeTo = function (target, duration, vars) {
      var tween = TweenLite.to(target, duration, vars),
          results = [tween],
          b = [],
          e = [],
          targets = [],
          _reservedProps = TweenLite._internals.reservedProps,
          i, difs, p, from;
      target = tween._targets || tween.target;
      _getChildStyles(target, b, targets);
      tween.render(duration, true, true);
      _getChildStyles(target, e);
      tween.render(0, true, true);
      tween._enabled(true);
      i = targets.length;
      while (--i > -1) {
        difs = _cssDif(targets[i], b[i], e[i]);
        if (difs.firstMPT) {
          difs = difs.difs;
          for (p in vars) {
            if (_reservedProps[p]) {
              difs[p] = vars[p];
            }
          }
          from = {};
          for (p in difs) {
            from[p] = b[i][p];
          }
          results.push(TweenLite.fromTo(targets[i], duration, from, difs));
        }
      }
      return results;
    };

    TweenPlugin.activate([CSSPlugin]);
    return CSSPlugin;

  }, true);

  /*
 * ----------------------------------------------------------------
 * RoundPropsPlugin
 * ----------------------------------------------------------------
 */
  (function () {

    var RoundPropsPlugin = _gsScope._gsDefine.plugin({
          propName: "roundProps",
          version: "1.6.0",
          priority: -1,
          API: 2,

          //called when the tween renders for the first time. This is where initial values should be recorded and any setup routines should run.
          init: function (target, value, tween) {
            this._tween = tween;
            return true;
          }

        }),
        _roundLinkedList = function (node) {
          while (node) {
            if (!node.f && !node.blob) {
              node.m = Math.round;
            }
            node = node._next;
          }
        },
        p = RoundPropsPlugin.prototype;

    p._onInitAllProps = function () {
      var tween = this._tween,
          rp = (tween.vars.roundProps.join) ? tween.vars.roundProps : tween.vars.roundProps.split(","),
          i = rp.length,
          lookup = {},
          rpt = tween._propLookup.roundProps,
          prop, pt, next;
      while (--i > -1) {
        lookup[rp[i]] = Math.round;
      }
      i = rp.length;
      while (--i > -1) {
        prop = rp[i];
        pt = tween._firstPT;
        while (pt) {
          next = pt._next; //record here, because it may get removed
          if (pt.pg) {
            pt.t._mod(lookup);
          } else if (pt.n === prop) {
            if (pt.f === 2 && pt.t) { //a blob (text containing multiple numeric values)
              _roundLinkedList(pt.t._firstPT);
            } else {
              this._add(pt.t, prop, pt.s, pt.c);
              //remove from linked list
              if (next) {
                next._prev = pt._prev;
              }
              if (pt._prev) {
                pt._prev._next = next;
              } else if (tween._firstPT === pt) {
                tween._firstPT = next;
              }
              pt._next = pt._prev = null;
              tween._propLookup[prop] = rpt;
            }
          }
          pt = next;
        }
      }
      return false;
    };

    p._add = function (target, p, s, c) {
      this._addTween(target, p, s, s + c, p, Math.round);
      this._overwriteProps.push(p);
    };

  }());

  /*
 * ----------------------------------------------------------------
 * AttrPlugin
 * ----------------------------------------------------------------
 */

  (function () {

    _gsScope._gsDefine.plugin({
      propName: "attr",
      API: 2,
      version: "0.6.1",

      //called when the tween renders for the first time. This is where initial values should be recorded and any setup routines should run.
      init: function (target, value, tween, index) {
        var p, end;
        if (typeof(target.setAttribute) !== "function") {
          return false;
        }
        for (p in value) {
          end = value[p];
          if (typeof(end) === "function") {
            end = end(index, target);
          }
          this._addTween(target, "setAttribute", target.getAttribute(p) + "", end + "", p, false, p);
          this._overwriteProps.push(p);
        }
        return true;
      }

    });

  }());

  /*
 * ----------------------------------------------------------------
 * DirectionalRotationPlugin
 * ----------------------------------------------------------------
 */
  _gsScope._gsDefine.plugin({
    propName: "directionalRotation",
    version: "0.3.1",
    API: 2,

    //called when the tween renders for the first time. This is where initial values should be recorded and any setup routines should run.
    init: function (target, value, tween, index) {
      if (typeof(value) !== "object") {
        value = {rotation: value};
      }
      this.finals = {};
      var cap = (value.useRadians === true) ? Math.PI * 2 : 360,
          min = 0.000001,
          p, v, start, end, dif, split;
      for (p in value) {
        if (p !== "useRadians") {
          end = value[p];
          if (typeof(end) === "function") {
            end = end(index, target);
          }
          split = (end + "").split("_");
          v = split[0];
          start = parseFloat(
              (typeof(target[p]) !== "function") ? target[p] : target[((p.indexOf("set") || typeof(target["get" + p.substr(3)])
                  !== "function") ? p : "get" + p.substr(3))]());
          end = this.finals[p] = (typeof(v) === "string" && v.charAt(1) === "=") ? start + parseInt(v.charAt(0) + "1", 10) * Number(
              v.substr(2)) : Number(v) || 0;
          dif = end - start;
          if (split.length) {
            v = split.join("_");
            if (v.indexOf("short") !== -1) {
              dif = dif % cap;
              if (dif !== dif % (cap / 2)) {
                dif = (dif < 0) ? dif + cap : dif - cap;
              }
            }
            if (v.indexOf("_cw") !== -1 && dif < 0) {
              dif = ((dif + cap * 9999999999) % cap) - ((dif / cap) | 0) * cap;
            } else if (v.indexOf("ccw") !== -1 && dif > 0) {
              dif = ((dif - cap * 9999999999) % cap) - ((dif / cap) | 0) * cap;
            }
          }
          if (dif > min || dif < -min) {
            this._addTween(target, p, start, start + dif, p);
            this._overwriteProps.push(p);
          }
        }
      }
      return true;
    },

    //called each time the values should be updated, and the ratio gets passed as the only parameter (typically it's a value between 0 and 1, but it can exceed those when using an ease like Elastic.easeOut or Back.easeOut, etc.)
    set: function (ratio) {
      var pt;
      if (ratio !== 1) {
        this._super.setRatio.call(this, ratio);
      } else {
        pt = this._firstPT;
        while (pt) {
          if (pt.f) {
            pt.t[pt.p](this.finals[pt.p]);
          } else {
            pt.t[pt.p] = this.finals[pt.p];
          }
          pt = pt._next;
        }
      }
    }

  })._autoCSS = true;

  /*
 * ----------------------------------------------------------------
 * EasePack
 * ----------------------------------------------------------------
 */
  _gsScope._gsDefine("easing.Back", ["easing.Ease"], function (Ease) {

    var w = (_gsScope.GreenSockGlobals || _gsScope),
        gs = w.com.greensock,
        _2PI = Math.PI * 2,
        _HALF_PI = Math.PI / 2,
        _class = gs._class,
        _create = function (n, f) {
          var C = _class("easing." + n, function () {
              }, true),
              p = C.prototype = new Ease();
          p.constructor = C;
          p.getRatio = f;
          return C;
        },
        _easeReg = Ease.register || function () {
        }, //put an empty function in place just as a safety measure in case someone loads an OLD version of TweenLite.js where Ease.register doesn't exist.
        _wrap = function (name, EaseOut, EaseIn, EaseInOut, aliases) {
          var C = _class("easing." + name, {
            easeOut: new EaseOut(),
            easeIn: new EaseIn(),
            easeInOut: new EaseInOut()
          }, true);
          _easeReg(C, name);
          return C;
        },
        EasePoint = function (time, value, next) {
          this.t = time;
          this.v = value;
          if (next) {
            this.next = next;
            next.prev = this;
            this.c = next.v - value;
            this.gap = next.t - time;
          }
        },

        //Back
        _createBack = function (n, f) {
          var C = _class("easing." + n, function (overshoot) {
                this._p1 = (overshoot || overshoot === 0) ? overshoot : 1.70158;
                this._p2 = this._p1 * 1.525;
              }, true),
              p = C.prototype = new Ease();
          p.constructor = C;
          p.getRatio = f;
          p.config = function (overshoot) {
            return new C(overshoot);
          };
          return C;
        },

        Back = _wrap("Back",
            _createBack("BackOut", function (p) {
              return ((p = p - 1) * p * ((this._p1 + 1) * p + this._p1) + 1);
            }),
            _createBack("BackIn", function (p) {
              return p * p * ((this._p1 + 1) * p - this._p1);
            }),
            _createBack("BackInOut", function (p) {
              return ((p *= 2) < 1) ? 0.5 * p * p * ((this._p2 + 1) * p - this._p2) : 0.5 * ((p -= 2) * p * ((this._p2 + 1) * p + this._p2)
                  + 2);
            })
        ),

        //SlowMo
        SlowMo = _class("easing.SlowMo", function (linearRatio, power, yoyoMode) {
          power = (power || power === 0) ? power : 0.7;
          if (linearRatio == null) {
            linearRatio = 0.7;
          } else if (linearRatio > 1) {
            linearRatio = 1;
          }
          this._p = (linearRatio !== 1) ? power : 0;
          this._p1 = (1 - linearRatio) / 2;
          this._p2 = linearRatio;
          this._p3 = this._p1 + this._p2;
          this._calcEnd = (yoyoMode === true);
        }, true),
        p = SlowMo.prototype = new Ease(),
        SteppedEase, RoughEase, _createElastic;

    p.constructor = SlowMo;
    p.getRatio = function (p) {
      var r = p + (0.5 - p) * this._p;
      if (p < this._p1) {
        return this._calcEnd ? 1 - ((p = 1 - (p / this._p1)) * p) : r - ((p = 1 - (p / this._p1)) * p * p * p * r);
      } else if (p > this._p3) {
        return this._calcEnd ? (p === 1 ? 0 : 1 - (p = (p - this._p3) / this._p1) * p) : r + ((p - r) * (p = (p - this._p3) / this._p1) * p
            * p * p); //added p === 1 ? 0 to avoid floating point rounding errors from affecting the final value, like 1 - 0.7 = 0.30000000000000004 instead of 0.3
      }
      return this._calcEnd ? 1 : r;
    };
    SlowMo.ease = new SlowMo(0.7, 0.7);

    p.config = SlowMo.config = function (linearRatio, power, yoyoMode) {
      return new SlowMo(linearRatio, power, yoyoMode);
    };

    //SteppedEase
    SteppedEase = _class("easing.SteppedEase", function (steps, immediateStart) {
      steps = steps || 1;
      this._p1 = 1 / steps;
      this._p2 = steps + (immediateStart ? 0 : 1);
      this._p3 = immediateStart ? 1 : 0;
    }, true);
    p = SteppedEase.prototype = new Ease();
    p.constructor = SteppedEase;
    p.getRatio = function (p) {
      if (p < 0) {
        p = 0;
      } else if (p >= 1) {
        p = 0.999999999;
      }
      return (((this._p2 * p) | 0) + this._p3) * this._p1;
    };
    p.config = SteppedEase.config = function (steps, immediateStart) {
      return new SteppedEase(steps, immediateStart);
    };

    //RoughEase
    RoughEase = _class("easing.RoughEase", function (vars) {
      vars = vars || {};
      var taper = vars.taper || "none",
          a = [],
          cnt = 0,
          points = (vars.points || 20) | 0,
          i = points,
          randomize = (vars.randomize !== false),
          clamp = (vars.clamp === true),
          template = (vars.template instanceof Ease) ? vars.template : null,
          strength = (typeof(vars.strength) === "number") ? vars.strength * 0.4 : 0.4,
          x, y, bump, invX, obj, pnt;
      while (--i > -1) {
        x = randomize ? Math.random() : (1 / points) * i;
        y = template ? template.getRatio(x) : x;
        if (taper === "none") {
          bump = strength;
        } else if (taper === "out") {
          invX = 1 - x;
          bump = invX * invX * strength;
        } else if (taper === "in") {
          bump = x * x * strength;
        } else if (x < 0.5) {  //"both" (start)
          invX = x * 2;
          bump = invX * invX * 0.5 * strength;
        } else {				//"both" (end)
          invX = (1 - x) * 2;
          bump = invX * invX * 0.5 * strength;
        }
        if (randomize) {
          y += (Math.random() * bump) - (bump * 0.5);
        } else if (i % 2) {
          y += bump * 0.5;
        } else {
          y -= bump * 0.5;
        }
        if (clamp) {
          if (y > 1) {
            y = 1;
          } else if (y < 0) {
            y = 0;
          }
        }
        a[cnt++] = {x: x, y: y};
      }
      a.sort(function (a, b) {
        return a.x - b.x;
      });

      pnt = new EasePoint(1, 1, null);
      i = points;
      while (--i > -1) {
        obj = a[i];
        pnt = new EasePoint(obj.x, obj.y, pnt);
      }

      this._prev = new EasePoint(0, 0, (pnt.t !== 0) ? pnt : pnt.next);
    }, true);
    p = RoughEase.prototype = new Ease();
    p.constructor = RoughEase;
    p.getRatio = function (p) {
      var pnt = this._prev;
      if (p > pnt.t) {
        while (pnt.next && p >= pnt.t) {
          pnt = pnt.next;
        }
        pnt = pnt.prev;
      } else {
        while (pnt.prev && p <= pnt.t) {
          pnt = pnt.prev;
        }
      }
      this._prev = pnt;
      return (pnt.v + ((p - pnt.t) / pnt.gap) * pnt.c);
    };
    p.config = function (vars) {
      return new RoughEase(vars);
    };
    RoughEase.ease = new RoughEase();

    //Bounce
    _wrap("Bounce",
        _create("BounceOut", function (p) {
          if (p < 1 / 2.75) {
            return 7.5625 * p * p;
          } else if (p < 2 / 2.75) {
            return 7.5625 * (p -= 1.5 / 2.75) * p + 0.75;
          } else if (p < 2.5 / 2.75) {
            return 7.5625 * (p -= 2.25 / 2.75) * p + 0.9375;
          }
          return 7.5625 * (p -= 2.625 / 2.75) * p + 0.984375;
        }),
        _create("BounceIn", function (p) {
          if ((p = 1 - p) < 1 / 2.75) {
            return 1 - (7.5625 * p * p);
          } else if (p < 2 / 2.75) {
            return 1 - (7.5625 * (p -= 1.5 / 2.75) * p + 0.75);
          } else if (p < 2.5 / 2.75) {
            return 1 - (7.5625 * (p -= 2.25 / 2.75) * p + 0.9375);
          }
          return 1 - (7.5625 * (p -= 2.625 / 2.75) * p + 0.984375);
        }),
        _create("BounceInOut", function (p) {
          var invert = (p < 0.5);
          if (invert) {
            p = 1 - (p * 2);
          } else {
            p = (p * 2) - 1;
          }
          if (p < 1 / 2.75) {
            p = 7.5625 * p * p;
          } else if (p < 2 / 2.75) {
            p = 7.5625 * (p -= 1.5 / 2.75) * p + 0.75;
          } else if (p < 2.5 / 2.75) {
            p = 7.5625 * (p -= 2.25 / 2.75) * p + 0.9375;
          } else {
            p = 7.5625 * (p -= 2.625 / 2.75) * p + 0.984375;
          }
          return invert ? (1 - p) * 0.5 : p * 0.5 + 0.5;
        })
    );

    //CIRC
    _wrap("Circ",
        _create("CircOut", function (p) {
          return Math.sqrt(1 - (p = p - 1) * p);
        }),
        _create("CircIn", function (p) {
          return -(Math.sqrt(1 - (p * p)) - 1);
        }),
        _create("CircInOut", function (p) {
          return ((p *= 2) < 1) ? -0.5 * (Math.sqrt(1 - p * p) - 1) : 0.5 * (Math.sqrt(1 - (p -= 2) * p) + 1);
        })
    );

    //Elastic
    _createElastic = function (n, f, def) {
      var C = _class("easing." + n, function (amplitude, period) {
            this._p1 = (amplitude >= 1) ? amplitude : 1; //note: if amplitude is < 1, we simply adjust the period for a more natural feel. Otherwise the math doesn't work right and the curve starts at 1.
            this._p2 = (period || def) / (amplitude < 1 ? amplitude : 1);
            this._p3 = this._p2 / _2PI * (Math.asin(1 / this._p1) || 0);
            this._p2 = _2PI / this._p2; //precalculate to optimize
          }, true),
          p = C.prototype = new Ease();
      p.constructor = C;
      p.getRatio = f;
      p.config = function (amplitude, period) {
        return new C(amplitude, period);
      };
      return C;
    };
    _wrap("Elastic",
        _createElastic("ElasticOut", function (p) {
          return this._p1 * Math.pow(2, -10 * p) * Math.sin((p - this._p3) * this._p2) + 1;
        }, 0.3),
        _createElastic("ElasticIn", function (p) {
          return -(this._p1 * Math.pow(2, 10 * (p -= 1)) * Math.sin((p - this._p3) * this._p2));
        }, 0.3),
        _createElastic("ElasticInOut", function (p) {
          return ((p *= 2) < 1) ? -0.5 * (this._p1 * Math.pow(2, 10 * (p -= 1)) * Math.sin((p - this._p3) * this._p2)) : this._p1
              * Math.pow(2, -10 * (p -= 1)) * Math.sin((p - this._p3) * this._p2) * 0.5 + 1;
        }, 0.45)
    );

    //Expo
    _wrap("Expo",
        _create("ExpoOut", function (p) {
          return 1 - Math.pow(2, -10 * p);
        }),
        _create("ExpoIn", function (p) {
          return Math.pow(2, 10 * (p - 1)) - 0.001;
        }),
        _create("ExpoInOut", function (p) {
          return ((p *= 2) < 1) ? 0.5 * Math.pow(2, 10 * (p - 1)) : 0.5 * (2 - Math.pow(2, -10 * (p - 1)));
        })
    );

    //Sine
    _wrap("Sine",
        _create("SineOut", function (p) {
          return Math.sin(p * _HALF_PI);
        }),
        _create("SineIn", function (p) {
          return -Math.cos(p * _HALF_PI) + 1;
        }),
        _create("SineInOut", function (p) {
          return -0.5 * (Math.cos(Math.PI * p) - 1);
        })
    );

    _class("easing.EaseLookup", {
      find: function (s) {
        return Ease.map[s];
      }
    }, true);

    //register the non-standard eases
    _easeReg(w.SlowMo, "SlowMo", "ease,");
    _easeReg(RoughEase, "RoughEase", "ease,");
    _easeReg(SteppedEase, "SteppedEase", "ease,");

    return Back;

  }, true);


});

if (_gsScope._gsDefine) {
  _gsScope._gsQueue.pop()();
} //necessary in case TweenLite was already loaded separately.


/*
 * ----------------------------------------------------------------
 * Base classes like TweenLite, SimpleTimeline, Ease, Ticker, etc.
 * ----------------------------------------------------------------
 */
(function (window, moduleName) {

  "use strict";
  var _exports = {},
      _doc = window.document,
      _globals = window.GreenSockGlobals = window.GreenSockGlobals || window;
  if (_globals.TweenLite) {
    return; //in case the core set of classes is already loaded, don't instantiate twice.
  }
  var _namespace = function (ns) {
        var a = ns.split("."),
            p = _globals, i;
        for (i = 0; i < a.length; i++) {
          p[a[i]] = p = p[a[i]] || {};
        }
        return p;
      },
      gs = _namespace("com.greensock"),
      _tinyNum = 0.0000000001,
      _slice = function (a) { //don't use Array.prototype.slice.call(target, 0) because that doesn't work in IE8 with a NodeList that's returned by querySelectorAll()
        var b = [],
            l = a.length,
            i;
        for (i = 0; i !== l; b.push(a[i++])) {
        }
        return b;
      },
      _emptyFunc = function () {
      },
      _isArray = (function () { //works around issues in iframe environments where the Array global isn't shared, thus if the object originates in a different window/iframe, "(obj instanceof Array)" will evaluate false. We added some speed optimizations to avoid Object.prototype.toString.call() unless it's absolutely necessary because it's VERY slow (like 20x slower)
        var toString = Object.prototype.toString,
            array = toString.call([]);
        return function (obj) {
          return obj != null && (obj instanceof Array || (typeof(obj) === "object" && !!obj.push && toString.call(obj) === array));
        };
      }()),
      a, i, p, _ticker, _tickerActive,
      _defLookup = {},

      /**
       * @constructor
       * Defines a GreenSock class, optionally with an array of dependencies that must be instantiated first and passed into the definition.
       * This allows users to load GreenSock JS files in any order even if they have interdependencies (like CSSPlugin extends TweenPlugin which is
       * inside TweenLite.js, but if CSSPlugin is loaded first, it should wait to run its code until TweenLite.js loads and instantiates TweenPlugin
       * and then pass TweenPlugin to CSSPlugin's definition). This is all done automatically and internally.
       *
       * Every definition will be added to a "com.greensock" global object (typically window, but if a window.GreenSockGlobals object is found,
       * it will go there as of v1.7). For example, TweenLite will be found at window.com.greensock.TweenLite and since it's a global class that should be available anywhere,
       * it is ALSO referenced at window.TweenLite. However some classes aren't considered global, like the base com.greensock.core.Animation class, so
       * those will only be at the package like window.com.greensock.core.Animation. Again, if you define a GreenSockGlobals object on the window, everything
       * gets tucked neatly inside there instead of on the window directly. This allows you to do advanced things like load multiple versions of GreenSock
       * files and put them into distinct objects (imagine a banner ad uses a newer version but the main site uses an older one). In that case, you could
       * sandbox the banner one like:
       *
       * <script>
       *     var gs = window.GreenSockGlobals = {}; //the newer version we're about to load could now be referenced in a "gs" object, like gs.TweenLite.to(...). Use whatever alias you want as long as it's unique, "gs" or "banner" or whatever.
       * </script>
       * <script src="js/greensock/v1.7/TweenMax.js"></script>
       * <script>
       *     window.GreenSockGlobals = window._gsQueue = window._gsDefine = null; //reset it back to null (along with the special _gsQueue variable) so that the next load of TweenMax affects the window and we can reference things directly like TweenLite.to(...)
       * </script>
       * <script src="js/greensock/v1.6/TweenMax.js"></script>
       * <script>
       *     gs.TweenLite.to(...); //would use v1.7
       *     TweenLite.to(...); //would use v1.6
       * </script>
       *
       * @param {!string} ns The namespace of the class definition, leaving off "com.greensock." as that's assumed. For example, "TweenLite" or "plugins.CSSPlugin" or "easing.Back".
       * @param {!Array.<string>} dependencies An array of dependencies (described as their namespaces minus "com.greensock." prefix). For example ["TweenLite","plugins.TweenPlugin","core.Animation"]
       * @param {!function():Object} func The function that should be called and passed the resolved dependencies which will return the actual class for this definition.
       * @param {boolean=} global If true, the class will be added to the global scope (typically window unless you define a window.GreenSockGlobals object)
       */
      Definition = function (ns, dependencies, func, global) {
        this.sc = (_defLookup[ns]) ? _defLookup[ns].sc : []; //subclasses
        _defLookup[ns] = this;
        this.gsClass = null;
        this.func = func;
        var _classes = [];
        this.check = function (init) {
          var i = dependencies.length,
              missing = i,
              cur, a, n, cl;
          while (--i > -1) {
            if ((cur = _defLookup[dependencies[i]] || new Definition(dependencies[i], [])).gsClass) {
              _classes[i] = cur.gsClass;
              missing--;
            } else if (init) {
              cur.sc.push(this);
            }
          }
          if (missing === 0 && func) {
            a = ("com.greensock." + ns).split(".");
            n = a.pop();
            cl = _namespace(a.join("."))[n] = this.gsClass = func.apply(func, _classes);

            //exports to multiple environments
            if (global) {
              _globals[n] = _exports[n] = cl; //provides a way to avoid global namespace pollution. By default, the main classes like TweenLite, Power1, Strong, etc. are added to window unless a GreenSockGlobals is defined. So if you want to have things added to a custom object instead, just do something like window.GreenSockGlobals = {} before loading any GreenSock files. You can even set up an alias like window.GreenSockGlobals = windows.gs = {} so that you can access everything like gs.TweenLite. Also remember that ALL classes are added to the window.com.greensock object (in their respective packages, like com.greensock.easing.Power1, com.greensock.TweenLite, etc.)
              if (typeof(module) !== "undefined" && module.exports) { //node
                if (ns === moduleName) {
                  module.exports = _exports[moduleName] = cl;
                  for (i in _exports) {
                    cl[i] = _exports[i];
                  }
                } else if (_exports[moduleName]) {
                  _exports[moduleName][n] = cl;
                }
              } else if (typeof(define) === "function" && define.amd) { //AMD
                define((window.GreenSockAMDPath ? window.GreenSockAMDPath + "/" : "") + ns.split(".").pop(), [], function () {
                  return cl;
                });
              }
            }
            for (i = 0; i < this.sc.length; i++) {
              this.sc[i].check();
            }
          }
        };
        this.check(true);
      },

      //used to create Definition instances (which basically registers a class that has dependencies).
      _gsDefine = window._gsDefine = function (ns, dependencies, func, global) {
        return new Definition(ns, dependencies, func, global);
      },

      //a quick way to create a class that doesn't have any dependencies. Returns the class, but first registers it in the GreenSock namespace so that other classes can grab it (other classes might be dependent on the class).
      _class = gs._class = function (ns, func, global) {
        func = func || function () {
        };
        _gsDefine(ns, [], function () {
          return func;
        }, global);
        return func;
      };

  _gsDefine.globals = _globals;

  /*
 * ----------------------------------------------------------------
 * Ease
 * ----------------------------------------------------------------
 */
  var _baseParams = [0, 0, 1, 1],
      Ease = _class("easing.Ease", function (func, extraParams, type, power) {
        this._func = func;
        this._type = type || 0;
        this._power = power || 0;
        this._params = extraParams ? _baseParams.concat(extraParams) : _baseParams;
      }, true),
      _easeMap = Ease.map = {},
      _easeReg = Ease.register = function (ease, names, types, create) {
        var na = names.split(","),
            i = na.length,
            ta = (types || "easeIn,easeOut,easeInOut").split(","),
            e, name, j, type;
        while (--i > -1) {
          name = na[i];
          e = create ? _class("easing." + name, null, true) : gs.easing[name] || {};
          j = ta.length;
          while (--j > -1) {
            type = ta[j];
            _easeMap[name + "." + type] = _easeMap[type + name] = e[type] = ease.getRatio ? ease : ease[type] || new ease();
          }
        }
      };

  p = Ease.prototype;
  p._calcEnd = false;
  p.getRatio = function (p) {
    if (this._func) {
      this._params[0] = p;
      return this._func.apply(null, this._params);
    }
    var t = this._type,
        pw = this._power,
        r = (t === 1) ? 1 - p : (t === 2) ? p : (p < 0.5) ? p * 2 : (1 - p) * 2;
    if (pw === 1) {
      r *= r;
    } else if (pw === 2) {
      r *= r * r;
    } else if (pw === 3) {
      r *= r * r * r;
    } else if (pw === 4) {
      r *= r * r * r * r;
    }
    return (t === 1) ? 1 - r : (t === 2) ? r : (p < 0.5) ? r / 2 : 1 - (r / 2);
  };

  //create all the standard eases like Linear, Quad, Cubic, Quart, Quint, Strong, Power0, Power1, Power2, Power3, and Power4 (each with easeIn, easeOut, and easeInOut)
  a = ["Linear", "Quad", "Cubic", "Quart", "Quint,Strong"];
  i = a.length;
  while (--i > -1) {
    p = a[i] + ",Power" + i;
    _easeReg(new Ease(null, null, 1, i), p, "easeOut", true);
    _easeReg(new Ease(null, null, 2, i), p, "easeIn" + ((i === 0) ? ",easeNone" : ""));
    _easeReg(new Ease(null, null, 3, i), p, "easeInOut");
  }
  _easeMap.linear = gs.easing.Linear.easeIn;
  _easeMap.swing = gs.easing.Quad.easeInOut; //for jQuery folks

  /*
 * ----------------------------------------------------------------
 * EventDispatcher
 * ----------------------------------------------------------------
 */
  var EventDispatcher = _class("events.EventDispatcher", function (target) {
    this._listeners = {};
    this._eventTarget = target || this;
  });
  p = EventDispatcher.prototype;

  p.addEventListener = function (type, callback, scope, useParam, priority) {
    priority = priority || 0;
    var list = this._listeners[type],
        index = 0,
        listener, i;
    if (this === _ticker && !_tickerActive) {
      _ticker.wake();
    }
    if (list == null) {
      this._listeners[type] = list = [];
    }
    i = list.length;
    while (--i > -1) {
      listener = list[i];
      if (listener.c === callback && listener.s === scope) {
        list.splice(i, 1);
      } else if (index === 0 && listener.pr < priority) {
        index = i + 1;
      }
    }
    list.splice(index, 0, {c: callback, s: scope, up: useParam, pr: priority});
  };

  p.removeEventListener = function (type, callback) {
    var list = this._listeners[type], i;
    if (list) {
      i = list.length;
      while (--i > -1) {
        if (list[i].c === callback) {
          list.splice(i, 1);
          return;
        }
      }
    }
  };

  p.dispatchEvent = function (type) {
    var list = this._listeners[type],
        i, t, listener;
    if (list) {
      i = list.length;
      if (i > 1) {
        list = list.slice(0); //in case addEventListener() is called from within a listener/callback (otherwise the index could change, resulting in a skip)
      }
      t = this._eventTarget;
      while (--i > -1) {
        listener = list[i];
        if (listener) {
          if (listener.up) {
            listener.c.call(listener.s || t, {type: type, target: t});
          } else {
            listener.c.call(listener.s || t);
          }
        }
      }
    }
  };

  /*
 * ----------------------------------------------------------------
 * Ticker
 * ----------------------------------------------------------------
 */
  var _reqAnimFrame = window.requestAnimationFrame,
      _cancelAnimFrame = window.cancelAnimationFrame,
      _getTime = Date.now || function () {
        return new Date().getTime();
      },
      _lastUpdate = _getTime();

  //now try to determine the requestAnimationFrame and cancelAnimationFrame functions and if none are found, we'll use a setTimeout()/clearTimeout() polyfill.
  a = ["ms", "moz", "webkit", "o"];
  i = a.length;
  while (--i > -1 && !_reqAnimFrame) {
    _reqAnimFrame = window[a[i] + "RequestAnimationFrame"];
    _cancelAnimFrame = window[a[i] + "CancelAnimationFrame"] || window[a[i] + "CancelRequestAnimationFrame"];
  }

  _class("Ticker", function (fps, useRAF) {
    var _self = this,
        _startTime = _getTime(),
        _useRAF = (useRAF !== false && _reqAnimFrame) ? "auto" : false,
        _lagThreshold = 500,
        _adjustedLag = 33,
        _tickWord = "tick", //helps reduce gc burden
        _fps, _req, _id, _gap, _nextTime,
        _tick = function (manual) {
          var elapsed = _getTime() - _lastUpdate,
              overlap, dispatch;
          if (elapsed > _lagThreshold) {
            _startTime += elapsed - _adjustedLag;
          }
          _lastUpdate += elapsed;
          _self.time = (_lastUpdate - _startTime) / 1000;
          overlap = _self.time - _nextTime;
          if (!_fps || overlap > 0 || manual === true) {
            _self.frame++;
            _nextTime += overlap + (overlap >= _gap ? 0.004 : _gap - overlap);
            dispatch = true;
          }
          if (manual !== true) { //make sure the request is made before we dispatch the "tick" event so that timing is maintained. Otherwise, if processing the "tick" requires a bunch of time (like 15ms) and we're using a setTimeout() that's based on 16.7ms, it'd technically take 31.7ms between frames otherwise.
            _id = _req(_tick);
          }
          if (dispatch) {
            _self.dispatchEvent(_tickWord);
          }
        };

    EventDispatcher.call(_self);
    _self.time = _self.frame = 0;
    _self.tick = function () {
      _tick(true);
    };

    _self.lagSmoothing = function (threshold, adjustedLag) {
      if (!arguments.length) { //if lagSmoothing() is called with no arguments, treat it like a getter that returns a boolean indicating if it's enabled or not. This is purposely undocumented and is for internal use.
        return (_lagThreshold < 1 / _tinyNum);
      }
      _lagThreshold = threshold || (1 / _tinyNum); //zero should be interpreted as basically unlimited
      _adjustedLag = Math.min(adjustedLag, _lagThreshold, 0);
    };

    _self.sleep = function () {
      if (_id == null) {
        return;
      }
      if (!_useRAF || !_cancelAnimFrame) {
        clearTimeout(_id);
      } else {
        _cancelAnimFrame(_id);
      }
      _req = _emptyFunc;
      _id = null;
      if (_self === _ticker) {
        _tickerActive = false;
      }
    };

    _self.wake = function (seamless) {
      if (_id !== null) {
        _self.sleep();
      } else if (seamless) {
        _startTime += -_lastUpdate + (_lastUpdate = _getTime());
      } else if (_self.frame > 10) { //don't trigger lagSmoothing if we're just waking up, and make sure that at least 10 frames have elapsed because of the iOS bug that we work around below with the 1.5-second setTimout().
        _lastUpdate = _getTime() - _lagThreshold + 5;
      }
      _req = (_fps === 0) ? _emptyFunc : (!_useRAF || !_reqAnimFrame) ? function (f) {
        return setTimeout(f, ((_nextTime - _self.time) * 1000 + 1) | 0);
      } : _reqAnimFrame;
      if (_self === _ticker) {
        _tickerActive = true;
      }
      _tick(2);
    };

    _self.fps = function (value) {
      if (!arguments.length) {
        return _fps;
      }
      _fps = value;
      _gap = 1 / (_fps || 60);
      _nextTime = this.time + _gap;
      _self.wake();
    };

    _self.useRAF = function (value) {
      if (!arguments.length) {
        return _useRAF;
      }
      _self.sleep();
      _useRAF = value;
      _self.fps(_fps);
    };
    _self.fps(fps);

    //a bug in iOS 6 Safari occasionally prevents the requestAnimationFrame from working initially, so we use a 1.5-second timeout that automatically falls back to setTimeout() if it senses this condition.
    setTimeout(function () {
      if (_useRAF === "auto" && _self.frame < 5 && _doc.visibilityState !== "hidden") {
        _self.useRAF(false);
      }
    }, 1500);
  });

  p = gs.Ticker.prototype = new gs.events.EventDispatcher();
  p.constructor = gs.Ticker;

  /*
 * ----------------------------------------------------------------
 * Animation
 * ----------------------------------------------------------------
 */
  var Animation = _class("core.Animation", function (duration, vars) {
    this.vars = vars = vars || {};
    this._duration = this._totalDuration = duration || 0;
    this._delay = Number(vars.delay) || 0;
    this._timeScale = 1;
    this._active = (vars.immediateRender === true);
    this.data = vars.data;
    this._reversed = (vars.reversed === true);

    if (!_rootTimeline) {
      return;
    }
    if (!_tickerActive) { //some browsers (like iOS 6 Safari) shut down JavaScript execution when the tab is disabled and they [occasionally] neglect to start up requestAnimationFrame again when returning - this code ensures that the engine starts up again properly.
      _ticker.wake();
    }

    var tl = this.vars.useFrames ? _rootFramesTimeline : _rootTimeline;
    tl.add(this, tl._time);

    if (this.vars.paused) {
      this.paused(true);
    }
  });

  _ticker = Animation.ticker = new gs.Ticker();
  p = Animation.prototype;
  p._dirty = p._gc = p._initted = p._paused = false;
  p._totalTime = p._time = 0;
  p._rawPrevTime = -1;
  p._next = p._last = p._onUpdate = p._timeline = p.timeline = null;
  p._paused = false;

  //some browsers (like iOS) occasionally drop the requestAnimationFrame event when the user switches to a different tab and then comes back again, so we use a 2-second setTimeout() to sense if/when that condition occurs and then wake() the ticker.
  var _checkTimeout = function () {
    if (_tickerActive && _getTime() - _lastUpdate > 2000 && (_doc.visibilityState !== "hidden" || !_ticker.lagSmoothing())) { //note: if the tab is hidden, we should still wake if lagSmoothing has been disabled.
      _ticker.wake();
    }
    var t = setTimeout(_checkTimeout, 2000);
    if (t.unref) {
      // allows a node process to exit even if the timeout’s callback hasn't been invoked. Without it, the node process could hang as this function is called every two seconds.
      t.unref();
    }
  };
  _checkTimeout();

  p.play = function (from, suppressEvents) {
    if (from != null) {
      this.seek(from, suppressEvents);
    }
    return this.reversed(false).paused(false);
  };

  p.pause = function (atTime, suppressEvents) {
    if (atTime != null) {
      this.seek(atTime, suppressEvents);
    }
    return this.paused(true);
  };

  p.resume = function (from, suppressEvents) {
    if (from != null) {
      this.seek(from, suppressEvents);
    }
    return this.paused(false);
  };

  p.seek = function (time, suppressEvents) {
    return this.totalTime(Number(time), suppressEvents !== false);
  };

  p.restart = function (includeDelay, suppressEvents) {
    return this.reversed(false).paused(false).totalTime(includeDelay ? -this._delay : 0, (suppressEvents !== false), true);
  };

  p.reverse = function (from, suppressEvents) {
    if (from != null) {
      this.seek((from || this.totalDuration()), suppressEvents);
    }
    return this.reversed(true).paused(false);
  };

  p.render = function (time, suppressEvents, force) {
    //stub - we override this method in subclasses.
  };

  p.invalidate = function () {
    this._time = this._totalTime = 0;
    this._initted = this._gc = false;
    this._rawPrevTime = -1;
    if (this._gc || !this.timeline) {
      this._enabled(true);
    }
    return this;
  };

  p.isActive = function () {
    var tl = this._timeline, //the 2 root timelines won't have a _timeline; they're always active.
        startTime = this._startTime,
        rawTime;
    return (!tl || (!this._gc && !this._paused && tl.isActive() && (rawTime = tl.rawTime(true)) >= startTime && rawTime < startTime
        + this.totalDuration() / this._timeScale - 0.0000001));
  };

  p._enabled = function (enabled, ignoreTimeline) {
    if (!_tickerActive) {
      _ticker.wake();
    }
    this._gc = !enabled;
    this._active = this.isActive();
    if (ignoreTimeline !== true) {
      if (enabled && !this.timeline) {
        this._timeline.add(this, this._startTime - this._delay);
      } else if (!enabled && this.timeline) {
        this._timeline._remove(this, true);
      }
    }
    return false;
  };

  p._kill = function (vars, target) {
    return this._enabled(false, false);
  };

  p.kill = function (vars, target) {
    this._kill(vars, target);
    return this;
  };

  p._uncache = function (includeSelf) {
    var tween = includeSelf ? this : this.timeline;
    while (tween) {
      tween._dirty = true;
      tween = tween.timeline;
    }
    return this;
  };

  p._swapSelfInParams = function (params) {
    var i = params.length,
        copy = params.concat();
    while (--i > -1) {
      if (params[i] === "{self}") {
        copy[i] = this;
      }
    }
    return copy;
  };

  p._callback = function (type) {
    var v = this.vars,
        callback = v[type],
        params = v[type + "Params"],
        scope = v[type + "Scope"] || v.callbackScope || this,
        l = params ? params.length : 0;
    switch (l) { //speed optimization; call() is faster than apply() so use it when there are only a few parameters (which is by far most common). Previously we simply did var v = this.vars; v[type].apply(v[type + "Scope"] || v.callbackScope || this, v[type + "Params"] || _blankArray);
      case 0:
        callback.call(scope);
        break;
      case 1:
        callback.call(scope, params[0]);
        break;
      case 2:
        callback.call(scope, params[0], params[1]);
        break;
      default:
        callback.apply(scope, params);
    }
  };

//----Animation getters/setters --------------------------------------------------------

  p.eventCallback = function (type, callback, params, scope) {
    if ((type || "").substr(0, 2) === "on") {
      var v = this.vars;
      if (arguments.length === 1) {
        return v[type];
      }
      if (callback == null) {
        delete v[type];
      } else {
        v[type] = callback;
        v[type + "Params"] = (_isArray(params) && params.join("").indexOf("{self}") !== -1) ? this._swapSelfInParams(params) : params;
        v[type + "Scope"] = scope;
      }
      if (type === "onUpdate") {
        this._onUpdate = callback;
      }
    }
    return this;
  };

  p.delay = function (value) {
    if (!arguments.length) {
      return this._delay;
    }
    if (this._timeline.smoothChildTiming) {
      this.startTime(this._startTime + value - this._delay);
    }
    this._delay = value;
    return this;
  };

  p.duration = function (value) {
    if (!arguments.length) {
      this._dirty = false;
      return this._duration;
    }
    this._duration = this._totalDuration = value;
    this._uncache(true); //true in case it's a TweenMax or TimelineMax that has a repeat - we'll need to refresh the totalDuration.
    if (this._timeline.smoothChildTiming) if (this._time > 0) if (this._time < this._duration) if (value !== 0) {
      this.totalTime(this._totalTime * (value / this._duration), true);
    }
    return this;
  };

  p.totalDuration = function (value) {
    this._dirty = false;
    return (!arguments.length) ? this._totalDuration : this.duration(value);
  };

  p.time = function (value, suppressEvents) {
    if (!arguments.length) {
      return this._time;
    }
    if (this._dirty) {
      this.totalDuration();
    }
    return this.totalTime((value > this._duration) ? this._duration : value, suppressEvents);
  };

  p.totalTime = function (time, suppressEvents, uncapped) {
    if (!_tickerActive) {
      _ticker.wake();
    }
    if (!arguments.length) {
      return this._totalTime;
    }
    if (this._timeline) {
      if (time < 0 && !uncapped) {
        time += this.totalDuration();
      }
      if (this._timeline.smoothChildTiming) {
        if (this._dirty) {
          this.totalDuration();
        }
        var totalDuration = this._totalDuration,
            tl = this._timeline;
        if (time > totalDuration && !uncapped) {
          time = totalDuration;
        }
        this._startTime = (this._paused ? this._pauseTime : tl._time) - ((!this._reversed ? time : totalDuration - time) / this._timeScale);
        if (!tl._dirty) { //for performance improvement. If the parent's cache is already dirty, it already took care of marking the ancestors as dirty too, so skip the function call here.
          this._uncache(false);
        }
        //in case any of the ancestor timelines had completed but should now be enabled, we should reset their totalTime() which will also ensure that they're lined up properly and enabled. Skip for animations that are on the root (wasteful). Example: a TimelineLite.exportRoot() is performed when there's a paused tween on the root, the export will not complete until that tween is unpaused, but imagine a child gets restarted later, after all [unpaused] tweens have completed. The startTime of that child would get pushed out, but one of the ancestors may have completed.
        if (tl._timeline) {
          while (tl._timeline) {
            if (tl._timeline._time !== (tl._startTime + tl._totalTime) / tl._timeScale) {
              tl.totalTime(tl._totalTime, true);
            }
            tl = tl._timeline;
          }
        }
      }
      if (this._gc) {
        this._enabled(true, false);
      }
      if (this._totalTime !== time || this._duration === 0) {
        if (_lazyTweens.length) {
          _lazyRender();
        }
        this.render(time, suppressEvents, false);
        if (_lazyTweens.length) { //in case rendering caused any tweens to lazy-init, we should render them because typically when someone calls seek() or time() or progress(), they expect an immediate render.
          _lazyRender();
        }
      }
    }
    return this;
  };

  p.progress = p.totalProgress = function (value, suppressEvents) {
    var duration = this.duration();
    return (!arguments.length) ? (duration ? this._time / duration : this.ratio) : this.totalTime(duration * value, suppressEvents);
  };

  p.startTime = function (value) {
    if (!arguments.length) {
      return this._startTime;
    }
    if (value !== this._startTime) {
      this._startTime = value;
      if (this.timeline) {
        if (this.timeline._sortChildren) {
          this.timeline.add(this, value - this._delay); //ensures that any necessary re-sequencing of Animations in the timeline occurs to make sure the rendering order is correct.
        }
      }
    }
    return this;
  };

  p.endTime = function (includeRepeats) {
    return this._startTime + ((includeRepeats != false) ? this.totalDuration() : this.duration()) / this._timeScale;
  };

  p.timeScale = function (value) {
    if (!arguments.length) {
      return this._timeScale;
    }
    var pauseTime, t;
    value = value || _tinyNum; //can't allow zero because it'll throw the math off
    if (this._timeline && this._timeline.smoothChildTiming) {
      pauseTime = this._pauseTime;
      t = (pauseTime || pauseTime === 0) ? pauseTime : this._timeline.totalTime();
      this._startTime = t - ((t - this._startTime) * this._timeScale / value);
    }
    this._timeScale = value;
    t = this.timeline;
    while (t && t.timeline) { //must update the duration/totalDuration of all ancestor timelines immediately in case in the middle of a render loop, one tween alters another tween's timeScale which shoves its startTime before 0, forcing the parent timeline to shift around and shiftChildren() which could affect that next tween's render (startTime). Doesn't matter for the root timeline though.
      t._dirty = true;
      t.totalDuration();
      t = t.timeline;
    }
    return this;
  };

  p.reversed = function (value) {
    if (!arguments.length) {
      return this._reversed;
    }
    if (value != this._reversed) {
      this._reversed = value;
      this.totalTime(((this._timeline && !this._timeline.smoothChildTiming) ? this.totalDuration() - this._totalTime : this._totalTime),
          true);
    }
    return this;
  };

  p.paused = function (value) {
    if (!arguments.length) {
      return this._paused;
    }
    var tl = this._timeline,
        raw, elapsed;
    if (value != this._paused) {
      if (tl) {
        if (!_tickerActive && !value) {
          _ticker.wake();
        }
        raw = tl.rawTime();
        elapsed = raw - this._pauseTime;
        if (!value && tl.smoothChildTiming) {
          this._startTime += elapsed;
          this._uncache(false);
        }
        this._pauseTime = value ? raw : null;
        this._paused = value;
        this._active = this.isActive();
        if (!value && elapsed !== 0 && this._initted && this.duration()) {
          raw = tl.smoothChildTiming ? this._totalTime : (raw - this._startTime) / this._timeScale;
          this.render(raw, (raw === this._totalTime), true); //in case the target's properties changed via some other tween or manual update by the user, we should force a render.
        }
      }
    }
    if (this._gc && !value) {
      this._enabled(true, false);
    }
    return this;
  };

  /*
 * ----------------------------------------------------------------
 * SimpleTimeline
 * ----------------------------------------------------------------
 */
  var SimpleTimeline = _class("core.SimpleTimeline", function (vars) {
    Animation.call(this, 0, vars);
    this.autoRemoveChildren = this.smoothChildTiming = true;
  });

  p = SimpleTimeline.prototype = new Animation();
  p.constructor = SimpleTimeline;
  p.kill()._gc = false;
  p._first = p._last = p._recent = null;
  p._sortChildren = false;

  p.add = p.insert = function (child, position, align, stagger) {
    var prevTween, st;
    child._startTime = Number(position || 0) + child._delay;
    if (child._paused) {
      if (this !== child._timeline) { //we only adjust the _pauseTime if it wasn't in this timeline already. Remember, sometimes a tween will be inserted again into the same timeline when its startTime is changed so that the tweens in the TimelineLite/Max are re-ordered properly in the linked list (so everything renders in the proper order).
        child._pauseTime = child._startTime + ((this.rawTime() - child._startTime) / child._timeScale);
      }
    }
    if (child.timeline) {
      child.timeline._remove(child, true); //removes from existing timeline so that it can be properly added to this one.
    }
    child.timeline = child._timeline = this;
    if (child._gc) {
      child._enabled(true, true);
    }
    prevTween = this._last;
    if (this._sortChildren) {
      st = child._startTime;
      while (prevTween && prevTween._startTime > st) {
        prevTween = prevTween._prev;
      }
    }
    if (prevTween) {
      child._next = prevTween._next;
      prevTween._next = child;
    } else {
      child._next = this._first;
      this._first = child;
    }
    if (child._next) {
      child._next._prev = child;
    } else {
      this._last = child;
    }
    child._prev = prevTween;
    this._recent = child;
    if (this._timeline) {
      this._uncache(true);
    }
    return this;
  };

  p._remove = function (tween, skipDisable) {
    if (tween.timeline === this) {
      if (!skipDisable) {
        tween._enabled(false, true);
      }

      if (tween._prev) {
        tween._prev._next = tween._next;
      } else if (this._first === tween) {
        this._first = tween._next;
      }
      if (tween._next) {
        tween._next._prev = tween._prev;
      } else if (this._last === tween) {
        this._last = tween._prev;
      }
      tween._next = tween._prev = tween.timeline = null;
      if (tween === this._recent) {
        this._recent = this._last;
      }

      if (this._timeline) {
        this._uncache(true);
      }
    }
    return this;
  };

  p.render = function (time, suppressEvents, force) {
    var tween = this._first,
        next;
    this._totalTime = this._time = this._rawPrevTime = time;
    while (tween) {
      next = tween._next; //record it here because the value could change after rendering...
      if (tween._active || (time >= tween._startTime && !tween._paused && !tween._gc)) {
        if (!tween._reversed) {
          tween.render((time - tween._startTime) * tween._timeScale, suppressEvents, force);
        } else {
          tween.render(((!tween._dirty) ? tween._totalDuration : tween.totalDuration()) - ((time - tween._startTime) * tween._timeScale),
              suppressEvents, force);
        }
      }
      tween = next;
    }
  };

  p.rawTime = function () {
    if (!_tickerActive) {
      _ticker.wake();
    }
    return this._totalTime;
  };

  /*
 * ----------------------------------------------------------------
 * TweenLite
 * ----------------------------------------------------------------
 */
  var TweenLite = _class("TweenLite", function (target, duration, vars) {
        Animation.call(this, duration, vars);
        this.render = TweenLite.prototype.render; //speed optimization (avoid prototype lookup on this "hot" method)

        if (target == null) {
          throw "Cannot tween a null target.";
        }

        this.target = target = (typeof(target) !== "string") ? target : TweenLite.selector(target) || target;

        var isSelector = (target.jquery || (target.length && target !== window && target[0] && (target[0] === window || (target[0].nodeType
            && target[0].style && !target.nodeType)))),
            overwrite = this.vars.overwrite,
            i, targ, targets;

        this._overwrite = overwrite = (overwrite == null) ? _overwriteLookup[TweenLite.defaultOverwrite] : (typeof(overwrite) === "number")
            ? overwrite >> 0 : _overwriteLookup[overwrite];

        if ((isSelector || target instanceof Array || (target.push && _isArray(target))) && typeof(target[0]) !== "number") {
          this._targets = targets = _slice(target);  //don't use Array.prototype.slice.call(target, 0) because that doesn't work in IE8 with a NodeList that's returned by querySelectorAll()
          this._propLookup = [];
          this._siblings = [];
          for (i = 0; i < targets.length; i++) {
            targ = targets[i];
            if (!targ) {
              targets.splice(i--, 1);
              continue;
            } else if (typeof(targ) === "string") {
              targ = targets[i--] = TweenLite.selector(targ); //in case it's an array of strings
              if (typeof(targ) === "string") {
                targets.splice(i + 1, 1); //to avoid an endless loop (can't imagine why the selector would return a string, but just in case)
              }
              continue;
            } else if (targ.length && targ !== window && targ[0] && (targ[0] === window || (targ[0].nodeType && targ[0].style
                    && !targ.nodeType))) { //in case the user is passing in an array of selector objects (like jQuery objects), we need to check one more level and pull things out if necessary. Also note that <select> elements pass all the criteria regarding length and the first child having style, so we must also check to ensure the target isn't an HTML node itself.
              targets.splice(i--, 1);
              this._targets = targets = targets.concat(_slice(targ));
              continue;
            }
            this._siblings[i] = _register(targ, this, false);
            if (overwrite === 1) {
              if (this._siblings[i].length > 1) {
                _applyOverwrite(targ, this, null, 1, this._siblings[i]);
              }
            }
          }

        } else {
          this._propLookup = {};
          this._siblings = _register(target, this, false);
          if (overwrite === 1) {
            if (this._siblings.length > 1) {
              _applyOverwrite(target, this, null, 1, this._siblings);
            }
          }
        }
        if (this.vars.immediateRender || (duration === 0 && this._delay === 0 && this.vars.immediateRender !== false)) {
          this._time = -_tinyNum; //forces a render without having to set the render() "force" parameter to true because we want to allow lazying by default (using the "force" parameter always forces an immediate full render)
          this.render(Math.min(0, -this._delay)); //in case delay is negative
        }
      }, true),
      _isSelector = function (v) {
        return (v && v.length && v !== window && v[0] && (v[0] === window || (v[0].nodeType && v[0].style && !v.nodeType))); //we cannot check "nodeType" if the target is window from within an iframe, otherwise it will trigger a security error in some browsers like Firefox.
      },
      _autoCSS = function (vars, target) {
        var css = {},
            p;
        for (p in vars) {
          if (!_reservedProps[p] && (!(p in target) || p === "transform" || p === "x" || p === "y" || p === "width" || p === "height" || p
                  === "className" || p === "border") && (!_plugins[p] || (_plugins[p] && _plugins[p]._autoCSS))) { //note: <img> elements contain read-only "x" and "y" properties. We should also prioritize editing css width/height rather than the element's properties.
            css[p] = vars[p];
            delete vars[p];
          }
        }
        vars.css = css;
      };

  p = TweenLite.prototype = new Animation();
  p.constructor = TweenLite;
  p.kill()._gc = false;

//----TweenLite defaults, overwrite management, and root updates ----------------------------------------------------

  p.ratio = 0;
  p._firstPT = p._targets = p._overwrittenProps = p._startAt = null;
  p._notifyPluginsOfEnabled = p._lazy = false;

  TweenLite.version = "1.20.3";
  TweenLite.defaultEase = p._ease = new Ease(null, null, 1, 1);
  TweenLite.defaultOverwrite = "auto";
  TweenLite.ticker = _ticker;
  TweenLite.autoSleep = 120;
  TweenLite.lagSmoothing = function (threshold, adjustedLag) {
    _ticker.lagSmoothing(threshold, adjustedLag);
  };

  TweenLite.selector = window.$ || window.jQuery || function (e) {
    var selector = window.$ || window.jQuery;
    if (selector) {
      TweenLite.selector = selector;
      return selector(e);
    }
    return (typeof(_doc) === "undefined") ? e : (_doc.querySelectorAll ? _doc.querySelectorAll(e) : _doc.getElementById(
        (e.charAt(0) === "#") ? e.substr(1) : e));
  };

  var _lazyTweens = [],
      _lazyLookup = {},
      _numbersExp = /(?:(-|-=|\+=)?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/ig,
      _relExp = /[\+-]=-?[\.\d]/,
      //_nonNumbersExp = /(?:([\-+](?!(\d|=)))|[^\d\-+=e]|(e(?![\-+][\d])))+/ig,
      _setRatio = function (v) {
        var pt = this._firstPT,
            min = 0.000001,
            val;
        while (pt) {
          val = !pt.blob ? pt.c * v + pt.s : (v === 1 && this.end != null) ? this.end : v ? this.join("") : this.start;
          if (pt.m) {
            val = pt.m(val, this._target || pt.t);
          } else if (val < min) {
            if (val > -min && !pt.blob) { //prevents issues with converting very small numbers to strings in the browser
              val = 0;
            }
          }
          if (!pt.f) {
            pt.t[pt.p] = val;
          } else if (pt.fp) {
            pt.t[pt.p](pt.fp, val);
          } else {
            pt.t[pt.p](val);
          }
          pt = pt._next;
        }
      },
      //compares two strings (start/end), finds the numbers that are different and spits back an array representing the whole value but with the changing values isolated as elements. For example, "rgb(0,0,0)" and "rgb(100,50,0)" would become ["rgb(", 0, ",", 50, ",0)"]. Notice it merges the parts that are identical (performance optimization). The array also has a linked list of PropTweens attached starting with _firstPT that contain the tweening data (t, p, s, c, f, etc.). It also stores the starting value as a "start" property so that we can revert to it if/when necessary, like when a tween rewinds fully. If the quantity of numbers differs between the start and end, it will always prioritize the end value(s). The pt parameter is optional - it's for a PropTween that will be appended to the end of the linked list and is typically for actually setting the value after all of the elements have been updated (with array.join("")).
      _blobDif = function (start, end, filter, pt) {
        var a = [],
            charIndex = 0,
            s = "",
            color = 0,
            startNums, endNums, num, i, l, nonNumbers, currentNum;
        a.start = start;
        a.end = end;
        start = a[0] = start + ""; //ensure values are strings
        end = a[1] = end + "";
        if (filter) {
          filter(a); //pass an array with the starting and ending values and let the filter do whatever it needs to the values.
          start = a[0];
          end = a[1];
        }
        a.length = 0;
        startNums = start.match(_numbersExp) || [];
        endNums = end.match(_numbersExp) || [];
        if (pt) {
          pt._next = null;
          pt.blob = 1;
          a._firstPT = a._applyPT = pt; //apply last in the linked list (which means inserting it first)
        }
        l = endNums.length;
        for (i = 0; i < l; i++) {
          currentNum = endNums[i];
          nonNumbers = end.substr(charIndex, end.indexOf(currentNum, charIndex) - charIndex);
          s += (nonNumbers || !i) ? nonNumbers : ","; //note: SVG spec allows omission of comma/space when a negative sign is wedged between two numbers, like 2.5-5.3 instead of 2.5,-5.3 but when tweening, the negative value may switch to positive, so we insert the comma just in case.
          charIndex += nonNumbers.length;
          if (color) { //sense rgba() values and round them.
            color = (color + 1) % 5;
          } else if (nonNumbers.substr(-5) === "rgba(") {
            color = 1;
          }
          if (currentNum === startNums[i] || startNums.length <= i) {
            s += currentNum;
          } else {
            if (s) {
              a.push(s);
              s = "";
            }
            num = parseFloat(startNums[i]);
            a.push(num);
            a._firstPT = {
              _next: a._firstPT,
              t: a,
              p: a.length - 1,
              s: num,
              c: ((currentNum.charAt(1) === "=") ? parseInt(currentNum.charAt(0) + "1", 10) * parseFloat(currentNum.substr(2))
                  : (parseFloat(currentNum) - num)) || 0,
              f: 0,
              m: (color && color < 4) ? Math.round : 0
            };
            //note: we don't set _prev because we'll never need to remove individual PropTweens from this list.
          }
          charIndex += currentNum.length;
        }
        s += end.substr(charIndex);
        if (s) {
          a.push(s);
        }
        a.setRatio = _setRatio;
        if (_relExp.test(end)) { //if the end string contains relative values, delete it so that on the final render (in _setRatio()), we don't actually set it to the string with += or -= characters (forces it to use the calculated value).
          a.end = null;
        }
        return a;
      },
      //note: "funcParam" is only necessary for function-based getters/setters that require an extra parameter like getAttribute("width") and setAttribute("width", value). In this example, funcParam would be "width". Used by AttrPlugin for example.
      _addPropTween = function (target, prop, start, end, overwriteProp, mod, funcParam, stringFilter, index) {
        if (typeof(end) === "function") {
          end = end(index || 0, target);
        }
        var type = typeof(target[prop]),
            getterName = (type !== "function") ? "" : ((prop.indexOf("set") || typeof(target["get" + prop.substr(3)]) !== "function") ? prop
                : "get" + prop.substr(3)),
            s = (start !== "get") ? start : !getterName ? target[prop] : funcParam ? target[getterName](funcParam) : target[getterName](),
            isRelative = (typeof(end) === "string" && end.charAt(1) === "="),
            pt = {
              t: target,
              p: prop,
              s: s,
              f: (type === "function"),
              pg: 0,
              n: overwriteProp || prop,
              m: (!mod ? 0 : (typeof(mod) === "function") ? mod : Math.round),
              pr: 0,
              c: isRelative ? parseInt(end.charAt(0) + "1", 10) * parseFloat(end.substr(2)) : (parseFloat(end) - s) || 0
            },
            blob;

        if (typeof(s) !== "number" || (typeof(end) !== "number" && !isRelative)) {
          if (funcParam || isNaN(s) || (!isRelative && isNaN(end)) || typeof(s) === "boolean" || typeof(end) === "boolean") {
            //a blob (string that has multiple numbers in it)
            pt.fp = funcParam;
            blob = _blobDif(s, (isRelative ? parseFloat(pt.s) + pt.c : end), stringFilter || TweenLite.defaultStringFilter, pt);
            pt = {t: blob, p: "setRatio", s: 0, c: 1, f: 2, pg: 0, n: overwriteProp || prop, pr: 0, m: 0}; //"2" indicates it's a Blob property tween. Needed for RoundPropsPlugin for example.
          } else {
            pt.s = parseFloat(s);
            if (!isRelative) {
              pt.c = (parseFloat(end) - pt.s) || 0;
            }
          }
        }
        if (pt.c) { //only add it to the linked list if there's a change.
          if ((pt._next = this._firstPT)) {
            pt._next._prev = pt;
          }
          this._firstPT = pt;
          return pt;
        }
      },
      _internals = TweenLite._internals = {
        isArray: _isArray,
        isSelector: _isSelector,
        lazyTweens: _lazyTweens,
        blobDif: _blobDif
      }, //gives us a way to expose certain private values to other GreenSock classes without contaminating tha main TweenLite object.
      _plugins = TweenLite._plugins = {},
      _tweenLookup = _internals.tweenLookup = {},
      _tweenLookupNum = 0,
      _reservedProps = _internals.reservedProps = {
        ease: 1,
        delay: 1,
        overwrite: 1,
        onComplete: 1,
        onCompleteParams: 1,
        onCompleteScope: 1,
        useFrames: 1,
        runBackwards: 1,
        startAt: 1,
        onUpdate: 1,
        onUpdateParams: 1,
        onUpdateScope: 1,
        onStart: 1,
        onStartParams: 1,
        onStartScope: 1,
        onReverseComplete: 1,
        onReverseCompleteParams: 1,
        onReverseCompleteScope: 1,
        onRepeat: 1,
        onRepeatParams: 1,
        onRepeatScope: 1,
        easeParams: 1,
        yoyo: 1,
        immediateRender: 1,
        repeat: 1,
        repeatDelay: 1,
        data: 1,
        paused: 1,
        reversed: 1,
        autoCSS: 1,
        lazy: 1,
        onOverwrite: 1,
        callbackScope: 1,
        stringFilter: 1,
        id: 1,
        yoyoEase: 1
      },
      _overwriteLookup = {
        none: 0,
        all: 1,
        auto: 2,
        concurrent: 3,
        allOnStart: 4,
        preexisting: 5,
        "true": 1,
        "false": 0
      },
      _rootFramesTimeline = Animation._rootFramesTimeline = new SimpleTimeline(),
      _rootTimeline = Animation._rootTimeline = new SimpleTimeline(),
      _nextGCFrame = 30,
      _lazyRender = _internals.lazyRender = function () {
        var i = _lazyTweens.length,
            tween;
        _lazyLookup = {};
        while (--i > -1) {
          tween = _lazyTweens[i];
          if (tween && tween._lazy !== false) {
            tween.render(tween._lazy[0], tween._lazy[1], true);
            tween._lazy = false;
          }
        }
        _lazyTweens.length = 0;
      };

  _rootTimeline._startTime = _ticker.time;
  _rootFramesTimeline._startTime = _ticker.frame;
  _rootTimeline._active = _rootFramesTimeline._active = true;
  setTimeout(_lazyRender, 1); //on some mobile devices, there isn't a "tick" before code runs which means any lazy renders wouldn't run before the next official "tick".

  Animation._updateRoot = TweenLite.render = function () {
    var i, a, p;
    if (_lazyTweens.length) { //if code is run outside of the requestAnimationFrame loop, there may be tweens queued AFTER the engine refreshed, so we need to ensure any pending renders occur before we refresh again.
      _lazyRender();
    }
    _rootTimeline.render((_ticker.time - _rootTimeline._startTime) * _rootTimeline._timeScale, false, false);
    _rootFramesTimeline.render((_ticker.frame - _rootFramesTimeline._startTime) * _rootFramesTimeline._timeScale, false, false);
    if (_lazyTweens.length) {
      _lazyRender();
    }
    if (_ticker.frame >= _nextGCFrame) { //dump garbage every 120 frames or whatever the user sets TweenLite.autoSleep to
      _nextGCFrame = _ticker.frame + (parseInt(TweenLite.autoSleep, 10) || 120);
      for (p in _tweenLookup) {
        a = _tweenLookup[p].tweens;
        i = a.length;
        while (--i > -1) {
          if (a[i]._gc) {
            a.splice(i, 1);
          }
        }
        if (a.length === 0) {
          delete _tweenLookup[p];
        }
      }
      //if there are no more tweens in the root timelines, or if they're all paused, make the _timer sleep to reduce load on the CPU slightly
      p = _rootTimeline._first;
      if (!p || p._paused) {
        if (TweenLite.autoSleep && !_rootFramesTimeline._first && _ticker._listeners.tick.length === 1) {
          while (p && p._paused) {
            p = p._next;
          }
          if (!p) {
            _ticker.sleep();
          }
        }
      }
    }
  };

  _ticker.addEventListener("tick", Animation._updateRoot);

  var _register = function (target, tween, scrub) {
        var id = target._gsTweenID, a, i;
        if (!_tweenLookup[id || (target._gsTweenID = id = "t" + (_tweenLookupNum++))]) {
          _tweenLookup[id] = {target: target, tweens: []};
        }
        if (tween) {
          a = _tweenLookup[id].tweens;
          a[(i = a.length)] = tween;
          if (scrub) {
            while (--i > -1) {
              if (a[i] === tween) {
                a.splice(i, 1);
              }
            }
          }
        }
        return _tweenLookup[id].tweens;
      },
      _onOverwrite = function (overwrittenTween, overwritingTween, target, killedProps) {
        var func = overwrittenTween.vars.onOverwrite, r1, r2;
        if (func) {
          r1 = func(overwrittenTween, overwritingTween, target, killedProps);
        }
        func = TweenLite.onOverwrite;
        if (func) {
          r2 = func(overwrittenTween, overwritingTween, target, killedProps);
        }
        return (r1 !== false && r2 !== false);
      },
      _applyOverwrite = function (target, tween, props, mode, siblings) {
        var i, changed, curTween, l;
        if (mode === 1 || mode >= 4) {
          l = siblings.length;
          for (i = 0; i < l; i++) {
            if ((curTween = siblings[i]) !== tween) {
              if (!curTween._gc) {
                if (curTween._kill(null, target, tween)) {
                  changed = true;
                }
              }
            } else if (mode === 5) {
              break;
            }
          }
          return changed;
        }
        //NOTE: Add 0.0000000001 to overcome floating point errors that can cause the startTime to be VERY slightly off (when a tween's time() is set for example)
        var startTime = tween._startTime + _tinyNum,
            overlaps = [],
            oCount = 0,
            zeroDur = (tween._duration === 0),
            globalStart;
        i = siblings.length;
        while (--i > -1) {
          if ((curTween = siblings[i]) === tween || curTween._gc || curTween._paused) {
            //ignore
          } else if (curTween._timeline !== tween._timeline) {
            globalStart = globalStart || _checkOverlap(tween, 0, zeroDur);
            if (_checkOverlap(curTween, globalStart, zeroDur) === 0) {
              overlaps[oCount++] = curTween;
            }
          } else if (curTween._startTime <= startTime) {
            if (curTween._startTime + curTween.totalDuration() / curTween._timeScale
                > startTime) {
              if (!((zeroDur || !curTween._initted) && startTime - curTween._startTime <= 0.0000000002)) {
                overlaps[oCount++] = curTween;
              }
            }
          }
        }

        i = oCount;
        while (--i > -1) {
          curTween = overlaps[i];
          if (mode === 2) {
            if (curTween._kill(props, target, tween)) {
              changed = true;
            }
          }
          if (mode !== 2 || (!curTween._firstPT && curTween._initted)) {
            if (mode !== 2 && !_onOverwrite(curTween, tween)) {
              continue;
            }
            if (curTween._enabled(false, false)) { //if all property tweens have been overwritten, kill the tween.
              changed = true;
            }
          }
        }
        return changed;
      },
      _checkOverlap = function (tween, reference, zeroDur) {
        var tl = tween._timeline,
            ts = tl._timeScale,
            t = tween._startTime;
        while (tl._timeline) {
          t += tl._startTime;
          ts *= tl._timeScale;
          if (tl._paused) {
            return -100;
          }
          tl = tl._timeline;
        }
        t /= ts;
        return (t > reference) ? t - reference : ((zeroDur && t === reference) || (!tween._initted && t - reference < 2 * _tinyNum))
            ? _tinyNum : ((t += tween.totalDuration() / tween._timeScale / ts) > reference + _tinyNum) ? 0 : t - reference - _tinyNum;
      };

//---- TweenLite instance methods -----------------------------------------------------------------------------

  p._init = function () {
    var v = this.vars,
        op = this._overwrittenProps,
        dur = this._duration,
        immediate = !!v.immediateRender,
        ease = v.ease,
        i, initPlugins, pt, p, startVars, l;
    if (v.startAt) {
      if (this._startAt) {
        this._startAt.render(-1, true); //if we've run a startAt previously (when the tween instantiated), we should revert it so that the values re-instantiate correctly particularly for relative tweens. Without this, a TweenLite.fromTo(obj, 1, {x:"+=100"}, {x:"-=100"}), for example, would actually jump to +=200 because the startAt would run twice, doubling the relative change.
        this._startAt.kill();
      }
      startVars = {};
      for (p in v.startAt) { //copy the properties/values into a new object to avoid collisions, like var to = {x:0}, from = {x:500}; timeline.fromTo(e, 1, from, to).fromTo(e, 1, to, from);
        startVars[p] = v.startAt[p];
      }
      startVars.data = "isStart";
      startVars.overwrite = false;
      startVars.immediateRender = true;
      startVars.lazy = (immediate && v.lazy !== false);
      startVars.startAt = startVars.delay = null; //no nesting of startAt objects allowed (otherwise it could cause an infinite loop).
      startVars.onUpdate = v.onUpdate;
      startVars.onUpdateParams = v.onUpdateParams;
      startVars.onUpdateScope = v.onUpdateScope || v.callbackScope || this;
      this._startAt = TweenLite.to(this.target, 0, startVars);
      if (immediate) {
        if (this._time > 0) {
          this._startAt = null; //tweens that render immediately (like most from() and fromTo() tweens) shouldn't revert when their parent timeline's playhead goes backward past the startTime because the initial render could have happened anytime and it shouldn't be directly correlated to this tween's startTime. Imagine setting up a complex animation where the beginning states of various objects are rendered immediately but the tween doesn't happen for quite some time - if we revert to the starting values as soon as the playhead goes backward past the tween's startTime, it will throw things off visually. Reversion should only happen in TimelineLite/Max instances where immediateRender was false (which is the default in the convenience methods like from()).
        } else if (dur !== 0) {
          return; //we skip initialization here so that overwriting doesn't occur until the tween actually begins. Otherwise, if you create several immediateRender:true tweens of the same target/properties to drop into a TimelineLite or TimelineMax, the last one created would overwrite the first ones because they didn't get placed into the timeline yet before the first render occurs and kicks in overwriting.
        }
      }
    } else if (v.runBackwards && dur !== 0) {
      //from() tweens must be handled uniquely: their beginning values must be rendered but we don't want overwriting to occur yet (when time is still 0). Wait until the tween actually begins before doing all the routines like overwriting. At that time, we should render at the END of the tween to ensure that things initialize correctly (remember, from() tweens go backwards)
      if (this._startAt) {
        this._startAt.render(-1, true);
        this._startAt.kill();
        this._startAt = null;
      } else {
        if (this._time !== 0) { //in rare cases (like if a from() tween runs and then is invalidate()-ed), immediateRender could be true but the initial forced-render gets skipped, so there's no need to force the render in this context when the _time is greater than 0
          immediate = false;
        }
        pt = {};
        for (p in v) { //copy props into a new object and skip any reserved props, otherwise onComplete or onUpdate or onStart could fire. We should, however, permit autoCSS to go through.
          if (!_reservedProps[p] || p === "autoCSS") {
            pt[p] = v[p];
          }
        }
        pt.overwrite = 0;
        pt.data = "isFromStart"; //we tag the tween with as "isFromStart" so that if [inside a plugin] we need to only do something at the very END of a tween, we have a way of identifying this tween as merely the one that's setting the beginning values for a "from()" tween. For example, clearProps in CSSPlugin should only get applied at the very END of a tween and without this tag, from(...{height:100, clearProps:"height", delay:1}) would wipe the height at the beginning of the tween and after 1 second, it'd kick back in.
        pt.lazy = (immediate && v.lazy !== false);
        pt.immediateRender = immediate; //zero-duration tweens render immediately by default, but if we're not specifically instructed to render this tween immediately, we should skip this and merely _init() to record the starting values (rendering them immediately would push them to completion which is wasteful in that case - we'd have to render(-1) immediately after)
        this._startAt = TweenLite.to(this.target, 0, pt);
        if (!immediate) {
          this._startAt._init(); //ensures that the initial values are recorded
          this._startAt._enabled(false); //no need to have the tween render on the next cycle. Disable it because we'll always manually control the renders of the _startAt tween.
          if (this.vars.immediateRender) {
            this._startAt = null;
          }
        } else if (this._time === 0) {
          return;
        }
      }
    }
    this._ease = ease = (!ease) ? TweenLite.defaultEase : (ease instanceof Ease) ? ease : (typeof(ease) === "function") ? new Ease(ease,
        v.easeParams) : _easeMap[ease] || TweenLite.defaultEase;
    if (v.easeParams instanceof Array && ease.config) {
      this._ease = ease.config.apply(ease, v.easeParams);
    }
    this._easeType = this._ease._type;
    this._easePower = this._ease._power;
    this._firstPT = null;

    if (this._targets) {
      l = this._targets.length;
      for (i = 0; i < l; i++) {
        if (this._initProps(this._targets[i], (this._propLookup[i] = {}), this._siblings[i], (op ? op[i] : null), i)) {
          initPlugins = true;
        }
      }
    } else {
      initPlugins = this._initProps(this.target, this._propLookup, this._siblings, op, 0);
    }

    if (initPlugins) {
      TweenLite._onPluginEvent("_onInitAllProps", this); //reorders the array in order of priority. Uses a static TweenPlugin method in order to minimize file size in TweenLite
    }
    if (op) if (!this._firstPT) if (typeof(this.target) !== "function") { //if all tweening properties have been overwritten, kill the tween. If the target is a function, it's probably a delayedCall so let it live.
      this._enabled(false, false);
    }
    if (v.runBackwards) {
      pt = this._firstPT;
      while (pt) {
        pt.s += pt.c;
        pt.c = -pt.c;
        pt = pt._next;
      }
    }
    this._onUpdate = v.onUpdate;
    this._initted = true;
  };

  p._initProps = function (target, propLookup, siblings, overwrittenProps, index) {
    var p, i, initPlugins, plugin, pt, v;
    if (target == null) {
      return false;
    }

    if (_lazyLookup[target._gsTweenID]) {
      _lazyRender(); //if other tweens of the same target have recently initted but haven't rendered yet, we've got to force the render so that the starting values are correct (imagine populating a timeline with a bunch of sequential tweens and then jumping to the end)
    }

    if (!this.vars.css) {
      if (target.style) {
        if (target !== window && target.nodeType) {
          if (_plugins.css) {
            if (this.vars.autoCSS !== false) { //it's so common to use TweenLite/Max to animate the css of DOM elements, we assume that if the target is a DOM element, that's what is intended (a convenience so that users don't have to wrap things in css:{}, although we still recommend it for a slight performance boost and better specificity). Note: we cannot check "nodeType" on the window inside an iframe.
              _autoCSS(this.vars, target);
            }
          }
        }
      }
    }
    for (p in this.vars) {
      v = this.vars[p];
      if (_reservedProps[p]) {
        if (v) {
          if ((v instanceof Array) || (v.push && _isArray(v))) {
            if (v.join("").indexOf("{self}") !== -1) {
              this.vars[p] = v = this._swapSelfInParams(v, this);
            }
          }
        }

      } else if (_plugins[p] && (plugin = new _plugins[p]())._onInitTween(target, this.vars[p], this, index)) {

        //t - target 		[object]
        //p - property 		[string]
        //s - start			[number]
        //c - change		[number]
        //f - isFunction	[boolean]
        //n - name			[string]
        //pg - isPlugin 	[boolean]
        //pr - priority		[number]
        //m - mod           [function | 0]
        this._firstPT = pt = {
          _next: this._firstPT,
          t: plugin,
          p: "setRatio",
          s: 0,
          c: 1,
          f: 1,
          n: p,
          pg: 1,
          pr: plugin._priority,
          m: 0
        };
        i = plugin._overwriteProps.length;
        while (--i > -1) {
          propLookup[plugin._overwriteProps[i]] = this._firstPT;
        }
        if (plugin._priority || plugin._onInitAllProps) {
          initPlugins = true;
        }
        if (plugin._onDisable || plugin._onEnable) {
          this._notifyPluginsOfEnabled = true;
        }
        if (pt._next) {
          pt._next._prev = pt;
        }

      } else {
        propLookup[p] = _addPropTween.call(this, target, p, "get", v, p, 0, null, this.vars.stringFilter, index);
      }
    }

    if (overwrittenProps) {
      if (this._kill(overwrittenProps, target)) { //another tween may have tried to overwrite properties of this tween before init() was called (like if two tweens start at the same time, the one created second will run first)
        return this._initProps(target, propLookup, siblings, overwrittenProps, index);
      }
    }
    if (this._overwrite > 1) if (this._firstPT) if (siblings.length > 1) if (_applyOverwrite(target, this, propLookup, this._overwrite,
            siblings)) {
      this._kill(propLookup, target);
      return this._initProps(target, propLookup, siblings, overwrittenProps, index);
    }
    if (this._firstPT) {
      if ((this.vars.lazy !== false && this._duration) || (this.vars.lazy && !this._duration)) { //zero duration tweens don't lazy render by default; everything else does.
        _lazyLookup[target._gsTweenID] = true;
      }
    }
    return initPlugins;
  };

  p.render = function (time, suppressEvents, force) {
    var prevTime = this._time,
        duration = this._duration,
        prevRawPrevTime = this._rawPrevTime,
        isComplete, callback, pt, rawPrevTime;
    if (time >= duration - 0.0000001 && time >= 0) { //to work around occasional floating point math artifacts.
      this._totalTime = this._time = duration;
      this.ratio = this._ease._calcEnd ? this._ease.getRatio(1) : 1;
      if (!this._reversed) {
        isComplete = true;
        callback = "onComplete";
        force = (force || this._timeline.autoRemoveChildren); //otherwise, if the animation is unpaused/activated after it's already finished, it doesn't get removed from the parent timeline.
      }
      if (duration === 0) {
        if (this._initted || !this.vars.lazy || force) { //zero-duration tweens are tricky because we must discern the momentum/direction of time in order to determine whether the starting values should be rendered or the ending values. If the "playhead" of its timeline goes past the zero-duration tween in the forward direction or lands directly on it, the end values should be rendered, but if the timeline's "playhead" moves past it in the backward direction (from a postitive time to a negative time), the starting values must be rendered.
          if (this._startTime === this._timeline._duration) { //if a zero-duration tween is at the VERY end of a timeline and that timeline renders at its end, it will typically add a tiny bit of cushion to the render time to prevent rounding errors from getting in the way of tweens rendering their VERY end. If we then reverse() that timeline, the zero-duration tween will trigger its onReverseComplete even though technically the playhead didn't pass over it again. It's a very specific edge case we must accommodate.
            time = 0;
          }
          if (prevRawPrevTime < 0 || (time <= 0 && time >= -0.0000001) || (prevRawPrevTime === _tinyNum && this.data
                  !== "isPause")) {
            if (prevRawPrevTime !== time) { //note: when this.data is "isPause", it's a callback added by addPause() on a timeline that we should not be triggered when LEAVING its exact start time. In other words, tl.addPause(1).play(1) shouldn't pause.
              force = true;
              if (prevRawPrevTime > _tinyNum) {
                callback = "onReverseComplete";
              }
            }
          }
          this._rawPrevTime = rawPrevTime = (!suppressEvents || time || prevRawPrevTime === time) ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
        }
      }

    } else if (time < 0.0000001) { //to work around occasional floating point math artifacts, round super small values to 0.
      this._totalTime = this._time = 0;
      this.ratio = this._ease._calcEnd ? this._ease.getRatio(0) : 0;
      if (prevTime !== 0 || (duration === 0 && prevRawPrevTime > 0)) {
        callback = "onReverseComplete";
        isComplete = this._reversed;
      }
      if (time < 0) {
        this._active = false;
        if (duration === 0) {
          if (this._initted || !this.vars.lazy || force) { //zero-duration tweens are tricky because we must discern the momentum/direction of time in order to determine whether the starting values should be rendered or the ending values. If the "playhead" of its timeline goes past the zero-duration tween in the forward direction or lands directly on it, the end values should be rendered, but if the timeline's "playhead" moves past it in the backward direction (from a postitive time to a negative time), the starting values must be rendered.
            if (prevRawPrevTime >= 0 && !(prevRawPrevTime === _tinyNum && this.data === "isPause")) {
              force = true;
            }
            this._rawPrevTime = rawPrevTime = (!suppressEvents || time || prevRawPrevTime === time) ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
          }
        }
      }
      if (!this._initted || (this._startAt && this._startAt.progress())) { //if we render the very beginning (time == 0) of a fromTo(), we must force the render (normal tweens wouldn't need to render at a time of 0 when the prevTime was also 0). This is also mandatory to make sure overwriting kicks in immediately. Also, we check progress() because if startAt has already rendered at its end, we should force a render at its beginning. Otherwise, if you put the playhead directly on top of where a fromTo({immediateRender:false}) starts, and then move it backwards, the from() won't revert its values.
        force = true;
      }
    } else {
      this._totalTime = this._time = time;

      if (this._easeType) {
        var r = time / duration, type = this._easeType, pow = this._easePower;
        if (type === 1 || (type === 3 && r >= 0.5)) {
          r = 1 - r;
        }
        if (type === 3) {
          r *= 2;
        }
        if (pow === 1) {
          r *= r;
        } else if (pow === 2) {
          r *= r * r;
        } else if (pow === 3) {
          r *= r * r * r;
        } else if (pow === 4) {
          r *= r * r * r * r;
        }

        if (type === 1) {
          this.ratio = 1 - r;
        } else if (type === 2) {
          this.ratio = r;
        } else if (time / duration < 0.5) {
          this.ratio = r / 2;
        } else {
          this.ratio = 1 - (r / 2);
        }

      } else {
        this.ratio = this._ease.getRatio(time / duration);
      }
    }

    if (this._time === prevTime && !force) {
      return;
    } else if (!this._initted) {
      this._init();
      if (!this._initted || this._gc) { //immediateRender tweens typically won't initialize until the playhead advances (_time is greater than 0) in order to ensure that overwriting occurs properly. Also, if all of the tweening properties have been overwritten (which would cause _gc to be true, as set in _init()), we shouldn't continue otherwise an onStart callback could be called for example.
        return;
      } else if (!force && this._firstPT && ((this.vars.lazy !== false && this._duration) || (this.vars.lazy && !this._duration))) {
        this._time = this._totalTime = prevTime;
        this._rawPrevTime = prevRawPrevTime;
        _lazyTweens.push(this);
        this._lazy = [time, suppressEvents];
        return;
      }
      //_ease is initially set to defaultEase, so now that init() has run, _ease is set properly and we need to recalculate the ratio. Overall this is faster than using conditional logic earlier in the method to avoid having to set ratio twice because we only init() once but renderTime() gets called VERY frequently.
      if (this._time && !isComplete) {
        this.ratio = this._ease.getRatio(this._time / duration);
      } else if (isComplete && this._ease._calcEnd) {
        this.ratio = this._ease.getRatio((this._time === 0) ? 0 : 1);
      }
    }
    if (this._lazy !== false) { //in case a lazy render is pending, we should flush it because the new render is occurring now (imagine a lazy tween instantiating and then immediately the user calls tween.seek(tween.duration()), skipping to the end - the end render would be forced, and then if we didn't flush the lazy render, it'd fire AFTER the seek(), rendering it at the wrong time.
      this._lazy = false;
    }
    if (!this._active) {
      if (!this._paused && this._time !== prevTime && time >= 0) {
        this._active = true;  //so that if the user renders a tween (as opposed to the timeline rendering it), the timeline is forced to re-render and align it with the proper time/frame on the next rendering cycle. Maybe the tween already finished but the user manually re-renders it as halfway done.
      }
    }
    if (prevTime === 0) {
      if (this._startAt) {
        if (time >= 0) {
          this._startAt.render(time, true, force);
        } else if (!callback) {
          callback = "_dummyGS"; //if no callback is defined, use a dummy value just so that the condition at the end evaluates as true because _startAt should render AFTER the normal render loop when the time is negative. We could handle this in a more intuitive way, of course, but the render loop is the MOST important thing to optimize, so this technique allows us to avoid adding extra conditional logic in a high-frequency area.
        }
      }
      if (this.vars.onStart) {
        if (this._time !== 0 || duration === 0) {
          if (!suppressEvents) {
            this._callback("onStart");
          }
        }
      }
    }
    pt = this._firstPT;
    while (pt) {
      if (pt.f) {
        pt.t[pt.p](pt.c * this.ratio + pt.s);
      } else {
        pt.t[pt.p] = pt.c * this.ratio + pt.s;
      }
      pt = pt._next;
    }

    if (this._onUpdate) {
      if (time < 0) {
        if (this._startAt && time !== -0.0001) { //if the tween is positioned at the VERY beginning (_startTime 0) of its parent timeline, it's illegal for the playhead to go back further, so we should not render the recorded startAt values.
          this._startAt.render(time, true, force); //note: for performance reasons, we tuck this conditional logic inside less traveled areas (most tweens don't have an onUpdate). We'd just have it at the end before the onComplete, but the values should be updated before any onUpdate is called, so we ALSO put it here and then if it's not called, we do so later near the onComplete.
        }
      }
      if (!suppressEvents) {
        if (this._time !== prevTime || isComplete || force) {
          this._callback("onUpdate");
        }
      }
    }
    if (callback) {
      if (!this._gc || force) { //check _gc because there's a chance that kill() could be called in an onUpdate
        if (time < 0 && this._startAt && !this._onUpdate && time !== -0.0001) { //-0.0001 is a special value that we use when looping back to the beginning of a repeated TimelineMax, in which case we shouldn't render the _startAt values.
          this._startAt.render(time, true, force);
        }
        if (isComplete) {
          if (this._timeline.autoRemoveChildren) {
            this._enabled(false, false);
          }
          this._active = false;
        }
        if (!suppressEvents && this.vars[callback]) {
          this._callback(callback);
        }
        if (duration === 0 && this._rawPrevTime === _tinyNum && rawPrevTime !== _tinyNum) { //the onComplete or onReverseComplete could trigger movement of the playhead and for zero-duration tweens (which must discern direction) that land directly back on their start time, we don't want to fire again on the next render. Think of several addPause()'s in a timeline that forces the playhead to a certain spot, but what if it's already paused and another tween is tweening the "time" of the timeline? Each time it moves [forward] past that spot, it would move back, and since suppressEvents is true, it'd reset _rawPrevTime to _tinyNum so that when it begins again, the callback would fire (so ultimately it could bounce back and forth during that tween). Again, this is a very uncommon scenario, but possible nonetheless.
          this._rawPrevTime = 0;
        }
      }
    }
  };

  p._kill = function (vars, target, overwritingTween) {
    if (vars === "all") {
      vars = null;
    }
    if (vars == null) {
      if (target == null || target === this.target) {
        this._lazy = false;
        return this._enabled(false, false);
      }
    }
    target = (typeof(target) !== "string") ? (target || this._targets || this.target) : TweenLite.selector(target) || target;
    var simultaneousOverwrite = (overwritingTween && this._time && overwritingTween._startTime === this._startTime && this._timeline
        === overwritingTween._timeline),
        i, overwrittenProps, p, pt, propLookup, changed, killProps, record, killed;
    if ((_isArray(target) || _isSelector(target)) && typeof(target[0]) !== "number") {
      i = target.length;
      while (--i > -1) {
        if (this._kill(vars, target[i], overwritingTween)) {
          changed = true;
        }
      }
    } else {
      if (this._targets) {
        i = this._targets.length;
        while (--i > -1) {
          if (target === this._targets[i]) {
            propLookup = this._propLookup[i] || {};
            this._overwrittenProps = this._overwrittenProps || [];
            overwrittenProps = this._overwrittenProps[i] = vars ? this._overwrittenProps[i] || {} : "all";
            break;
          }
        }
      } else if (target !== this.target) {
        return false;
      } else {
        propLookup = this._propLookup;
        overwrittenProps = this._overwrittenProps = vars ? this._overwrittenProps || {} : "all";
      }

      if (propLookup) {
        killProps = vars || propLookup;
        record = (vars !== overwrittenProps && overwrittenProps !== "all" && vars !== propLookup && (typeof(vars) !== "object"
            || !vars._tempKill)); //_tempKill is a super-secret way to delete a particular tweening property but NOT have it remembered as an official overwritten property (like in BezierPlugin)
        if (overwritingTween && (TweenLite.onOverwrite || this.vars.onOverwrite)) {
          for (p in killProps) {
            if (propLookup[p]) {
              if (!killed) {
                killed = [];
              }
              killed.push(p);
            }
          }
          if ((killed || !vars) && !_onOverwrite(this, overwritingTween, target, killed)) { //if the onOverwrite returned false, that means the user wants to override the overwriting (cancel it).
            return false;
          }
        }

        for (p in killProps) {
          if ((pt = propLookup[p])) {
            if (simultaneousOverwrite) { //if another tween overwrites this one and they both start at exactly the same time, yet this tween has already rendered once (for example, at 0.001) because it's first in the queue, we should revert the values to where they were at 0 so that the starting values aren't contaminated on the overwriting tween.
              if (pt.f) {
                pt.t[pt.p](pt.s);
              } else {
                pt.t[pt.p] = pt.s;
              }
              changed = true;
            }
            if (pt.pg && pt.t._kill(killProps)) {
              changed = true; //some plugins need to be notified so they can perform cleanup tasks first
            }
            if (!pt.pg || pt.t._overwriteProps.length === 0) {
              if (pt._prev) {
                pt._prev._next = pt._next;
              } else if (pt === this._firstPT) {
                this._firstPT = pt._next;
              }
              if (pt._next) {
                pt._next._prev = pt._prev;
              }
              pt._next = pt._prev = null;
            }
            delete propLookup[p];
          }
          if (record) {
            overwrittenProps[p] = 1;
          }
        }
        if (!this._firstPT && this._initted) { //if all tweening properties are killed, kill the tween. Without this line, if there's a tween with multiple targets and then you killTweensOf() each target individually, the tween would technically still remain active and fire its onComplete even though there aren't any more properties tweening.
          this._enabled(false, false);
        }
      }
    }
    return changed;
  };

  p.invalidate = function () {
    if (this._notifyPluginsOfEnabled) {
      TweenLite._onPluginEvent("_onDisable", this);
    }
    this._firstPT = this._overwrittenProps = this._startAt = this._onUpdate = null;
    this._notifyPluginsOfEnabled = this._active = this._lazy = false;
    this._propLookup = (this._targets) ? {} : [];
    Animation.prototype.invalidate.call(this);
    if (this.vars.immediateRender) {
      this._time = -_tinyNum; //forces a render without having to set the render() "force" parameter to true because we want to allow lazying by default (using the "force" parameter always forces an immediate full render)
      this.render(Math.min(0, -this._delay)); //in case delay is negative.
    }
    return this;
  };

  p._enabled = function (enabled, ignoreTimeline) {
    if (!_tickerActive) {
      _ticker.wake();
    }
    if (enabled && this._gc) {
      var targets = this._targets,
          i;
      if (targets) {
        i = targets.length;
        while (--i > -1) {
          this._siblings[i] = _register(targets[i], this, true);
        }
      } else {
        this._siblings = _register(this.target, this, true);
      }
    }
    Animation.prototype._enabled.call(this, enabled, ignoreTimeline);
    if (this._notifyPluginsOfEnabled) {
      if (this._firstPT) {
        return TweenLite._onPluginEvent((enabled ? "_onEnable" : "_onDisable"), this);
      }
    }
    return false;
  };

//----TweenLite static methods -----------------------------------------------------

  TweenLite.to = function (target, duration, vars) {
    return new TweenLite(target, duration, vars);
  };

  TweenLite.from = function (target, duration, vars) {
    vars.runBackwards = true;
    vars.immediateRender = (vars.immediateRender != false);
    return new TweenLite(target, duration, vars);
  };

  TweenLite.fromTo = function (target, duration, fromVars, toVars) {
    toVars.startAt = fromVars;
    toVars.immediateRender = (toVars.immediateRender != false && fromVars.immediateRender != false);
    return new TweenLite(target, duration, toVars);
  };

  TweenLite.delayedCall = function (delay, callback, params, scope, useFrames) {
    return new TweenLite(callback, 0, {
      delay: delay,
      onComplete: callback,
      onCompleteParams: params,
      callbackScope: scope,
      onReverseComplete: callback,
      onReverseCompleteParams: params,
      immediateRender: false,
      lazy: false,
      useFrames: useFrames,
      overwrite: 0
    });
  };

  TweenLite.set = function (target, vars) {
    return new TweenLite(target, 0, vars);
  };

  TweenLite.getTweensOf = function (target, onlyActive) {
    if (target == null) {
      return [];
    }
    target = (typeof(target) !== "string") ? target : TweenLite.selector(target) || target;
    var i, a, j, t;
    if ((_isArray(target) || _isSelector(target)) && typeof(target[0]) !== "number") {
      i = target.length;
      a = [];
      while (--i > -1) {
        a = a.concat(TweenLite.getTweensOf(target[i], onlyActive));
      }
      i = a.length;
      //now get rid of any duplicates (tweens of arrays of objects could cause duplicates)
      while (--i > -1) {
        t = a[i];
        j = i;
        while (--j > -1) {
          if (t === a[j]) {
            a.splice(i, 1);
          }
        }
      }
    } else if (target._gsTweenID) {
      a = _register(target).concat();
      i = a.length;
      while (--i > -1) {
        if (a[i]._gc || (onlyActive && !a[i].isActive())) {
          a.splice(i, 1);
        }
      }
    }
    return a || [];
  };

  TweenLite.killTweensOf = TweenLite.killDelayedCallsTo = function (target, onlyActive, vars) {
    if (typeof(onlyActive) === "object") {
      vars = onlyActive; //for backwards compatibility (before "onlyActive" parameter was inserted)
      onlyActive = false;
    }
    var a = TweenLite.getTweensOf(target, onlyActive),
        i = a.length;
    while (--i > -1) {
      a[i]._kill(vars, target);
    }
  };

  /*
 * ----------------------------------------------------------------
 * TweenPlugin   (could easily be split out as a separate file/class, but included for ease of use (so that people don't need to include another script call before loading plugins which is easy to forget)
 * ----------------------------------------------------------------
 */
  var TweenPlugin = _class("plugins.TweenPlugin", function (props, priority) {
    this._overwriteProps = (props || "").split(",");
    this._propName = this._overwriteProps[0];
    this._priority = priority || 0;
    this._super = TweenPlugin.prototype;
  }, true);

  p = TweenPlugin.prototype;
  TweenPlugin.version = "1.19.0";
  TweenPlugin.API = 2;
  p._firstPT = null;
  p._addTween = _addPropTween;
  p.setRatio = _setRatio;

  p._kill = function (lookup) {
    var a = this._overwriteProps,
        pt = this._firstPT,
        i;
    if (lookup[this._propName] != null) {
      this._overwriteProps = [];
    } else {
      i = a.length;
      while (--i > -1) {
        if (lookup[a[i]] != null) {
          a.splice(i, 1);
        }
      }
    }
    while (pt) {
      if (lookup[pt.n] != null) {
        if (pt._next) {
          pt._next._prev = pt._prev;
        }
        if (pt._prev) {
          pt._prev._next = pt._next;
          pt._prev = null;
        } else if (this._firstPT === pt) {
          this._firstPT = pt._next;
        }
      }
      pt = pt._next;
    }
    return false;
  };

  p._mod = p._roundProps = function (lookup) {
    var pt = this._firstPT,
        val;
    while (pt) {
      val = lookup[this._propName] || (pt.n != null && lookup[pt.n.split(this._propName + "_").join("")]);
      if (val && typeof(val) === "function") { //some properties that are very plugin-specific add a prefix named after the _propName plus an underscore, so we need to ignore that extra stuff here.
        if (pt.f === 2) {
          pt.t._applyPT.m = val;
        } else {
          pt.m = val;
        }
      }
      pt = pt._next;
    }
  };

  TweenLite._onPluginEvent = function (type, tween) {
    var pt = tween._firstPT,
        changed, pt2, first, last, next;
    if (type === "_onInitAllProps") {
      //sorts the PropTween linked list in order of priority because some plugins need to render earlier/later than others, like MotionBlurPlugin applies its effects after all x/y/alpha tweens have rendered on each frame.
      while (pt) {
        next = pt._next;
        pt2 = first;
        while (pt2 && pt2.pr > pt.pr) {
          pt2 = pt2._next;
        }
        if ((pt._prev = pt2 ? pt2._prev : last)) {
          pt._prev._next = pt;
        } else {
          first = pt;
        }
        if ((pt._next = pt2)) {
          pt2._prev = pt;
        } else {
          last = pt;
        }
        pt = next;
      }
      pt = tween._firstPT = first;
    }
    while (pt) {
      if (pt.pg) {
        if (typeof(pt.t[type]) === "function") {
          if (pt.t[type]()) {
            changed = true;
          }
        }
      }
      pt = pt._next;
    }
    return changed;
  };

  TweenPlugin.activate = function (plugins) {
    var i = plugins.length;
    while (--i > -1) {
      if (plugins[i].API === TweenPlugin.API) {
        _plugins[(new plugins[i]())._propName] = plugins[i];
      }
    }
    return true;
  };

  //provides a more concise way to define plugins that have no dependencies besides TweenPlugin and TweenLite, wrapping common boilerplate stuff into one function (added in 1.9.0). You don't NEED to use this to define a plugin - the old way still works and can be useful in certain (rare) situations.
  _gsDefine.plugin = function (config) {
    if (!config || !config.propName || !config.init || !config.API) {
      throw "illegal plugin definition.";
    }
    var propName = config.propName,
        priority = config.priority || 0,
        overwriteProps = config.overwriteProps,
        map = {
          init: "_onInitTween",
          set: "setRatio",
          kill: "_kill",
          round: "_mod",
          mod: "_mod",
          initAll: "_onInitAllProps"
        },
        Plugin = _class("plugins." + propName.charAt(0).toUpperCase() + propName.substr(1) + "Plugin",
            function () {
              TweenPlugin.call(this, propName, priority);
              this._overwriteProps = overwriteProps || [];
            }, (config.global === true)),
        p = Plugin.prototype = new TweenPlugin(propName),
        prop;
    p.constructor = Plugin;
    Plugin.API = config.API;
    for (prop in map) {
      if (typeof(config[prop]) === "function") {
        p[map[prop]] = config[prop];
      }
    }
    Plugin.version = config.version;
    TweenPlugin.activate([Plugin]);
    return Plugin;
  };

  //now run through all the dependencies discovered and if any are missing, log that to the console as a warning. This is why it's best to have TweenLite load last - it can check all the dependencies for you.
  a = window._gsQueue;
  if (a) {
    for (i = 0; i < a.length; i++) {
      a[i]();
    }
    for (p in _defLookup) {
      if (!_defLookup[p].func) {
        window.console.log("GSAP encountered missing dependency: " + p);
      }
    }
  }

  _tickerActive = false; //ensures that the first official animation forces a ticker.tick() to update the time when it is instantiated

})((typeof(module) !== "undefined" && module.exports && typeof(global) !== "undefined") ? global : this || window, "TweenMax");


/*
== malihu jquery custom scrollbar plugin ==
Version: 3.1.5
Plugin URI: http://manos.malihu.gr/jquery-custom-content-scroller
Author: malihu
Author URI: http://manos.malihu.gr
License: MIT License (MIT)
*/

/*
Copyright Manos Malihutsakis (email: manos@malihu.gr)
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
The code below is fairly long, fully commented and should be normally used in development.
For production, use either the minified jquery.mCustomScrollbar.min.js script or
the production-ready jquery.mCustomScrollbar.concat.min.js which contains the plugin
and dependencies (minified).
*/

(function (factory) {
  if (typeof define === "function" && define.amd) {
    define(["jquery"], factory);
  } else if (typeof module !== "undefined" && module.exports) {
    module.exports = factory;
  } else {
    factory(jQuery, window, document);
  }
}(function ($) {
  (function (init) {
    var _rjs = typeof define === "function" && define.amd, /* RequireJS */
        _njs = typeof module !== "undefined" && module.exports, /* NodeJS */
        _dlp = ("https:" == document.location.protocol) ? "https:" : "http:", /* location protocol */
        _url = "cdnjs.cloudflare.com/ajax/libs/jquery-mousewheel/3.1.13/jquery.mousewheel.min.js";
    if (!_rjs) {
      if (_njs) {
        require("jquery-mousewheel")($);
      } else {
        /* load jquery-mousewheel plugin (via CDN) if it's not present or not loaded via RequireJS
                (works when mCustomScrollbar fn is called on window load) */
        $.event.special.mousewheel || $("head").append(decodeURI("%3Cscript src=" + _dlp + "//" + _url + "%3E%3C/script%3E"));
      }
    }
    init();
  }(function () {

    /*
        ----------------------------------------
        PLUGIN NAMESPACE, PREFIX, DEFAULT SELECTOR(S)
        ----------------------------------------
        */

    var pluginNS = "mCustomScrollbar",
        pluginPfx = "mCS",
        defaultSelector = ".mCustomScrollbar",

        /*
            ----------------------------------------
            DEFAULT OPTIONS
            ----------------------------------------
            */

        defaults = {
          /*
                set element/content width/height programmatically
                values: boolean, pixels, percentage
                    option						default
                    -------------------------------------
                    setWidth					false
                    setHeight					false
                */
          /*
                set the initial css top property of content
                values: string (e.g. "-100px", "10%" etc.)
                */
          setTop: 0,
          /*
                set the initial css left property of content
                values: string (e.g. "-100px", "10%" etc.)
                */
          setLeft: 0,
          /*
                scrollbar axis (vertical and/or horizontal scrollbars)
                values (string): "y", "x", "yx"
                */
          axis: "y",
          /*
                position of scrollbar relative to content
                values (string): "inside", "outside" ("outside" requires elements with position:relative)
                */
          scrollbarPosition: "inside",
          /*
                scrolling inertia
                values: integer (milliseconds)
                */
          scrollInertia: 950,
          /*
                auto-adjust scrollbar dragger length
                values: boolean
                */
          autoDraggerLength: true,
          /*
                auto-hide scrollbar when idle
                values: boolean
                    option						default
                    -------------------------------------
                    autoHideScrollbar			false
                */
          /*
                auto-expands scrollbar on mouse-over and dragging
                values: boolean
                    option						default
                    -------------------------------------
                    autoExpandScrollbar			false
                */
          /*
                always show scrollbar, even when there's nothing to scroll
                values: integer (0=disable, 1=always show dragger rail and buttons, 2=always show dragger rail, dragger and buttons), boolean
                */
          alwaysShowScrollbar: 0,
          /*
                scrolling always snaps to a multiple of this number in pixels
                values: integer, array ([y,x])
                    option						default
                    -------------------------------------
                    snapAmount					null
                */
          /*
                when snapping, snap with this number in pixels as an offset
                values: integer
                */
          snapOffset: 0,
          /*
                mouse-wheel scrolling
                */
          mouseWheel: {
            /*
                    enable mouse-wheel scrolling
                    values: boolean
                    */
            enable: true,
            /*
                    scrolling amount in pixels
                    values: "auto", integer
                    */
            scrollAmount: "auto",
            /*
                    mouse-wheel scrolling axis
                    the default scrolling direction when both vertical and horizontal scrollbars are present
                    values (string): "y", "x"
                    */
            axis: "y",
            /*
                    prevent the default behaviour which automatically scrolls the parent element(s) when end of scrolling is reached
                    values: boolean
                        option						default
                        -------------------------------------
                        preventDefault				null
                    */
            /*
                    the reported mouse-wheel delta value. The number of lines (translated to pixels) one wheel notch scrolls.
                    values: "auto", integer
                    "auto" uses the default OS/browser value
                    */
            deltaFactor: "auto",
            /*
                    normalize mouse-wheel delta to -1 or 1 (disables mouse-wheel acceleration)
                    values: boolean
                        option						default
                        -------------------------------------
                        normalizeDelta				null
                    */
            /*
                    invert mouse-wheel scrolling direction
                    values: boolean
                        option						default
                        -------------------------------------
                        invert						null
                    */
            /*
                    the tags that disable mouse-wheel when cursor is over them
                    */
            disableOver: ["select", "option", "keygen", "datalist", "textarea"]
          },
          /*
                scrollbar buttons
                */
          scrollButtons: {
            /*
                    enable scrollbar buttons
                    values: boolean
                        option						default
                        -------------------------------------
                        enable						null
                    */
            /*
                    scrollbar buttons scrolling type
                    values (string): "stepless", "stepped"
                    */
            scrollType: "stepless",
            /*
                    scrolling amount in pixels
                    values: "auto", integer
                    */
            scrollAmount: "auto"
            /*
                    tabindex of the scrollbar buttons
                    values: false, integer
                        option						default
                        -------------------------------------
                        tabindex					null
                    */
          },
          /*
                keyboard scrolling
                */
          keyboard: {
            /*
                    enable scrolling via keyboard
                    values: boolean
                    */
            enable: true,
            /*
                    keyboard scrolling type
                    values (string): "stepless", "stepped"
                    */
            scrollType: "stepless",
            /*
                    scrolling amount in pixels
                    values: "auto", integer
                    */
            scrollAmount: "auto"
          },
          /*
                enable content touch-swipe scrolling
                values: boolean, integer, string (number)
                integer values define the axis-specific minimum amount required for scrolling momentum
                */
          contentTouchScroll: 25,
          /*
                enable/disable document (default) touch-swipe scrolling
                */
          documentTouchScroll: true,
          /*
                advanced option parameters
                */
          advanced: {
            /*
                    auto-expand content horizontally (for "x" or "yx" axis)
                    values: boolean, integer (the value 2 forces the non scrollHeight/scrollWidth method, the value 3 forces the scrollHeight/scrollWidth method)
                        option						default
                        -------------------------------------
                        autoExpandHorizontalScroll	null
                    */
            /*
                    auto-scroll to elements with focus
                    */
            autoScrollOnFocus: "input,textarea,select,button,datalist,keygen,a[tabindex],area,object,[contenteditable='true']",
            /*
                    auto-update scrollbars on content, element or viewport resize
                    should be true for fluid layouts/elements, adding/removing content dynamically, hiding/showing elements, content with images etc.
                    values: boolean
                    */
            updateOnContentResize: true,
            /*
                    auto-update scrollbars each time each image inside the element is fully loaded
                    values: "auto", boolean
                    */
            updateOnImageLoad: "auto",
            /*
                    auto-update scrollbars based on the amount and size changes of specific selectors
                    useful when you need to update the scrollbar(s) automatically, each time a type of element is added, removed or changes its size
                    values: boolean, string (e.g. "ul li" will auto-update scrollbars each time list-items inside the element are changed)
                    a value of true (boolean) will auto-update scrollbars each time any element is changed
                        option						default
                        -------------------------------------
                        updateOnSelectorChange		null
                    */
            /*
                    extra selectors that'll allow scrollbar dragging upon mousemove/up, pointermove/up, touchend etc. (e.g. "selector-1, selector-2")
                        option						default
                        -------------------------------------
                        extraDraggableSelectors		null
                    */
            /*
                    extra selectors that'll release scrollbar dragging upon mouseup, pointerup, touchend etc. (e.g. "selector-1, selector-2")
                        option						default
                        -------------------------------------
                        releaseDraggableSelectors	null
                    */
            /*
                    auto-update timeout
                    values: integer (milliseconds)
                    */
            autoUpdateTimeout: 60
          },
          /*
                scrollbar theme
                values: string (see CSS/plugin URI for a list of ready-to-use themes)
                */
          theme: "light",
          /*
                user defined callback functions
                */
          callbacks: {
            /*
                    Available callbacks:
                        callback					default
                        -------------------------------------
                        onCreate					null
                        onInit						null
                        onScrollStart				null
                        onScroll					null
                        onTotalScroll				null
                        onTotalScrollBack			null
                        whileScrolling				null
                        onOverflowY					null
                        onOverflowX					null
                        onOverflowYNone				null
                        onOverflowXNone				null
                        onImageLoad					null
                        onSelectorChange			null
                        onBeforeUpdate				null
                        onUpdate					null
                    */
            onTotalScrollOffset: 0,
            onTotalScrollBackOffset: 0,
            alwaysTriggerOffsets: true
          }
          /*
                add scrollbar(s) on all elements matching the current selector, now and in the future
                values: boolean, string
                string values: "on" (enable), "once" (disable after first invocation), "off" (disable)
                liveSelector values: string (selector)
                    option						default
                    -------------------------------------
                    live						false
                    liveSelector				null
                */
        },

        /*
            ----------------------------------------
            VARS, CONSTANTS
            ----------------------------------------
            */

        totalInstances = 0, /* plugin instances amount */
        liveTimers = {}, /* live option timers */
        oldIE = (window.attachEvent && !window.addEventListener) ? 1 : 0, /* detect IE < 9 */
        touchActive = false, touchable, /* global touch vars (for touch and pointer events) */
        /* general plugin classes */
        classes = [
          "mCSB_dragger_onDrag", "mCSB_scrollTools_onDrag", "mCS_img_loaded", "mCS_disabled", "mCS_destroyed", "mCS_no_scrollbar",
          "mCS-autoHide", "mCS-dir-rtl", "mCS_no_scrollbar_y", "mCS_no_scrollbar_x", "mCS_y_hidden", "mCS_x_hidden",
          "mCSB_draggerContainer",
          "mCSB_buttonUp", "mCSB_buttonDown", "mCSB_buttonLeft", "mCSB_buttonRight"
        ],

        /*
            ----------------------------------------
            METHODS
            ----------------------------------------
            */

        methods = {

          /*
                plugin initialization method
                creates the scrollbar(s), plugin data object and options
                ----------------------------------------
                */

          init: function (options) {

            var options = $.extend(true, {}, defaults, options),
                selector = _selector.call(this);
            /* validate selector */

            /*
                    if live option is enabled, monitor for elements matching the current selector and
                    apply scrollbar(s) when found (now and in the future)
                    */
            if (options.live) {
              var liveSelector = options.liveSelector || this.selector || defaultSelector, /* live selector(s) */
                  $liveSelector = $(liveSelector);
              /* live selector(s) as jquery object */
              if (options.live === "off") {
                /*
                            disable live if requested
                            usage: $(selector).mCustomScrollbar({live:"off"});
                            */
                removeLiveTimers(liveSelector);
                return;
              }
              liveTimers[liveSelector] = setTimeout(function () {
                /* call mCustomScrollbar fn on live selector(s) every half-second */
                $liveSelector.mCustomScrollbar(options);
                if (options.live === "once" && $liveSelector.length) {
                  /* disable live after first invocation */
                  removeLiveTimers(liveSelector);
                }
              }, 500);
            } else {
              removeLiveTimers(liveSelector);
            }

            /* options backward compatibility (for versions < 3.0.0) and normalization */
            options.setWidth = (options.set_width) ? options.set_width : options.setWidth;
            options.setHeight = (options.set_height) ? options.set_height : options.setHeight;
            options.axis = (options.horizontalScroll) ? "x" : _findAxis(options.axis);
            options.scrollInertia = options.scrollInertia > 0 && options.scrollInertia < 17 ? 17 : options.scrollInertia;
            if (typeof options.mouseWheel !== "object" && options.mouseWheel == true) { /* old school mouseWheel option (non-object) */
              options.mouseWheel = {
                enable: true,
                scrollAmount: "auto",
                axis: "y",
                preventDefault: false,
                deltaFactor: "auto",
                normalizeDelta: false,
                invert: false
              }
            }
            options.mouseWheel.scrollAmount = !options.mouseWheelPixels ? options.mouseWheel.scrollAmount : options.mouseWheelPixels;
            options.mouseWheel.normalizeDelta = !options.advanced.normalizeMouseWheelDelta ? options.mouseWheel.normalizeDelta
                : options.advanced.normalizeMouseWheelDelta;
            options.scrollButtons.scrollType = _findScrollButtonsType(options.scrollButtons.scrollType);

            _theme(options);
            /* theme-specific options */

            /* plugin constructor */
            return $(selector).each(function () {

              var $this = $(this);

              if (!$this.data(pluginPfx)) { /* prevent multiple instantiations */

                /* store options and create objects in jquery data */
                $this.data(pluginPfx, {
                  idx: ++totalInstances, /* instance index */
                  opt: options, /* options */
                  scrollRatio: {y: null, x: null}, /* scrollbar to content ratio */
                  overflowed: null, /* overflowed axis */
                  contentReset: {y: null, x: null}, /* object to check when content resets */
                  bindEvents: false, /* object to check if events are bound */
                  tweenRunning: false, /* object to check if tween is running */
                  sequential: {}, /* sequential scrolling object */
                  langDir: $this.css("direction"), /* detect/store direction (ltr or rtl) */
                  cbOffsets: null, /* object to check whether callback offsets always trigger */
                  /*
                                object to check how scrolling events where last triggered
                                "internal" (default - triggered by this script), "external" (triggered by other scripts, e.g. via scrollTo method)
                                usage: object.data("mCS").trigger
                                */
                  trigger: null,
                  /*
                                object to check for changes in elements in order to call the update method automatically
                                */
                  poll: {size: {o: 0, n: 0}, img: {o: 0, n: 0}, change: {o: 0, n: 0}}
                });

                var d = $this.data(pluginPfx), o = d.opt,
                    /* HTML data attributes */
                    htmlDataAxis = $this.data("mcs-axis"),
                    htmlDataSbPos = $this.data("mcs-scrollbar-position"),
                    htmlDataTheme = $this.data("mcs-theme");

                if (htmlDataAxis) {
                  o.axis = htmlDataAxis;
                }
                /* usage example: data-mcs-axis="y" */
                if (htmlDataSbPos) {
                  o.scrollbarPosition = htmlDataSbPos;
                }
                /* usage example: data-mcs-scrollbar-position="outside" */
                if (htmlDataTheme) { /* usage example: data-mcs-theme="minimal" */
                  o.theme = htmlDataTheme;
                  _theme(o);
                  /* theme-specific options */
                }

                _pluginMarkup.call(this);
                /* add plugin markup */

                if (d && o.callbacks.onCreate && typeof o.callbacks.onCreate === "function") {
                  o.callbacks.onCreate.call(this);
                }
                /* callbacks: onCreate */

                $("#mCSB_" + d.idx + "_container img:not(." + classes[2] + ")").addClass(classes[2]);
                /* flag loaded images */

                methods.update.call(null, $this);
                /* call the update method */

              }

            });

          },
          /* ---------------------------------------- */



          /*
                plugin update method
                updates content and scrollbar(s) values, events and status
                ----------------------------------------
                usage: $(selector).mCustomScrollbar("update");
                */

          update: function (el, cb) {

            var selector = el || _selector.call(this);
            /* validate selector */

            return $(selector).each(function () {

              var $this = $(this);

              if ($this.data(pluginPfx)) { /* check if plugin has initialized */

                var d = $this.data(pluginPfx), o = d.opt,
                    mCSB_container = $("#mCSB_" + d.idx + "_container"),
                    mCustomScrollBox = $("#mCSB_" + d.idx),
                    mCSB_dragger = [$("#mCSB_" + d.idx + "_dragger_vertical"), $("#mCSB_" + d.idx + "_dragger_horizontal")];

                if (!mCSB_container.length) {
                  return;
                }

                if (d.tweenRunning) {
                  _stop($this);
                }
                /* stop any running tweens while updating */

                if (cb && d && o.callbacks.onBeforeUpdate && typeof o.callbacks.onBeforeUpdate === "function") {
                  o.callbacks.onBeforeUpdate.call(this);
                }
                /* callbacks: onBeforeUpdate */

                /* if element was disabled or destroyed, remove class(es) */
                if ($this.hasClass(classes[3])) {
                  $this.removeClass(classes[3]);
                }
                if ($this.hasClass(classes[4])) {
                  $this.removeClass(classes[4]);
                }

                /* css flexbox fix, detect/set max-height */
                mCustomScrollBox.css("max-height", "none");
                if (mCustomScrollBox.height() !== $this.height()) {
                  mCustomScrollBox.css("max-height", $this.height());
                }

                _expandContentHorizontally.call(this);
                /* expand content horizontally */

                if (o.axis !== "y" && !o.advanced.autoExpandHorizontalScroll) {
                  mCSB_container.css("width", _contentWidth(mCSB_container));
                }

                d.overflowed = _overflowed.call(this);
                /* determine if scrolling is required */

                _scrollbarVisibility.call(this);
                /* show/hide scrollbar(s) */

                /* auto-adjust scrollbar dragger length analogous to content */
                if (o.autoDraggerLength) {
                  _setDraggerLength.call(this);
                }

                _scrollRatio.call(this);
                /* calculate and store scrollbar to content ratio */

                _bindEvents.call(this);
                /* bind scrollbar events */

                /* reset scrolling position and/or events */
                var to = [Math.abs(mCSB_container[0].offsetTop), Math.abs(mCSB_container[0].offsetLeft)];
                if (o.axis !== "x") { /* y/yx axis */
                  if (!d.overflowed[0]) { /* y scrolling is not required */
                    _resetContentPosition.call(this);
                    /* reset content position */
                    if (o.axis === "y") {
                      _unbindEvents.call(this);
                    } else if (o.axis === "yx" && d.overflowed[1]) {
                      _scrollTo($this, to[1].toString(), {dir: "x", dur: 0, overwrite: "none"});
                    }
                  } else if (mCSB_dragger[0].height() > mCSB_dragger[0].parent().height()) {
                    _resetContentPosition.call(this);
                    /* reset content position */
                  } else { /* y scrolling is required */
                    _scrollTo($this, to[0].toString(), {dir: "y", dur: 0, overwrite: "none"});
                    d.contentReset.y = null;
                  }
                }
                if (o.axis !== "y") { /* x/yx axis */
                  if (!d.overflowed[1]) { /* x scrolling is not required */
                    _resetContentPosition.call(this);
                    /* reset content position */
                    if (o.axis === "x") {
                      _unbindEvents.call(this);
                    } else if (o.axis === "yx" && d.overflowed[0]) {
                      _scrollTo($this, to[0].toString(), {dir: "y", dur: 0, overwrite: "none"});
                    }
                  } else if (mCSB_dragger[1].width() > mCSB_dragger[1].parent().width()) {
                    _resetContentPosition.call(this);
                    /* reset content position */
                  } else { /* x scrolling is required */
                    _scrollTo($this, to[1].toString(), {dir: "x", dur: 0, overwrite: "none"});
                    d.contentReset.x = null;
                  }
                }

                /* callbacks: onImageLoad, onSelectorChange, onUpdate */
                if (cb && d) {
                  if (cb === 2 && o.callbacks.onImageLoad && typeof o.callbacks.onImageLoad === "function") {
                    o.callbacks.onImageLoad.call(this);
                  } else if (cb === 3 && o.callbacks.onSelectorChange && typeof o.callbacks.onSelectorChange === "function") {
                    o.callbacks.onSelectorChange.call(this);
                  } else if (o.callbacks.onUpdate && typeof o.callbacks.onUpdate === "function") {
                    o.callbacks.onUpdate.call(this);
                  }
                }

                _autoUpdate.call(this);
                /* initialize automatic updating (for dynamic content, fluid layouts etc.) */

              }

            });

          },
          /* ---------------------------------------- */



          /*
                plugin scrollTo method
                triggers a scrolling event to a specific value
                ----------------------------------------
                usage: $(selector).mCustomScrollbar("scrollTo",value,options);
                */

          scrollTo: function (val, options) {

            /* prevent silly things like $(selector).mCustomScrollbar("scrollTo",undefined); */
            if (typeof val == "undefined" || val == null) {
              return;
            }

            var selector = _selector.call(this);
            /* validate selector */

            return $(selector).each(function () {

              var $this = $(this);

              if ($this.data(pluginPfx)) { /* check if plugin has initialized */

                var d = $this.data(pluginPfx), o = d.opt,
                    /* method default options */
                    methodDefaults = {
                      trigger: "external", /* method is by default triggered externally (e.g. from other scripts) */
                      scrollInertia: o.scrollInertia, /* scrolling inertia (animation duration) */
                      scrollEasing: "mcsEaseInOut", /* animation easing */
                      moveDragger: false, /* move dragger instead of content */
                      timeout: 60, /* scroll-to delay */
                      callbacks: true, /* enable/disable callbacks */
                      onStart: true,
                      onUpdate: true,
                      onComplete: true
                    },
                    methodOptions = $.extend(true, {}, methodDefaults, options),
                    to = _arr.call(this, val),
                    dur = methodOptions.scrollInertia > 0 && methodOptions.scrollInertia < 17 ? 17 : methodOptions.scrollInertia;

                /* translate yx values to actual scroll-to positions */
                to[0] = _to.call(this, to[0], "y");
                to[1] = _to.call(this, to[1], "x");

                /*
                            check if scroll-to value moves the dragger instead of content.
                            Only pixel values apply on dragger (e.g. 100, "100px", "-=100" etc.)
                            */
                if (methodOptions.moveDragger) {
                  to[0] *= d.scrollRatio.y;
                  to[1] *= d.scrollRatio.x;
                }

                methodOptions.dur = _isTabHidden() ? 0 : dur; //skip animations if browser tab is hidden

                setTimeout(function () {
                  /* do the scrolling */
                  if (to[0] !== null && typeof to[0] !== "undefined" && o.axis !== "x" && d.overflowed[0]) { /* scroll y */
                    methodOptions.dir = "y";
                    methodOptions.overwrite = "all";
                    _scrollTo($this, to[0].toString(), methodOptions);
                  }
                  if (to[1] !== null && typeof to[1] !== "undefined" && o.axis !== "y" && d.overflowed[1]) { /* scroll x */
                    methodOptions.dir = "x";
                    methodOptions.overwrite = "none";
                    _scrollTo($this, to[1].toString(), methodOptions);
                  }
                }, methodOptions.timeout);

              }

            });

          },
          /* ---------------------------------------- */



          /*
                plugin stop method
                stops scrolling animation
                ----------------------------------------
                usage: $(selector).mCustomScrollbar("stop");
                */
          stop: function () {

            var selector = _selector.call(this);
            /* validate selector */

            return $(selector).each(function () {

              var $this = $(this);

              if ($this.data(pluginPfx)) { /* check if plugin has initialized */

                _stop($this);

              }

            });

          },
          /* ---------------------------------------- */



          /*
                plugin disable method
                temporarily disables the scrollbar(s)
                ----------------------------------------
                usage: $(selector).mCustomScrollbar("disable",reset);
                reset (boolean): resets content position to 0
                */
          disable: function (r) {

            var selector = _selector.call(this);
            /* validate selector */

            return $(selector).each(function () {

              var $this = $(this);

              if ($this.data(pluginPfx)) { /* check if plugin has initialized */

                var d = $this.data(pluginPfx);

                _autoUpdate.call(this, "remove");
                /* remove automatic updating */

                _unbindEvents.call(this);
                /* unbind events */

                if (r) {
                  _resetContentPosition.call(this);
                }
                /* reset content position */

                _scrollbarVisibility.call(this, true);
                /* show/hide scrollbar(s) */

                $this.addClass(classes[3]);
                /* add disable class */

              }

            });

          },
          /* ---------------------------------------- */



          /*
                plugin destroy method
                completely removes the scrollbar(s) and returns the element to its original state
                ----------------------------------------
                usage: $(selector).mCustomScrollbar("destroy");
                */
          destroy: function () {

            var selector = _selector.call(this);
            /* validate selector */

            return $(selector).each(function () {

              var $this = $(this);

              if ($this.data(pluginPfx)) { /* check if plugin has initialized */

                var d = $this.data(pluginPfx), o = d.opt,
                    mCustomScrollBox = $("#mCSB_" + d.idx),
                    mCSB_container = $("#mCSB_" + d.idx + "_container"),
                    scrollbar = $(".mCSB_" + d.idx + "_scrollbar");

                if (o.live) {
                  removeLiveTimers(o.liveSelector || $(selector).selector);
                }
                /* remove live timers */

                _autoUpdate.call(this, "remove");
                /* remove automatic updating */

                _unbindEvents.call(this);
                /* unbind events */

                _resetContentPosition.call(this);
                /* reset content position */

                $this.removeData(pluginPfx);
                /* remove plugin data object */

                _delete(this, "mcs");
                /* delete callbacks object */

                /* remove plugin markup */
                scrollbar.remove();
                /* remove scrollbar(s) first (those can be either inside or outside plugin's inner wrapper) */
                mCSB_container.find("img." + classes[2]).removeClass(classes[2]);
                /* remove loaded images flag */
                mCustomScrollBox.replaceWith(mCSB_container.contents());
                /* replace plugin's inner wrapper with the original content */
                /* remove plugin classes from the element and add destroy class */
                $this.removeClass(pluginNS + " _" + pluginPfx + "_" + d.idx + " " + classes[6] + " " + classes[7] + " " + classes[5] + " "
                    + classes[3]).addClass(classes[4]);

              }

            });

          }
          /* ---------------------------------------- */

        },

        /*
            ----------------------------------------
            FUNCTIONS
            ----------------------------------------
            */

        /* validates selector (if selector is invalid or undefined uses the default one) */
        _selector = function () {
          return (typeof $(this) !== "object" || $(this).length < 1) ? defaultSelector : this;
        },
        /* -------------------- */


        /* changes options according to theme */
        _theme = function (obj) {
          var fixedSizeScrollbarThemes = ["rounded", "rounded-dark", "rounded-dots", "rounded-dots-dark"],
              nonExpandedScrollbarThemes = ["rounded-dots", "rounded-dots-dark", "3d", "3d-dark", "3d-thick", "3d-thick-dark", "inset",
                "inset-dark", "inset-2", "inset-2-dark", "inset-3", "inset-3-dark"],
              disabledScrollButtonsThemes = ["minimal", "minimal-dark"],
              enabledAutoHideScrollbarThemes = ["minimal", "minimal-dark"],
              scrollbarPositionOutsideThemes = ["minimal", "minimal-dark"];
          obj.autoDraggerLength = $.inArray(obj.theme, fixedSizeScrollbarThemes) > -1 ? false : obj.autoDraggerLength;
          obj.autoExpandScrollbar = $.inArray(obj.theme, nonExpandedScrollbarThemes) > -1 ? false : obj.autoExpandScrollbar;
          obj.scrollButtons.enable = $.inArray(obj.theme, disabledScrollButtonsThemes) > -1 ? false : obj.scrollButtons.enable;
          obj.autoHideScrollbar = $.inArray(obj.theme, enabledAutoHideScrollbarThemes) > -1 ? true : obj.autoHideScrollbar;
          obj.scrollbarPosition = $.inArray(obj.theme, scrollbarPositionOutsideThemes) > -1 ? "outside" : obj.scrollbarPosition;
        },
        /* -------------------- */


        /* live option timers removal */
        removeLiveTimers = function (selector) {
          if (liveTimers[selector]) {
            clearTimeout(liveTimers[selector]);
            _delete(liveTimers, selector);
          }
        },
        /* -------------------- */


        /* normalizes axis option to valid values: "y", "x", "yx" */
        _findAxis = function (val) {
          return (val === "yx" || val === "xy" || val === "auto") ? "yx" : (val === "x" || val === "horizontal") ? "x" : "y";
        },
        /* -------------------- */


        /* normalizes scrollButtons.scrollType option to valid values: "stepless", "stepped" */
        _findScrollButtonsType = function (val) {
          return (val === "stepped" || val === "pixels" || val === "step" || val === "click") ? "stepped" : "stepless";
        },
        /* -------------------- */


        /* generates plugin markup */
        _pluginMarkup = function () {
          var $this = $(this), d = $this.data(pluginPfx), o = d.opt,
              expandClass = o.autoExpandScrollbar ? " " + classes[1] + "_expand" : "",
              scrollbar = ["<div id='mCSB_" + d.idx + "_scrollbar_vertical' class='mCSB_scrollTools mCSB_" + d.idx + "_scrollbar mCS-"
              + o.theme + " mCSB_scrollTools_vertical" + expandClass + "'><div class='" + classes[12] + "'><div id='mCSB_" + d.idx
              + "_dragger_vertical' class='mCSB_dragger' style='position:absolute;'><div class='mCSB_dragger_bar' /></div><div class='mCSB_draggerRail' /></div></div>",
                "<div id='mCSB_" + d.idx + "_scrollbar_horizontal' class='mCSB_scrollTools mCSB_" + d.idx + "_scrollbar mCS-" + o.theme
                + " mCSB_scrollTools_horizontal" + expandClass + "'><div class='" + classes[12] + "'><div id='mCSB_" + d.idx
                + "_dragger_horizontal' class='mCSB_dragger' style='position:absolute;'><div class='mCSB_dragger_bar' /></div><div class='mCSB_draggerRail' /></div></div>"],
              wrapperClass = o.axis === "yx" ? "mCSB_vertical_horizontal" : o.axis === "x" ? "mCSB_horizontal" : "mCSB_vertical",
              scrollbars = o.axis === "yx" ? scrollbar[0] + scrollbar[1] : o.axis === "x" ? scrollbar[1] : scrollbar[0],
              contentWrapper = o.axis === "yx" ? "<div id='mCSB_" + d.idx + "_container_wrapper' class='mCSB_container_wrapper' />" : "",
              autoHideClass = o.autoHideScrollbar ? " " + classes[6] : "",
              scrollbarDirClass = (o.axis !== "x" && d.langDir === "rtl") ? " " + classes[7] : "";
          if (o.setWidth) {
            $this.css("width", o.setWidth);
          }
          /* set element width */
          if (o.setHeight) {
            $this.css("height", o.setHeight);
          }
          /* set element height */
          o.setLeft = (o.axis !== "y" && d.langDir === "rtl") ? "989999px" : o.setLeft;
          /* adjust left position for rtl direction */
          $this.addClass(pluginNS + " _" + pluginPfx + "_" + d.idx + autoHideClass + scrollbarDirClass).wrapInner("<div id='mCSB_" + d.idx
              + "' class='mCustomScrollBox mCS-" + o.theme + " " + wrapperClass + "'><div id='mCSB_" + d.idx
              + "_container' class='mCSB_container' style='position:relative; top:" + o.setTop + "; left:" + o.setLeft + ";' dir='"
              + d.langDir + "' /></div>");
          var mCustomScrollBox = $("#mCSB_" + d.idx),
              mCSB_container = $("#mCSB_" + d.idx + "_container");
          if (o.axis !== "y" && !o.advanced.autoExpandHorizontalScroll) {
            mCSB_container.css("width", _contentWidth(mCSB_container));
          }
          if (o.scrollbarPosition === "outside") {
            if ($this.css("position") === "static") { /* requires elements with non-static position */
              $this.css("position", "relative");
            }
            $this.css("overflow", "visible");
            mCustomScrollBox.addClass("mCSB_outside").after(scrollbars);
          } else {
            mCustomScrollBox.addClass("mCSB_inside").append(scrollbars);
            mCSB_container.wrap(contentWrapper);
          }
          _scrollButtons.call(this);
          /* add scrollbar buttons */
          /* minimum dragger length */
          var mCSB_dragger = [$("#mCSB_" + d.idx + "_dragger_vertical"), $("#mCSB_" + d.idx + "_dragger_horizontal")];
          mCSB_dragger[0].css("min-height", mCSB_dragger[0].height());
          mCSB_dragger[1].css("min-width", mCSB_dragger[1].width());
        },
        /* -------------------- */


        /* calculates content width */
        _contentWidth = function (el) {
          var val = [el[0].scrollWidth, Math.max.apply(Math, el.children().map(function () {
            return $(this).outerWidth(true);
          }).get())], w = el.parent().width();
          return val[0] > w ? val[0] : val[1] > w ? val[1] : "100%";
        },
        /* -------------------- */


        /* expands content horizontally */
        _expandContentHorizontally = function () {
          var $this = $(this), d = $this.data(pluginPfx), o = d.opt,
              mCSB_container = $("#mCSB_" + d.idx + "_container");
          if (o.advanced.autoExpandHorizontalScroll && o.axis !== "y") {
            /* calculate scrollWidth */
            mCSB_container.css({"width": "auto", "min-width": 0, "overflow-x": "scroll"});
            var w = Math.ceil(mCSB_container[0].scrollWidth);
            if (o.advanced.autoExpandHorizontalScroll === 3 || (o.advanced.autoExpandHorizontalScroll !== 2 && w
                    > mCSB_container.parent().width())) {
              mCSB_container.css({"width": w, "min-width": "100%", "overflow-x": "inherit"});
            } else {
              /*
                        wrap content with an infinite width div and set its position to absolute and width to auto.
                        Setting width to auto before calculating the actual width is important!
                        We must let the browser set the width as browser zoom values are impossible to calculate.
                        */
              mCSB_container.css({"overflow-x": "inherit", "position": "absolute"})
              .wrap("<div class='mCSB_h_wrapper' style='position:relative; left:0; width:999999px;' />")
              .css({
                /* set actual width, original position and un-wrap */
                /*
                                get the exact width (with decimals) and then round-up.
                                Using jquery outerWidth() will round the width value which will mess up with inner elements that have non-integer width
                                */
                "width": (Math.ceil(mCSB_container[0].getBoundingClientRect().right + 0.4) - Math.floor(
                    mCSB_container[0].getBoundingClientRect().left)),
                "min-width": "100%",
                "position": "relative"
              }).unwrap();
            }
          }
        },
        /* -------------------- */


        /* adds scrollbar buttons */
        _scrollButtons = function () {
          var $this = $(this), d = $this.data(pluginPfx), o = d.opt,
              mCSB_scrollTools = $(".mCSB_" + d.idx + "_scrollbar:first"),
              tabindex = !_isNumeric(o.scrollButtons.tabindex) ? "" : "tabindex='" + o.scrollButtons.tabindex + "'",
              btnHTML = [
                "<a href='#' class='" + classes[13] + "' " + tabindex + " />",
                "<a href='#' class='" + classes[14] + "' " + tabindex + " />",
                "<a href='#' class='" + classes[15] + "' " + tabindex + " />",
                "<a href='#' class='" + classes[16] + "' " + tabindex + " />"
              ],
              btn = [(o.axis === "x" ? btnHTML[2] : btnHTML[0]), (o.axis === "x" ? btnHTML[3] : btnHTML[1]), btnHTML[2], btnHTML[3]];
          if (o.scrollButtons.enable) {
            mCSB_scrollTools.prepend(btn[0]).append(btn[1]).next(".mCSB_scrollTools").prepend(btn[2]).append(btn[3]);
          }
        },
        /* -------------------- */


        /* auto-adjusts scrollbar dragger length */
        _setDraggerLength = function () {
          var $this = $(this), d = $this.data(pluginPfx),
              mCustomScrollBox = $("#mCSB_" + d.idx),
              mCSB_container = $("#mCSB_" + d.idx + "_container"),
              mCSB_dragger = [$("#mCSB_" + d.idx + "_dragger_vertical"), $("#mCSB_" + d.idx + "_dragger_horizontal")],
              ratio = [mCustomScrollBox.height() / mCSB_container.outerHeight(false),
                mCustomScrollBox.width() / mCSB_container.outerWidth(false)],
              l = [
                parseInt(mCSB_dragger[0].css("min-height")), Math.round(ratio[0] * mCSB_dragger[0].parent().height()),
                parseInt(mCSB_dragger[1].css("min-width")), Math.round(ratio[1] * mCSB_dragger[1].parent().width())
              ],
              h = oldIE && (l[1] < l[0]) ? l[0] : l[1], w = oldIE && (l[3] < l[2]) ? l[2] : l[3];
          mCSB_dragger[0].css({
            "height": h, "max-height": (mCSB_dragger[0].parent().height() - 10)
          }).find(".mCSB_dragger_bar").css({"line-height": l[0] + "px"});
          mCSB_dragger[1].css({
            "width": w, "max-width": (mCSB_dragger[1].parent().width() - 10)
          });
        },
        /* -------------------- */


        /* calculates scrollbar to content ratio */
        _scrollRatio = function () {
          var $this = $(this), d = $this.data(pluginPfx),
              mCustomScrollBox = $("#mCSB_" + d.idx),
              mCSB_container = $("#mCSB_" + d.idx + "_container"),
              mCSB_dragger = [$("#mCSB_" + d.idx + "_dragger_vertical"), $("#mCSB_" + d.idx + "_dragger_horizontal")],
              scrollAmount = [mCSB_container.outerHeight(false) - mCustomScrollBox.height(),
                mCSB_container.outerWidth(false) - mCustomScrollBox.width()],
              ratio = [
                scrollAmount[0] / (mCSB_dragger[0].parent().height() - mCSB_dragger[0].height()),
                scrollAmount[1] / (mCSB_dragger[1].parent().width() - mCSB_dragger[1].width())
              ];
          d.scrollRatio = {y: ratio[0], x: ratio[1]};
        },
        /* -------------------- */


        /* toggles scrolling classes */
        _onDragClasses = function (el, action, xpnd) {
          var expandClass = xpnd ? classes[0] + "_expanded" : "",
              scrollbar = el.closest(".mCSB_scrollTools");
          if (action === "active") {
            el.toggleClass(classes[0] + " " + expandClass);
            scrollbar.toggleClass(classes[1]);
            el[0]._draggable = el[0]._draggable ? 0 : 1;
          } else {
            if (!el[0]._draggable) {
              if (action === "hide") {
                el.removeClass(classes[0]);
                scrollbar.removeClass(classes[1]);
              } else {
                el.addClass(classes[0]);
                scrollbar.addClass(classes[1]);
              }
            }
          }
        },
        /* -------------------- */


        /* checks if content overflows its container to determine if scrolling is required */
        _overflowed = function () {
          var $this = $(this), d = $this.data(pluginPfx),
              mCustomScrollBox = $("#mCSB_" + d.idx),
              mCSB_container = $("#mCSB_" + d.idx + "_container"),
              contentHeight = d.overflowed == null ? mCSB_container.height() : mCSB_container.outerHeight(false),
              contentWidth = d.overflowed == null ? mCSB_container.width() : mCSB_container.outerWidth(false),
              h = mCSB_container[0].scrollHeight, w = mCSB_container[0].scrollWidth;
          if (h > contentHeight) {
            contentHeight = h;
          }
          if (w > contentWidth) {
            contentWidth = w;
          }
          return [contentHeight > mCustomScrollBox.height(), contentWidth > mCustomScrollBox.width()];
        },
        /* -------------------- */


        /* resets content position to 0 */
        _resetContentPosition = function () {
          var $this = $(this), d = $this.data(pluginPfx), o = d.opt,
              mCustomScrollBox = $("#mCSB_" + d.idx),
              mCSB_container = $("#mCSB_" + d.idx + "_container"),
              mCSB_dragger = [$("#mCSB_" + d.idx + "_dragger_vertical"), $("#mCSB_" + d.idx + "_dragger_horizontal")];
          _stop($this);
          /* stop any current scrolling before resetting */
          if ((o.axis !== "x" && !d.overflowed[0]) || (o.axis === "y" && d.overflowed[0])) { /* reset y */
            mCSB_dragger[0].add(mCSB_container).css("top", 0);
            _scrollTo($this, "_resetY");
          }
          if ((o.axis !== "y" && !d.overflowed[1]) || (o.axis === "x" && d.overflowed[1])) { /* reset x */
            var cx = dx = 0;
            if (d.langDir === "rtl") { /* adjust left position for rtl direction */
              cx = mCustomScrollBox.width() - mCSB_container.outerWidth(false);
              dx = Math.abs(cx / d.scrollRatio.x);
            }
            mCSB_container.css("left", cx);
            mCSB_dragger[1].css("left", dx);
            _scrollTo($this, "_resetX");
          }
        },
        /* -------------------- */


        /* binds scrollbar events */
        _bindEvents = function () {
          var $this = $(this), d = $this.data(pluginPfx), o = d.opt;
          if (!d.bindEvents) { /* check if events are already bound */
            _draggable.call(this);
            if (o.contentTouchScroll) {
              _contentDraggable.call(this);
            }
            _selectable.call(this);
            if (o.mouseWheel.enable) { /* bind mousewheel fn when plugin is available */
              function _mwt() {
                mousewheelTimeout = setTimeout(function () {
                  if (!$.event.special.mousewheel) {
                    _mwt();
                  } else {
                    clearTimeout(mousewheelTimeout);
                    _mousewheel.call($this[0]);
                  }
                }, 100);
              }

              var mousewheelTimeout;
              _mwt();
            }
            _draggerRail.call(this);
            _wrapperScroll.call(this);
            if (o.advanced.autoScrollOnFocus) {
              _focus.call(this);
            }
            if (o.scrollButtons.enable) {
              _buttons.call(this);
            }
            if (o.keyboard.enable) {
              _keyboard.call(this);
            }
            d.bindEvents = true;
          }
        },
        /* -------------------- */


        /* unbinds scrollbar events */
        _unbindEvents = function () {
          var $this = $(this), d = $this.data(pluginPfx), o = d.opt,
              namespace = pluginPfx + "_" + d.idx,
              sb = ".mCSB_" + d.idx + "_scrollbar",
              sel = $("#mCSB_" + d.idx + ",#mCSB_" + d.idx + "_container,#mCSB_" + d.idx + "_container_wrapper," + sb + " ." + classes[12]
                  + ",#mCSB_" + d.idx + "_dragger_vertical,#mCSB_" + d.idx + "_dragger_horizontal," + sb + ">a"),
              mCSB_container = $("#mCSB_" + d.idx + "_container");
          if (o.advanced.releaseDraggableSelectors) {
            sel.add($(o.advanced.releaseDraggableSelectors));
          }
          if (o.advanced.extraDraggableSelectors) {
            sel.add($(o.advanced.extraDraggableSelectors));
          }
          if (d.bindEvents) { /* check if events are bound */
            /* unbind namespaced events from document/selectors */
            $(document).add($(!_canAccessIFrame() || top.document)).unbind("." + namespace);
            sel.each(function () {
              $(this).unbind("." + namespace);
            });
            /* clear and delete timeouts/objects */
            clearTimeout($this[0]._focusTimeout);
            _delete($this[0], "_focusTimeout");
            clearTimeout(d.sequential.step);
            _delete(d.sequential, "step");
            clearTimeout(mCSB_container[0].onCompleteTimeout);
            _delete(mCSB_container[0], "onCompleteTimeout");
            d.bindEvents = false;
          }
        },
        /* -------------------- */


        /* toggles scrollbar visibility */
        _scrollbarVisibility = function (disabled) {
          var $this = $(this), d = $this.data(pluginPfx), o = d.opt,
              contentWrapper = $("#mCSB_" + d.idx + "_container_wrapper"),
              content = contentWrapper.length ? contentWrapper : $("#mCSB_" + d.idx + "_container"),
              scrollbar = [$("#mCSB_" + d.idx + "_scrollbar_vertical"), $("#mCSB_" + d.idx + "_scrollbar_horizontal")],
              mCSB_dragger = [scrollbar[0].find(".mCSB_dragger"), scrollbar[1].find(".mCSB_dragger")];
          if (o.axis !== "x") {
            if (d.overflowed[0] && !disabled) {
              scrollbar[0].add(mCSB_dragger[0]).add(scrollbar[0].children("a")).css("display", "block");
              content.removeClass(classes[8] + " " + classes[10]);
            } else {
              if (o.alwaysShowScrollbar) {
                if (o.alwaysShowScrollbar !== 2) {
                  mCSB_dragger[0].css("display", "none");
                }
                content.removeClass(classes[10]);
              } else {
                scrollbar[0].css("display", "none");
                content.addClass(classes[10]);
              }
              content.addClass(classes[8]);
            }
          }
          if (o.axis !== "y") {
            if (d.overflowed[1] && !disabled) {
              scrollbar[1].add(mCSB_dragger[1]).add(scrollbar[1].children("a")).css("display", "block");
              content.removeClass(classes[9] + " " + classes[11]);
            } else {
              if (o.alwaysShowScrollbar) {
                if (o.alwaysShowScrollbar !== 2) {
                  mCSB_dragger[1].css("display", "none");
                }
                content.removeClass(classes[11]);
              } else {
                scrollbar[1].css("display", "none");
                content.addClass(classes[11]);
              }
              content.addClass(classes[9]);
            }
          }
          if (!d.overflowed[0] && !d.overflowed[1]) {
            $this.addClass(classes[5]);
          } else {
            $this.removeClass(classes[5]);
          }
        },
        /* -------------------- */


        /* returns input coordinates of pointer, touch and mouse events (relative to document) */
        _coordinates = function (e) {
          var t = e.type,
              o = e.target.ownerDocument !== document && frameElement !== null ? [$(frameElement).offset().top,
                $(frameElement).offset().left] : null,
              io = _canAccessIFrame() && e.target.ownerDocument !== top.document && frameElement !== null ? [$(
                  e.view.frameElement).offset().top, $(e.view.frameElement).offset().left] : [0, 0];
          switch (t) {
            case "pointerdown":
            case "MSPointerDown":
            case "pointermove":
            case "MSPointerMove":
            case "pointerup":
            case "MSPointerUp":
              return o ? [e.originalEvent.pageY - o[0] + io[0], e.originalEvent.pageX - o[1] + io[1], false] : [e.originalEvent.pageY,
                e.originalEvent.pageX, false];
              break;
            case "touchstart":
            case "touchmove":
            case "touchend":
              var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0],
                  touches = e.originalEvent.touches.length || e.originalEvent.changedTouches.length;
              return e.target.ownerDocument !== document ? [touch.screenY, touch.screenX, touches > 1] : [touch.pageY, touch.pageX,
                touches > 1];
              break;
            default:
              return o ? [e.pageY - o[0] + io[0], e.pageX - o[1] + io[1], false] : [e.pageY, e.pageX, false];
          }
        },
        /* -------------------- */


        /*
            SCROLLBAR DRAG EVENTS
            scrolls content via scrollbar dragging
            */
        _draggable = function () {
          var $this = $(this), d = $this.data(pluginPfx), o = d.opt,
              namespace = pluginPfx + "_" + d.idx,
              draggerId = ["mCSB_" + d.idx + "_dragger_vertical", "mCSB_" + d.idx + "_dragger_horizontal"],
              mCSB_container = $("#mCSB_" + d.idx + "_container"),
              mCSB_dragger = $("#" + draggerId[0] + ",#" + draggerId[1]),
              draggable, dragY, dragX,
              rds = o.advanced.releaseDraggableSelectors ? mCSB_dragger.add($(o.advanced.releaseDraggableSelectors)) : mCSB_dragger,
              eds = o.advanced.extraDraggableSelectors ? $(!_canAccessIFrame() || top.document).add($(o.advanced.extraDraggableSelectors))
                  : $(!_canAccessIFrame() || top.document);
          mCSB_dragger.bind("contextmenu." + namespace, function (e) {
            e.preventDefault(); //prevent right click
          }).bind("mousedown." + namespace + " touchstart." + namespace + " pointerdown." + namespace + " MSPointerDown." + namespace,
              function (e) {
                e.stopImmediatePropagation();
                e.preventDefault();
                if (!_mouseBtnLeft(e)) {
                  return;
                }
                /* left mouse button only */
                touchActive = true;
                if (oldIE) {
                  document.onselectstart = function () {
                    return false;
                  }
                }
                /* disable text selection for IE < 9 */
                _iframe.call(mCSB_container, false);
                /* enable scrollbar dragging over iframes by disabling their events */
                _stop($this);
                draggable = $(this);
                var offset = draggable.offset(), y = _coordinates(e)[0] - offset.top,
                    x = _coordinates(e)[1] - offset.left,
                    h = draggable.height() + offset.top, w = draggable.width() + offset.left;
                if (y < h && y > 0 && x < w && x > 0) {
                  dragY = y;
                  dragX = x;
                }
                _onDragClasses(draggable, "active", o.autoExpandScrollbar);
              }).bind("touchmove." + namespace, function (e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            var offset = draggable.offset(), y = _coordinates(e)[0] - offset.top,
                x = _coordinates(e)[1] - offset.left;
            _drag(dragY, dragX, y, x);
          });
          $(document).add(eds).bind("mousemove." + namespace + " pointermove." + namespace + " MSPointerMove." + namespace, function (e) {
            if (draggable) {
              var offset = draggable.offset(), y = _coordinates(e)[0] - offset.top,
                  x = _coordinates(e)[1] - offset.left;
              if (dragY === y && dragX === x) {
                return;
              }
              /* has it really moved? */
              _drag(dragY, dragX, y, x);
            }
          }).add(rds).bind("mouseup." + namespace + " touchend." + namespace + " pointerup." + namespace + " MSPointerUp." + namespace,
              function (e) {
                if (draggable) {
                  _onDragClasses(draggable, "active", o.autoExpandScrollbar);
                  draggable = null;
                }
                touchActive = false;
                if (oldIE) {
                  document.onselectstart = null;
                }
                /* enable text selection for IE < 9 */
                _iframe.call(mCSB_container, true);
                /* enable iframes events */
              });

          function _drag(dragY, dragX, y, x) {
            mCSB_container[0].idleTimer = o.scrollInertia < 233 ? 250 : 0;
            if (draggable.attr("id") === draggerId[1]) {
              var dir = "x", to = ((draggable[0].offsetLeft - dragX) + x) * d.scrollRatio.x;
            } else {
              var dir = "y", to = ((draggable[0].offsetTop - dragY) + y) * d.scrollRatio.y;
            }
            _scrollTo($this, to.toString(), {dir: dir, drag: true});
          }
        },
        /* -------------------- */


        /*
            TOUCH SWIPE EVENTS
            scrolls content via touch swipe
            Emulates the native touch-swipe scrolling with momentum found in iOS, Android and WP devices
            */
        _contentDraggable = function () {
          var $this = $(this), d = $this.data(pluginPfx), o = d.opt,
              namespace = pluginPfx + "_" + d.idx,
              mCustomScrollBox = $("#mCSB_" + d.idx),
              mCSB_container = $("#mCSB_" + d.idx + "_container"),
              mCSB_dragger = [$("#mCSB_" + d.idx + "_dragger_vertical"), $("#mCSB_" + d.idx + "_dragger_horizontal")],
              draggable, dragY, dragX, touchStartY, touchStartX, touchMoveY = [], touchMoveX = [], startTime,
              runningTime, endTime, distance, speed, amount,
              durA = 0, durB, overwrite = o.axis === "yx" ? "none" : "all", touchIntent = [], touchDrag, docDrag,
              iframe = mCSB_container.find("iframe"),
              events = [
                "touchstart." + namespace + " pointerdown." + namespace + " MSPointerDown." + namespace, //start
                "touchmove." + namespace + " pointermove." + namespace + " MSPointerMove." + namespace, //move
                "touchend." + namespace + " pointerup." + namespace + " MSPointerUp." + namespace //end
              ],
              touchAction = document.body.style.touchAction !== undefined && document.body.style.touchAction !== "";
          mCSB_container.bind(events[0], function (e) {
            _onTouchstart(e);
          }).bind(events[1], function (e) {
            _onTouchmove(e);
          });
          mCustomScrollBox.bind(events[0], function (e) {
            _onTouchstart2(e);
          }).bind(events[2], function (e) {
            _onTouchend(e);
          });
          if (iframe.length) {
            iframe.each(function () {
              $(this).bind("load", function () {
                /* bind events on accessible iframes */
                if (_canAccessIFrame(this)) {
                  $(this.contentDocument || this.contentWindow.document).bind(events[0], function (e) {
                    _onTouchstart(e);
                    _onTouchstart2(e);
                  }).bind(events[1], function (e) {
                    _onTouchmove(e);
                  }).bind(events[2], function (e) {
                    _onTouchend(e);
                  });
                }
              });
            });
          }

          function _onTouchstart(e) {
            if (!_pointerTouch(e) || touchActive || _coordinates(e)[2]) {
              touchable = 0;
              return;
            }
            touchable = 1;
            touchDrag = 0;
            docDrag = 0;
            draggable = 1;
            $this.removeClass("mCS_touch_action");
            var offset = mCSB_container.offset();
            dragY = _coordinates(e)[0] - offset.top;
            dragX = _coordinates(e)[1] - offset.left;
            touchIntent = [_coordinates(e)[0], _coordinates(e)[1]];
          }

          function _onTouchmove(e) {
            if (!_pointerTouch(e) || touchActive || _coordinates(e)[2]) {
              return;
            }
            if (!o.documentTouchScroll) {
              e.preventDefault();
            }
            e.stopImmediatePropagation();
            if (docDrag && !touchDrag) {
              return;
            }
            if (draggable) {
              runningTime = _getTime();
              var offset = mCustomScrollBox.offset(), y = _coordinates(e)[0] - offset.top,
                  x = _coordinates(e)[1] - offset.left,
                  easing = "mcsLinearOut";
              touchMoveY.push(y);
              touchMoveX.push(x);
              touchIntent[2] = Math.abs(_coordinates(e)[0] - touchIntent[0]);
              touchIntent[3] = Math.abs(_coordinates(e)[1] - touchIntent[1]);
              if (d.overflowed[0]) {
                var limit = mCSB_dragger[0].parent().height() - mCSB_dragger[0].height(),
                    prevent = ((dragY - y) > 0 && (y - dragY) > -(limit * d.scrollRatio.y) && (touchIntent[3] * 2 < touchIntent[2] || o.axis
                        === "yx"));
              }
              if (d.overflowed[1]) {
                var limitX = mCSB_dragger[1].parent().width() - mCSB_dragger[1].width(),
                    preventX = ((dragX - x) > 0 && (x - dragX) > -(limitX * d.scrollRatio.x) && (touchIntent[2] * 2 < touchIntent[3]
                        || o.axis === "yx"));
              }
              if (prevent || preventX) { /* prevent native document scrolling */
                if (!touchAction) {
                  e.preventDefault();
                }
                touchDrag = 1;
              } else {
                docDrag = 1;
                $this.addClass("mCS_touch_action");
              }
              if (touchAction) {
                e.preventDefault();
              }
              amount = o.axis === "yx" ? [(dragY - y), (dragX - x)] : o.axis === "x" ? [null, (dragX - x)] : [(dragY - y), null];
              mCSB_container[0].idleTimer = 250;
              if (d.overflowed[0]) {
                _drag(amount[0], durA, easing, "y", "all", true);
              }
              if (d.overflowed[1]) {
                _drag(amount[1], durA, easing, "x", overwrite, true);
              }
            }
          }

          function _onTouchstart2(e) {
            if (!_pointerTouch(e) || touchActive || _coordinates(e)[2]) {
              touchable = 0;
              return;
            }
            touchable = 1;
            e.stopImmediatePropagation();
            _stop($this);
            startTime = _getTime();
            var offset = mCustomScrollBox.offset();
            touchStartY = _coordinates(e)[0] - offset.top;
            touchStartX = _coordinates(e)[1] - offset.left;
            touchMoveY = [];
            touchMoveX = [];
          }

          function _onTouchend(e) {
            if (!_pointerTouch(e) || touchActive || _coordinates(e)[2]) {
              return;
            }
            draggable = 0;
            e.stopImmediatePropagation();
            touchDrag = 0;
            docDrag = 0;
            endTime = _getTime();
            var offset = mCustomScrollBox.offset(), y = _coordinates(e)[0] - offset.top,
                x = _coordinates(e)[1] - offset.left;
            if ((endTime - runningTime) > 30) {
              return;
            }
            speed = 1000 / (endTime - startTime);
            var easing = "mcsEaseOut", slow = speed < 2.5,
                diff = slow ? [touchMoveY[touchMoveY.length - 2], touchMoveX[touchMoveX.length - 2]] : [0, 0];
            distance = slow ? [(y - diff[0]), (x - diff[1])] : [y - touchStartY, x - touchStartX];
            var absDistance = [Math.abs(distance[0]), Math.abs(distance[1])];
            speed = slow ? [Math.abs(distance[0] / 4), Math.abs(distance[1] / 4)] : [speed, speed];
            var a = [
              Math.abs(mCSB_container[0].offsetTop) - (distance[0] * _m((absDistance[0] / speed[0]), speed[0])),
              Math.abs(mCSB_container[0].offsetLeft) - (distance[1] * _m((absDistance[1] / speed[1]), speed[1]))
            ];
            amount = o.axis === "yx" ? [a[0], a[1]] : o.axis === "x" ? [null, a[1]] : [a[0], null];
            durB = [(absDistance[0] * 4) + o.scrollInertia, (absDistance[1] * 4) + o.scrollInertia];
            var md = parseInt(o.contentTouchScroll) || 0;
            /* absolute minimum distance required */
            amount[0] = absDistance[0] > md ? amount[0] : 0;
            amount[1] = absDistance[1] > md ? amount[1] : 0;
            if (d.overflowed[0]) {
              _drag(amount[0], durB[0], easing, "y", overwrite, false);
            }
            if (d.overflowed[1]) {
              _drag(amount[1], durB[1], easing, "x", overwrite, false);
            }
          }

          function _m(ds, s) {
            var r = [s * 1.5, s * 2, s / 1.5, s / 2];
            if (ds > 90) {
              return s > 4 ? r[0] : r[3];
            } else if (ds > 60) {
              return s > 3 ? r[3] : r[2];
            } else if (ds > 30) {
              return s > 8 ? r[1] : s > 6 ? r[0] : s > 4 ? s : r[2];
            } else {
              return s > 8 ? s : r[3];
            }
          }

          function _drag(amount, dur, easing, dir, overwrite, drag) {
            if (!amount) {
              return;
            }
            _scrollTo($this, amount.toString(), {
              dur: dur,
              scrollEasing: easing,
              dir: dir,
              overwrite: overwrite,
              drag: drag
            });
          }
        },
        /* -------------------- */


        /*
            SELECT TEXT EVENTS
            scrolls content when text is selected
            */
        _selectable = function () {
          var $this = $(this), d = $this.data(pluginPfx), o = d.opt, seq = d.sequential,
              namespace = pluginPfx + "_" + d.idx,
              mCSB_container = $("#mCSB_" + d.idx + "_container"),
              wrapper = mCSB_container.parent(),
              action;
          mCSB_container.bind("mousedown." + namespace, function (e) {
            if (touchable) {
              return;
            }
            if (!action) {
              action = 1;
              touchActive = true;
            }
          }).add(document).bind("mousemove." + namespace, function (e) {
            if (!touchable && action && _sel()) {
              var offset = mCSB_container.offset(),
                  y = _coordinates(e)[0] - offset.top + mCSB_container[0].offsetTop,
                  x = _coordinates(e)[1] - offset.left + mCSB_container[0].offsetLeft;
              if (y > 0 && y < wrapper.height() && x > 0 && x < wrapper.width()) {
                if (seq.step) {
                  _seq("off", null, "stepped");
                }
              } else {
                if (o.axis !== "x" && d.overflowed[0]) {
                  if (y < 0) {
                    _seq("on", 38);
                  } else if (y > wrapper.height()) {
                    _seq("on", 40);
                  }
                }
                if (o.axis !== "y" && d.overflowed[1]) {
                  if (x < 0) {
                    _seq("on", 37);
                  } else if (x > wrapper.width()) {
                    _seq("on", 39);
                  }
                }
              }
            }
          }).bind("mouseup." + namespace + " dragend." + namespace, function (e) {
            if (touchable) {
              return;
            }
            if (action) {
              action = 0;
              _seq("off", null);
            }
            touchActive = false;
          });

          function _sel() {
            return window.getSelection ? window.getSelection().toString() : document.selection && document.selection.type != "Control"
                ? document.selection.createRange().text : 0;
          }

          function _seq(a, c, s) {
            seq.type = s && action ? "stepped" : "stepless";
            seq.scrollAmount = 10;
            _sequentialScroll($this, a, c, "mcsLinearOut", s ? 60 : null);
          }
        },
        /* -------------------- */


        /*
            MOUSE WHEEL EVENT
            scrolls content via mouse-wheel
            via mouse-wheel plugin (https://github.com/brandonaaron/jquery-mousewheel)
            */
        _mousewheel = function () {
          if (!$(this).data(pluginPfx)) {
            return;
          }
          /* Check if the scrollbar is ready to use mousewheel events (issue: #185) */
          var $this = $(this), d = $this.data(pluginPfx), o = d.opt,
              namespace = pluginPfx + "_" + d.idx,
              mCustomScrollBox = $("#mCSB_" + d.idx),
              mCSB_dragger = [$("#mCSB_" + d.idx + "_dragger_vertical"), $("#mCSB_" + d.idx + "_dragger_horizontal")],
              iframe = $("#mCSB_" + d.idx + "_container").find("iframe");
          if (iframe.length) {
            iframe.each(function () {
              $(this).bind("load", function () {
                /* bind events on accessible iframes */
                if (_canAccessIFrame(this)) {
                  $(this.contentDocument || this.contentWindow.document).bind("mousewheel." + namespace, function (e, delta) {
                    _onMousewheel(e, delta);
                  });
                }
              });
            });
          }
          mCustomScrollBox.bind("mousewheel." + namespace, function (e, delta) {
            _onMousewheel(e, delta);
          });

          function _onMousewheel(e, delta) {
            _stop($this);
            if (_disableMousewheel($this, e.target)) {
              return;
            }
            /* disables mouse-wheel when hovering specific elements */
            var deltaFactor = o.mouseWheel.deltaFactor !== "auto" ? parseInt(o.mouseWheel.deltaFactor) : (oldIE && e.deltaFactor < 100)
                ? 100 : e.deltaFactor || 100,
                dur = o.scrollInertia;
            if (o.axis === "x" || o.mouseWheel.axis === "x") {
              var dir = "x",
                  px = [Math.round(deltaFactor * d.scrollRatio.x), parseInt(o.mouseWheel.scrollAmount)],
                  amount = o.mouseWheel.scrollAmount !== "auto" ? px[1] : px[0] >= mCustomScrollBox.width() ? mCustomScrollBox.width() * 0.9
                      : px[0],
                  contentPos = Math.abs($("#mCSB_" + d.idx + "_container")[0].offsetLeft),
                  draggerPos = mCSB_dragger[1][0].offsetLeft,
                  limit = mCSB_dragger[1].parent().width() - mCSB_dragger[1].width(),
                  dlt = o.mouseWheel.axis === "y" ? (e.deltaY || delta) : e.deltaX;
            } else {
              var dir = "y",
                  px = [Math.round(deltaFactor * d.scrollRatio.y), parseInt(o.mouseWheel.scrollAmount)],
                  amount = o.mouseWheel.scrollAmount !== "auto" ? px[1] : px[0] >= mCustomScrollBox.height() ? mCustomScrollBox.height()
                      * 0.9 : px[0],
                  contentPos = Math.abs($("#mCSB_" + d.idx + "_container")[0].offsetTop),
                  draggerPos = mCSB_dragger[0][0].offsetTop,
                  limit = mCSB_dragger[0].parent().height() - mCSB_dragger[0].height(),
                  dlt = e.deltaY || delta;
            }
            if ((dir === "y" && !d.overflowed[0]) || (dir === "x" && !d.overflowed[1])) {
              return;
            }
            if (o.mouseWheel.invert || e.webkitDirectionInvertedFromDevice) {
              dlt = -dlt;
            }
            if (o.mouseWheel.normalizeDelta) {
              dlt = dlt < 0 ? -1 : 1;
            }
            if ((dlt > 0 && draggerPos !== 0) || (dlt < 0 && draggerPos !== limit) || o.mouseWheel.preventDefault) {
              e.stopImmediatePropagation();
              e.preventDefault();
            }
            if (e.deltaFactor < 5 && !o.mouseWheel.normalizeDelta) {
              //very low deltaFactor values mean some kind of delta acceleration (e.g. osx trackpad), so adjusting scrolling accordingly
              amount = e.deltaFactor;
              dur = 17;
            }
            _scrollTo($this, (contentPos - (dlt * amount)).toString(), {dir: dir, dur: dur});
          }
        },
        /* -------------------- */


        /* checks if iframe can be accessed */
        _canAccessIFrameCache = new Object(),
        _canAccessIFrame = function (iframe) {
          var result = false, cacheKey = false, html = null;
          if (iframe === undefined) {
            cacheKey = "#empty";
          } else if ($(iframe).attr("id") !== undefined) {
            cacheKey = $(iframe).attr("id");
          }
          if (cacheKey !== false && _canAccessIFrameCache[cacheKey] !== undefined) {
            return _canAccessIFrameCache[cacheKey];
          }
          if (!iframe) {
            try {
              var doc = top.document;
              html = doc.body.innerHTML;
            } catch (err) {/* do nothing */
            }
            result = (html !== null);
          } else {
            try {
              var doc = iframe.contentDocument || iframe.contentWindow.document;
              html = doc.body.innerHTML;
            } catch (err) {/* do nothing */
            }
            result = (html !== null);
          }
          if (cacheKey !== false) {
            _canAccessIFrameCache[cacheKey] = result;
          }
          return result;
        },
        /* -------------------- */


        /* switches iframe's pointer-events property (drag, mousewheel etc. over cross-domain iframes) */
        _iframe = function (evt) {
          var el = this.find("iframe");
          if (!el.length) {
            return;
          }
          /* check if content contains iframes */
          var val = !evt ? "none" : "auto";
          el.css("pointer-events", val);
          /* for IE11, iframe's display property should not be "block" */
        },
        /* -------------------- */


        /* disables mouse-wheel when hovering specific elements like select, datalist etc. */
        _disableMousewheel = function (el, target) {
          var tag = target.nodeName.toLowerCase(),
              tags = el.data(pluginPfx).opt.mouseWheel.disableOver,
              /* elements that require focus */
              focusTags = ["select", "textarea"];
          return $.inArray(tag, tags) > -1 && !($.inArray(tag, focusTags) > -1 && !$(target).is(":focus"));
        },
        /* -------------------- */


        /*
            DRAGGER RAIL CLICK EVENT
            scrolls content via dragger rail
            */
        _draggerRail = function () {
          var $this = $(this), d = $this.data(pluginPfx),
              namespace = pluginPfx + "_" + d.idx,
              mCSB_container = $("#mCSB_" + d.idx + "_container"),
              wrapper = mCSB_container.parent(),
              mCSB_draggerContainer = $(".mCSB_" + d.idx + "_scrollbar ." + classes[12]),
              clickable;
          mCSB_draggerContainer.bind("mousedown." + namespace + " touchstart." + namespace + " pointerdown." + namespace + " MSPointerDown."
              + namespace, function (e) {
            touchActive = true;
            if (!$(e.target).hasClass("mCSB_dragger")) {
              clickable = 1;
            }
          }).bind("touchend." + namespace + " pointerup." + namespace + " MSPointerUp." + namespace, function (e) {
            touchActive = false;
          }).bind("click." + namespace, function (e) {
            if (!clickable) {
              return;
            }
            clickable = 0;
            if ($(e.target).hasClass(classes[12]) || $(e.target).hasClass("mCSB_draggerRail")) {
              _stop($this);
              var el = $(this), mCSB_dragger = el.find(".mCSB_dragger");
              if (el.parent(".mCSB_scrollTools_horizontal").length > 0) {
                if (!d.overflowed[1]) {
                  return;
                }
                var dir = "x",
                    clickDir = e.pageX > mCSB_dragger.offset().left ? -1 : 1,
                    to = Math.abs(mCSB_container[0].offsetLeft) - (clickDir * (wrapper.width() * 0.9));
              } else {
                if (!d.overflowed[0]) {
                  return;
                }
                var dir = "y",
                    clickDir = e.pageY > mCSB_dragger.offset().top ? -1 : 1,
                    to = Math.abs(mCSB_container[0].offsetTop) - (clickDir * (wrapper.height() * 0.9));
              }
              _scrollTo($this, to.toString(), {dir: dir, scrollEasing: "mcsEaseInOut"});
            }
          });
        },
        /* -------------------- */


        /*
            FOCUS EVENT
            scrolls content via element focus (e.g. clicking an input, pressing TAB key etc.)
            */
        _focus = function () {
          var $this = $(this), d = $this.data(pluginPfx), o = d.opt,
              namespace = pluginPfx + "_" + d.idx,
              mCSB_container = $("#mCSB_" + d.idx + "_container"),
              wrapper = mCSB_container.parent();
          mCSB_container.bind("focusin." + namespace, function (e) {
            var el = $(document.activeElement),
                nested = mCSB_container.find(".mCustomScrollBox").length,
                dur = 0;
            if (!el.is(o.advanced.autoScrollOnFocus)) {
              return;
            }
            _stop($this);
            clearTimeout($this[0]._focusTimeout);
            $this[0]._focusTimer = nested ? (dur + 17) * nested : 0;
            $this[0]._focusTimeout = setTimeout(function () {
              var to = [_childPos(el)[0], _childPos(el)[1]],
                  contentPos = [mCSB_container[0].offsetTop, mCSB_container[0].offsetLeft],
                  isVisible = [
                    (contentPos[0] + to[0] >= 0 && contentPos[0] + to[0] < wrapper.height() - el.outerHeight(false)),
                    (contentPos[1] + to[1] >= 0 && contentPos[0] + to[1] < wrapper.width() - el.outerWidth(false))
                  ],
                  overwrite = (o.axis === "yx" && !isVisible[0] && !isVisible[1]) ? "none" : "all";
              if (o.axis !== "x" && !isVisible[0]) {
                _scrollTo($this, to[0].toString(), {
                  dir: "y",
                  scrollEasing: "mcsEaseInOut",
                  overwrite: overwrite,
                  dur: dur
                });
              }
              if (o.axis !== "y" && !isVisible[1]) {
                _scrollTo($this, to[1].toString(), {
                  dir: "x",
                  scrollEasing: "mcsEaseInOut",
                  overwrite: overwrite,
                  dur: dur
                });
              }
            }, $this[0]._focusTimer);
          });
        },
        /* -------------------- */


        /* sets content wrapper scrollTop/scrollLeft always to 0 */
        _wrapperScroll = function () {
          var $this = $(this), d = $this.data(pluginPfx),
              namespace = pluginPfx + "_" + d.idx,
              wrapper = $("#mCSB_" + d.idx + "_container").parent();
          wrapper.bind("scroll." + namespace, function (e) {
            if (wrapper.scrollTop() !== 0 || wrapper.scrollLeft() !== 0) {
              $(".mCSB_" + d.idx + "_scrollbar").css("visibility", "hidden");
              /* hide scrollbar(s) */
            }
          });
        },
        /* -------------------- */


        /*
            BUTTONS EVENTS
            scrolls content via up, down, left and right buttons
            */
        _buttons = function () {
          var $this = $(this), d = $this.data(pluginPfx), o = d.opt, seq = d.sequential,
              namespace = pluginPfx + "_" + d.idx,
              sel = ".mCSB_" + d.idx + "_scrollbar",
              btn = $(sel + ">a");
          btn.bind("contextmenu." + namespace, function (e) {
            e.preventDefault(); //prevent right click
          }).bind("mousedown." + namespace + " touchstart." + namespace + " pointerdown." + namespace + " MSPointerDown." + namespace
              + " mouseup." + namespace + " touchend." + namespace + " pointerup." + namespace + " MSPointerUp." + namespace + " mouseout."
              + namespace + " pointerout." + namespace + " MSPointerOut." + namespace + " click." + namespace, function (e) {
            e.preventDefault();
            if (!_mouseBtnLeft(e)) {
              return;
            }
            /* left mouse button only */
            var btnClass = $(this).attr("class");
            seq.type = o.scrollButtons.scrollType;
            switch (e.type) {
              case "mousedown":
              case "touchstart":
              case "pointerdown":
              case "MSPointerDown":
                if (seq.type === "stepped") {
                  return;
                }
                touchActive = true;
                d.tweenRunning = false;
                _seq("on", btnClass);
                break;
              case "mouseup":
              case "touchend":
              case "pointerup":
              case "MSPointerUp":
              case "mouseout":
              case "pointerout":
              case "MSPointerOut":
                if (seq.type === "stepped") {
                  return;
                }
                touchActive = false;
                if (seq.dir) {
                  _seq("off", btnClass);
                }
                break;
              case "click":
                if (seq.type !== "stepped" || d.tweenRunning) {
                  return;
                }
                _seq("on", btnClass);
                break;
            }

            function _seq(a, c) {
              seq.scrollAmount = o.scrollButtons.scrollAmount;
              _sequentialScroll($this, a, c);
            }
          });
        },
        /* -------------------- */


        /*
            KEYBOARD EVENTS
            scrolls content via keyboard
            Keys: up arrow, down arrow, left arrow, right arrow, PgUp, PgDn, Home, End
            */
        _keyboard = function () {
          var $this = $(this), d = $this.data(pluginPfx), o = d.opt, seq = d.sequential,
              namespace = pluginPfx + "_" + d.idx,
              mCustomScrollBox = $("#mCSB_" + d.idx),
              mCSB_container = $("#mCSB_" + d.idx + "_container"),
              wrapper = mCSB_container.parent(),
              editables = "input,textarea,select,datalist,keygen,[contenteditable='true']",
              iframe = mCSB_container.find("iframe"),
              events = ["blur." + namespace + " keydown." + namespace + " keyup." + namespace];
          if (iframe.length) {
            iframe.each(function () {
              $(this).bind("load", function () {
                /* bind events on accessible iframes */
                if (_canAccessIFrame(this)) {
                  $(this.contentDocument || this.contentWindow.document).bind(events[0], function (e) {
                    _onKeyboard(e);
                  });
                }
              });
            });
          }
          mCustomScrollBox.attr("tabindex", "0").bind(events[0], function (e) {
            _onKeyboard(e);
          });

          function _onKeyboard(e) {
            switch (e.type) {
              case "blur":
                if (d.tweenRunning && seq.dir) {
                  _seq("off", null);
                }
                break;
              case "keydown":
              case "keyup":
                var code = e.keyCode ? e.keyCode : e.which, action = "on";
                if ((o.axis !== "x" && (code === 38 || code === 40)) || (o.axis !== "y" && (code === 37 || code === 39))) {
                  /* up (38), down (40), left (37), right (39) arrows */
                  if (((code === 38 || code === 40) && !d.overflowed[0]) || ((code === 37 || code === 39) && !d.overflowed[1])) {
                    return;
                  }
                  if (e.type === "keyup") {
                    action = "off";
                  }
                  if (!$(document.activeElement).is(editables)) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    _seq(action, code);
                  }
                } else if (code === 33 || code === 34) {
                  /* PgUp (33), PgDn (34) */
                  if (d.overflowed[0] || d.overflowed[1]) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                  }
                  if (e.type === "keyup") {
                    _stop($this);
                    var keyboardDir = code === 34 ? -1 : 1;
                    if (o.axis === "x" || (o.axis === "yx" && d.overflowed[1] && !d.overflowed[0])) {
                      var dir = "x",
                          to = Math.abs(mCSB_container[0].offsetLeft) - (keyboardDir * (wrapper.width() * 0.9));
                    } else {
                      var dir = "y",
                          to = Math.abs(mCSB_container[0].offsetTop) - (keyboardDir * (wrapper.height() * 0.9));
                    }
                    _scrollTo($this, to.toString(), {dir: dir, scrollEasing: "mcsEaseInOut"});
                  }
                } else if (code === 35 || code === 36) {
                  /* End (35), Home (36) */
                  if (!$(document.activeElement).is(editables)) {
                    if (d.overflowed[0] || d.overflowed[1]) {
                      e.preventDefault();
                      e.stopImmediatePropagation();
                    }
                    if (e.type === "keyup") {
                      if (o.axis === "x" || (o.axis === "yx" && d.overflowed[1] && !d.overflowed[0])) {
                        var dir = "x",
                            to = code === 35 ? Math.abs(wrapper.width() - mCSB_container.outerWidth(false)) : 0;
                      } else {
                        var dir = "y",
                            to = code === 35 ? Math.abs(wrapper.height() - mCSB_container.outerHeight(false)) : 0;
                      }
                      _scrollTo($this, to.toString(), {dir: dir, scrollEasing: "mcsEaseInOut"});
                    }
                  }
                }
                break;
            }

            function _seq(a, c) {
              seq.type = o.keyboard.scrollType;
              seq.scrollAmount = o.keyboard.scrollAmount;
              if (seq.type === "stepped" && d.tweenRunning) {
                return;
              }
              _sequentialScroll($this, a, c);
            }
          }
        },
        /* -------------------- */


        /* scrolls content sequentially (used when scrolling via buttons, keyboard arrows etc.) */
        _sequentialScroll = function (el, action, trigger, e, s) {
          var d = el.data(pluginPfx), o = d.opt, seq = d.sequential,
              mCSB_container = $("#mCSB_" + d.idx + "_container"),
              once = seq.type === "stepped" ? true : false,
              steplessSpeed = o.scrollInertia < 26 ? 26 : o.scrollInertia, /* 26/1.5=17 */
              steppedSpeed = o.scrollInertia < 1 ? 17 : o.scrollInertia;
          switch (action) {
            case "on":
              seq.dir = [
                (trigger === classes[16] || trigger === classes[15] || trigger === 39 || trigger === 37 ? "x" : "y"),
                (trigger === classes[13] || trigger === classes[15] || trigger === 38 || trigger === 37 ? -1 : 1)
              ];
              _stop(el);
              if (_isNumeric(trigger) && seq.type === "stepped") {
                return;
              }
              _on(once);
              break;
            case "off":
              _off();
              if (once || (d.tweenRunning && seq.dir)) {
                _on(true);
              }
              break;
          }

          /* starts sequence */
          function _on(once) {
            if (o.snapAmount) {
              seq.scrollAmount = !(o.snapAmount instanceof Array) ? o.snapAmount : seq.dir[0] === "x" ? o.snapAmount[1] : o.snapAmount[0];
            }
            /* scrolling snapping */
            var c = seq.type !== "stepped", /* continuous scrolling */
                t = s ? s : !once ? 1000 / 60 : c ? steplessSpeed / 1.5 : steppedSpeed, /* timer */
                m = !once ? 2.5 : c ? 7.5 : 40, /* multiplier */
                contentPos = [Math.abs(mCSB_container[0].offsetTop), Math.abs(mCSB_container[0].offsetLeft)],
                ratio = [d.scrollRatio.y > 10 ? 10 : d.scrollRatio.y, d.scrollRatio.x > 10 ? 10 : d.scrollRatio.x],
                amount = seq.dir[0] === "x" ? contentPos[1] + (seq.dir[1] * (ratio[1] * m)) : contentPos[0] + (seq.dir[1] * (ratio[0] * m)),
                px = seq.dir[0] === "x" ? contentPos[1] + (seq.dir[1] * parseInt(seq.scrollAmount)) : contentPos[0] + (seq.dir[1]
                    * parseInt(seq.scrollAmount)),
                to = seq.scrollAmount !== "auto" ? px : amount,
                easing = e ? e : !once ? "mcsLinear" : c ? "mcsLinearOut" : "mcsEaseInOut",
                onComplete = !once ? false : true;
            if (once && t < 17) {
              to = seq.dir[0] === "x" ? contentPos[1] : contentPos[0];
            }
            _scrollTo(el, to.toString(), {
              dir: seq.dir[0],
              scrollEasing: easing,
              dur: t,
              onComplete: onComplete
            });
            if (once) {
              seq.dir = false;
              return;
            }
            clearTimeout(seq.step);
            seq.step = setTimeout(function () {
              _on();
            }, t);
          }

          /* stops sequence */
          function _off() {
            clearTimeout(seq.step);
            _delete(seq, "step");
            _stop(el);
          }
        },
        /* -------------------- */


        /* returns a yx array from value */
        _arr = function (val) {
          var o = $(this).data(pluginPfx).opt, vals = [];
          if (typeof val === "function") {
            val = val();
          }
          /* check if the value is a single anonymous function */
          /* check if value is object or array, its length and create an array with yx values */
          if (!(val instanceof Array)) { /* object value (e.g. {y:"100",x:"100"}, 100 etc.) */
            vals[0] = val.y ? val.y : val.x || o.axis === "x" ? null : val;
            vals[1] = val.x ? val.x : val.y || o.axis === "y" ? null : val;
          } else { /* array value (e.g. [100,100]) */
            vals = val.length > 1 ? [val[0], val[1]] : o.axis === "x" ? [null, val[0]] : [val[0], null];
          }
          /* check if array values are anonymous functions */
          if (typeof vals[0] === "function") {
            vals[0] = vals[0]();
          }
          if (typeof vals[1] === "function") {
            vals[1] = vals[1]();
          }
          return vals;
        },
        /* -------------------- */


        /* translates values (e.g. "top", 100, "100px", "#id") to actual scroll-to positions */
        _to = function (val, dir) {
          if (val == null || typeof val == "undefined") {
            return;
          }
          var $this = $(this), d = $this.data(pluginPfx), o = d.opt,
              mCSB_container = $("#mCSB_" + d.idx + "_container"),
              wrapper = mCSB_container.parent(),
              t = typeof val;
          if (!dir) {
            dir = o.axis === "x" ? "x" : "y";
          }
          var contentLength = dir === "x" ? mCSB_container.outerWidth(false) - wrapper.width() : mCSB_container.outerHeight(false)
              - wrapper.height(),
              contentPos = dir === "x" ? mCSB_container[0].offsetLeft : mCSB_container[0].offsetTop,
              cssProp = dir === "x" ? "left" : "top";
          switch (t) {
            case "function": /* this currently is not used. Consider removing it */
              return val();
              break;
            case "object": /* js/jquery object */
              var obj = val.jquery ? val : $(val);
              if (!obj.length) {
                return;
              }
              return dir === "x" ? _childPos(obj)[1] : _childPos(obj)[0];
              break;
            case "string":
            case "number":
              if (_isNumeric(val)) { /* numeric value */
                return Math.abs(val);
              } else if (val.indexOf("%") !== -1) { /* percentage value */
                return Math.abs(contentLength * parseInt(val) / 100);
              } else if (val.indexOf("-=") !== -1) { /* decrease value */
                return Math.abs(contentPos - parseInt(val.split("-=")[1]));
              } else if (val.indexOf("+=") !== -1) { /* inrease value */
                var p = (contentPos + parseInt(val.split("+=")[1]));
                return p >= 0 ? 0 : Math.abs(p);
              } else if (val.indexOf("px") !== -1 && _isNumeric(val.split("px")[0])) { /* pixels string value (e.g. "100px") */
                return Math.abs(val.split("px")[0]);
              } else {
                if (val === "top" || val === "left") { /* special strings */
                  return 0;
                } else if (val === "bottom") {
                  return Math.abs(wrapper.height() - mCSB_container.outerHeight(false));
                } else if (val === "right") {
                  return Math.abs(wrapper.width() - mCSB_container.outerWidth(false));
                } else if (val === "first" || val === "last") {
                  var obj = mCSB_container.find(":" + val);
                  return dir === "x" ? _childPos(obj)[1] : _childPos(obj)[0];
                } else {
                  if ($(val).length) { /* jquery selector */
                    return dir === "x" ? _childPos($(val))[1] : _childPos($(val))[0];
                  } else { /* other values (e.g. "100em") */
                    mCSB_container.css(cssProp, val);
                    methods.update.call(null, $this[0]);
                    return;
                  }
                }
              }
              break;
          }
        },
        /* -------------------- */


        /* calls the update method automatically */
        _autoUpdate = function (rem) {
          var $this = $(this), d = $this.data(pluginPfx), o = d.opt,
              mCSB_container = $("#mCSB_" + d.idx + "_container");
          if (rem) {
            /*
                    removes autoUpdate timer
                    usage: _autoUpdate.call(this,"remove");
                    */
            clearTimeout(mCSB_container[0].autoUpdate);
            _delete(mCSB_container[0], "autoUpdate");
            return;
          }
          upd();

          function upd() {
            clearTimeout(mCSB_container[0].autoUpdate);
            if ($this.parents("html").length === 0) {
              /* check element in dom tree */
              $this = null;
              return;
            }
            mCSB_container[0].autoUpdate = setTimeout(function () {
              /* update on specific selector(s) length and size change */
              if (o.advanced.updateOnSelectorChange) {
                d.poll.change.n = sizesSum();
                if (d.poll.change.n !== d.poll.change.o) {
                  d.poll.change.o = d.poll.change.n;
                  doUpd(3);
                  return;
                }
              }
              /* update on main element and scrollbar size changes */
              if (o.advanced.updateOnContentResize) {
                d.poll.size.n = $this[0].scrollHeight + $this[0].scrollWidth + mCSB_container[0].offsetHeight + $this[0].offsetHeight
                    + $this[0].offsetWidth;
                if (d.poll.size.n !== d.poll.size.o) {
                  d.poll.size.o = d.poll.size.n;
                  doUpd(1);
                  return;
                }
              }
              /* update on image load */
              if (o.advanced.updateOnImageLoad) {
                if (!(o.advanced.updateOnImageLoad === "auto" && o.axis === "y")) { //by default, it doesn't run on vertical content
                  d.poll.img.n = mCSB_container.find("img").length;
                  if (d.poll.img.n !== d.poll.img.o) {
                    d.poll.img.o = d.poll.img.n;
                    mCSB_container.find("img").each(function () {
                      imgLoader(this);
                    });
                    return;
                  }
                }
              }
              if (o.advanced.updateOnSelectorChange || o.advanced.updateOnContentResize || o.advanced.updateOnImageLoad) {
                upd();
              }
            }, o.advanced.autoUpdateTimeout);
          }

          /* a tiny image loader */
          function imgLoader(el) {
            if ($(el).hasClass(classes[2])) {
              doUpd();
              return;
            }
            var img = new Image();

            function createDelegate(contextObject, delegateMethod) {
              return function () {
                return delegateMethod.apply(contextObject, arguments);
              }
            }

            function imgOnLoad() {
              this.onload = null;
              $(el).addClass(classes[2]);
              doUpd(2);
            }

            img.onload = createDelegate(img, imgOnLoad);
            img.src = el.src;
          }

          /* returns the total height and width sum of all elements matching the selector */
          function sizesSum() {
            if (o.advanced.updateOnSelectorChange === true) {
              o.advanced.updateOnSelectorChange = "*";
            }
            var total = 0, sel = mCSB_container.find(o.advanced.updateOnSelectorChange);
            if (o.advanced.updateOnSelectorChange && sel.length > 0) {
              sel.each(function () {
                total += this.offsetHeight + this.offsetWidth;
              });
            }
            return total;
          }

          /* calls the update method */
          function doUpd(cb) {
            clearTimeout(mCSB_container[0].autoUpdate);
            methods.update.call(null, $this[0], cb);
          }
        },
        /* -------------------- */


        /* snaps scrolling to a multiple of a pixels number */
        _snapAmount = function (to, amount, offset) {
          return (Math.round(to / amount) * amount - offset);
        },
        /* -------------------- */


        /* stops content and scrollbar animations */
        _stop = function (el) {
          var d = el.data(pluginPfx),
              sel = $("#mCSB_" + d.idx + "_container,#mCSB_" + d.idx + "_container_wrapper,#mCSB_" + d.idx + "_dragger_vertical,#mCSB_"
                  + d.idx + "_dragger_horizontal");
          sel.each(function () {
            _stopTween.call(this);
          });
        },
        /* -------------------- */


        /*
            ANIMATES CONTENT
            This is where the actual scrolling happens
            */
        _scrollTo = function (el, to, options) {
          var d = el.data(pluginPfx), o = d.opt,
              defaults = {
                trigger: "internal",
                dir: "y",
                scrollEasing: "mcsEaseOut",
                drag: false,
                dur: o.scrollInertia,
                overwrite: "all",
                callbacks: true,
                onStart: true,
                onUpdate: true,
                onComplete: true
              },
              options = $.extend(defaults, options),
              dur = [options.dur, (options.drag ? 0 : options.dur)],
              mCustomScrollBox = $("#mCSB_" + d.idx),
              mCSB_container = $("#mCSB_" + d.idx + "_container"),
              wrapper = mCSB_container.parent(),
              totalScrollOffsets = o.callbacks.onTotalScrollOffset ? _arr.call(el, o.callbacks.onTotalScrollOffset) : [0, 0],
              totalScrollBackOffsets = o.callbacks.onTotalScrollBackOffset ? _arr.call(el, o.callbacks.onTotalScrollBackOffset) : [0, 0];
          d.trigger = options.trigger;
          if (wrapper.scrollTop() !== 0 || wrapper.scrollLeft() !== 0) { /* always reset scrollTop/Left */
            $(".mCSB_" + d.idx + "_scrollbar").css("visibility", "visible");
            wrapper.scrollTop(0).scrollLeft(0);
          }
          if (to === "_resetY" && !d.contentReset.y) {
            /* callbacks: onOverflowYNone */
            if (_cb("onOverflowYNone")) {
              o.callbacks.onOverflowYNone.call(el[0]);
            }
            d.contentReset.y = 1;
          }
          if (to === "_resetX" && !d.contentReset.x) {
            /* callbacks: onOverflowXNone */
            if (_cb("onOverflowXNone")) {
              o.callbacks.onOverflowXNone.call(el[0]);
            }
            d.contentReset.x = 1;
          }
          if (to === "_resetY" || to === "_resetX") {
            return;
          }
          if ((d.contentReset.y || !el[0].mcs) && d.overflowed[0]) {
            /* callbacks: onOverflowY */
            if (_cb("onOverflowY")) {
              o.callbacks.onOverflowY.call(el[0]);
            }
            d.contentReset.x = null;
          }
          if ((d.contentReset.x || !el[0].mcs) && d.overflowed[1]) {
            /* callbacks: onOverflowX */
            if (_cb("onOverflowX")) {
              o.callbacks.onOverflowX.call(el[0]);
            }
            d.contentReset.x = null;
          }
          if (o.snapAmount) { /* scrolling snapping */
            var snapAmount = !(o.snapAmount instanceof Array) ? o.snapAmount : options.dir === "x" ? o.snapAmount[1] : o.snapAmount[0];
            to = _snapAmount(to, snapAmount, o.snapOffset);
          }
          switch (options.dir) {
            case "x":
              var mCSB_dragger = $("#mCSB_" + d.idx + "_dragger_horizontal"),
                  property = "left",
                  contentPos = mCSB_container[0].offsetLeft,
                  limit = [
                    mCustomScrollBox.width() - mCSB_container.outerWidth(false),
                    mCSB_dragger.parent().width() - mCSB_dragger.width()
                  ],
                  scrollTo = [to, to === 0 ? 0 : (to / d.scrollRatio.x)],
                  tso = totalScrollOffsets[1],
                  tsbo = totalScrollBackOffsets[1],
                  totalScrollOffset = tso > 0 ? tso / d.scrollRatio.x : 0,
                  totalScrollBackOffset = tsbo > 0 ? tsbo / d.scrollRatio.x : 0;
              break;
            case "y":
              var mCSB_dragger = $("#mCSB_" + d.idx + "_dragger_vertical"),
                  property = "top",
                  contentPos = mCSB_container[0].offsetTop,
                  limit = [
                    mCustomScrollBox.height() - mCSB_container.outerHeight(false),
                    mCSB_dragger.parent().height() - mCSB_dragger.height()
                  ],
                  scrollTo = [to, to === 0 ? 0 : (to / d.scrollRatio.y)],
                  tso = totalScrollOffsets[0],
                  tsbo = totalScrollBackOffsets[0],
                  totalScrollOffset = tso > 0 ? tso / d.scrollRatio.y : 0,
                  totalScrollBackOffset = tsbo > 0 ? tsbo / d.scrollRatio.y : 0;
              break;
          }
          if (scrollTo[1] < 0 || (scrollTo[0] === 0 && scrollTo[1] === 0)) {
            scrollTo = [0, 0];
          } else if (scrollTo[1] >= limit[1]) {
            scrollTo = [limit[0], limit[1]];
          } else {
            scrollTo[0] = -scrollTo[0];
          }
          if (!el[0].mcs) {
            _mcs();
            /* init mcs object (once) to make it available before callbacks */
            if (_cb("onInit")) {
              o.callbacks.onInit.call(el[0]);
            }
            /* callbacks: onInit */
          }
          clearTimeout(mCSB_container[0].onCompleteTimeout);
          _tweenTo(mCSB_dragger[0], property, Math.round(scrollTo[1]), dur[1], options.scrollEasing);
          if (!d.tweenRunning && ((contentPos === 0 && scrollTo[0] >= 0) || (contentPos === limit[0] && scrollTo[0] <= limit[0]))) {
            return;
          }
          _tweenTo(mCSB_container[0], property, Math.round(scrollTo[0]), dur[0], options.scrollEasing, options.overwrite, {
            onStart: function () {
              if (options.callbacks && options.onStart && !d.tweenRunning) {
                /* callbacks: onScrollStart */
                if (_cb("onScrollStart")) {
                  _mcs();
                  o.callbacks.onScrollStart.call(el[0]);
                }
                d.tweenRunning = true;
                _onDragClasses(mCSB_dragger);
                d.cbOffsets = _cbOffsets();
              }
            }, onUpdate: function () {
              if (options.callbacks && options.onUpdate) {
                /* callbacks: whileScrolling */
                if (_cb("whileScrolling")) {
                  _mcs();
                  o.callbacks.whileScrolling.call(el[0]);
                }
              }
            }, onComplete: function () {
              if (options.callbacks && options.onComplete) {
                if (o.axis === "yx") {
                  clearTimeout(mCSB_container[0].onCompleteTimeout);
                }
                var t = mCSB_container[0].idleTimer || 0;
                mCSB_container[0].onCompleteTimeout = setTimeout(function () {
                  /* callbacks: onScroll, onTotalScroll, onTotalScrollBack */
                  if (_cb("onScroll")) {
                    _mcs();
                    o.callbacks.onScroll.call(el[0]);
                  }
                  if (_cb("onTotalScroll") && scrollTo[1] >= limit[1] - totalScrollOffset && d.cbOffsets[0]) {
                    _mcs();
                    o.callbacks.onTotalScroll.call(el[0]);
                  }
                  if (_cb("onTotalScrollBack") && scrollTo[1] <= totalScrollBackOffset && d.cbOffsets[1]) {
                    _mcs();
                    o.callbacks.onTotalScrollBack.call(el[0]);
                  }
                  d.tweenRunning = false;
                  mCSB_container[0].idleTimer = 0;
                  _onDragClasses(mCSB_dragger, "hide");
                }, t);
              }
            }
          });

          /* checks if callback function exists */
          function _cb(cb) {
            return d && o.callbacks[cb] && typeof o.callbacks[cb] === "function";
          }

          /* checks whether callback offsets always trigger */
          function _cbOffsets() {
            return [o.callbacks.alwaysTriggerOffsets || contentPos >= limit[0] + tso,
              o.callbacks.alwaysTriggerOffsets || contentPos <= -tsbo];
          }

          /*
                populates object with useful values for the user
                values:
                    content: this.mcs.content
                    content top position: this.mcs.top
                    content left position: this.mcs.left
                    dragger top position: this.mcs.draggerTop
                    dragger left position: this.mcs.draggerLeft
                    scrolling y percentage: this.mcs.topPct
                    scrolling x percentage: this.mcs.leftPct
                    scrolling direction: this.mcs.direction
                */
          function _mcs() {
            var cp = [mCSB_container[0].offsetTop, mCSB_container[0].offsetLeft], /* content position */
                dp = [mCSB_dragger[0].offsetTop, mCSB_dragger[0].offsetLeft], /* dragger position */
                cl = [mCSB_container.outerHeight(false), mCSB_container.outerWidth(false)], /* content length */
                pl = [mCustomScrollBox.height(), mCustomScrollBox.width()];
            /* content parent length */
            el[0].mcs = {
              content: mCSB_container, /* original content wrapper as jquery object */
              top: cp[0],
              left: cp[1],
              draggerTop: dp[0],
              draggerLeft: dp[1],
              topPct: Math.round((100 * Math.abs(cp[0])) / (Math.abs(cl[0]) - pl[0])),
              leftPct: Math.round((100 * Math.abs(cp[1])) / (Math.abs(cl[1]) - pl[1])),
              direction: options.dir
            };
            /*
                    this refers to the original element containing the scrollbar(s)
                    usage: this.mcs.top, this.mcs.leftPct etc.
                    */
          }
        },
        /* -------------------- */


        /*
            CUSTOM JAVASCRIPT ANIMATION TWEEN
            Lighter and faster than jquery animate() and css transitions
            Animates top/left properties and includes easings
            */
        _tweenTo = function (el, prop, to, duration, easing, overwrite, callbacks) {
          if (!el._mTween) {
            el._mTween = {top: {}, left: {}};
          }
          var callbacks = callbacks || {},
              onStart = callbacks.onStart || function () {
              }, onUpdate = callbacks.onUpdate || function () {
              }, onComplete = callbacks.onComplete || function () {
              },
              startTime = _getTime(), _delay, progress = 0, from = el.offsetTop, elStyle = el.style, _request,
              tobj = el._mTween[prop];
          if (prop === "left") {
            from = el.offsetLeft;
          }
          var diff = to - from;
          tobj.stop = 0;
          if (overwrite !== "none") {
            _cancelTween();
          }
          _startTween();

          function _step() {
            if (tobj.stop) {
              return;
            }
            if (!progress) {
              onStart.call();
            }
            progress = _getTime() - startTime;
            _tween();
            if (progress >= tobj.time) {
              tobj.time = (progress > tobj.time) ? progress + _delay - (progress - tobj.time) : progress + _delay - 1;
              if (tobj.time < progress + 1) {
                tobj.time = progress + 1;
              }
            }
            if (tobj.time < duration) {
              tobj.id = _request(_step);
            } else {
              onComplete.call();
            }
          }

          function _tween() {
            if (duration > 0) {
              tobj.currVal = _ease(tobj.time, from, diff, duration, easing);
              elStyle[prop] = Math.round(tobj.currVal) + "px";
            } else {
              elStyle[prop] = to + "px";
            }
            onUpdate.call();
          }

          function _startTween() {
            _delay = 1000 / 60;
            tobj.time = progress + _delay;
            _request = (!window.requestAnimationFrame) ? function (f) {
              _tween();
              return setTimeout(f, 0.01);
            } : window.requestAnimationFrame;
            tobj.id = _request(_step);
          }

          function _cancelTween() {
            if (tobj.id == null) {
              return;
            }
            if (!window.requestAnimationFrame) {
              clearTimeout(tobj.id);
            } else {
              window.cancelAnimationFrame(tobj.id);
            }
            tobj.id = null;
          }

          function _ease(t, b, c, d, type) {
            switch (type) {
              case "linear":
              case "mcsLinear":
                return c * t / d + b;
                break;
              case "mcsLinearOut":
                t /= d;
                t--;
                return c * Math.sqrt(1 - t * t) + b;
                break;
              case "easeInOutSmooth":
                t /= d / 2;
                if (t < 1) {
                  return c / 2 * t * t + b;
                }
                t--;
                return -c / 2 * (t * (t - 2) - 1) + b;
                break;
              case "easeInOutStrong":
                t /= d / 2;
                if (t < 1) {
                  return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
                }
                t--;
                return c / 2 * (-Math.pow(2, -10 * t) + 2) + b;
                break;
              case "easeInOut":
              case "mcsEaseInOut":
                t /= d / 2;
                if (t < 1) {
                  return c / 2 * t * t * t + b;
                }
                t -= 2;
                return c / 2 * (t * t * t + 2) + b;
                break;
              case "easeOutSmooth":
                t /= d;
                t--;
                return -c * (t * t * t * t - 1) + b;
                break;
              case "easeOutStrong":
                return c * (-Math.pow(2, -10 * t / d) + 1) + b;
                break;
              case "easeOut":
              case "mcsEaseOut":
              default:
                var ts = (t /= d) * t, tc = ts * t;
                return b + c * (0.499999999999997 * tc * ts + -2.5 * ts * ts + 5.5 * tc + -6.5 * ts + 4 * t);
            }
          }
        },
        /* -------------------- */


        /* returns current time */
        _getTime = function () {
          if (window.performance && window.performance.now) {
            return window.performance.now();
          } else {
            if (window.performance && window.performance.webkitNow) {
              return window.performance.webkitNow();
            } else {
              if (Date.now) {
                return Date.now();
              } else {
                return new Date().getTime();
              }
            }
          }
        },
        /* -------------------- */


        /* stops a tween */
        _stopTween = function () {
          var el = this;
          if (!el._mTween) {
            el._mTween = {top: {}, left: {}};
          }
          var props = ["top", "left"];
          for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            if (el._mTween[prop].id) {
              if (!window.requestAnimationFrame) {
                clearTimeout(el._mTween[prop].id);
              } else {
                window.cancelAnimationFrame(el._mTween[prop].id);
              }
              el._mTween[prop].id = null;
              el._mTween[prop].stop = 1;
            }
          }
        },
        /* -------------------- */


        /* deletes a property (avoiding the exception thrown by IE) */
        _delete = function (c, m) {
          try {
            delete c[m];
          } catch (e) {
            c[m] = null;
          }
        },
        /* -------------------- */


        /* detects left mouse button */
        _mouseBtnLeft = function (e) {
          return !(e.which && e.which !== 1);
        },
        /* -------------------- */


        /* detects if pointer type event is touch */
        _pointerTouch = function (e) {
          var t = e.originalEvent.pointerType;
          return !(t && t !== "touch" && t !== 2);
        },
        /* -------------------- */


        /* checks if value is numeric */
        _isNumeric = function (val) {
          return !isNaN(parseFloat(val)) && isFinite(val);
        },
        /* -------------------- */


        /* returns element position according to content */
        _childPos = function (el) {
          var p = el.parents(".mCSB_container");
          return [el.offset().top - p.offset().top, el.offset().left - p.offset().left];
        },
        /* -------------------- */


        /* checks if browser tab is hidden/inactive via Page Visibility API */
        _isTabHidden = function () {
          var prop = _getHiddenProp();
          if (!prop) {
            return false;
          }
          return document[prop];

          function _getHiddenProp() {
            var pfx = ["webkit", "moz", "ms", "o"];
            if ("hidden" in document) {
              return "hidden";
            } //natively supported
            for (var i = 0; i < pfx.length; i++) { //prefixed
              if ((pfx[i] + "Hidden") in document) {
                return pfx[i] + "Hidden";
              }
            }
            return null; //not supported
          }
        };
    /* -------------------- */

    /*
        ----------------------------------------
        PLUGIN SETUP
        ----------------------------------------
        */

    /* plugin constructor functions */
    $.fn[pluginNS] = function (method) { /* usage: $(selector).mCustomScrollbar(); */
      if (methods[method]) {
        return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
      } else if (typeof method === "object" || !method) {
        return methods.init.apply(this, arguments);
      } else {
        $.error("Method " + method + " does not exist");
      }
    };
    $[pluginNS] = function (method) { /* usage: $.mCustomScrollbar(); */
      if (methods[method]) {
        return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
      } else if (typeof method === "object" || !method) {
        return methods.init.apply(this, arguments);
      } else {
        $.error("Method " + method + " does not exist");
      }
    };

    /*
        allow setting plugin default options.
        usage: $.mCustomScrollbar.defaults.scrollInertia=500;
        to apply any changed default options on default selectors (below), use inside document ready fn
        e.g.: $(document).ready(function(){ $.mCustomScrollbar.defaults.scrollInertia=500; });
        */
    $[pluginNS].defaults = defaults;

    /*
        add window object (window.mCustomScrollbar)
        usage: if(window.mCustomScrollbar){console.log("custom scrollbar plugin loaded");}
        */
    window[pluginNS] = true;

    $(window).bind("load", function () {

      $(defaultSelector)[pluginNS]();
      /* add scrollbars automatically on default selector */

      /* extend jQuery expressions */
      $.extend($.expr[":"], {
        /* checks if element is within scrollable viewport */
        mcsInView: $.expr[":"].mcsInView || function (el) {
          var $el = $(el), content = $el.parents(".mCSB_container"), wrapper, cPos;
          if (!content.length) {
            return;
          }
          wrapper = content.parent();
          cPos = [content[0].offsetTop, content[0].offsetLeft];
          return cPos[0] + _childPos($el)[0] >= 0 && cPos[0] + _childPos($el)[0] < wrapper.height() - $el.outerHeight(false) &&
              cPos[1] + _childPos($el)[1] >= 0 && cPos[1] + _childPos($el)[1] < wrapper.width() - $el.outerWidth(false);
        },
        /* checks if element or part of element is in view of scrollable viewport */
        mcsInSight: $.expr[":"].mcsInSight || function (el, i, m) {
          var $el = $(el), elD, content = $el.parents(".mCSB_container"), wrapperView, pos, wrapperViewPct,
              pctVals = m[3] === "exact" ? [[1, 0], [1, 0]] : [[0.9, 0.1], [0.6, 0.4]];
          if (!content.length) {
            return;
          }
          elD = [$el.outerHeight(false), $el.outerWidth(false)];
          pos = [content[0].offsetTop + _childPos($el)[0], content[0].offsetLeft + _childPos($el)[1]];
          wrapperView = [content.parent()[0].offsetHeight, content.parent()[0].offsetWidth];
          wrapperViewPct = [elD[0] < wrapperView[0] ? pctVals[0] : pctVals[1], elD[1] < wrapperView[1] ? pctVals[0] : pctVals[1]];
          return pos[0] - (wrapperView[0] * wrapperViewPct[0][0]) < 0 && pos[0] + elD[0] - (wrapperView[0] * wrapperViewPct[0][1]) >= 0 &&
              pos[1] - (wrapperView[1] * wrapperViewPct[1][0]) < 0 && pos[1] + elD[1] - (wrapperView[1] * wrapperViewPct[1][1]) >= 0;
        },
        /* checks if element is overflowed having visible scrollbar(s) */
        mcsOverflow: $.expr[":"].mcsOverflow || function (el) {
          var d = $(el).data(pluginPfx);
          if (!d) {
            return;
          }
          return d.overflowed[0] || d.overflowed[1];
        }
      });

    });

  }))
}));


// jquery.daterangepicker.js
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery', 'moment'], factory);
  } else if (typeof exports === 'object' && typeof module !== 'undefined') {
    // CommonJS. Register as a module
    module.exports = factory(require('jquery'), require('moment'));
  } else {
    // Browser globals
    factory(jQuery, moment);
  }
}(function ($, moment) {
  'use strict';
  $.allwinDatepickerLanguages = {
    "default":
        {
          "selected": "기간:",
          "day": "일",
          "days": "일간",
          "apply": "닫기",
          "week-1": "월",
          "week-2": "화",
          "week-3": "수",
          "week-4": "목",
          "week-5": "금",
          "week-6": "토",
          "week-7": "일",
          "week-number": "주",
          "month-name": ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
          "shortcuts": "단축키들",
          "past": "지난(오늘기준)",
          "following": "이후(오늘기준)",
          "previous": "이전",
          "prev-week": "1주",
          "prev-month": "1달",
          "prev-year": "1년",
          "next": "다음",
          "next-week": "1주",
          "next-month": "1달",
          "next-year": "1년",
          "less-than": "날짜 범위는 %d 일보다 많을 수 없습니다",
          "more-than": "날짜 범위는 %d 일보다 작을 수 없습니다",
          "default-more": "날짜 범위를 %d 일보다 길게 선택해 주세요",
          "default-single": "날짜를 선택해 주세요",
          "default-less": "%d 일보다 작은 날짜를 선택해 주세요",
          "default-range": "%d와 %d 일 사이의 날짜 범위를 선택해 주세요",
          "default-default": "날짜 범위를 선택해 주세요",
          "time": "",
          "hour": "시",
          "minute": "분"
        }
  };

  $.fn.allwinDatepicker = function (opt) {
    if (!opt) {
      opt = {};
    }
    opt = $.extend(true, {
      autoClose: false,
      format: 'YYYY.MM.DD',
      separator: ' - ',
      language: 'auto',
      startOfWeek: 'sunday', // or monday
      getValue: function () {
        return $(this).val();
      },
      setValue: function (s) {
        // if (!$(this).attr('readonly') && !$(this).is(':disabled') && s != $(this).val()) {
        //   $(this).val(s);
        // }
        if (!$(this).is(':disabled') && s != $(this).val()) {
          $(this).val(s);
        }
      },
      startDate: false,
      endDate: false,
      time: {
        enabled: false
      },
      minDays: 0,
      maxDays: 0,
      showShortcuts: false,
      shortcuts: {
        //'prev-days': [1,3,5,7],
        // 'next-days': [3,5,7],
        //'prev' : ['week','month','year'],
        // 'next' : ['week','month','year']
      },
      customShortcuts: [],
      inline: false,
      container: 'body',
      alwaysOpen: false,
      singleDate: false,
      lookBehind: false,
      batchMode: false,
      duration: 200,
      stickyMonths: false,
      dayDivAttrs: [],
      dayTdAttrs: [],
      selectForward: false,
      selectBackward: false,
      applyBtnClass: '',
      singleMonth: 'auto',
      hoveringTooltip: function (days, startTime, hoveringTime) {
        return days > 1 ? days + ' ' + translate('days') : '';
      },
      showTopbar: true,
      swapTime: false,
      showWeekNumbers: false,
      getWeekNumber: function (date) //date will be the first day of a week
      {
        return moment(date).format('w');
      },
      customOpenAnimation: null,
      customCloseAnimation: null,
      customArrowPrevSymbol: null,
      customArrowNextSymbol: null,
      monthSelect: true,
      yearSelect: true
    }, opt);

    opt.start = false;
    opt.end = false;

    opt.startWeek = false;

    //detect a touch device
    opt.isTouchDevice = 'ontouchstart' in window || navigator.msMaxTouchPoints;

    //if it is a touch device, hide hovering tooltip
    if (opt.isTouchDevice) {
      opt.hoveringTooltip = false;
    }

    //show one month on mobile devices
    if (opt.singleMonth == 'auto') {
      opt.singleMonth = $(window).width() < 480;
    }
    if (opt.singleMonth) {
      opt.stickyMonths = false;
    }

    if (!opt.showTopbar) {
      opt.autoClose = true;
    }

    if (opt.startDate && typeof opt.startDate == 'string') {
      opt.startDate = moment(opt.startDate, opt.format).toDate();
    }
    if (opt.endDate && typeof opt.endDate == 'string') {
      opt.endDate = moment(opt.endDate, opt.format).toDate();
    }

    if (opt.yearSelect && typeof opt.yearSelect === 'boolean') {
      opt.yearSelect = function (current) {
        return [current - 5, current + 5];
      }
    }

    var languages = getLanguages();
    var box;
    var initiated = false;
    var self = this;
    var selfDom = $(self).get(0);
    var domChangeTimer;

    $(this).unbind('.datepicker').bind('click.datepicker', function (evt) {
      var isOpen = box.is(':visible');
      if (!isOpen) {
        open(opt.duration);
      }
    }).bind('change.datepicker', function (evt) {
      checkAndSetDefaultValue();
    }).bind('keyup.datepicker', function () {
      try {
        clearTimeout(domChangeTimer);
      } catch (e) {
      }
      domChangeTimer = setTimeout(function () {
        checkAndSetDefaultValue();
      }, 2000);
    });

    init_datepicker.call(this);

    if (opt.alwaysOpen) {
      open(0);
    }

    // expose some api
    $(this).data('allwinDatepicker', {
      setStart: function (d1) {
        if (typeof d1 == 'string') {
          d1 = moment(d1, opt.format).toDate();
        }

        opt.end = false;
        setSingleDate(d1);

        return this;
      },
      setEnd: function (d2, silent) {
        var start = new Date();
        start.setTime(opt.start);
        if (typeof d2 == 'string') {
          d2 = moment(d2, opt.format).toDate();
        }
        setDateRange(start, d2, silent);
        return this;
      },
      setDateRange: function (d1, d2, silent) {
        if (typeof d1 == 'string' && typeof d2 == 'string') {
          d1 = moment(d1, opt.format).toDate();
          d2 = moment(d2, opt.format).toDate();
        }
        setDateRange(d1, d2, silent);
      },
      getStartDateRange: function () {
        return moment(new Date(parseInt(opt.start)));
      },
      getEndDateRange: function () {
        return moment(new Date(parseInt(opt.end)));
      },
      getDateRange: function () {
        return moment(opt.start).format(opt.format)
            + opt.separator
            + moment(opt.end).format(opt.format);
      },
      clear: clearSelection,
      close: closeDatePicker,
      open: open,
      redraw: redrawDatePicker,
      getDatePicker: getDatePicker,
      resetMonthsView: resetMonthsView,
      destroy: function () {
        $(self).unbind('.datepicker');
        $(self).data('allwinDatepicker', '');
        $(self).data('date-picker-opened', null);
        box.remove();
        $(window).unbind('resize.datepicker', calcPosition);
        $(document).unbind('click.datepicker', closeDatePicker);
      }
    });

    $(window).bind('resize.datepicker', calcPosition);

    return this;

    function IsOwnDatePickerClicked(evt, selfObj) {
      return (selfObj.contains(evt.target) || evt.target == selfObj || (selfObj.childNodes != undefined && $.inArray(evt.target,
          selfObj.childNodes) >= 0));
    }

    function init_datepicker() {
      var self = this;

      if ($(this).data('date-picker-opened')) {
        closeDatePicker();
        return;
      }
      $(this).data('date-picker-opened', true);

      box = createDom().hide();
      //box.append('<div class="date-range-length-tip"></div>');

      $(opt.container).append(box);

      if (!opt.inline) {
        calcPosition();
      } else {
        box.addClass('awa-datepicker');
      }

      if (opt.alwaysOpen) {
        box.find('.apply-btn').hide();
      }

      var defaultTime = getDefaultTime();
      resetMonthsView(defaultTime);

      if (opt.time.enabled) {
        if ((opt.startDate && opt.endDate) || (opt.start && opt.end)) {
          showTime(moment(opt.start || opt.startDate).toDate(), 'time1');
          showTime(moment(opt.end || opt.endDate).toDate(), 'time2');
        } else {
          var defaultEndTime = opt.defaultEndTime ? opt.defaultEndTime : defaultTime;
          showTime(defaultTime, 'time1');
          showTime(defaultEndTime, 'time2');
        }
      }

      //showSelectedInfo();

      var defaultTopText = '';
      if (opt.singleDate) {
        defaultTopText = translate('default-single');
      } else if (opt.minDays && opt.maxDays) {
        defaultTopText = translate('default-range');
      } else if (opt.minDays) {
        defaultTopText = translate('default-more');
      } else if (opt.maxDays) {
        defaultTopText = translate('default-less');
      } else {
        defaultTopText = translate('default-default');
      }

      box.find('.default-top').html(defaultTopText.replace(/\%d/, opt.minDays).replace(/\%d/, opt.maxDays));
      if (opt.singleMonth) {
        box.addClass('single-month');
      } else {
        box.addClass('two-months');
      }

      setTimeout(function () {
        updateCalendarWidth();
        initiated = true;
      }, 0);

      box.click(function (evt) {
        evt.stopPropagation();
      });

      //if user click other place of the webpage, close date range picker window
      $(document).bind('click.datepicker', function (evt) {
        if (!IsOwnDatePickerClicked(evt, self[0])) {
          if (box.is(':visible')) {
            closeDatePicker();
          }
        }
      });

      box.find('.next').click(function () {
        if (!opt.stickyMonths) {
          gotoNextMonth(this);
        } else {
          gotoNextMonth_stickily(this);
        }
      });

      function gotoNextMonth(self) {
        var isMonth2 = $(self).parents('table').hasClass('month2');
        var month = isMonth2 ? opt.month2 : opt.month1;
        month = nextMonth(month);
        //if (!opt.singleMonth && !opt.singleDate && !isMonth2 && compare_month(month, opt.month2) >= 0 || isMonthOutOfBounds(month)) return;
        showMonth(month, isMonth2 ? 'month2' : 'month1');
        showGap();
      }

      function gotoNextMonth_stickily(self) {
        var nextMonth1 = nextMonth(opt.month1);
        var nextMonth2 = nextMonth(opt.month2);
        if (isMonthOutOfBounds(nextMonth2)) {
          return;
        }
        if (!opt.singleDate && compare_month(nextMonth1, nextMonth2) >= 0) {
          return;
        }
        showMonth(nextMonth1, 'month1');
        showMonth(nextMonth2, 'month2');
        showSelectedDays();
      }

      box.find('.prev').click(function () {
        if (!opt.stickyMonths) {
          gotoPrevMonth(this);
        } else {
          gotoPrevMonth_stickily(this);
        }
      });

      function gotoPrevMonth(self) {
        var isMonth2 = $(self).parents('table').hasClass('month2');
        var month = isMonth2 ? opt.month2 : opt.month1;
        month = prevMonth(month);
        //if (isMonth2 && compare_month(month, opt.month1) <= 0 || isMonthOutOfBounds(month)) return;
        showMonth(month, isMonth2 ? 'month2' : 'month1');
        showGap();
      }

      function gotoPrevMonth_stickily(self) {
        var prevMonth1 = prevMonth(opt.month1);
        var prevMonth2 = prevMonth(opt.month2);
        if (isMonthOutOfBounds(prevMonth1)) {
          return;
        }
        if (!opt.singleDate && compare_month(prevMonth2, prevMonth1) <= 0) {
          return;
        }
        showMonth(prevMonth2, 'month2');
        showMonth(prevMonth1, 'month1');
        showSelectedDays();
      }

      box.attr('unselectable', 'on')
      .css('user-select', 'none')
      .bind('selectstart', function (e) {
        e.preventDefault();
        return false;
      });

      box.find('.apply-btn').click(function () {
        closeDatePicker();
        var dateRange = getDateString(new Date(opt.start)) + opt.separator + getDateString(new Date(opt.end));
        $(self).trigger('datepicker-apply', {
          'value': dateRange,
          'date1': new Date(opt.start),
          'date2': new Date(opt.end)
        });
      });

      box.find('[custom]').click(function () {
        var valueName = $(this).attr('custom');
        opt.start = false;
        opt.end = false;
        box.find('.day.checked').removeClass('checked');
        opt.setValue.call(selfDom, valueName);
        checkSelectionValid();
        showSelectedInfo(true);
        showSelectedDays();
        if (opt.autoClose) {
          closeDatePicker();
        }
      });

      box.find('[shortcut]').click(function () {
        var shortcut = $(this).attr('shortcut');
        var end = new Date(),
            start = false;
        var dir;
        if (shortcut.indexOf('day') != -1) {
          var day = parseInt(shortcut.split(',', 2)[1], 10);
          start = new Date(new Date().getTime() + 86400000 * day);
          end = new Date(end.getTime() + 86400000 * (day > 0 ? 1 : -1));
        } else if (shortcut.indexOf('week') != -1) {
          dir = shortcut.indexOf('prev,') != -1 ? -1 : 1;
          var stopDay;
          if (dir == 1) {
            stopDay = opt.startOfWeek == 'monday' ? 1 : 0;
          } else {
            stopDay = opt.startOfWeek == 'monday' ? 0 : 6;
          }

          end = new Date(end.getTime() - 86400000);
          while (end.getDay() != stopDay) {
            end = new Date(end.getTime() + dir * 86400000);
          }
          start = new Date(end.getTime() + dir * 86400000 * 6);
        } else if (shortcut.indexOf('month') != -1) {
          dir = shortcut.indexOf('prev,') != -1 ? -1 : 1;
          if (dir == 1) {
            start = nextMonth(end);
          } else {
            start = prevMonth(end);
          }
          start.setDate(1);
          end = nextMonth(start);
          end.setDate(1);
          end = new Date(end.getTime() - 86400000);
        } else if (shortcut.indexOf('year') != -1) {
          dir = shortcut.indexOf('prev,') != -1 ? -1 : 1;
          start = new Date();
          start.setFullYear(end.getFullYear() + dir);
          start.setMonth(0);
          start.setDate(1);
          end.setFullYear(end.getFullYear() + dir);
          end.setMonth(11);
          end.setDate(31);
        } else if (shortcut == 'custom') {
          var name = $(this).html();
          if (opt.customShortcuts && opt.customShortcuts.length > 0) {
            for (var i = 0; i < opt.customShortcuts.length; i++) {
              var sh = opt.customShortcuts[i];
              if (sh.name == name) {
                var data = [];
                // try
                // {
                data = sh['dates'].call();
                //}catch(e){}
                if (data && data.length == 2) {
                  start = data[0];
                  end = data[1];
                }

                // if only one date is specified then just move calendars there
                // move calendars to show this date's month and next months
                if (data && data.length == 1) {
                  var movetodate = data[0];
                  showMonth(movetodate, 'month1');
                  showMonth(nextMonth(movetodate), 'month2');
                  showGap();
                }

                break;
              }
            }
          }
        }
        if (start && end) {
          setDateRange(start, end);
          checkSelectionValid();
        }
      });

      box.find('.time1 select').bind('change touchmove', function (e) {
        var target = e.target,
            hour = target.name == 'hour' ? $(target).val().replace(/^(\d{1})$/, '0$1') : undefined,
            min = target.name == 'minute' ? $(target).val().replace(/^(\d{1})$/, '0$1') : undefined;
        setTime('time1', hour, min);
      });

      box.find('.time2 select').bind('change touchmove', function (e) {
        var target = e.target,
            hour = target.name == 'hour' ? $(target).val().replace(/^(\d{1})$/, '0$1') : undefined,
            min = target.name == 'minute' ? $(target).val().replace(/^(\d{1})$/, '0$1') : undefined;
        setTime('time2', hour, min);
      });

    }

    function calcPosition() {
      if (!opt.inline) {
        var offset = $(self).offset();
        if ($(opt.container).css('position') == 'relative') {
          var containerOffset = $(opt.container).offset();
          var leftIndent = Math.max(0, offset.left + box.outerWidth() - $('body').width() + 16);
          box.css({
            top: offset.top - containerOffset.top + $(self).outerHeight() + 4,
            left: offset.left - containerOffset.left - leftIndent
          });
        } else {
          if (offset.left < 460) //left to right
          {
            box.css({
              top: offset.top + $(self).outerHeight() + parseInt($('body').css('border-top') || 0, 10),
              left: offset.left
            });
          } else {
            box.css({
              top: offset.top + $(self).outerHeight() + parseInt($('body').css('border-top') || 0, 10),
              left: offset.left + $(self).width() - box.width() - 16
            });
          }
        }
      }
    }

    // Return the date picker wrapper element
    function getDatePicker() {
      return box;
    }

    function open(animationTime) {
      redrawDatePicker();
      checkAndSetDefaultValue();
      if (opt.customOpenAnimation) {
        opt.customOpenAnimation.call(box.get(0), function () {
          $(self).trigger('datepicker-opened', {
            relatedTarget: box
          });
        });
      } else {
        box.slideDown(animationTime, function () {
          $(self).trigger('datepicker-opened', {
            relatedTarget: box
          });
        });
      }
      $(self).trigger('datepicker-open', {
        relatedTarget: box
      });
      showGap();
      updateCalendarWidth();
      calcPosition();
    }

    function checkAndSetDefaultValue() {
      var __default_string = opt.getValue.call(selfDom);
      var defaults = __default_string ? __default_string.split(opt.separator) : '';

      if (defaults && ((defaults.length == 1 && opt.singleDate) || defaults.length >= 2)) {
        var ___format = opt.format;
        if (___format.match(/Do/)) {

          ___format = ___format.replace(/Do/, 'D');
          defaults[0] = defaults[0].replace(/(\d+)(th|nd|st)/, '$1');
          if (defaults.length >= 2) {
            defaults[1] = defaults[1].replace(/(\d+)(th|nd|st)/, '$1');
          }
        }

        // set initiated  to avoid triggerring datepicker-change event
        initiated = false;
        if (defaults.length >= 2) {
          setDateRange(getValidValue(defaults[0], ___format, moment.locale(opt.language)),
              getValidValue(defaults[1], ___format, moment.locale(opt.language)));
        } else if (defaults.length == 1 && opt.singleDate) {
          box.find('.time1 .hour select').val(moment(defaults[0]).format('HH'));
          box.find('.time1 .minute select').val(moment(defaults[0]).format('mm'));
          setSingleDate(getValidValue(defaults[0], ___format, moment.locale(opt.language)));
        }

        initiated = true;
      }
    }

    function getValidValue(date, format, locale) {
      if (moment(date, format, locale).isValid()) {
        return moment(date, format, locale).toDate();
      } else {
        return moment().toDate();
      }
    }

    function updateCalendarWidth() {
      var gapMargin = box.find('.gap').css('margin-left');
      if (gapMargin) {
        gapMargin = parseInt(gapMargin);
      }
      var w1 = box.find('.month1').width();
      var w2 = box.find('.gap').width() + (gapMargin ? gapMargin * 2 : 0);
      var w3 = box.find('.month2').width();
      //box.find('.month-wrapper').width(w1 + w2 + w3);
    }

    function renderTime(name, date) {
      box.find('.' + name + ' input[type=range].hour-range').val(moment(date).hours());
      box.find('.' + name + ' input[type=range].minute-range').val(moment(date).minutes());
      setTime(name, moment(date).format('HH'), moment(date).format('mm'));
    }

    function changeTime(name, date) {
      opt[name] = parseInt(
          moment(parseInt(date))
          .startOf('day')
          .add(moment(opt[name + 'Time']).format('HH'), 'h')
          .add(moment(opt[name + 'Time']).format('mm'), 'm').valueOf()
      );
    }

    function swapTime() {
      renderTime('time1', opt.start);
      renderTime('time2', opt.end);
    }

    function setTime(name, hour, minute) {
      hour && (box.find('.' + name + ' .hour-val').text(hour));
      minute && (box.find('.' + name + ' .minute-val').text(minute));
      switch (name) {
        case 'time1':
          if (opt.start) {
            setRange('start', moment(opt.start));
          }
          setRange('startTime', moment(opt.startTime || moment().valueOf()));
          break;
        case 'time2':
          if (opt.end) {
            setRange('end', moment(opt.end));
          }
          setRange('endTime', moment(opt.endTime || moment().valueOf()));
          break;
      }

      function setRange(name, timePoint) {
        var h = timePoint.format('HH'),
            m = timePoint.format('mm');
        opt[name] = timePoint
        .startOf('day')
        .add(hour || h, 'h')
        .add(minute || m, 'm')
        .valueOf();
      }

      checkSelectionValid();
      showSelectedInfo();
      showSelectedDays();
    }

    function clearSelection() {
      opt.start = false;
      opt.end = false;
      box.find('.day.checked').removeClass('checked');
      box.find('.day.last-date-selected').removeClass('last-date-selected');
      box.find('.day.first-date-selected').removeClass('first-date-selected');
      opt.setValue.call(selfDom, '');
      checkSelectionValid();
      showSelectedInfo();
      showSelectedDays();
    }

    function handleStart(time) {
      var r = time;
      if (opt.batchMode === 'week-range') {
        if (opt.startOfWeek === 'monday') {
          r = moment(parseInt(time)).startOf('isoweek').valueOf();
        } else {
          r = moment(parseInt(time)).startOf('week').valueOf();
        }
      } else if (opt.batchMode === 'month-range') {
        r = moment(parseInt(time)).startOf('month').valueOf();
      }
      return r;
    }

    function handleEnd(time) {
      var r = time;
      if (opt.batchMode === 'week-range') {
        if (opt.startOfWeek === 'monday') {
          r = moment(parseInt(time)).endOf('isoweek').valueOf();
        } else {
          r = moment(parseInt(time)).endOf('week').valueOf();
        }
      } else if (opt.batchMode === 'month-range') {
        r = moment(parseInt(time)).endOf('month').valueOf();
      }
      return r;
    }

    function dayClicked(day) {
      if (day.hasClass('invalid')) {
        return;
      }
      var time = day.attr('time');
      day.addClass('checked');
      if (opt.singleDate) {
        opt.start = time;
        opt.end = false;
      } else if (opt.batchMode === 'week') {
        if (opt.startOfWeek === 'monday') {
          opt.start = moment(parseInt(time)).startOf('isoweek').valueOf();
          opt.end = moment(parseInt(time)).endOf('isoweek').valueOf();
        } else {
          opt.end = moment(parseInt(time)).endOf('week').valueOf();
          opt.start = moment(parseInt(time)).startOf('week').valueOf();
        }
      } else if (opt.batchMode === 'workweek') {
        opt.start = moment(parseInt(time)).day(1).valueOf();
        opt.end = moment(parseInt(time)).day(5).valueOf();
      } else if (opt.batchMode === 'weekend') {
        opt.start = moment(parseInt(time)).day(6).valueOf();
        opt.end = moment(parseInt(time)).day(7).valueOf();
      } else if (opt.batchMode === 'month') {
        opt.start = moment(parseInt(time)).startOf('month').valueOf();
        opt.end = moment(parseInt(time)).endOf('month').valueOf();
      } else if ((opt.start && opt.end) || (!opt.start && !opt.end)) {
        opt.start = handleStart(time);
        opt.end = false;
      } else if (opt.start) {
        opt.end = handleEnd(time);
        if (opt.time.enabled) {
          changeTime('end', opt.end);
        }
      }

      //Update time in case it is enabled and timestamps are available
      if (opt.time.enabled) {
        if (opt.start) {
          changeTime('start', opt.start);
        }
        if (opt.end) {
          changeTime('end', opt.end);
        }
      }

      //In case the start is after the end, swap the timestamps
      if (!opt.singleDate && opt.start && opt.end && opt.start > opt.end) {
        var tmp = opt.end;
        opt.end = handleEnd(opt.start);
        opt.start = handleStart(tmp);
        if (opt.time.enabled && opt.swapTime) {
          swapTime();
        }
      }

      opt.start = parseInt(opt.start);
      opt.end = parseInt(opt.end);

      clearHovering();
      if (opt.start && !opt.end) {
        $(self).trigger('datepicker-first-date-selected', {
          'date1': new Date(opt.start)
        });
        dayHovering(day);
      }
      updateSelectableRange(time);

      checkSelectionValid();
      showSelectedInfo();
      showSelectedDays();
      autoclose();

    }

    function weekNumberClicked(weekNumberDom) {
      var thisTime = parseInt(weekNumberDom.attr('data-start-time'), 10);
      var date1, date2;
      if (!opt.startWeek) {
        opt.startWeek = thisTime;
        weekNumberDom.addClass('week-number-selected');
        date1 = new Date(thisTime);
        opt.start = moment(date1).day(opt.startOfWeek == 'monday' ? 1 : 0).valueOf();
        opt.end = moment(date1).day(opt.startOfWeek == 'monday' ? 7 : 6).valueOf();
      } else {
        box.find('.week-number-selected').removeClass('week-number-selected');
        date1 = new Date(thisTime < opt.startWeek ? thisTime : opt.startWeek);
        date2 = new Date(thisTime < opt.startWeek ? opt.startWeek : thisTime);
        opt.startWeek = false;
        opt.start = moment(date1).day(opt.startOfWeek == 'monday' ? 1 : 0).valueOf();
        opt.end = moment(date2).day(opt.startOfWeek == 'monday' ? 7 : 6).valueOf();
      }
      updateSelectableRange();
      checkSelectionValid();
      showSelectedInfo();
      showSelectedDays();
      autoclose();
    }

    function isValidTime(time) {
      time = parseInt(time, 10);
      if (opt.startDate && compare_day(time, opt.startDate) < 0) {
        return false;
      }
      if (opt.endDate && compare_day(time, opt.endDate) > 0) {
        return false;
      }

      if (opt.start && !opt.end && !opt.singleDate) {
        //check maxDays and minDays setting
        if (opt.maxDays > 0 && countDays(time, opt.start) > opt.maxDays) {
          return false;
        }
        if (opt.minDays > 0 && countDays(time, opt.start) < opt.minDays) {
          return false;
        }

        //check selectForward and selectBackward
        if (opt.selectForward && time < opt.start) {
          return false;
        }
        if (opt.selectBackward && time > opt.start) {
          return false;
        }

        //check disabled days
        if (opt.beforeShowDay && typeof opt.beforeShowDay == 'function') {
          var valid = true;
          var timeTmp = time;
          while (countDays(timeTmp, opt.start) > 1) {
            var arr = opt.beforeShowDay(new Date(timeTmp));
            if (!arr[0]) {
              valid = false;
              break;
            }
            if (Math.abs(timeTmp - opt.start) < 86400000) {
              break;
            }
            if (timeTmp > opt.start) {
              timeTmp -= 86400000;
            }
            if (timeTmp < opt.start) {
              timeTmp += 86400000;
            }
          }
          if (!valid) {
            return false;
          }
        }
      }
      return true;
    }

    function updateSelectableRange() {
      box.find('.day.invalid.tmp').removeClass('tmp invalid').addClass('valid');
      if (opt.start && !opt.end) {
        box.find('.day.toMonth.valid').each(function () {
          var time = parseInt($(this).attr('time'), 10);
          if (!isValidTime(time)) {
            $(this).addClass('invalid tmp').removeClass('valid');
          } else {
            $(this).addClass('valid tmp').removeClass('invalid');
          }
        });
      }

      return true;
    }

    function dayHovering(day) {
      var hoverTime = parseInt(day.attr('time'));
      var tooltip = '';

      if (day.hasClass('has-tooltip') && day.attr('data-tooltip')) {
        tooltip = '<span class="tooltip-content">' + day.attr('data-tooltip') + '</span>';
      } else if (!day.hasClass('invalid')) {
        if (opt.singleDate) {
          box.find('.day.hovering').removeClass('hovering');
          day.addClass('hovering');
        } else {
          box.find('.day').each(function () {
            var time = parseInt($(this).attr('time')),
                start = opt.start,
                end = opt.end;

            if (time == hoverTime) {
              $(this).addClass('hovering');
            } else {
              $(this).removeClass('hovering');
            }

            if (
                (opt.start && !opt.end) &&
                (
                    (opt.start < time && hoverTime >= time) ||
                    (opt.start > time && hoverTime <= time)
                )
            ) {
              $(this).addClass('hovering');
            } else {
              $(this).removeClass('hovering');
            }
          });

          if (opt.start && !opt.end) {
            var days = countDays(hoverTime, opt.start);
            if (opt.hoveringTooltip) {
              if (typeof opt.hoveringTooltip == 'function') {
                tooltip = opt.hoveringTooltip(days, opt.start, hoverTime);
              } else if (opt.hoveringTooltip === true && days > 1) {
                tooltip = days + ' ' + translate('days');
              }
            }
          }
        }
      }

      if (tooltip) {
        var posDay = day.offset();
        var posBox = box.offset();

        var _left = posDay.left - posBox.left;
        var _top = posDay.top - posBox.top;
        _left += day.width() / 2;

        var $tip = box.find('.date-range-length-tip');
        var w = $tip.css({
          'visibility': 'hidden',
          'display': 'none'
        }).html(tooltip).width();
        var h = $tip.height();
        _left -= w / 2;
        _top -= h;
        setTimeout(function () {
          $tip.css({
            left: _left,
            top: _top,
            display: 'block',
            'visibility': 'visible'
          });
        }, 10);
      }
    }

    function clearHovering() {
      box.find('.day.hovering').removeClass('hovering');
    }

    function dateChanged(date) {
      var value = date.val();
      var name = date.attr('name');
      var type = date.parents('table').hasClass('month1') ? 'month1' : 'month2';
      var oppositeType = type === 'month1' ? 'month2' : 'month1';
      var startDate = opt.startDate ? moment(opt.startDate) : false;
      var endDate = opt.endDate ? moment(opt.endDate) : false;
      var newDate = moment(opt[type])[name](value);

      if (startDate && newDate.isSameOrBefore(startDate)) {
        newDate = startDate.add(type === 'month2' ? 1 : 0, 'month');
      }

      if (endDate && newDate.isSameOrAfter(endDate)) {
        newDate = endDate.add(!opt.singleMonth && type === 'month1' ? -1 : 0, 'month');
      }

      showMonth(newDate, type);

      if (type === 'month1') {
        if (opt.stickyMonths || moment(newDate).isSameOrAfter(opt[oppositeType], 'month')) {
          showMonth(moment(newDate).add(1, 'month'), oppositeType);
        }
      } else {
        if (opt.stickyMonths || moment(newDate).isSameOrBefore(opt[oppositeType], 'month')) {
          showMonth(moment(newDate).add(-1, 'month'), oppositeType);
        }
      }

      showGap();
    }

    function autoclose() {
      if (opt.singleDate === true) {
        if (initiated && opt.start) {
          if (opt.autoClose) {
            closeDatePicker();
          }
        }
      } else {
        if (initiated && opt.start && opt.end) {
          if (opt.autoClose) {
            closeDatePicker();
          }
        }
      }
    }

    function checkSelectionValid() {
      var days = Math.ceil((opt.end - opt.start) / 86400000) + 1;
      if (opt.singleDate) { // Validate if only start is there
        if (opt.start && !opt.end) {
          box.find('.drp_top-bar').removeClass('error').addClass('normal');
        } else {
          box.find('.drp_top-bar').removeClass('error').removeClass('normal');
        }
      } else if (opt.maxDays && days > opt.maxDays) {
        opt.start = false;
        opt.end = false;
        box.find('.day').removeClass('checked');
        box.find('.drp_top-bar').removeClass('normal').addClass('error').find('.error-top').html(
            translate('less-than').replace('%d', opt.maxDays));
      } else if (opt.minDays && days < opt.minDays) {
        opt.start = false;
        opt.end = false;
        box.find('.day').removeClass('checked');
        box.find('.drp_top-bar').removeClass('normal').addClass('error').find('.error-top').html(
            translate('more-than').replace('%d', opt.minDays));
      } else {
        if (opt.start || opt.end) {
          box.find('.drp_top-bar').removeClass('error').addClass('normal');
        } else {
          box.find('.drp_top-bar').removeClass('error').removeClass('normal');
        }
      }

      if ((opt.singleDate && opt.start && !opt.end) || (!opt.singleDate && opt.start && opt.end)) {
        box.find('.apply-btn').removeClass('disabled');
      } else {
        box.find('.apply-btn').addClass('disabled');
      }

      if (opt.batchMode) {
        if (
            (opt.start && opt.startDate && compare_day(opt.start, opt.startDate) < 0) ||
            (opt.end && opt.endDate && compare_day(opt.end, opt.endDate) > 0)
        ) {
          opt.start = false;
          opt.end = false;
          box.find('.day').removeClass('checked');
        }
      }
    }

    function showSelectedInfo(forceValid, silent) {
      box.find('.start-day').html('...');
      box.find('.end-day').html('...');
      box.find('.selected-days').hide();
      if (opt.start) {
        box.find('.start-day').html(getDateString(new Date(parseInt(opt.start))));
      }
      if (opt.end) {
        box.find('.end-day').html(getDateString(new Date(parseInt(opt.end))));
      }
      var dateRange;
      if (opt.start && opt.singleDate) {
        box.find('.apply-btn').removeClass('disabled');
        if (opt.time.enabled) {
          dateRange = moment(new Date(opt.start)).format("YYYY.MM.DD ") + box.find('.time1 .hour select').val().replace(/^(\d{1})$/, '0$1')
              + ":" + box.find('.time1 .minute select').val().replace(/^(\d{1})$/, '0$1');
        } else {
          dateRange = getDateString(new Date(opt.start));
        }

        opt.setValue.call(selfDom, dateRange, getDateString(new Date(opt.start)), getDateString(new Date(opt.end)));

        if (initiated && !silent) {
          $(self).trigger('datepicker-change', {
            'value': dateRange,
            'date1': new Date(opt.start)
          });
        }
      } else if (opt.start && opt.end) {
        box.find('.selected-days').show().find('.selected-days-num').html(countDays(opt.end, opt.start));
        box.find('.apply-btn').removeClass('disabled');
        dateRange = getDateString(new Date(opt.start)) + opt.separator + getDateString(new Date(opt.end));
        opt.setValue.call(selfDom, dateRange, getDateString(new Date(opt.start)), getDateString(new Date(opt.end)));
        if (initiated && !silent) {
          $(self).trigger('datepicker-change', {
            'value': dateRange,
            'date1': new Date(opt.start),
            'date2': new Date(opt.end)
          });
        }
      } else if (forceValid) {
        box.find('.apply-btn').removeClass('disabled');
      } else {
        box.find('.apply-btn').addClass('disabled');
      }
    }

    function countDays(start, end) {
      return Math.abs(daysFrom1970(start) - daysFrom1970(end)) + 1;
    }

    function setDateRange(date1, date2, silent) {
      if (date1.getTime() > date2.getTime()) {
        var tmp = date2;
        date2 = date1;
        date1 = tmp;
        tmp = null;
      }
      var valid = true;
      if (opt.startDate && compare_day(date1, opt.startDate) < 0) {
        valid = false;
      }
      if (opt.endDate && compare_day(date2, opt.endDate) > 0) {
        valid = false;
      }
      if (!valid) {
        showMonth(opt.startDate, 'month1');
        showMonth(nextMonth(opt.startDate), 'month2');
        showGap();
        return;
      }

      opt.start = date1.getTime();
      opt.end = date2.getTime();

      if (opt.time.enabled) {
        renderTime('time1', date1);
        renderTime('time2', date2);
      }

      if (opt.stickyMonths || (compare_day(date1, date2) > 0 && compare_month(date1, date2) === 0)) {
        if (opt.lookBehind) {
          date1 = prevMonth(date2);
        } else {
          date2 = nextMonth(date1);
        }
      }

      if (opt.stickyMonths && opt.endDate !== false && compare_month(date2, opt.endDate) > 0) {
        date1 = prevMonth(date1);
        date2 = prevMonth(date2);
      }

      if (!opt.stickyMonths) {
        if (compare_month(date1, date2) === 0) {
          if (opt.lookBehind) {
            date1 = prevMonth(date2);
          } else {
            date2 = nextMonth(date1);
          }
        }
      }

      showMonth(date1, 'month1');
      showMonth(date2, 'month2');
      showGap();
      checkSelectionValid();
      showSelectedInfo(false, silent);
      autoclose();
    }

    function setSingleDate(date1) {

      var valid = true;
      if (opt.startDate && compare_day(date1, opt.startDate) < 0) {
        valid = false;
      }
      if (opt.endDate && compare_day(date1, opt.endDate) > 0) {
        valid = false;
      }
      if (!valid) {
        showMonth(opt.startDate, 'month1');
        return;
      }

      opt.start = date1.getTime();

      if (opt.time.enabled) {
        renderTime('time1', date1);

      }
      showMonth(date1, 'month1');
      if (opt.singleMonth !== true) {
        var date2 = nextMonth(date1);
        showMonth(date2, 'month2');
      }
      showGap();
      showSelectedInfo();
      autoclose();
    }

    function showSelectedDays() {
      if (!opt.start && !opt.end) {
        return;
      }
      box.find('.day').each(function () {
        var time = parseInt($(this).attr('time')),
            start = opt.start,
            end = opt.end;
        if (opt.time.enabled) {
          time = moment(time).startOf('day').valueOf();
          start = moment(start || moment().valueOf()).startOf('day').valueOf();
          end = moment(end || moment().valueOf()).startOf('day').valueOf();
        }
        if (
            (opt.start && opt.end && end >= time && start <= time) ||
            (opt.start && !opt.end && moment(start).format('YYYY.MM.DD') == moment(time).format('YYYY.MM.DD'))
        ) {
          $(this).addClass('checked');
        } else {
          $(this).removeClass('checked');
        }

        //add first-date-selected class name to the first date selected
        if (opt.start && moment(start).format('YYYY.MM.DD') == moment(time).format('YYYY.MM.DD')) {
          $(this).addClass('first-date-selected');
        } else {
          $(this).removeClass('first-date-selected');
        }
        //add last-date-selected
        if (opt.end && moment(end).format('YYYY.MM.DD') == moment(time).format('YYYY.MM.DD')) {
          $(this).addClass('last-date-selected');
        } else {
          $(this).removeClass('last-date-selected');
        }
      });

      box.find('.week-number').each(function () {
        if ($(this).attr('data-start-time') == opt.startWeek) {
          $(this).addClass('week-number-selected');
        }
      });
    }

    function showMonth(date, month) {
      date = moment(date).toDate();
      var monthElement = generateMonthElement(date, month);
      var yearElement = generateYearElement(date, month);

      box.find('.' + month + ' .month-name').html(yearElement + '<span class="dot"></span>' + monthElement);
      box.find('.' + month + ' tbody').html(createMonthHTML(date));
      opt[month] = date;
      updateSelectableRange();
      bindEvents();
    }

    function generateMonthElement(date, month) {
      var range;
      var startDate = opt.startDate ? moment(opt.startDate).add(!opt.singleMonth && month === 'month2' ? 1 : 0, 'month') : false;
      var endDate = opt.endDate ? moment(opt.endDate).add(!opt.singleMonth && month === 'month1' ? -1 : 0, 'month') : false;
      date = moment(date);

      if (!opt.monthSelect ||
          startDate && endDate && startDate.isSame(endDate, 'month')) {
        return '<div class="month-element">' + nameMonth(date.get('month')) + '</div>';
      }

      range = [
        startDate && date.isSame(startDate, 'year') ? startDate.get('month') : 0,
        endDate && date.isSame(endDate, 'year') ? endDate.get('month') : 11
      ];

      if (range[0] === range[1]) {
        return '<div class="month-element">' + nameMonth(date.get('month')) + '</div>';
      }

      return generateSelect(
          'month',
          generateSelectData(
              range,
              date.get('month'),
              function (value) {
                return nameMonth(value);
              }
          )
      );
    }

    function generateYearElement(date, month) {
      date = moment(date);
      var startDate = opt.startDate ? moment(opt.startDate).add(!opt.singleMonth && month === 'month2' ? 1 : 0, 'month') : false;
      var endDate = opt.endDate ? moment(opt.endDate).add(!opt.singleMonth && month === 'month1' ? -1 : 0, 'month') : false;
      var fullYear = date.get('year');
      var isYearFunction = opt.yearSelect && typeof opt.yearSelect === 'function';
      var range;

      if (!opt.yearSelect ||
          startDate && endDate && startDate.isSame(moment(endDate), 'year')) {
        return '<div class="month-element">' + fullYear + '</div>';
      }

      range = isYearFunction ? opt.yearSelect(fullYear) : opt.yearSelect.slice();

      range = [
        startDate ? Math.max(range[0], startDate.get('year')) : Math.min(range[0], fullYear),
        endDate ? Math.min(range[1], endDate.get('year')) : Math.max(range[1], fullYear)
      ];

      return generateSelect('year', generateSelectData(range, fullYear));
    }

    function generateSelectData(range, current, valueBeautifier) {
      var data = [];
      valueBeautifier = valueBeautifier || function (value) {
        return value;
      };

      for (var i = range[0]; i <= range[1]; i++) {
        data.push({
          value: i,
          text: valueBeautifier(i),
          isCurrent: i === current
        });
      }

      return data;
    }

    function generateSelect(name, data) {
      var select = '<div class="select-wrapper"><select class="' + name + '" name="' + name + '">';
      var current;

      for (var i = 0, l = data.length; i < l; i++) {
        select += '<option value="' + data[i].value + '"' + (data[i].isCurrent ? ' selected' : '') + '>';
        select += data[i].text;
        select += '</option>';

        if (data[i].isCurrent) {
          current = data[i].text;
        }
      }

      select += '</select>' + current + '</div>';

      return select;
    }

    function bindEvents() {
      box.find('.day').unbind("click").click(function (evt) {
        dayClicked($(this));
      });

      box.find('.day').unbind("mouseenter").mouseenter(function (evt) {
        dayHovering($(this));
      });

      box.find('.day').unbind("mouseleave").mouseleave(function (evt) {
        if (opt.singleDate) {
          clearHovering();
        }
      });

      box.find('.week-number').unbind("click").click(function (evt) {
        weekNumberClicked($(this));
      });

      box.find('.month').unbind("change").change(function (evt) {
        dateChanged($(this));
      });

      box.find('.year').unbind("change").change(function (evt) {
        dateChanged($(this));
      });
    }

    function showTime(date, name) {
      box.find('.' + name).append(getTimeHTML());
      renderTime(name, date);
    }

    function nameMonth(m) {
      return translate('month-name')[m];
    }

    function getDateString(d) {
      return moment(d).format(opt.format);
    }

    function showGap() {
      showSelectedDays();
      var m1 = parseInt(moment(opt.month1).format('YYYYMM'));
      var m2 = parseInt(moment(opt.month2).format('YYYYMM'));
      var p = Math.abs(m1 - m2);
      var shouldShow = (p > 1 && p != 89);
      if (shouldShow) {
        box.addClass('has-gap').removeClass('no-gap').find('.gap').css('visibility', 'visible');
      } else {
        box.removeClass('has-gap').addClass('no-gap').find('.gap').css('visibility', 'hidden');
      }
      var h1 = box.find('table.month1').height();
      var h2 = box.find('table.month2').height();
      box.find('.gap').height(Math.max(h1, h2) + 10);
    }

    function closeDatePicker() {
      if (opt.alwaysOpen) {
        return;
      }

      var afterAnim = function () {
        $(self).data('date-picker-opened', false);
        $(self).trigger('datepicker-closed', {
          relatedTarget: box
        });
      };
      if (opt.customCloseAnimation) {
        opt.customCloseAnimation.call(box.get(0), afterAnim);
      } else {
        $(box).slideUp(opt.duration, afterAnim);
      }
      $(self).trigger('datepicker-close', {
        relatedTarget: box
      });
    }

    function redrawDatePicker() {
      showMonth(opt.month1, 'month1');
      showMonth(opt.month2, 'month2');
    }

    function compare_month(m1, m2) {
      var p = parseInt(moment(m1).format('YYYYMM')) - parseInt(moment(m2).format('YYYYMM'));
      if (p > 0) {
        return 1;
      }
      if (p === 0) {
        return 0;
      }
      return -1;
    }

    function compare_day(m1, m2) {
      var p = parseInt(moment(m1).format('YYYYMMDD')) - parseInt(moment(m2).format('YYYYMMDD'));
      if (p > 0) {
        return 1;
      }
      if (p === 0) {
        return 0;
      }
      return -1;
    }

    function nextMonth(month) {
      return moment(month).add(1, 'months').toDate();
    }

    function prevMonth(month) {
      return moment(month).add(-1, 'months').toDate();
    }

    function getTimeHTML() {
      /*
      return '<div>' +
      '<span class="total-time">' + translate('Time') + '<span class="hour-val">00</span>시 <span class="minute-val">00</span>분</span>' +
      '</div>' +
      '<div class="hour">' +
      '<label>' + translate('Hour') + ': <input type="range" class="hour-range" name="hour" min="0" max="23"></label>' +
      '</div>' +
      '<div class="minute">' +
      '<label>' + translate('Minute') + ': <input type="range" class="minute-range" name="minute" min="0" max="59"></label>' +
      '</div>';
      */
      return '<div>' +
          '<span class="total-time">' + translate('Time') + '<span class="hour-val">00</span>시 <span class="minute-val">00</span>분</span>' +
          '</div>' +
          '<div class="time-choices">' +
          '<span class="hour" >' +
          '<select name="hour">' +
          '<option >01</option><option >02</option><option >03</option><option >04</option><option >05</option><option >06</option><option >07</option><option >08</option><option >09</option><option >10</option><option >11</option><option >12</option><option >13</option><option >14</option><option >15</option><option >16</option><option >17</option><option >18</option><option >19</option><option >20</option><option >21</option><option >22</option><option >23</option><option >24</option>'
          +
          '</select>' +
          '</span>' +
          '<span class="minute" >' +
          '<select name="minute">' +
          '<option >00</option>' +
          '<option >30</option>' +
          '</select>' +
          '</span>' +
          '</div>';
    }

    function createDom() {
      var html = '<div class="awa-datepicker';
      if (opt.extraClass) {
        html += ' ' + opt.extraClass + ' ';
      }
      if (opt.singleDate) {
        html += ' single-date ';
      }
      if (!opt.showShortcuts) {
        html += ' no-shortcuts ';
      }
      if (!opt.showTopbar) {
        html += ' no-topbar ';
      }
      if (opt.customHtml) {
        html += ' custom-topbar ';
      }
      html += '">';

      var _colspan = opt.showWeekNumbers ? 6 : 5;

      var arrowPrev = '&lt;';
      if (opt.customArrowPrevSymbol) {
        arrowPrev = opt.customArrowPrevSymbol;
      }

      var arrowNext = '&gt;';
      if (opt.customArrowNextSymbol) {
        arrowNext = opt.customArrowNextSymbol;
      }

      html += '<div class="month-wrapper">' +
          '<div class="month-item first">' +
          '   <table class="month1" cellspacing="0" border="0" cellpadding="0">' +
          '       <thead>' +
          '           <tr class="caption">' +
          '               <th class="">' +
          '                   <span class="prev">' +
          arrowPrev +
          '                   </span>' +
          '               </th>' +
          '               <th colspan="' + _colspan + '" class="month-name">' +
          '               </th>' +
          '               <th class=>' +
          (!opt.stickyMonths ? '<span class="next">' + arrowNext + '</span>' : '') +
          // (opt.singleDate || !opt.stickyMonths ? '<span class="next">' + arrowNext + '</span>' : '') +
          '               </th>' +
          '           </tr>' +
          '           <tr class="week-name">' + getWeekHead() +
          '       </thead>' +
          '       <tbody></tbody>' +
          '   </table>' +
          '</div>';

      if (hasMonth2()) {
        html += '<div class="month-item second">' +
            '<table class="month2" cellspacing="0" border="0" cellpadding="0">' +
            '   <thead>' +
            '   <tr class="caption">' +
            '       <th>' +
            (!opt.stickyMonths ? '<span class="prev">' + arrowPrev + '</span>' : '') +
            '       </th>' +
            '       <th colspan="' + _colspan + '" class="month-name">' +
            '       </th>' +
            '       <th>' +
            '           <span class="next">' + arrowNext + '</span>' +
            '       </th>' +
            '   </tr>' +
            '   <tr class="week-name">' + getWeekHead() +
            '   </thead>' +
            '   <tbody></tbody>' +
            '   </table>' +
            '</div>';

      }

      //+'</div>'
      html += '<div class="dp-clearfix"></div>';
      if (opt.time.enabled) {
        html += '<div class="time">';
        html += '<div class="time1"></div>';
        if (!opt.singleDate) {
          html += '<div class="time2"></div>';
        }
        html += '</div>';
        html += '<div class="dp-clearfix"></div>';
      }
      html += '</div>';
      /*
      //+'</div>'
      html += '<div class="dp-clearfix"></div>' +
          '<div class="time">' +
          '<div class="time1"></div>';
      if (!opt.singleDate) {
          html += '<div class="time2"></div>';
      }
      html += '</div>' +
          '<div class="dp-clearfix"></div>' +
          '</div>';
          */

      if (opt.showTopbar) {
        html += '<div class="drp_top-bar">';

        if (opt.customHtml) {
          if (typeof opt.customHtml == 'function') {
            opt.customHtml = opt.customHtml();
          }
          html += '<div class="custom-top">' + opt.customHtml + '</div>';
        } else {
          html += '<div class="normal-top" style="display:none;">' +
              '<span class="selection-top" style="display:none;">' + translate('selected') + ' </span> <b class="start-day">...</b>';
          if (!opt.singleDate) {
            html += ' <span class="separator-day">' + opt.separator
                + '</span> <b class="end-day">...</b> <i class="selected-days">(<span class="selected-days-num">3</span> ' + translate(
                    'days') + ')</i>';
          }
          html += '</div>';
          html += '<div class="error-top" style="display:none;">error</div>' +
              '<div class="default-top" style="display:none;">default</div>';
        }

        html += '<input type="button"  style="display:none;" class="apply-btn disabled' + getApplyBtnClass() + '" value="' + translate(
            'apply') + '" />';
        html += '</div>';
      }

      html += '<div class="footer">';
      if (opt.showShortcuts) {
        html += '<div class="shortcuts"><b>' + translate('shortcuts') + '</b>';

        var data = opt.shortcuts;
        if (data) {
          var name;
          if (data['prev-days'] && data['prev-days'].length > 0) {
            html += '&nbsp;<span class="prev-days">' + translate('past');
            for (var i = 0; i < data['prev-days'].length; i++) {
              name = data['prev-days'][i];
              name += (data['prev-days'][i] > 1) ? translate('days') : translate('day');
              html += ' <a href="javascript:;" shortcut="day,-' + data['prev-days'][i] + '">' + name + '</a>';
            }
            html += '</span>';
          }

          if (data['next-days'] && data['next-days'].length > 0) {
            html += '&nbsp;<span class="next-days">' + translate('following');
            for (var i = 0; i < data['next-days'].length; i++) {
              name = data['next-days'][i];
              name += (data['next-days'][i] > 1) ? translate('days') : translate('day');
              html += ' <a href="javascript:;" shortcut="day,' + data['next-days'][i] + '">' + name + '</a>';
            }
            html += '</span>';
          }

          if (data.prev && data.prev.length > 0) {
            html += '&nbsp;<span class="prev-buttons">' + translate('previous');
            for (var i = 0; i < data.prev.length; i++) {
              name = translate('prev-' + data.prev[i]);
              html += ' <a href="javascript:;" shortcut="prev,' + data.prev[i] + '">' + name + '</a>';
            }
            html += '</span>';
          }

          if (data.next && data.next.length > 0) {
            html += '&nbsp;<span class="next-buttons">' + translate('next');
            for (var i = 0; i < data.next.length; i++) {
              name = translate('next-' + data.next[i]);
              html += ' <a href="javascript:;" shortcut="next,' + data.next[i] + '">' + name + '</a>';
            }
            html += '</span>';
          }
        }

        if (opt.customShortcuts) {
          for (var i = 0; i < opt.customShortcuts.length; i++) {
            var sh = opt.customShortcuts[i];
            html += '&nbsp;<span class="custom-shortcut"><a href="javascript:;" shortcut="custom">' + sh.name + '</a></span>';
          }
        }
        html += '</div>';
      }

      // Add Custom Values Dom
      if (opt.showCustomValues) {
        html += '<div class="customValues"><b>' + (opt.customValueLabel || translate('custom-values')) + '</b>';

        if (opt.customValues) {
          for (var i = 0; i < opt.customValues.length; i++) {
            var val = opt.customValues[i];
            html += '&nbsp;<span class="custom-value"><a href="javascript:;" custom="' + val.value + '">' + val.name + '</a></span>';
          }
        }
      }

      html += '</div></div>';

      return $(html);
    }

    function getApplyBtnClass() {
      var klass = '';
      if (opt.autoClose === true) {
        klass += ' hide';
      }
      if (opt.applyBtnClass !== '') {
        klass += ' ' + opt.applyBtnClass;
      }
      return klass;
    }

    function getWeekHead() {
      var prepend = opt.showWeekNumbers ? '<th>' + translate('week-number') + '</th>' : '';
      if (opt.startOfWeek == 'monday') {
        return prepend + '<th>' + translate('week-1') + '</th>' +
            '<th>' + translate('week-2') + '</th>' +
            '<th>' + translate('week-3') + '</th>' +
            '<th>' + translate('week-4') + '</th>' +
            '<th>' + translate('week-5') + '</th>' +
            '<th>' + translate('week-6') + '</th>' +
            '<th>' + translate('week-7') + '</th>';
      } else {
        return prepend + '<th>' + translate('week-7') + '</th>' +
            '<th>' + translate('week-1') + '</th>' +
            '<th>' + translate('week-2') + '</th>' +
            '<th>' + translate('week-3') + '</th>' +
            '<th>' + translate('week-4') + '</th>' +
            '<th>' + translate('week-5') + '</th>' +
            '<th>' + translate('week-6') + '</th>';
      }
    }

    function isMonthOutOfBounds(month) {
      month = moment(month);
      if (opt.startDate && month.endOf('month').isBefore(opt.startDate)) {
        return true;
      }
      if (opt.endDate && month.startOf('month').isAfter(opt.endDate)) {
        return true;
      }
      return false;
    }

    function getGapHTML() {
      var html = ['<div class="gap-top-mask"></div><div class="gap-bottom-mask"></div><div class="gap-lines">'];
      for (var i = 0; i < 20; i++) {
        html.push('<div class="gap-line">' +
            '<div class="gap-1"></div>' +
            '<div class="gap-2"></div>' +
            '<div class="gap-3"></div>' +
            '</div>');
      }
      html.push('</div>');
      return html.join('');
    }

    function hasMonth2() {
      return (!opt.singleMonth);
    }

    function attributesCallbacks(initialObject, callbacksArray, today) {
      var resultObject = $.extend(true, {}, initialObject);

      $.each(callbacksArray, function (cbAttrIndex, cbAttr) {
        var addAttributes = cbAttr(today);
        for (var attr in addAttributes) {
          if (resultObject.hasOwnProperty(attr)) {
            resultObject[attr] += addAttributes[attr];
          } else {
            resultObject[attr] = addAttributes[attr];
          }
        }
      });

      var attrString = '';

      for (var attr in resultObject) {
        if (resultObject.hasOwnProperty(attr)) {
          attrString += attr + '="' + resultObject[attr] + '" ';
        }
      }

      return attrString;
    }

    function daysFrom1970(t) {
      return Math.floor(toLocalTimestamp(t) / 86400000);
    }

    function toLocalTimestamp(t) {
      if (moment.isMoment(t)) {
        t = t.toDate().getTime();
      }
      if (typeof t == 'object' && t.getTime) {
        t = t.getTime();
      }
      if (typeof t == 'string' && !t.match(/\d{13}/)) {
        t = moment(t, opt.format).toDate().getTime();
      }
      t = parseInt(t, 10) - new Date().getTimezoneOffset() * 60 * 1000;
      return t;
    }

    function createMonthHTML(d) {
      var days = [];
      d.setDate(1);
      var lastMonth = new Date(d.getTime() - 86400000);
      var now = new Date();

      var dayOfWeek = d.getDay();
      if ((dayOfWeek === 0) && (opt.startOfWeek === 'monday')) {
        // add one week
        dayOfWeek = 7;
      }
      var today, valid;

      if (dayOfWeek > 0) {
        for (var i = dayOfWeek; i > 0; i--) {
          var day = new Date(d.getTime() - 86400000 * i);
          valid = isValidTime(day.getTime());
          if (opt.startDate && compare_day(day, opt.startDate) < 0) {
            valid = false;
          }
          if (opt.endDate && compare_day(day, opt.endDate) > 0) {
            valid = false;
          }
          days.push({
            date: day,
            type: 'lastMonth',
            day: day.getDate(),
            time: day.getTime(),
            valid: valid
          });
        }
      }
      var toMonth = d.getMonth();
      for (var i = 0; i < 40; i++) {
        today = moment(d).add(i, 'days').toDate();
        valid = isValidTime(today.getTime());
        if (opt.startDate && compare_day(today, opt.startDate) < 0) {
          valid = false;
        }
        if (opt.endDate && compare_day(today, opt.endDate) > 0) {
          valid = false;
        }
        days.push({
          date: today,
          type: today.getMonth() == toMonth ? 'toMonth' : 'nextMonth',
          day: today.getDate(),
          time: today.getTime(),
          valid: valid
        });
      }
      var html = [];
      for (var week = 0; week < 6; week++) {
        if (days[week * 7].type == 'nextMonth') {
          break;
        }
        html.push('<tr>');

        for (var day = 0; day < 7; day++) {
          var _day = (opt.startOfWeek == 'monday') ? day + 1 : day;
          today = days[week * 7 + _day];
          var highlightToday = moment(today.time).format('L') == moment(now).format('L');
          today.extraClass = '';
          today.tooltip = '';
          if (today.valid && opt.beforeShowDay && typeof opt.beforeShowDay == 'function') {
            var _r = opt.beforeShowDay(moment(today.time).toDate());
            today.valid = _r[0];
            today.extraClass = _r[1] || '';
            today.tooltip = _r[2] || '';
            if (today.tooltip !== '') {
              today.extraClass += ' has-tooltip ';
            }
          }

          var todayDivAttr = {
            time: today.time,
            'data-tooltip': today.tooltip,
            'class': 'day ' + today.type + ' ' + today.extraClass + ' ' + (today.valid ? 'valid' : 'invalid') + ' ' + (highlightToday
                ? 'real-today' : '')
          };

          if (day === 0 && opt.showWeekNumbers) {
            html.push('<td><div class="week-number" data-start-time="' + today.time + '">' + opt.getWeekNumber(today.date) + '</div></td>');
          }

          html.push('<td ' + attributesCallbacks({}, opt.dayTdAttrs, today) + '><div ' + attributesCallbacks(todayDivAttr, opt.dayDivAttrs,
              today) + '>' + showDayHTML(today.time, today.day) + '</div></td>');
        }
        html.push('</tr>');
      }
      return html.join('');
    }

    function showDayHTML(time, date) {
      if (opt.showDateFilter && typeof opt.showDateFilter == 'function') {
        return opt.showDateFilter(time, date);
      }
      return date;
    }

    function getLanguages() {
      if (opt.language == 'auto') {
        var language = navigator.language ? navigator.language : navigator.browserLanguage;
        if (!language) {
          return $.allwinDatepickerLanguages['default'];
        }
        language = language.toLowerCase();
        if (language in $.allwinDatepickerLanguages) {
          return $.allwinDatepickerLanguages[language];
        }

        return $.allwinDatepickerLanguages['default'];
      } else if (opt.language && opt.language in $.allwinDatepickerLanguages) {
        return $.allwinDatepickerLanguages[opt.language];
      } else {
        return $.allwinDatepickerLanguages['default'];
      }
    }

    /**
     * Translate language string, try both the provided translation key, as the lower case version
     */
    function translate(translationKey) {
      var translationKeyLowerCase = translationKey.toLowerCase();
      var result = (translationKey in languages) ? languages[translationKey] : (translationKeyLowerCase in languages)
          ? languages[translationKeyLowerCase] : null;
      var defaultLanguage = $.allwinDatepickerLanguages['default'];
      if (result == null) {
        result = (translationKey in defaultLanguage) ? defaultLanguage[translationKey] : (translationKeyLowerCase
            in defaultLanguage) ? defaultLanguage[translationKeyLowerCase] : '';
      }

      return result;
    }

    function getDefaultTime() {
      var defaultTime = opt.defaultTime ? opt.defaultTime : new Date();

      if (opt.lookBehind) {
        if (opt.startDate && compare_month(defaultTime, opt.startDate) < 0) {
          defaultTime = nextMonth(moment(opt.startDate).toDate());
        }
        if (opt.endDate && compare_month(defaultTime, opt.endDate) > 0) {
          defaultTime = moment(opt.endDate).toDate();
        }
      } else {
        if (opt.startDate && compare_month(defaultTime, opt.startDate) < 0) {
          defaultTime = moment(opt.startDate).toDate();
        }
        if (opt.endDate && compare_month(nextMonth(defaultTime), opt.endDate) > 0) {
          defaultTime = prevMonth(moment(opt.endDate).toDate());
        }
      }

      if (opt.singleDate) {
        if (opt.startDate && compare_month(defaultTime, opt.startDate) < 0) {
          defaultTime = moment(opt.startDate).toDate();
        }
        if (opt.endDate && compare_month(defaultTime, opt.endDate) > 0) {
          defaultTime = moment(opt.endDate).toDate();
        }
      }

      return defaultTime;
    }

    function resetMonthsView(time) {
      if (!time) {
        time = getDefaultTime();
      }

      if (opt.lookBehind) {
        showMonth(prevMonth(time), 'month1');
        showMonth(time, 'month2');
      } else {
        showMonth(time, 'month1');
        showMonth(nextMonth(time), 'month2');
      }

      if (opt.singleDate) {
        showMonth(time, 'month1');
      }

      showSelectedDays();
      showGap();
    }

  };
}));


/*
 * The MIT License
 *
 * Copyright (c) 2012 James Allardice
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

(function (global) {

  'use strict';

  //
  // Test for support. We do this as early as possible to optimise for browsers
  // that have native support for the attribute.
  //

  var test = document.createElement('input');
  var nativeSupport = test.placeholder !== void 0;

  global.Placeholders = {
    nativeSupport: nativeSupport,
    disable: nativeSupport ? noop : disablePlaceholders,
    enable: nativeSupport ? noop : enablePlaceholders
  };

  if (nativeSupport) {
    return;
  }

  //
  // If we reach this point then the browser does not have native support for
  // the attribute.
  //

  // The list of input element types that support the placeholder attribute.
  var validTypes = [
    'text',
    'search',
    'url',
    'tel',
    'email',
    'password',
    'number',
    'textarea'
  ];

  // The list of keycodes that are not allowed when the polyfill is configured
  // to hide-on-input.
  var badKeys = [

    // The following keys all cause the caret to jump to the end of the input
    // value.

    27, // Escape
    33, // Page up
    34, // Page down
    35, // End
    36, // Home

    // Arrow keys allow you to move the caret manually, which should be
    // prevented when the placeholder is visible.

    37, // Left
    38, // Up
    39, // Right
    40, // Down

    // The following keys allow you to modify the placeholder text by removing
    // characters, which should be prevented when the placeholder is visible.

    8, // Backspace
    46 // Delete
  ];

  // Styling variables.
  var placeholderStyleColor = '#ccc';
  var placeholderClassName = 'placeholdersjs';
  var classNameRegExp = new RegExp('(?:^|\\s)' + placeholderClassName + '(?!\\S)');

  // The various data-* attributes used by the polyfill.
  var ATTR_CURRENT_VAL = 'data-placeholder-value';
  var ATTR_ACTIVE = 'data-placeholder-active';
  var ATTR_INPUT_TYPE = 'data-placeholder-type';
  var ATTR_FORM_HANDLED = 'data-placeholder-submit';
  var ATTR_EVENTS_BOUND = 'data-placeholder-bound';
  var ATTR_OPTION_FOCUS = 'data-placeholder-focus';
  var ATTR_OPTION_LIVE = 'data-placeholder-live';
  var ATTR_MAXLENGTH = 'data-placeholder-maxlength';

  // Various other variables used throughout the rest of the script.
  var UPDATE_INTERVAL = 100;
  var head = document.getElementsByTagName('head')[0];
  var root = document.documentElement;
  var Placeholders = global.Placeholders;
  var keydownVal;

  // Get references to all the input and textarea elements currently in the DOM
  // (live NodeList objects to we only need to do this once).
  var inputs = document.getElementsByTagName('input');
  var textareas = document.getElementsByTagName('textarea');

  // Get any settings declared as data-* attributes on the root element.
  // Currently the only options are whether to hide the placeholder on focus
  // or input and whether to auto-update.
  var hideOnInput = root.getAttribute(ATTR_OPTION_FOCUS) === 'false';
  var liveUpdates = root.getAttribute(ATTR_OPTION_LIVE) !== 'false';

  // Create style element for placeholder styles (instead of directly setting
  // style properties on elements - allows for better flexibility alongside
  // user-defined styles).
  var styleElem = document.createElement('style');
  styleElem.type = 'text/css';

  // Create style rules as text node.
  var styleRules = document.createTextNode(
      '.' + placeholderClassName + ' {' +
      'color:' + placeholderStyleColor + ';' +
      '}'
  );

  // Append style rules to newly created stylesheet.
  if (styleElem.styleSheet) {
    styleElem.styleSheet.cssText = styleRules.nodeValue;
  } else {
    styleElem.appendChild(styleRules);
  }

  // Prepend new style element to the head (before any existing stylesheets,
  // so user-defined rules take precedence).
  head.insertBefore(styleElem, head.firstChild);

  // Set up the placeholders.
  var placeholder;
  var elem;

  for (var i = 0, len = inputs.length + textareas.length; i < len; i++) {

    // Find the next element. If we've already done all the inputs we move on
    // to the textareas.
    elem = i < inputs.length ? inputs[i] : textareas[i - inputs.length];

    // Get the value of the placeholder attribute, if any. IE10 emulating IE7
    // fails with getAttribute, hence the use of the attributes node.
    placeholder = elem.attributes.placeholder;

    // If the element has a placeholder attribute we need to modify it.
    if (placeholder) {

      // IE returns an empty object instead of undefined if the attribute is
      // not present.
      placeholder = placeholder.nodeValue;

      // Only apply the polyfill if this element is of a type that supports
      // placeholders and has a placeholder attribute with a non-empty value.
      if (placeholder && inArray(validTypes, elem.type)) {
        newElement(elem);
      }
    }
  }

  // If enabled, the polyfill will repeatedly check for changed/added elements
  // and apply to those as well.
  var timer = setInterval(function () {
    for (var i = 0, len = inputs.length + textareas.length; i < len; i++) {
      elem = i < inputs.length ? inputs[i] : textareas[i - inputs.length];

      // Only apply the polyfill if this element is of a type that supports
      // placeholders, and has a placeholder attribute with a non-empty value.
      placeholder = elem.attributes.placeholder;

      if (placeholder) {

        placeholder = placeholder.nodeValue;

        if (placeholder && inArray(validTypes, elem.type)) {

          // If the element hasn't had event handlers bound to it then add
          // them.
          if (!elem.getAttribute(ATTR_EVENTS_BOUND)) {
            newElement(elem);
          }

          // If the placeholder value has changed or not been initialised yet
          // we need to update the display.
          if (
              placeholder !== elem.getAttribute(ATTR_CURRENT_VAL) ||
              (elem.type === 'password' && !elem.getAttribute(ATTR_INPUT_TYPE))
          ) {

            // Attempt to change the type of password inputs (fails in IE < 9).
            if (
                elem.type === 'password' &&
                !elem.getAttribute(ATTR_INPUT_TYPE) &&
                changeType(elem, 'text')
            ) {
              elem.setAttribute(ATTR_INPUT_TYPE, 'password');
            }

            // If the placeholder value has changed and the placeholder is
            // currently on display we need to change it.
            if (elem.value === elem.getAttribute(ATTR_CURRENT_VAL)) {
              elem.value = placeholder;
            }

            // Keep a reference to the current placeholder value in case it
            // changes via another script.
            elem.setAttribute(ATTR_CURRENT_VAL, placeholder);
          }
        }
      } else if (elem.getAttribute(ATTR_ACTIVE)) {
        hidePlaceholder(elem);
        elem.removeAttribute(ATTR_CURRENT_VAL);
      }
    }

    // If live updates are not enabled cancel the timer.
    if (!liveUpdates) {
      clearInterval(timer);
    }
  }, UPDATE_INTERVAL);

  // Disabling placeholders before unloading the page prevents flash of
  // unstyled placeholders on load if the page was refreshed.
  addEventListener(global, 'beforeunload', function () {
    Placeholders.disable();
  });

  //
  // Utility functions
  //

  // No-op (used in place of public methods when native support is detected).
  function noop() {
  }

  // Avoid IE9 activeElement of death when an iframe is used.
  //
  // More info:
  //  - http://bugs.jquery.com/ticket/13393
  //  - https://github.com/jquery/jquery/commit/85fc5878b3c6af73f42d61eedf73013e7faae408
  function safeActiveElement() {
    try {
      return document.activeElement;
    } catch (err) {
    }
  }

  // Check whether an item is in an array. We don't use Array.prototype.indexOf
  // so we don't clobber any existing polyfills. This is a really simple
  // alternative.
  function inArray(arr, item) {
    for (var i = 0, len = arr.length; i < len; i++) {
      if (arr[i] === item) {
        return true;
      }
    }
    return false;
  }

  // Cross-browser DOM event binding
  function addEventListener(elem, event, fn) {
    if (elem.addEventListener) {
      return elem.addEventListener(event, fn, false);
    }
    if (elem.attachEvent) {
      return elem.attachEvent('on' + event, fn);
    }
  }

  // Move the caret to the index position specified. Assumes that the element
  // has focus.
  function moveCaret(elem, index) {
    var range;
    if (elem.createTextRange) {
      range = elem.createTextRange();
      range.move('character', index);
      range.select();
    } else if (elem.selectionStart) {
      elem.focus();
      elem.setSelectionRange(index, index);
    }
  }

  // Attempt to change the type property of an input element.
  function changeType(elem, type) {
    try {
      elem.type = type;
      return true;
    } catch (e) {
      // You can't change input type in IE8 and below.
      return false;
    }
  }

  function handleElem(node, callback) {

    // Check if the passed in node is an input/textarea (in which case it can't
    // have any affected descendants).
    if (node && node.getAttribute(ATTR_CURRENT_VAL)) {
      callback(node);
    } else {

      // If an element was passed in, get all affected descendants. Otherwise,
      // get all affected elements in document.
      var handleInputs = node ? node.getElementsByTagName('input') : inputs;
      var handleTextareas = node ? node.getElementsByTagName('textarea') : textareas;

      var handleInputsLength = handleInputs ? handleInputs.length : 0;
      var handleTextareasLength = handleTextareas ? handleTextareas.length : 0;

      // Run the callback for each element.
      var len = handleInputsLength + handleTextareasLength;
      var elem;
      for (var i = 0; i < len; i++) {

        elem = i < handleInputsLength ? handleInputs[i] : handleTextareas[i - handleInputsLength];

        callback(elem);
      }
    }
  }

  // Return all affected elements to their normal state (remove placeholder
  // value if present).
  function disablePlaceholders(node) {
    handleElem(node, hidePlaceholder);
  }

  // Show the placeholder value on all appropriate elements.
  function enablePlaceholders(node) {
    handleElem(node, showPlaceholder);
  }

  // Hide the placeholder value on a single element. Returns true if the
  // placeholder was hidden and false if it was not (because it wasn't visible
  // in the first place).
  function hidePlaceholder(elem, keydownValue) {

    var valueChanged = !!keydownValue && elem.value !== keydownValue;
    var isPlaceholderValue = elem.value === elem.getAttribute(ATTR_CURRENT_VAL);

    if (
        (valueChanged || isPlaceholderValue) &&
        elem.getAttribute(ATTR_ACTIVE) === 'true'
    ) {

      elem.removeAttribute(ATTR_ACTIVE);
      elem.value = elem.value.replace(elem.getAttribute(ATTR_CURRENT_VAL), '');
      elem.className = elem.className.replace(classNameRegExp, '');

      // Restore the maxlength value. Old FF returns -1 if attribute not set.
      // See GH-56.
      var maxLength = elem.getAttribute(ATTR_MAXLENGTH);
      if (parseInt(maxLength, 10) >= 0) {
        elem.setAttribute('maxLength', maxLength);
        elem.removeAttribute(ATTR_MAXLENGTH);
      }

      // If the polyfill has changed the type of the element we need to change
      // it back.
      var type = elem.getAttribute(ATTR_INPUT_TYPE);
      if (type) {
        elem.type = type;
      }

      return true;
    }

    return false;
  }

  // Show the placeholder value on a single element. Returns true if the
  // placeholder was shown and false if it was not (because it was already
  // visible).
  function showPlaceholder(elem) {

    var val = elem.getAttribute(ATTR_CURRENT_VAL);

    if (elem.value === '' && val) {

      elem.setAttribute(ATTR_ACTIVE, 'true');
      elem.value = val;
      elem.className += ' ' + placeholderClassName;

      // Store and remove the maxlength value.
      var maxLength = elem.getAttribute(ATTR_MAXLENGTH);
      if (!maxLength) {
        elem.setAttribute(ATTR_MAXLENGTH, elem.maxLength);
        elem.removeAttribute('maxLength');
      }

      // If the type of element needs to change, change it (e.g. password
      // inputs).
      var type = elem.getAttribute(ATTR_INPUT_TYPE);
      if (type) {
        elem.type = 'text';
      } else if (elem.type === 'password' && changeType(elem, 'text')) {
        elem.setAttribute(ATTR_INPUT_TYPE, 'password');
      }

      return true;
    }

    return false;
  }

  // Returns a function that is used as a focus event handler.
  function makeFocusHandler(elem) {
    return function () {

      // Only hide the placeholder value if the (default) hide-on-focus
      // behaviour is enabled.
      if (
          hideOnInput &&
          elem.value === elem.getAttribute(ATTR_CURRENT_VAL) &&
          elem.getAttribute(ATTR_ACTIVE) === 'true'
      ) {

        // Move the caret to the start of the input (this mimics the behaviour
        // of all browsers that do not hide the placeholder on focus).
        moveCaret(elem, 0);
      } else {

        // Remove the placeholder.
        hidePlaceholder(elem);
      }
    };
  }

  // Returns a function that is used as a blur event handler.
  function makeBlurHandler(elem) {
    return function () {
      showPlaceholder(elem);
    };
  }

  // Returns a function that is used as a submit event handler on form elements
  // that have children affected by this polyfill.
  function makeSubmitHandler(form) {
    return function () {

      // Turn off placeholders on all appropriate descendant elements.
      disablePlaceholders(form);
    };
  }

  // Functions that are used as a event handlers when the hide-on-input
  // behaviour has been activated - very basic implementation of the 'input'
  // event.
  function makeKeydownHandler(elem) {
    return function (e) {
      keydownVal = elem.value;

      // Prevent the use of the arrow keys (try to keep the cursor before the
      // placeholder).
      if (
          elem.getAttribute(ATTR_ACTIVE) === 'true' &&
          keydownVal === elem.getAttribute(ATTR_CURRENT_VAL) &&
          inArray(badKeys, e.keyCode)
      ) {
        if (e.preventDefault) {
          e.preventDefault();
        }
        return false;
      }
    };
  }

  function makeKeyupHandler(elem) {
    return function () {
      hidePlaceholder(elem, keydownVal);

      // If the element is now empty we need to show the placeholder
      if (elem.value === '') {
        elem.blur();
        moveCaret(elem, 0);
      }
    };
  }

  function makeClickHandler(elem) {
    return function () {
      if (
          elem === safeActiveElement() &&
          elem.value === elem.getAttribute(ATTR_CURRENT_VAL) &&
          elem.getAttribute(ATTR_ACTIVE) === 'true'
      ) {
        moveCaret(elem, 0);
      }
    };
  }

  // Bind event handlers to an element that we need to affect with the
  // polyfill.
  function newElement(elem) {

    // If the element is part of a form, make sure the placeholder string is
    // not submitted as a value.
    var form = elem.form;
    if (form && typeof form === 'string') {

      // Get the real form.
      form = document.getElementById(form);

      // Set a flag on the form so we know it's been handled (forms can contain
      // multiple inputs).
      if (!form.getAttribute(ATTR_FORM_HANDLED)) {
        addEventListener(form, 'submit', makeSubmitHandler(form));
        form.setAttribute(ATTR_FORM_HANDLED, 'true');
      }
    }

    // Bind event handlers to the element so we can hide/show the placeholder
    // as appropriate.
    addEventListener(elem, 'focus', makeFocusHandler(elem));
    addEventListener(elem, 'blur', makeBlurHandler(elem));

    // If the placeholder should hide on input rather than on focus we need
    // additional event handlers
    if (hideOnInput) {
      addEventListener(elem, 'keydown', makeKeydownHandler(elem));
      addEventListener(elem, 'keyup', makeKeyupHandler(elem));
      addEventListener(elem, 'click', makeClickHandler(elem));
    }

    // Remember that we've bound event handlers to this element.
    elem.setAttribute(ATTR_EVENTS_BOUND, 'true');
    elem.setAttribute(ATTR_CURRENT_VAL, placeholder);

    // If the element doesn't have a value and is not focussed, set it to the
    // placeholder string.
    if (hideOnInput || elem !== safeActiveElement()) {
      showPlaceholder(elem);
    }
  }

}(this));


/*
 * Select2 4.0.3
 * https://select2.github.io
 *
 * Released under the MIT license
 * https://github.com/select2/select2/blob/master/LICENSE.md
 */
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node/CommonJS
    factory(require('jquery'));
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function (jQuery) {
  // This is needed so we can catch the AMD loader configuration and use it
  // The inner file should be wrapped (by `banner.start.js`) in a function that
  // returns the AMD loader references.
  var S2 =
      (function () {
        // Restore the Select2 AMD loader so it can be used
        // Needed mostly in the language files, where the loader is not inserted
        if (jQuery && jQuery.fn && jQuery.fn.select2 && jQuery.fn.select2.amd) {
          var S2 = jQuery.fn.select2.amd;
        }
        var S2;
        (function () {
          if (!S2 || !S2.requirejs) {
            if (!S2) {
              S2 = {};
            } else {
              require = S2;
            }
            /**
             * @license almond 0.3.1 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
             * Available via the MIT or new BSD license.
             * see: http://github.com/jrburke/almond for details
             */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
            /*jslint sloppy: true */
            /*global setTimeout: false */

            var requirejs, require, define;
            (function (undef) {
              var main, req, makeMap, handlers,
                  defined = {},
                  waiting = {},
                  config = {},
                  defining = {},
                  hasOwn = Object.prototype.hasOwnProperty,
                  aps = [].slice,
                  jsSuffixRegExp = /\.js$/;

              function hasProp(obj, prop) {
                return hasOwn.call(obj, prop);
              }

              /**
               * Given a relative module name, like ./something, normalize it to
               * a real name that can be mapped to a path.
               * @param {String} name the relative name
               * @param {String} baseName a real name that the name arg is relative
               * to.
               * @returns {String} normalized name
               */
              function normalize(name, baseName) {
                var nameParts, nameSegment, mapValue, foundMap, lastIndex,
                    foundI, foundStarMap, starI, i, j, part,
                    baseParts = baseName && baseName.split("/"),
                    map = config.map,
                    starMap = (map && map['*']) || {};

                //Adjust any relative paths.
                if (name && name.charAt(0) === ".") {
                  //If have a base name, try to normalize against it,
                  //otherwise, assume it is a top-level require that will
                  //be relative to baseUrl in the end.
                  if (baseName) {
                    name = name.split('/');
                    lastIndex = name.length - 1;

                    // Node .js allowance:
                    if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                      name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                    }

                    //Lop off the last part of baseParts, so that . matches the
                    //"directory" and not name of the baseName's module. For instance,
                    //baseName of "one/two/three", maps to "one/two/three.js", but we
                    //want the directory, "one/two" for this normalization.
                    name = baseParts.slice(0, baseParts.length - 1).concat(name);

                    //start trimDots
                    for (i = 0; i < name.length; i += 1) {
                      part = name[i];
                      if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                      } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                          //End of the line. Keep at least one non-dot
                          //path segment at the front so it can be mapped
                          //correctly to disk. Otherwise, there is likely
                          //no path mapping for a path starting with '..'.
                          //This can still fail, but catches the most reasonable
                          //uses of ..
                          break;
                        } else if (i > 0) {
                          name.splice(i - 1, 2);
                          i -= 2;
                        }
                      }
                    }
                    //end trimDots

                    name = name.join("/");
                  } else if (name.indexOf('./') === 0) {
                    // No baseName, so this is ID is resolved relative
                    // to baseUrl, pull off the leading dot.
                    name = name.substring(2);
                  }
                }

                //Apply map config if available.
                if ((baseParts || starMap) && map) {
                  nameParts = name.split('/');

                  for (i = nameParts.length; i > 0; i -= 1) {
                    nameSegment = nameParts.slice(0, i).join("/");

                    if (baseParts) {
                      //Find the longest baseName segment match in the config.
                      //So, do joins on the biggest to smallest lengths of baseParts.
                      for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                          mapValue = mapValue[nameSegment];
                          if (mapValue) {
                            //Match, update name to the new value.
                            foundMap = mapValue;
                            foundI = i;
                            break;
                          }
                        }
                      }
                    }

                    if (foundMap) {
                      break;
                    }

                    //Check for a star map match, but just hold on to it,
                    //if there is a shorter segment match later in a matching
                    //config, then favor over this star map.
                    if (!foundStarMap && starMap && starMap[nameSegment]) {
                      foundStarMap = starMap[nameSegment];
                      starI = i;
                    }
                  }

                  if (!foundMap && foundStarMap) {
                    foundMap = foundStarMap;
                    foundI = starI;
                  }

                  if (foundMap) {
                    nameParts.splice(0, foundI, foundMap);
                    name = nameParts.join('/');
                  }
                }

                return name;
              }

              function makeRequire(relName, forceSync) {
                return function () {
                  //A version of a require function that passes a moduleName
                  //value for items that may need to
                  //look up paths relative to the moduleName
                  var args = aps.call(arguments, 0);

                  //If first arg is not require('string'), and there is only
                  //one arg, it is the array form without a callback. Insert
                  //a null so that the following concat is correct.
                  if (typeof args[0] !== 'string' && args.length === 1) {
                    args.push(null);
                  }
                  return req.apply(undef, args.concat([relName, forceSync]));
                };
              }

              function makeNormalize(relName) {
                return function (name) {
                  return normalize(name, relName);
                };
              }

              function makeLoad(depName) {
                return function (value) {
                  defined[depName] = value;
                };
              }

              function callDep(name) {
                if (hasProp(waiting, name)) {
                  var args = waiting[name];
                  delete waiting[name];
                  defining[name] = true;
                  main.apply(undef, args);
                }

                if (!hasProp(defined, name) && !hasProp(defining, name)) {
                  throw new Error('No ' + name);
                }
                return defined[name];
              }

              //Turns a plugin!resource to [plugin, resource]
              //with the plugin being undefined if the name
              //did not have a plugin prefix.
              function splitPrefix(name) {
                var prefix,
                    index = name ? name.indexOf('!') : -1;
                if (index > -1) {
                  prefix = name.substring(0, index);
                  name = name.substring(index + 1, name.length);
                }
                return [prefix, name];
              }

              /**
               * Makes a name map, normalizing the name, and using a plugin
               * for normalization if necessary. Grabs a ref to plugin
               * too, as an optimization.
               */
              makeMap = function (name, relName) {
                var plugin,
                    parts = splitPrefix(name),
                    prefix = parts[0];

                name = parts[1];

                if (prefix) {
                  prefix = normalize(prefix, relName);
                  plugin = callDep(prefix);
                }

                //Normalize according
                if (prefix) {
                  if (plugin && plugin.normalize) {
                    name = plugin.normalize(name, makeNormalize(relName));
                  } else {
                    name = normalize(name, relName);
                  }
                } else {
                  name = normalize(name, relName);
                  parts = splitPrefix(name);
                  prefix = parts[0];
                  name = parts[1];
                  if (prefix) {
                    plugin = callDep(prefix);
                  }
                }

                //Using ridiculous property names for space reasons
                return {
                  f: prefix ? prefix + '!' + name : name, //fullName
                  n: name,
                  pr: prefix,
                  p: plugin
                };
              };

              function makeConfig(name) {
                return function () {
                  return (config && config.config && config.config[name]) || {};
                };
              }

              handlers = {
                require: function (name) {
                  return makeRequire(name);
                },
                exports: function (name) {
                  var e = defined[name];
                  if (typeof e !== 'undefined') {
                    return e;
                  } else {
                    return (defined[name] = {});
                  }
                },
                module: function (name) {
                  return {
                    id: name,
                    uri: '',
                    exports: defined[name],
                    config: makeConfig(name)
                  };
                }
              };

              main = function (name, deps, callback, relName) {
                var cjsModule, depName, ret, map, i,
                    args = [],
                    callbackType = typeof callback,
                    usingExports;

                //Use name if no relName
                relName = relName || name;

                //Call the callback to define the module, if necessary.
                if (callbackType === 'undefined' || callbackType === 'function') {
                  //Pull out the defined dependencies and pass the ordered
                  //values to the callback.
                  //Default to [require, exports, module] if no deps
                  deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
                  for (i = 0; i < deps.length; i += 1) {
                    map = makeMap(deps[i], relName);
                    depName = map.f;

                    //Fast path CommonJS standard dependencies.
                    if (depName === "require") {
                      args[i] = handlers.require(name);
                    } else if (depName === "exports") {
                      //CommonJS module spec 1.1
                      args[i] = handlers.exports(name);
                      usingExports = true;
                    } else if (depName === "module") {
                      //CommonJS module spec 1.1
                      cjsModule = args[i] = handlers.module(name);
                    } else if (hasProp(defined, depName) ||
                        hasProp(waiting, depName) ||
                        hasProp(defining, depName)) {
                      args[i] = callDep(depName);
                    } else if (map.p) {
                      map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                      args[i] = defined[depName];
                    } else {
                      throw new Error(name + ' missing ' + depName);
                    }
                  }

                  ret = callback ? callback.apply(defined[name], args) : undefined;

                  if (name) {
                    //If setting exports via "module" is in play,
                    //favor that over return value and exports. After that,
                    //favor a non-undefined return value over exports use.
                    if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                      defined[name] = cjsModule.exports;
                    } else if (ret !== undef || !usingExports) {
                      //Use the return value from the function.
                      defined[name] = ret;
                    }
                  }
                } else if (name) {
                  //May just be an object definition for the module. Only
                  //worry about defining if have a module name.
                  defined[name] = callback;
                }
              };

              requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
                if (typeof deps === "string") {
                  if (handlers[deps]) {
                    //callback in this case is really relName
                    return handlers[deps](callback);
                  }
                  //Just return the module wanted. In this scenario, the
                  //deps arg is the module name, and second arg (if passed)
                  //is just the relName.
                  //Normalize module name, if it contains . or ..
                  return callDep(makeMap(deps, callback).f);
                } else if (!deps.splice) {
                  //deps is a config object, not an array.
                  config = deps;
                  if (config.deps) {
                    req(config.deps, config.callback);
                  }
                  if (!callback) {
                    return;
                  }

                  if (callback.splice) {
                    //callback is an array, which means it is a dependency list.
                    //Adjust args if there are dependencies
                    deps = callback;
                    callback = relName;
                    relName = null;
                  } else {
                    deps = undef;
                  }
                }

                //Support require(['a'])
                callback = callback || function () {
                };

                //If relName is a function, it is an errback handler,
                //so remove it.
                if (typeof relName === 'function') {
                  relName = forceSync;
                  forceSync = alt;
                }

                //Simulate async callback;
                if (forceSync) {
                  main(undef, deps, callback, relName);
                } else {
                  //Using a non-zero value because of concern for what old browsers
                  //do, and latest browsers "upgrade" to 4 if lower value is used:
                  //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
                  //If want a value immediately, use require('id') instead -- something
                  //that works in almond on the global level, but not guaranteed and
                  //unlikely to work in other AMD implementations.
                  setTimeout(function () {
                    main(undef, deps, callback, relName);
                  }, 4);
                }

                return req;
              };

              /**
               * Just drops the config on the floor, but returns req in case
               * the config return value is used.
               */
              req.config = function (cfg) {
                return req(cfg);
              };

              /**
               * Expose module registry for debugging and tooling
               */
              requirejs._defined = defined;

              define = function (name, deps, callback) {
                if (typeof name !== 'string') {
                  throw new Error('See almond README: incorrect module build, no module name');
                }

                //This module may not have dependencies
                if (!deps.splice) {
                  //deps is not an array, so probably means
                  //an object literal or factory function for
                  //the value. Adjust args.
                  callback = deps;
                  deps = [];
                }

                if (!hasProp(defined, name) && !hasProp(waiting, name)) {
                  waiting[name] = [name, deps, callback];
                }
              };

              define.amd = {
                jQuery: true
              };
            }());

            S2.requirejs = requirejs;
            S2.require = require;
            S2.define = define;
          }
        }());
        S2.define("almond", function () {
        });

        /* global jQuery:false, $:false */
        S2.define('jquery', [], function () {
          var _$ = jQuery || $;

          if (_$ == null && console && console.error) {
            console.error(
                'Select2: An instance of jQuery or a jQuery-compatible library was not ' +
                'found. Make sure that you are including jQuery before Select2 on your ' +
                'web page.'
            );
          }

          return _$;
        });

        S2.define('select2/utils', [
          'jquery'
        ], function ($) {
          var Utils = {};

          Utils.Extend = function (ChildClass, SuperClass) {
            var __hasProp = {}.hasOwnProperty;

            function BaseConstructor() {
              this.constructor = ChildClass;
            }

            for (var key in SuperClass) {
              if (__hasProp.call(SuperClass, key)) {
                ChildClass[key] = SuperClass[key];
              }
            }

            BaseConstructor.prototype = SuperClass.prototype;
            ChildClass.prototype = new BaseConstructor();
            ChildClass.__super__ = SuperClass.prototype;

            return ChildClass;
          };

          function getMethods(theClass) {
            var proto = theClass.prototype;

            var methods = [];

            for (var methodName in proto) {
              var m = proto[methodName];

              if (typeof m !== 'function') {
                continue;
              }

              if (methodName === 'constructor') {
                continue;
              }

              methods.push(methodName);
            }

            return methods;
          }

          Utils.Decorate = function (SuperClass, DecoratorClass) {
            var decoratedMethods = getMethods(DecoratorClass);
            var superMethods = getMethods(SuperClass);

            function DecoratedClass() {
              var unshift = Array.prototype.unshift;

              var argCount = DecoratorClass.prototype.constructor.length;

              var calledConstructor = SuperClass.prototype.constructor;

              if (argCount > 0) {
                unshift.call(arguments, SuperClass.prototype.constructor);

                calledConstructor = DecoratorClass.prototype.constructor;
              }

              calledConstructor.apply(this, arguments);
            }

            DecoratorClass.displayName = SuperClass.displayName;

            function ctr() {
              this.constructor = DecoratedClass;
            }

            DecoratedClass.prototype = new ctr();

            for (var m = 0; m < superMethods.length; m++) {
              var superMethod = superMethods[m];

              DecoratedClass.prototype[superMethod] =
                  SuperClass.prototype[superMethod];
            }

            var calledMethod = function (methodName) {
              // Stub out the original method if it's not decorating an actual method
              var originalMethod = function () {
              };

              if (methodName in DecoratedClass.prototype) {
                originalMethod = DecoratedClass.prototype[methodName];
              }

              var decoratedMethod = DecoratorClass.prototype[methodName];

              return function () {
                var unshift = Array.prototype.unshift;

                unshift.call(arguments, originalMethod);

                return decoratedMethod.apply(this, arguments);
              };
            };

            for (var d = 0; d < decoratedMethods.length; d++) {
              var decoratedMethod = decoratedMethods[d];

              DecoratedClass.prototype[decoratedMethod] = calledMethod(decoratedMethod);
            }

            return DecoratedClass;
          };

          var Observable = function () {
            this.listeners = {};
          };

          Observable.prototype.on = function (event, callback) {
            this.listeners = this.listeners || {};

            if (event in this.listeners) {
              this.listeners[event].push(callback);
            } else {
              this.listeners[event] = [callback];
            }
          };

          Observable.prototype.trigger = function (event) {
            var slice = Array.prototype.slice;
            var params = slice.call(arguments, 1);

            this.listeners = this.listeners || {};

            // Params should always come in as an array
            if (params == null) {
              params = [];
            }

            // If there are no arguments to the event, use a temporary object
            if (params.length === 0) {
              params.push({});
            }

            // Set the `_type` of the first object to the event
            params[0]._type = event;

            if (event in this.listeners) {
              this.invoke(this.listeners[event], slice.call(arguments, 1));
            }

            if ('*' in this.listeners) {
              this.invoke(this.listeners['*'], arguments);
            }
          };

          Observable.prototype.invoke = function (listeners, params) {
            for (var i = 0, len = listeners.length; i < len; i++) {
              listeners[i].apply(this, params);
            }
          };

          Utils.Observable = Observable;

          Utils.generateChars = function (length) {
            var chars = '';

            for (var i = 0; i < length; i++) {
              var randomChar = Math.floor(Math.random() * 36);
              chars += randomChar.toString(36);
            }

            return chars;
          };

          Utils.bind = function (func, context) {
            return function () {
              func.apply(context, arguments);
            };
          };

          Utils._convertData = function (data) {
            for (var originalKey in data) {
              var keys = originalKey.split('-');

              var dataLevel = data;

              if (keys.length === 1) {
                continue;
              }

              for (var k = 0; k < keys.length; k++) {
                var key = keys[k];

                // Lowercase the first letter
                // By default, dash-separated becomes camelCase
                key = key.substring(0, 1).toLowerCase() + key.substring(1);

                if (!(key in dataLevel)) {
                  dataLevel[key] = {};
                }

                if (k == keys.length - 1) {
                  dataLevel[key] = data[originalKey];
                }

                dataLevel = dataLevel[key];
              }

              delete data[originalKey];
            }

            return data;
          };

          Utils.hasScroll = function (index, el) {
            // Adapted from the function created by @ShadowScripter
            // and adapted by @BillBarry on the Stack Exchange Code Review website.
            // The original code can be found at
            // http://codereview.stackexchange.com/q/13338
            // and was designed to be used with the Sizzle selector engine.

            var $el = $(el);
            var overflowX = el.style.overflowX;
            var overflowY = el.style.overflowY;

            //Check both x and y declarations
            if (overflowX === overflowY &&
                (overflowY === 'hidden' || overflowY === 'visible')) {
              return false;
            }

            if (overflowX === 'scroll' || overflowY === 'scroll') {
              return true;
            }

            return ($el.innerHeight() < el.scrollHeight ||
                $el.innerWidth() < el.scrollWidth);
          };

          Utils.escapeMarkup = function (markup) {
            var replaceMap = {
              '\\': '&#92;',
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              '\'': '&#39;',
              '/': '&#47;'
            };

            // Do not try to escape the markup if it's not a string
            if (typeof markup !== 'string') {
              return markup;
            }

            return String(markup).replace(/[&<>"'\/\\]/g, function (match) {
              return replaceMap[match];
            });
          };

          // Append an array of jQuery nodes to a given element.
          Utils.appendMany = function ($element, $nodes) {
            // jQuery 1.7.x does not support $.fn.append() with an array
            // Fall back to a jQuery object collection using $.fn.add()
            if ($.fn.jquery.substr(0, 3) === '1.7') {
              var $jqNodes = $();

              $.map($nodes, function (node) {
                $jqNodes = $jqNodes.add(node);
              });

              $nodes = $jqNodes;
            }

            $element.append($nodes);
          };

          return Utils;
        });

        S2.define('select2/results', [
          'jquery',
          './utils'
        ], function ($, Utils) {
          function Results($element, options, dataAdapter) {
            this.$element = $element;
            this.data = dataAdapter;
            this.options = options;

            Results.__super__.constructor.call(this);
          }

          Utils.Extend(Results, Utils.Observable);

          Results.prototype.render = function () {
            var $results = $(
                '<ul class="select2-results__options" role="tree"></ul>'
            );

            if (this.options.get('multiple')) {
              $results.attr('aria-multiselectable', 'true');
            }

            this.$results = $results;

            return $results;
          };

          Results.prototype.clear = function () {
            this.$results.empty();
          };

          Results.prototype.displayMessage = function (params) {
            var escapeMarkup = this.options.get('escapeMarkup');

            this.clear();
            this.hideLoading();

            var $message = $(
                '<li role="treeitem" aria-live="assertive"' +
                ' class="select2-results__option"></li>'
            );

            var message = this.options.get('translations').get(params.message);

            $message.append(
                escapeMarkup(
                    message(params.args)
                )
            );

            $message[0].className += ' select2-results__message';

            this.$results.append($message);
          };

          Results.prototype.hideMessages = function () {
            this.$results.find('.select2-results__message').remove();
          };

          Results.prototype.append = function (data) {
            this.hideLoading();

            var $options = [];

            if (data.results == null || data.results.length === 0) {
              if (this.$results.children().length === 0) {
                this.trigger('results:message', {
                  message: 'noResults'
                });
              }

              return;
            }

            data.results = this.sort(data.results);

            for (var d = 0; d < data.results.length; d++) {
              var item = data.results[d];

              var $option = this.option(item);

              $options.push($option);
            }

            this.$results.append($options);
          };

          Results.prototype.position = function ($results, $dropdown) {
            var $resultsContainer = $dropdown.find('.select2-results');
            $resultsContainer.append($results);
          };

          Results.prototype.sort = function (data) {
            var sorter = this.options.get('sorter');

            return sorter(data);
          };

          Results.prototype.highlightFirstItem = function () {
            var $options = this.$results
            .find('.select2-results__option[aria-selected]');

            var $selected = $options.filter('[aria-selected=true]');

            // Check if there are any selected options
            if ($selected.length > 0) {
              // If there are selected options, highlight the first
              $selected.first().trigger('mouseenter');
            } else {
              // If there are no selected options, highlight the first option
              // in the dropdown
              $options.first().trigger('mouseenter');
            }

            this.ensureHighlightVisible();
          };

          Results.prototype.setClasses = function () {
            var self = this;

            this.data.current(function (selected) {
              var selectedIds = $.map(selected, function (s) {
                return s.id.toString();
              });

              var $options = self.$results
              .find('.select2-results__option[aria-selected]');

              $options.each(function () {
                var $option = $(this);

                var item = $.data(this, 'data');

                // id needs to be converted to a string when comparing
                var id = '' + item.id;

                if ((item.element != null && item.element.selected) ||
                    (item.element == null && $.inArray(id, selectedIds) > -1)) {
                  $option.attr('aria-selected', 'true');
                } else {
                  $option.attr('aria-selected', 'false');
                }
              });

            });
          };

          Results.prototype.showLoading = function (params) {
            this.hideLoading();

            var loadingMore = this.options.get('translations').get('searching');

            var loading = {
              disabled: true,
              loading: true,
              text: loadingMore(params)
            };
            var $loading = this.option(loading);
            $loading.className += ' loading-results';

            this.$results.prepend($loading);
          };

          Results.prototype.hideLoading = function () {
            this.$results.find('.loading-results').remove();
          };

          Results.prototype.option = function (data) {
            var option = document.createElement('li');
            option.className = 'select2-results__option';

            var attrs = {
              'role': 'treeitem',
              'aria-selected': 'false'
            };

            if (data.disabled) {
              delete attrs['aria-selected'];
              attrs['aria-disabled'] = 'true';
            }

            if (data.id == null) {
              delete attrs['aria-selected'];
            }

            if (data._resultId != null) {
              option.id = data._resultId;
            }

            if (data.title) {
              option.title = data.title;
            }

            if (data.children) {
              attrs.role = 'group';
              attrs['aria-label'] = data.text;
              delete attrs['aria-selected'];
            }

            for (var attr in attrs) {
              var val = attrs[attr];

              option.setAttribute(attr, val);
            }

            if (data.children) {
              var $option = $(option);

              var label = document.createElement('strong');
              label.className = 'select2-results__group';

              var $label = $(label);
              this.template(data, label);

              var $children = [];

              for (var c = 0; c < data.children.length; c++) {
                var child = data.children[c];

                var $child = this.option(child);

                $children.push($child);
              }

              var $childrenContainer = $('<ul></ul>', {
                'class': 'select2-results__options select2-results__options--nested'
              });

              $childrenContainer.append($children);

              $option.append(label);
              $option.append($childrenContainer);
            } else {
              this.template(data, option);
            }

            $.data(option, 'data', data);

            return option;
          };

          Results.prototype.bind = function (container, $container) {
            var self = this;

            var id = container.id + '-results';

            this.$results.attr('id', id);

            container.on('results:all', function (params) {
              self.clear();
              self.append(params.data);

              if (container.isOpen()) {
                self.setClasses();
                self.highlightFirstItem();
              }
            });

            container.on('results:append', function (params) {
              self.append(params.data);

              if (container.isOpen()) {
                self.setClasses();
              }
            });

            container.on('query', function (params) {
              self.hideMessages();
              self.showLoading(params);
            });

            container.on('select', function () {
              if (!container.isOpen()) {
                return;
              }

              self.setClasses();
              self.highlightFirstItem();
            });

            container.on('unselect', function () {
              if (!container.isOpen()) {
                return;
              }

              self.setClasses();
              self.highlightFirstItem();
            });

            container.on('open', function () {
              // When the dropdown is open, aria-expended="true"
              self.$results.attr('aria-expanded', 'true');
              self.$results.attr('aria-hidden', 'false');

              self.setClasses();
              self.ensureHighlightVisible();
            });

            container.on('close', function () {
              // When the dropdown is closed, aria-expended="false"
              self.$results.attr('aria-expanded', 'false');
              self.$results.attr('aria-hidden', 'true');
              self.$results.removeAttr('aria-activedescendant');
            });

            container.on('results:toggle', function () {
              var $highlighted = self.getHighlightedResults();

              if ($highlighted.length === 0) {
                return;
              }

              $highlighted.trigger('mouseup');
            });

            container.on('results:select', function () {
              var $highlighted = self.getHighlightedResults();

              if ($highlighted.length === 0) {
                return;
              }

              var data = $highlighted.data('data');

              if ($highlighted.attr('aria-selected') == 'true') {
                self.trigger('close', {});
              } else {
                self.trigger('select', {
                  data: data
                });
              }
            });

            container.on('results:previous', function () {
              var $highlighted = self.getHighlightedResults();

              var $options = self.$results.find('[aria-selected]');

              var currentIndex = $options.index($highlighted);

              // If we are already at te top, don't move further
              if (currentIndex === 0) {
                return;
              }

              var nextIndex = currentIndex - 1;

              // If none are highlighted, highlight the first
              if ($highlighted.length === 0) {
                nextIndex = 0;
              }

              var $next = $options.eq(nextIndex);

              $next.trigger('mouseenter');

              var currentOffset = self.$results.offset().top;
              var nextTop = $next.offset().top;
              var nextOffset = self.$results.scrollTop() + (nextTop - currentOffset);

              if (nextIndex === 0) {
                self.$results.scrollTop(0);
              } else if (nextTop - currentOffset < 0) {
                self.$results.scrollTop(nextOffset);
              }
            });

            container.on('results:next', function () {
              var $highlighted = self.getHighlightedResults();

              var $options = self.$results.find('[aria-selected]');

              var currentIndex = $options.index($highlighted);

              var nextIndex = currentIndex + 1;

              // If we are at the last option, stay there
              if (nextIndex >= $options.length) {
                return;
              }

              var $next = $options.eq(nextIndex);

              $next.trigger('mouseenter');

              var currentOffset = self.$results.offset().top +
                  self.$results.outerHeight(false);
              var nextBottom = $next.offset().top + $next.outerHeight(false);
              var nextOffset = self.$results.scrollTop() + nextBottom - currentOffset;

              if (nextIndex === 0) {
                self.$results.scrollTop(0);
              } else if (nextBottom > currentOffset) {
                self.$results.scrollTop(nextOffset);
              }
            });

            container.on('results:focus', function (params) {
              params.element.addClass('select2-results__option--highlighted');
            });

            container.on('results:message', function (params) {
              self.displayMessage(params);
            });

            if ($.fn.mousewheel) {
              this.$results.on('mousewheel', function (e) {
                var top = self.$results.scrollTop();

                var bottom = self.$results.get(0).scrollHeight - top + e.deltaY;

                var isAtTop = e.deltaY > 0 && top - e.deltaY <= 0;
                var isAtBottom = e.deltaY < 0 && bottom <= self.$results.height();

                if (isAtTop) {
                  self.$results.scrollTop(0);

                  e.preventDefault();
                  e.stopPropagation();
                } else if (isAtBottom) {
                  self.$results.scrollTop(
                      self.$results.get(0).scrollHeight - self.$results.height()
                  );

                  e.preventDefault();
                  e.stopPropagation();
                }
              });
            }

            this.$results.on('mouseup', '.select2-results__option[aria-selected]',
                function (evt) {
                  var $this = $(this);

                  var data = $this.data('data');

                  if ($this.attr('aria-selected') === 'true') {
                    if (self.options.get('multiple')) {
                      self.trigger('unselect', {
                        originalEvent: evt,
                        data: data
                      });
                    } else {
                      self.trigger('close', {});
                    }

                    return;
                  }

                  self.trigger('select', {
                    originalEvent: evt,
                    data: data
                  });
                });

            this.$results.on('mouseenter', '.select2-results__option[aria-selected]',
                function (evt) {
                  var data = $(this).data('data');

                  self.getHighlightedResults()
                  .removeClass('select2-results__option--highlighted');

                  self.trigger('results:focus', {
                    data: data,
                    element: $(this)
                  });
                });
          };

          Results.prototype.getHighlightedResults = function () {
            var $highlighted = this.$results
            .find('.select2-results__option--highlighted');

            return $highlighted;
          };

          Results.prototype.destroy = function () {
            this.$results.remove();
          };

          Results.prototype.ensureHighlightVisible = function () {
            var $highlighted = this.getHighlightedResults();

            if ($highlighted.length === 0) {
              return;
            }

            var $options = this.$results.find('[aria-selected]');

            var currentIndex = $options.index($highlighted);

            var currentOffset = this.$results.offset().top;
            var nextTop = $highlighted.offset().top;
            var nextOffset = this.$results.scrollTop() + (nextTop - currentOffset);

            var offsetDelta = nextTop - currentOffset;
            nextOffset -= $highlighted.outerHeight(false) * 2;

            if (currentIndex <= 2) {
              this.$results.scrollTop(0);
            } else if (offsetDelta > this.$results.outerHeight() || offsetDelta < 0) {
              this.$results.scrollTop(nextOffset);
            }
          };

          Results.prototype.template = function (result, container) {
            var template = this.options.get('templateResult');
            var escapeMarkup = this.options.get('escapeMarkup');

            var content = template(result, container);

            if (content == null) {
              container.style.display = 'none';
            } else if (typeof content === 'string') {
              container.innerHTML = escapeMarkup(content);
            } else {
              $(container).append(content);
            }
          };

          return Results;
        });

        S2.define('select2/keys', [], function () {
          var KEYS = {
            BACKSPACE: 8,
            TAB: 9,
            ENTER: 13,
            SHIFT: 16,
            CTRL: 17,
            ALT: 18,
            ESC: 27,
            SPACE: 32,
            PAGE_UP: 33,
            PAGE_DOWN: 34,
            END: 35,
            HOME: 36,
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            DELETE: 46
          };

          return KEYS;
        });

        S2.define('select2/selection/base', [
          'jquery',
          '../utils',
          '../keys'
        ], function ($, Utils, KEYS) {
          function BaseSelection($element, options) {
            this.$element = $element;
            this.options = options;

            BaseSelection.__super__.constructor.call(this);
          }

          Utils.Extend(BaseSelection, Utils.Observable);

          BaseSelection.prototype.render = function () {
            var $selection = $(
                '<span class="select2-selection" role="combobox" ' +
                ' aria-haspopup="true" aria-expanded="false">' +
                '</span>'
            );

            this._tabindex = 0;

            if (this.$element.data('old-tabindex') != null) {
              this._tabindex = this.$element.data('old-tabindex');
            } else if (this.$element.attr('tabindex') != null) {
              this._tabindex = this.$element.attr('tabindex');
            }

            $selection.attr('title', this.$element.attr('title'));
            $selection.attr('tabindex', this._tabindex);

            this.$selection = $selection;

            return $selection;
          };

          BaseSelection.prototype.bind = function (container, $container) {
            var self = this;

            var id = container.id + '-container';
            var resultsId = container.id + '-results';

            this.container = container;

            this.$selection.on('focus', function (evt) {
              self.trigger('focus', evt);
            });

            this.$selection.on('blur', function (evt) {
              self._handleBlur(evt);
            });

            this.$selection.on('keydown', function (evt) {
              self.trigger('keypress', evt);

              if (evt.which === KEYS.SPACE) {
                evt.preventDefault();
              }
            });

            container.on('results:focus', function (params) {
              self.$selection.attr('aria-activedescendant', params.data._resultId);
            });

            container.on('selection:update', function (params) {
              self.update(params.data);
            });

            container.on('open', function () {
              // When the dropdown is open, aria-expanded="true"
              self.$selection.attr('aria-expanded', 'true');
              self.$selection.attr('aria-owns', resultsId);

              self._attachCloseHandler(container);
            });

            container.on('close', function () {
              // When the dropdown is closed, aria-expanded="false"
              self.$selection.attr('aria-expanded', 'false');
              self.$selection.removeAttr('aria-activedescendant');
              self.$selection.removeAttr('aria-owns');

              self.$selection.focus();

              self._detachCloseHandler(container);
            });

            container.on('enable', function () {
              self.$selection.attr('tabindex', self._tabindex);
            });

            container.on('disable', function () {
              self.$selection.attr('tabindex', '-1');
            });
          };

          BaseSelection.prototype._handleBlur = function (evt) {
            var self = this;

            // This needs to be delayed as the active element is the body when the tab
            // key is pressed, possibly along with others.
            window.setTimeout(function () {
              // Don't trigger `blur` if the focus is still in the selection
              if (
                  (document.activeElement == self.$selection[0]) ||
                  ($.contains(self.$selection[0], document.activeElement))
              ) {
                return;
              }

              self.trigger('blur', evt);
            }, 1);
          };

          BaseSelection.prototype._attachCloseHandler = function (container) {
            var self = this;

            $(document.body).on('mousedown.select2.' + container.id, function (e) {
              var $target = $(e.target);

              var $select = $target.closest('.select2');

              var $all = $('.select2.select2-container--open');

              $all.each(function () {
                var $this = $(this);

                if (this == $select[0]) {
                  return;
                }

                var $element = $this.data('element');

                $element.select2('close');
              });
            });
          };

          BaseSelection.prototype._detachCloseHandler = function (container) {
            $(document.body).off('mousedown.select2.' + container.id);
          };

          BaseSelection.prototype.position = function ($selection, $container) {
            var $selectionContainer = $container.find('.selection');
            $selectionContainer.append($selection);
          };

          BaseSelection.prototype.destroy = function () {
            this._detachCloseHandler(this.container);
          };

          BaseSelection.prototype.update = function (data) {
            throw new Error('The `update` method must be defined in child classes.');
          };

          return BaseSelection;
        });

        S2.define('select2/selection/single', [
          'jquery',
          './base',
          '../utils',
          '../keys'
        ], function ($, BaseSelection, Utils, KEYS) {
          function SingleSelection() {
            SingleSelection.__super__.constructor.apply(this, arguments);
          }

          Utils.Extend(SingleSelection, BaseSelection);

          SingleSelection.prototype.render = function () {
            var $selection = SingleSelection.__super__.render.call(this);

            $selection.addClass('select2-selection--single');

            $selection.html(
                '<span class="select2-selection__rendered"></span>' +
                '<span class="select2-selection__arrow" role="presentation">' +
                '<b role="presentation"></b>' +
                '</span>'
            );

            return $selection;
          };

          SingleSelection.prototype.bind = function (container, $container) {
            var self = this;

            SingleSelection.__super__.bind.apply(this, arguments);

            var id = container.id + '-container';

            this.$selection.find('.select2-selection__rendered').attr('id', id);
            this.$selection.attr('aria-labelledby', id);

            this.$selection.on('mousedown', function (evt) {
              // Only respond to left clicks
              if (evt.which !== 1) {
                return;
              }

              self.trigger('toggle', {
                originalEvent: evt
              });
            });

            this.$selection.on('focus', function (evt) {
              // User focuses on the container
            });

            this.$selection.on('blur', function (evt) {
              // User exits the container
            });

            container.on('focus', function (evt) {
              if (!container.isOpen()) {
                self.$selection.focus();
              }
            });

            container.on('selection:update', function (params) {
              self.update(params.data);
            });
          };

          SingleSelection.prototype.clear = function () {
            this.$selection.find('.select2-selection__rendered').empty();
          };

          SingleSelection.prototype.display = function (data, container) {
            var template = this.options.get('templateSelection');
            var escapeMarkup = this.options.get('escapeMarkup');

            return escapeMarkup(template(data, container));
          };

          SingleSelection.prototype.selectionContainer = function () {
            return $('<span></span>');
          };

          SingleSelection.prototype.update = function (data) {
            if (data.length === 0) {
              this.clear();
              return;
            }

            var selection = data[0];

            var $rendered = this.$selection.find('.select2-selection__rendered');
            var formatted = this.display(selection, $rendered);

            $rendered.empty().append(formatted);
            $rendered.prop('title', selection.title || selection.text);
          };

          return SingleSelection;
        });

        S2.define('select2/selection/multiple', [
          'jquery',
          './base',
          '../utils'
        ], function ($, BaseSelection, Utils) {
          function MultipleSelection($element, options) {
            MultipleSelection.__super__.constructor.apply(this, arguments);
          }

          Utils.Extend(MultipleSelection, BaseSelection);

          MultipleSelection.prototype.render = function () {
            var $selection = MultipleSelection.__super__.render.call(this);

            $selection.addClass('select2-selection--multiple');

            $selection.html(
                '<ul class="select2-selection__rendered"></ul>'
            );

            return $selection;
          };

          MultipleSelection.prototype.bind = function (container, $container) {
            var self = this;

            MultipleSelection.__super__.bind.apply(this, arguments);

            this.$selection.on('click', function (evt) {
              self.trigger('toggle', {
                originalEvent: evt
              });
            });

            this.$selection.on(
                'click',
                '.select2-selection__choice__remove',
                function (evt) {
                  // Ignore the event if it is disabled
                  if (self.options.get('disabled')) {
                    return;
                  }

                  var $remove = $(this);
                  var $selection = $remove.parent();

                  var data = $selection.data('data');

                  self.trigger('unselect', {
                    originalEvent: evt,
                    data: data
                  });
                }
            );
          };

          MultipleSelection.prototype.clear = function () {
            this.$selection.find('.select2-selection__rendered').empty();
          };

          MultipleSelection.prototype.display = function (data, container) {
            var template = this.options.get('templateSelection');
            var escapeMarkup = this.options.get('escapeMarkup');

            return escapeMarkup(template(data, container));
          };

          MultipleSelection.prototype.selectionContainer = function () {
            var $container = $(
                '<li class="select2-selection__choice">' +
                '<span class="select2-selection__choice__remove" role="presentation">' +
                '&times;' +
                '</span>' +
                '</li>'
            );

            return $container;
          };

          MultipleSelection.prototype.update = function (data) {
            this.clear();

            if (data.length === 0) {
              return;
            }

            var $selections = [];

            for (var d = 0; d < data.length; d++) {
              var selection = data[d];

              var $selection = this.selectionContainer();
              var formatted = this.display(selection, $selection);

              $selection.append(formatted);
              $selection.prop('title', selection.title || selection.text);

              $selection.data('data', selection);

              $selections.push($selection);
            }

            var $rendered = this.$selection.find('.select2-selection__rendered');

            Utils.appendMany($rendered, $selections);
          };

          return MultipleSelection;
        });

        S2.define('select2/selection/placeholder', [
          '../utils'
        ], function (Utils) {
          function Placeholder(decorated, $element, options) {
            this.placeholder = this.normalizePlaceholder(options.get('placeholder'));

            decorated.call(this, $element, options);
          }

          Placeholder.prototype.normalizePlaceholder = function (_, placeholder) {
            if (typeof placeholder === 'string') {
              placeholder = {
                id: '',
                text: placeholder
              };
            }

            return placeholder;
          };

          Placeholder.prototype.createPlaceholder = function (decorated, placeholder) {
            var $placeholder = this.selectionContainer();

            $placeholder.html(this.display(placeholder));
            $placeholder.addClass('select2-selection__placeholder')
            .removeClass('select2-selection__choice');

            return $placeholder;
          };

          Placeholder.prototype.update = function (decorated, data) {
            var singlePlaceholder = (
                data.length == 1 && data[0].id != this.placeholder.id
            );
            var multipleSelections = data.length > 1;

            if (multipleSelections || singlePlaceholder) {
              return decorated.call(this, data);
            }

            this.clear();

            var $placeholder = this.createPlaceholder(this.placeholder);

            this.$selection.find('.select2-selection__rendered').append($placeholder);
          };

          return Placeholder;
        });

        S2.define('select2/selection/allowClear', [
          'jquery',
          '../keys'
        ], function ($, KEYS) {
          function AllowClear() {
          }

          AllowClear.prototype.bind = function (decorated, container, $container) {
            var self = this;

            decorated.call(this, container, $container);

            if (this.placeholder == null) {
              if (this.options.get('debug') && window.console && console.error) {
                console.error(
                    'Select2: The `allowClear` option should be used in combination ' +
                    'with the `placeholder` option.'
                );
              }
            }

            this.$selection.on('mousedown', '.select2-selection__clear',
                function (evt) {
                  self._handleClear(evt);
                });

            container.on('keypress', function (evt) {
              self._handleKeyboardClear(evt, container);
            });
          };

          AllowClear.prototype._handleClear = function (_, evt) {
            // Ignore the event if it is disabled
            if (this.options.get('disabled')) {
              return;
            }

            var $clear = this.$selection.find('.select2-selection__clear');

            // Ignore the event if nothing has been selected
            if ($clear.length === 0) {
              return;
            }

            evt.stopPropagation();

            var data = $clear.data('data');

            for (var d = 0; d < data.length; d++) {
              var unselectData = {
                data: data[d]
              };

              // Trigger the `unselect` event, so people can prevent it from being
              // cleared.
              this.trigger('unselect', unselectData);

              // If the event was prevented, don't clear it out.
              if (unselectData.prevented) {
                return;
              }
            }

            this.$element.val(this.placeholder.id).trigger('change');

            this.trigger('toggle', {});
          };

          AllowClear.prototype._handleKeyboardClear = function (_, evt, container) {
            if (container.isOpen()) {
              return;
            }

            if (evt.which == KEYS.DELETE || evt.which == KEYS.BACKSPACE) {
              this._handleClear(evt);
            }
          };

          AllowClear.prototype.update = function (decorated, data) {
            decorated.call(this, data);

            if (this.$selection.find('.select2-selection__placeholder').length > 0 ||
                data.length === 0) {
              return;
            }

            var $remove = $(
                '<span class="select2-selection__clear">' +
                '&times;' +
                '</span>'
            );
            $remove.data('data', data);

            this.$selection.find('.select2-selection__rendered').prepend($remove);
          };

          return AllowClear;
        });

        S2.define('select2/selection/search', [
          'jquery',
          '../utils',
          '../keys'
        ], function ($, Utils, KEYS) {
          function Search(decorated, $element, options) {
            decorated.call(this, $element, options);
          }

          Search.prototype.render = function (decorated) {
            var $search = $(
                '<li class="select2-search select2-search--inline">' +
                '<input class="select2-search__field" type="search" tabindex="-1"' +
                ' autocomplete="off" autocorrect="off" autocapitalize="off"' +
                ' spellcheck="false" role="textbox" aria-autocomplete="list" />' +
                '</li>'
            );

            this.$searchContainer = $search;
            this.$search = $search.find('input');

            var $rendered = decorated.call(this);

            this._transferTabIndex();

            return $rendered;
          };

          Search.prototype.bind = function (decorated, container, $container) {
            var self = this;

            decorated.call(this, container, $container);

            container.on('open', function () {
              self.$search.trigger('focus');
            });

            container.on('close', function () {
              self.$search.val('');
              self.$search.removeAttr('aria-activedescendant');
              self.$search.trigger('focus');
            });

            container.on('enable', function () {
              self.$search.prop('disabled', false);

              self._transferTabIndex();
            });

            container.on('disable', function () {
              self.$search.prop('disabled', true);
            });

            container.on('focus', function (evt) {
              self.$search.trigger('focus');
            });

            container.on('results:focus', function (params) {
              self.$search.attr('aria-activedescendant', params.id);
            });

            this.$selection.on('focusin', '.select2-search--inline', function (evt) {
              self.trigger('focus', evt);
            });

            this.$selection.on('focusout', '.select2-search--inline', function (evt) {
              self._handleBlur(evt);
            });

            this.$selection.on('keydown', '.select2-search--inline', function (evt) {
              evt.stopPropagation();

              self.trigger('keypress', evt);

              self._keyUpPrevented = evt.isDefaultPrevented();

              var key = evt.which;

              if (key === KEYS.BACKSPACE && self.$search.val() === '') {
                var $previousChoice = self.$searchContainer
                .prev('.select2-selection__choice');

                if ($previousChoice.length > 0) {
                  var item = $previousChoice.data('data');

                  self.searchRemoveChoice(item);

                  evt.preventDefault();
                }
              }
            });

            // Try to detect the IE version should the `documentMode` property that
            // is stored on the document. This is only implemented in IE and is
            // slightly cleaner than doing a user agent check.
            // This property is not available in Edge, but Edge also doesn't have
            // this bug.
            var msie = document.documentMode;
            var disableInputEvents = msie && msie <= 11;

            // Workaround for browsers which do not support the `input` event
            // This will prevent double-triggering of events for browsers which support
            // both the `keyup` and `input` events.
            this.$selection.on(
                'input.searchcheck',
                '.select2-search--inline',
                function (evt) {
                  // IE will trigger the `input` event when a placeholder is used on a
                  // search box. To get around this issue, we are forced to ignore all
                  // `input` events in IE and keep using `keyup`.
                  if (disableInputEvents) {
                    self.$selection.off('input.search input.searchcheck');
                    return;
                  }

                  // Unbind the duplicated `keyup` event
                  self.$selection.off('keyup.search');
                }
            );

            this.$selection.on(
                'keyup.search input.search',
                '.select2-search--inline',
                function (evt) {
                  // IE will trigger the `input` event when a placeholder is used on a
                  // search box. To get around this issue, we are forced to ignore all
                  // `input` events in IE and keep using `keyup`.
                  if (disableInputEvents && evt.type === 'input') {
                    self.$selection.off('input.search input.searchcheck');
                    return;
                  }

                  var key = evt.which;

                  // We can freely ignore events from modifier keys
                  if (key == KEYS.SHIFT || key == KEYS.CTRL || key == KEYS.ALT) {
                    return;
                  }

                  // Tabbing will be handled during the `keydown` phase
                  if (key == KEYS.TAB) {
                    return;
                  }

                  self.handleSearch(evt);
                }
            );
          };

          /**
           * This method will transfer the tabindex attribute from the rendered
           * selection to the search box. This allows for the search box to be used as
           * the primary focus instead of the selection container.
           *
           * @private
           */
          Search.prototype._transferTabIndex = function (decorated) {
            this.$search.attr('tabindex', this.$selection.attr('tabindex'));
            this.$selection.attr('tabindex', '-1');
          };

          Search.prototype.createPlaceholder = function (decorated, placeholder) {
            this.$search.attr('placeholder', placeholder.text);
          };

          Search.prototype.update = function (decorated, data) {
            var searchHadFocus = this.$search[0] == document.activeElement;

            this.$search.attr('placeholder', '');

            decorated.call(this, data);

            this.$selection.find('.select2-selection__rendered')
            .append(this.$searchContainer);

            this.resizeSearch();
            if (searchHadFocus) {
              this.$search.focus();
            }
          };

          Search.prototype.handleSearch = function () {
            this.resizeSearch();

            if (!this._keyUpPrevented) {
              var input = this.$search.val();

              this.trigger('query', {
                term: input
              });
            }

            this._keyUpPrevented = false;
          };

          Search.prototype.searchRemoveChoice = function (decorated, item) {
            this.trigger('unselect', {
              data: item
            });

            this.$search.val(item.text);
            this.handleSearch();
          };

          Search.prototype.resizeSearch = function () {
            this.$search.css('width', '25px');

            var width = '';

            if (this.$search.attr('placeholder') !== '') {
              width = this.$selection.find('.select2-selection__rendered').innerWidth();
            } else {
              var minimumWidth = this.$search.val().length + 1;

              width = (minimumWidth * 0.75) + 'em';
            }

            this.$search.css('width', width);
          };

          return Search;
        });

        S2.define('select2/selection/eventRelay', [
          'jquery'
        ], function ($) {
          function EventRelay() {
          }

          EventRelay.prototype.bind = function (decorated, container, $container) {
            var self = this;
            var relayEvents = [
              'open', 'opening',
              'close', 'closing',
              'select', 'selecting',
              'unselect', 'unselecting'
            ];

            var preventableEvents = ['opening', 'closing', 'selecting', 'unselecting'];

            decorated.call(this, container, $container);

            container.on('*', function (name, params) {
              // Ignore events that should not be relayed
              if ($.inArray(name, relayEvents) === -1) {
                return;
              }

              // The parameters should always be an object
              params = params || {};

              // Generate the jQuery event for the Select2 event
              var evt = $.Event('select2:' + name, {
                params: params
              });

              self.$element.trigger(evt);

              // Only handle preventable events if it was one
              if ($.inArray(name, preventableEvents) === -1) {
                return;
              }

              params.prevented = evt.isDefaultPrevented();
            });
          };

          return EventRelay;
        });

        S2.define('select2/translation', [
          'jquery',
          'require'
        ], function ($, require) {
          function Translation(dict) {
            this.dict = dict || {};
          }

          Translation.prototype.all = function () {
            return this.dict;
          };

          Translation.prototype.get = function (key) {
            return this.dict[key];
          };

          Translation.prototype.extend = function (translation) {
            this.dict = $.extend({}, translation.all(), this.dict);
          };

          // Static functions

          Translation._cache = {};

          Translation.loadPath = function (path) {
            if (!(path in Translation._cache)) {
              var translations = require(path);

              Translation._cache[path] = translations;
            }

            return new Translation(Translation._cache[path]);
          };

          return Translation;
        });

        S2.define('select2/diacritics', [], function () {
          var diacritics = {
            '\u24B6': 'A',
            '\uFF21': 'A',
            '\u00C0': 'A',
            '\u00C1': 'A',
            '\u00C2': 'A',
            '\u1EA6': 'A',
            '\u1EA4': 'A',
            '\u1EAA': 'A',
            '\u1EA8': 'A',
            '\u00C3': 'A',
            '\u0100': 'A',
            '\u0102': 'A',
            '\u1EB0': 'A',
            '\u1EAE': 'A',
            '\u1EB4': 'A',
            '\u1EB2': 'A',
            '\u0226': 'A',
            '\u01E0': 'A',
            '\u00C4': 'A',
            '\u01DE': 'A',
            '\u1EA2': 'A',
            '\u00C5': 'A',
            '\u01FA': 'A',
            '\u01CD': 'A',
            '\u0200': 'A',
            '\u0202': 'A',
            '\u1EA0': 'A',
            '\u1EAC': 'A',
            '\u1EB6': 'A',
            '\u1E00': 'A',
            '\u0104': 'A',
            '\u023A': 'A',
            '\u2C6F': 'A',
            '\uA732': 'AA',
            '\u00C6': 'AE',
            '\u01FC': 'AE',
            '\u01E2': 'AE',
            '\uA734': 'AO',
            '\uA736': 'AU',
            '\uA738': 'AV',
            '\uA73A': 'AV',
            '\uA73C': 'AY',
            '\u24B7': 'B',
            '\uFF22': 'B',
            '\u1E02': 'B',
            '\u1E04': 'B',
            '\u1E06': 'B',
            '\u0243': 'B',
            '\u0182': 'B',
            '\u0181': 'B',
            '\u24B8': 'C',
            '\uFF23': 'C',
            '\u0106': 'C',
            '\u0108': 'C',
            '\u010A': 'C',
            '\u010C': 'C',
            '\u00C7': 'C',
            '\u1E08': 'C',
            '\u0187': 'C',
            '\u023B': 'C',
            '\uA73E': 'C',
            '\u24B9': 'D',
            '\uFF24': 'D',
            '\u1E0A': 'D',
            '\u010E': 'D',
            '\u1E0C': 'D',
            '\u1E10': 'D',
            '\u1E12': 'D',
            '\u1E0E': 'D',
            '\u0110': 'D',
            '\u018B': 'D',
            '\u018A': 'D',
            '\u0189': 'D',
            '\uA779': 'D',
            '\u01F1': 'DZ',
            '\u01C4': 'DZ',
            '\u01F2': 'Dz',
            '\u01C5': 'Dz',
            '\u24BA': 'E',
            '\uFF25': 'E',
            '\u00C8': 'E',
            '\u00C9': 'E',
            '\u00CA': 'E',
            '\u1EC0': 'E',
            '\u1EBE': 'E',
            '\u1EC4': 'E',
            '\u1EC2': 'E',
            '\u1EBC': 'E',
            '\u0112': 'E',
            '\u1E14': 'E',
            '\u1E16': 'E',
            '\u0114': 'E',
            '\u0116': 'E',
            '\u00CB': 'E',
            '\u1EBA': 'E',
            '\u011A': 'E',
            '\u0204': 'E',
            '\u0206': 'E',
            '\u1EB8': 'E',
            '\u1EC6': 'E',
            '\u0228': 'E',
            '\u1E1C': 'E',
            '\u0118': 'E',
            '\u1E18': 'E',
            '\u1E1A': 'E',
            '\u0190': 'E',
            '\u018E': 'E',
            '\u24BB': 'F',
            '\uFF26': 'F',
            '\u1E1E': 'F',
            '\u0191': 'F',
            '\uA77B': 'F',
            '\u24BC': 'G',
            '\uFF27': 'G',
            '\u01F4': 'G',
            '\u011C': 'G',
            '\u1E20': 'G',
            '\u011E': 'G',
            '\u0120': 'G',
            '\u01E6': 'G',
            '\u0122': 'G',
            '\u01E4': 'G',
            '\u0193': 'G',
            '\uA7A0': 'G',
            '\uA77D': 'G',
            '\uA77E': 'G',
            '\u24BD': 'H',
            '\uFF28': 'H',
            '\u0124': 'H',
            '\u1E22': 'H',
            '\u1E26': 'H',
            '\u021E': 'H',
            '\u1E24': 'H',
            '\u1E28': 'H',
            '\u1E2A': 'H',
            '\u0126': 'H',
            '\u2C67': 'H',
            '\u2C75': 'H',
            '\uA78D': 'H',
            '\u24BE': 'I',
            '\uFF29': 'I',
            '\u00CC': 'I',
            '\u00CD': 'I',
            '\u00CE': 'I',
            '\u0128': 'I',
            '\u012A': 'I',
            '\u012C': 'I',
            '\u0130': 'I',
            '\u00CF': 'I',
            '\u1E2E': 'I',
            '\u1EC8': 'I',
            '\u01CF': 'I',
            '\u0208': 'I',
            '\u020A': 'I',
            '\u1ECA': 'I',
            '\u012E': 'I',
            '\u1E2C': 'I',
            '\u0197': 'I',
            '\u24BF': 'J',
            '\uFF2A': 'J',
            '\u0134': 'J',
            '\u0248': 'J',
            '\u24C0': 'K',
            '\uFF2B': 'K',
            '\u1E30': 'K',
            '\u01E8': 'K',
            '\u1E32': 'K',
            '\u0136': 'K',
            '\u1E34': 'K',
            '\u0198': 'K',
            '\u2C69': 'K',
            '\uA740': 'K',
            '\uA742': 'K',
            '\uA744': 'K',
            '\uA7A2': 'K',
            '\u24C1': 'L',
            '\uFF2C': 'L',
            '\u013F': 'L',
            '\u0139': 'L',
            '\u013D': 'L',
            '\u1E36': 'L',
            '\u1E38': 'L',
            '\u013B': 'L',
            '\u1E3C': 'L',
            '\u1E3A': 'L',
            '\u0141': 'L',
            '\u023D': 'L',
            '\u2C62': 'L',
            '\u2C60': 'L',
            '\uA748': 'L',
            '\uA746': 'L',
            '\uA780': 'L',
            '\u01C7': 'LJ',
            '\u01C8': 'Lj',
            '\u24C2': 'M',
            '\uFF2D': 'M',
            '\u1E3E': 'M',
            '\u1E40': 'M',
            '\u1E42': 'M',
            '\u2C6E': 'M',
            '\u019C': 'M',
            '\u24C3': 'N',
            '\uFF2E': 'N',
            '\u01F8': 'N',
            '\u0143': 'N',
            '\u00D1': 'N',
            '\u1E44': 'N',
            '\u0147': 'N',
            '\u1E46': 'N',
            '\u0145': 'N',
            '\u1E4A': 'N',
            '\u1E48': 'N',
            '\u0220': 'N',
            '\u019D': 'N',
            '\uA790': 'N',
            '\uA7A4': 'N',
            '\u01CA': 'NJ',
            '\u01CB': 'Nj',
            '\u24C4': 'O',
            '\uFF2F': 'O',
            '\u00D2': 'O',
            '\u00D3': 'O',
            '\u00D4': 'O',
            '\u1ED2': 'O',
            '\u1ED0': 'O',
            '\u1ED6': 'O',
            '\u1ED4': 'O',
            '\u00D5': 'O',
            '\u1E4C': 'O',
            '\u022C': 'O',
            '\u1E4E': 'O',
            '\u014C': 'O',
            '\u1E50': 'O',
            '\u1E52': 'O',
            '\u014E': 'O',
            '\u022E': 'O',
            '\u0230': 'O',
            '\u00D6': 'O',
            '\u022A': 'O',
            '\u1ECE': 'O',
            '\u0150': 'O',
            '\u01D1': 'O',
            '\u020C': 'O',
            '\u020E': 'O',
            '\u01A0': 'O',
            '\u1EDC': 'O',
            '\u1EDA': 'O',
            '\u1EE0': 'O',
            '\u1EDE': 'O',
            '\u1EE2': 'O',
            '\u1ECC': 'O',
            '\u1ED8': 'O',
            '\u01EA': 'O',
            '\u01EC': 'O',
            '\u00D8': 'O',
            '\u01FE': 'O',
            '\u0186': 'O',
            '\u019F': 'O',
            '\uA74A': 'O',
            '\uA74C': 'O',
            '\u01A2': 'OI',
            '\uA74E': 'OO',
            '\u0222': 'OU',
            '\u24C5': 'P',
            '\uFF30': 'P',
            '\u1E54': 'P',
            '\u1E56': 'P',
            '\u01A4': 'P',
            '\u2C63': 'P',
            '\uA750': 'P',
            '\uA752': 'P',
            '\uA754': 'P',
            '\u24C6': 'Q',
            '\uFF31': 'Q',
            '\uA756': 'Q',
            '\uA758': 'Q',
            '\u024A': 'Q',
            '\u24C7': 'R',
            '\uFF32': 'R',
            '\u0154': 'R',
            '\u1E58': 'R',
            '\u0158': 'R',
            '\u0210': 'R',
            '\u0212': 'R',
            '\u1E5A': 'R',
            '\u1E5C': 'R',
            '\u0156': 'R',
            '\u1E5E': 'R',
            '\u024C': 'R',
            '\u2C64': 'R',
            '\uA75A': 'R',
            '\uA7A6': 'R',
            '\uA782': 'R',
            '\u24C8': 'S',
            '\uFF33': 'S',
            '\u1E9E': 'S',
            '\u015A': 'S',
            '\u1E64': 'S',
            '\u015C': 'S',
            '\u1E60': 'S',
            '\u0160': 'S',
            '\u1E66': 'S',
            '\u1E62': 'S',
            '\u1E68': 'S',
            '\u0218': 'S',
            '\u015E': 'S',
            '\u2C7E': 'S',
            '\uA7A8': 'S',
            '\uA784': 'S',
            '\u24C9': 'T',
            '\uFF34': 'T',
            '\u1E6A': 'T',
            '\u0164': 'T',
            '\u1E6C': 'T',
            '\u021A': 'T',
            '\u0162': 'T',
            '\u1E70': 'T',
            '\u1E6E': 'T',
            '\u0166': 'T',
            '\u01AC': 'T',
            '\u01AE': 'T',
            '\u023E': 'T',
            '\uA786': 'T',
            '\uA728': 'TZ',
            '\u24CA': 'U',
            '\uFF35': 'U',
            '\u00D9': 'U',
            '\u00DA': 'U',
            '\u00DB': 'U',
            '\u0168': 'U',
            '\u1E78': 'U',
            '\u016A': 'U',
            '\u1E7A': 'U',
            '\u016C': 'U',
            '\u00DC': 'U',
            '\u01DB': 'U',
            '\u01D7': 'U',
            '\u01D5': 'U',
            '\u01D9': 'U',
            '\u1EE6': 'U',
            '\u016E': 'U',
            '\u0170': 'U',
            '\u01D3': 'U',
            '\u0214': 'U',
            '\u0216': 'U',
            '\u01AF': 'U',
            '\u1EEA': 'U',
            '\u1EE8': 'U',
            '\u1EEE': 'U',
            '\u1EEC': 'U',
            '\u1EF0': 'U',
            '\u1EE4': 'U',
            '\u1E72': 'U',
            '\u0172': 'U',
            '\u1E76': 'U',
            '\u1E74': 'U',
            '\u0244': 'U',
            '\u24CB': 'V',
            '\uFF36': 'V',
            '\u1E7C': 'V',
            '\u1E7E': 'V',
            '\u01B2': 'V',
            '\uA75E': 'V',
            '\u0245': 'V',
            '\uA760': 'VY',
            '\u24CC': 'W',
            '\uFF37': 'W',
            '\u1E80': 'W',
            '\u1E82': 'W',
            '\u0174': 'W',
            '\u1E86': 'W',
            '\u1E84': 'W',
            '\u1E88': 'W',
            '\u2C72': 'W',
            '\u24CD': 'X',
            '\uFF38': 'X',
            '\u1E8A': 'X',
            '\u1E8C': 'X',
            '\u24CE': 'Y',
            '\uFF39': 'Y',
            '\u1EF2': 'Y',
            '\u00DD': 'Y',
            '\u0176': 'Y',
            '\u1EF8': 'Y',
            '\u0232': 'Y',
            '\u1E8E': 'Y',
            '\u0178': 'Y',
            '\u1EF6': 'Y',
            '\u1EF4': 'Y',
            '\u01B3': 'Y',
            '\u024E': 'Y',
            '\u1EFE': 'Y',
            '\u24CF': 'Z',
            '\uFF3A': 'Z',
            '\u0179': 'Z',
            '\u1E90': 'Z',
            '\u017B': 'Z',
            '\u017D': 'Z',
            '\u1E92': 'Z',
            '\u1E94': 'Z',
            '\u01B5': 'Z',
            '\u0224': 'Z',
            '\u2C7F': 'Z',
            '\u2C6B': 'Z',
            '\uA762': 'Z',
            '\u24D0': 'a',
            '\uFF41': 'a',
            '\u1E9A': 'a',
            '\u00E0': 'a',
            '\u00E1': 'a',
            '\u00E2': 'a',
            '\u1EA7': 'a',
            '\u1EA5': 'a',
            '\u1EAB': 'a',
            '\u1EA9': 'a',
            '\u00E3': 'a',
            '\u0101': 'a',
            '\u0103': 'a',
            '\u1EB1': 'a',
            '\u1EAF': 'a',
            '\u1EB5': 'a',
            '\u1EB3': 'a',
            '\u0227': 'a',
            '\u01E1': 'a',
            '\u00E4': 'a',
            '\u01DF': 'a',
            '\u1EA3': 'a',
            '\u00E5': 'a',
            '\u01FB': 'a',
            '\u01CE': 'a',
            '\u0201': 'a',
            '\u0203': 'a',
            '\u1EA1': 'a',
            '\u1EAD': 'a',
            '\u1EB7': 'a',
            '\u1E01': 'a',
            '\u0105': 'a',
            '\u2C65': 'a',
            '\u0250': 'a',
            '\uA733': 'aa',
            '\u00E6': 'ae',
            '\u01FD': 'ae',
            '\u01E3': 'ae',
            '\uA735': 'ao',
            '\uA737': 'au',
            '\uA739': 'av',
            '\uA73B': 'av',
            '\uA73D': 'ay',
            '\u24D1': 'b',
            '\uFF42': 'b',
            '\u1E03': 'b',
            '\u1E05': 'b',
            '\u1E07': 'b',
            '\u0180': 'b',
            '\u0183': 'b',
            '\u0253': 'b',
            '\u24D2': 'c',
            '\uFF43': 'c',
            '\u0107': 'c',
            '\u0109': 'c',
            '\u010B': 'c',
            '\u010D': 'c',
            '\u00E7': 'c',
            '\u1E09': 'c',
            '\u0188': 'c',
            '\u023C': 'c',
            '\uA73F': 'c',
            '\u2184': 'c',
            '\u24D3': 'd',
            '\uFF44': 'd',
            '\u1E0B': 'd',
            '\u010F': 'd',
            '\u1E0D': 'd',
            '\u1E11': 'd',
            '\u1E13': 'd',
            '\u1E0F': 'd',
            '\u0111': 'd',
            '\u018C': 'd',
            '\u0256': 'd',
            '\u0257': 'd',
            '\uA77A': 'd',
            '\u01F3': 'dz',
            '\u01C6': 'dz',
            '\u24D4': 'e',
            '\uFF45': 'e',
            '\u00E8': 'e',
            '\u00E9': 'e',
            '\u00EA': 'e',
            '\u1EC1': 'e',
            '\u1EBF': 'e',
            '\u1EC5': 'e',
            '\u1EC3': 'e',
            '\u1EBD': 'e',
            '\u0113': 'e',
            '\u1E15': 'e',
            '\u1E17': 'e',
            '\u0115': 'e',
            '\u0117': 'e',
            '\u00EB': 'e',
            '\u1EBB': 'e',
            '\u011B': 'e',
            '\u0205': 'e',
            '\u0207': 'e',
            '\u1EB9': 'e',
            '\u1EC7': 'e',
            '\u0229': 'e',
            '\u1E1D': 'e',
            '\u0119': 'e',
            '\u1E19': 'e',
            '\u1E1B': 'e',
            '\u0247': 'e',
            '\u025B': 'e',
            '\u01DD': 'e',
            '\u24D5': 'f',
            '\uFF46': 'f',
            '\u1E1F': 'f',
            '\u0192': 'f',
            '\uA77C': 'f',
            '\u24D6': 'g',
            '\uFF47': 'g',
            '\u01F5': 'g',
            '\u011D': 'g',
            '\u1E21': 'g',
            '\u011F': 'g',
            '\u0121': 'g',
            '\u01E7': 'g',
            '\u0123': 'g',
            '\u01E5': 'g',
            '\u0260': 'g',
            '\uA7A1': 'g',
            '\u1D79': 'g',
            '\uA77F': 'g',
            '\u24D7': 'h',
            '\uFF48': 'h',
            '\u0125': 'h',
            '\u1E23': 'h',
            '\u1E27': 'h',
            '\u021F': 'h',
            '\u1E25': 'h',
            '\u1E29': 'h',
            '\u1E2B': 'h',
            '\u1E96': 'h',
            '\u0127': 'h',
            '\u2C68': 'h',
            '\u2C76': 'h',
            '\u0265': 'h',
            '\u0195': 'hv',
            '\u24D8': 'i',
            '\uFF49': 'i',
            '\u00EC': 'i',
            '\u00ED': 'i',
            '\u00EE': 'i',
            '\u0129': 'i',
            '\u012B': 'i',
            '\u012D': 'i',
            '\u00EF': 'i',
            '\u1E2F': 'i',
            '\u1EC9': 'i',
            '\u01D0': 'i',
            '\u0209': 'i',
            '\u020B': 'i',
            '\u1ECB': 'i',
            '\u012F': 'i',
            '\u1E2D': 'i',
            '\u0268': 'i',
            '\u0131': 'i',
            '\u24D9': 'j',
            '\uFF4A': 'j',
            '\u0135': 'j',
            '\u01F0': 'j',
            '\u0249': 'j',
            '\u24DA': 'k',
            '\uFF4B': 'k',
            '\u1E31': 'k',
            '\u01E9': 'k',
            '\u1E33': 'k',
            '\u0137': 'k',
            '\u1E35': 'k',
            '\u0199': 'k',
            '\u2C6A': 'k',
            '\uA741': 'k',
            '\uA743': 'k',
            '\uA745': 'k',
            '\uA7A3': 'k',
            '\u24DB': 'l',
            '\uFF4C': 'l',
            '\u0140': 'l',
            '\u013A': 'l',
            '\u013E': 'l',
            '\u1E37': 'l',
            '\u1E39': 'l',
            '\u013C': 'l',
            '\u1E3D': 'l',
            '\u1E3B': 'l',
            '\u017F': 'l',
            '\u0142': 'l',
            '\u019A': 'l',
            '\u026B': 'l',
            '\u2C61': 'l',
            '\uA749': 'l',
            '\uA781': 'l',
            '\uA747': 'l',
            '\u01C9': 'lj',
            '\u24DC': 'm',
            '\uFF4D': 'm',
            '\u1E3F': 'm',
            '\u1E41': 'm',
            '\u1E43': 'm',
            '\u0271': 'm',
            '\u026F': 'm',
            '\u24DD': 'n',
            '\uFF4E': 'n',
            '\u01F9': 'n',
            '\u0144': 'n',
            '\u00F1': 'n',
            '\u1E45': 'n',
            '\u0148': 'n',
            '\u1E47': 'n',
            '\u0146': 'n',
            '\u1E4B': 'n',
            '\u1E49': 'n',
            '\u019E': 'n',
            '\u0272': 'n',
            '\u0149': 'n',
            '\uA791': 'n',
            '\uA7A5': 'n',
            '\u01CC': 'nj',
            '\u24DE': 'o',
            '\uFF4F': 'o',
            '\u00F2': 'o',
            '\u00F3': 'o',
            '\u00F4': 'o',
            '\u1ED3': 'o',
            '\u1ED1': 'o',
            '\u1ED7': 'o',
            '\u1ED5': 'o',
            '\u00F5': 'o',
            '\u1E4D': 'o',
            '\u022D': 'o',
            '\u1E4F': 'o',
            '\u014D': 'o',
            '\u1E51': 'o',
            '\u1E53': 'o',
            '\u014F': 'o',
            '\u022F': 'o',
            '\u0231': 'o',
            '\u00F6': 'o',
            '\u022B': 'o',
            '\u1ECF': 'o',
            '\u0151': 'o',
            '\u01D2': 'o',
            '\u020D': 'o',
            '\u020F': 'o',
            '\u01A1': 'o',
            '\u1EDD': 'o',
            '\u1EDB': 'o',
            '\u1EE1': 'o',
            '\u1EDF': 'o',
            '\u1EE3': 'o',
            '\u1ECD': 'o',
            '\u1ED9': 'o',
            '\u01EB': 'o',
            '\u01ED': 'o',
            '\u00F8': 'o',
            '\u01FF': 'o',
            '\u0254': 'o',
            '\uA74B': 'o',
            '\uA74D': 'o',
            '\u0275': 'o',
            '\u01A3': 'oi',
            '\u0223': 'ou',
            '\uA74F': 'oo',
            '\u24DF': 'p',
            '\uFF50': 'p',
            '\u1E55': 'p',
            '\u1E57': 'p',
            '\u01A5': 'p',
            '\u1D7D': 'p',
            '\uA751': 'p',
            '\uA753': 'p',
            '\uA755': 'p',
            '\u24E0': 'q',
            '\uFF51': 'q',
            '\u024B': 'q',
            '\uA757': 'q',
            '\uA759': 'q',
            '\u24E1': 'r',
            '\uFF52': 'r',
            '\u0155': 'r',
            '\u1E59': 'r',
            '\u0159': 'r',
            '\u0211': 'r',
            '\u0213': 'r',
            '\u1E5B': 'r',
            '\u1E5D': 'r',
            '\u0157': 'r',
            '\u1E5F': 'r',
            '\u024D': 'r',
            '\u027D': 'r',
            '\uA75B': 'r',
            '\uA7A7': 'r',
            '\uA783': 'r',
            '\u24E2': 's',
            '\uFF53': 's',
            '\u00DF': 's',
            '\u015B': 's',
            '\u1E65': 's',
            '\u015D': 's',
            '\u1E61': 's',
            '\u0161': 's',
            '\u1E67': 's',
            '\u1E63': 's',
            '\u1E69': 's',
            '\u0219': 's',
            '\u015F': 's',
            '\u023F': 's',
            '\uA7A9': 's',
            '\uA785': 's',
            '\u1E9B': 's',
            '\u24E3': 't',
            '\uFF54': 't',
            '\u1E6B': 't',
            '\u1E97': 't',
            '\u0165': 't',
            '\u1E6D': 't',
            '\u021B': 't',
            '\u0163': 't',
            '\u1E71': 't',
            '\u1E6F': 't',
            '\u0167': 't',
            '\u01AD': 't',
            '\u0288': 't',
            '\u2C66': 't',
            '\uA787': 't',
            '\uA729': 'tz',
            '\u24E4': 'u',
            '\uFF55': 'u',
            '\u00F9': 'u',
            '\u00FA': 'u',
            '\u00FB': 'u',
            '\u0169': 'u',
            '\u1E79': 'u',
            '\u016B': 'u',
            '\u1E7B': 'u',
            '\u016D': 'u',
            '\u00FC': 'u',
            '\u01DC': 'u',
            '\u01D8': 'u',
            '\u01D6': 'u',
            '\u01DA': 'u',
            '\u1EE7': 'u',
            '\u016F': 'u',
            '\u0171': 'u',
            '\u01D4': 'u',
            '\u0215': 'u',
            '\u0217': 'u',
            '\u01B0': 'u',
            '\u1EEB': 'u',
            '\u1EE9': 'u',
            '\u1EEF': 'u',
            '\u1EED': 'u',
            '\u1EF1': 'u',
            '\u1EE5': 'u',
            '\u1E73': 'u',
            '\u0173': 'u',
            '\u1E77': 'u',
            '\u1E75': 'u',
            '\u0289': 'u',
            '\u24E5': 'v',
            '\uFF56': 'v',
            '\u1E7D': 'v',
            '\u1E7F': 'v',
            '\u028B': 'v',
            '\uA75F': 'v',
            '\u028C': 'v',
            '\uA761': 'vy',
            '\u24E6': 'w',
            '\uFF57': 'w',
            '\u1E81': 'w',
            '\u1E83': 'w',
            '\u0175': 'w',
            '\u1E87': 'w',
            '\u1E85': 'w',
            '\u1E98': 'w',
            '\u1E89': 'w',
            '\u2C73': 'w',
            '\u24E7': 'x',
            '\uFF58': 'x',
            '\u1E8B': 'x',
            '\u1E8D': 'x',
            '\u24E8': 'y',
            '\uFF59': 'y',
            '\u1EF3': 'y',
            '\u00FD': 'y',
            '\u0177': 'y',
            '\u1EF9': 'y',
            '\u0233': 'y',
            '\u1E8F': 'y',
            '\u00FF': 'y',
            '\u1EF7': 'y',
            '\u1E99': 'y',
            '\u1EF5': 'y',
            '\u01B4': 'y',
            '\u024F': 'y',
            '\u1EFF': 'y',
            '\u24E9': 'z',
            '\uFF5A': 'z',
            '\u017A': 'z',
            '\u1E91': 'z',
            '\u017C': 'z',
            '\u017E': 'z',
            '\u1E93': 'z',
            '\u1E95': 'z',
            '\u01B6': 'z',
            '\u0225': 'z',
            '\u0240': 'z',
            '\u2C6C': 'z',
            '\uA763': 'z',
            '\u0386': '\u0391',
            '\u0388': '\u0395',
            '\u0389': '\u0397',
            '\u038A': '\u0399',
            '\u03AA': '\u0399',
            '\u038C': '\u039F',
            '\u038E': '\u03A5',
            '\u03AB': '\u03A5',
            '\u038F': '\u03A9',
            '\u03AC': '\u03B1',
            '\u03AD': '\u03B5',
            '\u03AE': '\u03B7',
            '\u03AF': '\u03B9',
            '\u03CA': '\u03B9',
            '\u0390': '\u03B9',
            '\u03CC': '\u03BF',
            '\u03CD': '\u03C5',
            '\u03CB': '\u03C5',
            '\u03B0': '\u03C5',
            '\u03C9': '\u03C9',
            '\u03C2': '\u03C3'
          };

          return diacritics;
        });

        S2.define('select2/data/base', [
          '../utils'
        ], function (Utils) {
          function BaseAdapter($element, options) {
            BaseAdapter.__super__.constructor.call(this);
          }

          Utils.Extend(BaseAdapter, Utils.Observable);

          BaseAdapter.prototype.current = function (callback) {
            throw new Error('The `current` method must be defined in child classes.');
          };

          BaseAdapter.prototype.query = function (params, callback) {
            throw new Error('The `query` method must be defined in child classes.');
          };

          BaseAdapter.prototype.bind = function (container, $container) {
            // Can be implemented in subclasses
          };

          BaseAdapter.prototype.destroy = function () {
            // Can be implemented in subclasses
          };

          BaseAdapter.prototype.generateResultId = function (container, data) {
            var id = container.id + '-result-';

            id += Utils.generateChars(4);

            if (data.id != null) {
              id += '-' + data.id.toString();
            } else {
              id += '-' + Utils.generateChars(4);
            }
            return id;
          };

          return BaseAdapter;
        });

        S2.define('select2/data/select', [
          './base',
          '../utils',
          'jquery'
        ], function (BaseAdapter, Utils, $) {
          function SelectAdapter($element, options) {
            this.$element = $element;
            this.options = options;

            SelectAdapter.__super__.constructor.call(this);
          }

          Utils.Extend(SelectAdapter, BaseAdapter);

          SelectAdapter.prototype.current = function (callback) {
            var data = [];
            var self = this;

            this.$element.find(':selected').each(function () {
              var $option = $(this);

              var option = self.item($option);

              data.push(option);
            });

            callback(data);
          };

          SelectAdapter.prototype.select = function (data) {
            var self = this;

            data.selected = true;

            // If data.element is a DOM node, use it instead
            if ($(data.element).is('option')) {
              data.element.selected = true;

              this.$element.trigger('change');

              return;
            }

            if (this.$element.prop('multiple')) {
              this.current(function (currentData) {
                var val = [];

                data = [data];
                data.push.apply(data, currentData);

                for (var d = 0; d < data.length; d++) {
                  var id = data[d].id;

                  if ($.inArray(id, val) === -1) {
                    val.push(id);
                  }
                }

                self.$element.val(val);
                self.$element.trigger('change');
              });
            } else {
              var val = data.id;

              this.$element.val(val);
              this.$element.trigger('change');
            }
          };

          SelectAdapter.prototype.unselect = function (data) {
            var self = this;

            if (!this.$element.prop('multiple')) {
              return;
            }

            data.selected = false;

            if ($(data.element).is('option')) {
              data.element.selected = false;

              this.$element.trigger('change');

              return;
            }

            this.current(function (currentData) {
              var val = [];

              for (var d = 0; d < currentData.length; d++) {
                var id = currentData[d].id;

                if (id !== data.id && $.inArray(id, val) === -1) {
                  val.push(id);
                }
              }

              self.$element.val(val);

              self.$element.trigger('change');
            });
          };

          SelectAdapter.prototype.bind = function (container, $container) {
            var self = this;

            this.container = container;

            container.on('select', function (params) {
              self.select(params.data);
            });

            container.on('unselect', function (params) {
              self.unselect(params.data);
            });
          };

          SelectAdapter.prototype.destroy = function () {
            // Remove anything added to child elements
            this.$element.find('*').each(function () {
              // Remove any custom data set by Select2
              $.removeData(this, 'data');
            });
          };

          SelectAdapter.prototype.query = function (params, callback) {
            var data = [];
            var self = this;

            var $options = this.$element.children();

            $options.each(function () {
              var $option = $(this);

              if (!$option.is('option') && !$option.is('optgroup')) {
                return;
              }

              var option = self.item($option);

              var matches = self.matches(params, option);

              if (matches !== null) {
                data.push(matches);
              }
            });

            callback({
              results: data
            });
          };

          SelectAdapter.prototype.addOptions = function ($options) {
            Utils.appendMany(this.$element, $options);
          };

          SelectAdapter.prototype.option = function (data) {
            var option;

            if (data.children) {
              option = document.createElement('optgroup');
              option.label = data.text;
            } else {
              option = document.createElement('option');

              if (option.textContent !== undefined) {
                option.textContent = data.text;
              } else {
                option.innerText = data.text;
              }
            }

            if (data.id) {
              option.value = data.id;
            }

            if (data.disabled) {
              option.disabled = true;
            }

            if (data.selected) {
              option.selected = true;
            }

            if (data.title) {
              option.title = data.title;
            }

            var $option = $(option);

            var normalizedData = this._normalizeItem(data);
            normalizedData.element = option;

            // Override the option's data with the combined data
            $.data(option, 'data', normalizedData);

            return $option;
          };

          SelectAdapter.prototype.item = function ($option) {
            var data = {};

            data = $.data($option[0], 'data');

            if (data != null) {
              return data;
            }

            if ($option.is('option')) {
              data = {
                id: $option.val(),
                text: $option.text(),
                disabled: $option.prop('disabled'),
                selected: $option.prop('selected'),
                title: $option.prop('title')
              };
            } else if ($option.is('optgroup')) {
              data = {
                text: $option.prop('label'),
                children: [],
                title: $option.prop('title')
              };

              var $children = $option.children('option');
              var children = [];

              for (var c = 0; c < $children.length; c++) {
                var $child = $($children[c]);

                var child = this.item($child);

                children.push(child);
              }

              data.children = children;
            }

            data = this._normalizeItem(data);
            data.element = $option[0];

            $.data($option[0], 'data', data);

            return data;
          };

          SelectAdapter.prototype._normalizeItem = function (item) {
            if (!$.isPlainObject(item)) {
              item = {
                id: item,
                text: item
              };
            }

            item = $.extend({}, {
              text: ''
            }, item);

            var defaults = {
              selected: false,
              disabled: false
            };

            if (item.id != null) {
              item.id = item.id.toString();
            }

            if (item.text != null) {
              item.text = item.text.toString();
            }

            if (item._resultId == null && item.id && this.container != null) {
              item._resultId = this.generateResultId(this.container, item);
            }

            return $.extend({}, defaults, item);
          };

          SelectAdapter.prototype.matches = function (params, data) {
            var matcher = this.options.get('matcher');

            return matcher(params, data);
          };

          return SelectAdapter;
        });

        S2.define('select2/data/array', [
          './select',
          '../utils',
          'jquery'
        ], function (SelectAdapter, Utils, $) {
          function ArrayAdapter($element, options) {
            var data = options.get('data') || [];

            ArrayAdapter.__super__.constructor.call(this, $element, options);

            this.addOptions(this.convertToOptions(data));
          }

          Utils.Extend(ArrayAdapter, SelectAdapter);

          ArrayAdapter.prototype.select = function (data) {
            var $option = this.$element.find('option').filter(function (i, elm) {
              return elm.value == data.id.toString();
            });

            if ($option.length === 0) {
              $option = this.option(data);

              this.addOptions($option);
            }

            ArrayAdapter.__super__.select.call(this, data);
          };

          ArrayAdapter.prototype.convertToOptions = function (data) {
            var self = this;

            var $existing = this.$element.find('option');
            var existingIds = $existing.map(function () {
              return self.item($(this)).id;
            }).get();

            var $options = [];

            // Filter out all items except for the one passed in the argument
            function onlyItem(item) {
              return function () {
                return $(this).val() == item.id;
              };
            }

            for (var d = 0; d < data.length; d++) {
              var item = this._normalizeItem(data[d]);

              // Skip items which were pre-loaded, only merge the data
              if ($.inArray(item.id, existingIds) >= 0) {
                var $existingOption = $existing.filter(onlyItem(item));

                var existingData = this.item($existingOption);
                var newData = $.extend(true, {}, item, existingData);

                var $newOption = this.option(newData);

                $existingOption.replaceWith($newOption);

                continue;
              }

              var $option = this.option(item);

              if (item.children) {
                var $children = this.convertToOptions(item.children);

                Utils.appendMany($option, $children);
              }

              $options.push($option);
            }

            return $options;
          };

          return ArrayAdapter;
        });

        S2.define('select2/data/ajax', [
          './array',
          '../utils',
          'jquery'
        ], function (ArrayAdapter, Utils, $) {
          function AjaxAdapter($element, options) {
            this.ajaxOptions = this._applyDefaults(options.get('ajax'));

            if (this.ajaxOptions.processResults != null) {
              this.processResults = this.ajaxOptions.processResults;
            }

            AjaxAdapter.__super__.constructor.call(this, $element, options);
          }

          Utils.Extend(AjaxAdapter, ArrayAdapter);

          AjaxAdapter.prototype._applyDefaults = function (options) {
            var defaults = {
              data: function (params) {
                return $.extend({}, params, {
                  q: params.term
                });
              },
              transport: function (params, success, failure) {
                var $request = $.ajax(params);

                $request.then(success);
                $request.fail(failure);

                return $request;
              }
            };

            return $.extend({}, defaults, options, true);
          };

          AjaxAdapter.prototype.processResults = function (results) {
            return results;
          };

          AjaxAdapter.prototype.query = function (params, callback) {
            var matches = [];
            var self = this;

            if (this._request != null) {
              // JSONP requests cannot always be aborted
              if ($.isFunction(this._request.abort)) {
                this._request.abort();
              }

              this._request = null;
            }

            var options = $.extend({
              type: 'GET'
            }, this.ajaxOptions);

            if (typeof options.url === 'function') {
              options.url = options.url.call(this.$element, params);
            }

            if (typeof options.data === 'function') {
              options.data = options.data.call(this.$element, params);
            }

            function request() {
              var $request = options.transport(options, function (data) {
                var results = self.processResults(data, params);

                if (self.options.get('debug') && window.console && console.error) {
                  // Check to make sure that the response included a `results` key.
                  if (!results || !results.results || !$.isArray(results.results)) {
                    console.error(
                        'Select2: The AJAX results did not return an array in the ' +
                        '`results` key of the response.'
                    );
                  }
                }

                callback(results);
              }, function () {
                // Attempt to detect if a request was aborted
                // Only works if the transport exposes a status property
                if ($request.status && $request.status === '0') {
                  return;
                }

                self.trigger('results:message', {
                  message: 'errorLoading'
                });
              });

              self._request = $request;
            }

            if (this.ajaxOptions.delay && params.term != null) {
              if (this._queryTimeout) {
                window.clearTimeout(this._queryTimeout);
              }

              this._queryTimeout = window.setTimeout(request, this.ajaxOptions.delay);
            } else {
              request();
            }
          };

          return AjaxAdapter;
        });

        S2.define('select2/data/tags', [
          'jquery'
        ], function ($) {
          function Tags(decorated, $element, options) {
            var tags = options.get('tags');

            var createTag = options.get('createTag');

            if (createTag !== undefined) {
              this.createTag = createTag;
            }

            var insertTag = options.get('insertTag');

            if (insertTag !== undefined) {
              this.insertTag = insertTag;
            }

            decorated.call(this, $element, options);

            if ($.isArray(tags)) {
              for (var t = 0; t < tags.length; t++) {
                var tag = tags[t];
                var item = this._normalizeItem(tag);

                var $option = this.option(item);

                this.$element.append($option);
              }
            }
          }

          Tags.prototype.query = function (decorated, params, callback) {
            var self = this;

            this._removeOldTags();

            if (params.term == null || params.page != null) {
              decorated.call(this, params, callback);
              return;
            }

            function wrapper(obj, child) {
              var data = obj.results;

              for (var i = 0; i < data.length; i++) {
                var option = data[i];

                var checkChildren = (
                    option.children != null && !wrapper({
                      results: option.children
                    }, true)
                );

                var checkText = option.text === params.term;

                if (checkText || checkChildren) {
                  if (child) {
                    return false;
                  }

                  obj.data = data;
                  callback(obj);

                  return;
                }
              }

              if (child) {
                return true;
              }

              var tag = self.createTag(params);

              if (tag != null) {
                var $option = self.option(tag);
                $option.attr('data-select2-tag', true);

                self.addOptions([$option]);

                self.insertTag(data, tag);
              }

              obj.results = data;

              callback(obj);
            }

            decorated.call(this, params, wrapper);
          };

          Tags.prototype.createTag = function (decorated, params) {
            var term = $.trim(params.term);

            if (term === '') {
              return null;
            }

            return {
              id: term,
              text: term
            };
          };

          Tags.prototype.insertTag = function (_, data, tag) {
            data.unshift(tag);
          };

          Tags.prototype._removeOldTags = function (_) {
            var tag = this._lastTag;

            var $options = this.$element.find('option[data-select2-tag]');

            $options.each(function () {
              if (this.selected) {
                return;
              }

              $(this).remove();
            });
          };

          return Tags;
        });

        S2.define('select2/data/tokenizer', [
          'jquery'
        ], function ($) {
          function Tokenizer(decorated, $element, options) {
            var tokenizer = options.get('tokenizer');

            if (tokenizer !== undefined) {
              this.tokenizer = tokenizer;
            }

            decorated.call(this, $element, options);
          }

          Tokenizer.prototype.bind = function (decorated, container, $container) {
            decorated.call(this, container, $container);

            this.$search = container.dropdown.$search || container.selection.$search ||
                $container.find('.select2-search__field');
          };

          Tokenizer.prototype.query = function (decorated, params, callback) {
            var self = this;

            function createAndSelect(data) {
              // Normalize the data object so we can use it for checks
              var item = self._normalizeItem(data);

              // Check if the data object already exists as a tag
              // Select it if it doesn't
              var $existingOptions = self.$element.find('option').filter(function () {
                return $(this).val() === item.id;
              });

              // If an existing option wasn't found for it, create the option
              if (!$existingOptions.length) {
                var $option = self.option(item);
                $option.attr('data-select2-tag', true);

                self._removeOldTags();
                self.addOptions([$option]);
              }

              // Select the item, now that we know there is an option for it
              select(item);
            }

            function select(data) {
              self.trigger('select', {
                data: data
              });
            }

            params.term = params.term || '';

            var tokenData = this.tokenizer(params, this.options, createAndSelect);

            if (tokenData.term !== params.term) {
              // Replace the search term if we have the search box
              if (this.$search.length) {
                this.$search.val(tokenData.term);
                this.$search.focus();
              }

              params.term = tokenData.term;
            }

            decorated.call(this, params, callback);
          };

          Tokenizer.prototype.tokenizer = function (_, params, options, callback) {
            var separators = options.get('tokenSeparators') || [];
            var term = params.term;
            var i = 0;

            var createTag = this.createTag || function (params) {
              return {
                id: params.term,
                text: params.term
              };
            };

            while (i < term.length) {
              var termChar = term[i];

              if ($.inArray(termChar, separators) === -1) {
                i++;

                continue;
              }

              var part = term.substr(0, i);
              var partParams = $.extend({}, params, {
                term: part
              });

              var data = createTag(partParams);

              if (data == null) {
                i++;
                continue;
              }

              callback(data);

              // Reset the term to not include the tokenized portion
              term = term.substr(i + 1) || '';
              i = 0;
            }

            return {
              term: term
            };
          };

          return Tokenizer;
        });

        S2.define('select2/data/minimumInputLength', [], function () {
          function MinimumInputLength(decorated, $e, options) {
            this.minimumInputLength = options.get('minimumInputLength');

            decorated.call(this, $e, options);
          }

          MinimumInputLength.prototype.query = function (decorated, params, callback) {
            params.term = params.term || '';

            if (params.term.length < this.minimumInputLength) {
              this.trigger('results:message', {
                message: 'inputTooShort',
                args: {
                  minimum: this.minimumInputLength,
                  input: params.term,
                  params: params
                }
              });

              return;
            }

            decorated.call(this, params, callback);
          };

          return MinimumInputLength;
        });

        S2.define('select2/data/maximumInputLength', [], function () {
          function MaximumInputLength(decorated, $e, options) {
            this.maximumInputLength = options.get('maximumInputLength');

            decorated.call(this, $e, options);
          }

          MaximumInputLength.prototype.query = function (decorated, params, callback) {
            params.term = params.term || '';

            if (this.maximumInputLength > 0 &&
                params.term.length > this.maximumInputLength) {
              this.trigger('results:message', {
                message: 'inputTooLong',
                args: {
                  maximum: this.maximumInputLength,
                  input: params.term,
                  params: params
                }
              });

              return;
            }

            decorated.call(this, params, callback);
          };

          return MaximumInputLength;
        });

        S2.define('select2/data/maximumSelectionLength', [], function () {
          function MaximumSelectionLength(decorated, $e, options) {
            this.maximumSelectionLength = options.get('maximumSelectionLength');

            decorated.call(this, $e, options);
          }

          MaximumSelectionLength.prototype.query =
              function (decorated, params, callback) {
                var self = this;

                this.current(function (currentData) {
                  var count = currentData != null ? currentData.length : 0;
                  if (self.maximumSelectionLength > 0 &&
                      count >= self.maximumSelectionLength) {
                    self.trigger('results:message', {
                      message: 'maximumSelected',
                      args: {
                        maximum: self.maximumSelectionLength
                      }
                    });
                    return;
                  }
                  decorated.call(self, params, callback);
                });
              };

          return MaximumSelectionLength;
        });

        S2.define('select2/dropdown', [
          'jquery',
          './utils'
        ], function ($, Utils) {
          function Dropdown($element, options) {
            this.$element = $element;
            this.options = options;

            Dropdown.__super__.constructor.call(this);
          }

          Utils.Extend(Dropdown, Utils.Observable);

          Dropdown.prototype.render = function () {
            var $dropdown = $(
                '<span class="select2-dropdown">' +
                '<span class="select2-results"></span>' +
                '</span>'
            );

            $dropdown.attr('dir', this.options.get('dir'));

            this.$dropdown = $dropdown;

            return $dropdown;
          };

          Dropdown.prototype.bind = function () {
            // Should be implemented in subclasses
          };

          Dropdown.prototype.position = function ($dropdown, $container) {
            // Should be implmented in subclasses
          };

          Dropdown.prototype.destroy = function () {
            // Remove the dropdown from the DOM
            this.$dropdown.remove();
          };

          return Dropdown;
        });

        S2.define('select2/dropdown/search', [
          'jquery',
          '../utils'
        ], function ($, Utils) {
          function Search() {
          }

          Search.prototype.render = function (decorated) {
            var $rendered = decorated.call(this);

            var $search = $(
                '<span class="select2-search select2-search--dropdown">' +
                '<input class="select2-search__field" type="search" tabindex="-1"' +
                ' autocomplete="off" autocorrect="off" autocapitalize="off"' +
                ' spellcheck="false" role="textbox" />' +
                '</span>'
            );

            this.$searchContainer = $search;
            this.$search = $search.find('input');

            $rendered.prepend($search);

            return $rendered;
          };

          Search.prototype.bind = function (decorated, container, $container) {
            var self = this;

            decorated.call(this, container, $container);

            this.$search.on('keydown', function (evt) {
              self.trigger('keypress', evt);

              self._keyUpPrevented = evt.isDefaultPrevented();
            });

            // Workaround for browsers which do not support the `input` event
            // This will prevent double-triggering of events for browsers which support
            // both the `keyup` and `input` events.
            this.$search.on('input', function (evt) {
              // Unbind the duplicated `keyup` event
              $(this).off('keyup');
            });

            this.$search.on('keyup input', function (evt) {
              self.handleSearch(evt);
            });

            container.on('open', function () {
              self.$search.attr('tabindex', 0);

              self.$search.focus();

              window.setTimeout(function () {
                self.$search.focus();
              }, 0);
            });

            container.on('close', function () {
              self.$search.attr('tabindex', -1);

              self.$search.val('');
            });

            container.on('focus', function () {
              if (container.isOpen()) {
                self.$search.focus();
              }
            });

            container.on('results:all', function (params) {
              if (params.query.term == null || params.query.term === '') {
                var showSearch = self.showSearch(params);

                if (showSearch) {
                  self.$searchContainer.removeClass('select2-search--hide');
                } else {
                  self.$searchContainer.addClass('select2-search--hide');
                }
              }
            });
          };

          Search.prototype.handleSearch = function (evt) {
            if (!this._keyUpPrevented) {
              var input = this.$search.val();

              this.trigger('query', {
                term: input
              });
            }

            this._keyUpPrevented = false;
          };

          Search.prototype.showSearch = function (_, params) {
            return true;
          };

          return Search;
        });

        S2.define('select2/dropdown/hidePlaceholder', [], function () {
          function HidePlaceholder(decorated, $element, options, dataAdapter) {
            this.placeholder = this.normalizePlaceholder(options.get('placeholder'));

            decorated.call(this, $element, options, dataAdapter);
          }

          HidePlaceholder.prototype.append = function (decorated, data) {
            data.results = this.removePlaceholder(data.results);

            decorated.call(this, data);
          };

          HidePlaceholder.prototype.normalizePlaceholder = function (_, placeholder) {
            if (typeof placeholder === 'string') {
              placeholder = {
                id: '',
                text: placeholder
              };
            }

            return placeholder;
          };

          HidePlaceholder.prototype.removePlaceholder = function (_, data) {
            var modifiedData = data.slice(0);

            for (var d = data.length - 1; d >= 0; d--) {
              var item = data[d];

              if (this.placeholder.id === item.id) {
                modifiedData.splice(d, 1);
              }
            }

            return modifiedData;
          };

          return HidePlaceholder;
        });

        S2.define('select2/dropdown/infiniteScroll', [
          'jquery'
        ], function ($) {
          function InfiniteScroll(decorated, $element, options, dataAdapter) {
            this.lastParams = {};

            decorated.call(this, $element, options, dataAdapter);

            this.$loadingMore = this.createLoadingMore();
            this.loading = false;
          }

          InfiniteScroll.prototype.append = function (decorated, data) {
            this.$loadingMore.remove();
            this.loading = false;

            decorated.call(this, data);

            if (this.showLoadingMore(data)) {
              this.$results.append(this.$loadingMore);
            }
          };

          InfiniteScroll.prototype.bind = function (decorated, container, $container) {
            var self = this;

            decorated.call(this, container, $container);

            container.on('query', function (params) {
              self.lastParams = params;
              self.loading = true;
            });

            container.on('query:append', function (params) {
              self.lastParams = params;
              self.loading = true;
            });

            this.$results.on('scroll', function () {
              var isLoadMoreVisible = $.contains(
                  document.documentElement,
                  self.$loadingMore[0]
              );

              if (self.loading || !isLoadMoreVisible) {
                return;
              }

              var currentOffset = self.$results.offset().top +
                  self.$results.outerHeight(false);
              var loadingMoreOffset = self.$loadingMore.offset().top +
                  self.$loadingMore.outerHeight(false);

              if (currentOffset + 50 >= loadingMoreOffset) {
                self.loadMore();
              }
            });
          };

          InfiniteScroll.prototype.loadMore = function () {
            this.loading = true;

            var params = $.extend({}, {page: 1}, this.lastParams);

            params.page++;

            this.trigger('query:append', params);
          };

          InfiniteScroll.prototype.showLoadingMore = function (_, data) {
            return data.pagination && data.pagination.more;
          };

          InfiniteScroll.prototype.createLoadingMore = function () {
            var $option = $(
                '<li ' +
                'class="select2-results__option select2-results__option--load-more"' +
                'role="treeitem" aria-disabled="true"></li>'
            );

            var message = this.options.get('translations').get('loadingMore');

            $option.html(message(this.lastParams));

            return $option;
          };

          return InfiniteScroll;
        });

        S2.define('select2/dropdown/attachBody', [
          'jquery',
          '../utils'
        ], function ($, Utils) {
          function AttachBody(decorated, $element, options) {
            this.$dropdownParent = options.get('dropdownParent') || $(document.body);

            decorated.call(this, $element, options);
          }

          AttachBody.prototype.bind = function (decorated, container, $container) {
            var self = this;

            var setupResultsEvents = false;

            decorated.call(this, container, $container);

            container.on('open', function () {
              self._showDropdown();
              self._attachPositioningHandler(container);

              if (!setupResultsEvents) {
                setupResultsEvents = true;

                container.on('results:all', function () {
                  self._positionDropdown();
                  self._resizeDropdown();
                });

                container.on('results:append', function () {
                  self._positionDropdown();
                  self._resizeDropdown();
                });
              }
            });

            container.on('close', function () {
              self._hideDropdown();
              self._detachPositioningHandler(container);
            });

            this.$dropdownContainer.on('mousedown', function (evt) {
              evt.stopPropagation();
            });
          };

          AttachBody.prototype.destroy = function (decorated) {
            decorated.call(this);

            this.$dropdownContainer.remove();
          };

          AttachBody.prototype.position = function (decorated, $dropdown, $container) {
            // Clone all of the container classes
            $dropdown.attr('class', $container.attr('class'));

            $dropdown.removeClass('select2');
            $dropdown.addClass('select2-container--open');

            $dropdown.css({
              position: 'absolute',
              top: -999999
            });

            this.$container = $container;
          };

          AttachBody.prototype.render = function (decorated) {
            var $container = $('<span></span>');

            var $dropdown = decorated.call(this);
            $container.append($dropdown);

            this.$dropdownContainer = $container;

            return $container;
          };

          AttachBody.prototype._hideDropdown = function (decorated) {
            this.$dropdownContainer.detach();
          };

          AttachBody.prototype._attachPositioningHandler =
              function (decorated, container) {
                var self = this;

                var scrollEvent = 'scroll.select2.' + container.id;
                var resizeEvent = 'resize.select2.' + container.id;
                var orientationEvent = 'orientationchange.select2.' + container.id;

                var $watchers = this.$container.parents().filter(Utils.hasScroll);
                $watchers.each(function () {
                  $(this).data('select2-scroll-position', {
                    x: $(this).scrollLeft(),
                    y: $(this).scrollTop()
                  });
                });

                $watchers.on(scrollEvent, function (ev) {
                  var position = $(this).data('select2-scroll-position');
                  $(this).scrollTop(position.y);
                });

                $(window).on(scrollEvent + ' ' + resizeEvent + ' ' + orientationEvent,
                    function (e) {
                      self._positionDropdown();
                      self._resizeDropdown();
                    });
              };

          AttachBody.prototype._detachPositioningHandler =
              function (decorated, container) {
                var scrollEvent = 'scroll.select2.' + container.id;
                var resizeEvent = 'resize.select2.' + container.id;
                var orientationEvent = 'orientationchange.select2.' + container.id;

                var $watchers = this.$container.parents().filter(Utils.hasScroll);
                $watchers.off(scrollEvent);

                $(window).off(scrollEvent + ' ' + resizeEvent + ' ' + orientationEvent);
              };

          AttachBody.prototype._positionDropdown = function () {
            var $window = $(window);

            var isCurrentlyAbove = this.$dropdown.hasClass('select2-dropdown--above');
            var isCurrentlyBelow = this.$dropdown.hasClass('select2-dropdown--below');

            var newDirection = null;

            var offset = this.$container.offset();

            offset.bottom = offset.top + this.$container.outerHeight(false);

            var container = {
              height: this.$container.outerHeight(false)
            };

            container.top = offset.top;
            container.bottom = offset.top + container.height;

            var dropdown = {
              height: this.$dropdown.outerHeight(false)
            };

            var viewport = {
              top: $window.scrollTop(),
              bottom: $window.scrollTop() + $window.height()
            };

            var enoughRoomAbove = viewport.top < (offset.top - dropdown.height);
            var enoughRoomBelow = viewport.bottom > (offset.bottom + dropdown.height);

            var css = {
              left: offset.left,
              top: container.bottom
            };

            // Determine what the parent element is to use for calciulating the offset
            var $offsetParent = this.$dropdownParent;

            // For statically positoned elements, we need to get the element
            // that is determining the offset
            if ($offsetParent.css('position') === 'static') {
              $offsetParent = $offsetParent.offsetParent();
            }

            var parentOffset = $offsetParent.offset();

            css.top -= parentOffset.top;
            css.left -= parentOffset.left;

            if (!isCurrentlyAbove && !isCurrentlyBelow) {
              newDirection = 'below';
            }

            if (!enoughRoomBelow && enoughRoomAbove && !isCurrentlyAbove) {
              newDirection = 'above';
            } else if (!enoughRoomAbove && enoughRoomBelow && isCurrentlyAbove) {
              newDirection = 'below';
            }

            if (newDirection == 'above' ||
                (isCurrentlyAbove && newDirection !== 'below')) {
              css.top = container.top - parentOffset.top - dropdown.height;
            }

            if (newDirection != null) {
              this.$dropdown
              .removeClass('select2-dropdown--below select2-dropdown--above')
              .addClass('select2-dropdown--' + newDirection);
              this.$container
              .removeClass('select2-container--below select2-container--above')
              .addClass('select2-container--' + newDirection);
            }

            this.$dropdownContainer.css(css);
          };

          AttachBody.prototype._resizeDropdown = function () {
            var css = {
              width: this.$container.outerWidth(false) + 'px'
            };

            if (this.options.get('dropdownAutoWidth')) {
              css.minWidth = css.width;
              css.position = 'relative';
              css.width = 'auto';
            }

            this.$dropdown.css(css);
          };

          AttachBody.prototype._showDropdown = function (decorated) {
            this.$dropdownContainer.appendTo(this.$dropdownParent);

            this._positionDropdown();
            this._resizeDropdown();
          };

          return AttachBody;
        });

        S2.define('select2/dropdown/minimumResultsForSearch', [], function () {
          function countResults(data) {
            var count = 0;

            for (var d = 0; d < data.length; d++) {
              var item = data[d];

              if (item.children) {
                count += countResults(item.children);
              } else {
                count++;
              }
            }

            return count;
          }

          function MinimumResultsForSearch(decorated, $element, options, dataAdapter) {
            this.minimumResultsForSearch = options.get('minimumResultsForSearch');

            if (this.minimumResultsForSearch < 0) {
              this.minimumResultsForSearch = Infinity;
            }

            decorated.call(this, $element, options, dataAdapter);
          }

          MinimumResultsForSearch.prototype.showSearch = function (decorated, params) {
            if (countResults(params.data.results) < this.minimumResultsForSearch) {
              return false;
            }

            return decorated.call(this, params);
          };

          return MinimumResultsForSearch;
        });

        S2.define('select2/dropdown/selectOnClose', [], function () {
          function SelectOnClose() {
          }

          SelectOnClose.prototype.bind = function (decorated, container, $container) {
            var self = this;

            decorated.call(this, container, $container);

            container.on('close', function (params) {
              self._handleSelectOnClose(params);
            });
          };

          SelectOnClose.prototype._handleSelectOnClose = function (_, params) {
            if (params && params.originalSelect2Event != null) {
              var event = params.originalSelect2Event;

              // Don't select an item if the close event was triggered from a select or
              // unselect event
              if (event._type === 'select' || event._type === 'unselect') {
                return;
              }
            }

            var $highlightedResults = this.getHighlightedResults();

            // Only select highlighted results
            if ($highlightedResults.length < 1) {
              return;
            }

            var data = $highlightedResults.data('data');

            // Don't re-select already selected resulte
            if (
                (data.element != null && data.element.selected) ||
                (data.element == null && data.selected)
            ) {
              return;
            }

            this.trigger('select', {
              data: data
            });
          };

          return SelectOnClose;
        });

        S2.define('select2/dropdown/closeOnSelect', [], function () {
          function CloseOnSelect() {
          }

          CloseOnSelect.prototype.bind = function (decorated, container, $container) {
            var self = this;

            decorated.call(this, container, $container);

            container.on('select', function (evt) {
              self._selectTriggered(evt);
            });

            container.on('unselect', function (evt) {
              self._selectTriggered(evt);
            });
          };

          CloseOnSelect.prototype._selectTriggered = function (_, evt) {
            var originalEvent = evt.originalEvent;

            // Don't close if the control key is being held
            if (originalEvent && originalEvent.ctrlKey) {
              return;
            }

            this.trigger('close', {
              originalEvent: originalEvent,
              originalSelect2Event: evt
            });
          };

          return CloseOnSelect;
        });

        S2.define('select2/i18n/en', [], function () {
          // English
          return {
            errorLoading: function () {
              return '결과를 불러올 수 없습니다.';
            },
            inputTooLong: function (args) {
              var overChars = args.input.length - args.maximum;

              var message = '너무 깁니다. ' + overChars + ' 글자 지워주세요.';

              if (overChars != 1) {
                message += 's';
              }

              return message;
            },
            inputTooShort: function (args) {
              var remainingChars = args.minimum - args.input.length;

              var message = '너무 짧습니다. ' + remainingChars + ' 글자 더 입력해주세요.';

              return message;
            },
            loadingMore: function () {
              return '불러오는 중…';
            },
            maximumSelected: function (args) {
              var message = '최대 ' + args.maximum + ' 개까지만 선택 가능합니다.';

              if (args.maximum != 1) {
                message += 's';
              }

              return message;
            },
            noResults: function () {
              return '결과가 없습니다.';
            },
            searching: function () {
              return '검색 중…';
            }
          };
        });

        S2.define('select2/defaults', [
          'jquery',
          'require',

          './results',

          './selection/single',
          './selection/multiple',
          './selection/placeholder',
          './selection/allowClear',
          './selection/search',
          './selection/eventRelay',

          './utils',
          './translation',
          './diacritics',

          './data/select',
          './data/array',
          './data/ajax',
          './data/tags',
          './data/tokenizer',
          './data/minimumInputLength',
          './data/maximumInputLength',
          './data/maximumSelectionLength',

          './dropdown',
          './dropdown/search',
          './dropdown/hidePlaceholder',
          './dropdown/infiniteScroll',
          './dropdown/attachBody',
          './dropdown/minimumResultsForSearch',
          './dropdown/selectOnClose',
          './dropdown/closeOnSelect',

          './i18n/en'
        ], function ($, require,
            ResultsList,
            SingleSelection, MultipleSelection, Placeholder, AllowClear,
            SelectionSearch, EventRelay,
            Utils, Translation, DIACRITICS,
            SelectData, ArrayData, AjaxData, Tags, Tokenizer,
            MinimumInputLength, MaximumInputLength, MaximumSelectionLength,
            Dropdown, DropdownSearch, HidePlaceholder, InfiniteScroll,
            AttachBody, MinimumResultsForSearch, SelectOnClose, CloseOnSelect,
            EnglishTranslation) {
          function Defaults() {
            this.reset();
          }

          Defaults.prototype.apply = function (options) {
            options = $.extend(true, {}, this.defaults, options);

            if (options.dataAdapter == null) {
              if (options.ajax != null) {
                options.dataAdapter = AjaxData;
              } else if (options.data != null) {
                options.dataAdapter = ArrayData;
              } else {
                options.dataAdapter = SelectData;
              }

              if (options.minimumInputLength > 0) {
                options.dataAdapter = Utils.Decorate(
                    options.dataAdapter,
                    MinimumInputLength
                );
              }

              if (options.maximumInputLength > 0) {
                options.dataAdapter = Utils.Decorate(
                    options.dataAdapter,
                    MaximumInputLength
                );
              }

              if (options.maximumSelectionLength > 0) {
                options.dataAdapter = Utils.Decorate(
                    options.dataAdapter,
                    MaximumSelectionLength
                );
              }

              if (options.tags) {
                options.dataAdapter = Utils.Decorate(options.dataAdapter, Tags);
              }

              if (options.tokenSeparators != null || options.tokenizer != null) {
                options.dataAdapter = Utils.Decorate(
                    options.dataAdapter,
                    Tokenizer
                );
              }

              if (options.query != null) {
                var Query = require(options.amdBase + 'compat/query');

                options.dataAdapter = Utils.Decorate(
                    options.dataAdapter,
                    Query
                );
              }

              if (options.initSelection != null) {
                var InitSelection = require(options.amdBase + 'compat/initSelection');

                options.dataAdapter = Utils.Decorate(
                    options.dataAdapter,
                    InitSelection
                );
              }
            }

            if (options.resultsAdapter == null) {
              options.resultsAdapter = ResultsList;

              if (options.ajax != null) {
                options.resultsAdapter = Utils.Decorate(
                    options.resultsAdapter,
                    InfiniteScroll
                );
              }

              if (options.placeholder != null) {
                options.resultsAdapter = Utils.Decorate(
                    options.resultsAdapter,
                    HidePlaceholder
                );
              }

              if (options.selectOnClose) {
                options.resultsAdapter = Utils.Decorate(
                    options.resultsAdapter,
                    SelectOnClose
                );
              }
            }

            if (options.dropdownAdapter == null) {
              if (options.multiple) {
                options.dropdownAdapter = Dropdown;
              } else {
                var SearchableDropdown = Utils.Decorate(Dropdown, DropdownSearch);

                options.dropdownAdapter = SearchableDropdown;
              }

              if (options.minimumResultsForSearch !== 0) {
                options.dropdownAdapter = Utils.Decorate(
                    options.dropdownAdapter,
                    MinimumResultsForSearch
                );
              }

              if (options.closeOnSelect) {
                options.dropdownAdapter = Utils.Decorate(
                    options.dropdownAdapter,
                    CloseOnSelect
                );
              }

              if (
                  options.dropdownCssClass != null ||
                  options.dropdownCss != null ||
                  options.adaptDropdownCssClass != null
              ) {
                var DropdownCSS = require(options.amdBase + 'compat/dropdownCss');

                options.dropdownAdapter = Utils.Decorate(
                    options.dropdownAdapter,
                    DropdownCSS
                );
              }

              options.dropdownAdapter = Utils.Decorate(
                  options.dropdownAdapter,
                  AttachBody
              );
            }

            if (options.selectionAdapter == null) {
              if (options.multiple) {
                options.selectionAdapter = MultipleSelection;
              } else {
                options.selectionAdapter = SingleSelection;
              }

              // Add the placeholder mixin if a placeholder was specified
              if (options.placeholder != null) {
                options.selectionAdapter = Utils.Decorate(
                    options.selectionAdapter,
                    Placeholder
                );
              }

              if (options.allowClear) {
                options.selectionAdapter = Utils.Decorate(
                    options.selectionAdapter,
                    AllowClear
                );
              }

              if (options.multiple) {
                options.selectionAdapter = Utils.Decorate(
                    options.selectionAdapter,
                    SelectionSearch
                );
              }

              if (
                  options.containerCssClass != null ||
                  options.containerCss != null ||
                  options.adaptContainerCssClass != null
              ) {
                var ContainerCSS = require(options.amdBase + 'compat/containerCss');

                options.selectionAdapter = Utils.Decorate(
                    options.selectionAdapter,
                    ContainerCSS
                );
              }

              options.selectionAdapter = Utils.Decorate(
                  options.selectionAdapter,
                  EventRelay
              );
            }

            if (typeof options.language === 'string') {
              // Check if the language is specified with a region
              if (options.language.indexOf('-') > 0) {
                // Extract the region information if it is included
                var languageParts = options.language.split('-');
                var baseLanguage = languageParts[0];

                options.language = [options.language, baseLanguage];
              } else {
                options.language = [options.language];
              }
            }

            if ($.isArray(options.language)) {
              var languages = new Translation();
              options.language.push('en');

              var languageNames = options.language;

              for (var l = 0; l < languageNames.length; l++) {
                var name = languageNames[l];
                var language = {};

                try {
                  // Try to load it with the original name
                  language = Translation.loadPath(name);
                } catch (e) {
                  try {
                    // If we couldn't load it, check if it wasn't the full path
                    name = this.defaults.amdLanguageBase + name;
                    language = Translation.loadPath(name);
                  } catch (ex) {
                    // The translation could not be loaded at all. Sometimes this is
                    // because of a configuration problem, other times this can be
                    // because of how Select2 helps load all possible translation files.
                    if (options.debug && window.console && console.warn) {
                      console.warn(
                          'Select2: The language file for "' + name + '" could not be ' +
                          'automatically loaded. A fallback will be used instead.'
                      );
                    }

                    continue;
                  }
                }

                languages.extend(language);
              }

              options.translations = languages;
            } else {
              var baseTranslation = Translation.loadPath(
                  this.defaults.amdLanguageBase + 'en'
              );
              var customTranslation = new Translation(options.language);

              customTranslation.extend(baseTranslation);

              options.translations = customTranslation;
            }

            return options;
          };

          Defaults.prototype.reset = function () {
            function stripDiacritics(text) {
              // Used 'uni range + named function' from http://jsperf.com/diacritics/18
              function match(a) {
                return DIACRITICS[a] || a;
              }

              return text.replace(/[^\u0000-\u007E]/g, match);
            }

            function matcher(params, data) {
              // Always return the object if there is nothing to compare
              if ($.trim(params.term) === '') {
                return data;
              }

              // Do a recursive check for options with children
              if (data.children && data.children.length > 0) {
                // Clone the data object if there are children
                // This is required as we modify the object to remove any non-matches
                var match = $.extend(true, {}, data);

                // Check each child of the option
                for (var c = data.children.length - 1; c >= 0; c--) {
                  var child = data.children[c];

                  var matches = matcher(params, child);

                  // If there wasn't a match, remove the object in the array
                  if (matches == null) {
                    match.children.splice(c, 1);
                  }
                }

                // If any children matched, return the new object
                if (match.children.length > 0) {
                  return match;
                }

                // If there were no matching children, check just the plain object
                return matcher(params, match);
              }

              var original = stripDiacritics(data.text).toUpperCase();
              var term = stripDiacritics(params.term).toUpperCase();

              // Check if the text contains the term
              if (original.indexOf(term) > -1) {
                return data;
              }

              // If it doesn't contain the term, don't return anything
              return null;
            }

            this.defaults = {
              amdBase: './',
              amdLanguageBase: './i18n/',
              closeOnSelect: true,
              debug: false,
              dropdownAutoWidth: false,
              escapeMarkup: Utils.escapeMarkup,
              language: EnglishTranslation,
              matcher: matcher,
              minimumInputLength: 0,
              maximumInputLength: 0,
              maximumSelectionLength: 0,
              minimumResultsForSearch: 0,
              selectOnClose: false,
              sorter: function (data) {
                return data;
              },
              templateResult: function (result) {
                return result.text;
              },
              templateSelection: function (selection) {
                return selection.text;
              },
              theme: 'default',
              width: 'resolve'
            };
          };

          Defaults.prototype.set = function (key, value) {
            var camelKey = $.camelCase(key);

            var data = {};
            data[camelKey] = value;

            var convertedData = Utils._convertData(data);

            $.extend(this.defaults, convertedData);
          };

          var defaults = new Defaults();

          return defaults;
        });

        S2.define('select2/options', [
          'require',
          'jquery',
          './defaults',
          './utils'
        ], function (require, $, Defaults, Utils) {
          function Options(options, $element) {
            this.options = options;

            if ($element != null) {
              this.fromElement($element);
            }

            this.options = Defaults.apply(this.options);

            if ($element && $element.is('input')) {
              var InputCompat = require(this.get('amdBase') + 'compat/inputData');

              this.options.dataAdapter = Utils.Decorate(
                  this.options.dataAdapter,
                  InputCompat
              );
            }
          }

          Options.prototype.fromElement = function ($e) {
            var excludedData = ['select2'];

            if (this.options.multiple == null) {
              this.options.multiple = $e.prop('multiple');
            }

            if (this.options.disabled == null) {
              this.options.disabled = $e.prop('disabled');
            }

            if (this.options.language == null) {
              if ($e.prop('lang')) {
                this.options.language = $e.prop('lang').toLowerCase();
              } else if ($e.closest('[lang]').prop('lang')) {
                this.options.language = $e.closest('[lang]').prop('lang');
              }
            }

            if (this.options.dir == null) {
              if ($e.prop('dir')) {
                this.options.dir = $e.prop('dir');
              } else if ($e.closest('[dir]').prop('dir')) {
                this.options.dir = $e.closest('[dir]').prop('dir');
              } else {
                this.options.dir = 'ltr';
              }
            }

            $e.prop('disabled', this.options.disabled);
            $e.prop('multiple', this.options.multiple);

            if ($e.data('select2Tags')) {
              if (this.options.debug && window.console && console.warn) {
                console.warn(
                    'Select2: The `data-select2-tags` attribute has been changed to ' +
                    'use the `data-data` and `data-tags="true"` attributes and will be ' +
                    'removed in future versions of Select2.'
                );
              }

              $e.data('data', $e.data('select2Tags'));
              $e.data('tags', true);
            }

            if ($e.data('ajaxUrl')) {
              if (this.options.debug && window.console && console.warn) {
                console.warn(
                    'Select2: The `data-ajax-url` attribute has been changed to ' +
                    '`data-ajax--url` and support for the old attribute will be removed' +
                    ' in future versions of Select2.'
                );
              }

              $e.attr('ajax--url', $e.data('ajaxUrl'));
              $e.data('ajax--url', $e.data('ajaxUrl'));
            }

            var dataset = {};

            // Prefer the element's `dataset` attribute if it exists
            // jQuery 1.x does not correctly handle data attributes with multiple dashes
            if ($.fn.jquery && $.fn.jquery.substr(0, 2) == '1.' && $e[0].dataset) {
              dataset = $.extend(true, {}, $e[0].dataset, $e.data());
            } else {
              dataset = $e.data();
            }

            var data = $.extend(true, {}, dataset);

            data = Utils._convertData(data);

            for (var key in data) {
              if ($.inArray(key, excludedData) > -1) {
                continue;
              }

              if ($.isPlainObject(this.options[key])) {
                $.extend(this.options[key], data[key]);
              } else {
                this.options[key] = data[key];
              }
            }

            return this;
          };

          Options.prototype.get = function (key) {
            return this.options[key];
          };

          Options.prototype.set = function (key, val) {
            this.options[key] = val;
          };

          return Options;
        });

        S2.define('select2/core', [
          'jquery',
          './options',
          './utils',
          './keys'
        ], function ($, Options, Utils, KEYS) {
          var Select2 = function ($element, options) {
            if ($element.data('select2') != null) {
              $element.data('select2').destroy();
            }

            this.$element = $element;

            this.id = this._generateId($element);

            options = options || {};

            this.options = new Options(options, $element);

            Select2.__super__.constructor.call(this);

            // Set up the tabindex

            var tabindex = $element.attr('tabindex') || 0;
            $element.data('old-tabindex', tabindex);
            $element.attr('tabindex', '-1');

            // Set up containers and adapters

            var DataAdapter = this.options.get('dataAdapter');
            this.dataAdapter = new DataAdapter($element, this.options);

            var $container = this.render();

            this._placeContainer($container);

            var SelectionAdapter = this.options.get('selectionAdapter');
            this.selection = new SelectionAdapter($element, this.options);
            this.$selection = this.selection.render();

            this.selection.position(this.$selection, $container);

            var DropdownAdapter = this.options.get('dropdownAdapter');
            this.dropdown = new DropdownAdapter($element, this.options);
            this.$dropdown = this.dropdown.render();

            this.dropdown.position(this.$dropdown, $container);

            var ResultsAdapter = this.options.get('resultsAdapter');
            this.results = new ResultsAdapter($element, this.options, this.dataAdapter);
            this.$results = this.results.render();

            this.results.position(this.$results, this.$dropdown);

            // Bind events

            var self = this;

            // Bind the container to all of the adapters
            this._bindAdapters();

            // Register any DOM event handlers
            this._registerDomEvents();

            // Register any internal event handlers
            this._registerDataEvents();
            this._registerSelectionEvents();
            this._registerDropdownEvents();
            this._registerResultsEvents();
            this._registerEvents();

            // Set the initial state
            this.dataAdapter.current(function (initialData) {
              self.trigger('selection:update', {
                data: initialData
              });
            });

            // Hide the original select
            $element.addClass('select2-hidden-accessible');
            $element.attr('aria-hidden', 'true');

            // Synchronize any monitored attributes
            this._syncAttributes();

            $element.data('select2', this);
          };

          Utils.Extend(Select2, Utils.Observable);

          Select2.prototype._generateId = function ($element) {
            var id = '';

            if ($element.attr('id') != null) {
              id = $element.attr('id');
            } else if ($element.attr('name') != null) {
              id = $element.attr('name') + '-' + Utils.generateChars(2);
            } else {
              id = Utils.generateChars(4);
            }

            id = id.replace(/(:|\.|\[|\]|,)/g, '');
            id = 'select2-' + id;

            return id;
          };

          Select2.prototype._placeContainer = function ($container) {
            $container.insertAfter(this.$element);

            var width = this._resolveWidth(this.$element, this.options.get('width'));

            if (width != null) {
              $container.css('width', width);
            }
          };

          Select2.prototype._resolveWidth = function ($element, method) {
            var WIDTH = /^width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/i;

            if (method == 'resolve') {
              var styleWidth = this._resolveWidth($element, 'style');

              if (styleWidth != null) {
                return styleWidth;
              }

              return this._resolveWidth($element, 'element');
            }

            if (method == 'element') {
              var elementWidth = $element.outerWidth(false);

              if (elementWidth <= 0) {
                return 'auto';
              }

              return elementWidth + 'px';
            }

            if (method == 'style') {
              var style = $element.attr('style');

              if (typeof(style) !== 'string') {
                return null;
              }

              var attrs = style.split(';');

              for (var i = 0, l = attrs.length; i < l; i = i + 1) {
                var attr = attrs[i].replace(/\s/g, '');
                var matches = attr.match(WIDTH);

                if (matches !== null && matches.length >= 1) {
                  return matches[1];
                }
              }

              return null;
            }

            return method;
          };

          Select2.prototype._bindAdapters = function () {
            this.dataAdapter.bind(this, this.$container);
            this.selection.bind(this, this.$container);

            this.dropdown.bind(this, this.$container);
            this.results.bind(this, this.$container);
          };

          Select2.prototype._registerDomEvents = function () {
            var self = this;

            this.$element.on('change.select2', function () {
              self.dataAdapter.current(function (data) {
                self.trigger('selection:update', {
                  data: data
                });
              });
            });

            this.$element.on('focus.select2', function (evt) {
              self.trigger('focus', evt);
            });

            this._syncA = Utils.bind(this._syncAttributes, this);
            this._syncS = Utils.bind(this._syncSubtree, this);

            if (this.$element[0].attachEvent) {
              this.$element[0].attachEvent('onpropertychange', this._syncA);
            }

            var observer = window.MutationObserver ||
                window.WebKitMutationObserver ||
                window.MozMutationObserver
            ;

            if (observer != null) {
              this._observer = new observer(function (mutations) {
                $.each(mutations, self._syncA);
                $.each(mutations, self._syncS);
              });
              this._observer.observe(this.$element[0], {
                attributes: true,
                childList: true,
                subtree: false
              });
            } else if (this.$element[0].addEventListener) {
              this.$element[0].addEventListener(
                  'DOMAttrModified',
                  self._syncA,
                  false
              );
              this.$element[0].addEventListener(
                  'DOMNodeInserted',
                  self._syncS,
                  false
              );
              this.$element[0].addEventListener(
                  'DOMNodeRemoved',
                  self._syncS,
                  false
              );
            }
          };

          Select2.prototype._registerDataEvents = function () {
            var self = this;

            this.dataAdapter.on('*', function (name, params) {
              self.trigger(name, params);
            });
          };

          Select2.prototype._registerSelectionEvents = function () {
            var self = this;
            var nonRelayEvents = ['toggle', 'focus'];

            this.selection.on('toggle', function () {
              self.toggleDropdown();
            });

            this.selection.on('focus', function (params) {
              self.focus(params);
            });

            this.selection.on('*', function (name, params) {
              if ($.inArray(name, nonRelayEvents) !== -1) {
                return;
              }

              self.trigger(name, params);
            });
          };

          Select2.prototype._registerDropdownEvents = function () {
            var self = this;

            this.dropdown.on('*', function (name, params) {
              self.trigger(name, params);
            });
          };

          Select2.prototype._registerResultsEvents = function () {
            var self = this;

            this.results.on('*', function (name, params) {
              self.trigger(name, params);
            });
          };

          Select2.prototype._registerEvents = function () {
            var self = this;

            this.on('open', function () {
              self.$container.addClass('select2-container--open');
            });

            this.on('close', function () {
              self.$container.removeClass('select2-container--open');
            });

            this.on('enable', function () {
              self.$container.removeClass('select2-container--disabled');
            });

            this.on('disable', function () {
              self.$container.addClass('select2-container--disabled');
            });

            this.on('blur', function () {
              self.$container.removeClass('select2-container--focus');
            });

            this.on('query', function (params) {
              if (!self.isOpen()) {
                self.trigger('open', {});
              }

              this.dataAdapter.query(params, function (data) {
                self.trigger('results:all', {
                  data: data,
                  query: params
                });
              });
            });

            this.on('query:append', function (params) {
              this.dataAdapter.query(params, function (data) {
                self.trigger('results:append', {
                  data: data,
                  query: params
                });
              });
            });

            this.on('keypress', function (evt) {
              var key = evt.which;

              if (self.isOpen()) {
                if (key === KEYS.ESC || key === KEYS.TAB ||
                    (key === KEYS.UP && evt.altKey)) {
                  self.close();

                  evt.preventDefault();
                } else if (key === KEYS.ENTER) {
                  self.trigger('results:select', {});

                  evt.preventDefault();
                } else if ((key === KEYS.SPACE && evt.ctrlKey)) {
                  self.trigger('results:toggle', {});

                  evt.preventDefault();
                } else if (key === KEYS.UP) {
                  self.trigger('results:previous', {});

                  evt.preventDefault();
                } else if (key === KEYS.DOWN) {
                  self.trigger('results:next', {});

                  evt.preventDefault();
                }
              } else {
                if (key === KEYS.ENTER || key === KEYS.SPACE ||
                    (key === KEYS.DOWN && evt.altKey)) {
                  self.open();

                  evt.preventDefault();
                }
              }
            });
          };

          Select2.prototype._syncAttributes = function () {
            this.options.set('disabled', this.$element.prop('disabled'));

            if (this.options.get('disabled')) {
              if (this.isOpen()) {
                this.close();
              }

              this.trigger('disable', {});
            } else {
              this.trigger('enable', {});
            }
          };

          Select2.prototype._syncSubtree = function (evt, mutations) {
            var changed = false;
            var self = this;

            // Ignore any mutation events raised for elements that aren't options or
            // optgroups. This handles the case when the select element is destroyed
            if (
                evt && evt.target && (
                    evt.target.nodeName !== 'OPTION' && evt.target.nodeName !== 'OPTGROUP'
                )
            ) {
              return;
            }

            if (!mutations) {
              // If mutation events aren't supported, then we can only assume that the
              // change affected the selections
              changed = true;
            } else if (mutations.addedNodes && mutations.addedNodes.length > 0) {
              for (var n = 0; n < mutations.addedNodes.length; n++) {
                var node = mutations.addedNodes[n];

                if (node.selected) {
                  changed = true;
                }
              }
            } else if (mutations.removedNodes && mutations.removedNodes.length > 0) {
              changed = true;
            }

            // Only re-pull the data if we think there is a change
            if (changed) {
              this.dataAdapter.current(function (currentData) {
                self.trigger('selection:update', {
                  data: currentData
                });
              });
            }
          };

          /**
           * Override the trigger method to automatically trigger pre-events when
           * there are events that can be prevented.
           */
          Select2.prototype.trigger = function (name, args) {
            var actualTrigger = Select2.__super__.trigger;
            var preTriggerMap = {
              'open': 'opening',
              'close': 'closing',
              'select': 'selecting',
              'unselect': 'unselecting'
            };

            if (args === undefined) {
              args = {};
            }

            if (name in preTriggerMap) {
              var preTriggerName = preTriggerMap[name];
              var preTriggerArgs = {
                prevented: false,
                name: name,
                args: args
              };

              actualTrigger.call(this, preTriggerName, preTriggerArgs);

              if (preTriggerArgs.prevented) {
                args.prevented = true;

                return;
              }
            }

            actualTrigger.call(this, name, args);
          };

          Select2.prototype.toggleDropdown = function () {
            if (this.options.get('disabled')) {
              return;
            }

            if (this.isOpen()) {
              this.close();
            } else {
              this.open();
            }
          };

          Select2.prototype.open = function () {
            if (this.isOpen()) {
              return;
            }

            this.trigger('query', {});
          };

          Select2.prototype.close = function () {
            if (!this.isOpen()) {
              return;
            }

            this.trigger('close', {});
          };

          Select2.prototype.isOpen = function () {
            return this.$container.hasClass('select2-container--open');
          };

          Select2.prototype.hasFocus = function () {
            return this.$container.hasClass('select2-container--focus');
          };

          Select2.prototype.focus = function (data) {
            // No need to re-trigger focus events if we are already focused
            if (this.hasFocus()) {
              return;
            }

            this.$container.addClass('select2-container--focus');
            this.trigger('focus', {});
          };

          Select2.prototype.enable = function (args) {
            if (this.options.get('debug') && window.console && console.warn) {
              console.warn(
                  'Select2: The `select2("enable")` method has been deprecated and will' +
                  ' be removed in later Select2 versions. Use $element.prop("disabled")' +
                  ' instead.'
              );
            }

            if (args == null || args.length === 0) {
              args = [true];
            }

            var disabled = !args[0];

            this.$element.prop('disabled', disabled);
          };

          Select2.prototype.data = function () {
            if (this.options.get('debug') &&
                arguments.length > 0 && window.console && console.warn) {
              console.warn(
                  'Select2: Data can no longer be set using `select2("data")`. You ' +
                  'should consider setting the value instead using `$element.val()`.'
              );
            }

            var data = [];

            this.dataAdapter.current(function (currentData) {
              data = currentData;
            });

            return data;
          };

          Select2.prototype.val = function (args) {
            if (this.options.get('debug') && window.console && console.warn) {
              console.warn(
                  'Select2: The `select2("val")` method has been deprecated and will be' +
                  ' removed in later Select2 versions. Use $element.val() instead.'
              );
            }

            if (args == null || args.length === 0) {
              return this.$element.val();
            }

            var newVal = args[0];

            if ($.isArray(newVal)) {
              newVal = $.map(newVal, function (obj) {
                return obj.toString();
              });
            }

            this.$element.val(newVal).trigger('change');
          };

          Select2.prototype.destroy = function () {
            this.$container.remove();

            if (this.$element[0].detachEvent) {
              this.$element[0].detachEvent('onpropertychange', this._syncA);
            }

            if (this._observer != null) {
              this._observer.disconnect();
              this._observer = null;
            } else if (this.$element[0].removeEventListener) {
              this.$element[0]
              .removeEventListener('DOMAttrModified', this._syncA, false);
              this.$element[0]
              .removeEventListener('DOMNodeInserted', this._syncS, false);
              this.$element[0]
              .removeEventListener('DOMNodeRemoved', this._syncS, false);
            }

            this._syncA = null;
            this._syncS = null;

            this.$element.off('.select2');
            this.$element.attr('tabindex', this.$element.data('old-tabindex'));

            this.$element.removeClass('select2-hidden-accessible');
            this.$element.attr('aria-hidden', 'false');
            this.$element.removeData('select2');

            this.dataAdapter.destroy();
            this.selection.destroy();
            this.dropdown.destroy();
            this.results.destroy();

            this.dataAdapter = null;
            this.selection = null;
            this.dropdown = null;
            this.results = null;
          };

          Select2.prototype.render = function () {
            var $container = $(
                '<span class="select2 select2-container">' +
                '<span class="selection"></span>' +
                '<span class="dropdown-wrapper" aria-hidden="true"></span>' +
                '</span>'
            );

            $container.attr('dir', this.options.get('dir'));

            this.$container = $container;

            this.$container.addClass('select2-container--' + this.options.get('theme'));

            $container.data('element', this.$element);

            return $container;
          };

          return Select2;
        });

        S2.define('jquery-mousewheel', [
          'jquery'
        ], function ($) {
          // Used to shim jQuery.mousewheel for non-full builds.
          return $;
        });

        S2.define('jquery.select2', [
          'jquery',
          'jquery-mousewheel',

          './select2/core',
          './select2/defaults'
        ], function ($, _, Select2, Defaults) {
          if ($.fn.select2 == null) {
            // All methods that should return the element
            var thisMethods = ['open', 'close', 'destroy'];

            $.fn.select2 = function (options) {
              options = options || {};

              if (typeof options === 'object') {
                this.each(function () {
                  var instanceOptions = $.extend(true, {}, options);

                  var instance = new Select2($(this), instanceOptions);
                });

                return this;
              } else if (typeof options === 'string') {
                var ret;
                var args = Array.prototype.slice.call(arguments, 1);

                this.each(function () {
                  var instance = $(this).data('select2');

                  if (instance == null && window.console && console.error) {
                    console.error(
                        'The select2(\'' + options + '\') method was called on an ' +
                        'element that is not using Select2.'
                    );
                  }

                  ret = instance[options].apply(instance, args);
                });

                // Check if we should be returning `this`
                if ($.inArray(options, thisMethods) > -1) {
                  return this;
                }

                return ret;
              } else {
                throw new Error('Invalid arguments for Select2: ' + options);
              }
            };
          }

          if ($.fn.select2.defaults == null) {
            $.fn.select2.defaults = Defaults;
          }

          return Select2;
        });

        // Return the AMD loader configuration so it can be used outside of this file
        return {
          define: S2.define,
          require: S2.require
        };
      }());

  // Autoload the jQuery bindings
  // We know that all of the modules exist above this, so we're safe
  var select2 = S2.require('jquery.select2');

  // Hold the AMD module references on the jQuery function that was just loaded
  // This allows Select2 to use the internal loader outside of this file, such
  // as in the language files.
  jQuery.fn.select2.amd = S2;

  // Return the Select2 instance for anyone who is importing it.

  return select2;
}));


$('select').on('select2:open', function (e) {
  $('.select2-results__options').mCustomScrollbar('destroy');
  setTimeout(function () {
    $('.select2-results__options').mCustomScrollbar({scrollInertia: 100});
  }, 0);
});

/*
 * pagination.js 2.1.4
 * A jQuery plugin to provide simple yet fully customisable pagination.
 * https://github.com/superRaytin/paginationjs
 *
 * Homepage: http://pagination.js.org
 *
 * Copyright 2014-2100, superRaytin
 * Released under the MIT license.
 */

(function (global, $) {

  if (typeof $ === 'undefined') {
    throwError('Pagination requires jQuery.');
  }

  var pluginName = 'pagination';

  var pluginHookMethod = 'addHook';

  var eventPrefix = '__pagination-';

  // Conflict, use backup
  if ($.fn.pagination) {
    pluginName = 'pagination2';
  }

  $.fn[pluginName] = function (options) {

    if (typeof options === 'undefined') {
      return this;
    }

    var container = $(this);

    var attributes = $.extend({}, $.fn[pluginName].defaults, options);

    var pagination = {

      initialize: function () {
        var self = this;

        // Cache attributes of current instance
        if (!container.data('pagination')) {
          container.data('pagination', {});
        }

        if (self.callHook('beforeInit') === false) {
          return;
        }

        // Pagination has been initialized, destroy it
        if (container.data('pagination').initialized) {
          $('.paginationjs', container).remove();
        }

        // Whether to disable Pagination at the initialization
        self.disabled = !!attributes.disabled;

        // Model will be passed to the callback function
        var model = self.model = {
          pageRange: attributes.pageRange,
          pageSize: attributes.pageSize
        };

        // dataSource`s type is unknown, parse it to find true data
        self.parseDataSource(attributes.dataSource, function (dataSource) {

          // Currently in asynchronous mode
          self.isAsync = Helpers.isString(dataSource);
          if (Helpers.isArray(dataSource)) {
            model.totalNumber = attributes.totalNumber = dataSource.length;
          }

          // Currently in asynchronous mode and a totalNumberLocator is specified
          self.isDynamicTotalNumber = self.isAsync && attributes.totalNumberLocator;

          // There is only one page
          if (attributes.hideWhenLessThanOnePage) {
            if (self.getTotalPage() <= 1) {
              return;
            }
          }

          var el = self.render(true);

          // Add extra className to the pagination element
          if (attributes.className) {
            el.addClass(attributes.className);
          }

          model.el = el;

          // Append/prepend pagination element to the container
          container[attributes.position === 'bottom' ? 'append' : 'prepend'](el);

          // Bind events
          self.observer();

          // Pagination is currently initialized
          container.data('pagination').initialized = true;

          // Will be invoked after initialized
          self.callHook('afterInit', el);
        });
      },

      render: function (isBoot) {
        var self = this;
        var model = self.model;
        var el = model.el || $('<div class="paginationjs"></div>');
        var isForced = isBoot !== true;

        self.callHook('beforeRender', isForced);

        var currentPage = model.pageNumber || attributes.pageNumber;
        var pageRange = attributes.pageRange;
        var totalPage = self.getTotalPage();

        var rangeStart = currentPage - pageRange;
        var rangeEnd = currentPage + pageRange;

        if (rangeEnd > totalPage) {
          rangeEnd = totalPage;
          rangeStart = totalPage - pageRange * 2;
          rangeStart = rangeStart < 1 ? 1 : rangeStart;
        }

        if (rangeStart <= 1) {
          rangeStart = 1;
          rangeEnd = Math.min(pageRange * 2 + 1, totalPage);
        }

        el.html(self.generateHTML({
          currentPage: currentPage,
          pageRange: pageRange,
          rangeStart: rangeStart,
          rangeEnd: rangeEnd
        }));

        self.callHook('afterRender', isForced);

        return el;
      },

      // Generate HTML content from the template
      generateHTML: function (args) {
        var self = this;
        var currentPage = args.currentPage;
        var totalPage = self.getTotalPage();
        var rangeStart = args.rangeStart;
        var rangeEnd = args.rangeEnd;

        var totalNumber = self.getTotalNumber();

        var showPrevious = attributes.showPrevious;
        var showNext = attributes.showNext;
        var showPageNumbers = attributes.showPageNumbers;
        var showNavigator = attributes.showNavigator;
        var showGoInput = attributes.showGoInput;
        var showGoButton = attributes.showGoButton;

        var pageLink = attributes.pageLink;
        var prevText = attributes.prevText;
        var nextText = attributes.nextText;
        var ellipsisText = attributes.ellipsisText;
        var goButtonText = attributes.goButtonText;

        var classPrefix = attributes.classPrefix;
        var activeClassName = attributes.activeClassName;
        var disableClassName = attributes.disableClassName;
        var ulClassName = attributes.ulClassName;

        var html = '';
        var goInput = '<input type="text" class="J-paginationjs-go-pagenumber">';
        var goButton = '<input type="button" class="J-paginationjs-go-button" value="' + goButtonText + '">';
        var formattedString;
        var i;

        var formatNavigator = $.isFunction(attributes.formatNavigator) ? attributes.formatNavigator(currentPage, totalPage, totalNumber)
            : attributes.formatNavigator;
        var formatGoInput = $.isFunction(attributes.formatGoInput) ? attributes.formatGoInput(goInput, currentPage, totalPage, totalNumber)
            : attributes.formatGoInput;
        var formatGoButton = $.isFunction(attributes.formatGoButton) ? attributes.formatGoButton(goButton, currentPage, totalPage,
            totalNumber) : attributes.formatGoButton;

        var autoHidePrevious = $.isFunction(attributes.autoHidePrevious) ? attributes.autoHidePrevious() : attributes.autoHidePrevious;
        var autoHideNext = $.isFunction(attributes.autoHideNext) ? attributes.autoHideNext() : attributes.autoHideNext;

        var header = $.isFunction(attributes.header) ? attributes.header(currentPage, totalPage, totalNumber) : attributes.header;
        var footer = $.isFunction(attributes.footer) ? attributes.footer(currentPage, totalPage, totalNumber) : attributes.footer;

        // Whether to display header
        if (header) {
          formattedString = self.replaceVariables(header, {
            currentPage: currentPage,
            totalPage: totalPage,
            totalNumber: totalNumber
          });
          html += formattedString;
        }

        if (showPrevious || showPageNumbers || showNext) {
          html += '<div class="paginationjs-pages">';

          if (ulClassName) {
            html += '<ul class="' + ulClassName + '">';
          } else {
            html += '<ul>';
          }

          // Whether to display the Previous button
          if (showPrevious) {
            if (currentPage <= 1) {
              if (!autoHidePrevious) {
                html += '<li class="' + classPrefix + '-prev ' + disableClassName + '"><a>' + prevText + '<\/a><\/li>';
              }
            } else {
              html += '<li class="' + classPrefix + '-prev J-paginationjs-previous" data-num="' + (currentPage - 1)
                  + '" title="Previous page"><a href="' + pageLink + '">' + prevText + '<\/a><\/li>';
            }
          }

          // Whether to display the pages
          if (showPageNumbers) {
            if (rangeStart <= 3) {
              for (i = 1; i < rangeStart; i++) {
                if (i == currentPage) {
                  html += '<li class="' + classPrefix + '-page J-paginationjs-page ' + activeClassName + '" data-num="' + i + '"><a>' + i
                      + '<\/a><\/li>';
                } else {
                  html += '<li class="' + classPrefix + '-page J-paginationjs-page" data-num="' + i + '"><a href="' + pageLink + '">' + i
                      + '<\/a><\/li>';
                }
              }
            } else {
              if (attributes.showFirstOnEllipsisShow) {
                html += '<li class="' + classPrefix + '-page ' + classPrefix + '-first J-paginationjs-page" data-num="1"><a href="'
                    + pageLink + '">1<\/a><\/li>';
              }
              html += '<li class="' + classPrefix + '-ellipsis ' + disableClassName + '"><a>' + ellipsisText + '<\/a><\/li>';
            }

            for (i = rangeStart; i <= rangeEnd; i++) {
              if (i == currentPage) {
                html += '<li class="' + classPrefix + '-page J-paginationjs-page ' + activeClassName + '" data-num="' + i + '"><a>' + i
                    + '<\/a><\/li>';
              } else {
                html += '<li class="' + classPrefix + '-page J-paginationjs-page" data-num="' + i + '"><a href="' + pageLink + '">' + i
                    + '<\/a><\/li>';
              }
            }

            if (rangeEnd >= totalPage - 2) {
              for (i = rangeEnd + 1; i <= totalPage; i++) {
                html += '<li class="' + classPrefix + '-page J-paginationjs-page" data-num="' + i + '"><a href="' + pageLink + '">' + i
                    + '<\/a><\/li>';
              }
            } else {
              html += '<li class="' + classPrefix + '-ellipsis ' + disableClassName + '"><a>' + ellipsisText + '<\/a><\/li>';

              if (attributes.showLastOnEllipsisShow) {
                html += '<li class="' + classPrefix + '-page ' + classPrefix + '-last J-paginationjs-page" data-num="' + totalPage
                    + '"><a href="' + pageLink + '">' + totalPage + '<\/a><\/li>';
              }
            }
          }

          // Whether to display the Next button
          if (showNext) {
            if (currentPage >= totalPage) {
              if (!autoHideNext) {
                html += '<li class="' + classPrefix + '-next ' + disableClassName + '"><a>' + nextText + '<\/a><\/li>';
              }
            } else {
              html += '<li class="' + classPrefix + '-next J-paginationjs-next" data-num="' + (currentPage + 1)
                  + '" title="Next page"><a href="' + pageLink + '">' + nextText + '<\/a><\/li>';
            }
          }
          html += '<\/ul><\/div>';
        }

        // Whether to display the navigator
        if (showNavigator) {
          if (formatNavigator) {
            formattedString = self.replaceVariables(formatNavigator, {
              currentPage: currentPage,
              totalPage: totalPage,
              totalNumber: totalNumber
            });
            html += '<div class="' + classPrefix + '-nav J-paginationjs-nav">' + formattedString + '<\/div>';
          }
        }

        // Whether to display the Go input
        if (showGoInput) {
          if (formatGoInput) {
            formattedString = self.replaceVariables(formatGoInput, {
              currentPage: currentPage,
              totalPage: totalPage,
              totalNumber: totalNumber,
              input: goInput
            });
            html += '<div class="' + classPrefix + '-go-input">' + formattedString + '</div>';
          }
        }

        // Whether to display the Go button
        if (showGoButton) {
          if (formatGoButton) {
            formattedString = self.replaceVariables(formatGoButton, {
              currentPage: currentPage,
              totalPage: totalPage,
              totalNumber: totalNumber,
              button: goButton
            });
            html += '<div class="' + classPrefix + '-go-button">' + formattedString + '</div>';
          }
        }

        // Whether to display footer
        if (footer) {
          formattedString = self.replaceVariables(footer, {
            currentPage: currentPage,
            totalPage: totalPage,
            totalNumber: totalNumber
          });
          html += formattedString;
        }

        return html;
      },

      // Find totalNumber from the remote response
      // Only available in asynchronous mode
      findTotalNumberFromRemoteResponse: function (response) {
        var self = this;
        self.model.totalNumber = attributes.totalNumberLocator(response);
      },

      // Go to the specified page
      go: function (number, callback) {
        var self = this;
        var model = self.model;

        if (self.disabled) {
          return;
        }

        var pageNumber = number;
        pageNumber = parseInt(pageNumber);

        // Page number is out of bounds
        if (!pageNumber || pageNumber < 1) {
          return;
        }

        var pageSize = attributes.pageSize;
        var totalNumber = self.getTotalNumber();
        var totalPage = self.getTotalPage();

        // Page number is out of bounds
        if (totalNumber > 0) {
          if (pageNumber > totalPage) {
            return;
          }
        }

        // Pick data fragment in synchronous mode
        if (!self.isAsync) {
          render(self.getDataFragment(pageNumber));
          return;
        }

        var postData = {};
        var alias = attributes.alias || {};
        postData[alias.pageSize ? alias.pageSize : 'pageSize'] = pageSize;
        postData[alias.pageNumber ? alias.pageNumber : 'pageNumber'] = pageNumber;

        var ajaxParams = $.isFunction(attributes.ajax) ? attributes.ajax() : attributes.ajax;
        var formatAjaxParams = {
          type: 'get',
          cache: false,
          data: {},
          contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
          dataType: 'json',
          async: true
        };

        $.extend(true, formatAjaxParams, ajaxParams);
        $.extend(formatAjaxParams.data, postData);

        formatAjaxParams.url = attributes.dataSource;
        formatAjaxParams.success = function (response) {
          if (self.isDynamicTotalNumber) {
            self.findTotalNumberFromRemoteResponse(response);
          } else {
            self.model.totalNumber = attributes.totalNumber;
          }
          render(self.filterDataByLocator(response));
        };
        formatAjaxParams.error = function (jqXHR, textStatus, errorThrown) {
          attributes.formatAjaxError && attributes.formatAjaxError(jqXHR, textStatus, errorThrown);
          self.enable();
        };

        self.disable();

        $.ajax(formatAjaxParams);

        function render(data) {
          // Will be invoked before paging
          if (self.callHook('beforePaging', pageNumber) === false) {
            return false;
          }

          // Pagination direction
          model.direction = typeof model.pageNumber === 'undefined' ? 0 : (pageNumber > model.pageNumber ? 1 : -1);

          model.pageNumber = pageNumber;

          self.render();

          if (self.disabled && self.isAsync) {
            // enable pagination
            self.enable();
          }

          // cache model data
          container.data('pagination').model = model;

          // format result data before callback invoked
          if (attributes.formatResult) {
            var cloneData = $.extend(true, [], data);
            if (!Helpers.isArray(data = attributes.formatResult(cloneData))) {
              data = cloneData;
            }
          }

          container.data('pagination').currentPageData = data;

          // invoke callback
          self.doCallback(data, callback);

          self.callHook('afterPaging', pageNumber);

          // pageNumber now is the first page
          if (pageNumber == 1) {
            self.callHook('afterIsFirstPage');
          }

          // pageNumber now is the last page
          if (pageNumber == self.getTotalPage()) {
            self.callHook('afterIsLastPage');
          }
        }
      },

      doCallback: function (data, customCallback) {
        var self = this;
        var model = self.model;

        if ($.isFunction(customCallback)) {
          customCallback(data, model);
        } else if ($.isFunction(attributes.callback)) {
          attributes.callback(data, model);
        }
      },

      destroy: function () {
        // Before destroy
        if (this.callHook('beforeDestroy') === false) {
          return;
        }

        this.model.el.remove();
        container.off();

        // Remove style element
        $('#paginationjs-style').remove();

        // After destroyed
        this.callHook('afterDestroy');
      },

      previous: function (callback) {
        this.go(this.model.pageNumber - 1, callback);
      },

      next: function (callback) {
        this.go(this.model.pageNumber + 1, callback);
      },

      disable: function () {
        var self = this;
        var source = self.isAsync ? 'async' : 'sync';

        // Before disabled
        if (self.callHook('beforeDisable', source) === false) {
          return;
        }

        self.disabled = true;
        self.model.disabled = true;

        // After disabled
        self.callHook('afterDisable', source);
      },

      enable: function () {
        var self = this;
        var source = self.isAsync ? 'async' : 'sync';

        // Before enabled
        if (self.callHook('beforeEnable', source) === false) {
          return;
        }

        self.disabled = false;
        self.model.disabled = false;

        // After enabled
        self.callHook('afterEnable', source);
      },

      refresh: function (callback) {
        this.go(this.model.pageNumber, callback);
      },

      show: function () {
        var self = this;

        if (self.model.el.is(':visible')) {
          return;
        }

        self.model.el.show();
      },

      hide: function () {
        var self = this;

        if (!self.model.el.is(':visible')) {
          return;
        }

        self.model.el.hide();
      },

      // Parse variables in the template
      replaceVariables: function (template, variables) {
        var formattedString;

        for (var key in variables) {
          var value = variables[key];
          var regexp = new RegExp('<%=\\s*' + key + '\\s*%>', 'img');

          formattedString = (formattedString || template).replace(regexp, value);
        }

        return formattedString;
      },

      // Get data fragment
      getDataFragment: function (number) {
        var pageSize = attributes.pageSize;
        var dataSource = attributes.dataSource;
        var totalNumber = this.getTotalNumber();

        var start = pageSize * (number - 1) + 1;
        var end = Math.min(number * pageSize, totalNumber);

        return dataSource.slice(start - 1, end);
      },

      // Get total number
      getTotalNumber: function () {
        return this.model.totalNumber || attributes.totalNumber || 0;
      },

      // Get total page
      getTotalPage: function () {
        return Math.ceil(this.getTotalNumber() / attributes.pageSize);
      },

      // Get locator
      getLocator: function (locator) {
        var result;

        if (typeof locator === 'string') {
          result = locator;
        } else if ($.isFunction(locator)) {
          result = locator();
        } else {
          throwError('"locator" is incorrect. (String | Function)');
        }

        return result;
      },

      // Filter data by "locator"
      filterDataByLocator: function (dataSource) {
        var locator = this.getLocator(attributes.locator);
        var filteredData;

        // Datasource is an Object, use "locator" to locate the true data
        if (Helpers.isObject(dataSource)) {
          try {
            $.each(locator.split('.'), function (index, item) {
              filteredData = (filteredData ? filteredData : dataSource)[item];
            });
          }
          catch (e) {
          }

          if (!filteredData) {
            throwError('dataSource.' + locator + ' is undefined.');
          } else if (!Helpers.isArray(filteredData)) {
            throwError('dataSource.' + locator + ' must be an Array.');
          }
        }

        return filteredData || dataSource;
      },

      // Parse dataSource
      parseDataSource: function (dataSource, callback) {
        var self = this;

        if (Helpers.isObject(dataSource)) {
          callback(attributes.dataSource = self.filterDataByLocator(dataSource));
        } else if (Helpers.isArray(dataSource)) {
          callback(attributes.dataSource = dataSource);
        } else if ($.isFunction(dataSource)) {
          attributes.dataSource(function (data) {
            if (!Helpers.isArray(data)) {
              throwError('The parameter of "done" Function should be an Array.');
            }
            self.parseDataSource.call(self, data, callback);
          });
        } else if (typeof dataSource === 'string') {
          if (/^https?|file:/.test(dataSource)) {
            attributes.ajaxDataType = 'jsonp';
          }
          callback(dataSource);
        } else {
          throwError('Unexpected type of "dataSource".');
        }
      },

      callHook: function (hook) {
        var paginationData = container.data('pagination');
        var result;

        var args = Array.prototype.slice.apply(arguments);
        args.shift();

        if (attributes[hook] && $.isFunction(attributes[hook])) {
          if (attributes[hook].apply(global, args) === false) {
            result = false;
          }
        }

        if (paginationData.hooks && paginationData.hooks[hook]) {
          $.each(paginationData.hooks[hook], function (index, item) {
            if (item.apply(global, args) === false) {
              result = false;
            }
          });
        }

        return result !== false;
      },

      observer: function () {
        var self = this;
        var el = self.model.el;

        // Go to specified page number
        container.on(eventPrefix + 'go', function (event, pageNumber, done) {
          pageNumber = parseInt($.trim(pageNumber));

          if (!pageNumber) {
            return;
          }

          if (!$.isNumeric(pageNumber)) {
            throwError('"pageNumber" is incorrect. (Number)');
          }

          self.go(pageNumber, done);
        });

        // Page number button click
        el.delegate('.J-paginationjs-page', 'click', function (event) {
          var current = $(event.currentTarget);
          var pageNumber = $.trim(current.attr('data-num'));

          if (!pageNumber || current.hasClass(attributes.disableClassName) || current.hasClass(attributes.activeClassName)) {
            return;
          }

          // Before page button clicked
          if (self.callHook('beforePageOnClick', event, pageNumber) === false) {
            return false;
          }

          self.go(pageNumber);

          // After page button clicked
          self.callHook('afterPageOnClick', event, pageNumber);

          if (!attributes.pageLink) {
            return false;
          }
        });

        // Previous button click
        el.delegate('.J-paginationjs-previous', 'click', function (event) {
          var current = $(event.currentTarget);
          var pageNumber = $.trim(current.attr('data-num'));

          if (!pageNumber || current.hasClass(attributes.disableClassName)) {
            return;
          }

          // Before previous clicked
          if (self.callHook('beforePreviousOnClick', event, pageNumber) === false) {
            return false;
          }

          self.go(pageNumber);

          // After previous clicked
          self.callHook('afterPreviousOnClick', event, pageNumber);

          if (!attributes.pageLink) {
            return false;
          }
        });

        // Next button click
        el.delegate('.J-paginationjs-next', 'click', function (event) {
          var current = $(event.currentTarget);
          var pageNumber = $.trim(current.attr('data-num'));

          if (!pageNumber || current.hasClass(attributes.disableClassName)) {
            return;
          }

          // Before next clicked
          if (self.callHook('beforeNextOnClick', event, pageNumber) === false) {
            return false;
          }

          self.go(pageNumber);

          // After next clicked
          self.callHook('afterNextOnClick', event, pageNumber);

          if (!attributes.pageLink) {
            return false;
          }
        });

        // Go button click
        el.delegate('.J-paginationjs-go-button', 'click', function (event) {
          var pageNumber = $('.J-paginationjs-go-pagenumber', el).val();

          // Before Go button clicked
          if (self.callHook('beforeGoButtonOnClick', event, pageNumber) === false) {
            return false;
          }

          container.trigger(eventPrefix + 'go', pageNumber);

          // After Go button clicked
          self.callHook('afterGoButtonOnClick', event, pageNumber);
        });

        // go input enter
        el.delegate('.J-paginationjs-go-pagenumber', 'keyup', function (event) {
          if (event.which === 13) {
            var pageNumber = $(event.currentTarget).val();

            // Before Go input enter
            if (self.callHook('beforeGoInputOnEnter', event, pageNumber) === false) {
              return false;
            }

            container.trigger(eventPrefix + 'go', pageNumber);

            // Regains focus
            $('.J-paginationjs-go-pagenumber', el).focus();

            // After Go input enter
            self.callHook('afterGoInputOnEnter', event, pageNumber);
          }
        });

        // Previous page
        container.on(eventPrefix + 'previous', function (event, done) {
          self.previous(done);
        });

        // Next page
        container.on(eventPrefix + 'next', function (event, done) {
          self.next(done);
        });

        // Disable
        container.on(eventPrefix + 'disable', function () {
          self.disable();
        });

        // Enable
        container.on(eventPrefix + 'enable', function () {
          self.enable();
        });

        // Refresh
        container.on(eventPrefix + 'refresh', function (event, done) {
          self.refresh(done);
        });

        // Show
        container.on(eventPrefix + 'show', function () {
          self.show();
        });

        // Hide
        container.on(eventPrefix + 'hide', function () {
          self.hide();
        });

        // Destroy
        container.on(eventPrefix + 'destroy', function () {
          self.destroy();
        });

        // Whether to load the default page
        var validTotalPage = Math.max(self.getTotalPage(), 1)
        var defaultPageNumber = attributes.pageNumber;
        // Default pageNumber should be 1 when totalNumber is dynamic
        if (self.isDynamicTotalNumber) {
          defaultPageNumber = 1;
        }
        if (attributes.triggerPagingOnInit) {
          container.trigger(eventPrefix + 'go', Math.min(defaultPageNumber, validTotalPage));
        }
      }
    };

    // Pagination has been initialized
    if (container.data('pagination') && container.data('pagination').initialized === true) {
      // Handle events
      if ($.isNumeric(options)) {
        // eg: container.pagination(5)
        container.trigger.call(this, eventPrefix + 'go', options, arguments[1]);
        return this;
      } else if (typeof options === 'string') {
        var args = Array.prototype.slice.apply(arguments);
        args[0] = eventPrefix + args[0];

        switch (options) {
          case 'previous':
          case 'next':
          case 'go':
          case 'disable':
          case 'enable':
          case 'refresh':
          case 'show':
          case 'hide':
          case 'destroy':
            container.trigger.apply(this, args);
            break;
            // Get selected page number
          case 'getSelectedPageNum':
            if (container.data('pagination').model) {
              return container.data('pagination').model.pageNumber;
            } else {
              return container.data('pagination').attributes.pageNumber;
            }
            // Get total page
          case 'getTotalPage':
            return Math.ceil(container.data('pagination').model.totalNumber / container.data('pagination').model.pageSize);
            // Get data of selected page
          case 'getSelectedPageData':
            return container.data('pagination').currentPageData;
            // Whether pagination has been disabled
          case 'isDisabled':
            return container.data('pagination').model.disabled === true;
          default:
            throwError('Unknown action: ' + options);
        }
        return this;
      } else {
        // Uninstall the old instance before initializing a new one
        uninstallPlugin(container);
      }
    } else {
      if (!Helpers.isObject(options)) {
        throwError('Illegal options');
      }
    }

    // Check parameters
    parameterChecker(attributes);

    pagination.initialize();

    return this;
  };

  // Instance defaults
  $.fn[pluginName].defaults = {

    // Data source
    // Array | String | Function | Object
    //dataSource: '',

    // String | Function
    //locator: 'data',

    // Find totalNumber from remote response, the totalNumber will be ignored when totalNumberLocator is specified
    // Function
    //totalNumberLocator: function() {},

    // Total entries
    totalNumber: 0,

    // Default page
    pageNumber: 1,

    // entries of per page
    pageSize: 10,

    // Page range (pages on both sides of the current page)
    pageRange: 2,

    // Whether to display the 'Previous' button
    showPrevious: true,

    // Whether to display the 'Next' button
    showNext: true,

    // Whether to display the page buttons
    showPageNumbers: true,

    showNavigator: false,

    // Whether to display the 'Go' input
    showGoInput: false,

    // Whether to display the 'Go' button
    showGoButton: false,

    // Page link
    pageLink: '',

    // 'Previous' text
    prevText: '&laquo;',

    // 'Next' text
    nextText: '&raquo;',

    // Ellipsis text
    ellipsisText: '...',

    // 'Go' button text
    goButtonText: 'Go',

    // Additional className for Pagination element
    //className: '',

    classPrefix: 'paginationjs',

    // Default active class
    activeClassName: 'active',

    // Default disable class
    disableClassName: 'disabled',

    //ulClassName: '',

    // Whether to insert inline style
    inlineStyle: true,

    formatNavigator: '<%= currentPage %> / <%= totalPage %>',

    formatGoInput: '<%= input %>',

    formatGoButton: '<%= button %>',

    // Pagination element's position in the container
    position: 'bottom',

    // Auto hide previous button when current page is the first page
    autoHidePrevious: false,

    // Auto hide next button when current page is the last page
    autoHideNext: false,

    //header: '',

    //footer: '',

    // Aliases for custom pagination parameters
    //alias: {},

    // Whether to trigger pagination at initialization
    triggerPagingOnInit: true,

    // Whether to hide pagination when less than one page
    hideWhenLessThanOnePage: false,

    showFirstOnEllipsisShow: true,

    showLastOnEllipsisShow: true,

    // Pagination callback
    callback: function () {
    }
  };

  // Hook register
  $.fn[pluginHookMethod] = function (hook, callback) {
    if (arguments.length < 2) {
      throwError('Missing argument.');
    }

    if (!$.isFunction(callback)) {
      throwError('callback must be a function.');
    }

    var container = $(this);
    var paginationData = container.data('pagination');

    if (!paginationData) {
      container.data('pagination', {});
      paginationData = container.data('pagination');
    }

    !paginationData.hooks && (paginationData.hooks = {});

    //paginationData.hooks[hook] = callback;
    paginationData.hooks[hook] = paginationData.hooks[hook] || [];
    paginationData.hooks[hook].push(callback);

  };

  // Static method
  $[pluginName] = function (selector, options) {
    if (arguments.length < 2) {
      throwError('Requires two parameters.');
    }

    var container;

    // 'selector' is a jQuery object
    if (typeof selector !== 'string' && selector instanceof jQuery) {
      container = selector;
    } else {
      container = $(selector);
    }

    if (!container.length) {
      return;
    }

    container.pagination(options);

    return container;
  };

  // ============================================================
  // helpers
  // ============================================================

  var Helpers = {};

  // Throw error
  function throwError(content) {
    throw new Error('Pagination: ' + content);
  }

  // Check parameters
  function parameterChecker(args) {
    if (!args.dataSource) {
      throwError('"dataSource" is required.');
    }

    if (typeof args.dataSource === 'string') {
      if (args.totalNumberLocator === undefined) {
        if (args.totalNumber === undefined) {
          throwError('"totalNumber" is required.');
        } else if (!$.isNumeric(args.totalNumber)) {
          throwError('"totalNumber" is incorrect. (Number)');
        }
      } else {
        if (!$.isFunction(args.totalNumberLocator)) {
          throwError('"totalNumberLocator" should be a Function.');
        }
      }
    } else if (Helpers.isObject(args.dataSource)) {
      if (typeof args.locator === 'undefined') {
        throwError('"dataSource" is an Object, please specify "locator".');
      } else if (typeof args.locator !== 'string' && !$.isFunction(args.locator)) {
        throwError('' + args.locator + ' is incorrect. (String | Function)');
      }
    }

    if (args.formatResult !== undefined && !$.isFunction(args.formatResult)) {
      throwError('"formatResult" should be a Function.');
    }
  }

  // uninstall plugin
  function uninstallPlugin(target) {
    var events = ['go', 'previous', 'next', 'disable', 'enable', 'refresh', 'show', 'hide', 'destroy'];

    // off events of old instance
    $.each(events, function (index, value) {
      target.off(eventPrefix + value);
    });

    // reset pagination data
    target.data('pagination', {});

    // remove old
    $('.paginationjs', target).remove();
  }

  // Object type detection
  function getObjectType(object, tmp) {
    return ((tmp = typeof(object)) == "object" ? object == null && "null" || Object.prototype.toString.call(object).slice(8, -1)
        : tmp).toLowerCase();
  }

  $.each(['Object', 'Array', 'String'], function (index, name) {
    Helpers['is' + name] = function (object) {
      return getObjectType(object) === name.toLowerCase();
    };
  });

  /*
   * export via AMD or CommonJS
   * */
  if (typeof define === 'function' && define.amd) {
    define(function () {
      return $;
    });
  }

})(this, window.jQuery);