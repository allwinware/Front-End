AIRUI = (function () {
    'use strict';

  var $body = $('body'), //body
      $customSelect = $('.custom-select select'), //select
      $loadingThumb = $('.wing-thumb'); //로딩 이미지


    var AIRUI = {
        /**
         * 공통 UI
         */
        common: {
            init: function () {
              AIRUI.common.select();
              AIRUI.common.loading();
            },
            select: function () {
              $customSelect.select2({minimumResultsForSearch: -1});
            },
          loading: function () {
            var loading = new TimelineMax({repeat: -1});
            loading.to($loadingThumb, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-7C.svg)'})
            .to($loadingThumb, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-CX.svg)'})
            .to($loadingThumb, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-LJ.svg)'})
            .to($loadingThumb, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-NX.svg)'})
            .to($loadingThumb, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-PR.svg)'})
            .to($loadingThumb, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-SQ.svg)'})
            .to($loadingThumb, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-TG.svg)'})
            .to($loadingThumb, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-VJ.svg)'})
            .to($loadingThumb, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-VN.svg)'})
            .to($loadingThumb, 0.2, {backgroundImage: 'url(https://cdn.allwin.bid/static/img/wing/wing-ZE.svg)'});
          }
        },
      main: {
        init: function () {

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
                $(targetLayer).css({
                    'top': Math.max(0, (($(window).height() - $(targetLayer).height()) / 2) + $(window).scrollTop()) + "px",
                    'left': Math.max(0, (($(window).width() - $(targetLayer).width()) / 2) + $(window).scrollLeft()) + "px"
                }).fadeIn('fast');
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
                $("#" + layerID).fadeOut('fast');
                $('.dims').remove();
            }
        }
    };

    return AIRUI;
}());

$(function () {
    AIRUI.common.init();
});