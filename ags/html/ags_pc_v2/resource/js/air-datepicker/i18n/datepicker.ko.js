/*
;(function ($) { $.fn.datepicker.language['ko'] = {
    days: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    daysShort: ['일요', '월요', '화요', '수요', '목요', '금요', '토요'],
    daysMin: ['일', '월', '화', '수', '목', '금', '토'],
    months: ['1월','2월','3월','4월','5월','6월', '7월','8월','9월','10월','11월','12월'],
    monthsShort: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    today: 'TODAY',
    clear: '초기화',
    dateFormat: 'yyyy-mm-dd',
    timeFormat: 'aa hh:ii',
    firstDay: 0
}; })(jQuery);*/


(function( datepicker ) {
    datepicker.regional.ko = {
        closeText: "닫기",
        prevText: "이전달",
        nextText: "다음달",
        currentText: "오늘",
        monthNames: [ "1월","2월","3월","4월","5월","6월", "7월","8월","9월","10월","11월","12월" ],
        monthNamesShort: [ "1월","2월","3월","4월","5월","6월", "7월","8월","9월","10월","11월","12월" ],
        dayNames: [ "일요일","월요일","화요일","수요일","목요일","금요일","토요일" ],
        dayNamesShort: [ "일","월","화","수","목","금","토" ],
        dayNamesMin: [ "일","월","화","수","목","금","토" ],
        weekHeader: "주",
        dateFormat: "yy-mm-dd",
        firstDay: 0,
        isRTL: false,
        showMonthAfterYear: true,
        yearSuffix: "년"
    };
    datepicker.setDefaults( datepicker.regional.ko );
    return datepicker.regional.ko;
});