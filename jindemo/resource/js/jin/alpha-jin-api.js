var jinAlphaApi	= {
	// 비상구 좌석 동의체크		- true: 비상구동의좌석	/ false: 일반좌석
	// ##################################################################################################
	isValidEmergAgree	: function(seatList) {
		var _this	= this;
		
		var checkEmerg	= seatList.some(function(item){ return ((item.locAttrList) ? item.locAttrList.some(function(cur){ return cur.locCode == "E" }) : false) });
		var checkAgree	= _this.emergAgree;
		
		return (checkEmerg && !checkAgree);
	}
	// 제로존 좌석 체크			- true: 제로존 좌석	/ false: 일반좌석
	// ##################################################################################################
	,isValidZeroZoneSeat	: function(seatList) {
		var _this			= this;

		var facAttrNW		= seatList.filter(function(item){ return ((item.facAttrList) ? item.facAttrList.some(function(cur){ return cur.facCode == "NR" }) : false) });
		var locAttrLR		= seatList.filter(function(item){ return ((item.locAttrList) ? item.locAttrList.some(function(cur){ return cur.locCode == "LR" }) : false) });
		var locAttrNW		= seatList.filter(function(item){ return ((item.locAttrList) ? item.locAttrList.some(function(cur){ return cur.locCode == "NW" }) : false) });

		var	facAttrNWSeat	= facAttrNW.map(function(item){ return item.seatNo });
		var locAttrLRSeat	= locAttrLR.map(function(item){ return item.seatNo });
		var locAttrNWSeat	= locAttrNW.map(function(item){ return item.seatNo });
		
		var attrSeatList	= facAttrNWSeat.concat(locAttrLRSeat, locAttrNWSeat);
		var seatNoHtml		= Array.from(new Set(attrSeatList)).join(", ");
		var msgHtml			= "";
		
		if (facAttrNW.length > 0) {
			msgHtml			= facAttrNW[0].facAttrList.filter(function(item){ return item.facCode == "NR" })[0].facName;
		}
		
		if (locAttrLR.length > 0) {
			if (msgHtml == "") {
				msgHtml		= locAttrLR[0].locAttrList.filter(function(item){ return item.locCode == "LR" })[0].locName;
			} else {
				msgHtml		+= (" & "+ locAttrLR[0].locAttrList.filter(function(item){ return item.locCode == "LR" })[0].locName);
			}
		}
		
		if (locAttrNW.length > 0) {
			if (msgHtml == "") {
				msgHtml		= locAttrNW[0].locAttrList.filter(function(item){ return item.locCode == "NW" })[0].locName;
			} else {
				msgHtml		+= (" & "+ locAttrNW[0].locAttrList.filter(function(item){ return item.locCode == "NW" })[0].locName);
			}
		}
		
		$("[popup-type=zeroZoneChk]").find(".popup_con_txt").html(msgHtml+"<br>"+"("+seatNoHtml+")");
		
		return (facAttrNW.length > 0 || locAttrLR.length > 0 || locAttrNW.length > 0);
	}
	// 추천패턴 구매
	// ##################################################################################################
	,selAlphaSeat	: function(rcmndInfo, type) {
		var _this		= this;
		
		var paxList		= _this.config.PAX_INFO.paxList.filter((e) => !(e.airService && e.airService.seat && e.airService.seat.some((seat) => seat.segmentId == _this.config.SEG_INFO.segmentId)));
		var selRcmnd	= _this.config.PAX_INFO.selRcmnd;

		// ### 추천패턴 초기화 ###
		if (selRcmnd) {
			_this.cancAlphaSeat(type);
		}
		
		// ### 추천패턴 선택 ###
		_this.setSeatPurchsInfo("rcmnd", _this.config.PAX_INFO, rcmndInfo);

		var rcmndSeatList	= rcmndInfo.findPtrn;
		var noAdtList		= paxList.filter(function(item){ return (item.guardianYn == "Y" || item.paxType != "ADT" || (item.paxType == "ADT" && ((item.age) ? item.age < 15 : false)) )});

		// 유아동반 및 소아 승객 좌석배정
		if (noAdtList.length > 0) {
			noAdtLoop:
			for (var i=0; i<noAdtList.length; i++) {
				var noAdtPaxInfo	= noAdtList[i];

				if (noAdtPaxInfo.selSeat) {
					continue;
				}
				
				var selSeatInfo		= noAdtList.filter(function(item){ return item.selSeat });				// 좌석을 선택한 승객 
				var selSeatNoList	= selSeatInfo.map(function(item){ return item.selSeat.seatNo });		// 선택된 좌석 리스트
				
				for (var j=0; j<rcmndSeatList.length; j++) {
					var seatInfo	= rcmndSeatList[j];
					var selCheck	= selSeatNoList.includes(seatInfo.seatNo);
					
					// 구매된 좌석 체크
					if (selCheck) {
						continue;
					}
					
					if (_this.selSeat(noAdtPaxInfo, seatInfo, type)) {
						continue noAdtLoop;
					}
				}
			}
		}
		
		// 승객 좌석배정
		paxLoop:
		for (var i=0; i<paxList.length; i++) {
			var paxInfo			= paxList[i];
			
			if (paxInfo.selSeat) {
				continue;
			}
			
			var selSeatInfo		= paxList.filter(function(item){ return item.selSeat });					// 좌석을 선택한 승객 
			var selSeatNoList	= selSeatInfo.map(function(item){ return item.selSeat.seatNo });			// 선택된 좌석 리스트

			for (var j=0; j<rcmndSeatList.length; j++) {
				var seatInfo	= rcmndSeatList[j];
				var selCheck	= selSeatNoList.includes(seatInfo.seatNo);
				
				if (selCheck) {
					continue;
				}

				// 좌석 구매처리
				if (_this.selSeat(paxInfo, seatInfo, type)) {
					continue paxLoop;
				}
			}
		}
	}
	// 추천패턴 취소
	// ##################################################################################################
	,cancAlphaSeat	: function(type) {
		var _this			= this;
		var paxList			= _this.config.PAX_INFO.paxList;
		
		// 승객 좌석 구매취소
		for (var i=0; i<paxList.length; i++) {
			var paxInfo		= paxList[i];
			var seatInfo	= paxInfo.selSeat;
			
			if (seatInfo) {
				_this.cancSeat(paxInfo, seatInfo, type);
			}
		}
		
		// 그룹좌석 구매 초기화
		_this.setSeatPurchsInfo("rcmnd", _this.config.PAX_INFO, null);
	}
	// 좌석 구매처리
	// ##################################################################################################
	,selSeat	: function(paxInfo, seatInfo, type) {
		var _this		= this;
		var segIdx		= _this.config.SEG_IDX;
		
		var seatMap		= commSeatDisp.getApplyTarget("seat", "seatMap", segIdx);
		var seatEl		= seatMap.find("[seatno="+seatInfo.seatNo+"]");

		// true: 예약가능,	false: 예약불가능
		if (!_this.isValidInfantEmerg(paxInfo, seatInfo)) {
			return false;
		}
		
		// true: 예약가능,	false: 예약불가능
		if (!_this.isValidInfantBlock(paxInfo, seatInfo)) {
			return false;
		}
		
		// true: 예약가능,	false: 예약불가능
		if (!_this.isValidInfantRow(paxInfo, seatInfo)) {
			return false;
		}
		
		// true: 예약가능,	false: 예약불가능
		if (!_this.isValidChildEmerg(paxInfo, seatInfo)) {
			return false;
		}
		
		// ### 좌석 구매 ###
		_this.setSeatPurchsInfo("seat", paxInfo, seatInfo);
		
		switch (type) {
			case "rcmnd"	:
				seatEl.addClass("seat_active").find("span").hide();
				seatEl.attr("onclick", "return false");
				break;
			case "assign"	:
				seatEl.attr("onclick", "return false");
				break;
			case "each"	:
				seatEl.addClass("seat_active").find("span").hide();
				seatEl.attr("onclick", "apiCtl.onEachSeatClick('"+segIdx+"', '"+seatInfo.seatNo+"', 'canc', '"+paxInfo.rph+"')");
				break;
		}
		
		return true;
	}
	// 좌석 취소처리
	// ##################################################################################################
	,cancSeat	: function(paxInfo, seatInfo, type) {
		var _this		= this;
		
		var segIdx		= _this.config.SEG_IDX;
		var selRcmnd	= _this.config.PAX_INFO.selRcmnd;
		
		var seatMap		= commSeatDisp.getApplyTarget("seat", "seatMap", segIdx);
		var seatEl		= seatMap.find("[seatno="+seatInfo.seatNo+"]");
		
		// ### 좌석 취소 ###
		_this.setSeatPurchsInfo("seat", paxInfo, null);
		
		switch (type) {
			case "rcmnd"	:
				seatEl.attr("onclick", "apiCtl.onRcmndSeatClick('"+segIdx+"', '"+selRcmnd.gradeCd+"', '"+selRcmnd.rank+"', 'sel')");
				break;
			case "assign"	:
				seatEl.attr("onclick", "apiCtl.onAssignSeatClick('"+segIdx+"', '"+seatInfo.seatNo+"', 'sel')");
				break;
			case "each"	:
				seatEl.attr("onclick", "apiCtl.onEachSeatClick('"+segIdx+"', '"+seatInfo.seatNo+"', 'sel')");
				break;
		}
		
		// 좌석 Element 설정
		seatEl.removeClass("seat_active seat_active_pink").find("span").show();
	}
}