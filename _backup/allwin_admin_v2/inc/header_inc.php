<body>
	<div id="loader">
		<img src="../img/icon/loader.png" class="loading">
	</div>
	<p class="skip"><a href="#gnb">주메뉴 바로가기</a></p>
	<p class="skip"><a href="#container">본문 바로가기</a></p>
	<div class="modal_bg" style="display: none;"></div>

	<div class="wrap_gnb"> <!-- gnb 시작 -->
		<div class="modal_bg_2dep" style="display: none;"></div>
		<div id="" class="header_gnb clearfix">

			<!-- <div class="logo_area">
				<a class="main_logo" href="../main/main.php"><img src="../img/main/logo.png" alt="로고이미지"></a>
			</div> -->

			<div class="area_close left">
				<a class="btn_close" href="#" onclick="return false;"><img src="../img/main/btn_close.png" alt="닫기"></a>
			</div>

			<div class="area_btn_txt right">
				<a class="btn_txt" href="#" onclick="return false;" style="display: none;">로그아웃</a>				
			</div>
			
		</div><!-- //header -->
		
		
		<div class="wrap_login_box"><!-- // 로그인 전 -->
			<div class="info_login">
				<p class="hh1">현재 <span>118,931</span>명의 생각이 공유되고 있습니다.</p>
				<p class="hh2">폴라테스는 성별, 연령, 지역 등 최소한의 정보와<br />단 한번의 본인 인증만으로 가입할 수 있습니다.</p>
			
				<div class="area_btn_default clearfix">
					<p>
						<a class="btn_act" href="../sub/login.php">로그인</a>
						<a class="btn_defa" href="../sub/join.php">간편 회원 가입</a>
					</p>
				</div>			
			</div>
		</div>

		<!-- <div class="wrap_info_your">
			<div class="info_your">// 로그인 완료
				<div class="pic_profile">
					<a href=""><img src="../img/main/profile_default.png" alt="기본 프로필 이미지입니다" /></a>
				</div>
				<p id="nickname">벤자민버튼</p>
				<p id="id_main">choihong89</p>	
			</div>			
		</div> --><!-- //wrap_info_your -->


		<ul class="list_menu">
			<li><a href="../main/main.php">HOME</a></li>
			<li><a href="">BEST POLL</a></li>
			<li><a href="">주간 POLL</a></li>
			<li><a class="btn_2dep" href="#" onclick="return false;">분야별 POLL</a></li>
			<li><a href="">내가 투표한 글 보기</a></li>
			<li><a href="">내가 작성한 글 보기</a></li>
			<!-- <li><a href="">글 작성하기</a></li> -->
		</ul>

		<p class="area_setting"><a class="btn_setting" href="#" onclick="return false;"><img src="../img/ico/ico_setting.png" alt="설정 버튼" /></a></p>		
		
		
		
		<div class="wrap_gnb_2dep"> <!-- gnb 2dep -->
			<div id="" class="header_gnb clearfix">

				<!-- <div class="logo_area">
					<a class="main_logo" href="../main/main.php"><img src="../img/main/logo.png" alt="로고이미지"></a>
				</div> -->

				<div class="area_btn_prev left">
					<a class="btn_prev" href="#" onclick="return false;"><img src="../img/main/btn_prev.png" alt="이전으로"></a>
				</div>

				<div class="area_close right">
					<a class="btn_close" href="#" onclick="return false;"><img src="../img/main/btn_close.png" alt="닫기"></a>
				</div>
				
			</div><!-- //header -->

			<ul class="list_menu">
				<li><a href="">정치</a></li>
				<li><a href="">경제·사회</a></li>
				<li><a href="">연예</a></li>
				<li><a href="">스포츠</a></li>
				<li><a href="">게임</a></li>
				<li><a href="">IT</a></li>
				<li><a href="">생활·문화</a></li>
				<li><a href="">연애 재판소</a></li>
				<li><a href="">자유 게시판</a></li>
			</ul>
			<!-- <p class="area_setting"><a class="btn_setting" href="#" onclick="return false;"><img src="../img/ico/ico_setting.png" alt="설정 버튼" /></a></p> -->		
		</div><!-- //wrap_gnb 2dep 끝 -->

		
		<div class="wrap_gnb_setting"> <!-- gnb 셋팅 시작 -->
			<div id="" class="header_gnb clearfix">

				<!-- <div class="logo_area">
					<a class="main_logo" href="../main/main.php"><img src="../img/main/logo.png" alt="로고이미지"></a>
				</div> -->

				<div class="area_close left">
					<a class="btn_prev" href="#" onclick="return false;"><img src="../img/main/btn_prev.png" alt="이전으로"></a>
				</div>

				<div class="area_close right">
					<a class="btn_close" href="#" onclick="return false;"><img src="../img/main/btn_close.png" alt="닫기"></a>
				</div>
				
			</div><!-- //header -->

			<ul class="list_setting">
				<li>
					<dl>
						<dt>계정</dt>
						<dd><a href="">회원 정보 변경</a></dd>
						<dd><a href="">비밀번호 변경</a></dd>
					</dl>				
				</li>

				<li>
					<dl>
						<dt>서비스</dt>
						<dd><a href="">회원 탈퇴</a></dd>
					</dl>				
				</li>
			</ul>
			
		</div><!-- //wrap_gnb -->
	</div><!-- //wrap_gnb -->



	<div class="wrap_gnb_search"><!-- 검색 시작 -->

		<form action="">
			<fieldset>
				<legend>검색하기</legend>

				<div id="" class="header_gnb clearfix">

					<div class="area_close left">
						<a class="btn_prev_search" href="#" onclick="return false;"><img src="../img/main/btn_prev.png" alt="이전으로"></a>
					</div>

					<input id="" type="text" placeholder="검색어를 입력해 주세요" value="">

					<!--<div class="area_close right">
						<a class="btn_close" href="#" onclick="return false;"><img src="../img/main/btn_close.png" alt="닫기"></a>
					</div> -->
					
				</div><!-- //header -->

				<ul class="list_option_search">
					<li>
						<select name="" title="카테고리 선택" class="">
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
					</li>

					<li>
						<select name="" title="기간 선택" class="">
							<option value="" selected="selected">최근 한달</option>
							<option value="">최근 1년</option>
							<option value="">전체</option>
						</select>
					</li>

					<li>
						<select name="" title="검색 범위 선택" class="">
							<option value="" selected="selected">제목 + 본문</option>
							<option value="">제목</option>
							<option value="">본문</option>
							<option value="">작성자</option>
						</select>
					</li>
				</ul>

				<button class="wrap_btn_search" type="submit">
					<span class="btn_login_style_normal">검색하기</span>
				</button>

			</fieldset>
		</form>
	</div><!-- gnb_search -->



	<div id="wrap">

		<a class="btn_go_top" href="#wrap" onclick="return false;"><img src="../img/main/btn_gotop.png" alt="최상위로 가기 버튼" /></a>

		<header id="header" class="clearfix">

			<div class="logo_area">
				<a class="main_logo" href="../main/main.php"><img src="../img/main/logo.png" alt="로고이미지"></a>
			</div>

			<div class="btn_menu left">
				<span class="push"></span>
				<a class="btn_gnb" href="#" onclick="return false;"><img src="../img/main/btn_menu30.png" alt=""></a>
			</div>

			<div class="search_area right">
				<a class="btn_search" href="#" onclick="return false;"><img src="../img/main/btn_search.png" alt=""></a>				
			</div>
			
		</header><!--header_end-->

