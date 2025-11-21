var commSeatDisp	= {
	// 좌석 요금정보 갱신
	// ##################################################################################################
	updateSeatChargeHtml	: function(segIdx, seatInfo) {
		var _this		= this;
		
		var seatList	= seatInfo.seatList;
		var seatMap		= _this.getApplyTarget("seat", "seatMap", segIdx);

		for (var i=0; i<seatList.length; i++) {
			var seat	= seatList[i];
			
			var seatNo		= seat.seatNo;
			var charge		= parseInt(seat.charge);
			var chargeZoom	= (String(charge).length > 5) ? " zoomnum8" : "";
			var seatStatus	= seat.seatStatus;
			var onclick		= "apiCtl.onAssignSeatClick('"+segIdx+"', '"+seatNo+"', 'sel');";
			
			
			if (seatStatus == "A" && charge > 0) {
				seatMap.find("[seatno="+seatNo+"]").attr("onclick", onclick).html('<span class="blind_box'+chargeZoom+'">'+charge.comma()+'</span>');
			} else {
				seatMap.find("[seatno="+seatNo+"]").addClass("disabled_seat");
			}
		}
	}
	// 프리뷰맵 갱신
	// ##################################################################################################
	,getAreaPreviewMapHtml	: function(segIdx, seatList, areaZoneInfoMap) {
		var _this		= this;

		var areaSort		= Object.values(areaZoneInfoMap).sort((a,b) => a.areaSeatRowInfo.split("-")[0] - b.areaSeatRowInfo.split("-")[0]);
		var seatMap			= _this.getApplyTarget("seat", "seatMap", segIdx);
		var recomTop		= seatMap.find(".seat_sheet_recom_box").offset().top;		// dim 영역
		var priceTop		= seatMap.find(".seat_sheet_price_box").offset().top;		// 좌석등급별가격 영역
		var numberTop		= seatMap.find(".seat_sheet_number").offset().top;			// rows 영역
	
		var correctTop		= 1;	
		var numberPrevTop	= 0;
		var recomPrevTop	= 0; 
		
		var	html			= [];
	
		html.push('<div class="seat_sheet_price_txt">1좌석당 가격</div>');
		html.push('<div class="seat_sheet_price_box">');
	
		// preview 가격 html
		for (var i=0; i<areaSort.length; i++) {
			var zoneInfoObj		= areaSort[i];

			var areaSeatRowInfo	= zoneInfoObj.areaSeatRowInfo.split("-");
			var areaSeatList	= seatList.filter(function(item){ return Number(areaSeatRowInfo[0]) <= Number(item.row) && Number(areaSeatRowInfo[1]) >= Number(item.row) });

			var rowArr			= areaSeatList.map(function(item){ return {row: item.row, rowIdx: item.rowIdx} });
			var rowArrSort		= rowArr.sort(function(a, b){ return a.rowIdx - b.rowIdx }).map(function(item){ return item.row });
			var duplRowArr		= rowArrSort.filter(function(item, idx, self){ return self.indexOf(item) == idx });
			
			var fstRow			= seatMap.find(".seat_sheet_number li[row="+duplRowArr[0]+"]").offset();
			var lstRow			= seatMap.find(".seat_sheet_number li[row="+duplRowArr[duplRowArr.length-1]+"]").offset();

			if (!fstRow || !lstRow) {
				continue;
			}
			
			var rowHeight		= seatMap.find(".seat_sheet_number li[row="+duplRowArr[duplRowArr.length-1]+"]").height();
			var boxHeight		= ((numberPrevTop > 0) ? ((lstRow.top-numberPrevTop)+rowHeight+correctTop) : ((numberTop-priceTop)+(lstRow.top-fstRow.top)+rowHeight+correctTop));
	
			html.push('<div class="buy_num" style="height:'+boxHeight+'px;">');
	
			var chargeList		= areaSeatList.map(function(item){ return item.charge }).filter(function(item){ return item });
			var minCharge		= Math.min.apply(null, chargeList);
			var maxCharge		= Math.max.apply(null, chargeList);
			
			if (Number(areaSeatRowInfo[1])-Number(areaSeatRowInfo[0]) > 1 || chargeList.length <= 0)  {
				html.push('	<div>'+zoneInfoObj.dc+'</div>');
			}
			
			if (minCharge == maxCharge) {
				html.push('		<span>'+minCharge.comma()+'</span>');
			} 
			else if (minCharge < maxCharge) {
				html.push('		<span>'+minCharge.comma()+'<br>~'+maxCharge.comma()+'</span>');
			}
			
			html.push('</div>');
			
			// 다음 area 시작top
			numberPrevTop		= lstRow.top+rowHeight+correctTop;
		}
		
		html.push('</div>');
		html.push('<div class="seat_sheet_recom_box">');
		
		// preview dim html
		for (var i=0; i<areaSort.length; i++) {
			var zoneInfoObj		= areaSort[i];

			var areaSeatRowInfo	= zoneInfoObj.areaSeatRowInfo.split("-");
			var areaSeatList	= seatList.filter(function(item){ return Number(areaSeatRowInfo[0]) <= Number(item.row) && Number(areaSeatRowInfo[1]) >= Number(item.row) });

			var rowArr			= areaSeatList.map(function(item){ return {row: item.row, rowIdx: item.rowIdx} });
			var rowArrSort		= rowArr.sort(function(a, b){ return a.rowIdx - b.rowIdx }).map(function(item){ return item.row });
			var duplRowArr		= rowArrSort.filter(function(item, idx, self){ return self.indexOf(item) == idx });

			var fstRow			= seatMap.find(".seat_sheet_number li[row="+duplRowArr[0]+"]").offset();
			var lstRow			= seatMap.find(".seat_sheet_number li[row="+duplRowArr[duplRowArr.length-1]+"]").offset();
			var rowHeight		= seatMap.find(".seat_sheet_number li[row="+duplRowArr[duplRowArr.length-1]+"]").height();
			
			if (!fstRow || !lstRow) {
				continue;
			}
			
			var boxTop			= ((recomPrevTop > 0) ? (recomPrevTop-recomTop-correctTop) : (numberTop-recomTop)-correctTop);
			var boxHeight		= ((recomPrevTop > 0) ? ((lstRow.top-recomPrevTop)+rowHeight+correctTop-1) : ((lstRow.top-fstRow.top)+rowHeight+correctTop-1));
			
			html.push('<div class="recom_num"><a href="#none" areacd="'+zoneInfoObj.gradeCd+'" areanm="'+zoneInfoObj.dc+'" style="position:absolute; background:#000; top:'+boxTop+'px; height:'+boxHeight+'px;"></a></div>');
			
			// 다음 area 시작top
			recomPrevTop		= lstRow.top+rowHeight+correctTop;
		}
		
		html.push('</div>');

		return html.join("");
	}
	// 기본 프리뷰 갱신
	// ##################################################################################################
	,getBasicPreviewMapHtml	: function(segIdx, seatList) {
		var _this		= this;

		var seatMap			= _this.getApplyTarget("seat", "seatMap", segIdx);
		var priceTop		= seatMap.find(".seat_sheet_price_box").offset().top;
		var numberTop		= seatMap.find(".seat_sheet_number").offset().top;
	
		var fstRow			= seatMap.find(".seat_sheet_number li[row]:first").offset();
		var lstRow			= seatMap.find(".seat_sheet_number li[row]:last").offset();
		var rowHght			= seatMap.find(".seat_sheet_number li[row]:last").height();
		var boxHght			= (numberTop-priceTop)+(lstRow.top-fstRow.top)+rowHght;

		var	html			= [];
		
		// preview 가격 html
		html.push('<div class="seat_sheet_price_box">');
		html.push('	<div class="buy_num" style="height:'+boxHght+'px;"></div>');
		html.push('</div>');

		// preview dim html
		html.push('<div class="seat_sheet_recom_box">');
		html.push('	<div class="recom_num"><a href="#none" style="position:absolute; background:#000; top:0px; height:100%;"></a></div>');
		html.push('</div>');

		return html.join("");
	}
	// 자동추천좌석 갱신
	// ##################################################################################################
	,updateAutoRcmndHtml	: function(segIdx, rcmndInfo) {
		var _this	= this;
		
		var seatMap	= _this.getApplyTarget("seat", "seatMap", segIdx);
		
		seatMap.find("[seatno]").removeClass("seat_orange");
		
		// 추천좌석 적용
		for (var i=0; i<rcmndInfo.length; i++) {
			var rcmnd		= rcmndInfo[i];
			
			var rank		= rcmnd.rank;
			var gradeCd		= rcmnd.gradeCd;
			var findPtrn	= rcmnd.findPtrn;
			
			// 좌석속성 변경
			for (var j=0; j<findPtrn.length; j++) {
				var seatInfo	= findPtrn[j];
				
				var seatNo		= seatInfo.seatNo;
				var onclick		= "apiCtl.onRcmndSeatClick('"+segIdx+"', '"+gradeCd+"', '"+rank+"', 'sel');";

				seatMap.find("[seatno="+seatNo+"]").addClass("seat_orange");
				seatMap.find("[seatno="+seatNo+"]").attr("onclick", onclick);
			}
		}
	}
	// 추천좌석 표식 html
	// ##################################################################################################
	,getAutoRcmndMarkHtml	: function(segIdx, rcmndInfo) {
		var _this	= this;
		
		var html	= [];
	
		// 추천좌석 적용
		for (var i=0; i<rcmndInfo.length; i++) {
			var rcmnd		= rcmndInfo[i];
			var findPtrn	= rcmnd.findPtrn;
			var totalRnk	= (i+1);
			var fstSeatInfo	= findPtrn[0];

			// 좌석추천 offset
			var seatMap		= _this.getApplyTarget("seat", "seatMap", segIdx);
			var mapOffset	= seatMap.find(".digital_loading").offset();
			var seatOffset	= seatMap.find("[seatno="+fstSeatInfo.seatNo+"]").offset();

			var offsetTop	= (seatOffset.top - mapOffset.top) - 5;
			var offsetLeft	= (seatOffset.left - mapOffset.left) - 5;
			
			html.push('<div class="digi_right" style="top: '+offsetTop+'px; left: '+offsetLeft+'px;" rank="'+totalRnk+'">');
			html.push('	<span class="load_right_a"></span>');
			html.push('	<span class="load_right_b">'+rcmnd.prfrdRate.toFixed(1)+'</span>');
			html.push('</div>');
		}

		return html.join("");
	}
	// 수동추천맵 갱신
	// ##################################################################################################
	,updateSemiRcmndHtml	: function(segIdx, seatList) {
		var _this	= this;
		
		var seatMap	= _this.getApplyTarget("seat", "seatMap", segIdx);
		
		// 좌석 행반복
		for (var i=0; i<seatList.length; i++) {
			var seatInfo	= seatList[i];
			
			var seatNo		= seatInfo.seatNo;
			var charge		= parseInt(seatInfo.charge);
			var seatStatus	= seatInfo.seatStatus;
			var onclick		= "apiCtl.onAssignSeatClick('"+segIdx+"', '"+seatNo+"', 'sel');";
				
			if (seatStatus == "A" & parseInt(charge) > 0) {
				seatMap.find("[seatno="+seatNo+"]").attr("onclick", onclick).removeClass("seat_orange");
			} else {
				seatMap.find("[seatno="+seatNo+"]").addClass("disabled_seat");
			}
		}
		
		// 패턴추천정보 초기화
		seatMap.find(".finger").hide();
	}
	// 개별선택맵 갱신
	// ##################################################################################################
	,updateBasicSeltHtml	: function(segIdx, seatList, paxList) {
		var _this	= this;
		
		var seatMap	= _this.getApplyTarget("seat", "seatMap", segIdx);
		
		// 좌석 행반복
		for (var i=0; i<seatList.length; i++) {
			var seatInfo	= seatList[i];
			
			var seatNo		= seatInfo.seatNo;
			var charge		= parseInt(seatInfo.charge);
			var seatStatus	= seatInfo.seatStatus;
			
			var paxSelSeat	= paxList.filter((e) => e.selSeat && e.selSeat.seatNo == seatNo)[0];
			var onclick		= "";
			
			if (paxSelSeat) {
				onclick		= "apiCtl.onEachSeatClick('"+segIdx+"', '"+seatNo+"', 'canc', '"+paxSelSeat.rph+"');";
			} else {
				onclick		= "apiCtl.onEachSeatClick('"+segIdx+"', '"+seatNo+"', 'sel');";
			}
				
			if (seatStatus == "A" & parseInt(charge) > 0) {
				seatMap.find("[seatno="+seatNo+"]").attr("onclick", onclick).removeClass("seat_orange");
			} else {
				seatMap.find("[seatno="+seatNo+"]").addClass("disabled_seat");
			}
		}
		
		// 패턴추천정보 초기화
		seatMap.find(".finger").hide();
	}
	// 직접선택 좌석 x버튼 html
	// ##################################################################################################
	,getBasicSeltCancBtnHtml	: function(segIdx, paxList) {
		var _this	= this;
		
		var seatMap		= _this.getApplyTarget("seat", "seatMap", segIdx);
		var html		= [];
	
		for (var i=0; i<paxList.length; i++) {
			var paxInfo		= paxList[i];
			var selSeat		= paxInfo.selSeat;
			
			if (!selSeat) {
				continue;
			}
			
			var seatNo		= selSeat.seatNo;
			var seatEl		= seatMap.find("[seatno="+seatNo+"]");
	
			var btnStyle	= "top:"+(seatEl.position().top-12)+"px; left:"+(seatEl.position().left-9)+"px";	
			var cancClick	= "apiCtl.onEachSeatClick('"+segIdx+"', '"+seatNo+"', 'canc', '"+paxInfo.rph+"')";
			
			html.push('<div class="xx_rader" canc-seatno="'+seatNo+'" style="'+btnStyle+'" onclick="'+cancClick+'">x버튼</div>');
		}

		return html.join("");
	}
	// 추좌석 테두리 html
	// ##################################################################################################
	,getRcmndBorderHtml	: function(segIdx, rcmndInfo, rcmndIdx) {
		var _this	= this;
	
		var correctX		= 2;								// top Line X좌표 보정
		var correctY		= 4;								// top Line Y좌표 보정
		var correctRY		= 7.5;								// right Line Y좌표보정
		var correctLY		= 7.5;								// left Line Y좌표보정
		
		var textCorrectX	= 1;								// text X좌표 보정
		var textCorrectY	= 5;								// text Y좌표 보정
		
		var rectCorrectX	= 3;								// rect X좌표 보정
		var rectCorrectY	= 15;								// rect Y좌표 보정

		var seatMap			= _this.getApplyTarget("seat", "seatMap", segIdx);
		var findPtrn		= rcmndInfo.findPtrn;
		var prfrdRate		= rcmndInfo.prfrdRate;
		
		var rowArr			= findPtrn.map(function(item){ return item.row });
		var colArr			= findPtrn.map(function(item){ return item.col });
		
		var duplRowArr		= rowArr.filter(function(item, idx, self){ return self.indexOf(item) == idx }).sort(function(a, b){ return a - b });
		var duplColArr		= colArr.filter(function(item, idx, self){ return self.indexOf(item) == idx }).sort();
		
		var reverseRowArr	= rowArr.filter(function(item, idx, self){ return self.indexOf(item) == idx }).sort(function(a, b){ return a - b }).reverse();
		var reverseColArr	= colArr.filter(function(item, idx, self){ return self.indexOf(item) == idx }).sort().reverse();
		
		var topSeatList		= [];
		var rightSeatList	= [];
		var bottomSeatList	= [];
		var leftSeatList	= [];
		var points			= [];
		
		// topList 설정
		for (var i=0; i<duplColArr.length; i++) {
			var currCol		= duplColArr[i];
			var seatInfo	= findPtrn.filter(function(item){ return item.col == currCol }).shift();
			
			topSeatList.push(seatInfo);
		}
		// rightList 설정
		for (var i=0; i<duplRowArr.length; i++) {
			var currRow		= duplRowArr[i];
			var seatInfo	= findPtrn.filter(function(item){ return item.row == currRow }).pop();
			
			rightSeatList.push(seatInfo);
		}
		// bottomList 설정
		for (var i=0; i<reverseColArr.length; i++) {
			var currCol		= reverseColArr[i];
			var seatInfo	= findPtrn.filter(function(item){ return item.col == currCol }).pop();
			
			bottomSeatList.push(seatInfo);
		}
		// leftList 설정
		for (var i=0; i<reverseRowArr.length; i++) {
			var currRow		= reverseRowArr[i];
			var seatInfo	= findPtrn.filter(function(item){ return item.row == currRow }).shift();
			
			leftSeatList.push(seatInfo);
		}
		
		// topLine point 설정
		var topRightStartIdx		= topSeatList.findIndex(function(item){ return item.seatNo == rightSeatList[0].seatNo });
		
		for (var j=0; j<topSeatList.length; j++) {
			var currSeat	= topSeatList[j];
			var nextSeat	= topSeatList[j+1];
			
			var currSeatEl	= (currSeat) ? seatMap.find("[seatno="+currSeat.seatNo+"]") : null;
			var nextSeatEl	= (nextSeat) ? seatMap.find("[seatno="+nextSeat.seatNo+"]") : null;
			
			var currSeatPos	= (currSeatEl) ? currSeatEl.position() : null;
			var nextSeatPos	= (nextSeatEl) ? nextSeatEl.position() : null;
			
			// topList 현재좌석의 point
			if (currSeat) {
				points.push({x: currSeatPos.left-correctX, y: currSeatPos.top-correctY, type: "top"});
			}
			
			// topList break point
			if (topRightStartIdx <= j) {
				break;
			}
			
			// topList 다음좌석의 point
			if (nextSeat && currSeat.row != nextSeat.row) {
				points.push({x: nextSeatPos.left-correctX, y: currSeatPos.top-correctY, type: "top"});
			}
			
			// topList 다음좌석의 block이 다를경우
			if (nextSeat && currSeat.blockIdx != nextSeat.blockIdx) {
				points.push({x: nextSeatPos.left-correctX, y: currSeatPos.top-correctY, type: "top"});
			}
		}
		
		// rightLine point 설정
		var rightBottomStartIdx		= rightSeatList.findIndex(function(item){ return item.seatNo == bottomSeatList[0].seatNo });
		var rightStartSeat			= rightSeatList[0];

		for (var j=0; j<rightSeatList.length; j++) {
			var currSeat	= rightSeatList[j];
			var nextSeat	= rightSeatList[j+1];
			
			var currSeatEl	= (currSeat) ? seatMap.find("[seatno="+currSeat.seatNo+"]") : null;
			var nextSeatEl	= (nextSeat) ? seatMap.find("[seatno="+nextSeat.seatNo+"]") : null;
			
			var currSeatPos	= (currSeatEl) ? currSeatEl.position() : null;
			var nextSeatPos	= (nextSeatEl) ? nextSeatEl.position() : null;
			
			// rightList 현재좌석의 point
			if (currSeat) {
				points.push({x: currSeatPos.left+currSeatEl.width()+correctX, y: ((rightStartSeat.row == currSeat.row) ? currSeatPos.top-correctY : currSeatPos.top-correctRY), type: "right"});
			}
			
			// rightList break point
			if (rightBottomStartIdx <= j) {
				break;
			}
			
			// rightList 다음좌석의 point
			if (nextSeat && currSeat.col != nextSeat.col) {
				points.push({x: currSeatPos.left+currSeatEl.width()+correctX, y: nextSeatPos.top-correctRY, type: "right"});
			}
		}
		
		// bottomLine point 설정
		var bottomLeftStartIdx	= bottomSeatList.findIndex(function(item){ return item.seatNo == leftSeatList[0].seatNo });
		
		for (var j=0; j<bottomSeatList.length; j++) {
			var currSeat	= bottomSeatList[j];
			var nextSeat	= bottomSeatList[j+1];
			
			var currSeatEl	= (currSeat) ? seatMap.find("[seatno="+currSeat.seatNo+"]") : null;
			var nextSeatEl	= (nextSeat) ? seatMap.find("[seatno="+nextSeat.seatNo+"]") : null;
			
			var currSeatPos	= (currSeatEl) ? currSeatEl.position() : null;
			var nextSeatPos	= (nextSeatEl) ? nextSeatEl.position() : null;
			// bottomList 현재좌석의 point
			if (currSeat) {
				points.push({x: currSeatPos.left+currSeatEl.width()+correctX, y: currSeatPos.top+currSeatEl.outerHeight()+correctY, type: "bottom"});
			}
			
			// bottomList break point
			if (bottomLeftStartIdx <= j) {
				break;
			}
			
			// bottomList 다음좌석의 point
			if (nextSeat && currSeat.row != nextSeat.row) {
				points.push({x: nextSeatPos.left+nextSeatEl.width()+correctX, y: currSeatPos.top+currSeatEl.outerHeight()+correctY, type: "bottom"});
			}
			
			// bottomList 다음좌석의 block이 다를경우
			if (nextSeat && currSeat.blockIdx != nextSeat.blockIdx) {
				points.push({x: nextSeatPos.left+nextSeatEl.width()+correctX, y: currSeatPos.top+currSeatEl.outerHeight()+correctY, type: "bottom"});
			}
		}
		
		// leftLine point 설정
		var leftTopStartIdx		= leftSeatList.findIndex(function(item){ return item.seatNo == topSeatList[0].seatNo });
		var leftStartSeat		= leftSeatList[0];
		
		for (var j=0; j<leftSeatList.length; j++) {
			var currSeat	= leftSeatList[j];
			var nextSeat	= leftSeatList[j+1];
			
			var currSeatEl	= (currSeat) ? seatMap.find("[seatno="+currSeat.seatNo+"]") : null;
			var nextSeatEl	= (nextSeat) ? seatMap.find("[seatno="+nextSeat.seatNo+"]") : null;
			
			var currSeatPos	= (currSeatEl) ? currSeatEl.position() : null;
			var nextSeatPos	= (nextSeatEl) ? nextSeatEl.position() : null;
			
			// leftList 현재좌석의 point
			if (currSeat) {
				points.push({x: currSeatPos.left-correctX, y: ((leftStartSeat.row == currSeat.row) ? currSeatPos.top+currSeatEl.outerHeight()+correctY : currSeatPos.top+currSeatEl.outerHeight()+correctLY), type: "left"});
			}
			
			// leftList break point
			if (leftTopStartIdx <= j) {
				break;
			}
			
			// leftList 다음좌석의 point
			if (nextSeat && currSeat.col != nextSeat.col) {
				points.push({x: currSeatPos.left-correctX, y: nextSeatPos.top+currSeatEl.outerHeight()+correctLY, type: "left"});
			}
		}
		
		// polygon 보정 처리
		var topRightList	= points.filter(function(item){ return item.type == "top" || item.type == "right" });
		var bottomLeftList	= points.filter(function(item){ return item.type == "bottom" || item.type == "left" });
		
		var topRightMaxY	= Math.max.apply(null, topRightList.map(function(item){ return item.y })); 
		var bottomLeftMinY	= Math.min.apply(null, bottomLeftList.map(function(item){ return item.y }));
		
		var pointCorrect	=  false;
		
		for (var i=0; i<topRightList.length; i++) {
			var topRight	= topRightList[i];
			var lineChk		= bottomLeftList.some(function(item){ return item.x > topRight.x && item.y < topRight.y })
			
			if (lineChk) {
				pointCorrect = true;
				break;
			}
		}
		
		if (pointCorrect) {
			for (var i=0; i<points.length; i++) {
				if (points[i].y == topRightMaxY) {
					points[i].y	= ((topRightMaxY+bottomLeftMinY) / 2);
				}
				if (points[i].y == bottomLeftMinY) {
					points[i].y	= ((topRightMaxY+bottomLeftMinY) / 2);
				}
			}
		}
		
		// polygon/rect/text 설정
		var topSeat		= findPtrn.filter(function(item){ return item.row == duplRowArr[0] })[0];
		var topSeatPos	= seatMap.find("[seatno="+topSeat.seatNo+"]").position();
		
		var boxClass	= (rcmndIdx > 0) ? "" : "blink"; 
		var rectClass	= (rcmndIdx > 0) ? "blink" : "";

		var html		= [];

		if (prfrdRate) {
			html.push('<rect class="'+rectClass+'" x="'+(topSeatPos.left-rectCorrectX)+'" y="'+(topSeatPos.top-rectCorrectY)+'" width="48" height="10" fill="rgb(217, 57, 57)"></rect>');
			html.push('<text class="'+rectClass+'" x="'+(topSeatPos.left-textCorrectX)+'" y="'+(topSeatPos.top-textCorrectY)+'" width="50" font-size="9" fill="rgb(255, 255, 255)">AI '+(rcmndIdx+1)+'위'+prfrdRate.toFixed(1)+'</text>');
		}
		
		html.push('<polygon class="'+boxClass+'" points="'+points.map(function(item){ return item.x+","+item.y }).join(" ")+'" stroke="rgb(217, 57, 57)" stroke-width="1.5" fill="none"></polygon>');
	
		return html.join("");
	}
	// 좌석선택 알림 팝업 좌석맵 html
	// ##################################################################################################
	,getAlphaSelSeatMapHtml	: function(segIdx, segInfo, paxInfo, seatInfo) {
		var _this	= this;
		
		var airType		= segInfo.airType.toLowerCase();
		var selMode		= _this.getApplyTarget("seat", "seatMap", segIdx).data("mode");
		var chdMode		= _this.getApplyTarget("popup", "selSeatMap", segIdx).data("chdMode");

		var html		= "";

		switch (selMode) {
			case "rcmnd"	:
				if (typeof(window[airType+"AlphaDisp"].getAutoSelSeatMapHtml) == "function") {
					html	= window[airType+"AlphaDisp"].getAutoSelSeatMapHtml(segIdx, segInfo, paxInfo, seatInfo, chdMode);
				}
				break;
			case "assign"	:
				if (typeof(window[airType+"AlphaDisp"].getAutoSelSeatMapHtml) == "function") {
					html	= window[airType+"AlphaDisp"].getAutoSelSeatMapHtml(segIdx, segInfo, paxInfo, seatInfo, chdMode);
				}
				break;
			case "each"	:
				if (typeof(window[airType+"AlphaDisp"].getEachSelSeatMapHtml) == "function") {
					html	= window[airType+"AlphaDisp"].getEachSelSeatMapHtml(segIdx, segInfo, paxInfo, chdMode);
				}
				break;
		}
		
		return html;
	}
	// 자리조정 html
	// ##################################################################################################
	,getAlphaSeatAdjustmentHtml	: function(segIdx, segInfo, paxInfo, seatInfo) {
		var _this	= this;
		
		var airType		= segInfo.airType.toLowerCase();
		var selMode		= _this.getApplyTarget("seat", "seatMap", segIdx).data("mode")
		
		var html		= "";
		
		switch (selMode) {
			case "rcmnd"	:
				if (typeof(window[airType+"AlphaDisp"].getAutoSelSeatAdjustmentHtml) == "function") {
					html	= window[airType+"AlphaDisp"].getAutoSelSeatAdjustmentHtml(segIdx, segInfo, paxInfo, seatInfo);
				}
				break;
			case "assign"	:
				if (typeof(window[airType+"AlphaDisp"].getAutoSelSeatAdjustmentHtml) == "function") {
					html	= window[airType+"AlphaDisp"].getAutoSelSeatAdjustmentHtml(segIdx, segInfo, paxInfo, seatInfo);
				}
				break;
			case "each"	:
				if (typeof(window[airType+"AlphaDisp"].getEachSelSeatAdjustmentHtml) == "function") {
					html	= window[airType+"AlphaDisp"].getEachSelSeatAdjustmentHtml(segIdx, segInfo, paxInfo);
				}
				break;
		}
			
		return html;
	}
	// 좌석 구매불가 html 생성
	// ##################################################################################################
	,getSeatErrorHtml	: function(segIdx, errType, comment) {
		var _this	= this;
		var html	= [];

		var icon	= (errType == "data" || errType == "acType") ? "ico-wrap" : "icoh-seat"; 
		var btnYn	= (errType == "data" || errType == "acType") ? true : false;
		
		var title 	= "";
		var text	= "";
	
		switch (errType) {
			case "depDtm"	:
				title	= "사전 좌석 구매 불가 안내";
				text	= (comment) ? comment : "출발 25시간 전까지 구매가능";
				break;
			case "avail"	:
				title	= "사전 좌석 구매 불가 안내";
				text	= (comment) ? comment.replace(/#{svcNm}/gi, "사전 좌석") : "여정의 사전 좌석 정보를 확인할 수 없어<br>구매가 어렵습니다.";
				break;
			case "data"	:
				title	= "사전 좌석 구매 불가 안내";
				text	= "여정의 사전 좌석 정보를 확인할 수 없어 구매가 어렵습니다.";
				break;
			case "purchased"	:
				title	= "사전 좌석 구매 불가 안내";
				text	= "일행 전체가 사전 좌석을 구매하셨습니다.<br>구매하신 좌석은 마이페이지에서 확인 가능합니다.<br>변경을 원하시면 현재 구매 되어 있는 부가서비스를<br>취소 후 재구매 바랍니다.";
				break;
			case "selEmpty"	:
				title	= "사전 좌석 구매 불가 안내";
				text	= "구매 가능한 좌석이 없습니다.";
				break;
			case "biz"	:
				title	= "비즈니스 급 좌석 무료선택 안내";
				text	= "비즈니스 급의 좌석지정은 해당 항공사<br>홈페이지를 통하여 무료로 선택이 가능합니다.<br>감사합니다.";
				break;
			case "premium"	:
				title	= "프리미엄 이코노미 급 좌석 무료선택 안내";
				text	= "프리미엄 이코노미 급의 좌석지정은 해당 항공사<br>홈페이지를 통하여 무료로 선택이 가능합니다.<br>감사합니다.";
				break;
			case "acType"	:
				title	= "사전 좌석 구매 불가 안내";
				text	= "현재 사전좌석을 구매할 수 없는 항공기 기종입니다.<br>항공사 홈페이지를 이용하시거나 알림받기 버튼을 클릭하여 구매가 가능할 때 알림을 받아보세요.";
				break;
			case "fail"	:
				title	= "구매 관련 안내 사항";
				text	= "현재 부가서비스 구매가 어렵습니다.<br>잠시 후에 다시 부가서비스 구매를 해주시거나<br>항공사를 통해 구매해주시기 바랍니다.";
				break;
			case "canceled"	:
				title	= "구매 관련 안내 사항";
				text	= (comment) ? comment : "항공권이 취소되어있어 부가서비스 구매가 불가합니다.<br>항공권을 구매하신 여행사로 문의해주세요.";
				break;
			case "changed"	:
				title	= "여정 변경 확정 후 구매 요청";
				text	= (comment) ? comment : "항공사 여정 변경 처리 확정이 필요합니다.<br>여정 변경 완료 후 구매를 부탁드립니다.";
				break;
			case "unticketed"	:
				title	= "구매 관련 안내 사항";
				text	= "현재 부가서비스 구매가 어렵습니다.<br>잠시 후에 다시 부가서비스 구매를 해주시거나<br>항공사를 통해 구매해주시기 바랍니다.";
				break;
			case "9890" :
				title	= "구매 관련 안내 사항";
				text	= (comment) ? comment : "현재 부가서비스 구매가 어렵습니다.<br>잠시 후에 다시 부가서비스 구매를 해주시거나<br>항공사를 통해 구매해주시기 바랍니다.";
				break;
		}
	
		html.push('	<div class="no-item" style="top:30%">');
		html.push('		<div class="'+icon+'"></div>');
		html.push('		<h3 class="alert-title">');
		html.push('			'+title);
		html.push('		</h3>');
		html.push('		<div class="alert-text">');
		html.push('			'+text);
		html.push('		</div>');
		
		var btnClick		= "apiCtl.checkSvcStatus("+segIdx+", 'AS')";
		var withTicketYn	= apiCtl.getSegCtl(segIdx).withTicketYn;
		
		if (btnYn && withTicketYn != "Y") {
			html.push('	<button class="alram_btn">');
			html.push('		<span onclick="'+btnClick+'">알림 받기</span>');
			html.push('		<div class="alram_txt2">구매 안내 알림을 받으시겠습니까?</div>');
			html.push('	</button>');
			html.push('	<div class="alram_txt1" style="display: none;">');
			html.push('		알림 받기가 확인되었습니다.');
			html.push('	</div>');
		}
		
		html.push('		<button class="pay_dibtn" style="display:none"></button>');
		html.push('	</div>');
		
		return html.join("");
	}
	// 적용대상 조회
	// ##################################################################################################
	,getApplyTarget	: function(container, target, segIdx) {
		var containerInfo	= {
			"purchase"	: "[purchase-container]",
			"seat"		: "[purchase-container=seat]",
		}
		
		var applyTarget		= null;
		
		switch (target) {
			case "seatMap"	:
				applyTarget	= (segIdx) ? $(containerInfo[container]).find("[seatMap="+segIdx+"]") : $(containerInfo[container]).find("[seatMap]");
				break;
			case "areaPreview"	:
				applyTarget	= $(containerInfo[container]).find("[seatMap="+segIdx+"] .seat_sheet_price");
				break;
			case "basicPreview"	:
				applyTarget	= $(containerInfo[container]).find("[seatMap="+segIdx+"] .seat_sheet_price");
				break;
			case "autoRcmndMark"	:
				applyTarget	= $(containerInfo[container]).find("[seatMap="+segIdx+"] .digital_loading");
				break;
			case "rcmndBorder"	:
				applyTarget	= $(containerInfo[container]).find("[seatMap="+segIdx+"] svg");
				break;
			case "selSeatMap"	:
				applyTarget	= $(containerInfo[container]).find("[selSeatMap="+segIdx+"]");
				break;
			case "basicSeltCancBtn"	:
				applyTarget	= $(containerInfo[container]).find("[seatMap="+segIdx+"] [cancBtn]");
				break;
//			case "selSeatMap"	:
//				applyTarget	= $(containerInfo[container]).find("[selSeatMap="+segIdx+"]");
//				break;
//			case "seatAdjustment"	:
//				applyTarget	= $(containerInfo[container]).find("[popup-type=seatAdjustment] [seatAdjustment]");
//				break;
			default	:
				applyTarget	= $(containerInfo[container]).find(target);
		}

		return applyTarget;
	}
}