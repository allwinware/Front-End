var commSeatApi	= {
	// 좌석유효성 체크
	// ##################################################################################################
	seatPolicyValid	: function(deferred) {
		var _this	= this;

		var paxList			= _this.config.PAX_INFO.paxList;
		var occupiedLt		= _this.occupiedLt || [];
		
		// seatApi config object 초기화
		_this.config.SEAT_INFO		= {};
		_this.config.PTRN_INFO		= {};
		_this.config.ASSIGN_INFO	= [];	

		// 좌석요금조회
		_this.reqSeatChargeInfo().then((chargeData) => {
			_this.config.SEAT_INFO.avail	= true;
			_this.config.SEAT_INFO.origin	= chargeData;
			_this.config.SEAT_INFO.seatList	= chargeData.seatMap.seatRowList.reduce((acc,cur) => acc.concat(cur.seatInfoList), []);
			_this.config.SEAT_INFO.seatObj	= chargeData.seatMap.seatRowList.reduce((acc,cur) => { cur.seatInfoList.forEach((seat) => acc[seat.row+'-'+seat.col] = seat); return acc; }, {});
			_this.config.SEAT_INFO.acType	= chargeData.seatMap.acType || "";

			// occupiedLt 설정
			_this.config.SEAT_INFO.seatList.forEach((e) => {
				if (occupiedLt.includes(e.seatNo)) {
					e.seatStatus	= ".";
				}
				
				if (e.seatStatus == "A") {
					e.charge		= 40000;
				}
			})
			
			var paxCnt		= paxList.length;
			var reqList		= [];
			
			reqList.push(_this.reqWeightInfo(paxCnt));
			
			// avail reqList responses
			$.when.apply($, reqList).then(function(weightData) {
				_this.config.PTRN_INFO			= weightData;

				// rowIdx,colIdx,blockIdx 설정 
				_this.getAlphaSeatConfig();
				
				// semiAuto 패턴 설정
				if (!_this.config.purchsed) {
					_this.getAlphaAssignPtrn();
				}
				
				// 좌석맵설정 
				_this.setSeatDispInfo("seat", "seatCharge");
				
				if (!_this.config.purchsed) {
					_this.setSeatDispInfo("seat", "autoRcmnd");
				}
				
				if (!_this.config.purchsed && paxCnt <= 1) {
					_this.setSeatDispInfo("seat", "basicSelt");
				}
				

				deferred.resolve("seat-policy-valid-response");
			})
		})

		return deferred.promise();
	}
	// 좌석 요금정보 조회
	// ##################################################################################################
	,reqSeatChargeInfo	: function() {
		var _this		= this;
		var deferred	= $.Deferred();
		
		fetch(_this.config.pathInfo.seatChargePath+".json").then((res) => {
			return res.json();
		}).then((data) => {
			deferred.resolve(data);
		})
		
		return deferred.promise();
	}
	// 가중치 정보조회
	// ##################################################################################################
	,reqWeightInfo	: function(paxCnt) {
		var _this			= this;
		var deferred		= $.Deferred();
		
		var weightPath		= _this.config.pathInfo.seatWeightPath+"-weight-"+paxCnt+".json";
		
		fetch(weightPath).then((res) => {
			return res.json();
		}).then((data) => {
			deferred.resolve(data);
		})
		
		return deferred.promise();
	}
	// 좌석 화면설정
	// ##################################################################################################
	,setSeatDispInfo	: function(cantainer, target, data) {
		var	_this		= this;
		var segIdx		= _this.config.SEG_IDX;
		
		var applyTarget	= commSeatDisp.getApplyTarget(cantainer, target, segIdx);
		var	html		= "";
		
		switch (target) {
			case "seatCharge"	:
				commSeatDisp.updateSeatChargeHtml(segIdx, _this.config.SEAT_INFO);
				break;
			case "autoRcmnd"	:
				commSeatDisp.updateAutoRcmndHtml(segIdx, _this.config.SEAT_INFO);
				break;
			case "basicSelt"	:
				commSeatDisp.updateBasicSeltHtml(segIdx, _this.config.SEAT_INFO, _this.config.PAX_INFO);
				break;
			case "basicSeltCancBtn"	:
				html	= commSeatDisp.getBasicSeltCancBtnHtml(segIdx, _this.config.PAX_INFO.paxList);
				applyTarget.html(html);
				break;
		}
	}
	// 그룹시트 구매 처리
	// ##################################################################################################
	,setSeatPurchsInfo	: function(svcType, selPaxInfo, selData) {
		if (selPaxInfo) {
			switch (svcType) {
				case "block"	:
					selPaxInfo.selBlock		= selData;
					break;
				case "plus"	:
					selPaxInfo.selPlus		= selData;
					break;
				case "rcmnd"	:
					selPaxInfo.selRcmnd		= selData;
					break;
				case "seat"	:
					selPaxInfo.selSeat		= selData;
					break;
			}
		}
	}
	// 블락 > plus 요금조회
	// ##################################################################################################
	,getSelPlusCharge	: function() {
		var _this	= this;

		var selPlus		= _this.config.PAX_INFO.selPlus || [];
		var plusCharge	= _this.config.plusCharge;

		var totalCharge	= 0;
		
		if (selPlus.length > 0) {
			totalCharge	= selPlus.reduce((acc,cur) => acc+plusCharge, 0);
		}

		return totalCharge;
	}
}