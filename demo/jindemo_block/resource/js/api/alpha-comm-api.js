var commAlphaApi = {
	config	: {
		SEG_IDX		: 1,	// 여정 idx
		SEG_INFO	: {},	// 여정 정보
		PAX_INFO	: {},	// 승객 정보
		AVAIL_INFO	: {},	// 유효성 정보
		SEAT_INFO	: {},	// 좌석 정보
		PTRN_INFO	: {},	// 패턴 정보
		RCMND_INFO	: [],	// 추천 정보
		ASSIGN_INFO	: [],	// 추천 정보
		POLICY_INFO	: [],	// 정책 정보
		SALE_TYPE	: ""	// 판매유형
	}
	// 초기화
	// ##################################################################################################
	,init	: function() {
		var _this			= this;
		var deferred		= $.Deferred();
			
		var svcList			= _this.svcList;
		var reqList			= [];

		// 서비스API
		for (var i=0; i<svcList.length; i++) {
			reqList.push(_this[svcList[i]+"PolicyValid"]($.Deferred()));
		}
		
		// 초기화 done 
		$.when.apply($, reqList).then(() => {
			deferred.resolve("init-response");
		})

		// paxCnt 설정
		$("[paxCnt]").text(_this.config.PAX_INFO.paxList.length);
		
		return deferred.promise();
	}
}

