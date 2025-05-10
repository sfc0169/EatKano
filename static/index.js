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

    // ─── Supabase Submit Score Function (Replaces old SubmitResults and encrypt) ───
    async function SubmitResultsToSupabase() {
        const usernameVal = ($("#username").val() || '').trim();
        const messageVal = ($("#message").val() || '').trim();

        if (!usernameVal && mode === MODE_NORMAL) { // ノーマルモードでのみユーザー名チェックを厳格にする（練習やエンドレスでは任意）
            // console.warn("Username not entered in settings. Score will not be submitted to Supabase for Normal mode.");
            // ユーザーに通知する場合はここでアラートなどを表示
            // alert("ランキング登録のため、設定画面でユーザー名を入力してください。");
            return;
        }

        const scoreToSubmit = _gameScore;

        const { data, error } = await supaClient
            .from('leaderboard')
            .insert([
                { name: usernameVal || "Anonymous", score: scoreToSubmit, comment: messageVal }
            ]);

        if (error) {
            console.error('Supabase score submission error:', error);
            // alert('スコアの保存に失敗しました。エラー: ' + error.message); // ユーザーにエラーを通知する場合
        } else {
            // console.log('Supabase score submission successful:', data);
            // alert('スコアがランキングに保存されました！'); // ユーザーに成功を通知する場合
        }
    }
    // ─── End of Supabase Submit Score Function ───

    function getJsonI18N() {
        const LANGUAGES = [
            { regex: /^zh\b/, lang: 'zh' },
            { regex: /^ja\b/, lang: 'ja' },
            { regex: /.*/, lang: 'en'}
        ];
        const lang = LANGUAGES.find(l => l.regex.test(navigator.language))?.lang || 'en';
        
        let i18nData = null;
        $.ajax({
            url: `./static/i18n/${lang}.json`,
            dataType: 'json',
            method: 'GET',
            async: false,
            success: data => i18nData = data,
            error: () => {
                console.warn('Language file not found: ' + lang + '.json. Falling back to English.');
                $.ajax({
                    url: `./static/i18n/en.json`,
                    dataType: 'json',
                    method: 'GET',
                    async: false,
                    success: data => i18nData = data,
                    error: () => {
                        console.error('English language file also not found. UI texts might be missing.');
                        i18nData = {}; 
                    }
                });
            }
        });
        return i18nData;
    }

    const I18N = getJsonI18N();

    $(function() { // DOM Ready
        if (I18N) {
            $('[data-i18n]').each(function() {
                const key = this.dataset.i18n;
                if (I18N[key] !== undefined) $(this).text(I18N[key]);
            });
            $('[data-placeholder-i18n]').each(function() {
                const key = this.dataset.placeholderI18n;
                if (I18N[key] !== undefined) $(this).attr('placeholder', I18N[key]);
            });
            if (I18N['lang']) $('html').attr('lang', I18N['lang']);
        }
    });

    let isDesktop = !navigator['userAgent'].match(/(ipad|iphone|ipod|android|windows phone)/i);
    let fontunit = isDesktop ? 20 : ((window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth) / 320) * 10;
    
    // --- CSSの動的書き込み部分を修正 ---
    document.write('<style type="text/css">' +
        // グローバルリセット (htmlとbody両方)
        'html, body { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }' +
        // bodyの基本スタイル
        'body { font-size:' + (fontunit < 30 ? fontunit : '30') + 'px; overflow: hidden; position:relative; width:100%; height:100vh; /* 100vhでビューポート高さに */ }' +
        // gameBody (デスクトップ時) のスタイル
        (isDesktop ? '#gameBody { position: relative; width: 100%; height: 100%; margin: 0 auto; overflow: hidden; }' : '') +
        // ゲームの主要レイヤーのスタイル
        (isDesktop ? 
            '#welcome, #GameTimeLayer, #GameLayerBG, #GameScoreLayer.SHADE { position: absolute; left: 0; top: 0; width: 100%; }' : /* gameBody基準で全幅・全高に影響 */
            '#welcome, #GameTimeLayer, #GameLayerBG, #GameScoreLayer.SHADE { position: fixed; left: 0; top: 0; width: 100%; height:100%; }@media screen and (orientation:landscape) {#landscape {display:none;}}') + /* viewport基準で全幅・全高 */
        '#GameTimeLayer { z-index: 3; }' +
        '#GameLayerBG { z-index: 1; }' +
        '#welcome, #GameScoreLayer.SHADE { z-index: 10; }' +
    '</style>');


    let map = {'d': 1, 'f': 2, 'j': 3, 'k': 4};
    if (isDesktop) {
        if (!document.getElementById('gameBody')) {
             document.write('<div id="gameBody"></div>');
        }
        document.onkeydown = function (e) {
            let key = e.key.toLowerCase();
            if (map.hasOwnProperty(key)) {
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
        if (!document.getElementById('GameLayerBG')) { // ゲームレイヤーHTMLがなければ挿入
            document.body.insertAdjacentHTML('beforeend', createGameLayer()); // bodyの最後に挿入
        }

        showWelcomeLayer();
        body = document.getElementById('gameBody') || document.body;
        // bodyの高さ設定はCSSで行うか、JSで行う場合は window.innerHeight を使う
        // document.body.style.height = window.innerHeight + 'px'; // body全体の高さを設定
        // if (isDesktop && document.getElementById('gameBody')) {
        //     document.getElementById('gameBody').style.height = window.innerHeight + 'px';
        // }
        // 上記のCSS書き込みで body { height:100vh; } としているので、JSでの再設定は必須ではない

        transform = typeof (body.style.webkitTransform) !== 'undefined' ? 'webkitTransform' : (typeof (body.style.msTransform) !==
        'undefined' ? 'msTransform' : 'transform');
        transitionDuration = transform.replace(/ransform/g, 'ransitionDuration');

        GameTimeLayer = document.getElementById('GameTimeLayer');
        GameLayerBG = document.getElementById('GameLayerBG');

        GameLayer = [];
        const gameLayer1 = document.getElementById('GameLayer1');
        const gameLayer2 = document.getElementById('GameLayer2');

        if (gameLayer1 && gameLayer2) {
            GameLayer.push(gameLayer1);
            GameLayer[0].children = gameLayer1.querySelectorAll('div.block');
            GameLayer.push(gameLayer2);
            GameLayer[1].children = gameLayer2.querySelectorAll('div.block');
        } else {
            console.error("GameLayer1 or GameLayer2 not found in init.");
            return;
        }

        if (GameLayerBG) {
            // GameLayerBG の高さもここで設定 (動的に変わる場合)
            // GameLayerBG.style.height = window.innerHeight + 'px'; // CSSで height:100% になっているので、これで足りるはず
            if (GameLayerBG.ontouchstart === null) { // Mobile
                GameLayerBG.ontouchstart = gameTapEvent;
            } else { // Desktop
                GameLayerBG.onmousedown = gameTapEvent;
            }
        } else {
            console.error("GameLayerBG not found in init.");
            return;
        }

        gameInit();
        initSetting();
        window.addEventListener('resize', refreshSize, false);
        refreshSize(); // 初期表示のため一度呼び出す
    }

    function getMode() {
        const modeCookie = cookie('gameMode');
        return modeCookie ? parseInt(modeCookie) : MODE_NORMAL;
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
        if(!I18N) return "Mode"; // Fallback
        return m === MODE_NORMAL ? (I18N['normal'] || 'Normal') : 
               (m === MODE_ENDLESS ? (I18N['endless'] || 'Endless') : (I18N['practice'] || 'Practice'));
    }

    w.changeMode = function(m) {
        mode = m;
        cookie('gameMode', m, 100);
        $('#mode').text(modeToString(m));
    }

    w.readyBtn = function() {
        closeWelcomeLayer();
        updatePanel();
    }

    w.winOpen = function() {
        window.open(location.href + '?r=' + Math.random(), 'nWin', 'height=500,width=320,toolbar=no,menubar=no,scrollbars=no');
        let opened = window.open('about:blank', '_self');
        if(opened) { opened.opener = null; opened.close(); }
    }

    let refreshSizeTime;
    function refreshSize() { clearTimeout(refreshSizeTime); refreshSizeTime = setTimeout(_refreshSize, 50); } // 遅延を短縮

    function _refreshSize() {
        // body要素の再取得と高さ設定
        body = document.getElementById('gameBody') || document.body;
        document.body.style.height = window.innerHeight + 'px';
        if (isDesktop && document.getElementById('gameBody')) {
             document.getElementById('gameBody').style.height = window.innerHeight + 'px';
        }

        if (!body || body.offsetWidth === 0) return;
        countBlockSize();
        if (blockSize <= 0) return;
        if (GameLayer.length < 2 || !GameLayer[0]?.children || !GameLayer[1]?.children) return;

        for (let i = 0; i < GameLayer.length; i++) {
            let box = GameLayer[i];
            for (let j = 0; j < box.children.length; j++) {
                let r = box.children[j], rstyle = r.style;
                rstyle.left = (j % 4) * blockSize + 'px';
                rstyle.bottom = Math.floor(j / 4) * blockSize + 'px';
                rstyle.width = blockSize + 'px'; rstyle.height = blockSize + 'px';
            }
        }
        let f, a;
        // yプロパティの存在チェック
        GameLayer[0].y = GameLayer[0].y || 0;
        GameLayer[1].y = GameLayer[1].y || 0;

        if (GameLayer[0].y > GameLayer[1].y) { f = GameLayer[0]; a = GameLayer[1]; }
        else { f = GameLayer[1]; a = GameLayer[0]; }
        
        let y = ((_gameBBListIndex) % 10) * blockSize; // 10は1画面あたりの行数（refreshGameLayerのj < 10から）
        f.y = y; f.style[transform] = 'translate3D(0,' + f.y + 'px,0)';
        
        // a.y の計算を修正。f の底辺に a の上辺が接するようにする
        // f の children.length は通常40 (10行x4列)。Math.floor(f.children.length / 4) は行数。
        a.y = f.y - blockSize * Math.floor(f.children.length / 4); 
        a.style[transform] = 'translate3D(0,' + a.y + 'px,0)';
    }

    function countBlockSize() {
        body = document.getElementById('gameBody') || document.body; // bodyを再取得
        if (!body || body.offsetWidth === 0) return;
        blockSize = body.offsetWidth / 4;
        // body.style.height = window.innerHeight + 'px'; // _refreshSizeでも設定
        if (GameLayerBG) GameLayerBG.style.height = window.innerHeight + 'px';
        touchArea[0] = window.innerHeight; // 画面上端
        touchArea[1] = window.innerHeight - blockSize * 3; // クリック有効領域の下限（下から3行分）
    }

    let _gameBBList = [], _gameBBListIndex = 0, _gameOver = false, _gameStart = false,
        _gameSettingNum=20, _gameTime, _gameTimeNum, _gameScore, _date1, deviationTime;
    let _gameStartTime, _gameStartDatetime;

    function gameInit() {
        if (typeof createjs !== 'undefined' && createjs.Sound && !createjs.Sound.initializeDefaultPlugins()) {
            // console.warn("Could not initialize SoundJS plugins."); // Optional: Log if plugins fail
        }
        if (typeof createjs !== 'undefined' && createjs.Sound) {
            // Avoid re-registering if already done
            if (!createjs.Sound.exists("err")) createjs.Sound.registerSound({ src: "./static/music/err.mp3", id: "err" });
            if (!createjs.Sound.exists("end")) createjs.Sound.registerSound({ src: "./static/music/end.mp3", id: "end" });
            if (!createjs.Sound.exists("tap")) createjs.Sound.registerSound({ src: "./static/music/tap.mp3", id: "tap" });
        }
        gameRestart();
    }

    function gameRestart() {
        _gameBBList = []; _gameBBListIndex = 0; _gameScore = 0; _gameOver = false; _gameStart = false;
        _gameSettingNum = parseInt(cookie('gameTime')) || 20;
        _gameTimeNum = _gameSettingNum; _gameStartTime = 0; _date1 = null; deviationTime = 0;
        
        if (GameLayer.length < 2 || !GameLayer[0]?.children || !GameLayer[1]?.children) { 
             console.error("GameLayers not properly initialized for restart."); return; 
        }
        countBlockSize(); // blockSizeを計算
        if (blockSize > 0) { // blockSizeが計算できた場合のみレイヤーを更新
            refreshGameLayer(GameLayer[0]); 
            refreshGameLayer(GameLayer[1], 1);
        } else {
            console.warn("BlockSize is 0 or undefined in gameRestart. Layer refresh skipped.");
        }
        updatePanel();
    }

    function gameStart() {
        _date1 = new Date(); _gameStartDatetime = _date1.getTime(); _gameStart = true; _gameStartTime = 0;
        if(_gameTime) clearInterval(_gameTime); // Clear existing timer
        _gameTime = setInterval(timer, 1000);
    }

    function getCPS() {
        if (!_gameStartDatetime || _gameScore === 0) return 0;
        const elapsedTime = (new Date().getTime() - _gameStartDatetime) / 1000;
        if (elapsedTime <= 0) return 0;
        let cps = _gameScore / elapsedTime;
        return isNaN(cps) || !isFinite(cps) || _gameStartTime < 1 ? 0 : cps; // _gameStartTime < 1 に変更 (1秒未満は0)
    }

    function timer() {
        _gameTimeNum--; _gameStartTime++;
        if (mode === MODE_NORMAL && _gameTimeNum < 0) _gameTimeNum = 0; // 0未満にならないように

        if (mode === MODE_NORMAL && _gameTimeNum <= 0 && !_gameOver) { // gameOverチェック追加
            if (GameTimeLayer && I18N) GameTimeLayer.innerHTML = (I18N['time-up'] || 'Time Up') + '!';
            gameOver();
            if (GameLayerBG) GameLayerBG.classList.add('flash');
            if (soundMode === 'on' && typeof createjs !== 'undefined' && createjs.Sound.play) createjs.Sound.play("end");
        }
        updatePanel();
    }

    function updatePanel() {
        if (!GameTimeLayer) GameTimeLayer = document.getElementById('GameTimeLayer');
        if (!GameTimeLayer || !I18N) return;

        if (mode === MODE_NORMAL) {
            if (!_gameOver) GameTimeLayer.innerHTML = createTimeText(_gameTimeNum);
        } else if (mode === MODE_ENDLESS) {
            let cps = getCPS();
            let text = (cps === 0 && _gameScore === 0 ? (I18N['calculating'] || 'Calculating...') : cps.toFixed(2));
            GameTimeLayer.innerHTML = `CPS:${text}`;
        } else { GameTimeLayer.innerHTML = `SCORE:${_gameScore}`; }
    }

    function focusOnReplay(){ // Original: foucusOnReplay
        const replayBtnEl = document.getElementById('replay');
        if (replayBtnEl) replayBtnEl.focus();
    }

    function gameOver() {
        if (_gameOver) return; // Avoid multiple calls
        _gameOver = true; if(_gameTime) clearInterval(_gameTime);
        let cps = getCPS(); updatePanel(); // CPS計算はclearInterval後、updatePanel前
        setTimeout(function () {
            if (GameLayerBG) GameLayerBG.classList.remove('flash');
            showGameScoreLayer(cps);
            focusOnReplay();
        }, 1500);
    }

    function createTimeText(n) { return 'TIME:' + Math.max(0, Math.ceil(n)); }

    let _ttreg = / t{1,2}(\d+)/, _clearttClsReg = / t{1,2}\d+| bad/;

    function refreshGameLayer(box, loop, offset) {
        if (!box?.children || blockSize <= 0) return; // blockSizeチェック追加

        let i = Math.floor(Math.random() * 4) + (loop ? 0 : 4); // 最初の黒タイル位置 (loop時は0-3行目、非loop時は4-7行目)
        
        for (let j = 0; j < box.children.length; j++) {
            let r = box.children[j], rstyle = r.style;
            rstyle.left = (j % 4) * blockSize + 'px'; rstyle.bottom = Math.floor(j / 4) * blockSize + 'px';
            rstyle.width = blockSize + 'px'; rstyle.height = blockSize + 'px';
            r.className = r.className.replace(_clearttClsReg, '').trim(); // trim()で余分なスペース削除
            r.notEmpty = false;

            if (i === j) { // i はグローバルなインデックス (0-39)
                _gameBBList.push({ cell: i % 4, id: r.id }); // cellは列インデックス (0-3)
                r.className += ' t' + (Math.floor(Math.random() * 5) + 1); r.notEmpty = true;
                // 次の黒タイルを現在の行の次の行のランダムな列に設定
                let currentRow = Math.floor(j / 4);
                if (currentRow < Math.floor(box.children.length / 4) - 1) { // 最後の行でなければ次の行を探す
                    i = (currentRow + 1) * 4 + Math.floor(Math.random() * 4);
                } else {
                    i = -1; // これ以上黒タイルを置かない
                }
            }
        }
        if (loop) { // GameLayer2 (上部に隠れているレイヤー) の場合
            box.style[transitionDuration] = '0ms'; box.style.display = 'none';
            // y座標を、GameLayer1の下にくっつくように設定
            // offsetは通常-1。children.length/4は行数。
            box.y = -blockSize * (Math.floor(box.children.length / 4) + (offset || 0));
            box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
            setTimeout(function () { box.style.display = 'block'; }, 50);
        } else { // GameLayer1 (最初に見えているレイヤー) の場合
            box.y = 0; box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
        }
        box.style[transitionDuration] = '150ms'; // アニメーション速度
    }


    function gameLayerMoveNextRow() {
        for (let i = 0; i < GameLayer.length; i++) {
            let g = GameLayer[i]; if (!g?.children) continue;
            g.y += blockSize;
            // レイヤーが画面下端から完全に見えなくなったら上部に再配置
            if (g.y >= blockSize * (Math.floor(g.children.length / 4))) {
                refreshGameLayer(g, 1, 0); // offsetを0に (GameLayer2の初期位置と同じ)
            } else { g.style[transform] = 'translate3D(0,' + g.y + 'px,0)'; }
        }
    }

    function gameTapEvent(e) {
        if (_gameOver) return false;
        e.preventDefault(); // スクロールなどを防ぐ

        let tar = e.target;
        let eventY = e.clientY || (e.targetTouches && e.targetTouches[0] ? e.targetTouches[0].clientY : 0);
        let eventX = (e.clientX || (e.targetTouches && e.targetTouches[0] ? e.targetTouches[0].clientX : 0)) - (body ? body.offsetLeft : 0);
        
        if (_gameBBList.length === 0 || _gameBBListIndex >= _gameBBList.length) return false;
        let p = _gameBBList[_gameBBListIndex];
        
        // touchAreaが未定義、またはblockSizeが0の場合は再計算
        if ((touchArea[1] === undefined || blockSize <= 0) && body && body.offsetWidth > 0) countBlockSize();
        // タッチエリア外のタップは無視（ただしtouchArea[1]が有効な場合のみ）
        if (touchArea[1] !== undefined && (eventY > touchArea[0] || eventY < touchArea[1])) return false;

        const correctBlackTileId = p.id;
        const correctBlackTileElement = document.getElementById(correctBlackTileId);

        // 正しい黒タイルをタップしたか、または正しい列をタップしたかの判定
        let correctTap = false;
        if (tar && tar.id === correctBlackTileId && correctBlackTileElement && correctBlackTileElement.notEmpty) { // 黒タイル直接タップ
            correctTap = true;
        } else if (correctBlackTileElement && correctBlackTileElement.notEmpty) { // 列タップ
            const col = p.cell; // 0, 1, 2, 3
            if ((col === 0 && eventX < blockSize) ||
                (col === 1 && eventX >= blockSize && eventX < 2 * blockSize) ||
                (col === 2 && eventX >= 2 * blockSize && eventX < 3 * blockSize) ||
                (col === 3 && eventX >= 3 * blockSize && eventX < 4 * blockSize)
            ) {
                correctTap = true;
                tar = correctBlackTileElement; // ターゲットを正しい黒タイルに強制
            }
        }
        
        if (correctTap) {
            if (!_gameStart) gameStart();
            if (soundMode === 'on' && typeof createjs !== 'undefined' && createjs.Sound.play) createjs.Sound.play("tap");
            
            if (tar) { // tarは正しい黒タイルのはず
                tar.className = tar.className.replace(_ttreg, ' tt$1');
                tar.notEmpty = false; // タップ後は空にする
            }

            _gameBBListIndex++;
            _gameScore++;
            updatePanel();
            gameLayerMoveNextRow();
        } else if (_gameStart && tar && tar.classList && tar.classList.contains('block') && !tar.notEmpty) { // 間違ったタイル（白いタイル）をタップ
             if (soundMode === 'on' && typeof createjs !== 'undefined' && createjs.Sound.play) createjs.Sound.play("err");
            tar.classList.add('bad');
            if (mode === MODE_PRACTICE) {
                setTimeout(() => { tar.classList.remove('bad'); }, 500);
            } else {
                gameOver();
            }
        }
        return false;
    }

    function createGameLayer() {
        let html = '<div id="GameLayerBG">';
        for (let i = 1; i <= 2; i++) {
            let id = 'GameLayer' + i;
            html += `<div id="${id}" class="GameLayer">`;
            for (let j = 0; j < 10; j++) { // 10行生成 (0-9)
                for (let k = 0; k < 4; k++) { // 4列生成 (0-3)
                    html += `<div id="${id}-${k + j * 4}" num="${k + j * 4}" class="block${k ? ' bl' : ''}"></div>`;
                }
            }
            html += '</div>';
        }
        html += '</div><div id="GameTimeLayer" class="text-center"></div>';
        return html;
    }

    function closeWelcomeLayer() { welcomeLayerClosed = true; $('#welcome').css('display', 'none'); updatePanel(); }
    function showWelcomeLayer() { welcomeLayerClosed = false; $('#mode').text(modeToString(mode)); $('#welcome').css('display', 'block'); }
    
    function getBestScore(currentScore) {
        let cookieName = (mode === MODE_NORMAL ? 'best-score' : (mode === MODE_ENDLESS ? 'endless-best-score' : 'practice-best-score'));
        let best = parseFloat(cookie(cookieName)) || 0;
        currentScore = parseFloat(currentScore) || 0; // currentScoreも数値に変換
        if (currentScore > best) { 
            best = currentScore; 
            cookie(cookieName, best.toFixed(mode === MODE_ENDLESS ? 2 : 0), 100); 
        }
        return best;
    }
    function scoreToString(s) { return mode === MODE_ENDLESS ? parseFloat(s || 0).toFixed(2) : String(Math.floor(parseFloat(s || 0))); }
    function legalDeviationTime() { return _date1 ? deviationTime < (_gameSettingNum + 3) * 1000 : true; }

    function showGameScoreLayer(cps) {
        const gameScoreLayer = $('#GameScoreLayer');
        let bgColorClass = 'bgc1'; // デフォルトの背景色クラス
        if (_gameBBList.length > 0 && _gameBBListIndex > 0 && _gameBBList[_gameBBListIndex - 1]) {
            const lastBlock = $(`#${_gameBBList[_gameBBListIndex - 1].id}`);
            if (lastBlock.length) {
                const classAttr = lastBlock.attr('class');
                if (classAttr) {
                    const cMatch = classAttr.match(_ttreg) || classAttr.match(/tt(\d)/); // ttクラスも考慮
                    if (cMatch && cMatch[1]) bgColorClass = 'bgc' + cMatch[1];
                }
            }
        }
        gameScoreLayer.attr('class', 'BBOX SHADE ' + bgColorClass); // SHADEクラスとbgcクラスを確実に適用
        
        $('#GameScoreLayer-text').html(shareText(cps));
        let scoreVal = (mode === MODE_ENDLESS ? cps : _gameScore);
        let best = getBestScore(scoreVal);
        
        gameScoreLayer.css('color', (mode !== MODE_NORMAL || legalDeviationTime()) ? '' : 'red');
        $('#cps').text(parseFloat(cps || 0).toFixed(2));
        $('#score').text(scoreToString(_gameScore)); // ここは常に_gameScore
        $('#GameScoreLayer-score').css('display', mode === MODE_ENDLESS ? 'none' : 'flex');
        $('#best').text(scoreToString(best));
        gameScoreLayer.css('display', 'block');
    }

    function hideGameScoreLayer() { $('#GameScoreLayer').css('display', 'none'); }
    w.replayBtn = function() { gameRestart(); hideGameScoreLayer(); }
    w.backBtn = function() { gameRestart(); hideGameScoreLayer(); showWelcomeLayer(); }

    function shareText(cps) {
        if (mode === MODE_NORMAL) { // ノーマルモードでのみ時間チェックとSupabase送信
            let date2 = new Date(); if (!_date1) _date1 = date2; // _date1がnullなら現在時刻
            deviationTime = (date2.getTime() - _date1.getTime());
            if (!legalDeviationTime()) {
                return (I18N && I18N['time-over'] ? I18N['time-over'] : 'Time over by: ') + ((deviationTime / 1000) - _gameSettingNum).toFixed(2) + 's';
            }
            SubmitResultsToSupabase();
        }
        cps = parseFloat(cps || 0);
        if (!I18N) return "Score: " + cps.toFixed(2);
        if (cps <= 5) return I18N['text-level-1'] || 'Lvl 1'; if (cps <= 8) return I18N['text-level-2'] || 'Lvl 2';
        if (cps <= 10) return I18N['text-level-3'] || 'Lvl 3'; if (cps <= 15) return I18N['text-level-4'] || 'Lvl 4';
        return I18N['text-level-5'] || 'Lvl 5';
    }

    function toStr(obj) { if (typeof obj === 'object') { try {return JSON.stringify(obj);} catch(e){return String(obj);}} else { return String(obj); } }
    function cookie(name, value, timeInDays) {
        if (name) {
            if (value !== undefined) {
                let expires = ""; if (timeInDays) { let date = new Date(); date.setTime(date.getTime() + (timeInDays * 24 * 60 * 60 * 1000)); expires = "; expires=" + date.toUTCString(); }
                document.cookie = name + "=" + (escape(toStr(value)) || "") + expires + "; path=/; SameSite=Lax"; // SameSite属性追加
                return true;
            } else {
                let nameEQ = name + "="; let ca = document.cookie.split(';');
                for (let i = 0; i < ca.length; i++) {
                    let c = ca[i]; while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                    if (c.indexOf(nameEQ) === 0) {
                        let valStr = unescape(c.substring(nameEQ.length, c.length));
                        try { 
                            if ((valStr.startsWith('{') && valStr.endsWith('}')) || (valStr.startsWith('[') && valStr.endsWith(']'))) return JSON.parse(valStr); 
                            const num = parseFloat(valStr);
                            if (!isNaN(num) && isFinite(valStr) && String(num) === valStr) return num; // 数値文字列のみ数値に
                        } catch (e) {}
                        return valStr === 'true' ? true : (valStr === 'false' ? false : valStr); // 真偽値も考慮
                    }
                } return null;
            }
        }
        let data = {}; let ca = document.cookie.split(';'); 
        for (let i = 0; i < ca.length; i++) { 
            let pair = ca[i].split('='); 
            if(pair.length === 2 && pair[0].trim() !== "") data[pair[0].trim()] = unescape(pair[1]); 
        } return data;
    }

    function initSetting() {
        $("#username").val(cookie("username") || ""); $("#message").val(cookie("message") || "");
        const titleVal = cookie("title"); if (titleVal) { $('title').text(titleVal); $('#title').val(titleVal); }
        const keyboardVal = cookie("keyboard");
        if (keyboardVal) {
            const kbStr = String(keyboardVal).toLowerCase(); $("#keyboard").val(kbStr);
            if(kbStr.length === 4) { map = {}; map[kbStr.charAt(0)] = 1; map[kbStr.charAt(1)] = 2; map[kbStr.charAt(2)] = 3; map[kbStr.charAt(3)] = 4; }
        }
        const gameTimeVal = cookie('gameTime');
        if (gameTimeVal) { const gt = parseInt(gameTimeVal); if (!isNaN(gt) && gt > 0) { $('#gameTime').val(gt); _gameSettingNum = gt; } }
        else { _gameSettingNum = 20; $('#gameTime').val(20); } // デフォルト値を設定
    }

    w.show_btn = function() { $('#btn_group').css('display', 'flex'); $('#desc').css('display', 'block'); $('#setting').css('display', 'none'); }
    w.show_setting = function() {
        $('#btn_group').css('display', 'none'); $('#desc').css('display', 'none'); $('#setting').css('display', 'block');
        if (I18N) $('#sound').text(soundMode === 'on' ? (I18N['sound-on'] || 'Sound: ON') : (I18N['sound-off'] || 'Sound: OFF'));
    }
    w.save_cookie = function() {
        const s = ['username', 'message', 'keyboard', 'title', 'gameTime'];
        for (let k of s) { let v = $(`#${k}`).val(); if (v !== null && v !== undefined) cookie(k, String(v).trim(), 100); }
        const gtVal = $('#gameTime').val(); if(gtVal){ const ngt = parseInt(gtVal); if(!isNaN(ngt) && ngt > 0) _gameSettingNum = ngt; else _gameSettingNum = 20;}
        else { _gameSettingNum = 20; } // 値が空ならデフォルト20秒
        initSetting(); // 設定を再読み込みしてUIに反映
        gameRestart(); // ゲーム時間設定が変更された可能性があるのでゲームをリスタート
    }
    function isnull(val) { if (val === null || val === undefined) return true; return String(val).replace(/(^\s*)|(\s*$)/g, '') === ''; }

    function click(index) { // キーボード入力処理
        if (!welcomeLayerClosed || _gameOver || _gameBBList.length === 0 || _gameBBListIndex >= _gameBBList.length) return;
        
        let p = _gameBBList[_gameBBListIndex];
        const currentBlackTileElement = document.getElementById(p.id); 
        if (!currentBlackTileElement || !currentBlackTileElement.parentElement) return;
        
        const parentGameLayer = currentBlackTileElement.parentElement; // GameLayer1 or GameLayer2
        const currentBlockNumAttr = currentBlackTileElement.getAttribute("num"); 
        if(currentBlockNumAttr === null) return;

        const currentBlockNum = parseInt(currentBlockNumAttr); // 黒タイルの通し番号 (0-39)
        const currentRowStartNum = currentBlockNum - p.cell; // 黒タイルのある行の最初のブロックの通し番号
        const targetColIndex = index - 1; // 押されたキーに対応する列 (0-3)
        const targetBlockNum = currentRowStartNum + targetColIndex; // 押されたキーに対応するブロックの通し番号

        let targetElement = null;
        // 同じGameLayer内で対象のブロックを探す
        for(let child of parentGameLayer.children){
            if(child.getAttribute("num") === String(targetBlockNum)){
                targetElement = child;
                break;
            }
        }

        if (!targetElement) {
            // console.warn("Target element for keyboard click not found", p.id, index, targetBlockNum);
            return;
        }
        
        // クリックイベントをシミュレート
        // clientX, clientY は gameTapEvent 内で使われるため、おおよその値を設定
        let fakeEvent = { 
            target: targetElement, 
            clientX: (targetColIndex + 0.5) * blockSize + (body ? body.offsetLeft : 0), 
            clientY: (touchArea[1] !== undefined ? (touchArea[0] + touchArea[1]) / 2 : window.innerHeight / 2),
            preventDefault: function(){} // ダミーのpreventDefault
        };
        gameTapEvent(fakeEvent);
    }

    const clickBeforeStyle = $('<style id="clickBeforeStyleInjectedByJS"></style>').appendTo('head');
    const clickAfterStyle = $('<style id="clickAfterStyleInjectedByJS"></style>').appendTo('head');
    function saveImage(dom, callback) { if (dom.files && dom.files[0]) { let r = new FileReader(); r.onload = function() { callback(this.result); }; r.readAsDataURL(dom.files[0]); } }
    w.getClickBeforeImage = function() { $('#click-before-image').trigger('click'); }
    w.saveClickBeforeImage = function() { const i = document.getElementById('click-before-image'); saveImage(i, r => { clickBeforeStyle.html(`.block.t1,.block.t2,.block.t3,.block.t4,.block.t5{background-size:contain!important;background-image:url(${r})!important;background-repeat:no-repeat!important;background-position:center!important;}`); }); }
    w.getClickAfterImage = function() { $('#click-after-image').trigger('click'); }
    w.saveClickAfterImage = function() { const i = document.getElementById('click-after-image'); saveImage(i, r => { clickAfterStyle.html(`.block.tt1,.block.tt2,.block.tt3,.block.tt4,.block.tt5{background-size:contain!important;background-image:url(${r})!important;background-repeat:no-repeat!important;background-position:center!important;}`); }); }

})(window);
