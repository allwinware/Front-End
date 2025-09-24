var commSeatApi	= {
	// 좌석유효성 체크
	// ##################################################################################################
	seatPolicyValid	: function(deferred) {
		var _this	= this;

		var paxList			= _this.config.PAX_INFO.paxList;
		var paxCnt			= paxList.length;
		
		// seatApi config object 초기화
		_this.config.SEAT_INFO		= {};
		_this.config.PTRN_INFO		= {};
		_this.config.RCMND_INFO		= [];
		_this.config.ASSIGN_INFO	= [];	

		// 좌석요금조회
		_this.reqSeatChargeInfo().then((chargeData) => {
			_this.config.SEAT_INFO.avail	= true;
			_this.config.SEAT_INFO.origin	= chargeData;
			_this.config.SEAT_INFO.seatList	= chargeData.seatMap.seatRowList.reduce((acc,cur) => acc.concat(cur.seatInfoList), []);
			_this.config.SEAT_INFO.seatObj	= chargeData.seatMap.seatRowList.reduce((acc,cur) => { cur.seatInfoList.forEach((seat) => acc[seat.row+'-'+seat.col] = seat); return acc; }, {});
			_this.config.SEAT_INFO.acType	= chargeData.seatMap.acType || "";
			
			var reqList		= [];
			
			reqList.push(_this.reqWeightInfo());
			
			// avail reqList responses
			$.when.apply($, reqList).then(function(weightData) {
				_this.config.PTRN_INFO			= weightData;
				
				// rowIdx,colIdx,blockIdx 설정 
				_this.getAlphaSeatConfig();
				
				if (paxCnt > 1) {
					_this.getAlphaAssignPtrn();
				}
				
				// 좌석맵설정 
				_this.setSeatDispInfo("seat"	, "seatRows");
				_this.setSeatDispInfo("seat"	, "seatCharge");
				_this.setSeatDispInfo("seat"	, "noMask");
				
				if (paxCnt <= 1) {
					_this.setSeatDispInfo("seat", "basicSelt");
				}
				
				_this.setSeatDispInfo("seat"	, "autoRcmnd");
				_this.setSeatDispInfo("seat"	, "autoRcmndMark");
				
				// 추천좌석 데이터 적용
				try {
					_this.setSeatDispInfo("seat"	, "areaPreview");
				} catch (e) {
					_this.setSeatDispInfo("seat"	, "basicPreview");
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
		
		fetch(_this.config.pathInfo.seatChargePath).then((res) => {
			return res.json();
		}).then((data) => {
			deferred.resolve(data);
		})
		
		return deferred.promise();
	}
	// 가중치 정보조회
	// ##################################################################################################
	,reqWeightInfo	: function() {
		var _this			= this;
		var deferred		= $.Deferred();
		
		fetch(_this.config.pathInfo.seatWeightPath).then((res) => {
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
		var airType		= _this.config.SEG_INFO.airType.toLowerCase();
		
		var applyTarget	= commSeatDisp.getApplyTarget(cantainer, target, segIdx);
		var	html		= "";
		
		switch (target) {
			case "seatRows"	:
				if (typeof(window[airType+"AlphaDisp"].updateSeatRowsHtml) == "function") {
					window[airType+"AlphaDisp"].updateSeatRowsHtml(segIdx, _this.config.SEAT_INFO);
				}
				break;
			case "seatCharge"	:
				if (typeof(window[airType+"AlphaDisp"].updateSeatChargeHtml) == "function") {
					window[airType+"AlphaDisp"].updateSeatChargeHtml(segIdx, _this.config.SEAT_INFO);
				} else {
					commSeatDisp.updateSeatChargeHtml(segIdx, _this.config.SEAT_INFO);
				}
				break;
			case "noMask"	:
				if (typeof(window[airType+"AlphaDisp"].updateInfantNoMaskMapHtml) == "function") {
					window[airType+"AlphaDisp"].updateInfantNoMaskMapHtml(segIdx, _this.config.PAX_INFO, _this.config.SEAT_INFO);
				}
				break;
			case "areaPreview"	:
				html	= commSeatDisp.getAreaPreviewMapHtml(segIdx, _this.config.SEAT_INFO.seatList, _this.config.PTRN_INFO.areaZoneInfoMap);
				applyTarget.html(html);
				break;
			case "basicPreview"	:
				html	= commSeatDisp.getBasicPreviewMapHtml(segIdx, _this.config.SEAT_INFO.seatList);
				applyTarget.html(html);
				break;
			case "autoRcmnd"	:
				commSeatDisp.updateAutoRcmndHtml(segIdx, _this.config.RCMND_INFO);
				break;
			case "autoRcmndMark"	:
				html	= commSeatDisp.getAutoRcmndMarkHtml(segIdx, _this.config.RCMND_INFO);
				applyTarget.html(html);
				break;
			case "semiRcmnd"	:
				commSeatDisp.updateSemiRcmndHtml(segIdx, _this.config.SEAT_INFO.seatList);
				break;
			case "basicSelt"	:
				commSeatDisp.updateBasicSeltHtml(segIdx, _this.config.SEAT_INFO.seatList, _this.config.PAX_INFO.paxList);
				break;
			case "basicSeltCancBtn"	:
				html	= commSeatDisp.getBasicSeltCancBtnHtml(segIdx, _this.config.PAX_INFO.paxList);
				applyTarget.html(html);
				break;
			case "selSeatMap"	:
				html	= commSeatDisp.getAlphaSelSeatMapHtml(segIdx, _this.config.SEG_INFO, _this.config.PAX_INFO, _this.config.SEAT_INFO);
				applyTarget.html(html);
				break;
			case "seatAdjustment"	:
				html	= commSeatDisp.getAlphaSeatAdjustmentHtml(segIdx, _this.config.SEG_INFO, _this.config.PAX_INFO, _this.config.SEAT_INFO);
				applyTarget.html(html);
				break;
		}
	}
	// 좌석 구매불가 화면설정
	// ##################################################################################################
	,setSeatErrorDispInfo	: function(cantainer, target, errType, comment) {
		var	_this		= this;

		var segIdx		= _this.config.SEG_IDX;
		var applyTarget	= commSeatDisp.getApplyTarget(cantainer, target, segIdx);
		
		var	html		= "";

		switch (target) {
			case "seatMap" :
				html	= commSeatDisp.getSeatErrorHtml(segIdx, errType, comment);
				applyTarget.html(html);
				break;
		}
		
		_this.config.SEAT_INFO.errType	= errType;
		_this.config.SEAT_INFO.avail	= false;
	}
	// 10명이상 승객 패턴 추출
	// ##################################################################################################
	,getGroupAssignFindPtrn	: function(seatNo, paxCnt) {
		var _this			= this;

		var rowArr			= _this.config.SEAT_INFO.seatList.map(function(item){ return {row: item.row, rowIdx: item.rowIdx} });
		var rowArrSort		= rowArr.sort(function(a, b){ return a.rowIdx - b.rowIdx }).map(function(item){ return item.row });
		var duplRowArr		= rowArrSort.filter(function(item, idx, self){ return self.indexOf(item) == idx });
		var colArr			= _this.config.SEAT_INFO.seatList.map(function(item){ return item.col });
		var duplColArr		= colArr.filter(function(item, idx, self){ return self.indexOf(item) == idx }).sort();
		var blockArr		= _this.config.PTRN_INFO.seatConfig.split("-").reduce(function(acc,cur,idx){ acc.push(Number(cur)+Number(acc[idx-1] || 0)); return acc; }, []);
		var seatList		= _this.config.SEAT_INFO.seatList.reduce(function(acc, cur, idx, src){
								   cur.rowIdx = duplRowArr.findIndex(function(item){ return item == cur.row });
								   cur.colIdx = duplColArr.findIndex(function(item){ return item == cur.col });
								   cur.blockIdx = blockArr.findIndex(function(item){ return item > cur.colIdx });
								   acc.push(cur);
								   return acc;
							  }, []);
		var selSeat			= seatList.filter(function(item){ return (item.seatNo == seatNo) })[0];
		var selRowseat		= seatList.filter(function(item){ return (item.seatNo == seatNo) })[0];
		var leftRowList		= seatList.filter(function(item){ return (item.rowIdx == selSeat.rowIdx && item.colIdx < selSeat.colIdx) }).sort(function(a, b){ return b.colIdx - a.colIdx });
		var rightRowList	= seatList.filter(function(item){ return (item.rowIdx == selSeat.rowIdx && item.colIdx > selSeat.colIdx) }).sort(function(a, b){ return a.colIdx - b.colIdx });
		var rowIndex		= 1;
		var signYn			= true;
		var infoArr			= {};
		var findPtrnArr		= [];
		
		do {
			if(leftRowList.length == 0 && rightRowList.length == 0){
				var curRowIdx	= signYn ? selSeat.rowIdx + rowIndex : selSeat.rowIdx - rowIndex;
				selRowseat		= seatList.filter(function(item){ return (item.rowIdx == curRowIdx && item.colIdx == selSeat.colIdx) })[0];
				leftRowList		= seatList.filter(function(item){ return (item.rowIdx == curRowIdx && item.colIdx < selSeat.colIdx) }).sort(function(a, b){ return b.colIdx - a.colIdx });
				rightRowList	= seatList.filter(function(item){ return (item.rowIdx == curRowIdx && item.colIdx > selSeat.colIdx) }).sort(function(a, b){ return a.colIdx - b.colIdx });
				rowIndex++;
			}
			if(selRowseat){
				var checkRow = findPtrnArr.some(function(item){ return item.rowIdx == selRowseat.rowIdx && item.colIdx == selRowseat.colIdx });
				
				if(!checkRow){
					if(selRowseat.seatStatus == "A" && selRowseat.charge > 0){
						findPtrnArr.push(selRowseat);
						continue;
					}else{
						if(signYn){
							leftRowList.length = 0;
							rightRowList.length = 0;
							signYn = false;
							rowIndex = 1;
							continue;
						}else{
							break;
						}
					}
				}
			}else{
				if(signYn){
					leftRowList.length = 0;
					rightRowList.length = 0;
					signYn = false;
					rowIndex = 1;
					continue;
				}else{
					break;
				}	
			}
			if(leftRowList && leftRowList.length > 0){
				var leftSeatInfo = leftRowList[0];
				if(leftSeatInfo.seatStatus == "A" && leftSeatInfo.charge > 0){
					findPtrnArr.push(leftSeatInfo);
					leftRowList.shift();
					continue;
				}else{
					leftRowList.length = 0;
				}
			}
			if(rightRowList && rightRowList.length > 0){
				var rightSeatInfo = rightRowList[0];
				if(rightSeatInfo.seatStatus == "A" && rightSeatInfo.charge > 0){
					findPtrnArr.push(rightSeatInfo);
					rightRowList.shift();
					continue;
				}else{
					rightRowList.length = 0;
				}
			}
			if(!signYn && leftRowList.length == 0 && rightRowList.length == 0){
				var checkSeat = seatList.filter(function(item){ return (item.rowIdx == selSeat.rowIdx - rowIndex - 1 && item.colIdx == selSeat.colIdx) });
				if(checkSeat.length == 0){
					break;
				}
			}
		} while (findPtrnArr.length < paxCnt);
		
		findPtrnArr = findPtrnArr.sort(function(a, b){ return a.rowIdx - b.rowIdx || a.colIdx - b.colIdx });
		infoArr.findPtrn = findPtrnArr;
		infoArr.seatConfig = _this.config.PTRN_INFO.seatConfig.split("-");

		// 유아동반 좌석 블록체크, 소아동반 좌석 블록체크, 유아동반+소아 좌석 블록체크
		if (_this.isValidInfantSeatBlock(findPtrnArr) && _this.isValidInfantSeatRow(findPtrnArr) && _this.isValidChildSeatBlock(findPtrnArr) && _this.isValidInfantChildSeatBlock(findPtrnArr)) {
			_this.config.ASSIGN_INFO	= new Array(infoArr);
		}
	}
}