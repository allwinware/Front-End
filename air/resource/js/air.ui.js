AIRUI = (function () {
  'use strict';

  var AIRUI = {
    /**
     * 공통 UI
     */
    common: {
      init: function () {
        AIRUI.common.select();
        AIRUI.common.loading();
        AIRUI.common.tooltips();
        AIRUI.common.top();
        AIRUI.common.summery();
      },
      select: function () {
        $('.custom-select select').select2({minimumResultsForSearch: -1});
        // $('.awa-select__srch select').select2();
      },
      loading: function () {
        var $elGSAP = $('.wing-thumb'),
            tl = new TimelineMax({repeat: -1});
        tl.to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-7C.svg)'})
        .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-CX.svg)'})
        .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-LJ.svg)'})
        .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-NX.svg)'})
        .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-PR.svg)'})
        .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-SQ.svg)'})
        .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-TG.svg)'})
        .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-VJ.svg)'})
        .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-VN.svg)'})
        .to($elGSAP, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-ZE.svg)'});
      },
      tooltips: function () {
        $('.js-tooltips').each(function () {
          var position, direction = $(this).data('tooltip-direction');
          switch (direction) {
            case 'top':
              position = {
                my: 'center bottom', at: 'center top', collision: 'none',
                using: function (position, feedback) {
                  $(this).addClass(feedback.vertical).css(position);
                }
              };
              break;
            case 'bottom':
              position = {
                my: 'center top', at: 'center bottom', collision: 'none',
                using: function (position, feedback) {
                  $(this).addClass(feedback.vertical).css(position);
                }
              };
              break;
            case 'left':
              position = {
                my: 'right center', at: 'left center',
                using: function (position, feedback) {
                  $(this).addClass(feedback.horizontal).css(position);
                }
              };
              break;
            case 'right':
              position = {
                my: 'left center', at: 'right center',
                using: function (position, feedback) {
                  $(this).addClass(feedback.horizontal).css(position);
                }
              };
              break;
          }

          $(this).tooltip({
            show: null,
            items: "[data-tooltip-txt]",
            position: position,
            content: function () {
              return $(this).data("tooltip-txt");
            },
            open: function (event, ui) {
              if (direction == "right" || direction == "left") {
                ui.tooltip.animate({left: ui.tooltip.position().left + 5}, "fast");
              } else if (direction == "top") {
                ui.tooltip.animate({top: ui.tooltip.position().top - 5}, "fast");
              } else if (direction == "bottom") {
                ui.tooltip.animate({top: ui.tooltip.position().top + 5}, "fast");
              }
            }

          });
        });
        $(".ui-helper-hidden-accessible").remove();
      },
      top: function () {
        if ($('.air-top').length > 0) {
          if ($('.quick-summery .top').length > 0) {
            $('.air-top').hide();
          } else {
            $(window).on('scroll', function () {
              if ($(this).scrollTop() > $(window).height()) {
                $('.air-top').show();
                if ($('.air-top').offset().top + $('.air-top').height() >= $('.footer').offset().top - 10) {
                  $('.air-top').hide();
                }

                if ($('.land-want').length > 0) {
                  $('.air-top').css('bottom', '70px');
                } else {
                  $('.air-top').css('bottom', '20px');
                }
              } else {
                $('.air-top').hide();
              }
            });
            $(document).on('click', '.air-top', function () {
              $("html, body").animate({scrollTop: 0}, "fast");
              return false;
            });
          }
        }
      },
      summery: function () {
        var summeryPos;

        scrollCheck();

        function scrollCheck() {
          if ($('.main-evt').length > 0) {
            summeryPos = 973;
            $('.quick-summery').addClass('more');
            if ($('.main-evt').css('display') === "none") {
              summeryPos = 853;
              $('.quick-summery').removeClass('more');
            }
          } else {
            summeryPos = 853;
            $('.quick-summery').removeClass('more');
          }

        }

        if ($('body').hasClass('main')) {
          $(window).on('scroll', function () {
            scrollCheck();

            var bannerCheck;
            if ($('.evt-banners').length > 0) {
              bannerCheck = $('.evt-banners').offset().top - 400
            } else {
              bannerCheck = $('.allwin-recommend').offset().top
            }

            if ($(window).scrollTop() + $('.quick-summery').height() >= bannerCheck) {
              $('.quick-summery').css({
                'position': 'absolute',
                'top': summeryPos + "px"
              });
            } else {
              $('.quick-summery').attr('style', '')
            }
          });
        }
      }
    },
    /**
     * 모달 UI
     */
    layer: {
      open: function (layerID) {
        var targetLayer = "#" + layerID,
            dims = $('<div class="dims"></div>');

        $('body').addClass('kill');
        $(targetLayer).fadeIn('fast');
        // $(targetLayer).css({
        //   'top': Math.max(0, (($(window).height() - $(targetLayer).height()) / 2) + $(window).scrollTop()) + "px",
        //   'left': Math.max(0, (($(window).width() - $(targetLayer).width()) / 2) + $(window).scrollLeft()) + "px"
        // }).fadeIn('fast');
        $(dims).appendTo('body').css({
          'width': '100%',
          'height': '100%',
          'display': 'none',
          'background-color': '#000',
          'filter': 'alpha(opacity=50)',
          'position': 'fixed',
          'top': 0,
          'left': 0,
          'z-index': 99
        }).fadeTo('fast', 0.5);
      },
      close: function (layerID) {
        $('body').removeClass('kill');
        $("#" + layerID).fadeOut('fast', function () {
          $(this).trigger('fadeOutAfter');
        });
        $('.dims').remove();
      }
    }
  };

  return AIRUI;
}());

$(function () {
  AIRUI.common.init();
});