var jinAlphaPtrn	= {
	// 좌석 블락정보 설정
	// ##################################################################################################
	getAlphaSeatConfig	: function() {
		var _this		= this;
		
		var seatList	= _this.config.SEAT_INFO.seatList;
		var seatConfig	= _this.config.PTRN_INFO.seatConfig.split("-");
		
		var hasSeltLt	= seatList.filter(function(item){ return item.seatStatus == "A" && item.charge > 0 });
		var rowArr		= seatList.map(function(item){ return item.row });
		var duplRowArr	= rowArr.filter(function(item, idx, self){ return self.indexOf(item) == idx })
		
		var colArr		= seatList.map(function(item){ return item.col });
		var duplColArr	= colArr.filter(function(item, idx, self){ return self.indexOf(item) == idx }).sort();
	
		var blockArr	= seatConfig.reduce(function(acc,cur){ acc.push(duplColArr.splice(0, Number(cur))); return acc; }, []);

		// row loop
		for (var i=0; i<duplRowArr.length; i++) {
			var rowSeatLt	= seatList.filter((e) => e.row == duplRowArr[i]);
			var rowBlock	= blockArr.map((e) => e.filter((col) => rowSeatLt.some((seat) => seat.col == col)));
			
			var rowIdx		= i;
			var colIdx		= 0;
			
			for (var j=0; j<rowBlock.length; j++) {
				var block		= (rowBlock[j].length > 0) ? rowBlock[j] : blockArr[j];
				var blockIdx	= j;
				
				for (var k=0; k<block.length; k++) {
					var seatInfo	= rowSeatLt.filter((e) => e.col == block[k])[0];
					
					if (seatInfo) {
						seatInfo.rowIdx		= rowIdx;
						seatInfo.colIdx		= colIdx;
						seatInfo.blockIdx	= blockIdx;
					}
					
					colIdx++;
				}
			}
		}
		
		// seatConfig 설정
		_this.config.SEAT_INFO.seatConfig	= seatConfig;
		
		// 구매좌석이 있는지 여부
		_this.config.SEAT_INFO.hasSelSeat	= (hasSeltLt.length > 0) ? true : false;
	}
	// 지정패턴 조회
	// ##################################################################################################
	,getAlphaAssignPtrn	: function() {
		var _this				= this;
		var ptrnInfo			= _this.config.PTRN_INFO;

		var areaZoneInfoMap		= JSON.parse(JSON.stringify(ptrnInfo.areaZoneInfoMap || null));
		var specialZoneInfoMap	= JSON.parse(JSON.stringify(ptrnInfo.specialZoneInfoMap || null));
		
		var weightPtrnMstSn		= ptrnInfo.weightPtrnMstSn;
		var weightPtrnInfoList	= ptrnInfo.weightPtrnInfoList;
		
		// 존(zone)설정
		var areaZoneInfoList	= _this.getAlphaAreaZoneInfoList(areaZoneInfoMap, specialZoneInfoMap);
		var findPtrnList		= [];
		
		// 구역(area) 반복
		for (var i=0; i<areaZoneInfoList.length; i++) {
			var areaZoneInfo	= areaZoneInfoList[i];
			var areaPtrnMstSn	= areaZoneInfo.weightPtrnMstSn;
			var areaPtrnList	= weightPtrnInfoList.filter(function(item){ return item.weightPtrnMstSn == areaPtrnMstSn });

			findPtrnList		= findPtrnList.concat(_this.getAlphaSeatFindPtrn(areaZoneInfo, areaPtrnList));
		}
		
		// 지정 패천 추천
		var assignPtrnList				= _this.getAlphaSeatAssignPtrn(findPtrnList);

		// 지정 추천정보 설정
		_this.config.ASSIGN_INFO		= _this.config.ASSIGN_INFO.concat(assignPtrnList);
			
		// sort
		_this.config.ASSIGN_INFO.sort(function(a, b){ return b.totalWeight - a.totalWeight });
	}
	// 존(zone) 정보설정
	// ##################################################################################################
	,getAlphaAreaZoneInfoList	: function(areaZoneInfoMap, specialZoneInfoMap) {
		var _this		= this;
		
		var seatList	= _this.config.SEAT_INFO.seatList;
		var areaList	= Object.keys(areaZoneInfoMap).map((key) => { areaZoneInfoMap[key].gradeCd = key; return areaZoneInfoMap[key]; });
		
		var rsltList	= [];
		
		// zone 설정
		for (var i=0; i<areaList.length; i++) {
			var areaInfo		= areaList[i];
			var rowInfo			= areaInfo.areaSeatRowInfo.split("-");

			var rowSeatList		= seatList.filter(function(item){ return Number(rowInfo[0]) <= Number(item.row) && Number(rowInfo[1]) >= Number(item.row) });
			var rowSeatObj		= rowSeatList.reduce(function(acc,cur){ acc[cur.row+"-"+cur.col] = cur; return acc; },{});
			
			var areaSeatList	= (!areaInfo.specialZoneList) ? rowSeatList : [];
			var areaSeatObj		= (!areaInfo.specialZoneList) ? rowSeatObj : {};

			// araaCd 설정
			areaInfo.gradeCd	= areaInfo.gradeCd;
			
			if (areaInfo.specialZoneList && specialZoneInfoMap) {
				var spclSeatList	= _this.getAlphaSpecialZoneInfoList(areaInfo, rowSeatList, specialZoneInfoMap, rsltList);
				
				areaSeatList	= rowSeatList.filter(function(item){ return !spclSeatList.includes(item.seatNo) });
				areaSeatObj		= areaSeatList.reduce(function(acc,cur){ acc[cur.row+"-"+cur.col] = cur; return acc; },{});
			}
			
			areaInfo.seatList	= areaSeatList;
			areaInfo.seatObj	= areaSeatObj;

			rsltList.push(areaInfo);
		}
		
		return rsltList;
	}
	// 특별 존(zone) 정보설정
	// ##################################################################################################
	,getAlphaSpecialZoneInfoList	: function(areaInfo, areaSeatList, specialZoneInfoMap, rsltList) {
		var _this			= this;
		
		var spclZoneList	= areaInfo.specialZoneList;
		var spclSeatList	= spclZoneList.reduce((acc,cur) => acc.concat(specialZoneInfoMap[cur].seatList), []);
		
		// 특별 area 설정
		for (var i=0; i<spclZoneList.length; i++) {
			var spclKey			= spclZoneList[i];
			var spclAreaInfo	= specialZoneInfoMap[spclKey];
			
			if (!spclAreaInfo) {
				continue;
			}
			
			spclAreaInfo.gradeCd	= areaInfo.gradeCd;
			spclAreaInfo.seatList	= areaSeatList.filter((e) => spclAreaInfo.seatList.includes(e.seatNo));
			spclAreaInfo.seatObj	= spclAreaInfo.seatList.reduce((acc,cur) => { acc[cur.row+"-"+cur.col] = cur; return acc; },{});
			
			rsltList.push(spclAreaInfo);
		}
		
		return spclSeatList;
	}
	// 패턴 찾기
	// ##################################################################################################
	,getAlphaSeatFindPtrn	: function(areaZoneInfo, ptrnInfoList) {
		var _this 			= this;

		var rowArr			= (areaZoneInfo) ? areaZoneInfo.seatList.map(function(item){ return {row: item.row, rowIdx: item.rowIdx} }) : _this.config.SEAT_INFO.seatList.map(function(item){ return {row: item.row, rowIdx: item.rowIdx} });
		var rowArrSort		= rowArr.sort(function(a, b){ return a.rowIdx - b.rowIdx }).map(function(item){ return item.row });
		var duplRowArr		= rowArrSort.filter(function(item, idx, self){ return self.indexOf(item) == idx });

		var rowIdxArr		= (areaZoneInfo) ? areaZoneInfo.seatList.map(function(item){ return item.rowIdx }) : _this.config.SEAT_INFO.seatList.map(function(item){ return item.rowIdx });
		var duplIdxRowArr	= rowIdxArr.filter(function(item, idx, self){ return self.indexOf(item) == idx }).sort(function(a, b){ return a - b });
		
		var colArr			= (areaZoneInfo) ? areaZoneInfo.seatList.map(function(item){ return item.col }) : _this.config.SEAT_INFO.seatList.map(function(item){ return item.col });
		var duplColArr		= colArr.filter(function(item, idx, self){ return self.indexOf(item) == idx }).sort();
		
		var areaSeatObj		= (areaZoneInfo) ? areaZoneInfo.seatObj : _this.config.SEAT_INFO.seatObj;  
		var findPtrnList	= [];

		// 패턴리스트 반복
		for (var i=0; i<ptrnInfoList.length; i++) {
			var ptrnInfo		= ptrnInfoList[i];
			
			var ptrnSeatInfo	= ptrnInfo.ptrnSeatInfoMapList;
			var ptrnWeight		= ptrnInfo.ptrnWeight;
			var ptrnGroupCd		= ptrnInfo.ptrnGroupCd;
			var ptrnSeatLocType	= ptrnInfo.ptrnSeatLocType;
			var ptrnSeatDirType	= ptrnInfo.ptrnSeatDirType;
			var seatConfig		= ptrnInfo.seatConfig.split("-");
			var seatCnt			= ptrnInfo.seatCnt;
			var rmnRcmndChk		= ptrnInfo.rmnRcmndCntChkYn;
			
			// Row 반복
			rowLoop:
			for (var r=0; r<duplRowArr.length; r++) {
				var ptrnList	= ptrnSeatInfo.filter(function(item){ return Object.values(item).some(function(ptrn){ return ptrn.type == "PTRN" }) });
				var findPtrn	= [];				// 패턴좌석
				
				// 패턴찾기
				for (var p=0; p<ptrnList.length; p++) {
					var ptrnRow		= duplRowArr[r+p];
					var ptrnRowIdx	= duplIdxRowArr[r]+p;
					var ptrnSeat	= Object.values(ptrnList[p]);
					
					for (var c=0; c<ptrnSeat.length; c++) {
						var ptrnColIdx	= ptrnSeat[c].col-1;
						var ptrnColNm	= duplColArr[ptrnColIdx]; 
						var seatInfo	= areaSeatObj[ptrnRow+"-"+ptrnColNm];

						// 좌석체크
						if (!seatInfo) {
							continue;
						}
						
						// rowIdx체크
						if (seatInfo.rowIdx != ptrnRowIdx) {
							continue;
						}
						
						// 패턴체크
						if (ptrnSeat[c].type == "PTRN" && seatInfo.seatStatus != "A" && seatInfo.charge > 0) {
							findPtrn	= null;
							continue rowLoop;
						}
						
						// 패턴좌석 push
						if (ptrnSeat[c].type == "PTRN" && seatInfo.seatStatus == "A" && seatInfo.charge > 0) {
							findPtrn.push(seatInfo);
						}
					}
				}
				
				// 패턴 가중치 계산 후 추가
				if (findPtrn.length == seatCnt) {
					var gradeCd		= (areaZoneInfo) ? areaZoneInfo.gradeCd : findPtrn[0].gradeCd;
					
					var intrfWeight	= _this.getIntrfWeightCalc(ptrnSeatInfo, findPtrn);
					var ptrnCalc	= _this.gatPtrnWeightCalc(findPtrn, ptrnGroupCd, ptrnSeatLocType, ptrnSeatDirType, seatConfig, ptrnWeight, intrfWeight, rmnRcmndChk);

					findPtrnList.push($.extend({gradeCd: gradeCd}, ptrnCalc))
				}
			}
		}
		
		// 패턴 가중치 기준으로 정렬
		return findPtrnList.sort(function(a, b){ return b.totalWeight - a.totalWeight });
	}
	// 방해성 정보 계산
	// ##################################################################################################
	,getIntrfWeightCalc	: function(ptrnSeatInfo, findPtrn) {
		var _this			= this;
		
		var ptrnIndex		= ptrnSeatInfo.findIndex(function(item){ return Object.values(item).some(function(ptrn){ return ptrn.type == "PTRN" }) });
		var rowIndex		= findPtrn[0].rowIdx;
		
		var startIndex		= rowIndex-ptrnIndex;
		var lastIndex		= startIndex + (ptrnSeatInfo.length-1);
		
		var seatList		= _this.config.SEAT_INFO.seatList;
		var seatObj			= _this.config.SEAT_INFO.seatObj;
		var calcSeatList	= seatList.filter(function(item){ return (item.rowIdx >= startIndex && item.rowIdx <= lastIndex) });
		
		var rowArr			= calcSeatList.map(function(item){ return {row: item.row, rowIdx: item.rowIdx} });
		var rowArrSort		= rowArr.sort(function(a, b){ return a.rowIdx - b.rowIdx }).map(function(item){ return item.row });
		var duplRowArr		= rowArrSort.filter(function(item, idx, self){ return self.indexOf(item) == idx });

		var colArr			= calcSeatList.map(function(item){ return item.col });
		var duplColArr		= colArr.filter(function(item, idx, self){ return self.indexOf(item) == idx }).sort();
		
		var ignoreIntrfInfo	= _this.config.PTRN_INFO.ignoreIntrfInfoMap;
		var intrfDupChkist	= [];
		var intrfWeight		= 0;
		
		// Row 반복
		for (var r=0; r<duplRowArr.length; r++) {
			var ptrnRow		= duplRowArr[r];
			var ptrnSeat	= Object.values(ptrnSeatInfo[r]);
			
			// 패턴찾기
			for (var c=0; c<ptrnSeat.length; c++) {
				var ptrnColIdx	= ptrnSeat[c].col-1;
				var ptrnColNm	= duplColArr[ptrnColIdx]; 
				var seatInfo	= seatObj[ptrnRow+"-"+ptrnColNm];
				
				// 좌석체크
				if (!seatInfo) {
					continue;
				}
				
				var infrfDupChk	= intrfDupChkist.some(function(item){ return item == seatInfo.seatNo });
				var ignrRowChk	= (ignoreIntrfInfo && ignoreIntrfInfo.IGNR_ROW) ? ignoreIntrfInfo.IGNR_ROW.seatRowList.some(function(item){ return item == seatInfo.row }) : false;
				var ignrSeatChk	= (ignoreIntrfInfo && ignoreIntrfInfo.IGNR_SEAT) ? ignoreIntrfInfo.IGNR_SEAT.seatList.some(function(item){ return item == seatInfo.seatNo }) : false;
				
				// 방해성값 누적체크
				if (infrfDupChk) {
					continue;
				}
				
				if (ignrRowChk) {
					continue;
				}
				
				if (ignrSeatChk) {
					continue;
				}
				
				// 방해성체크
				if (ptrnSeat[c].type == "INTRF" && seatInfo.seatStatus != "A") {
					intrfDupChkist.push(seatInfo.seatNo);
					intrfWeight	+= ptrnSeat[c].intrfValue;
				}
			}
		}
		
		return intrfWeight;
	}
	// 패턴 정보 계산
	// ##################################################################################################
	,gatPtrnWeightCalc	: function(findPtrn, ptrnGroupCd, ptrnSeatLocType, ptrnSeatDirType, seatConfig, ptrnWeight, intrfWeight, rmnRcmndChk) {
		var _this			= this;
		
		var ptrnInfo		= _this.config.PTRN_INFO;
		var seatWeightList	= ptrnInfo.seatWeightList;
		
		for (var i=0; i<findPtrn.length; i++) {
			var seatInfo	= findPtrn[i];
			var seatWeight	= seatWeightList.filter(function(item){ return ((item) ? item.seatNo : "") == seatInfo.seatNo })[0];
			
			findPtrn[i].totalValue	= (seatWeight) ? seatWeight.totalValue : 0;
		}
		
		var postionWeightCalc		= findPtrn.reduce(function(acc, cur){ return acc + cur.totalValue }, 0);
		var priceWeightCalc			= findPtrn.reduce(function(acc, cur){ return acc + cur.charge }, 0);
		var patternWeightCalc		= ptrnWeight * (1-intrfWeight);
		
		var findPtrnWeight			= {};

		findPtrnWeight.seatConfig	= seatConfig;
		findPtrnWeight.groupCd		= ptrnGroupCd;
		findPtrnWeight.seatLocType	= ptrnSeatLocType;
		findPtrnWeight.seatDirType	= ptrnSeatDirType;
		findPtrnWeight.findPtrn		= findPtrn;
		findPtrnWeight.totalWeight	= (patternWeightCalc * postionWeightCalc) / priceWeightCalc;
		findPtrnWeight.rmnRcmndChk	= rmnRcmndChk || "N";
		
		return findPtrnWeight;
	}
	// 지정 패턴 추천
	// ##################################################################################################
	,getAlphaSeatAssignPtrn	: function(findPtrnList) {
		var _this 			= this;

		var assignPtrnList	= [];								// 결과리스트
		
		for (var i=0; i<findPtrnList.length; i++) {
			var findPtrnInfo	= findPtrnList[i];
			var findPtrn		= findPtrnInfo.findPtrn;
			
			// 유아동반 좌석 블록체크
			if (!_this.isValidInfantSeatBlock(findPtrn)) {
				continue;
			}
			
			// 유아동반 좌석 Row체크
			if (!_this.isValidInfantSeatRow(findPtrn)) {
				continue;
			}
			
			// 소아동반 좌석 블록체크
			if (!_this.isValidChildSeatBlock(findPtrn)) {
				continue;
			}
			
			// 유아동반+소아 좌석 블록체크
			if (!_this.isValidInfantChildSeatBlock(findPtrn)) {
				continue;
			}
			
			// 패턴 추가 
			assignPtrnList.push(findPtrnInfo);
		}

		return assignPtrnList;
	}
	// 등급별 패턴 추천  
	// ##################################################################################################
	,getAlphaSeatRcmndPtrn	: function(areaZoneInfo, findPtrnList) {
		var _this 			= this;

		var rcmndPtrnList	= [];										// 결과리스트
		
		var specialPtrnList	= findPtrnList.filter(function(item){ return item.seatDirType || item.seatLocType });
		var specialGrpInfo	= specialPtrnList.reduce(function(acc,cur){ acc[cur.groupCd] = 0; return acc }, {});
		
		var specialCntInfo	= {windowCnt:0, aisleCnt:0};
		var specialChkList	= [];										// 패턴중복 체크리스트
		
		// 창가,복도,왼쪽,오른쪽 그룹 패턴추천
		specialPtrnList	= _this.getAlphaSeatSpecialPtrn(areaZoneInfo, specialPtrnList, specialCntInfo, specialChkList, rcmndPtrnList, specialGrpInfo)
		specialPtrnList	= _this.getAlphaSeatSpecialPtrn(areaZoneInfo, specialPtrnList, specialCntInfo, specialChkList, rcmndPtrnList);

		var normalPtrnList	= findPtrnList;
		var normalTotalCnt	= areaZoneInfo.totalRcmndCnt-rcmndPtrnList.length;
		var noramlGrpInfo	= normalPtrnList.reduce(function(acc,cur){ acc[cur.groupCd] = 0; return acc }, {});
		
		var normalCntInfo	= {totalCnt:0};
		var normalChkList	= $.extend([], specialChkList);				// 패턴중복 체크리스트

		// 일반그룹 패턴추천
		normalPtrnList	= _this.getAlphaSeatNormalPtrn(areaZoneInfo, normalPtrnList, normalCntInfo, normalTotalCnt, normalChkList, rcmndPtrnList, noramlGrpInfo);
		normalPtrnList	= _this.getAlphaSeatNormalPtrn(areaZoneInfo, normalPtrnList, normalCntInfo, normalTotalCnt, normalChkList, rcmndPtrnList);
		
		// 패턴 순위지정
		rcmndPtrnList.sort(function(a, b){ return b.totalWeight - a.totalWeight });
		
		return rcmndPtrnList; 
	}
	// 창가,복도,왼쪽,오른쪽 패턴 추천  
	// ##################################################################################################
	,getAlphaSeatSpecialPtrn	: function(areaZoneInfo, specialPtrnList, specialCntInfo, specialChkList, rcmndPtrnList, specialGrpInfo) {
		var _this			= this;
		
		var windowRcmndCnt	= areaZoneInfo.windowSeatRcmndCnt || 0;			// 창가 추천수
		var aisleRcmndCnt	= areaZoneInfo.aisleSeatRcmndCnt || 0;			// 복도 추천수

		var specialTotalCnt	= windowRcmndCnt+aisleRcmndCnt;
		var assignIdxList	= [];
		
		for (var i=0; i<specialPtrnList.length; i++) {
			var findPtrnInfo	= specialPtrnList[i];

			var groupCd			= findPtrnInfo.groupCd;
			var seatLocType		= findPtrnInfo.seatLocType;
			var seatDirType		= findPtrnInfo.seatDirType;
			
			var findPtrn		= findPtrnInfo.findPtrn;
			var seatNoList		= findPtrn.map(function(item){ return item.seatNo });

			// 유아동반 좌석 블록체크
			if (!_this.isValidInfantSeatBlock(findPtrn)) {
				continue;
			}
			
			// 유아동반 좌석 Row체크
			if (!_this.isValidInfantSeatRow(findPtrn)) {
				continue;
			}
			
			// 소아동반 좌석 블록체크
			if (!_this.isValidChildSeatBlock(findPtrn)) {
				continue;
			}
			
			// 유아동반+소아 좌석 블록체크
			if (!_this.isValidInfantChildSeatBlock(findPtrn)) {
				continue;
			}
			
			if (seatLocType == "WINDOW" && specialCntInfo.windowCnt >= windowRcmndCnt) {
				continue;
			}
			
			if (seatLocType == "AISLE" && specialCntInfo.aisleCnt >= aisleRcmndCnt) {
				continue;
			}
			
			// 그룹패턴 체크
			if (specialGrpInfo && specialGrpInfo[groupCd] > 0) {
				continue;
			}
			
			// 추천수 체크
			if (specialCntInfo.windowCnt+specialCntInfo.aisleCnt >= specialTotalCnt) {
				break;
			}
			
			// pattern seatArr 병합
			seatNoList.forEach(function(item){ specialChkList.push(item) });

			// 좌석 겹치는지 체크
			if (specialChkList.length > 0) {
				var duplCheck	= new Set(specialChkList);
					
				if (specialChkList.length != duplCheck.size) {
					specialChkList.splice(-seatNoList.length);
					continue;
				}
			}

			if (windowRcmndCnt && seatLocType == "WINDOW") {
				specialCntInfo.windowCnt++;
			}

			if (aisleRcmndCnt && seatLocType == "AISLE") {
				specialCntInfo.aisleCnt++;
			}
			
			if (specialGrpInfo && specialGrpInfo.hasOwnProperty(groupCd)) {
				specialGrpInfo[groupCd]++;
			}

			// 패턴 추가 
			rcmndPtrnList.push(findPtrnInfo);
			// 적용패턴 index 체크
			assignIdxList.push(i);
		}

		return specialPtrnList.filter(function(item,idx){ return !assignIdxList.includes(idx) });
	}
	// 일반패턴 추천  
	// ##################################################################################################
	,getAlphaSeatNormalPtrn	: function(areaZoneInfo, normalPtrnList, noramlCntInfo, normalTotalCnt, normalChkList, rcmndPtrnList, normalGrpInfo) {
		var _this	= this;
		
		var assignIdxList	= [];
		
		// 최종패턴 추천
		for (var i=0; i<normalPtrnList.length; i++) {
			var findPtrnInfo	= normalPtrnList[i];

			var groupCd			= findPtrnInfo.groupCd;
			var findPtrn		= findPtrnInfo.findPtrn;
			var seatNoList		= findPtrn.map(function(item){ return item.seatNo });

			// 유아동반 좌석 블록체크
			if (!_this.isValidInfantSeatBlock(findPtrn)) {
				continue;
			}
			
			// 유아동반 좌석 Row체크
			if (!_this.isValidInfantSeatRow(findPtrn)) {
				continue;
			}
			
			// 소아동반 좌석 블록체크
			if (!_this.isValidChildSeatBlock(findPtrn)) {
				continue;
			}
			
			// 유아동반+소아 좌석 블록체크
			if (!_this.isValidInfantChildSeatBlock(findPtrn)) {
				continue;
			}
			
			// 그룹패턴 체크
			if (normalGrpInfo && normalGrpInfo[groupCd] > 0) {
				continue;
			}
			
			// 패턴 추천수 체크
			if (noramlCntInfo.totalCnt >= normalTotalCnt) {
				break;
			}
			
			// pattern seatArr 병합
			seatNoList.forEach(function(item){ normalChkList.push(item) });

			// 좌석 겹치는지 체크
			if (normalChkList.length > 0) {
				var duplCheck	= new Set(normalChkList);
					
				if (normalChkList.length != duplCheck.size) {
					normalChkList.splice(-seatNoList.length);
					continue;
				}
			}
			
			if (noramlCntInfo) {
				noramlCntInfo.totalCnt++;
			}
			
			if (normalGrpInfo && normalGrpInfo.hasOwnProperty(groupCd)) {
				normalGrpInfo[groupCd]++;
			}
			
			// 패턴 추가 
			rcmndPtrnList.push(findPtrnInfo);
			// 적용패턴 index 체크
			assignIdxList.push(i);
		}
		
		return normalPtrnList.filter(function(item,idx){ return !assignIdxList.includes(idx) });
	}
	// 유아동반 승객이 비상구석을 선택했는지 체크 (선택좌석)					- true: 예약가능	/	false: 예약불가능
	// ##################################################################################################
	,isValidInfantEmerg	:function(paxInfo, seatInfo) {
		var _this	= this;
		
		var checkGuardian		= (paxInfo.guardianYn == "Y") ? true : false; 
		var checkEmerg			= (seatInfo.locAttrList) ? seatInfo.locAttrList.some(function(item){ return item.locCode == "E" }) : false;
		
		// 유아동반승객 비상구좌석 예약불가능
		if (checkGuardian && checkEmerg) {
			return false;
		}
		
		return true;
	}
	// 유아동반 승객이 선택한 블럭에 다른유아동반승객이 있는지 체크 (선택좌석)		- true: 예약가능	/	false: 예약불가능
	// ##################################################################################################
	,isValidInfantBlock	: function(paxInfo, seatInfo) {
		var _this	= this;

		var checkGuardian		= (paxInfo.guardianYn == "Y") ? true : false; 
		var checkEmerg			= (seatInfo.locAttrList) ? seatInfo.locAttrList.some(function(item){ return item.locCode == "E" }) : false;
		
		// 일반승객 + 일반좌석 true
		if (!checkGuardian && !checkEmerg) {
			return true;
		}
		
		var paxList				= _this.config.PAX_INFO.paxList;
		var seatList			= _this.config.SEAT_INFO.seatList;
		var rowBlockList		= seatList.filter(function(item){ return item.row == seatInfo.row && item.blockIdx == seatInfo.blockIdx });
		
		var infantSeatCnt		= 0;																						// 유아동반 예약좌석이 포함된 block cnt
		var selInfantSeatCnt	= 0;																						// 구매선택한 유아동반 승객 cnt 
		
		var selSeatInfo			= paxList.filter(function(item){ return item.guardianYn == "Y" && item.selSeat });			// 구매선택한 유아동반 승객 
		var selSeatNoList		= selSeatInfo.map(function(item){ return item.selSeat.seatNo });							// 좌석을 점유한 유아동반 승객의 seatNo 리스트

		// 블락의 좌석 리스트 체크 
		for (var i=0; i<rowBlockList.length; i++) {
			var rowBlockSeat	= rowBlockList[i];
			
			if (rowBlockSeat.seatStatus == "3") {
				infantSeatCnt++;
			}
			
			if (selSeatNoList.includes(rowBlockSeat.seatNo)) {
				selInfantSeatCnt++;
			}
		}
		
		// 유아동반 예약좌석이 있거나  구매선택한 유아동반 승객의 block이 겹치는지 체크
		return (infantSeatCnt <= 0 && selInfantSeatCnt <= 0);
	}
	// 유아동반 승객이 선택한 Row의 최대(유아동반2명)기준을 초과했는지 체크		- true: 예약가능	/	false: 예약불가능
	// ##################################################################################################
	,isValidInfantRow	: function(paxInfo, seatInfo) {
		var _this	= this;

		var checkGuardian		= (paxInfo.guardianYn == "Y") ? true : false; 
		var checkEmerg			= (seatInfo.locAttrList) ? seatInfo.locAttrList.some(function(item){ return item.locCode == "E" }) : false;
		
		// 일반승객 + 일반좌석 true
		if (!checkGuardian && !checkEmerg) {
			return true;
		}
		
		var paxList				= _this.config.PAX_INFO.paxList;
		var seatList			= _this.config.SEAT_INFO.seatList;
		var rowSeatList			= seatList.filter((e) => e.row == seatInfo.row);
			
		var infantSeatCnt		= 0;																					// 유아동반 예약좌석이 포함된 block cnt
		var selInfantSeatCnt	= 0;																					// 구매선택한 유아동반 승객 cnt 
		
		var selSeatInfo			= paxList.filter((e) => e.guardianYn == "Y" && e.selSeat);								// 구매선택한 유아동반 승객 
		var selSeatNoList		= selSeatInfo.map((e) => e.selSeat.seatNo);												// 좌석을 점유한 유아동반 승객의 seatNo 리스트

		// 블락의 좌석 리스트 체크 
		for (var i=0; i<rowSeatList.length; i++) {
			var rowSeat			= rowSeatList[i];
			
			if (rowSeat.seatStatus == "3") {	
				infantSeatCnt++;
			}
			
			if (selSeatNoList.includes(rowSeat.seatNo)) {
				selInfantSeatCnt++;
			}
		}

		// 선택 열(row)의 유아동반 예약좌석이+구매선택한 유아동반 승객의 합이 2명 이하인지 체크 
		return (infantSeatCnt+selInfantSeatCnt < 2);
	}
	// 소아승객이 비상구석을 선택했는지 체크	(선택좌석) 					- true: 예약가능	/	false: 예약불가능
	// ##################################################################################################
	,isValidChildEmerg	: function(paxInfo, seatInfo) {
		var _this	= this;
		
		var checkAge	= (paxInfo.paxType == "ADT" && ((paxInfo.age) ? paxInfo.age < 15 : false));
		var checkChild	= (paxInfo.paxType != "ADT") ? true : false; 
		var checkEmerg	= (seatInfo.locAttrList) ? seatInfo.locAttrList.some(function(item){ return item.locCode == "E" }) : false;
		
		// 소아승객 비상구좌석 예약불가능
		if ((checkAge || checkChild) && checkEmerg) {
			return false;
		}
		
		return true;
	}
	// 비상구를 선택한 승객을 제외한 소아승객의 보호자승객이  있는지 체크 (선택좌석)	- true: 예약가능	/	false: 예약불가능
	// ##################################################################################################
	,isValidChildGuardian	: function(paxInfo, seatInfo) {
		var _this	= this;
		
		var checkChild	= (paxInfo.paxType != "ADT") ? true : false; 
		var checkEmerg	= (seatInfo.locAttrList) ? seatInfo.locAttrList.some(function(item){ return item.locCode == "E" }) : false;

		// 성인 일반좌석 예약가능
		if (!checkChild && !checkEmerg) {
			return true;
		}
		
		var paxList		= _this.config.PAX_INFO.paxList;
		var adtPaxCnt	= paxList.filter(function(item){ return item.paxType == "ADT" }).length;
		var selEmergCnt	= paxList.filter(function(item){ return item.selSeat && ((item.selSeat.locAttrList) ? item.selSeat.locAttrList.some(function(cur){ return cur.locCode == "E" }) : false) }).length;
		
		// ADT승객 - 비상구선택 승객 - (자신)
//		return ((adtPaxCnt-selEmergCnt-1) >= 0); 
		// ->2025-06-10 valid pass처리(무조건 true)
		return true;
	}
	// 유아동반 그룹이 예약 가능한지 체크 (그룹좌석)						- true: 예약가능	/	false: 예약불가능
	// ##################################################################################################
	,isValidInfantSeatBlock	: function(matchPtrn) {
		var _this	= this;

		var seatList		= _this.config.SEAT_INFO.seatList;
		var infantPaxCnt	= _this.config.PAX_INFO.paxList.filter(function(item){ return item.guardianYn == "Y" }).length;	// 유아동반 승객 cnt
	
		var blockObj		= matchPtrn.reduce(function(acc,cur){
			var emergCheck	= (cur.locAttrList) ? cur.locAttrList.some(function(item){ return item.locCode == "E" }) : false;
			
			if (!acc[cur.row+"-"+cur.blockIdx] && !emergCheck) {
				acc[cur.row+"-"+cur.blockIdx] = seatList.filter(function(item){ return item.row == cur.row && item.blockIdx == cur.blockIdx });
			}
			return acc;
		}, {});
		
		var blockCnt		= Object.values(blockObj).length;
		var emergSeatCnt	= matchPtrn.filter(function(item){ return ((item.locAttrList) ? item.locAttrList.some(function(cur){ return cur.locCode == "E" }) : false) }).length;
		var generalSeatCnt	= matchPtrn.length - emergSeatCnt;
		
		// 비상구좌석 보다 유아동반 승객수가 크면 예약불가능
		if (generalSeatCnt < infantPaxCnt) {
			return false;
		}
		
		// 블록 갯수보다 유아동반 승객수가 크면 예약불가능
		if (blockCnt < infantPaxCnt) {
			return false;
		}
		
		// 유아동반 예약좌석 미포함 block cnt
		var infantCleanBlockCnt	= 0;
		
		// block만큼 반복
		Object.keys(blockObj).forEach(function(key) {
			var infantSeatCheck	= blockObj[key].some(function(item){ return item.seatStatus == "3" });
			
			if (!infantSeatCheck) {
				infantCleanBlockCnt++;
			}
		});

		// 유아동반 승객 수보다 예약가능한 좌석block 수가 많은지 체크
		return (infantCleanBlockCnt >= infantPaxCnt);
	}	
	// 유아동반 그룹이 예약 가능한지 체크 (그룹좌석)						- true: 예약가능	/	false: 예약불가능
	// ##################################################################################################
	,isValidInfantSeatRow	: function(matchPtrn) {
		var _this	= this;

		var seatList			= _this.config.SEAT_INFO.seatList;
		var infantPaxCnt		= _this.config.PAX_INFO.paxList.filter(function(item){ return item.guardianYn == "Y" }).length;
	
		var rowObj				= matchPtrn.reduce(function(acc,cur){
			var emergCheck		= (cur.locAttrList) ? cur.locAttrList.some(function(item){ return item.locCode == "E" }) : false;
			
			if (!acc[cur.row] && !emergCheck) {
				acc[cur.row]	= seatList.filter((e) => e.row == cur.row);
			}
			return acc;
		}, {});
		
		var rowCnt				= Object.values(rowObj).length;
		var emergSeatCnt		= matchPtrn.filter(function(item){ return ((item.locAttrList) ? item.locAttrList.some(function(cur){ return cur.locCode == "E" }) : false) }).length;
		var generalSeatCnt		= matchPtrn.length - emergSeatCnt;
		
		// 비상구좌석 보다 유아동반 승객수가 크면 예약불가능
		if (generalSeatCnt < infantPaxCnt) {
			return false;
		}
		
		// 점유된 유아동반 좌석 cnt
		var occupiedInfantCnt	= 0;
		
		// row만큼 반복
		Object.keys(rowObj).forEach(function(key) {
			var rowSeatLt	= rowObj[key];

			for (var i=0; i<rowSeatLt.length; i++) {
				if (rowSeatLt[i].seatStatus == "3") {
					occupiedInfantCnt++;
				}
			}
		});

		// 패턴의 열 중(rows)에 점유좌석 유아동반승객의 합이 2보다 작은지 체크
		return ((infantPaxCnt+occupiedInfantCnt) <= (rowCnt*2)); 
	}	
	// 소아를 포함한 그룹이 예약 가능한지 체크 (그룹좌석)					- true: 예약가능	/	false: 예약불가능
	// ##################################################################################################
	,isValidChildSeatBlock	: function(matchPtrn) {
		var _this	= this;
		
		var paxList		= _this.config.PAX_INFO.paxList;
		
		var checkAge	= paxList.some(function(item){ return item.paxType == "ADT" && ((item.age) ? item.age < 15 : false) });
		var checkChild	= paxList.some(function(item){ return item.paxType != "ADT" });
		var checkEmerg	= matchPtrn.some(function(item){ return ((item.locAttrList) ? item.locAttrList.some(function(cur){ return cur.locCode == "E" }) : false) });
	
		// 소아승객이 없다면 true
		if (!checkAge && !checkChild) {
			return true;
		}
		
		// 일반 좌석 true
		if (!checkEmerg) {
			return true;
		}
		
		var childCnt		= paxList.filter(function(item){ return item.paxType != "ADT" }).length;
		var emergSeatCnt	= matchPtrn.filter(function(item){ return ((item.locAttrList) ? item.locAttrList.some(function(cur){ return cur.locCode == "E" }) : false) }).length;
		var generalSeatCnt	= matchPtrn.length - emergSeatCnt;

		// 비상구 포함 패턴일 경우 소아를 케어할 어른이 한명이 있어야 하는 정책으로 일반좌석 cnt가 소아의 cnt보다 커야한다 
		return (generalSeatCnt > childCnt);
	}
	// 유아동반, 소아를 포함한 그룹이 예약 가능한지 체크 (그룹좌석)					- true: 예약가능	/	false: 예약불가능
	// ##################################################################################################
	,isValidInfantChildSeatBlock	: function(matchPtrn) {
		var _this	= this;
		
		var paxList		= _this.config.PAX_INFO.paxList;
		
		var checkInfant	= paxList.some(function(item){ return item.guardianYn == "Y" });
		var checkAge	= paxList.some(function(item){ return item.paxType == "ADT" && ((item.age) ? item.age < 15 : false) });
		var checkChild	= paxList.some(function(item){ return item.paxType != "ADT" });
		var checkEmerg	= matchPtrn.some(function(item){ return ((item.locAttrList) ? item.locAttrList.some(function(cur){ return cur.locCode == "E" }) : false) });
	
		// 유아동반승객 및 소아승객이 없다면 true
		if (!checkInfant && !checkAge && !checkChild) {
			return true;
		}
		
		// 일반 좌석 true
		if (!checkEmerg) {
			return true;
		}
		
		var infantCnt		= paxList.filter(function(item){ return item.guardianYn == "Y" }).length;
		var childCnt		= paxList.filter(function(item){ return item.paxType != "ADT" }).length;
		var emergSeatCnt	= matchPtrn.filter(function(item){ return ((item.locAttrList) ? item.locAttrList.some(function(cur){ return cur.locCode == "E" }) : false) }).length;
		var generalSeatCnt	= matchPtrn.length - emergSeatCnt;

		// 비상구 포함 패턴일 경우 소아,유아동반 승객 cnt보다 일반좌석 cnt가 커야한다 
		return (generalSeatCnt > (childCnt+infantCnt));
	}
}