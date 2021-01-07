<? include('../inc/head_inc.php');?>

<body>
	<div id="loader">
		<img src="../img/icon/loader.png" class="loading">
	</div>
	<!-- <p class="skip"><a href="#gnb">주메뉴 바로가기</a></p>
	<p class="skip"><a href="#container">본문 바로가기</a></p> -->
	<div class="modal_bg" style="display: none;"></div>

	<div id="wrap" class="bg_login_grey">		
		
		<div id="" class="header_case_login shadow_header clearfix"> <!-- 로그인 헤더 -->

			<div class="area_close left">
				<a class="btn_close" href="javascript:history.back(-1)"><img src="../img/main/btn_close.png" alt="닫기"></a>
			</div>

			<div class="area_title_h1">
				<p class="title_h1">글 작성하기</p>
			</div>
			
		</div><!-- //header -->

		<div id="container">

			<div class="wrap_make_poll">

				<form action="">
					<fieldset>
						<legend>글 작성 양식</legend>
						<div class="wrap_select_box">
							<label for="category" class="screen_out">게시판 선택 상자</label>
							<select id="category" name="" title="카테고리 선택" class="select_make_poll">
								<option value="" selected="selected">게시판 전체</option>
								<option value="">정치</option>
								<option value="">경제·사회</option>
								<option value="">연예</option>
								<option value="">스포츠</option>
								<option value="">게임</option>
								<option value="">IT</option>
								<option value="">생활·문화</option>
								<option value="">연애 재판소</option>
								<option value="">자유 게시판</option>
							</select>
						</div>

						<div class="wrap_title_box">
							<label for="title" class="screen_out">제목</label>
							<input type="text" name="subject" id="subject" class="inp_title" title="제목" tabindex="1" maxlength="170" value="" placeholder="제목" autocomplete="on" autocorrect="off" autocapitalize="off" spellcheck="false">			
						</div>

						<div class="wrap_input_box">
							<label for="source" class="screen_out">기사 or 출처</label>
							<input type="text" name="source" id="source" class="inp_title" title="기사 or 출처" tabindex="1" maxlength="170" value="" placeholder="기사 · 관련링크 · 출처가 있다면 링크를 남겨주세요" autocomplete="on" autocorrect="off" autocapitalize="off" spellcheck="false">
						</div>

						<div class="wrap_txtarea_box bb10">
							<label for="txtarea" class="screen_out">내용 입력</label>
							<textarea class="inp_txta" name="txtarea" id="txtarea" cols="30" rows="8" placeholder="· 본문 내용이 필요 없다면 작성하지 않아도 됩니다.&#13;&#10;· 선정적이거나 다른이에게 불쾌감을 줄 수 있는 글은 경고 없이 삭제될 
수 있습니다.&#13;&#10;· 같은 사유의 신고가 20회 이상이면 글은 자동으로 삭제됩니다.&#13;&#10;· 투표가 20회 이상 진행되면 수정/삭제가 불가능합니다.&#13;&#10;· 1회 이상 투표된 항목은 수정/삭제가 불가능합니다."></textarea>
						</div>

						<div class="wrap_input_box_add clearfix">
							<label for="add_item1" class="screen_out">투표 항목 입력</label>
							<input type="text" name="add_item1" id="add_item1" class="inp_title left" title="" tabindex="1" maxlength="170" value="" placeholder="투표 항목 입력">
							<a class="btn_add_item right" href="#" onclick="return false;">삭제</a>
						</div>

						<div class="wrap_input_box_add clearfix">
							<label for="add_item2" class="screen_out">투표 항목 입력</label>
							<input type="text" name="add_item2" id="add_item2" class="inp_title left" title="" tabindex="1" maxlength="170" value="" placeholder="투표 항목 입력">
							<a class="btn_add_item right" href="#" onclick="return false;">삭제</a>
						</div>

						<div class="area_btn_more clearfix bb10">
							<div class="btn_more left"><a href="#" onclick="return false;">항목 추가하기<!-- <span class="ico_more"></span> --></a></div>
						</div><!-- 더보기 & 전체보기 -->

						<div class="wrap_padf" style="border-bottom: 1px solid #efefef;">
							<div class="checks">
								<input type="checkbox" id="ex_chk01">
								<label class="lb_case_01" for="ex_chk01">다른 사용자의 항목 입력 추가 허용 </label>
							</div>
						</div>	
						
						<div class="wrap_select_box bb10">
							<label for="category" class="screen_out">선택 옵션</label>
							<select id="category" name="" title="득표수 선택" class="select_make_poll" style="padding: 16px 36px !important;">
								<option value="" selected="selected">추가 항목, 투표수 0부터 노출</option>
								<option value="">추가 항목, 투표수 10부터 노출</option>
								<option value="">추가 항목, 투표수 20부터 노출</option>
								<option value="">추가 항목, 투표수 30부터 노출</option>
								<option value="">추가 항목, 투표수 50부터 노출</option>
								<option value="">추가 항목, 투표수 100부터 노출</option>
							</select>
						</div>

						<div class="wrap_padf bb10">
							<a class="btn_con_normal" href="#" onclick="return false;">글 올리기</a>
						</div>

					</fieldset>				
				</form>
				
			</div>

		</div><!-- //container End -->

<? include('../inc/footer_inc.php');?>