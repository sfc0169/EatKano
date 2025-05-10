// IMPORTANT: Make sure to include the Supabase SDK in your HTML file before this script:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const MODE_NORMAL = 1, MODE_ENDLESS = 2, MODE_PRACTICE = 3;

// ─── Supabase Client Initialization (Moved to the top, outside IIFE if preferred, or inside) ───
const SUPABASE_URL = 'https://pazuftgivpsfqekecfvt.supabase.co';
// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// IMPORTANT: REPLACE WITH YOUR ACTUAL SUPABASE ANONYMOUS KEY
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhenVmdGdpdnBzZnFla2VjZnZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NzUwNTUsImV4cCI6MjA2MjM1MTA1NX0.m_N4lzEf6rbSqN18oDre4MCx8MteakGfyvv9vs3p5EY';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
const supaClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// ─── End of Supabase Client Initialization ───

(function(w) {
    function getJsonI18N() {
        // (元のコードのまま)
        const LANGUAGES = [
            { regex: /^zh\b/, lang: 'zh' },
            { regex: /^ja\b/, lang: 'ja' },
            { regex: /.*/, lang: 'en'}
        ]
        const lang = LANGUAGES.find(l => l.regex.test(navigator.language)).lang
        
        let i18nData = null; // 変数スコープを修正
        $.ajax({
            url: `./static/i18n/${lang}.json`,
            dataType: 'json',
            method: 'GET',
            async: false,
            success: data => i18nData = data, // resではなくi18nDataに代入
            error: () => {
                alert('找不到语言文件: ' + lang + '. Falling back to English.');
                // Fallback to English
                $.ajax({
                    url: `./static/i18n/en.json`,
                    dataType: 'json',
                    method: 'GET',
                    async: false,
                    success: data => i18nData = data,
                    error: () => {
                        alert('Could not load English language file either.');
                        i18nData = {}; // Prevent further errors
                    }
                });
            }
        });
        return i18nData;
    }

    const I18N = getJsonI18N();

    // I18Nがnullでないことを確認してから処理
    if (I18N) {
        $('[data-i18n]').each(function() {
            const content = I18N[this.dataset.i18n];
            if (content !== undefined) $(this).text(content);
        });

        $('[data-placeholder-i18n]').each(function() {
            const content = I18N[this.dataset.placeholderI18n];
            if (content !== undefined) $(this).attr('placeholder', content);
        });

        if (I18N['lang']) {
            $('html').attr('lang', I18N['lang']);
        }
    }


    let isDesktop = !navigator['userAgent'].match(/(ipad|iphone|ipod|android|windows phone)/i);
    let fontunit = isDesktop ? 20 : ((window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth) / 320) * 10;
    document.write('<style type="text/css">' +
        'html,body {font-size:' + (fontunit < 30 ? fontunit : '30') + 'px;}' +
        (isDesktop ? '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position: absolute;}' :
            '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position:fixed;}@media screen and (orientation:landscape) {#landscape {display: box; display: -webkit-box; display: -moz-box; display: -ms-flexbox;}}') +
        '</style>');
    let map = {'d': 1, 'f': 2, 'j': 3, 'k': 4};
    if (isDesktop) {
        document.write('<div id="gameBody"></div>'); // id="gameBody" を持つdivを書き出す
        document.onkeydown = function (e) {
            let key = e.key.toLowerCase();
            // Object.keys(map).indexOf(key) !== -1 を Object.keys(map).includes(key) に変更
            if (Object.keys(map).includes(key)) {
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
        // ★★★ ゲームレイヤーの挿入をここで行う (document.writeの代わり) ★★★
        if (!document.getElementById('GameLayerBG')) {
            document.body.insertAdjacentHTML('afterbegin', createGameLayer());
        }
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

        showWelcomeLayer();
        body = document.getElementById('gameBody') || document.body; // gameBodyがなければbodyを使用
        body.style.height = window.innerHeight + 'px';
        transform = typeof (body.style.webkitTransform) !== 'undefined' ? 'webkitTransform' : (typeof (body.style.msTransform) !==
        'undefined' ? 'msTransform' : 'transform');
        transitionDuration = transform.replace(/ransform/g, 'ransitionDuration');

        GameTimeLayer = document.getElementById('GameTimeLayer');
        GameLayerBG = document.getElementById('GameLayerBG'); // この時点で存在するはず

        // GameLayerの初期化を修正
        GameLayer = []; // 配列をクリア
        const gameLayer1 = document.getElementById('GameLayer1');
        const gameLayer2 = document.getElementById('GameLayer2');

        if (gameLayer1 && gameLayer2) {
            GameLayer.push(gameLayer1);
            GameLayer[0].children = GameLayer[0].querySelectorAll('div');
            GameLayer.push(gameLayer2);
            GameLayer[1].children = GameLayer[1].querySelectorAll('div');
        } else {
            console.error("GameLayer1 or GameLayer2 not found in init(). Ensure createGameLayer() was called.");
            return; // 初期化中断
        }


        if (GameLayerBG) { // GameLayerBGが存在するか確認
            if (GameLayerBG.ontouchstart === null) {
                GameLayerBG.ontouchstart = gameTapEvent;
            } else {
                GameLayerBG.onmousedown = gameTapEvent;
            }
        } else {
            console.error("GameLayerBG not found in init().");
            return; // 初期化中断
        }

        gameInit();
        initSetting();
        window.addEventListener('resize', refreshSize, false);
    }

    function getMode() {
        const gameModeCookie = cookie('gameMode');
        return gameModeCookie ? parseInt(gameModeCookie) : MODE_NORMAL;
    }

    function getSoundMode() {
        return cookie('soundMode') || 'on'; // デフォルト 'on'
    }

    w.changeSoundMode = function() {
        soundMode = (soundMode === 'on' ? 'off' : 'on');
        if (I18N) $('#sound').text(I18N[soundMode === 'on' ? 'sound-on' : 'sound-off']);
        cookie('soundMode', soundMode, 100); // Cookie保存期間を100日に設定
    }

    function modeToString(m) {
        if (!I18N) return "Mode"; // I18N未ロード時のフォールバック
        if (m === MODE_ENDLESS) return I18N['endless'];
        if (m === MODE_PRACTICE) return I18N['practice'];
        return I18N['normal'];
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

    function _refreshSize() {
        if (!body) body = document.getElementById('gameBody') || document.body; // body再取得
        if (body.offsetWidth === 0) return; // body幅が0なら処理中断

        countBlockSize();
        for (let i = 0; i < GameLayer.length; i++) {
            let box = GameLayer[i];
            if (!box || !box.children) continue; // boxやchildrenがない場合はスキップ
            for (let j = 0; j < box.children.length; j++) {
                let r = box.children[j], rstyle = r.style;
                rstyle.left = (j % 4) * blockSize + 'px';
                rstyle.bottom = Math.floor(j / 4) * blockSize + 'px';
                rstyle.width = blockSize + 'px';
                rstyle.height = blockSize + 'px';
            }
        }
        if (GameLayer.length < 2 || !GameLayer[0] || !GameLayer[1]) return; // GameLayerのチェック

        let f, a;
        if (GameLayer[0].y > GameLayer[1].y) {
            f = GameLayer[0]; a = GameLayer[1];
        } else {
            f = GameLayer[1]; a = GameLayer[0];
        }
        let y = ((_gameBBListIndex) % 10) * blockSize;
        f.y = y;
        f.style[transform] = 'translate3D(0,' + f.y + 'px,0)';
        a.y = -blockSize * Math.floor(f.children.length / 4) + y;
        a.style[transform] = 'translate3D(0,' + a.y + 'px,0)';
    }

    function countBlockSize() {
        if (!body) body = document.getElementById('gameBody') || document.body;
        if (body.offsetWidth === 0) {
            // console.warn("countBlockSize: body has no offsetWidth.");
            return;
        }
        blockSize = body.offsetWidth / 4;
        body.style.height = window.innerHeight + 'px';
        if (GameLayerBG) GameLayerBG.style.height = window.innerHeight + 'px';
        touchArea[0] = window.innerHeight;
        touchArea[1] = window.innerHeight - blockSize * 3;
    }

    let _gameBBList = [],
        _gameBBListIndex = 0,
        _gameOver = false,
        _gameStart = false,
        _gameSettingNum = 20, // Default time for normal mode
        _gameTime, _gameTimeNum, _gameScore, _date1, deviationTime;

    let _gameStartTime, _gameStartDatetime;

    function gameInit() {
        if (typeof createjs !== 'undefined' && createjs.Sound) {
            createjs.Sound.registerSound({ src: "./static/music/err.mp3", id: "err" });
            createjs.Sound.registerSound({ src: "./static/music/end.mp3", id: "end" });
            createjs.Sound.registerSound({ src: "./static/music/tap.mp3", id: "tap" });
        } else {
            console.warn("CreateJS Sound library not found.");
        }
        gameRestart();
    }

    function gameRestart() {
        _gameBBList = [];
        _gameBBListIndex = 0;
        _gameScore = 0;
        _gameOver = false;
        _gameStart = false;
        _gameSettingNum = parseInt(cookie('gameTime')) || 20; // 保存された時間かデフォルト20秒
        _gameTimeNum = _gameSettingNum;
        _gameStartTime = 0;

        // GameLayerの再取得と確認
        if (GameLayer.length < 2 || !GameLayer[0] || !GameLayer[1]) {
            const gameLayer1 = document.getElementById('GameLayer1');
            const gameLayer2 = document.getElementById('GameLayer2');
            if (gameLayer1 && gameLayer2) {
                GameLayer = [gameLayer1, gameLayer2];
                GameLayer[0].children = GameLayer[0].querySelectorAll('div');
                GameLayer[1].children = GameLayer[1].querySelectorAll('div');
            } else {
                // console.error("Game layers not available for gameRestart.");
                // Try to call init again if layers are missing, could be an order of execution issue.
                // This is a fallback, ideally init should set them up correctly.
                if(typeof w.init === 'function' && !document.getElementById('GameLayer1')) {
                    // console.log("Attempting to re-initialize game layers in gameRestart.");
                    // w.init(); // Be careful with re-calling init, it might have side effects.
                }
                // return; // Or simply return if layers can't be established
            }
        }
        
        countBlockSize();
        if (blockSize > 0 && GameLayer.length === 2 && GameLayer[0].children && GameLayer[1].children) {
            refreshGameLayer(GameLayer[0]);
            refreshGameLayer(GameLayer[1], 1);
        } else {
            // console.warn("Cannot refresh game layers in gameRestart due to invalid blockSize or GameLayer.");
            // Fallback or error handling
        }
        updatePanel();
    }

    function gameStart() {
        _date1 = new Date();
        _gameStartDatetime = _date1.getTime();
        _gameStart = true;
        if(_gameTime) clearInterval(_gameTime); // 前のタイマーをクリア
        _gameTime = setInterval(timer, 1000);
    }

    function getCPS() {
        const elapsedTime = (new Date().getTime() - _gameStartDatetime) / 1000;
        if (elapsedTime <= 0 || _gameScore === 0) return 0;
        let cps = _gameScore / elapsedTime;
        return isNaN(cps) || !isFinite(cps) || _gameStartTime < 1 ? 0 : cps;
    }

    function timer() {
        _gameTimeNum--;
        _gameStartTime++;
        if (mode === MODE_NORMAL && _gameTimeNum <= 0) {
            if (GameTimeLayer && I18N) GameTimeLayer.innerHTML = I18N['time-up'] + '!';
            gameOver();
            if (GameLayerBG) GameLayerBG.classList.add('flash'); // classList.add を使用
            if (soundMode === 'on' && createjs && createjs.Sound) createjs.Sound.play("end");
        }
        updatePanel();
    }

    function updatePanel() {
        if (!GameTimeLayer) GameTimeLayer = document.getElementById('GameTimeLayer'); // GameTimeLayer再取得
        if (!GameTimeLayer) return; // GameTimeLayerがなければ処理中断

        if (mode === MODE_NORMAL) {
            if (!_gameOver) {
                GameTimeLayer.innerHTML = createTimeText(_gameTimeNum);
            }
        } else if (mode === MODE_ENDLESS) {
            let cps = getCPS();
            let text = (cps === 0 && _gameScore === 0 ? (I18N ? I18N['calculating'] : 'Calculating...') : cps.toFixed(2));
            GameTimeLayer.innerHTML = `CPS:${text}`;
        } else { // MODE_PRACTICE
            GameTimeLayer.innerHTML = `SCORE:${_gameScore}`;
        }
    }

    function foucusOnReplay(){ // typo: focusOnReplay
        const replayBtnEl = document.getElementById('replay');
        if (replayBtnEl) replayBtnEl.focus();
    }

    function gameOver() {
        _gameOver = true;
        if(_gameTime) clearInterval(_gameTime);
        let cps = getCPS();
        updatePanel(); // スコア最終更新
        setTimeout(function () {
            if (GameLayerBG) GameLayerBG.classList.remove('flash'); // classList.remove を使用
            showGameScoreLayer(cps);
            foucusOnReplay(); // typo
        }, 1500);
    }

    // ★★★ Removed: encrypt function (PHP backend specific) ★★★

    // ★★★ Modified: SubmitResults to use Supabase ★★★
    async function SubmitResultsToSupabase() { // Renamed to avoid confusion and make it async
        const usernameVal = $("#username").val();
        const messageVal = $("#message").val();

        if (!usernameVal) { // 元のコードでは username がないと送信していなかった
            // console.log("Username not set, score not submitted to Supabase.");
            // alert("ユーザー名が設定されていません。スコアは保存されません。"); // 必要なら通知
            return;
        }
        // 元のコードでは _gameSettingNum === 20 の条件があったが、Supabase版では一旦外す。必要なら追加。

        const scoreToSubmit = _gameScore; // _gameScore を使用

        // console.log(`Submitting to Supabase: Name: ${usernameVal}, Score: ${scoreToSubmit}, Message: ${messageVal}`);

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
            // alert('スコアがSupabaseに保存されました！'); // 成功通知は任意
        }
    }
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

    function createTimeText(n) {
        return 'TIME:' + Math.max(0, Math.ceil(n)); // Ensure non-negative
    }

    let _ttreg = / t{1,2}(\d+)/,
        _clearttClsReg = / t{1,2}\d+| bad/;

    function refreshGameLayer(box, loop, offset) {
        // (元のコードのまま - 当たり判定に影響するため変更しない)
        if (!box || !box.children || blockSize <= 0) return;
        let i = Math.floor(Math.random() * 1000) % 4 + (loop ? 0 : 4);
        for (let j = 0; j < box.children.length; j++) {
            let r = box.children[j], rstyle = r.style;
            rstyle.left = (j % 4) * blockSize + 'px';
            rstyle.bottom = Math.floor(j / 4) * blockSize + 'px';
            rstyle.width = blockSize + 'px';
            rstyle.height = blockSize + 'px';
            r.className = r.className.replace(_clearttClsReg, '');
            r.notEmpty = false; // notEmptyをリセット
            if (i === j) {
                _gameBBList.push({
                    cell: i % 4,
                    id: r.id
                });
                r.className += ' t' + (Math.floor(Math.random() * 1000) % 5 + 1);
                r.notEmpty = true;
                i = (Math.floor(j / 4) + 1) * 4 + Math.floor(Math.random() * 1000) % 4;
            }
        }
        if (loop) {
            box.style[transitionDuration] = '0ms'; // transitionDuration を使用
            box.style.display = 'none';
            box.y = -blockSize * (Math.floor(box.children.length / 4) + (offset || 0)) * loop;
            setTimeout(function () {
                box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
                box.style.display = 'block'; // 表示を戻す
            }, 100); // 元の遅延時間を尊重
        } else {
            box.y = 0;
            box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
        }
        box.style[transitionDuration] = '150ms';
    }

    function gameLayerMoveNextRow() {
        // (元のコードのまま - 当たり判定に影響するため変更しない)
        // ただし、_gameBBListIndex++ は gameTapEvent の成功時かここに移動するか検討
        // 元のコードでは gameTapEvent の成功時にインクリメントされているので、それに従う
        for (let i = 0; i < GameLayer.length; i++) {
            let g = GameLayer[i];
            g.y += blockSize;
            if (g.y > blockSize * (Math.floor(g.children.length / 4))) { // >= の方が安全か？元のまま
                refreshGameLayer(g, 1, -1); // offset -1 は正しいか確認 (元のまま)
            } else {
                g.style[transform] = 'translate3D(0,' + g.y + 'px,0)';
            }
        }
    }

    function gameTapEvent(e) {
        // (元のコードのまま - 当たり判定ロジック)
        if (_gameOver) {
            return false;
        }
        let tar = e.target;
        // e.targetTouches[0] の存在確認を追加
        let y = e.clientY || (e.targetTouches && e.targetTouches[0] ? e.targetTouches[0].clientY : 0);
        let x = (e.clientX || (e.targetTouches && e.targetTouches[0] ? e.targetTouches[0].clientX : 0)) - (body ? body.offsetLeft : 0);
        
        if (_gameBBList.length === 0 || _gameBBListIndex >= _gameBBList.length) return false; // _gameBBList範囲外チェック
        let p = _gameBBList[_gameBBListIndex];

        // touchAreaの再計算を試みる（blockSizeが初期化されていない場合があるため）
        if (touchArea[1] === undefined && body && body.offsetWidth > 0) countBlockSize();
        if (touchArea[1] !== undefined && (y > touchArea[0] || y < touchArea[1])) {
            return false;
        }

        if (tar && ((p.id === tar.id && tar.notEmpty) || // 正しい黒タイルをタップ
            (p.cell === 0 && x < blockSize) || // 1列目
            (p.cell === 1 && x > blockSize && x < 2 * blockSize) || // 2列目
            (p.cell === 2 && x > 2 * blockSize && x < 3 * blockSize) || // 3列目
            (p.cell === 3 && x > 3 * blockSize))) { // 4列目 (この列判定は黒タイルが特定IDの場合のフォールバックか？)
            
            // p.id を持つ要素を確実に取得
            const correctBlock = document.getElementById(p.id);
            if (!correctBlock || !correctBlock.notEmpty) { // さらに、それが本当に押すべき黒タイルか確認
                // もし列判定でここに来たが、p.idのタイルがnotEmptyでない場合、何もしないかエラー処理
                return false;
            }

            if (!_gameStart) {
                gameStart();
            }
            if (soundMode === 'on' && createjs && createjs.Sound) {
                createjs.Sound.play("tap");
            }
            correctBlock.className = correctBlock.className.replace(_ttreg, ' tt$1');
            correctBlock.notEmpty = false; // 押されたのでnotEmptyでなくす
            _gameBBListIndex++; // 次のターゲットへ
            _gameScore++;

            updatePanel();
            gameLayerMoveNextRow();

        } else if (_gameStart && tar && tar.classList && !tar.notEmpty) { // 白いタイルをタップ
            if (soundMode === 'on' && createjs && createjs.Sound) {
                createjs.Sound.play("err");
            }
            tar.classList.add('bad');
            if (mode === MODE_PRACTICE) {
                setTimeout(() => {
                    tar.classList.remove('bad');
                }, 500);
            } else {
                gameOver();
            }
        }
        return false;
    }

    function createGameLayer() {
        // (元のコードのまま)
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

    function closeWelcomeLayer() {
        welcomeLayerClosed = true;
        $('#welcome').css('display', 'none');
        updatePanel();
    }

    function showWelcomeLayer() {
        welcomeLayerClosed = false;
        $('#mode').text(modeToString(mode));
        $('#welcome').css('display', 'block'); // Or 'flex' if CSS uses it
    }

    function getBestScore(currentScore) {
        // (元のコードのまま)
        let cookieName = (mode === MODE_NORMAL ? 'bast-score' : 'endless-best-score'); // typo: best-score
        let best = parseFloat(cookie(cookieName)) || 0; // Parse to float, default 0
        if (currentScore > best) {
            best = currentScore;
            cookie(cookieName, best.toFixed(mode === MODE_ENDLESS ? 2 : 0), 100);
        }
        return best;
    }

    function scoreToString(s) {
        // (元のコードのまま)
        return mode === MODE_ENDLESS ? parseFloat(s).toFixed(2) : String(Math.floor(s));
    }

    function legalDeviationTime() {
        // (元のコードのまま)
        return _date1 ? deviationTime < (_gameSettingNum + 3) * 1000 : true;
    }

    function showGameScoreLayer(cps) {
        // (元のコードのまま - 表示ロジック)
        const gameScoreLayer = $('#GameScoreLayer');
        if (_gameBBList.length === 0 || _gameBBListIndex === 0 || !_gameBBList[_gameBBListIndex - 1]) {
            // 少なくとも1回はタップしているはずなので、インデックスは0以上
            // console.warn("Cannot determine last tapped block style for score layer.");
        } else {
            const lastTappedBlockId = _gameBBList[_gameBBListIndex - 1].id;
            const c = $(`#${lastTappedBlockId}`).attr('class').match(_ttreg);
            if (c && c[1]) {
                gameScoreLayer.attr('class', (idx, oldClass) => (oldClass || '').replace(/bgc\d/, 'bgc' + c[1]) + ' BBOX SHADE');
            }
        }
        
        $('#GameScoreLayer-text').html(shareText(cps)); // shareText内でSupabase送信

        let scoreVal = (mode === MODE_ENDLESS ? cps : _gameScore);
        let best = getBestScore(scoreVal);
        
        let normalCond = mode !== MODE_NORMAL || legalDeviationTime();
        gameScoreLayer.css('color', normalCond ? '' : 'red');

        $('#cps').text(cps.toFixed(2));
        $('#score').text(scoreToString(_gameScore)); // 表示は常に_gameScore
        $('#GameScoreLayer-score').css('display', mode === MODE_ENDLESS ? 'none' : 'flex'); // flexで表示
        $('#best').text(scoreToString(best));

        gameScoreLayer.css('display', 'block'); // Or 'flex'
    }

    function hideGameScoreLayer() {
        $('#GameScoreLayer').css('display', 'none');
    }

    w.replayBtn = function() {
        gameRestart();
        hideGameScoreLayer();
    }

    w.backBtn = function() {
        gameRestart();
        hideGameScoreLayer();
        showWelcomeLayer();
    }

    function shareText(cps) { // This is called by showGameScoreLayer
        // (元のコードの条件分岐は維持)
        if (mode === MODE_NORMAL) {
            let date2 = new Date();
            if (!_date1) _date1 = date2; // _date1が未設定の場合のフォールバック
            deviationTime = (date2.getTime() - _date1.getTime());
            if (!legalDeviationTime()) {
                return (I18N ? I18N['time-over'] : 'Time over by: ') + ((deviationTime / 1000) - _gameSettingNum).toFixed(2) + 's';
            }
            // ★★★ Call Supabase submission function instead of old SubmitResults ★★★
            SubmitResultsToSupabase();
        }

        if (!I18N) return "Score: " + cps.toFixed(2); // I18Nフォールバック
        if (cps <= 5) return I18N['text-level-1'];
        if (cps <= 8) return I18N['text-level-2'];
        if (cps <= 10) return I18N['text-level-3'];
        if (cps <= 15) return I18N['text-level-4'];
        return I18N['text-level-5'];
    }

    function toStr(obj) {
        // (元のコードのまま)
        if (typeof obj === 'object') {
            return JSON.stringify(obj);
        } else {
            return String(obj); // String()で確実に文字列に
        }
    }

    function cookie(name, value, timeInDays) {
        // (元のコードの eval を避けるように修正)
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
                        // JSON.parseを試みるが、失敗したら文字列として返す
                        try {
                            if ((valStr.startsWith('{') && valStr.endsWith('}')) || (valStr.startsWith('[') && valStr.endsWith(']'))) {
                                return JSON.parse(valStr);
                            }
                            if (!isNaN(parseFloat(valStr)) && isFinite(valStr)) { // 数値に見えるか
                                return parseFloat(valStr);
                            }
                        } catch (e) { /* ignore parse error, return as string */ }
                        return valStr;
                    }
                }
                return null; // 見つからない場合はnull
            }
        }
        // Get all cookies
        let data = {};
        let ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
             let pair = ca[i].split('=');
             if(pair.length === 2) data[pair[0].trim()] = unescape(pair[1]);
        }
        return data;
    }

    // ★★★ Removed: document.write(createGameLayer()); ★★★
    // (w.init 内で insertAdjacentHTML を使用するよう変更済み)

    function initSetting() {
        // (元のコードのまま)
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
            if (keyboardStr.length === 4) {
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
        // gameRestart(); // gameInit -> gameRestart の流れで呼ばれるのでここでは不要
    }

    w.show_btn = function() {
        // (元のコードのまま)
        $("#btn_group,#desc").css('display', 'block'); // Or 'grid' if using d-grid
        $('#setting').css('display', 'none');
    }

    w.show_setting = function() {
        // (元のコードのまま)
        $('#btn_group,#desc').css('display', 'none');
        $('#setting').css('display', 'block');
        if (I18N) $('#sound').text(soundMode === 'on' ? I18N['sound-on'] : I18N['sound-off']);
    }

    w.save_cookie = function() {
        // (元のコードのまま)
        const settings = ['username', 'message', 'keyboard', 'title', 'gameTime'];
        for (let s of settings) {
            let value = $(`#${s}`).val();
            if (value !== null && value !== undefined) { // Check for null/undefined
                cookie(s, String(value), 100);
            }
        }
        // gameTimeが変更されたら_gameSettingNumも更新
        const gameTimeVal = $('#gameTime').val();
        if (gameTimeVal) {
            const newGameTime = parseInt(gameTimeVal);
            if(!isNaN(newGameTime) && newGameTime > 0) _gameSettingNum = newGameTime;
        }
        initSetting(); // 設定を再読み込み・適用
    }

    function isnull(val) { // この関数はSupabase版では使われていないが、残しておく
        if (val === null || val === undefined) return true;
        let str = String(val).replace(/(^\s*)|(\s*$)/g, '');
        return str === '';
    }

    // ★★★ Removed: w.goRank function (PHP specific) ★★★

    function click(index) { // Keyboard click handler
        // (元のコードのまま - 当たり判定に影響するため)
        if (!welcomeLayerClosed || _gameOver) {
            return;
        }
        if (_gameBBList.length === 0 || _gameBBListIndex >= _gameBBList.length) return;

        let p = _gameBBList[_gameBBListIndex];
        // Calculate target block ID based on current black block's row and pressed key index
        const currentBlockNum = parseInt($(`#${p.id}`).attr("num")); // Get 'num' of current target
        const rowStartNum = currentBlockNum - p.cell; // 'num' of the first block in the current row
        const targetNumInRow = index - 1; // 0-indexed column based on key (d=0, f=1, j=2, k=3)
        const targetNumGlobal = rowStartNum + targetNumInRow;
        
        // Find the actual DOM element for the target block
        // This assumes IDs are like "GameLayerX-Y" where Y is the global num.
        // And p.id gives us the layer prefix like "GameLayer1-"
        const layerPrefix = p.id.substring(0, p.id.lastIndexOf('-') + 1);
        const targetBlockId = layerPrefix + targetNumGlobal;
        const targetElement = document.getElementById(targetBlockId);

        if (!targetElement) {
            // console.warn("Keyboard click: Target element not found for id:", targetBlockId);
            return;
        }
        
        let fakeEvent = {
            target: targetElement, // The specific block in the column corresponding to the key
            // clientX/Y are needed for touchArea check in gameTapEvent
            clientX: (targetNumInRow + 0.5) * blockSize + (body ? body.offsetLeft : 0),
            clientY: (touchArea[0] + touchArea[1]) / 2 // Mid-point of active touch area
        };
        gameTapEvent(fakeEvent);
    }

    // jQueryで<style>タグを追加
    const clickBeforeStyle = $('<style id="clickBeforeStyleInjected"></style>').appendTo($(document.head));
    const clickAfterStyle = $('<style id="clickAfterStyleInjected"></style>').appendTo($(document.head));

    function saveImage(dom, callback) {
        // (元のコードのまま)
        if (dom.files && dom.files[0]) {
            let reader = new FileReader();
            reader.onload = function() {
                callback(this.result);
            }
            reader.readAsDataURL(dom.files[0]);
        }
    }

    w.getClickBeforeImage = function() {
        // (元のコードのまま)
        $('#click-before-image').trigger('click'); // jQueryのclick()で発火
    }

    w.saveClickBeforeImage = function() {
        // (元のコードのまま)
        const img = document.getElementById('click-before-image');
        saveImage(img, r => {
            clickBeforeStyle.html(`
                .t1, .t2, .t3, .t4, .t5 {
                   background-size: contain !important; /* containに変更し!important追加 */
                   background-image: url(${r}) !important;
                   background-repeat: no-repeat !important;
                   background-position: center !important;
            }`);
        })
    }

    w.getClickAfterImage = function() {
        // (元のコードのまま)
        $('#click-after-image').trigger('click');
    }

    w.saveClickAfterImage = function() {
        // (元のコードのまま)
        const img = document.getElementById('click-after-image');
        saveImage(img, r => {
            clickAfterStyle.html(`
                .tt1, .tt2, .tt3, .tt4, .tt5 {
                  background-size: contain !important; /* containに変更し!important追加 */
                  background-image: url(${r}) !important;
                  background-repeat: no-repeat !important;
                  background-position: center !important;
            }`);
        })
    }
})(window);
