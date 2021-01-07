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
				<a class="btn_close" href="javascript:history.back(-1)"><img src="../img/main/btn_close.png" alt="닫기"></a>
			</div>

			<div class="area_title_h1">
				<p class="title_h1">로그인</p>
			</div>
			
		</div><!-- //header -->
	
	
	
		<div id="container" class="padding_login_field">

			<p class="txt_holla">안녕하세요.<br />유연한 생각의 공유,<br />폴라테스입니다.</p>

			<form action="">
				<fieldset>
					<legend>로그인 정보 입력 폼</legend>

					<div class="wrap_form_login">

						<div class="checks t_right" style="margin-bottom: -4px; margin-right: 14px;">
							<input type="checkbox" id="ex_chk02">
							<label class="lb_case_01" for="ex_chk02">로그인 상태 유지</label>
						</div>

						<div class="box_input_log t_center mb10">
							<label for="id" class="lab_log screen_out">아이디 입력</label>
							<input type="email" id="id" name="id" value="" class="inp_log inp_log_simple t_center" placeholder="이메일 아이디">
						</div>

						<div class="box_input_log t_center mb40">
							<label for="pw" class="lb_log screen_out">비밀번호 입력</label>
							<input type="password" id="pw" name="pw" value="" class="inp_log inp_log_simple t_center" placeholder="비밀번호">
						</div>

						<div class="box_submit_log mb10">
							<button type="button" class="btn_log_strong" id="">로그인</button>
						</div>
						
						<div class="box_submit_log mb21">
							<a class="btn_log" href="../sub/join.php">간편 회원 가입</a>
						</div>

						<p class="txt_log_bottom t_center mb40">
						<a href="">아이디</a>&nbsp;&nbsp;or&nbsp;&nbsp;<a href="">비밀번호</a>를 잊어버리셨나요?
						</p>					
						
					</div>

				</fieldset>
			</form>		

		</div><!-- //container End -->

	</div><!-- wrap -->
</body>
</html>