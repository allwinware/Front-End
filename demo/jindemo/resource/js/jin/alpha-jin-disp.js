var jinAlphaDisp	= {
	// 설정 정보
	config	: {
		name	: "alpha-jinair-display"
	}
	//추천 좌석선택 노티팝업 > 좌석맵 html 생성
	// ##################################################################################################
	,getAutoSelSeatMapHtml	: function(segIdx, segInfo, paxInfo, seatInfo, chdMode) {
		var _this		= this;
		
		var seatList	= seatInfo.seatList;
		var seatConfig	= seatInfo.seatConfig;
		
		var paxList		= paxInfo.paxList.filter((e) => !(e.airService && e.airService.seat && e.airService.seat.some((seat) => seat.segmentId == segInfo.segmentId)));
		var selSeatLt	= paxList.filter((e) => e.selSeat).map((e) => e.selSeat);
		var selSeatRows	= selSeatLt.map((e) => ({row: e.row, rowIdx: e.rowIdx})).sort((a, b) => a.rowIdx - b.rowIdx).map((e) => e.row).filter((item, idx, self) => self.indexOf(item) == idx);
		
		var colArr		= seatList.map(function(item){ return item.col });
		var duplColArr	= colArr.filter(function(item, idx, self){ return self.indexOf(item) == idx }).sort();
		var blockArr	= seatConfig.reduce(function(acc,cur){ acc.push(duplColArr.splice(0, Number(cur))); return acc; }, []);

		var itryText	= (segIdx == 1) ? "가는편" : "오는편";
		var ulClass		= (seatInfo.acType == "777-200ER") ? "sc_343" : "";
		
		var html		= [];
		
		// 편명사용체크
		if (apiCtl.getSegCtl(segIdx).useFlyNum) {
			itryText	= segInfo.flyNum;
		}
		
		if (seatInfo.acType == "777-200ER") {
			ulClass		= "lj_B777-200";
		}
		
		html.push('<ul class="seat_num '+ulClass+'">');
		html.push('	<div class="gotoback">'+itryText+'</div>');

		// 추천 좌석선택 노티 팝업 좌석맵
		for (var i=0; i<selSeatRows.length; i++) {
			var rowSeatLt	= seatList.filter((e) => e.row == selSeatRows[i]);
			var rowBlock	= blockArr.map((e) => e.filter((col) => rowSeatLt.some((seat) => seat.col == col)));
			
			var currRow		= selSeatRows[i];

			html.push('<li>');
			
			for (var j=0; j<rowBlock.length; j++) {
				var block		= (rowBlock[j].length > blockArr[j].length) ? rowBlock[j] : blockArr[j];
				
				for (var k=0; k<block.length; k++) {
					var seatInfo	= rowSeatLt.filter((e) => e.col == block[k])[0];
					
					var selected	= (seatInfo) ? selSeatLt.some((e) => e.seatNo == seatInfo.seatNo) : false;
					var paxInfo		= (seatInfo) ? paxList.filter((e) => e.selSeat && e.selSeat.seatNo == seatInfo.seatNo)[0] : null;
					var chdCls		= (paxInfo) ? ((chdMode && (paxInfo.paxType == "CHD" || ((paxInfo.age) ? paxInfo.age < 15 : false))) ? " bg_blue" : "") : "";

					if (!seatInfo) {
						html.push('<span><a href="#none" class="seat_btn disabled_seat" style="opacity:0;"></a></span>');
					}
					else if (selected) {
						html.push('<span><a href="#none" class="seat_btn_pop'+chdCls+'">'+seatInfo.seatNo+'</a></span>');
					}
					else {
						html.push('<span><a href="#none" class="seat_btn disabled_seat"></a></span>');
					}
				}
				
				if (rowBlock[j+1]) {
					html.push('<span class="hallway">'+currRow.padStart(2, "0")+'</span>');
				}
			}
			
			html.push('</li>');
		}
		
		html.push('</ul>');
		html.push('<div class="cuga_txtbtn" style="'+((paxList.length > 1 && selSeatLt.length > 0) ? "" : "display: none;")+'">');

		var chdModeStat	= {
			"alone"		: "어린이만 따로 앉아있습니다.",
			"abreast"	: "어린이끼리 앉아있습니다."
		}
		
		if (chdMode) {
    		html.push('	<div>'+chdModeStat[chdMode]+'</div>');
    		html.push('	<div><span>"자리조정" 버튼을 클릭하시면 자리를 바꿀 수 있습니다.<span></div>');
	    } else {
	    	html.push('	<div><span>"일행 간 자리조정" 시 클릭해주세요.</span></div>');
	    }
	    
	    html.push('    <div class="cuga_btn"><a href="#none" onclick="apiCtl.onSeatAdjustmentClick('+segIdx+', \''+chdMode+'\');">자리조정</a></div>');
	    html.push('</div>');
	    
		return html.join("");
	}
	// 직접 좌석선택 노티팝업 > 좌석맵 html 생성
	// ##################################################################################################
	,getEachSelSeatMapHtml	: function(segIdx, segInfo, paxInfo, chdMode) {
		var _this		= this;
		var html		= [];
		
		var paxList		= paxInfo.paxList.filter((e) => !(e.airService && e.airService.seat && e.airService.seat.some((seat) => seat.segmentId == segInfo.segmentId)));
		var selSeatLt	= paxList.filter((e) => e.selSeat).map((e) => e.selSeat);
	
		var itryText	= (segIdx == 1) ? "가는편" : "오는편";
		
		// 편명사용체크
		if (apiCtl.getSegCtl(segIdx).useFlyNum) {
			itryText	= segInfo.flyNum;
		}
		
		html.push('<ul class="seat_num">');
		html.push('	<div class="gotoback">'+itryText+'</div>');
		html.push('	<div class="diff">');
		
		// 정렬
		selSeatLt.sort((a,b) => a.colIdx - b.colIdx).sort((a,b) => a.row - b.row);
		
		for (var i=0; i<selSeatLt.length; i++) {
			var paxInfo		= paxList.filter((e) => ((e.selSeat) ? e.selSeat.seatNo == selSeatLt[i].seatNo : false))[0];
			var chdCls		= (paxInfo) ? ((chdMode && (paxInfo.paxType == "CHD" || ((paxInfo.age) ? paxInfo.age < 15 : false))) ? " bg_blue" : "") : "";
			
			if (selSeatLt[i]) {
				html.push('<span class="seat_btn_pop'+chdCls+'">'+selSeatLt[i].seatNo+'</span> ');
			}
		}
		
		html.push('	</div>');
		html.push('</ul>');
		html.push('<div class="cuga_txtbtn" style="'+((paxList.length > 1 && selSeatLt.length > 0) ? "" : "display: none;")+'">');

		var chdModeStat	= {
			"alone"		: "어린이만 따로 앉아있습니다.",
			"abreast"	: "어린이끼리 앉아있습니다."
		}
		
		if (chdMode) {
    		html.push('	<div>'+chdModeStat[chdMode]+'</div>');
    		html.push('	<div><span>"자리조정" 버튼을 클릭하시면 자리를 바꿀 수 있습니다.<span></div>');
	    } else {
	    	html.push('	<div><span>"일행 간 자리조정" 시 클릭해주세요.</span></div>');
	    }
	    
	    html.push('		<div class="cuga_btn"><a href="#none" onclick="apiCtl.onSeatAdjustmentClick('+segIdx+', \''+chdMode+'\');">자리조정</a></div>');
	    html.push('</div>');
	    
		return html.join("");
	}
	// 추천 좌석선택 자리조정 html 생성
	// ##################################################################################################
	,getAutoSelSeatAdjustmentHtml	: function(segIdx, segInfo, paxInfo, seatInfo) {
		var _this		= this;
		
		var seatList	= seatInfo.seatList;
		var seatConfig	= seatInfo.seatConfig;
		
		var paxList		= paxInfo.selTemp.paxList;
		var selSeatLt	= paxList.filter((e) => e.selSeat).map((e) => e.selSeat).sort((a,b) => a.colIdx - b.colIdx).sort((a,b) => a.rowIdx - b.rowIdx);
		var selSeatRows	= selSeatLt.map((e) => ({row: e.row, rowIdx: e.rowIdx})).sort((a, b) => a.rowIdx - b.rowIdx).map((e) => e.row).filter((item, idx, self) => self.indexOf(item) == idx);
		
		var colArr		= seatList.map(function(item){ return item.col });
		var duplColArr	= colArr.filter(function(item, idx, self){ return self.indexOf(item) == idx }).sort();
		var blockArr	= seatConfig.reduce(function(acc,cur){ acc.push(duplColArr.splice(0, Number(cur))); return acc; }, []);
		
		var phraseCtl	= apiCtl.getSegCtl(segIdx).phraseCtl;
		var seatGuide	= phraseCtl.getElementPharseHtml("selectionView", "adjustment", "[popup-adjustment-seat-text]");
		var resetBtn	= phraseCtl.getElementPharseHtml("selectionView", "adjustment", "[popup-adjustment-reset-text]");
		
		var onClear		= "apiCtl.onSeatAdjustmentClearClick('"+segIdx+"')";
		var onSave		= "apiCtl.onSeatAdjustmentSaveClick('"+segIdx+"')";
		
		var itryText	= (segIdx == 1) ? "가는편" : "오는편";
		var active		= "box_blink";
		var ulClass		= "";

		var html		= [];
		
		// 편명사용체크
		if (apiCtl.getSegCtl(segIdx).useFlyNum) {
			itryText	= segInfo.flyNum;
		}
		
		if (seatInfo.acType == "777-200ER") {
			ulClass		= "sc_343";
		}
		
		html.push('<div class="popup_con1">');
		html.push('	<div class="pay_way save">');
		html.push('		<div>');
		html.push('			<div class="select_txt2">');
		html.push('				<span>'+itryText+'</span>');
		html.push('				<div class="region_txt1">');
		html.push('					<span>'+segInfo.depStnCd+'</span>');
		html.push('					<span>'+segInfo.arrStnCd+'</span>');
		html.push('				</div>');
		html.push('			</div>');
		html.push('		</div>');
		html.push('		<button type="button" class="pay_turn" onclick="'+onClear+'">'+resetBtn+'</button>');
		html.push('	</div>');
		html.push('	<div class="pay_del">');
		html.push('		<span currseat>['+selSeatLt[0].seatNo+']</span>'+seatGuide);
		html.push('	</div>');
		html.push('	<div class="popup_con2">');
		html.push('		<ul class="seat_num '+ulClass+'">');
		
		// 추천 좌석선택 노티 팝업 좌석맵
		for (var i=0; i<selSeatRows.length; i++) {
			var rowSeatLt	= seatList.filter((e) => e.row == selSeatRows[i]);
			var rowBlock	= blockArr.map((e) => e.filter((col) => rowSeatLt.some((seat) => seat.col == col)));
			
			var currRow		= selSeatRows[i];
			
			html.push('<li>');
			
			for (var j=0; j<rowBlock.length; j++) {
				var block		= (rowBlock[j].length > blockArr[j].length) ? rowBlock[j] : blockArr[j];
				
				for (var k=0; k<block.length; k++) {
					var seatInfo	= rowSeatLt.filter((e) => e.col == block[k])[0];
					var selected	= (seatInfo) ? selSeatLt.some((e) => e.seatNo == seatInfo.seatNo) : false;

					var currCol		= block[k];
					
					if (!seatInfo) {
						html.push('<span><a href="#none" class="seat_btn disabled_seat" style="opacity:0;"></a></span>');
					}
					else if (selected) {
						html.push('<span class="'+active+'" seatidx="'+(currRow+"-"+currCol)+'"><a href="#none" class="seat_btn" seatNo="'+seatInfo.seatNo+'">'+seatInfo.seatNo+'</a></span>');
						active	= "";
					}
					else {
						html.push('<span><a href="#none" class="seat_btn disabled_seat"></a></span>');
					}
				}
				
				if (rowBlock[j+1]) {
					html.push('<span class="hallway">'+currRow.padStart(2, "0")+'</span>');
				}
			}
			
			html.push('</li>');
		}
		
		html.push('		</ul>');	
		html.push('	</div>');
		html.push('	<ul class="pay_group cho">');
		
		for (var i=0; i<paxList.length; i++) {
			var paxInfo	= paxList[i];
			var onClick	= "apiCtl.onSeatAdjustmentPaxPick('"+segIdx+"', '"+paxInfo.rph+"')";
			
			html.push('	<li paxrph="'+paxInfo.rph+'">');
			html.push('		<div class="pay_group_s" onclick="'+onClick+'">');
			html.push('			<span class=""></span>');
			html.push('			<span>'+paxInfo.surname+' '+paxInfo.givenName+'</span>');
			html.push('		</div>');
			html.push('		<span>');
			html.push('			<a href="#none" class="pay_select_o" onclick="'+onClick+'"></a>');
			html.push('		</span>');
			html.push('	</li>');
		}
		
		// 저장하기 버튼
		var button	= phraseCtl.getElementPharseHtml("selectionView", "adjustment", "[adjustment-button-text1]");
		
		html.push('	</ul>');
		html.push('</div>');
		html.push('<div class="pay_pay"><button type="button" onclick="'+onSave+'">'+button+'</button></div>');
		
		return html.join("");
	}
	// 직접 선택좌석 자리조정 html 생성
	// ##################################################################################################
	,getEachSelSeatAdjustmentHtml	: function(segIdx, segInfo, paxInfo) {
		var _this		= this;
		var html		= [];
	
		var phraseCtl	= apiCtl.getSegCtl(segIdx).phraseCtl;
		var paxList		= paxInfo.selTemp.paxList;
	
		var selPaxList	= paxList.filter(function(item){ return item.selSeat });
		var selSeatList	= selPaxList.map(function(item){ return item.selSeat });
			
		var onClear		= "apiCtl.onSeatAdjustmentClearClick('"+segIdx+"')";
		var onSave		= "apiCtl.onSeatAdjustmentSaveClick('"+segIdx+"')";
		
		var seatGuide	= phraseCtl.getElementPharseHtml("selectionView", "adjustment", "[popup-adjustment-seat-text]");
		var resetBtn	= phraseCtl.getElementPharseHtml("selectionView", "adjustment", "[popup-adjustment-reset-text]");
		
		var itryText	= (segIdx == 1) ? "가는편" : "오는편";
		
		// 편명사용체크
		if (apiCtl.getSegCtl(segIdx).useFlyNum) {
			itryText	= segInfo.flyNum;
		}
		
		// 정렬
		selSeatList.sort(function(a, b){ return a.colIdx - b.colIdx }).sort(function(a, b){ return a.row - b.row });
		
		html.push('<div class="popup_con1">');
		html.push('	<div class="pay_way save">');
		html.push('		<div>');
		html.push('			<div class="select_txt2">');
		html.push('				<span>'+itryText+'</span>');
		html.push('				<div class="region_txt1">');
		html.push('					<span>'+segInfo.depStnCd+'</span>');
		html.push('					<span>'+segInfo.arrStnCd+'</span>');
		html.push('				</div>');
		html.push('			</div>');
		html.push('		</div>');
		html.push('		<button type="button" class="pay_turn" onclick="'+onClear+'">'+resetBtn+'</button>');
		html.push('	</div>');
		html.push('	<div class="pay_del">');
		html.push('		<span currseat>['+selSeatList[0].seatNo+']</span> '+seatGuide);
		html.push('	</div>');
		html.push('	<div class="popup_con2">');
		html.push('		<ul class="seat_num">');
		
		var active		= "box_blink";
		var seatIdx		= 0;
		
		html.push('			<li class="jipjub">');
		
		for (var i=0; i<selSeatList.length; i++) {
			var selSeat	= selSeatList[i];
			
			seatIdx++;
			html.push('			<span class="'+active+'" seatidx="'+seatIdx+'"><a href="#none" class="seat_btn" seatNo="'+selSeat.seatNo+'">'+selSeat.seatNo+'</a></span> ');
			active	= "";
		}
		
		html.push('			</li>');
		
		html.push('		</ul>');	
		html.push('	</div>');
		html.push('	<ul class="pay_group cho">');
		
		for (var i=0; i<paxList.length; i++) {
			var paxInfo	= paxList[i];
			var onClick	= "apiCtl.onSeatAdjustmentPaxPick('"+segIdx+"', '"+paxInfo.rph+"')";
	
			html.push('	<li paxrph="'+paxInfo.rph+'">');
			html.push('		<div class="pay_group_s" onclick="'+onClick+'">');
			html.push('			<span class=""></span>');
			html.push('			<span>'+paxInfo.surname+' '+paxInfo.givenName+'</span>');
			html.push('		</div>');
			html.push('		<span>');
			html.push('			<a href="#none" class="pay_select_o" onclick="'+onClick+'"></a>');
			html.push('		</span>');
			html.push('	</li>');
		}
		
		// 저장하기 버튼
		var button	= phraseCtl.getElementPharseHtml("selectionView", "adjustment", "[adjustment-button-text1]");
		
		html.push('	</ul>');
		html.push('</div>');
		html.push('<div class="pay_pay"><button type="button" onclick="'+onSave+'">'+button+'</button></div>');
		
		return html.join("");
	}
	// 승객 수하물정보 html
	// ##################################################################################################
	,getPaxBaggageHtml	: function(segIdx, segInfo, paxList, bagInfo) {
		var bagPerPaxList	= bagInfo.bagPerPaxList;
		var bagType			= bagInfo.bagType;
		var freeBag			= Number(bagInfo.freeBag);
		var addPolicy		= (bagInfo.addPolicy) ? bagInfo.addPolicy.purchaseableYn : "N";

		var html			= [];
		
		html.push('<ul>');
		
		for (var i=0; i<paxList.length; i++) {
			var paxInfo		= paxList[i];
			var bagPerPax	= bagPerPaxList.filter(function(item){ return item.guestId == paxInfo.guestId })[0];
			
			var paxName		= paxInfo.surname+' '+paxInfo.givenName;
			var saleMax		= Number(bagPerPax.saleMax);
		
			var purchased	= (paxInfo.airService) ? paxInfo.airService.baggage : null;
			var segPurchs	= (purchased) ? purchased.filter(function(item){ return item.segmentId == segInfo.segmentId }) : null;
			var paidBag		= (segPurchs) ? segPurchs.reduce(function(acc,cur){
				return acc + cur.paidBag.reduce(function(acc2,cur2){ return acc2+Number(cur2.val || 0) },0)
			},0) : 0;

			var onPlusClick		= "apiCtl.onBagPerPaxClick('"+segIdx+"','"+paxInfo.rph+"','plus')";
			var onMinusClick	= "apiCtl.onBagPerPaxClick('"+segIdx+"','"+paxInfo.rph+"','minus')";
		
			html.push('<li paxrph="'+paxInfo.rph+'" paidbag="'+paidBag+'">');
			html.push('	<div class="baggagep_txt1">');
			html.push('		<div>'+paxName+'</div>');
			html.push('		<div>기본 '+freeBag+bagType+'</div>');
			html.push('	</div>');
			html.push('	<div class="baggagep_txt2">');
			html.push('		<div class="baggagep_sum">');
			html.push('			<div class="baggagep_txt2_img '+(paidBag > 0 ? "cancel" : "")+'">추가</div>');
			html.push('			<div class="baggagep_btn_chk">');

			if ((paidBag+freeBag) < saleMax && (paidBag == 0 || addPolicy == "Y")) {
				html.push('				<span><button class="decrease_btn" onclick="'+onMinusClick+'" minusbtn>-</button></span>');
			} else {
				html.push('				<span><button class="decrease_btn">-</button></span>');
			}
			
			if ((paidBag+freeBag) < saleMax && (paidBag == 0 || addPolicy == "Y")) {
				html.push('				<span class="number_box" curSsrId="">0'+bagType+'</span>');
			} else {
				html.push('				<span class="number_box color_gary" curSsrId="">0'+bagType+'</span>');
			}
			
			if ((paidBag+freeBag) < saleMax && (paidBag == 0 || addPolicy == "Y")) {
				html.push('				<span><button class="increase_btn active" onclick="'+onPlusClick+'" plusbtn>+</button></sapn>');
			} else {
				html.push('				<span><button class="increase_btn">+</button></sapn>');
			}
			
			html.push('			</div>');
			html.push('		</div>');
			
			if ((paidBag+freeBag) < saleMax && (paidBag == 0 || addPolicy == "Y")) {
				html.push('	<div class="baggagep_pay gab1" charge>0</div>');
			} else {
				html.push('	<div class="baggagep_reserv">'+paidBag+bagType+' 구매</div>');
			}
			
			html.push('	</div>');
			html.push('</li>');
		}
		
		html.push('</ul>');
		
		return html.join("");
	}
}