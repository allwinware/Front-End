# 올윈에어 마크업 가이드

올윈에어 마크업 가이드는 유연하고 지속 가능한 코드 작성을 위해 제작한 사내 표준입니다.

- - -

1. [기본 규칙](#basic)
2. [에디터 설정](#editor)
3. [HTML](#html)
    1. [HTML 문법](#html-syntax)
    2. [HTML5 doctype](#html-doctype)
    3. [언어(lang) 속성](#html-lang)
    4. [인코딩 설정](#html-charset)
    5. [IE 호환모드 설정](#html-ie-compatible)
    6. [주석](#html-comment)
    7. [CSS, JavaScript 삽입](#html-type-attr)
4. [CSS](#css)
    1. [CSS 문법](#css-syntax)
    2. [미디어 쿼리 위치](#css-media-query)
    3. [주석](#css-comment)
    4. [클래스 작명](#css-naming)
    5. [선택자](#css-selector)
    6. [컴포넌트](#css-component)
5. [리소스](#resource)    
6. [배포](#release)    
7. [License](#license)

- - -

## 기본 규칙 <a id="basic" href="#basic">#</a>

html표준을 준수하고 시멘틱한 문서 작성을 원칙으로 하되, 최대한 쉽고 간결한 코드를 작성하도록 합니다. 


- - -

## 에디터 설정 <a id="editor" href="#editor">#</a>

규칙을 준수하기 위해 [IntelliJ IDEA](https://www.jetbrains.com/idea/)를 사용합니다. 개발영역과 동일한 설정으로 코딩합니다.

- - -

## HTML <a id="html" href="#html">#</a>

### HTML 문법 <a id="html-syntax" href="#html-syntax">#</a>

* 들여쓰기는 공백문자 4 개를 사용합니다.
* 속성(attr)값에는 항상 큰 따옴표를 사용합니다.
* 단일 태그에는 슬래시(/)를 사용하지 않습니다. (예: `<br />` or `<img />`)

### HTML5 doctype <a id="html-doctype" href="#html-doctype">#</a>
모든 HTML 페이지 시작 지점에 공백 없이 HTML5 문서 타입을 선언합니다.

~~~
    <!DOCTYPE html>
    <html lang="ko">
    ...
    </html>    
~~~ 
    
### 언어(lang) 속성 <a id="html-lang" href="#html-lang">#</a>
문서 루트인 html 요소에 lang="ko" 속성을 추가합니다.

~~~
    <html lang="ko">
        ...
    </html>
~~~

### 인코딩 설정 <a id="html-charset" href="#html-charset">#</a>
문자열 인코딩을 명시적으로 선언합니다.

~~~
    <head>
        <meta charset="UTF-8">
    </head>
~~~

### IE 호환모드 설정 <a id="html-ie-compatible" href="#html-ie-compatible">#</a>
인터넷 익스플로러 및 크롬 브라우저가 항상 최신 버전의 레이아웃 엔진을 사용하여 문서를 렌더링하도록 지정합니다.

~~~
    <meta http-equiv="X-UA-Compatible" content="IE=Edge,chrome=1">
~~~ 
    
### 주석 <a id="html-comment" href="#html-comment">#</a>
주석은 간결하게 작성합니다.

~~~
    <!-- header -->
    <header class="awa-header">
        <!-- 로고 -->
        <h1 class="hd-logo">
            <a href="" class="hd-logo__link">ALLWIN AIR</a>
        </h1>
        <!-- //로고 -->

        <!-- 메뉴 -->
        <nav class="hd-nav">
            <ul>
                <li class="hd-nav__item">
                    <a href="" class="hd-nav__link hd-nav__link--active js_hd-nav__link"></a>
                </li>
            </ul>
        </nav>
        <!-- //메뉴 -->

        <!-- 유틸 -->
        <section class="hd-util">
            <ul>
                <li class="hd-util__item">
                    <a href="" class="hd-util__link"></a>
                </li>
            </ul>
        </section>
        <!-- //유틸 -->
    </header>
    <!-- //header -->    
~~~

### CSS, JavaScript 작성 <a id="html-type-attr" href="#html-type-attr">#</a>
CSS와 JavaScript를 불러올 때 type 속성을 생략합니다.

~~~
    <!-- External CSS -->
    <link rel="stylesheet" href="awa.ui.min.css">

    <!-- Inline CSS -->
    <style>...</style>

    <!-- JavaScript -->
    <script src="awa.ui.min.js"></script>
~~~


- - -

## CSS <a id="css" href="#css">#</a>

### CSS 문법 <a id="css-syntax" href="#css-syntax">#</a>
기본 문법은 IntelliJ IDEA에서 제공하는 reformat code체크 후 적용합니다.(commit시 체크)
 
* 들여쓰기는 공백문자 4 개를 사용합니다.
* 속성 선언 시 콜론(:) 뒤에는 공백문자 하나를 포함시킵니다.
* 한 줄에 하나의 속성만 작성합니다.
* 모든 속성 선언은 마지막에 세미콜론(;)으로 끝냅니다.
* 속성값에 소숫점을 사용할 때 '0.'을 사용하지 않습니다.(예: 0.5대신 .5를, -0.5px대신 -.5px)
* 축약 가능한 16진수 값은 축약합니다. (예: #ffffff 대신 #fff)
* 속성값들에는 홑따옴표를 사용합니다. (예: [type='text'])
* 값이 `0`일 때는 단위를 생략합니다. (예: margin: 0px; 대신 margin: 0; 사용)


### 미디어 쿼리 위치 <a id="css-syntax" href="#css-syntax">#</a>
미디어쿼리는 관련 규칙이 있는 자리에 모아 놓습니다.

~~~
    .awa-header { ... }
    .hd-logo { ... }
    .hd-logo__link { ... }

    @media (min-width: 480px) {
        .awa-header { ... }
        .hd-logo { ... }
        .hd-logo__link { ... }
    }
~~~

### 주석 <a id="css-comment" href="#css-comment">#</a>
주석은 간결하게 작성합니다. 

~~~
    /* 로고 */
    .hd-logo {
        ...
    }
~~~

### 클래스 작명 <a id="css-naming" href="#css-naming">#</a>
* 클래스 명 규칙은 [BEM(Block Element Modifier)](http://getbem.com/naming/)스타일을 따릅니다.
* Block을 감싸는 클래스명은 'awa-' prefix를 사용합니다.(예: awa-wrap, awa-header, awa-container, awa-footer)
* 카멜 케이스와 파스칼 케이스는 사용하지 않습니다.
* ID는 사용할 수 없고, 오직 class명만 사용할 수 있다.(개발처리를 위한 id는 가능)
* 클래스 명이 길어지면 축약해서 사용 가능합니다. 
* 시각적 표현 대신 의미, 구조, 목적을 담아 작명합니다.
* Block명이나 Element명이 길 경우 하이픈(–)으로 연결한다.
* Element는 더블 하이푼(__)표시로 연결하여 block 다음에 작성하며, Modifier는 더블 대시(--)표시로 연결하여 Element 다음에 작성합니다.
* Element는 상황에 따라 Block이나 Element다음에 바로 작성할수 있습니다.
* js처리를 위한 클래스는 'js_' prefix를 추가해서 구분 (예 : js_hd-nav__link)

~~~
    /* header안에 nav(header를 hd로 축약) */
    .hd-nav { ... }                   // Block 
    .hd-nav__item { ... }             // Block__Element
    .hd-nav__link { ... }             // Block__Element
    .hd-nav__link--active { ... }     // Block__Element--Modifier
~~~

### 선택자 <a id="css-selector" href="#css-selector">#</a>
* 클래스 선택자를 사용합니다.
* 상황에 따라서 타입 선택자를 사용할수 있지만, 최대한 자제합니다.
* 선택자 우선순위(specificity)를 높이는 조합과 중첩을 사용하지 않습니다. 조합과 중첩은 3회를 초과하지 않습니다.
* 여러 클래스를 묶을 때 쉼표 후 개행합니다.


### 컴포넌트 <a id="css-component" href="#css-component">#</a>
* 컴포넌트 별로 코드를 모아서 작성합니다.
* 계층 구조의 순서에 따라 작성합니다.
* 코드 블럭을 분리할 때 공백(줄 바꿈)을 일관성 있게 사용합니다.

~~~
    /* button */
    .awa-bt { ... }
    .awa-bt__ok { ... }
    .awa-bt__ok--active{ ... }
    .awa-bt__yes { ... }
    .awa-bt__yes--disbled { ... }
~~~


### 리소스 <a id="resource" href="#resource">#</a>
수정이 필요없는 resource는 cdn으로 관리합니다.

~~~
    /* IMAGE */
    <link rel="shortcut icon" href="https://cdn.allwin.bid/static/img/favicon_32_32.ico" type="image/x-icon">
    
    /* CSS */
    <link rel="stylesheet" href="https://cdn.allwin.bid/static/css/awa.ui.min.css">
    
    /* JS */
    <script src="https://cdn.allwin.bid/static/js/jquery-2.2.4.min.js"></script>
~~~


### 배포 <a id="release" href="#release">#</a>
css 및 js 파일은 용량처리를 위해 min파일로 압축 후 배포합니다.(압축툴은 IntelliJ IDEA에서 세팅하면 min파일 자동 생성)

~~~
    /* CSS */
    awa.ui.css --> awa.ui.min.css
    
    /* JS */
    awa.ui.js --> awa.ui.min.js 
~~~

### License
Released under MIT by, and copyright 2018, @ALLWIN AIR