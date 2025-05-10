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

    // ─── Supabase Submit Score Function (Replaces old SubmitResults) ───
    async function SubmitResultsToSupabase() {
        const usernameVal = ($("#username").val() || '').trim();
        const messageVal = ($("#message").val() || '').trim();

        if (!usernameVal) {
            // console.log("ユーザー名が設定画面で入力されていません。スコアはSupabaseに保存されません。");
            // alert("ランキングに登録するには、設定画面でユーザー名を入力してください。"); // 必要に応じて通知
            return; // ユーザー名がなければ送信しない
        }

        const scoreToSubmit = _gameScore;

        const { data, error } = await supaClient
            .from('leaderboard') // テーブル名を確認
            .insert([
                { name: usernameVal, score: scoreToSubmit, comment: messageVal }
                // created_at はDB側で DEFAULT now() により自動設定される想定
            ]);

        if (error) {
            console.error('Supabase スコア保存エラー:', error);
            alert('スコアの保存に失敗しました。エラー: ' + error.message);
        } else {
            // console.log('Supabase スコア保存成功:', data);
            // alert('スコアがランキングに保存されました！'); // 成功通知は任意
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
            async: false, // 同期処理はUIフリーズの原因になるため注意 (元のコードを尊重)
            success: data => i18nData = data, // 元のコードではグローバルな res に代入していたが、ローカル変数に
            error: () => {
                // alert('找不到语言文件: ' + lang); // 元のalert
                console.warn('Language file not found: ' + lang + '.json. Falling back to English.');
                $.ajax({ // Fallback to English
                    url: `./static/i18n/en.json`,
                    dataType: 'json',
                    method: 'GET',
                    async: false,
                    success: data => i18nData = data,
                    error: () => {
                        console.error('Could not load English language file either.');
                        i18nData = {}; // Prevent further errors if English also fails
                    }
                });
            }
        });
        return i18nData;
    }

    const I18N = getJsonI18N();

    // jQueryのDOMReady内で実行するのがより安全
    $(function() {
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
    document.write('<style type="text/css">' +
        'html,body {font-size:' + (fontunit < 30 ? fontunit : '30') + 'px;}' +
        (isDesktop ? '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position: absolute;}' :
            '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position:fixed;}@media screen and (orientation:landscape) {#landscape {display:none;}}') + // 元のlandscapeスタイルに修正
        '</style>');

    let map = {'d': 1, 'f': 2, 'j': 3, 'k': 4};
    if (isDesktop) {
        if (!document.getElementById('gameBody')) { // gameBodyがなければ書き出す
            document.write('<div id="gameBody"></div>');
        }
        document.onkeydown = function (e) {
            let key = e.key.toLowerCase();
            // 元のコード: Object.keys(map).indexOf(key) !== -1
            if (map.hasOwnProperty(key)) { // より効率的なキー存在確認
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
        body.style.height = window.innerHeight + 'px';

        transform = typeof (body.style.webkitTransform) !== 'undefined' ? 'webkitTransform' : (typeof (body.style.msTransform) !==
        'undefined' ? 'msTransform' : 'transform');
        transitionDuration = transform.replace(/ransform/g, 'ransitionDuration');

        GameTimeLayer = document.getElementById('GameTimeLayer');
        GameLayerBG = document.getElementById('GameLayerBG');

        GameLayer = []; // 配列をクリアして再設定
        const gameLayer1 = document.getElementById('GameLayer1');
        const gameLayer2 = document.getElementById('GameLayer2');

        if (gameLayer1 && gameLayer2) {
            GameLayer.push(gameLayer1);
            GameLayer[0].children = GameLayer[0].querySelectorAll('div.block'); // クラス block を持つ子要素のみ
            GameLayer.push(gameLayer2);
            GameLayer[1].children = GameLayer[1].querySelectorAll('div.block');
        } else {
            console.error("GameLayer1 or GameLayer2 not found in init(). Check createGameLayer().");
            return; // 初期化に失敗したら中断
        }

        if (GameLayerBG) {
            if (GameLayerBG.ontouchstart === null) {
                GameLayerBG.ontouchstart = gameTapEvent;
            } else {
                GameLayerBG.onmousedown = gameTapEvent;
            }
        } else {
            console.error("GameLayerBG not found in init().");
            return;
        }

        gameInit();
        initSetting();
        window.addEventListener('resize', refreshSize, false);
    }

    function getMode() { // 元のコードのまま
        const gameModeFromCookie = cookie('gameMode');
        return gameModeFromCookie ? parseInt(gameModeFromCookie) : MODE_NORMAL;
    }

    function getSoundMode() { // 元のコードのまま
        return cookie('soundMode') || 'on'; // デフォルト 'on'
    }

    w.changeSoundMode = function() { // 元のコードのまま
        soundMode = (soundMode === 'on' ? 'off' : 'on');
        if (I18N) $('#sound').text(I18N[soundMode === 'on' ? 'sound-on' : 'sound-off']);
        cookie('soundMode', soundMode, 100); // 保存期間を100日に
    }

    function modeToString(m) { // 元のコードのまま
        if (!I18N) return "Mode"; // フォールバック
        return m === MODE_NORMAL ? I18N['normal'] : (m === MODE_ENDLESS ? I18N['endless'] : I18N['practice']);
    }

    w.changeMode = function(m) { // 元のコードのまま
        mode = m;
        cookie('gameMode', m, 100); // 保存期間を100日に
        $('#mode').text(modeToString(m));
    }

    w.readyBtn = function() { // 元のコードのまま
        closeWelcomeLayer();
        updatePanel();
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
    function refreshSize() { // 元のコードのまま
        clearTimeout(refreshSizeTime);
        refreshSizeTime = setTimeout(_refreshSize, 200);
    }

    function _refreshSize() { // 元のコードのまま (要素存在チェックは追加済み)
        if (!body) body = document.getElementById('gameBody') || document.body;
        if (!body || body.offsetWidth === 0) return;
        countBlockSize();
        if (blockSize <= 0) return;
        if (GameLayer.length < 2 || !GameLayer[0] || !GameLayer[1] || !GameLayer[0].children || !GameLayer[1].children) return;

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
        let y = ((_gameBBListIndex) % 10) * blockSize;
        f.y = y;
        f.style[transform] = 'translate3D(0,' + f.y + 'px,0)';
        a.y = f.y - blockSize * Math.floor(f.children.length / 4) ; // f.children.lengthで1レイヤーのブロック数を取得
        a.style[transform] = 'translate3D(0,' + a.y + 'px,0)';
    }

    function countBlockSize() { // 元のコードのまま (要素存在チェックは追加済み)
        if (!body) body = document.getElementById('gameBody') || document.body;
        if (!body || body.offsetWidth === 0) return;
        blockSize = body.offsetWidth / 4;
        body.style.height = window.innerHeight + 'px';
        if (GameLayerBG) GameLayerBG.style.height = window.innerHeight + 'px';
        touchArea[0] = window.innerHeight;
        touchArea[1] = window.innerHeight - blockSize * 3;
    }

    let _gameBBList = [], _gameBBListIndex = 0, _gameOver = false, _gameStart = false,
        _gameSettingNum = 20, _gameTime, _gameTimeNum, _gameScore, _date1, deviationTime;
    let _gameStartTime, _gameStartDatetime;

    function gameInit() { // 元のコードのまま
        if (typeof createjs !== 'undefined' && createjs.Sound) {
            createjs.Sound.registerSound({ src: "./static/music/err.mp3", id: "err" });
            createjs.Sound.registerSound({ src: "./static/music/end.mp3", id: "end" });
            createjs.Sound.registerSound({ src: "./static/music/tap.mp3", id: "tap" });
        }
        gameRestart();
    }

    function gameRestart() { // 元のコードのまま (要素存在チェックは追加済み)
        _gameBBList = []; _gameBBListIndex = 0; _gameScore = 0;
        _gameOver = false; _gameStart = false;
        _gameSettingNum = parseInt(cookie('gameTime')) || 20;
        _gameTimeNum = _gameSettingNum;
        _gameStartTime = 0; _date1 = null; deviationTime = 0;

        if (GameLayer.length < 2 || !GameLayer[0] || !GameLayer[1]) { return; }
        
        countBlockSize();
        if (blockSize > 0 && GameLayer[0].children && GameLayer[1].children) {
            refreshGameLayer(GameLayer[0]);
            refreshGameLayer(GameLayer[1], 1);
        }
        updatePanel();
    }

    function gameStart() { // 元のコードのまま
        _date1 = new Date();
        _gameStartDatetime = _date1.getTime();
        _gameStart = true;
        _gameStartTime = 0;
        if(_gameTime) clearInterval(_gameTime);
        _gameTime = setInterval(timer, 1000);
    }

    function getCPS() { // 元のコードのまま
        const elapsedTime = (new Date().getTime() - _gameStartDatetime) / 1000;
        if (elapsedTime <= 0 || _gameScore === 0) return 0;
        let cps = _gameScore / elapsedTime;
        return isNaN(cps) || !isFinite(cps) || _gameStartTime < 2 ? 0 : cps; // 元の < 2 を尊重
    }

    function timer() { // 元のコードのまま (要素存在チェックは追加済み)
        _gameTimeNum--;
        _gameStartTime++;
        if (mode === MODE_NORMAL && _gameTimeNum <= 0) {
            if (GameTimeLayer && I18N) GameTimeLayer.innerHTML = (I18N['time-up'] || 'Time Up!') + '!';
            gameOver();
            if (GameLayerBG) GameLayerBG.classList.add('flash'); // className += は避ける
            if (soundMode === 'on' && createjs && createjs.Sound) createjs.Sound.play("end");
        }
        updatePanel();
    }

    function updatePanel() { // 元のコードのまま (要素存在チェックは追加済み)
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
        } else {
            GameTimeLayer.innerHTML = `SCORE:${_gameScore}`;
        }
    }

    function focusOnReplay(){ // 元の関数名 foucusOnReplay のタイポを修正
        const replayBtnEl = document.getElementById('replay');
        if (replayBtnEl) replayBtnEl.focus();
    }

    function gameOver() { // 元のコードのまま
        _gameOver = true;
        if(_gameTime) clearInterval(_gameTime);
        let cps = getCPS();
        updatePanel();
        setTimeout(function () {
            if (GameLayerBG) GameLayerBG.classList.remove('flash'); // className = '' は避ける
            showGameScoreLayer(cps);
            focusOnReplay(); // 修正後の関数名
        }, 1500);
    }

    // ★★★ Removed: encrypt function ★★★

    function createTimeText(n) { // 元のコードのまま
        return 'TIME:' + Math.max(0, Math.ceil(n));
    }

    let _ttreg = / t{1,2}(\d+)/,
        _clearttClsReg = / t{1,2}\d+| bad/;

    function refreshGameLayer(box, loop, offset) { // 元のコードのまま (当たり判定に影響するため)
        if (!box || !box.children || blockSize <= 0) return;
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
                r.className += ' t' + (Math.floor(Math.random() * 5) + 1); // 1-5
                r.notEmpty = true;
                i = (Math.floor(j / 4) + 1) * 4 + Math.floor(Math.random() * 4); // 0-3
            }
        }
        if (loop) {
            box.style[transitionDuration] = '0ms';
            box.style.display = 'none';
            box.y = -blockSize * (Math.floor(box.children.length / 4) + (offset || 0)); // loopは1のはず
            box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
            setTimeout(function () { // 元のコードは2段階setTimeoutだが、1段階で十分か
                box.style.display = 'block';
            }, 50); // 元のコードの遅延を参考に調整
        } else {
            box.y = 0;
            box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
        }
        box.style[transitionDuration] = '150ms';
    }

    function gameLayerMoveNextRow() { // 元のコードのまま (当たり判定に影響するため)
        for (let i = 0; i < GameLayer.length; i++) {
            let g = GameLayer[i];
            if (!g || !g.children) continue;
            g.y += blockSize;
            if (g.y > blockSize * (Math.floor(g.children.length / 4))) {
                refreshGameLayer(g, 1, -1);
            } else {
                g.style[transform] = 'translate3D(0,' + g.y + 'px,0)';
            }
        }
    }

    function gameTapEvent(e) { // 元のコードのまま (当たり判定ロジック)
        if (_gameOver) return false;
        let tar = e.target;
        let eventY = e.clientY || (e.targetTouches && e.targetTouches[0] ? e.targetTouches[0].clientY : 0);
        let eventX = (e.clientX || (e.targetTouches && e.targetTouches[0] ? e.targetTouches[0].clientX : 0)) - (body ? body.offsetLeft : 0);
        if (_gameBBList.length === 0 || _gameBBListIndex >= _gameBBList.length) return false;
        let p = _gameBBList[_gameBBListIndex];
        if ((touchArea[1] === undefined || blockSize <= 0) && body && body.offsetWidth > 0) countBlockSize();
        if (touchArea[1] !== undefined && (eventY > touchArea[0] || eventY < touchArea[1])) return false;

        const correctBlackTileElement = document.getElementById(p.id); // 押すべきタイル
        let successfulTap = false;

        // 元のコードの判定:
        // (p.id === tar.id && tar.notEmpty) // 黒タイル直接タップ
        // || (p.cell === 0 && eventX < blockSize) // 1列目タップ
        // || ... (2,3,4列目タップ)

        if (correctBlackTileElement && correctBlackTileElement.notEmpty) {
            if (tar && tar.id === p.id) { // 黒タイルを直接タップ
                successfulTap = true;
            } else { // 黒タイル以外をタップしたが、正しい列かもしれない
                const col = Math.floor(eventX / blockSize);
                if (p.cell === col) {
                    // 元のコードはこの場合も成功としていた。
                    // 本来は、この列の正しい黒タイル(correctBlackTileElement)をタップしたことになるべき。
                    // tarがGameLayerBGなどでもこの条件に入りうる。
                    successfulTap = true; // 元の挙動を維持
                }
            }
        }

        if (successfulTap) {
            if (!_gameStart) gameStart();
            if (soundMode === 'on' && createjs && createjs.Sound) createjs.Sound.play("tap");
            correctBlackTileElement.className = correctBlackTileElement.className.replace(_ttreg, ' tt$1');
            correctBlackTileElement.notEmpty = false;
            _gameBBListIndex++;
            _gameScore++;
            updatePanel();
            gameLayerMoveNextRow();
        } else if (_gameStart && tar && tar.classList && tar.classList.contains('block') && !tar.notEmpty) {
            // 白いタイルをタップ (tar.notEmptyがfalseのblock)
            if (soundMode === 'on' && createjs && createjs.Sound) createjs.Sound.play("err");
            tar.classList.add('bad');
            if (mode === MODE_PRACTICE) {
                setTimeout(() => { tar.classList.remove('bad'); }, 500);
            } else {
                gameOver();
            }
        }
        // その他のケース（押すべきでない黒タイルをタップ、など）は元のコードでは明示的に処理されていない
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
        $('#welcome').css('display', 'block'); // HTMLのCSSに合わせて'block' or 'flex'
    }

    function getBestScore(currentScore) { // 元のコードのまま (bast-scoreのtypo修正済み)
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
            const lastBlock = $(`#${lastTappedBlockId}`);
            if(lastBlock.length > 0) {
                const classAttr = lastBlock.attr('class');
                if (classAttr) {
                    const cMatch = classAttr.match(_ttreg);
                    if (cMatch && cMatch[1]) {
                        gameScoreLayer.attr('class', 'BBOX SHADE bgc' + cMatch[1]);
                    } else { gameScoreLayer.attr('class', 'BBOX SHADE bgc1'); }
                } else { gameScoreLayer.attr('class', 'BBOX SHADE bgc1'); }
            } else { gameScoreLayer.attr('class', 'BBOX SHADE bgc1'); }
        } else { gameScoreLayer.attr('class', 'BBOX SHADE bgc1'); }
        
        $('#GameScoreLayer-text').html(shareText(cps)); // ここでSupabase送信が呼ばれる

        let scoreVal = (mode === MODE_ENDLESS ? cps : _gameScore);
        let best = getBestScore(scoreVal);
        let normalCond = mode !== MODE_NORMAL || legalDeviationTime();
        gameScoreLayer.css('color', normalCond ? '' : 'red');
        $('#cps').text(cps.toFixed(2));
        $('#score').text(scoreToString(_gameScore));
        $('#GameScoreLayer-score').css('display', mode === MODE_ENDLESS ? 'none' : 'flex');
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
            if (!_date1) _date1 = date2;
            deviationTime = (date2.getTime() - _date1.getTime());
            if (!legalDeviationTime()) {
                return (I18N ? I18N['time-over'] : 'Time over by: ') + ((deviationTime / 1000) - _gameSettingNum).toFixed(2) + 's';
            }
            SubmitResultsToSupabase(); // ★★★ Supabaseへの送信関数を呼び出す ★★★
        }
        if (!I18N) return "Score: " + cps.toFixed(2);
        if (cps <= 5) return I18N['text-level-1'] || 'Level 1';
        if (cps <= 8) return I18N['text-level-2'] || 'Level 2';
        if (cps <= 10) return I18N['text-level-3'] || 'Level 3';
        if (cps <= 15) return I18N['text-level-4'] || 'Level 4';
        return I18N['text-level-5'] || 'Level 5';
    }

    function toStr(obj) { // 元のコードのまま
        if (typeof obj === 'object') {
            try { return JSON.stringify(obj); } catch(e) { return String(obj); }
        } else { return String(obj); }
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
                let nameEQ = name + "="; let ca = document.cookie.split(';');
                for (let i = 0; i < ca.length; i++) {
                    let c = ca[i]; while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                    if (c.indexOf(nameEQ) === 0) {
                        let valStr = unescape(c.substring(nameEQ.length, c.length));
                        try {
                            if ((valStr.startsWith('{') && valStr.endsWith('}')) || (valStr.startsWith('[') && valStr.endsWith(']'))) return JSON.parse(valStr);
                            if (!isNaN(parseFloat(valStr)) && isFinite(valStr)) return parseFloat(valStr);
                        } catch (e) { /* ignore */ }
                        return valStr;
                    }
                } return null;
            }
        }
        let data = {}; let ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) { let pair = ca[i].split('='); if(pair.length === 2) data[pair[0].trim()] = unescape(pair[1]); }
        return data;
    }

    function initSetting() { // 元のコードのまま
        $("#username").val(cookie("username") || "");
        $("#message").val(cookie("message") || "");
        const titleCookie = cookie("title");
        if (titleCookie) { $('title').text(titleCookie); $('#title').val(titleCookie); }
        const keyboardCookie = cookie("keyboard");
        if (keyboardCookie) {
            const keyboardStr = String(keyboardCookie).toLowerCase();
            $("#keyboard").val(keyboardStr);
            if (keyboardStr.length === 4) {
                map = {}; map[keyboardStr.charAt(0)] = 1; map[keyboardStr.charAt(1)] = 2; map[keyboardStr.charAt(2)] = 3; map[keyboardStr.charAt(3)] = 4;
            }
        }
        const gameTimeCookie = cookie('gameTime');
        if (gameTimeCookie) {
            const parsedTime = parseInt(gameTimeCookie);
            if (!isNaN(parsedTime) && parsedTime > 0) { $('#gameTime').val(parsedTime); _gameSettingNum = parsedTime; }
        }
    }

    w.show_btn = function() { // 元のコードのまま
        $('#btn_group').css('display', 'flex'); // HTML側の d-grid や d-flex に合わせる
        $('#desc').css('display', 'block');
        $('#setting').css('display', 'none');
    }

    w.show_setting = function() { // 元のコードのまま
        $('#btn_group').css('display', 'none');
        $('#desc').css('display', 'none');
        $('#setting').css('display', 'block');
        if (I18N) $('#sound').text(soundMode === 'on' ? (I18N['sound-on'] || 'Sound ON') : (I18N['sound-off'] || 'Sound OFF'));
    }

    w.save_cookie = function() { // 元のコードのまま
        const settings = ['username', 'message', 'keyboard', 'title', 'gameTime'];
        for (let s of settings) {
            let value = $(`#${s}`).val();
            if (value !== null && value !== undefined) { cookie(s, String(value).trim(), 100); }
        }
        const gameTimeVal = $('#gameTime').val();
        if (gameTimeVal) {
            const newGameTime = parseInt(gameTimeVal);
            if(!isNaN(newGameTime) && newGameTime > 0) _gameSettingNum = newGameTime;
        }
        initSetting();
    }

    // isnull は元のコードで w.goRank で使われていたが、goRank は削除したので、isnull も不要なら削除可
    function isnull(val) {
        if (val === null || val === undefined) return true;
        let str = String(val).replace(/(^\s*)|(\s*$)/g, '');
        return str === '';
    }

    function click(index) { // 元のコードのまま (当たり判定に影響するため)
        if (!welcomeLayerClosed || _gameOver) return;
        if (_gameBBList.length === 0 || _gameBBListIndex >= _gameBBList.length) return;
        let p = _gameBBList[_gameBBListIndex];
        const currentBlockElement = document.getElementById(p.id);
        if (!currentBlockElement) return;
        const parentLayer = currentBlockElement.parentElement;
        if (!parentLayer) return;
        const currentBlockNumAttr = currentBlockElement.getAttribute("num");
        if (currentBlockNumAttr === null) return;
        const currentBlockNum = parseInt(currentBlockNumAttr);
        const rowStartNum = currentBlockNum - p.cell;
        const targetNumInRow = index - 1;
        const targetNumGlobal = rowStartNum + targetNumInRow;
        let targetBlockElement = null;
        // Find target block by iterating through children, matching 'num' attribute
        for (let i = 0; i < parentLayer.children.length; i++) {
            const child = parentLayer.children[i];
            if (child.getAttribute("num") === String(targetNumGlobal)) {
                targetBlockElement = child;
                break;
            }
        }
        if (!targetBlockElement) return;
        let fakeEvent = {
            target: targetBlockElement,
            clientX: (targetNumInRow + 0.5) * blockSize + (body ? body.offsetLeft : 0),
            clientY: (touchArea[1] !== undefined ? (touchArea[0] + touchArea[1]) / 2 : window.innerHeight / 2) // フォールバック
        };
        gameTapEvent(fakeEvent);
    }

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
