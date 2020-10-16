
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
        separator: ' ~ ',
        language: 'auto',
        startOfWeek: 'sunday', // or monday
        getValue: function () {
            return $(this).val();
        },
        setValue: function (s) {
            // if (!$(this).attr('readonly') && !$(this).is(':disabled') && s != $(this).val()) {
            //   $(this).val(s);
            // }
            if (!$(this).is(':disabled') && s !== $(this).val()) {
              $(this).val(s);
            }
        },
        startDate: false,
        endDate: false,
        time: {
            enabled: false,
            startHour: '',
            endHour: '',
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
        getWeekNumber: function (date){
            /*date will be the first day of a week*/
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
    if (opt.isTouchDevice || opt.alwaysOpen) {
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
        if (opt.alwaysOpen) {
            box.append('<div class="datepicker-tooltip"></div>');
        }


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
                showTime(moment(opt.start || opt.startDate).toDate(), 'time-start');
                showTime(moment(opt.end || opt.endDate).toDate(), 'time-end');
            } else {
                var defaultEndTime = opt.defaultEndTime ? opt.defaultEndTime : defaultTime;
                showTime(defaultTime, 'time-start');
                showTime(defaultEndTime, 'time-end');
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


        /*시간 변경 시*/
        box.find('.time-start select').bind('change touchmove', function (e) {
            var target = e.target,
                hour = target.name === 'hour' ? $(target).val().replace(/^(\d{1})$/, '0$1') : undefined,
                min = target.name === 'minute' ? $(target).val().replace(/^(\d{1})$/, '0$1') : undefined;
            setTime('time-start', hour, min);
        });
        box.find('.time-end select').bind('change touchmove', function (e) {
            var target = e.target,
                hour = target.name === 'hour' ? $(target).val().replace(/^(\d{1})$/, '0$1') : undefined,
                min = target.name === 'minute' ? $(target).val().replace(/^(\d{1})$/, '0$1') : undefined;
            setTime('time-end', hour, min);
        });

    }

    function calcPosition() {
        if (!opt.inline) {
            var offset = $(self).offset();
            if ($(opt.container).css('position') === 'relative') {
                var containerOffset = $(opt.container).offset();
                var leftIndent = Math.max(0, offset.left + box.outerWidth() - $('body').width() + 16);
                box.css({
                    top: offset.top - containerOffset.top + $(self).outerHeight() + 4,
                    left: offset.left - containerOffset.left - leftIndent
                });
            } else {
                if (offset.left < 460) {
                    /*left to right*/
                    box.css({
                        top: offset.top + $(self).outerHeight() + parseInt($('body').css('border-top') || 0, 10),
                        left: offset.left
                    });
                } else {
                    box.css({
                        top: offset.top + $(self).outerHeight() + parseInt($('body').css('border-top') || 0, 10),
                        /*left: offset.left + $(self).width() - box.width() - 16*/
                        left: offset.left
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
                box.find('.time-start .hour select').val(moment(defaults[0]).format('HH'));
                box.find('.time-start .minute select').val(moment(defaults[0]).format('mm'));
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

    /*function renderTime(name, date) {
        box.find('.' + name + ' input[type=range].hour-range').val(moment(date).hours());
        box.find('.' + name + ' input[type=range].minute-range').val(moment(date).minutes());
        setTime(name, moment(date).format('HH'), moment(date).format('mm'));
    }*/
    function renderTime(name, date) {
        box.find('.' + name + ' select[name="hour"]').val(moment(date).format('HH')).prop("selected", true);
        box.find('.' + name + ' select[name="minute"]').val(moment(date).format('mm')).prop("selected", true);
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
      renderTime('time-start', opt.start);
      renderTime('time-end', opt.end);
    }

    function setTime(name, hour, minute) {
        hour && (box.find('.' + name + ' .hour-val').text(hour));
        minute && (box.find('.' + name + ' .minute-val').text(minute));
        switch (name) {
        case 'time-start':
            if (opt.start) {
                setRange('start', moment(opt.start));
            }
            setRange('startTime', moment(opt.startTime || moment().valueOf()));
        break;
        case 'time-end':
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
        tooltip = '<span class="datepicker-tooltip-inner">' + day.attr('data-tooltip') + '</span>';
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

        var $tip = box.find('.datepicker-tooltip');
        var w = $tip.css({
          'visibility': 'hidden',
          'display': 'none'
        }).html(tooltip).width();
        var h = $tip.height();
        _left -= w / 2;
        _top -= h;
        setTimeout(function () {
          $tip.css({
            left: _left + 25,
            top: _top + 60,
            display: 'block',
            'visibility': 'visible'
          });
        }, 10);
      } else {
        box.find('.datepicker-tooltip').hide();

      }
    }

    function clearHovering() {
      box.find('.day.hovering').removeClass('hovering');
      box.find('.datepicker-tooltip').hide();
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
          dateRange = moment(new Date(opt.start)).format("YYYY.MM.DD ") + box.find('.time-start .hour select').val().replace(/^(\d{1})$/, '0$1')
              + ":" + box.find('.time-start .minute select').val().replace(/^(\d{1})$/, '0$1');
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
        renderTime('time-start', date1);
        renderTime('time-end', date2);
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
        renderTime('time-start', date1);
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

      box.find('.' + month + ' .month-name').html(yearElement + '<span class="dot">.</span>' + monthElement);
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
        box.find('.datepicker-tooltip').hide();
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
        if(opt.time.startHour){
            var h_min = opt.time.startHour;
        } else {
            var h_min = '0';
        }

        if(opt.time.endHour){
            var h_limit = opt.time.endHour;
        } else {
            var h_limit = '23';
        }

        var h_option = [];
        function numberPad(n, width) {
            n = n + '';
            return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
        }
        for(var h=h_min; h <= h_limit; h++) {
            h_option += "<option>" + numberPad(h, 2) + "</option>";
        }

        var m_limit = '59';
        var m_option = '';

        for(var m=0; m <= m_limit; m++) {
            m_option += "<option>" + numberPad(m, 2) + "</option>";
        }
        return  '<div>' +
                '    <span class="total-time" style="font-size: 20px;">' + translate('Time') + '<span class="hour-val">00</span>시 <span class="minute-val">00</span>분</span>' +
                '</div>' +
                '<div class="time-choices">' +
                '    <span class="hour">' +
                '        <select name="hour">' +
                            h_option +
                '        </select>' +
                '    </span>' +
                '    <span class="minute">' +
                '        <select name="minute">' +
                            m_option +
                '        </select>' +
                '    </span>' +
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

      /*var _colspan = opt.showWeekNumbers ? 6 : 5;*/
        var _colspan = opt.showWeekNumbers ? 6 : 7;

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
          '               <th colspan="' + _colspan + '">' +
          '                     <span class="prev">' + arrowPrev + '</span>' +
          '                     <span class="month-name"></span>' +
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
            '       <tr class="caption">' +
        '               <th colspan="' + _colspan + '">' +
        '                     <span class="prev">' + arrowPrev + '</span>' +
        '                     <span class="month-name"></span>' +
        '                     <span class="next">' + arrowNext + '</span>' +
        '               </th>' +
        '           </tr>' +
            '       <tr class="week-name">' + getWeekHead() +
            '   </thead>' +
            '   <tbody></tbody>' +
            '   </table>' +
            '</div>';

      }

      //+'</div>'
      /*html += '<div class="dp-clearfix"></div>';
      if (opt.time.enabled) {
        html += '<div class="time clearfix">';
        html += '<div class="time-start"></div>';
        if (!opt.singleDate) {
          html += '<div class="time-end"></div>';
        }
        html += '</div>';
        html += '<div class="dp-clearfix"></div>';
      }
      html += '</div>';*/
    if (opt.time.enabled) {
        html += '<div class="time-wrapper">';
        html += '<div class="timepicker time-start"></div>';
        if (!opt.singleDate) {
            html += '<div class="timepicker time-end"></div>';
        }
    }
    html += '</div>';



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

