// IMPORTANT: Make sure to include the Supabase SDK in your HTML file before this script:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const MODE_NORMAL = 1, MODE_ENDLESS = 2, MODE_PRACTICE = 3;

// ─── Supabase Client Initialization ───
const SUPABASE_URL = 'https://pazuftgivpsfqekecfvt.supabase.co';
// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// IMPORTANT: REPLACE WITH YOUR ACTUAL SUPABASE ANONYMOUS KEY
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhenVmdGdpdnBzZnFla2VjZnZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NzUwNTUsImV4cCI6MjA2MjM1MTA1NX0.m_N4lzEf6rbSqN18oDre4MCx8MteakGfyvv9vs3p5EY';
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
            // alert("ユーザー名を[設定]で入力すると、スコアがランキングに登録されます。"); // Optional notification
            return; // Do not submit if username is not set in settings
        }
        // Cookieに保存する処理は initSetting と save_cookie に任せる
        // ここでは送信時に設定画面の値を使うことに集中

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
            // alert('スコアがランキングに保存されました！'); // Optional success notification
        }
    }
    // ─── End of Supabase Submit Score Function ───

    function getJsonI18N() {
        const LANGUAGES = [
            { regex: /^zh\b/, lang: 'zh' },
            { regex: /^ja\b/, lang: 'ja' },
            { regex: /.*/, lang: 'en'}
        ];
        const lang = LANGUAGES.find(l => l.regex.test(navigator.language)).lang;
        
        let i18nData = null;
        $.ajax({
            url: `./static/i18n/${lang}.json`,
            dataType: 'json',
            method: 'GET',
            async: false,
            success: data => i18nData = data,
            error: () => {
                // console.warn('言語ファイルの読み込みに失敗: ' + lang + '.json. 英語をデフォルトとします。');
                alert('言語ファイルの読み込みに失敗: ' + lang + '.json. 英語をデフォルトとします。');
                $.ajax({
                    url: `./static/i18n/en.json`,
                    dataType: 'json',
                    method: 'GET',
                    async: false,
                    success: data => i18nData = data,
                    error: () => {
                        // console.error('英語の言語ファイルも読み込めませんでした。');
                        alert('英語の言語ファイルも読み込めませんでした。');
                        i18nData = {};
                    }
                });
            }
        });
        return i18nData;
    }

    const I18N = getJsonI18N();

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

    let isDesktop = !navigator['userAgent'].match(/(ipad|iphone|ipod|android|windows phone)/i);
    let fontunit = isDesktop ? 20 : ((window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth) / 320) * 10;
    document.write('<style type="text/css">' +
        'html,body {font-size:' + (fontunit < 30 ? fontunit : '30') + 'px;}' +
        (isDesktop ? '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position: absolute;}' :
            '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position:fixed;}@media screen and (orientation:landscape) {#landscape {display: box; display: -webkit-box; display: -moz-box; display: -ms-flexbox;}}') +
        '</style>');

    let map = {'d': 1, 'f': 2, 'j': 3, 'k': 4};
    if (isDesktop) {
        document.write('<div id="gameBody"></div>');
        document.onkeydown = function (e) {
            let key = e.key.toLowerCase();
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
        if (!document.getElementById('GameLayerBG')) {
             document.body.insertAdjacentHTML('afterbegin', createGameLayer());
        }
        showWelcomeLayer();
        body = document.getElementById('gameBody') || document.body;
        body.style.height = window.innerHeight + 'px';
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
            GameLayer[0].children = GameLayer[0].querySelectorAll('div');
            GameLayer.push(gameLayer2);
            GameLayer[1].children = GameLayer[1].querySelectorAll('div');
        } else {
            console.error("GameLayer1 or GameLayer2 not found in init().");
            return;
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
        if (!body) body = document.getElementById('gameBody') || document.body;
        if (!body || body.offsetWidth === 0) return;
        countBlockSize();
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
        a.y = -blockSize * Math.floor(f.children.length / 4) + y;
        a.style[transform] = 'translate3D(0,' + a.y + 'px,0)';
    }

    function countBlockSize() {
        if (!body) body = document.getElementById('gameBody') || document.body;
        if (!body || body.offsetWidth === 0) return;
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
        _gameSettingNum = 20,
        _gameTime, _gameTimeNum, _gameScore, _date1, deviationTime;
    let _gameStartTime, _gameStartDatetime;

    function gameInit() {
        if (typeof createjs !== 'undefined' && createjs.Sound) {
            createjs.Sound.registerSound({ src: "./static/music/err.mp3", id: "err" });
            createjs.Sound.registerSound({ src: "./static/music/end.mp3", id: "end" });
            createjs.Sound.registerSound({ src: "./static/music/tap.mp3", id: "tap" });
        }
        gameRestart();
    }

    function gameRestart() {
        _gameBBList = [];
        _gameBBListIndex = 0;
        _gameScore = 0;
        _gameOver = false;
        _gameStart = false;
        _gameSettingNum = parseInt(cookie('gameTime')) || 20;
        _gameTimeNum = _gameSettingNum;
        _gameStartTime = 0;
        if (GameLayer.length < 2 || !GameLayer[0] || !GameLayer[1]) {
            const gameLayer1 = document.getElementById('GameLayer1');
            const gameLayer2 = document.getElementById('GameLayer2');
            if (gameLayer1 && gameLayer2) {
                GameLayer = [gameLayer1, gameLayer2];
                GameLayer[0].children = GameLayer[0].querySelectorAll('div');
                GameLayer[1].children = GameLayer[1].querySelectorAll('div');
            } else {
                return; 
            }
        }
        countBlockSize();
        if (blockSize > 0 && GameLayer.length === 2 && GameLayer[0].children && GameLayer[1].children) {
            refreshGameLayer(GameLayer[0]);
            refreshGameLayer(GameLayer[1], 1);
        }
        updatePanel();
    }

    function gameStart() {
        _date1 = new Date();
        _gameStartDatetime = _date1.getTime();
        _gameStart = true;
        if(_gameTime) clearInterval(_gameTime);
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
            if (GameTimeLayer && I18N) GameTimeLayer.innerHTML = (I18N['time-up'] || 'Time Up!') + '!';
            gameOver();
            if (GameLayerBG) GameLayerBG.classList.add('flash');
            if (soundMode === 'on' && createjs && createjs.Sound) createjs.Sound.play("end");
        }
        updatePanel();
    }

    function updatePanel() {
        if (!GameTimeLayer) GameTimeLayer = document.getElementById('GameTimeLayer');
        if (!GameTimeLayer) return;
        if (mode === MODE_NORMAL) {
            if (!_gameOver) {
                GameTimeLayer.innerHTML = createTimeText(_gameTimeNum);
            }
        } else if (mode === MODE_ENDLESS) {
            let cps = getCPS();
            let text = (cps === 0 && _gameScore === 0 ? (I18N ? I18N['calculating'] : 'Calculating...') : cps.toFixed(2));
            GameTimeLayer.innerHTML = `CPS:${text}`;
        } else {
            GameTimeLayer.innerHTML = `SCORE:${_gameScore}`;
        }
    }

    function focusOnReplay(){ // Corrected typo from foucusOnReplay
        const replayBtnEl = document.getElementById('replay');
        if (replayBtnEl) replayBtnEl.focus();
    }

    function gameOver() {
        _gameOver = true;
        if(_gameTime) clearInterval(_gameTime);
        let cps = getCPS();
        updatePanel();
        setTimeout(function () {
            if (GameLayerBG) GameLayerBG.classList.remove('flash');
            showGameScoreLayer(cps);
            focusOnReplay(); // Corrected typo
        }, 1500);
    }

    function createTimeText(n) {
        return 'TIME:' + Math.max(0, Math.ceil(n));
    }

    let _ttreg = / t{1,2}(\d+)/,
        _clearttClsReg = / t{1,2}\d+| bad/;

    function refreshGameLayer(box, loop, offset) {
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
                r.className += ' t' + (Math.floor(Math.random() * 5) + 1);
                r.notEmpty = true;
                i = (Math.floor(j / 4) + 1) * 4 + Math.floor(Math.random() * 4);
            }
        }
        if (loop) {
            box.style[transitionDuration] = '0ms';
            box.style.display = 'none';
            box.y = -blockSize * (Math.floor(box.children.length / 4) + (offset || 0)) * loop;
            setTimeout(function () {
                box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
                box.style.display = 'block';
            }, 100);
        } else {
            box.y = 0;
            box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
        }
        box.style[transitionDuration] = '150ms';
    }

    function gameLayerMoveNextRow() {
        for (let i = 0; i < GameLayer.length; i++) {
            let g = GameLayer[i];
            if (!g) continue; // g が null または undefined の場合スキップ
            g.y += blockSize;
            if (g.y > blockSize * (Math.floor(g.children.length / 4))) {
                refreshGameLayer(g, 1, -1);
            } else {
                g.style[transform] = 'translate3D(0,' + g.y + 'px,0)';
            }
        }
    }

    function gameTapEvent(e) {
        if (_gameOver) return false;
        let tar = e.target;
        let y = e.clientY || (e.targetTouches && e.targetTouches[0] ? e.targetTouches[0].clientY : 0);
        let x = (e.clientX || (e.targetTouches && e.targetTouches[0] ? e.targetTouches[0].clientX : 0)) - (body ? body.offsetLeft : 0);
        if (_gameBBList.length === 0 || _gameBBListIndex >= _gameBBList.length) return false;
        let p = _gameBBList[_gameBBListIndex];
        if (touchArea[1] === undefined && body && body.offsetWidth > 0) countBlockSize();
        if (touchArea[1] !== undefined && (y > touchArea[0] || y < touchArea[1])) return false;

        // Determine the actual block that was tapped (tar might be a child, or GameLayerBG)
        let tappedBlockElement = tar;
        // If tar is not a .block, try to find the .block based on x, y (more complex, original logic relied on event target or x-coord ranges)
        // The original logic for column checking:
        // (p.cell === 0 && x < blockSize) || ...
        // This implies a tap anywhere in the correct column, on the correct row, is a valid tap for the black tile.
        // Let's try to get the specific block in the column.
        const col = Math.floor(x / blockSize);
        if (tar && !tar.classList.contains('block')) { // If tap was on GameLayerBG
            // Find block in this column in the active row
            const activeRowOffset = Math.floor(p.cell / 4) * 4; // This assumes p.cell is global index in a layer
                                                              // This needs to be based on visible row.
                                                              // The original logic is a bit ambiguous here.
                                                              // For simplicity, we assume `tar` is the block itself if it's a block.
                                                              // If it's not a block, the `p.id === tar.id` check will fail.
        }


        if (tar && ((p.id === tar.id && tar.notEmpty) || // Case 1: Tapped directly on the correct black block
            // Case 2: Tapped in the correct column for the black block (original logic)
            (tar.id !== p.id && !tar.notEmpty && p.cell === col && tar.classList && tar.classList.contains('block')) // Tapped white block in correct column (Error case)
           )) {

            let actualTargetBlock = document.getElementById(p.id); // Always refer to the *expected* black block
            if (!actualTargetBlock) return false;

            if (actualTargetBlock.notEmpty && (p.id === tar.id || p.cell === col) ) { // Successfully tapped the black block (or its column)
                 if (!_gameStart) gameStart();
                if (soundMode === 'on' && createjs && createjs.Sound) createjs.Sound.play("tap");
                actualTargetBlock.className = actualTargetBlock.className.replace(_ttreg, ' tt$1');
                actualTargetBlock.notEmpty = false;
                _gameBBListIndex++;
                _gameScore++;
                updatePanel();
                gameLayerMoveNextRow();
            } else if (_gameStart && tar.classList && tar.classList.contains('block') && !tar.notEmpty) { // Tapped a white block
                if (soundMode === 'on' && createjs && createjs.Sound) createjs.Sound.play("err");
                tar.classList.add('bad');
                if (mode === MODE_PRACTICE) {
                    setTimeout(() => { tar.classList.remove('bad'); }, 500);
                } else {
                    gameOver();
                }
            }

        } else if (_gameStart && tar && tar.classList && tar.classList.contains('block') && !tar.notEmpty && tar.id !== p.id) {
            // Tapped a black block that was NOT the target (e.g. a future one) - This is an error
            if (soundMode === 'on' && createjs && createjs.Sound) createjs.Sound.play("err");
            tar.classList.add('bad');
             if (mode === MODE_PRACTICE) {
                setTimeout(() => { tar.classList.remove('bad'); }, 500);
            } else {
                gameOver();
            }
        } else if (_gameStart && tar && tar.classList && tar.classList.contains('block') && !tar.notEmpty) {
             // Tapped a white block (already handled above, but as a fallback)
            if (soundMode === 'on' && createjs && createjs.Sound) createjs.Sound.play("err");
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
        $('#welcome').css('display', 'block');
    }

    function getBestScore(currentScore) {
        let cookieName = (mode === MODE_NORMAL ? 'best-score' : 'endless-best-score');
        let best = parseFloat(cookie(cookieName)) || 0;
        if (currentScore > best) {
            best = currentScore;
            cookie(cookieName, best.toFixed(mode === MODE_ENDLESS ? 2 : 0), 100);
        }
        return best;
    }

    function scoreToString(s) {
        return mode === MODE_ENDLESS ? parseFloat(s).toFixed(2) : String(Math.floor(s));
    }

    function legalDeviationTime() {
        return _date1 ? deviationTime < (_gameSettingNum + 3) * 1000 : true;
    }

    function showGameScoreLayer(cps) {
        const gameScoreLayer = $('#GameScoreLayer');
        if (_gameBBList.length > 0 && _gameBBListIndex > 0 && _gameBBList[_gameBBListIndex - 1]) {
            const lastTappedBlockId = _gameBBList[_gameBBListIndex - 1].id;
            const lastBlock = $(`#${lastTappedBlockId}`);
            if(lastBlock.length > 0) {
                const cMatch = lastBlock.attr('class').match(/tt(\d)/);
                if (cMatch && cMatch[1]) {
                    gameScoreLayer.attr('class', (idx, oldClass) => (oldClass || '').replace(/bgc\d/, '') + ' bgc' + cMatch[1] + ' BBOX SHADE');
                }
            }
        } else {
             gameScoreLayer.attr('class', 'BBOX SHADE bgc1'); // Default if no block found
        }
        
        $('#GameScoreLayer-text').html(shareText(cps));
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

    function shareText(cps) {
        if (mode === MODE_NORMAL) {
            let date2 = new Date();
            if (!_date1) _date1 = date2;
            deviationTime = (date2.getTime() - _date1.getTime());
            if (!legalDeviationTime()) {
                return (I18N ? I18N['time-over'] : 'Time over by: ') + ((deviationTime / 1000) - _gameSettingNum).toFixed(2) + 's';
            }
            SubmitResultsToSupabase(); // Call the Supabase submission function
        }
        if (!I18N) return "Score: " + cps.toFixed(2);
        if (cps <= 5) return I18N['text-level-1'];
        if (cps <= 8) return I18N['text-level-2'];
        if (cps <= 10) return I18N['text-level-3'];
        if (cps <= 15) return I18N['text-level-4'];
        return I18N['text-level-5'];
    }

    function toStr(obj) {
        if (typeof obj === 'object') {
            try { return JSON.stringify(obj); } catch(e) { return String(obj); }
        } else {
            return String(obj);
        }
    }

    function cookie(name, value, timeInDays) {
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
                        try {
                            if ((valStr.startsWith('{') && valStr.endsWith('}')) || (valStr.startsWith('[') && valStr.endsWith(']'))) {
                                return JSON.parse(valStr);
                            }
                            if (!isNaN(parseFloat(valStr)) && isFinite(valStr)) {
                                return parseFloat(valStr);
                            }
                        } catch (e) { /* ignore */ }
                        return valStr;
                    }
                }
                return null;
            }
        }
        let data = {};
        let ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
             let pair = ca[i].split('=');
             if(pair.length === 2) data[pair[0].trim()] = unescape(pair[1]);
        }
        return data;
    }

    function initSetting() {
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
                _gameSettingNum = parsedTime;
            }
        }
    }

    w.show_btn = function() {
        $('#btn_group').css('display', 'flex'); // Assuming HTML uses d-flex for btn_group
        $('#desc').css('display', 'block');
        $('#setting').css('display', 'none');
    }

    w.show_setting = function() {
        $('#btn_group').css('display', 'none');
        $('#desc').css('display', 'none');
        $('#setting').css('display', 'block'); // Or 'flex' if CSS uses it
        if (I18N) $('#sound').text(soundMode === 'on' ? (I18N['sound-on'] || 'Sound ON') : (I18N['sound-off'] || 'Sound OFF'));
    }

    w.save_cookie = function() {
        const settings = ['username', 'message', 'keyboard', 'title', 'gameTime'];
        for (let s of settings) {
            let value = $(`#${s}`).val();
            if (value !== null && value !== undefined) {
                cookie(s, String(value).trim(), 100);
            }
        }
        const gameTimeVal = $('#gameTime').val();
        if (gameTimeVal) {
            const newGameTime = parseInt(gameTimeVal);
            if(!isNaN(newGameTime) && newGameTime > 0) _gameSettingNum = newGameTime;
        }
        initSetting();
    }

    function click(index) {
        if (!welcomeLayerClosed || _gameOver) return;
        if (_gameBBList.length === 0 || _gameBBListIndex >= _gameBBList.length) return;
        let p = _gameBBList[_gameBBListIndex];
        const currentBlockElement = document.getElementById(p.id);
        if (!currentBlockElement) return;
        const parentLayer = currentBlockElement.parentElement;
        if (!parentLayer) return;
        const currentBlockNum = parseInt(currentBlockElement.getAttribute('num'));
        const rowStartNum = currentBlockNum - p.cell;
        const targetNumInRow = index - 1;
        const targetNumGlobal = rowStartNum + targetNumInRow;
        let targetBlockElement = null;
        for (let child of parentLayer.children) {
            if (parseInt(child.getAttribute('num')) === targetNumGlobal) {
                targetBlockElement = child;
                break;
            }
        }
        if (!targetBlockElement) return;
        let fakeEvent = {
            target: targetBlockElement,
            clientX: (targetNumInRow + 0.5) * blockSize + (body ? body.offsetLeft : 0),
            clientY: (touchArea[0] + touchArea[1]) / 2
        };
        gameTapEvent(fakeEvent);
    }

    const clickBeforeStyle = $('<style id="clickBeforeStyleInjectedByJS"></style>').appendTo($(document.head));
    const clickAfterStyle = $('<style id="clickAfterStyleInjectedByJS"></style>').appendTo($(document.head));

    function saveImage(dom, callback) {
        if (dom.files && dom.files[0]) {
            let reader = new FileReader();
            reader.onload = function() { callback(this.result); }
            reader.readAsDataURL(dom.files[0]);
        }
    }

    w.getClickBeforeImage = function() {
        $('#click-before-image').trigger('click');
    }

    w.saveClickBeforeImage = function() {
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

    w.getClickAfterImage = function() {
        $('#click-after-image').trigger('click');
    }

    w.saveClickAfterImage = function() {
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
