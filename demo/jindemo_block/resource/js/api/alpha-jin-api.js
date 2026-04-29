var jinAlphaApi	= {
	// block 선택
	// ##################################################################################################
	selBlockSeat	: function(plusSeatLt) {
		var _this		= this;

		var paxInfo		= _this.config.PAX_INFO;
		var seatList	= _this.config.SEAT_INFO.seatList;
		var selBlock	= paxInfo.selBlock;
		
		if (selBlock) {
			plusSeatLt	= selBlock.concat(plusSeatLt);
		}

		var segIdx		= _this.config.SEG_IDX;
		var seatMap		= commSeatDisp.getApplyTarget("seat", "seatMap", segIdx);
		var blockChkLt	= [];

		for (var i=0; i<plusSeatLt.length; i++) {
			var plusSeat	= plusSeatLt[i];
			var blockSeatLt	= seatList.filter((e) => e.rowIdx == plusSeat.rowIdx && e.blockIdx == plusSeat.blockIdx);
			var blockPlusLt	= plusSeatLt.filter((e) => e.rowIdx == plusSeat.rowIdx && e.blockIdx == plusSeat.blockIdx);
			
			if (blockSeatLt.length == blockPlusLt.length) {
				blockChkLt.push(plusSeat);
			}
		}

		// ### 블락선택 설정 ###
		_this.setSeatPurchsInfo("block", paxInfo, blockChkLt);
		
		for (var i=0; i<plusSeatLt.length; i++) {
			_this.selPlusSeat(plusSeatLt[i]);
		}
		
		seatMap.find(".cancel_xx").hide();
		seatMap.find(".ballon_box2").hide();
	}
	// block 선택취소
	// ##################################################################################################
	,cacnBlockSeat	: function(plusSeatLt) {
		var _this		= this;

		var paxInfo		= _this.config.PAX_INFO;
		var selBlock	= paxInfo.selBlock;
		
		for (var i=0; i<plusSeatLt.length; i++) {
			_this.cancPlusSeat(plusSeatLt[i]);
		}
		
		if (selBlock) {
			plusSeatLt	= selBlock.filter((e) => !plusSeatLt.some((seat) => seat.seatNo == e.seatNo));
		}
		
		// ### 블락선택 설정 ###
		_this.setSeatPurchsInfo("block", paxInfo, plusSeatLt);
	}
	// block > 좌석 선택
	,selPlusSeat	: function(plusSeat) {
		var _this		= this;

		var paxInfo		= _this.config.PAX_INFO;
		var selBlock	= paxInfo.selBlock || [];
		var selPlus		= paxInfo.selPlus;
		
		// ### 플러스선택 초기화 ###
		if (!selPlus) {
			selPlus		= [];
		}
		
		var segIdx		= _this.config.SEG_IDX;
		var checkPlus	= selPlus.some((e) => e.seatNo == plusSeat.seatNo);
		var plusLt		= (checkPlus) ? selPlus : selPlus.concat(plusSeat);
		
		var seatList	= _this.config.SEAT_INFO.seatList
		var seatMap		= commSeatDisp.getApplyTarget("seat", "seatMap", segIdx);
		var selMode		= seatMap.data("mode");
		
		var blockSeatLt	= seatList.filter((e) => e.rowIdx == plusSeat.rowIdx && e.blockIdx == plusSeat.blockIdx);
		var plusSeatLt	= selBlock.filter((e) => e.rowIdx == plusSeat.rowIdx && e.blockIdx == plusSeat.blockIdx);
		var target		= seatMap.find("[seatno="+plusSeat.seatNo+"]");

		// ### 플러스선택 설정 ###
		_this.setSeatPurchsInfo("plus", paxInfo, plusLt);

		target.addClass("seat_active_plus").find("span").hide();
		target.off().one("click", function() {
			if (blockSeatLt.length == plusSeatLt.length) {
				_this.cacnBlockSeat(plusSeatLt);
			} else {
				_this.cancPlusSeat(plusSeat);
			}
			
			if (selMode == "semiAuto") {
				seatMap.find("[semiCancBtn]").show();
			}
			
			demoCtl.setSelContents();
		});
		
//		var selSeatLt	= paxInfo.paxList.filter((e) => e.selSeat).map((e) => e.selSeat);
//		var itgSeatLt	= selSeatLt.filter((e) => e.row == plusSeat.row).concat(plusLt).sort((a,b) => a.colIdx - b.colIdx);
		
		// border
//		if (!_this.config.purchsed) {
//			seatMap.find("svg").html(commSeatDisp.getBlockBorderHtml(segIdx, itgSeatLt));
//		}
	}
	// block > 좌석 선택취소
	,cancPlusSeat	: function(plusSeat) {
		var _this		= this;

		var segIdx		= _this.config.SEG_IDX;
		var paxInfo		= _this.config.PAX_INFO;
		
		var selBlock	= paxInfo.selBlock || [];
//		var selRcmnd	= paxInfo.selRcmnd;
		var selPlus		= paxInfo.selPlus;
		var plusLt		= selPlus.filter((e) => e.seatNo != plusSeat.seatNo);
		
		var seatList	= _this.config.SEAT_INFO.seatList
		var seatMap		= commSeatDisp.getApplyTarget("seat", "seatMap", segIdx);
		var selMode		= seatMap.data("mode");

		var blockSeatLt	= seatList.filter((e) => e.rowIdx == plusSeat.rowIdx && e.blockIdx == plusSeat.blockIdx);
		var plusSeatLt	= selBlock.filter((e) => e.rowIdx == plusSeat.rowIdx && e.blockIdx == plusSeat.blockIdx);
		var target		= seatMap.find("[seatno="+plusSeat.seatNo+"]");
		
		target.removeClass("seat_active_plus").find("span").show();
		target.off().one("click", function() {
			if (blockSeatLt.length == plusSeatLt.length) {
				_this.selBlockSeat(plusSeatLt);
			} else {
				_this.selPlusSeat(plusSeat);
			}
			
			if (selMode == "semiAuto") {
				seatMap.find("[semiCancBtn]").hide();
			}
			
			demoCtl.setSelContents();
		});
		
		// border
//		if (_this.config.purchsed) {
			seatMap.find("svg").html("");
//		} else {
//			seatMap.find("svg").html(commSeatDisp.getBlockBorderHtml(segIdx, selRcmnd.findPtrn));
//		}
		
		// 선택 초기화
		if (_this.config.purchsed) {
			_this.setSeatPurchsInfo("plus", paxInfo, plusLt);
		}
	}
	// auto 선택
	// ##################################################################################################
	,selRcmndSeat	: function(autoRcmnd) {
		var _this		= this;

		var paxInfo		= _this.config.PAX_INFO;
		var selRcmnd	= paxInfo.selRcmnd;
		var selPaxLt	= paxInfo.paxList.filter((e) => e.selSeat);
		
		// 선택 초기화
		if (selRcmnd || selPaxLt.length > 0) {
			_this.cancRcmndSeat();
		}

		var segIdx		= _this.config.SEG_IDX;
		var paxList		= paxInfo.paxList;
		var seatMap		= commSeatDisp.getApplyTarget("seat", "seatMap", segIdx);
		
		// ### 블락선택 설정 ###
		_this.setSeatPurchsInfo("rcmnd", paxInfo, autoRcmnd);
		
		var rcmndSeatLt	= autoRcmnd.findPtrn;

		for (var i=0; i<rcmndSeatLt.length; i++) {
			_this.selSeat(paxList[i], rcmndSeatLt[i], "rcmnd");
		}

		demoCtl.setPlusSeat();
		seatMap.find(".ballon_box1").hide();
		seatMap.find(".ballon_box3").hide();
	}
	// auto 선택취소
	// ##################################################################################################
	,cancRcmndSeat	: function() {
		var _this		= this;
		
		var segIdx		= _this.config.SEG_IDX;
		var paxInfo		= _this.config.PAX_INFO;
		
		var paxList		= paxInfo.paxList;
		var selPlus		= paxInfo.selPlus || [];
		var seatMap		= commSeatDisp.getApplyTarget("seat", "seatMap", segIdx);
		
		// 승객 좌석 구매취소
		for (var i=0; i<paxList.length; i++) {
			var currPax		= paxList[i];
			var seatInfo	= currPax.selSeat;
			
			if (seatInfo) {
				_this.cancSeat(currPax, seatInfo, "rcmnd");
			}
		}

		// auto > plus 좌석 초기화
		for (var i=0; i<selPlus.length; i++) {
			var plusSeat	= selPlus[i];
			var target		= seatMap.find("[seatno="+plusSeat.seatNo+"]");
		
			if (plusSeat) {
				target.removeClass("seat_orange seat_active plus_block seat_active_plus").find("span").html("").show();
				target.off().attr("onclick", "demoCtl.onAutoRcmndClick('"+plusSeat.seatNo+"', 'sel');");
			}
		}
		
		// auto 선택 초기화
		_this.setSeatPurchsInfo("rcmnd", paxInfo, null);
		_this.setSeatPurchsInfo("plus", paxInfo, null);
	}
	// 좌석 구매처리
	// ##################################################################################################
	,selSeat	: function(paxInfo, seatInfo, type) {
		var _this		= this;
		var segIdx		= _this.config.SEG_IDX;
		
		var seatMap		= commSeatDisp.getApplyTarget("seat", "seatMap", segIdx);
		var target		= seatMap.find("[seatno="+seatInfo.seatNo+"]");

		// ### 좌석 구매 ###
		_this.setSeatPurchsInfo("seat", paxInfo, seatInfo);
		
		switch (type) {
			case "purchsed"	:
				target.addClass("seat_active").find("span").hide();
				break;
			case "rcmnd"	:
				target.addClass("seat_active").find("span").hide();
				target.attr("onclick", "return false");
				break;
			case "manual"	:
				target.addClass("seat_active").find("span").hide();
				target.attr("onclick", "demoCtl.onManualSeatClick('"+seatInfo.seatNo+"', 'canc', '"+paxInfo.rph+"')");
				break;
		}
	}
	// 좌석 취소처리
	// ##################################################################################################
	,cancSeat	: function(paxInfo, seatInfo, type) {
		var _this		= this;
		
		var segIdx		= _this.config.SEG_IDX;
		var seatMap		= commSeatDisp.getApplyTarget("seat", "seatMap", segIdx);
		var target		= seatMap.find("[seatno="+seatInfo.seatNo+"]");

		// ### 좌석 취소 ###
		_this.setSeatPurchsInfo("seat", paxInfo, null);

		switch (type) {
			case "rcmnd"	:
				target.removeClass("seat_orange seat_active plus_block seat_active_plus").find("span").html("").show();
				target.attr("onclick", "demoCtl.onAutoRcmndClick('"+seatInfo.seatNo+"', 'sel');");
				break;
			case "manual"	:
				target.removeClass("seat_orange seat_active plus_block seat_active_plus").find("span").html("").show();
				target.attr("onclick", "demoCtl.onManualSeatClick('"+seatInfo.seatNo+"', 'sel');");
				break;
		}
	}
}