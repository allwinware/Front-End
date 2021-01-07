<? include('../inc/head_inc.php');?>

<body>
	<div id="loader">
		<img src="../img/icon/loader.png" class="loading">
	</div>
	<!-- <p class="skip"><a href="#gnb">주메뉴 바로가기</a></p>
	<p class="skip"><a href="#container">본문 바로가기</a></p> -->
	<div class="modal_bg" style="display: none;"></div>

	<div id="wrap" class="bg_login_grey">		
		
		<div id="" class="header_case_login clearfix"> <!-- 로그인 헤더 -->

			<div class="area_close left">
				<a class="btn_close" href="javascript:history.back(-2)"><img src="../img/main/btn_close.png" alt="닫기"></a>
			</div>

			<div class="area_title_h1">
				<p class="title_h1">가입 정보 입력</p>
			</div>
			
		</div><!-- //header -->
		

	
		<div id="container" class="padding_login_field">

			<form action="">
				<fieldset class="flds_join">
					<legend>로그인 정보 입력 폼</legend>

					<div class="wrap_form_login">

						<!-- <div class="checks t_right" style="margin-bottom: -4px; margin-right: 14px;">
							<input type="checkbox" id="ex_chk02">
							<label class="lb_case_01" for="ex_chk02">로그인 상태 유지</label>
						</div> -->

						<div class="box_input_log t_center mb10">
							<label for="id" class="lab_log" style="display: none;">이름</label>
							<input type="email" id="id" name="id" value="" class="inp_log inp_log_simple" placeholder="이름">
							<!-- <span class="txt_input_desc">이메일 중복</span> -->
							<span class="txt_input_confirm"></span>
						</div>

						<div class="box_input_log t_center mb10">
							<label for="pw" class="lb_log" style="display: none;">비밀번호 입력</label>
							<input type="password" id="pw" name="pw" value="" class="inp_log inp_log_simple" placeholder="비밀번호">
							<!-- <span class="txt_input_desc">보안취약</span> -->
							<span class="txt_input_confirm"></span>
						</div>
						
						<div class="box_input_log t_center mb40">
							<label for="pw" class="lb_log" style="display: none;">비밀번호 확인</label>
							<input type="password" id="pw" name="pw" value="" class="inp_log inp_log_simple" placeholder="비밀번호 확인">
							<span class="txt_input_desc">비밀번호 불일치</span>
							<!-- <span class="txt_input_confirm"></span> -->
						</div>

						<div class="wrap_terms">

							<div class="tit_terms clearfix">
								<h5 class="left">약관 동의</h5>
								<div class="checks t_right right" style="margin-top: -14px;">
									<input type="checkbox" id="terms_chk_all">
									<label class="lb_case_01" for="terms_chk_all">모두 동의합니다</label>
								</div>
							</div>						

							<div class="box_terms mb50">
								<div class="item_terms clearfix">
									<div class="checks t_right left" style="margin-top: -14px;">
										<input type="checkbox" id="terms_chk_01">
										<label class="lb_case_01" for="terms_chk_01">폴라테스 서비스 약관 동의</label>
									</div>
									<a class="btn_show_terms right" href="#" onclick="return false;">보기</a>
								</div>
								
								<div class="item_terms clearfix">
									<div class="checks t_right left" style="margin-top: -14px;">
										<input type="checkbox" id="terms_chk_02">
										<label class="lb_case_01" for="terms_chk_02">폴라테스 개인정보 수집 및 이용 동의</label>
									</div>
									<a class="btn_show_terms right" href="#" onclick="return false;">보기</a>
								</div>

								<div class="item_terms last clearfix">
									<div class="checks t_right left" style="margin-top: -14px;">
										<input type="checkbox" id="terms_chk_03">
										<label class="lb_case_01" for="terms_chk_03">만 14세 이상입니다.</label>
									</div>
									<a class="btn_show_terms right" href="#" onclick="return false;">보기</a>
								</div>								
							</div>
						
						</div><!-- //wrap_terms -->						
						
					</div>

				</fieldset>
			</form>		

		</div><!-- //container End -->

		<div class="area_btn_next">
			<a href="#" onclick="return false;" class="btn_submit_bottom_b" tabindex="9">다음</a>
		</div>

	</div><!-- wrap -->
</body>
</html>