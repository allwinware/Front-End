var commSeatDisp	= {
	// 좌석 요금정보 갱신
	// ##################################################################################################
	updateSeatChargeHtml	: function(segIdx, seatInfo) {
		var _this		= this;
		
		var seatList	= seatInfo.seatList;
		var seatMap		= _this.getApplyTarget("seat", "seatMap", segIdx);

		for (var i=0; i<seatList.length; i++) {
			var currSeat	= seatList[i];
			var seatNo		= currSeat.seatNo;
			var charge		= parseInt(currSeat.charge);
			var seatStatus	= currSeat.seatStatus;

			seatMap.find("[seatno="+seatNo+"]").removeClass("seat_active plus_block seat_active_plus");

			if (seatStatus == "A") {
				seatMap.find("[seatno="+seatNo+"]").html('<span class="blind_box">'+charge.comma()+'</span>');
			} else {
				seatMap.find("[seatno="+seatNo+"]").addClass("disabled_seat");
			}
		}
	}
	// 수동추천맵 갱신
	// ##################################################################################################
	,updateAutoRcmndHtml	: function(segIdx, seatInfo) {
		var _this	= this;
		
		var seatList	= seatInfo.seatList;
		var seatMap		= _this.getApplyTarget("seat", "seatMap", segIdx);
		
		// 좌석 행반복
		for (var i=0; i<seatList.length; i++) {
			var currSeat	= seatList[i];
			var seatNo		= currSeat.seatNo;
			var seatStatus	= currSeat.seatStatus;
			var onclick		= "demoCtl.onAutoRcmndClick('"+seatNo+"', 'sel');";
			
			seatMap.find("[seatno="+seatNo+"]").removeClass("seat_active plus_block seat_active_plus");
			
			if (seatStatus == "A") {
				seatMap.find("[seatno="+seatNo+"]").attr("onclick", onclick).removeClass("seat_orange");
			} else {
				seatMap.find("[seatno="+seatNo+"]").addClass("disabled_seat");
			}
		}
	}
	// 개별선택맵 갱신
	// ##################################################################################################
	,updateBasicSeltHtml	: function(segIdx, seatInfo, paxInfo) {
		var _this	= this;
		
		var seatList	= seatInfo.seatList;
		var paxList		= paxInfo.paxList;
		
		var seatMap		= _this.getApplyTarget("seat", "seatMap", segIdx);
		
		// 좌석 행반복
		for (var i=0; i<seatList.length; i++) {
			var seatNo		= seatList[i].seatNo;
			var charge		= parseInt(seatList[i].charge);
			var seatStatus	= seatList[i].seatStatus;
			
			var paxSelSeat	= paxList.filter((e) => e.selSeat && e.selSeat.seatNo == seatNo)[0];
			var onclick		= "";
			
			if (paxSelSeat) {
				onclick		= "demoCtl.onManualSeatClick('"+seatNo+"', 'canc', '"+paxSelSeat.rph+"');";
			} else {
				onclick		= "demoCtl.onManualSeatClick('"+seatNo+"', 'sel');";
			}
			
			if (seatStatus == "A" & parseInt(charge) > 0) {
				seatMap.find("[seatno="+seatNo+"]").attr("onclick", onclick).removeClass("seat_orange").find("span").addClass("blind_box");
			} else {
				seatMap.find("[seatno="+seatNo+"]").addClass("disabled_seat");
			}
		}
	}
	// 테두리 html
	// ##################################################################################################
	,getBlockBorderHtml	: function(segIdx, seatList) {
		var _this	= this;

		var correctX		= 2;								// top Line X좌표 보정
		var correctY		= 4;								// top Line Y좌표 보정
		var correctRY		= 7.5;								// right Line Y좌표보정
		var correctLY		= 7.5;								// left Line Y좌표보정
		
		var seatMap			= _this.getApplyTarget("seat", "seatMap", segIdx);
		
		var rowArr			= seatList.map(function(item){ return item.row });
		var colArr			= seatList.map(function(item){ return item.col });
		
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
			var seatInfo	= seatList.filter(function(item){ return item.col == currCol }).shift();
			
			topSeatList.push(seatInfo);
		}
		// rightList 설정
		for (var i=0; i<duplRowArr.length; i++) {
			var currRow		= duplRowArr[i];
			var seatInfo	= seatList.filter(function(item){ return item.row == currRow }).pop();
			
			rightSeatList.push(seatInfo);
		}
		// bottomList 설정
		for (var i=0; i<reverseColArr.length; i++) {
			var currCol		= reverseColArr[i];
			var seatInfo	= seatList.filter(function(item){ return item.col == currCol }).pop();
			
			bottomSeatList.push(seatInfo);
		}
		// leftList 설정
		for (var i=0; i<reverseRowArr.length; i++) {
			var currRow		= reverseRowArr[i];
			var seatInfo	= seatList.filter(function(item){ return item.row == currRow }).shift();
			
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
		
		var html		= [];

		html.push('<polygon class="blink" points="'+points.map(function(item){ return item.x+","+item.y }).join(" ")+'" stroke="rgb(217, 57, 57)" stroke-width="1.5" fill="none"></polygon>');
	
		return html.join("");
	}
	// 좌석선택 알림 팝업 좌석맵 html
	// ##################################################################################################
	,getSelPlusStatHtml	: function(segIdx, paxInfo, seatInfo) {
		var _this			= this;
		
		var seatList		= seatInfo.seatList;
		var selPlusLt		= paxInfo.selPlus || [];
		var purchsedSeatLt	= paxInfo.paxList.filter((e) => e.selSeat).map((e) => e.selSeat);
		
		var fullSeatList	= purchsedSeatLt.concat(selPlusLt).sort((a,b) => a.colIdx - b.colIdx);
		var seatRows		= fullSeatList.map((e) => ({row: e.row, rowIdx: e.rowIdx})).sort((a, b) => a.rowIdx - b.rowIdx).map((e) => e.row).filter((item, idx, self) => self.indexOf(item) == idx);
		var blockIdxLt		= fullSeatList.map((e) => e.blockIdx).filter((item, idx, self) => self.indexOf(item) == idx);
		
		var plusUnitCharge	= demoCtl.getSegCtl(segIdx).config.plusCharge;
		var seatMap			= _this.getApplyTarget("seat", "seatMap", segIdx);
		var styleWidth		= (fullSeatList.length > 2) ? "wid120" : "wid90";
		var html			= [];
		
//		html.push('		<ul class="seat_num '+(blockIdxLt <= 1 ? styleWidth : "")+'">');
		html.push('		<ul class="seat_num">');
		
		// Rows
		for (var i=0; i<seatRows.length; i++) {
			var rowsSeatLt	= seatList.filter((e) => e.row == seatRows[i]);
			
			html.push('		<li>');

			// Rows > seatLt
			for (var j=0; j<rowsSeatLt.length; j++) {
				var checkedSeat	= fullSeatList.some((e) => e.seatNo == rowsSeatLt[j].seatNo);
				var isPurchsed	= purchsedSeatLt.some((e) => e.seatNo == rowsSeatLt[j].seatNo);

				if (!checkedSeat) {
					html.push('		<span><a href="#none" class="seat_btn disabled_seat"></a></span>');
				}
				else if (isPurchsed) {
					html.push('		<span><a href="#none" class="seat_btn seat_active">'+rowsSeatLt[j].seatNo+'</a></span>');
				} 
				else {
					var isPlusAct	= seatMap.find("[seatNo="+rowsSeatLt[j].seatNo+"]").hasClass("seat_active_plus");
					
					if (isPlusAct) {
						html.push('	<span><a href="#none" class="seat_btn seat_active_plus">'+rowsSeatLt[j].seatNo+'</a></span>');
					} else {
						html.push('	<span><a href="#none" class="seat_btn plus_block" style="line-height: 55px;"><span>'+plusUnitCharge.comma()+'</span></a></span>');
					}
				}
				
				if (rowsSeatLt[j+1] && rowsSeatLt[j].blockIdx != rowsSeatLt[j+1].blockIdx) {
					html.push('		<span style="width: 10px;"></span>');
				}
			}

			html.push('		</li>');
		}
		
		html.push('		</ul>');
		
		return html.join("");	
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
			var cancClick	= "demoCtl.onManualSeatClick('"+seatNo+"', 'canc', '"+paxInfo.rph+"');";
			
			html.push('<div class="xx_rader" canc-seatno="'+seatNo+'" style="'+btnStyle+'" onclick="'+cancClick+'">x버튼</div>');
		}

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
			case "basicSeltCancBtn"	:
				applyTarget	= $(containerInfo[container]).find("[seatMap="+segIdx+"] [cancBtn]");
				break;
			default	:
				applyTarget	= $(containerInfo[container]).find(target);
		}

		return applyTarget;
	}
}