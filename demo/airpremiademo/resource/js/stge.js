
const stgeCtl = {
	 STORAGE_KEY: 'demo_data'
	,getInitData() {
		return {
			 flyList	: [
/*

							{
								"rph": "1",
								"status": "HK",
								"flyNum": "LJ45",
								"airCd": "LJ",
								"acType": "737-8",
								"depDtm": "2026-01-29T21:10:00",
								"depUTCDtm": "2026-01-29T12:10:00",
								"arrDtm": "2026-01-30T01:10:00",
								"arrUTCDtm": "2026-01-29T17:10:00",
								"depStnCd": "ICN",
								"depStnNm": "인천",
								"depStnCity": "서울",
								"depTimeZone": "Asia/Seoul",
								"depCurrDtm": "2025-12-03 15:23:40",
								"arrStnCd": "TAG",
								"arrStnNm": "팡라오",
								"arrStnCity": "보홀",
								"arrCurrDtm": "2025-12-03 14:23:40",
								"arrTimeZone": "Asia/Manila",
								"fareRefCd": "ECONOMY",
								"segmentGroupId": "500",
								"segmentId": "500",
								"bookClsAvails": [
									{
										"resBookDesgCd": "N"
									}
								],
								"journeyTime": "05:00"
							}

*/
			]
			,paxList	: [
/*

				{
					"rph": "1",
					"givenName": "SUHYUN",
					"surname": "KWON",
					"paxType": "ADT",
					"email": "SUHYUN1979@NAVER.COM",
					"airService": {
						"baggage": [
							{
								"flyRph": "1",
								"ssrCode": "XBAG",
								"svcQty": 1,
								"airCd": "LJ",
								"bagType": "KG",
								"freeBag": 15,
								"paidBag": [
									{}
								],
								"totalBag": 15,
								"segmentId": "500",
								"ssrId": "",
								"depStnCd": "ICN",
								"penaltyFee": 0,
								"chkFlag": false
							}
						]
					},
					"birthday": "1979-07-14",
					"age": 46,
					"tkne": "7186051725765",
					"sex": "F",
					"phoneNumLt": [
						null,
						"108-866-0476"
					],
					"guestId": "826529223",
					"penaltyFee": {
						"totalFarePenaltyFee": 0,
						"totalAncPenaltyFee": 0
					}
				}

*/
			]
		};
	}
	,init() {	// 데이터 초기화
		var _this	= this;

		const initialData = _this.getInitData();
		localStorage.setItem(_this.STORAGE_KEY, JSON.stringify(initialData));
		console.log("데이터가 초기화되었습니다!");
		return initialData;
	}
	,getData() {
		var _this	= this;

		try {
			const	data = localStorage.getItem(_this.STORAGE_KEY);
			return	data ? JSON.parse(data) : _this.init();
		} catch (error) {
			return _this.init();
		}
	}
	,setData(data) {
		var _this	= this;
		try {
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
			return true;
		} catch (error) {
			return false;
		}
	}
	,get(path) {
		var _this	= this;

		const	data	= this.getData();
		const	keys	= path.split('.');
		let		value	= data;

		for (const key of keys) {
			if (value && typeof value === 'object' && key in value) {
				value = value[key];
			} else {
				return null;
			}
		}
		return value;
	}
	,set(path, value) {
		var _this	= this;

		const	data	= _this.getData();
		const	keys	= path.split('.');
		const	lastKey	= keys.pop();
		let target = data;

		for (const key of keys) {
			if (!(key in target)) target[key] = {};
			target = target[key];
		}

		target[lastKey]	= value;
		return _this.setData(data);
	}
	,update(updates) {
		var _this	= this;

		const	data		= _this.getData();
		const	updatedData	= _this.deepMerge(data, updates);
		return	_this.setData(updatedData);
	}
	,clear() {
		var _this	= this;

		localStorage.removeItem(_this.STORAGE_KEY);
	}
	,deepMerge(target, source) {
		var _this	= this;

		const output = { ...target };
		if (_this.isObject(target) && _this.isObject(source)) {
			Object.keys(source).forEach(key => {
				if (_this.isObject(source[key])) {
					if (!(key in target)) {
						output[key] = source[key];
					} else {
						output[key] = _this.deepMerge(target[key], source[key]);
					}
				} else {
					output[key] = source[key];
				}
			});
		}
		return output;
	}
	,isObject(item) {
		return item && typeof item === 'object' && !Array.isArray(item);
	}
};



