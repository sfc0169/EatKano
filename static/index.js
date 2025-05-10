// IMPORTANT: Make sure to include the Supabase SDK in your HTML file before this script:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const MODE_NORMAL = 1, MODE_ENDLESS = 2, MODE_PRACTICE = 3;

// ─── Supabase Client Initialization ───
const SUPABASE_URL = 'https://pazuftgivpsfqekecfvt.supabase.co';
// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// IMPORTANT: REPLACE WITH YOUR ACTUAL SUPABASE ANONYMOUS KEY
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhenVmdGdpdnBzZnFla2VjZnZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NzUwNTUsImV4cCI6MjA2MjM1MTA1NX0.m_N4lzEf6rbSqN18oDre4MCx8MteakGfyvv9vs3p5EY'; // 提供されたキーを使用
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
const supaClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// ─── End of Supabase Client Initialization ───

(function(w) {

    // ─── Supabase Submit Score Function (Uses username/message from settings) ───
    async function SubmitResultsToSupabase() {
        const usernameVal = ($("#username").val() || '').trim();
        const messageVal = ($("#message").val() || '').trim();

        if (!usernameVal) {
            // console.log("ユーザー名が設定されていません。スコアはSupabaseに保存されません。");
            // alert("ユーザー名を[設定]で入力すると、スコアがランキングに登録されます。");
            return;
        }

        const scoreToSubmit = _gameScore;

        const { data, error } = await supaClient
            .from('leaderboard')
            .insert([
                { name: usernameVal, score: scoreToSubmit, comment: messageVal }
            ]);

        if (error) {
            console.error('Supabase スコア保存エラー:', error);
            alert('スコアの保存に失敗しました。エラー: ' + error.message);
        } else {
            // console.log('Supabase スコア保存成功:', data);
        }
    }
    // ─── End of Supabase Submit Score Function ───

    function getJsonI18N() {
        const LANGUAGES = [
            { regex: /^zh\b/, lang: 'zh' },
            { regex: /^ja\b/, lang: 'ja' },
            { regex: /.*/, lang: 'en'}
        ];
        const lang = LANGUAGES.find(l => l.regex.test(navigator.language))?.lang || 'en'; // ?.でundefined対策、デフォルトen
        
        let i18nData = null;
        $.ajax({
            url: `./static/i18n/${lang}.json`,
            dataType: 'json',
            method: 'GET',
            async: false,
            success: data => i18nData = data,
            error: () => {
                // console.warn('言語ファイルの読み込みに失敗: ' + lang + '.json. 英語をデフォルトとします。');
                // alert('言語ファイルの読み込みに失敗: ' + lang + '.json. 英語をデフォルトとします。'); // ユーザーへのalertはUI/UX的に検討
                $.ajax({
                    url: `./static/i18n/en.json`, // フォールバック先
                    dataType: 'json',
                    method: 'GET',
                    async: false,
                    success: data => i18nData = data,
                    error: () => {
                        // console.error('英語の言語ファイルも読み込めませんでした。');
                        // alert('英語の言語ファイルも読み込めませんでした。');
                        i18nData = {}; // エラー時は空オブジェクトで以降の処理エラーを防ぐ
                    }
                });
            }
        });
        return i18nData;
    }

    const I18N = getJsonI18N();

    // DOMContentLoaded後の方が確実だが、元のコードは即時実行
    $(function() { // jQueryのDOMReadyを使用
        if (I18N) {
            $('[data-i18n]').each(function() {
                const key = this.dataset.i18n;
                if (I18N[key] !== undefined) $(this).text(I18N[key]);
            });
            $('[data-placeholder-i18n]').each(function() {
                const key = this.dataset.placeholderI18n;
                if (I18N[key] !== undefined) $(this).attr('placeholder', I18N[key]);
            });
            if (I18N['lang']) {
                $('html').attr('lang', I18N['lang']);
            }
        }
    });


    let isDesktop = !navigator['userAgent'].match(/(ipad|iphone|ipod|android|windows phone)/i);
    let fontunit = isDesktop ? 20 : ((window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth) / 320) * 10;
    // document.writeでのスタイル挿入は、可能であればCSSファイルに移行するか、<head>内の<style>タグに記述する方が望ましい
    document.write('<style type="text/css">' +
        'html,body {font-size:' + (fontunit < 30 ? fontunit : '30') + 'px;}' +
        (isDesktop ? '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position: absolute;}' :
            '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position:fixed;}@media screen and (orientation:landscape) {#landscape {display:none;}}') + /* landscapeの表示をnoneに */
        '</style>');

    let map = {'d': 1, 'f': 2, 'j': 3, 'k': 4};
    if (isDesktop) {
        // HTML側に <div id="gameBody"></div> を用意しておき、JSではそれを取得する方が望ましい
        if (!document.getElementById('gameBody')) { // 念のため存在チェック
            document.write('<div id="gameBody"></div>');
        }
        document.onkeydown = function (e) {
            let key = e.key.toLowerCase();
            if (Object.keys(map).includes(key)) { // モダンな .includes を使用
                click(map[key]);
            }
        }
    }

    let body, blockSize, GameLayer = [],
        GameLayerBG, touchArea = [],
        GameTimeLayer;
    let transform, transitionDuration, welcomeLayerClosed;

    let mode = getMode();
    let soundMode = getSoundMode();

    w.init = function() {
        // ゲームレイヤーの挿入 (重複挿入を防ぐ)
        if (!document.getElementById('GameLayerBG')) {
             document.body.insertAdjacentHTML('afterbegin', createGameLayer());
        }

        showWelcomeLayer(); // ウェルカム画面表示

        body = document.getElementById('gameBody') || document.body;
        body.style.height = window.innerHeight + 'px'; // bodyの高さを設定

        transform = typeof (body.style.webkitTransform) !== 'undefined' ? 'webkitTransform' : (typeof (body.style.msTransform) !==
        'undefined' ? 'msTransform' : 'transform');
        transitionDuration = transform.replace(/ransform/g, 'ransitionDuration');

        GameTimeLayer = document.getElementById('GameTimeLayer');
        GameLayerBG = document.getElementById('GameLayerBG');

        GameLayer = []; // GameLayer配列を初期化
        const gameLayer1 = document.getElementById('GameLayer1');
        const gameLayer2 = document.getElementById('GameLayer2');

        if (gameLayer1 && gameLayer2) {
            GameLayer.push(gameLayer1);
            GameLayer[0].children = GameLayer[0].querySelectorAll('div.block'); // .blockクラスを持つ要素のみ
            GameLayer.push(gameLayer2);
            GameLayer[1].children = GameLayer[1].querySelectorAll('div.block'); // .blockクラスを持つ要素のみ
        } else {
            console.error("GameLayer1 or GameLayer2 not found after createGameLayer().");
            return;
        }

        if (GameLayerBG) {
            if (GameLayerBG.ontouchstart === null) { // スマホ・タブレット判定
                GameLayerBG.ontouchstart = gameTapEvent;
            } else { // PCなど
                GameLayerBG.onmousedown = gameTapEvent;
            }
        } else {
            console.error("GameLayerBG not found in init().");
            return;
        }

        gameInit(); // サウンド登録、ゲームリスタート呼び出し
        initSetting(); // Cookieからの設定読み込み
        window.addEventListener('resize', refreshSize, false); // リサイズイベント
    }

    function getMode() {
        const gameModeCookie = cookie('gameMode');
        return gameModeCookie ? parseInt(gameModeCookie) : MODE_NORMAL;
    }

    function getSoundMode() {
        return cookie('soundMode') || 'on';
    }

    w.changeSoundMode = function() {
        soundMode = (soundMode === 'on' ? 'off' : 'on');
        if (I18N) $('#sound').text(I18N[soundMode === 'on' ? 'sound-on' : 'sound-off']);
        cookie('soundMode', soundMode, 100);
    }

    function modeToString(m) {
        if (!I18N) return "Mode";
        if (m === MODE_ENDLESS) return I18N['endless'] || "Endless";
        if (m === MODE_PRACTICE) return I18N['practice'] || "Practice";
        return I18N['normal'] || "Normal";
    }

    w.changeMode = function(m) {
        mode = m;
        cookie('gameMode', m, 100);
        $('#mode').text(modeToString(m));
    }

    w.readyBtn = function() {
        closeWelcomeLayer();
        updatePanel();
        // gameRestart(); // ゲーム開始は最初のタップで行うか、ここで開始するか検討
    }

    w.winOpen = function() { // 元のコードのまま
        window.open(location.href + '?r=' + Math.random(), 'nWin', 'height=500,width=320,toolbar=no,menubar=no,scrollbars=no');
        let opened = window.open('about:blank', '_self');
        if (opened) {
            opened.opener = null;
            opened.close();
        }
    }

    let refreshSizeTime;
    function refreshSize() {
        clearTimeout(refreshSizeTime);
        refreshSizeTime = setTimeout(_refreshSize, 200);
    }

    function _refreshSize() { // 元のロジックを尊重しつつ、要素存在チェックを追加
        if (!body) body = document.getElementById('gameBody') || document.body;
        if (!body || body.offsetWidth === 0) { /*console.warn("_refreshSize: body not ready.");*/ return; }

        countBlockSize();
        if (blockSize <= 0) { /*console.warn("_refreshSize: blockSize invalid.");*/ return; }

        if (GameLayer.length < 2 || !GameLayer[0] || !GameLayer[1] || !GameLayer[0].children || !GameLayer[1].children) {
            /*console.warn("_refreshSize: GameLayers not ready.");*/ return;
        }

        for (let i = 0; i < GameLayer.length; i++) {
            let box = GameLayer[i];
            for (let j = 0; j < box.children.length; j++) {
                let r = box.children[j], rstyle = r.style;
                rstyle.left = (j % 4) * blockSize + 'px';
                rstyle.bottom = Math.floor(j / 4) * blockSize + 'px';
                rstyle.width = blockSize + 'px';
                rstyle.height = blockSize + 'px';
            }
        }
        let f, a;
        if (GameLayer[0].y > GameLayer[1].y) {
            f = GameLayer[0]; a = GameLayer[1];
        } else {
            f = GameLayer[1]; a = GameLayer[0];
        }
        let y = ((_gameBBListIndex) % 10) * blockSize; // _gameBBListIndexはタップされた黒タイルの通し番号
        f.y = y;
        f.style[transform] = 'translate3D(0,' + f.y + 'px,0)';
        // aのy計算は、fの現在位置とaが持つべき相対位置から。f.children.lengthは1レイヤーのブロック数
        a.y = f.y - blockSize * Math.floor(f.children.length / 4) ;
        a.style[transform] = 'translate3D(0,' + a.y + 'px,0)';
    }

    function countBlockSize() { // 元のロジックを尊重
        if (!body) body = document.getElementById('gameBody') || document.body;
        if (!body || body.offsetWidth === 0) { /*console.warn("countBlockSize: body not ready or no width.");*/ return; }
        blockSize = body.offsetWidth / 4;
        body.style.height = window.innerHeight + 'px';
        if (GameLayerBG) GameLayerBG.style.height = window.innerHeight + 'px';
        touchArea[0] = window.innerHeight; // タップ有効エリアの上限（画面下端）
        touchArea[1] = window.innerHeight - blockSize * 3; // タップ有効エリアの下限（下から3ブロック分の上端）
    }

    let _gameBBList = [], // {cell: 0-3, id: "GameLayerX-Y"} のリスト
        _gameBBListIndex = 0, // 次にタップすべき_gameBBListのインデックス
        _gameOver = false,
        _gameStart = false,
        _gameSettingNum = 20, // ノーマルモードのデフォルトゲーム時間(秒)
        _gameTime, // setIntervalのID
        _gameTimeNum, // 残り時間(秒)
        _gameScore, // 現在のスコア
        _date1, // ゲーム開始時刻(Dateオブジェクト)、またはノーマルモードの時間超過判定用
        deviationTime; // ノーマルモードの時間超過量(ms)

    let _gameStartTime, // ゲーム開始からの経過秒数(timerでインクリメント)
        _gameStartDatetime; // ゲーム開始のタイムスタンプ(Date.getTime())

    function gameInit() { // 元のロジックを尊重
        if (typeof createjs !== 'undefined' && createjs.Sound) {
            createjs.Sound.registerSound({ src: "./static/music/err.mp3", id: "err" });
            createjs.Sound.registerSound({ src: "./static/music/end.mp3", id: "end" });
            createjs.Sound.registerSound({ src: "./static/music/tap.mp3", id: "tap" });
        }
        gameRestart();
    }

    function gameRestart() { // 元のロジックを尊重
        _gameBBList = [];
        _gameBBListIndex = 0;
        _gameScore = 0;
        _gameOver = false;
        _gameStart = false;
        _gameSettingNum = parseInt(cookie('gameTime')) || 20; // 設定時間取得
        _gameTimeNum = _gameSettingNum;
        _gameStartTime = 0;
        _date1 = null; // リセット
        deviationTime = 0; //リセット

        if (GameLayer.length < 2 || !GameLayer[0] || !GameLayer[1]) { // GameLayerの存在確認
            // console.error("Game layers not properly initialized for gameRestart.");
            // init()を再呼び出しするのではなく、init()が正しく完了するように修正するべき
            return;
        }
        
        countBlockSize();
        if (blockSize > 0 && GameLayer[0].children && GameLayer[1].children) {
            refreshGameLayer(GameLayer[0]); // 第1レイヤーを初期化
            refreshGameLayer(GameLayer[1], 1); // 第2レイヤーをループ用に初期化
        } else {
            // console.warn("Cannot refresh layers: blockSize or GameLayers invalid in gameRestart.");
        }
        updatePanel();
    }

    function gameStart() { // 元のロジックを尊重
        _date1 = new Date(); // deviationTime 計算用
        _gameStartDatetime = _date1.getTime(); // CPS計算用
        _gameStart = true;
        _gameStartTime = 0; // リセット
        if(_gameTime) clearInterval(_gameTime); // 既存タイマー解除
        _gameTime = setInterval(timer, 1000);
    }

    function getCPS() { // 元のロジックを尊重
        const elapsedTime = (new Date().getTime() - _gameStartDatetime) / 1000;
        if (elapsedTime <= 0 || _gameScore === 0) return 0;
        let cps = _gameScore / elapsedTime;
        // _gameStartTime はタイマーで1秒ごとに増えるので、2秒以上経過しているかの目安になる
        return isNaN(cps) || !isFinite(cps) || _gameStartTime < 1 ? 0 : cps;
    }

    function timer() { // 元のロジックを尊重
        _gameTimeNum--;
        _gameStartTime++;
        if (mode === MODE_NORMAL && _gameTimeNum <= 0) {
            if (GameTimeLayer && I18N) GameTimeLayer.innerHTML = (I18N['time-up'] || 'Time Up!') + '!';
            gameOver();
            if (GameLayerBG) GameLayerBG.classList.add('flash');
            if (soundMode === 'on' && createjs && createjs.Sound) createjs.Sound.play("end");
        }
        updatePanel();
    }

    function updatePanel() { // 元のロジックを尊重
        if (!GameTimeLayer) GameTimeLayer = document.getElementById('GameTimeLayer');
        if (!GameTimeLayer || !I18N) return;

        if (mode === MODE_NORMAL) {
            if (!_gameOver) {
                GameTimeLayer.innerHTML = createTimeText(_gameTimeNum);
            }
        } else if (mode === MODE_ENDLESS) {
            let cps = getCPS();
            let text = (cps === 0 && _gameScore === 0 ? (I18N['calculating'] || 'Calculating...') : cps.toFixed(2));
            GameTimeLayer.innerHTML = `CPS:${text}`;
        } else { // MODE_PRACTICE
            GameTimeLayer.innerHTML = `SCORE:${_gameScore}`;
        }
    }

    function focusOnReplay(){ // 元の関数名 foucusOnReplay から修正
        const replayBtnEl = document.getElementById('replay');
        if (replayBtnEl) replayBtnEl.focus();
    }

    function gameOver() { // 元のロジックを尊重
        _gameOver = true;
        if(_gameTime) clearInterval(_gameTime);
        let cps = getCPS();
        updatePanel(); // 最終スコア表示
        setTimeout(function () {
            if (GameLayerBG) GameLayerBG.classList.remove('flash');
            showGameScoreLayer(cps);
            focusOnReplay(); // 修正後の関数名
        }, 1500);
    }

    function createTimeText(n) { // 元のロジックを尊重
        return 'TIME:' + Math.max(0, Math.ceil(n));
    }

    let _ttreg = / t{1,2}(\d+)/,
        _clearttClsReg = / t{1,2}\d+| bad/;

    function refreshGameLayer(box, loop, offset) { // 元のロジックを尊重
        if (!box || !box.children || blockSize <= 0) { /*console.warn("refreshGameLayer: invalid args"); */ return;}
        let i = Math.floor(Math.random() * 1000) % 4 + (loop ? 0 : 4);
        for (let j = 0; j < box.children.length; j++) {
            let r = box.children[j], rstyle = r.style;
            rstyle.left = (j % 4) * blockSize + 'px';
            rstyle.bottom = Math.floor(j / 4) * blockSize + 'px';
            rstyle.width = blockSize + 'px';
            rstyle.height = blockSize + 'px';
            r.className = r.className.replace(_clearttClsReg, '');
            r.notEmpty = false;
            if (i === j) {
                _gameBBList.push({ cell: i % 4, id: r.id });
                r.className += ' t' + (Math.floor(Math.random() * 5) + 1); // 1-5の乱数
                r.notEmpty = true;
                // 次の黒タイルは次の行のランダムな列に
                i = (Math.floor(j / 4) + 1) * 4 + Math.floor(Math.random() * 4);
            }
        }
        if (loop) {
            box.style[transitionDuration] = '0ms';
            box.style.display = 'none'; // 一旦非表示にして再配置
            box.y = -blockSize * (Math.floor(box.children.length / 4) + (offset || 0)); // loop引数は1のはずなので乗算不要か？元のまま
            box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
            // 表示を戻すタイミングを調整、元のコードはsetTimeoutを2段重ね
            setTimeout(function () { box.style.display = 'block'; }, 50); // 少し遅延させて表示
        } else {
            box.y = 0;
            box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
        }
        box.style[transitionDuration] = '150ms'; // 通常の移動アニメーション時間
    }

    function gameLayerMoveNextRow() { // 元のロジックを尊重
        for (let i = 0; i < GameLayer.length; i++) {
            let g = GameLayer[i];
            if (!g || !g.children) continue;
            g.y += blockSize;
            // レイヤーが完全に画面外に出たら（一番下の行のbottomがblockSize * 行数を超えたら）リフレッシュ
            if (g.y > blockSize * (Math.floor(g.children.length / 4))) {
                refreshGameLayer(g, 1, -1); // offset -1 は、既にyが画面外を指しているので、1画面分戻す意味
            } else {
                g.style[transform] = 'translate3D(0,' + g.y + 'px,0)';
            }
        }
    }

    function gameTapEvent(e) { // 元の当たり判定ロジックを極力維持
        if (_gameOver) return false;

        let tar = e.target;
        let eventY = e.clientY || (e.targetTouches && e.targetTouches[0] ? e.targetTouches[0].clientY : 0);
        let eventX = (e.clientX || (e.targetTouches && e.targetTouches[0] ? e.targetTouches[0].clientX : 0)) - (body ? body.offsetLeft : 0);

        if (_gameBBList.length === 0 || _gameBBListIndex >= _gameBBList.length) return false;
        let p = _gameBBList[_gameBBListIndex]; // 次にタップすべき黒ブロックの情報 {cell, id}

        // タッチエリア判定 (blockSizeに依存するので、未設定なら再計算試行)
        if ((touchArea[1] === undefined || blockSize <= 0) && body && body.offsetWidth > 0) countBlockSize();
        if (touchArea[1] !== undefined && (eventY > touchArea[0] || eventY < touchArea[1])) {
            return false; // タッチエリア外
        }

        // 成功タップの判定
        // 1. targetが直接p.idの要素で、かつそれがnotEmpty (黒タイル)
        // 2. または、targetがp.idではないが、タップ座標xがp.cell (黒タイルがあるべき列) の範囲内
        //    この2番目の条件は、黒タイル以外の場所をタップしても、それが正しい列ならOKという意味？
        //    元のコードの `(p.cell === 0 && x < blockSize)` などは列の範囲を示している。
        //    しかし、tar.notEmptyのチェックがないので、白いタイルを正しい列でタップした場合もこのifブロックに入る可能性がある。
        //    より厳密には、実際にタップされたDOM要素 `tar` が `p.id` と一致し、かつ `tar.notEmpty` であることを確認するのが良い。
        //    元のコードの意図を尊重し、列タップも許容するが、その場合対象は `document.getElementById(p.id)` にする。

        let tappedCorrectBlackTile = false;
        let tappedWhiteTileInCorrectColumn = false; // 本来はエラーだが元のロジックに合わせる
        
        const correctBlackTileElement = document.getElementById(p.id);

        if (correctBlackTileElement && correctBlackTileElement.notEmpty) {
            if (tar && tar.id === p.id) { // Directly tapped the correct black tile
                tappedCorrectBlackTile = true;
            } else { // Tapped elsewhere, check if it's in the correct column
                const col = Math.floor(eventX / blockSize);
                if (p.cell === col) {
                    // この場合、tarは GameLayerBG か、白いタイルである可能性が高い。
                    // 元のコードではこの条件でも成功として扱っていたため、黒タイルをタップしたことにする。
                    tappedCorrectBlackTile = true; 
                }
            }
        }


        if (tappedCorrectBlackTile) {
            if (!_gameStart) gameStart();
            if (soundMode === 'on' && createjs && createjs.Sound) createjs.Sound.play("tap");

            correctBlackTileElement.className = correctBlackTileElement.className.replace(_ttreg, ' tt$1');
            correctBlackTileElement.notEmpty = false; // Mark as tapped

            _gameBBListIndex++; // 次のターゲットへ
            _gameScore++;

            updatePanel();
            gameLayerMoveNextRow();
        } else if (_gameStart && tar && tar.classList && tar.classList.contains('block') && !tar.notEmpty) {
            // 明確に白いタイル (notEmpty=falseのblock) をタップした場合
            if (soundMode === 'on' && createjs && createjs.Sound) createjs.Sound.play("err");
            tar.classList.add('bad');
            if (mode === MODE_PRACTICE) {
                setTimeout(() => { tar.classList.remove('bad'); }, 500);
            } else {
                gameOver();
            }
        }
        // それ以外のタップ（例えば、まだ出現していない先の黒タイルや、完全にエリア外など）は無視されるか、
        // _gameStart後のエリア内タップであれば、上の条件で処理される。
        return false;
    }


    function createGameLayer() { // 元のコードのまま
        let html = '<div id="GameLayerBG">';
        for (let i = 1; i <= 2; i++) {
            let id = 'GameLayer' + i;
            html += '<div id="' + id + '" class="GameLayer">';
            for (let j = 0; j < 10; j++) {
                for (let k = 0; k < 4; k++) {
                    html += '<div id="' + id + '-' + (k + j * 4) + '" num="' + (k + j * 4) + '" class="block' + (k ? ' bl' : '') +
                        '"></div>';
                }
            }
            html += '</div>';
        }
        html += '</div>';
        html += '<div id="GameTimeLayer" class="text-center"></div>';
        return html;
    }

    function closeWelcomeLayer() { // 元のコードのまま
        welcomeLayerClosed = true;
        $('#welcome').css('display', 'none');
        updatePanel();
    }

    function showWelcomeLayer() { // 元のコードのまま
        welcomeLayerClosed = false;
        $('#mode').text(modeToString(mode));
        $('#welcome').css('display', 'block');
    }

    function getBestScore(currentScore) { // 元のコードのまま (bast-scoreをbest-scoreに修正)
        let cookieName = (mode === MODE_NORMAL ? 'best-score' : 'endless-best-score');
        let best = parseFloat(cookie(cookieName)) || 0;
        if (currentScore > best) {
            best = currentScore;
            cookie(cookieName, best.toFixed(mode === MODE_ENDLESS ? 2 : 0), 100);
        }
        return best;
    }

    function scoreToString(s) { // 元のコードのまま
        return mode === MODE_ENDLESS ? parseFloat(s).toFixed(2) : String(Math.floor(s));
    }

    function legalDeviationTime() { // 元のコードのまま
        return _date1 ? deviationTime < (_gameSettingNum + 3) * 1000 : true;
    }

    function showGameScoreLayer(cps) { // 元のコードのロジックを尊重
        const gameScoreLayer = $('#GameScoreLayer');
        if (_gameBBList.length > 0 && _gameBBListIndex > 0 && _gameBBList[_gameBBListIndex - 1]) {
            const lastTappedBlockId = _gameBBList[_gameBBListIndex - 1].id;
            const lastBlock = $(`#${lastTappedBlockId}`); // jQueryオブジェクト
            if(lastBlock.length > 0) { // 要素が存在するか確認
                const classAttr = lastBlock.attr('class');
                if (classAttr) { // class属性が存在するか確認
                    const cMatch = classAttr.match(_ttreg); // _ttreg は / t{1,2}(\d+)/
                    if (cMatch && cMatch[1]) {
                        // 'BBOX SHADE' は常に付ける
                        gameScoreLayer.attr('class', 'BBOX SHADE bgc' + cMatch[1]);
                    } else {
                         gameScoreLayer.attr('class', 'BBOX SHADE bgc1'); // マッチしない場合はデフォルト
                    }
                } else {
                     gameScoreLayer.attr('class', 'BBOX SHADE bgc1'); // class属性がない場合
                }
            } else {
                 gameScoreLayer.attr('class', 'BBOX SHADE bgc1'); // 要素が見つからない場合
            }
        } else {
             gameScoreLayer.attr('class', 'BBOX SHADE bgc1'); // リストが空などの場合
        }
        
        $('#GameScoreLayer-text').html(shareText(cps)); // ここで Supabase 送信が呼ばれる

        let scoreVal = (mode === MODE_ENDLESS ? cps : _gameScore);
        let best = getBestScore(scoreVal);
        
        let normalCond = mode !== MODE_NORMAL || legalDeviationTime();
        gameScoreLayer.css('color', normalCond ? '' : 'red'); // 文字色変更

        $('#cps').text(cps.toFixed(2));
        $('#score').text(scoreToString(_gameScore));
        $('#GameScoreLayer-score').css('display', mode === MODE_ENDLESS ? 'none' : 'flex'); // flexで表示
        $('#best').text(scoreToString(best));

        gameScoreLayer.css('display', 'block');
    }

    function hideGameScoreLayer() { // 元のコードのまま
        $('#GameScoreLayer').css('display', 'none');
    }

    w.replayBtn = function() { // 元のコードのまま
        gameRestart();
        hideGameScoreLayer();
    }

    w.backBtn = function() { // 元のコードのまま
        gameRestart();
        hideGameScoreLayer();
        showWelcomeLayer();
    }

    function shareText(cps) { // 元のコードのロジック + Supabase送信呼び出し
        if (mode === MODE_NORMAL) {
            let date2 = new Date();
            if (!_date1) _date1 = date2; // _date1 が未設定の場合のフォールバック
            deviationTime = (date2.getTime() - _date1.getTime());
            if (!legalDeviationTime()) {
                return (I18N ? I18N['time-over'] : 'Time over by: ') + ((deviationTime / 1000) - _gameSettingNum).toFixed(2) + 's';
            }
            SubmitResultsToSupabase(); // ★★★ Supabaseへの送信関数を呼び出す ★★★
        }

        if (!I18N) return "Score: " + cps.toFixed(2); // I18Nフォールバック
        if (cps <= 5) return I18N['text-level-1'] || 'Level 1';
        if (cps <= 8) return I18N['text-level-2'] || 'Level 2';
        if (cps <= 10) return I18N['text-level-3'] || 'Level 3';
        if (cps <= 15) return I18N['text-level-4'] || 'Level 4';
        return I18N['text-level-5'] || 'Level 5';
    }

    function toStr(obj) { // 元のコードのまま
        if (typeof obj === 'object') {
            try { return JSON.stringify(obj); } catch(e) { return String(obj); }
        } else {
            return String(obj);
        }
    }

    function cookie(name, value, timeInDays) { // eval を避ける修正版
        if (name) {
            if (value !== undefined) {
                let expires = "";
                if (timeInDays) {
                    let date = new Date();
                    date.setTime(date.getTime() + (timeInDays * 24 * 60 * 60 * 1000));
                    expires = "; expires=" + date.toUTCString();
                }
                document.cookie = name + "=" + (escape(toStr(value)) || "") + expires + "; path=/";
                return true;
            } else {
                let nameEQ = name + "=";
                let ca = document.cookie.split(';');
                for (let i = 0; i < ca.length; i++) {
                    let c = ca[i];
                    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                    if (c.indexOf(nameEQ) === 0) {
                        let valStr = unescape(c.substring(nameEQ.length, c.length));
                        try { // JSONや数値のパースを試みる
                            if ((valStr.startsWith('{') && valStr.endsWith('}')) || (valStr.startsWith('[') && valStr.endsWith(']'))) {
                                return JSON.parse(valStr);
                            }
                            if (!isNaN(parseFloat(valStr)) && isFinite(valStr)) {
                                return parseFloat(valStr);
                            }
                        } catch (e) { /* パース失敗時は文字列として返す */ }
                        return valStr;
                    }
                }
                return null; // 見つからない場合は null
            }
        }
        // 引数なしの場合は全Cookieをオブジェクトで返す (元の動作)
        let data = {};
        let ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
             let pair = ca[i].split('=');
             if(pair.length === 2) data[pair[0].trim()] = unescape(pair[1]);
        }
        return data;
    }

    function initSetting() { // 元のコードのまま
        $("#username").val(cookie("username") || "");
        $("#message").val(cookie("message") || "");
        const titleCookie = cookie("title");
        if (titleCookie) {
            $('title').text(titleCookie);
            $('#title').val(titleCookie);
        }
        const keyboardCookie = cookie("keyboard");
        if (keyboardCookie) {
            const keyboardStr = String(keyboardCookie).toLowerCase();
            $("#keyboard").val(keyboardStr);
            if (keyboardStr.length === 4) { // キー設定は4文字前提
                map = {};
                map[keyboardStr.charAt(0)] = 1;
                map[keyboardStr.charAt(1)] = 2;
                map[keyboardStr.charAt(2)] = 3;
                map[keyboardStr.charAt(3)] = 4;
            }
        }
        const gameTimeCookie = cookie('gameTime');
        if (gameTimeCookie) {
            const parsedTime = parseInt(gameTimeCookie);
            if (!isNaN(parsedTime) && parsedTime > 0) {
                $('#gameTime').val(parsedTime);
                _gameSettingNum = parsedTime; // グローバル変数も更新
            }
        }
    }

    w.show_btn = function() { // 元のコードのまま
        $('#btn_group').css('display', 'flex'); // HTMLの d-grid に合わせるなら 'grid'
        $('#desc').css('display', 'block');
        $('#setting').css('display', 'none');
    }

    w.show_setting = function() { // 元のコードのまま
        $('#btn_group').css('display', 'none');
        $('#desc').css('display', 'none');
        $('#setting').css('display', 'block'); // HTMLの #setting の display に合わせる
        if (I18N) $('#sound').text(soundMode === 'on' ? (I18N['sound-on'] || 'Sound ON') : (I18N['sound-off'] || 'Sound OFF'));
    }

    w.save_cookie = function() { // 元のコードのまま
        const settings = ['username', 'message', 'keyboard', 'title', 'gameTime'];
        for (let s of settings) {
            let value = $(`#${s}`).val();
            if (value !== null && value !== undefined) {
                cookie(s, String(value).trim(), 100); // 保存時もtrim
            }
        }
        const gameTimeVal = $('#gameTime').val(); // gameTimeを再取得
        if (gameTimeVal) {
            const newGameTime = parseInt(gameTimeVal);
            if(!isNaN(newGameTime) && newGameTime > 0) _gameSettingNum = newGameTime;
        }
        initSetting(); // 設定を再適用
    }

    // isnull はSupabase版では直接使っていないが、元のコードに残っていたのでそのまま
    function isnull(val) {
        if (val === null || val === undefined) return true;
        let str = String(val).replace(/(^\s*)|(\s*$)/g, '');
        return str === '';
    }

    function click(index) { // 元のキーボード入力処理を尊重
        if (!welcomeLayerClosed || _gameOver) return;
        if (_gameBBList.length === 0 || _gameBBListIndex >= _gameBBList.length) return;

        let p = _gameBBList[_gameBBListIndex];
        const currentBlockElement = document.getElementById(p.id);
        if (!currentBlockElement) return;

        const parentLayer = currentBlockElement.parentElement;
        if (!parentLayer) return;

        const currentBlockNumAttr = currentBlockElement.getAttribute("num");
        if (currentBlockNumAttr === null) return; // num属性がない場合は処理中断
        const currentBlockNum = parseInt(currentBlockNumAttr);


        const rowStartNum = currentBlockNum - p.cell;
        const targetColIndex = index - 1; // 0-indexed column
        const targetNumGlobal = rowStartNum + targetColIndex;
        
        let targetBlockElement = null;
        // Find target block by iterating through children, matching 'num' attribute
        for (let i = 0; i < parentLayer.children.length; i++) {
            const child = parentLayer.children[i];
            if (child.getAttribute("num") === String(targetNumGlobal)) {
                targetBlockElement = child;
                break;
            }
        }

        if (!targetBlockElement) {
            // console.warn("Keyboard click: Target element not found for num:", targetNumGlobal);
            return;
        }
        
        let fakeEvent = {
            target: targetBlockElement,
            clientX: (targetColIndex + 0.5) * blockSize + (body ? body.offsetLeft : 0),
            clientY: (touchArea[0] + touchArea[1]) / 2 // Mid-point of active touch area
        };
        gameTapEvent(fakeEvent);
    }

    // jQueryで<style>タグを<head>に追加
    const clickBeforeStyle = $('<style id="clickBeforeStyleInjectedJS"></style>').appendTo('head');
    const clickAfterStyle = $('<style id="clickAfterStyleInjectedJS"></style>').appendTo('head');

    function saveImage(dom, callback) { // 元のコードのまま
        if (dom.files && dom.files[0]) {
            let reader = new FileReader();
            reader.onload = function() { callback(this.result); }
            reader.readAsDataURL(dom.files[0]);
        }
    }

    w.getClickBeforeImage = function() { // 元のコードのまま
        $('#click-before-image').trigger('click');
    }

    w.saveClickBeforeImage = function() { // 元のコードのまま + !important
        const img = document.getElementById('click-before-image');
        saveImage(img, r => {
            clickBeforeStyle.html(`
                .t1, .t2, .t3, .t4, .t5 {
                   background-size: contain !important;
                   background-image: url(${r}) !important;
                   background-repeat: no-repeat !important;
                   background-position: center !important;
            }`);
        })
    }

    w.getClickAfterImage = function() { // 元のコードのまま
        $('#click-after-image').trigger('click');
    }

    w.saveClickAfterImage = function() { // 元のコードのまま + !important
        const img = document.getElementById('click-after-image');
        saveImage(img, r => {
            clickAfterStyle.html(`
                .tt1, .tt2, .tt3, .tt4, .tt5 {
                  background-size: contain !important;
                  background-image: url(${r}) !important;
                  background-repeat: no-repeat !important;
                  background-position: center !important;
            }`);
        })
    }
})(window);
