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
        const usernameVal = ($("#username").val() || '').trim(); // Get value from HTML input
        const messageVal = ($("#message").val() || '').trim();   // Get value from HTML input

        if (!usernameVal) {
            // console.log("Username not entered in settings. Score will not be submitted to Supabase.");
            // alert("ユーザー名が設定画面で入力されていません。スコアはランキングに登録されません。"); // Optional: Notify user
            return; // Do not submit if username is empty
        }

        const scoreToSubmit = _gameScore; // Use the current game score

        // console.log(`Attempting to submit to Supabase: Name=${usernameVal}, Score=${scoreToSubmit}, Comment=${messageVal}`);

        const { data, error } = await supaClient
            .from('leaderboard') // Ensure this is your table name
            .insert([
                { name: usernameVal, score: scoreToSubmit, comment: messageVal }
                // created_at is expected to be set by DB (DEFAULT now())
            ]);

        if (error) {
            console.error('Supabase score submission error:', error);
            alert('スコアの保存に失敗しました。エラー: ' + error.message);
        } else {
            // console.log('Supabase score submission successful:', data);
            // alert('スコアがランキングに保存されました！'); // Optional: Notify user of success
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
        
        let i18nData = null; // Initialize to null
        $.ajax({
            url: `./static/i18n/${lang}.json`,
            dataType: 'json',
            method: 'GET',
            async: false, // Synchronous: Blocks execution until complete.
            success: function(data) { i18nData = data; }, // Assign to local i18nData
            error: function() {
                // alert('找不到语言文件: ' + lang); // Original alert
                console.warn('Language file not found: ' + lang + '.json. Falling back to English.');
                $.ajax({
                    url: `./static/i18n/en.json`,
                    dataType: 'json',
                    method: 'GET',
                    async: false,
                    success: function(data) { i18nData = data; },
                    error: function() {
                        console.error('English language file also not found.');
                        i18nData = {}; // Assign empty object to prevent errors
                    }
                });
            }
        });
        return i18nData;
    }

    const I18N = getJsonI18N();

    // Apply I18N texts after DOM is ready
    $(function() {
        if (I18N) { // Check if I18N was loaded successfully
            $('[data-i18n]').each(function() {
                const key = this.dataset.i18n;
                if (I18N[key] !== undefined) {
                    $(this).text(I18N[key]);
                }
            });
            $('[data-placeholder-i18n]').each(function() {
                const key = this.dataset.placeholderI18n;
                if (I18N[key] !== undefined) {
                    $(this).attr('placeholder', I18N[key]);
                }
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
        // ゲーム要素を中央揃えするために追加したCSS
        '#gameBody {margin:0 auto; max-width:100%; position:relative;} ' +
        '#GameLayerBG {margin:0 auto; position:relative;} ' +
        (isDesktop ? '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position: absolute;}' :
            '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position:fixed;}@media screen and (orientation:landscape) {#landscape {display: box; display: -webkit-box; display: -moz-box; display: -ms-flexbox;}}') +
        '</style>');

    let map = {'d': 1, 'f': 2, 'j': 3, 'k': 4};
    if (isDesktop) {
        document.write('<div id="gameBody">'); // オリジナルに合わせて開始タグだけを書き込む
        document.onkeydown = function (e) {
            let key = e.key.toLowerCase();
            if (Object.keys(map).indexOf(key) !== -1) {
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
        // オリジナルコードに合わせて実装
        showWelcomeLayer();
        body = document.getElementById('gameBody') || document.body;
        body.style.height = window.innerHeight + 'px';

        transform = typeof (body.style.webkitTransform) != 'undefined' ? 'webkitTransform' : (typeof (body.style.msTransform) !=
        'undefined' ? 'msTransform' : 'transform');
        transitionDuration = transform.replace(/ransform/g, 'ransitionDuration');

        GameTimeLayer = document.getElementById('GameTimeLayer');
        GameLayer.push(document.getElementById('GameLayer1'));
        GameLayer[0].children = GameLayer[0].querySelectorAll('div');
        GameLayer.push(document.getElementById('GameLayer2'));
        GameLayer[1].children = GameLayer[1].querySelectorAll('div');
        GameLayerBG = document.getElementById('GameLayerBG');

        if (GameLayerBG) {
            if (GameLayerBG.ontouchstart === null) {
                GameLayerBG.ontouchstart = gameTapEvent;
            } else {
                GameLayerBG.onmousedown = gameTapEvent;
            }
        } else {
            console.error("GameLayerBG not found in init.");
            return;
        }

        gameInit();
        initSetting();
        window.addEventListener('resize', refreshSize, false);
    }

    function getMode() { // Original
        return cookie('gameMode') ? parseInt(cookie('gameMode')) : MODE_NORMAL;
    }

    function getSoundMode() { // Original
        return cookie('soundMode') ? cookie('soundMode') : 'on';
    }

    w.changeSoundMode = function() { // Original
        if (soundMode === 'on') {
            soundMode = 'off';
            $('#sound').text(I18N['sound-off']);
        } else {
            soundMode = 'on';
            $('#sound').text(I18N['sound-on']);
        }
        cookie('soundMode', soundMode);
    }

    function modeToString(m) { // Original
        return m === MODE_NORMAL ? I18N['normal'] : (m === MODE_ENDLESS ? I18N['endless'] : I18N['practice']);
    }

    w.changeMode = function(m) { // Original
        mode = m;
        cookie('gameMode', m);
        $('#mode').text(modeToString(m));
    }

    w.readyBtn = function() { // Original
        closeWelcomeLayer();
        updatePanel();
    }

    w.winOpen = function() { // Original
        window.open(location.href + '?r=' + Math.random(), 'nWin', 'height=500,width=320,toolbar=no,menubar=no,scrollbars=no');
        let opened = window.open('about:blank', '_self');
        if (opened) {
            opened.opener = null;
            opened.close();
        }
    }

    let refreshSizeTime; // Original
    function refreshSize() { clearTimeout(refreshSizeTime); refreshSizeTime = setTimeout(_refreshSize, 200); }

    function _refreshSize() { // Original logic, with fixes for original
        if (!body) body = document.getElementById('gameBody') || document.body;
        if (!body || body.offsetWidth === 0) return;
        countBlockSize();
        if (blockSize <= 0) return;
        if (GameLayer.length < 2 || !GameLayer[0].children || !GameLayer[1].children) return;

        for (let i = 0; i < GameLayer.length; i++) {
            let box = GameLayer[i];
            for (let j = 0; j < box.children.length; j++) {
                let r = box.children[j],
                    rstyle = r.style;
                rstyle.left = (j % 4) * blockSize + 'px';
                rstyle.bottom = Math.floor(j / 4) * blockSize + 'px';
                rstyle.width = blockSize + 'px';
                rstyle.height = blockSize + 'px';
            }
        }
        let f, a;
        if (GameLayer[0].y > GameLayer[1].y) {
            f = GameLayer[0];
            a = GameLayer[1];
        } else {
            f = GameLayer[1];
            a = GameLayer[0];
        }
        let y = ((_gameBBListIndex) % 10) * blockSize;
        f.y = y;
        f.style[transform] = 'translate3D(0,' + f.y + 'px,0)';
        a.y = -blockSize * Math.floor(f.children.length / 4) + y;
        a.style[transform] = 'translate3D(0,' + a.y + 'px,0)';
    }

    function countBlockSize() { // Original logic, with checks
        if (!body) body = document.getElementById('gameBody') || document.body;
        if (!body || body.offsetWidth === 0) return;
        blockSize = body.offsetWidth / 4;
        body.style.height = window.innerHeight + 'px';
        if (GameLayerBG) GameLayerBG.style.height = window.innerHeight + 'px';
        touchArea[0] = window.innerHeight;
        touchArea[1] = window.innerHeight - blockSize * 3;
    }

    let _gameBBList = [], _gameBBListIndex = 0, _gameOver = false, _gameStart = false,
        _gameSettingNum=20, _gameTime, _gameTimeNum, _gameScore, _date1, deviationTime;
    let _gameStartTime, _gameStartDatetime;

    function gameInit() { // Original
        if (typeof createjs !== 'undefined' && createjs.Sound) {
            createjs.Sound.registerSound({
                src: "./static/music/err.mp3",
                id: "err"
            });
            createjs.Sound.registerSound({
                src: "./static/music/end.mp3",
                id: "end"
            });
            createjs.Sound.registerSound({
                src: "./static/music/tap.mp3",
                id: "tap"
            });
        }
        gameRestart();
    }

    function gameRestart() { // Original, with checks
        _gameBBList = [];
        _gameBBListIndex = 0;
        _gameScore = 0;
        _gameOver = false;
        _gameStart = false;
        _gameSettingNum = parseInt(cookie('gameTime')) || 20;
        _gameTimeNum = _gameSettingNum;
        _gameStartTime = 0;
        _date1 = null;
        deviationTime = 0;
        countBlockSize();
        refreshGameLayer(GameLayer[0]);
        refreshGameLayer(GameLayer[1], 1);
        updatePanel();
    }

    function gameStart() { // Original
        _date1 = new Date();
        _gameStartDatetime = _date1.getTime();
        _gameStart = true;
        _gameStartTime = 0;
        if (_gameTime) clearInterval(_gameTime);
        _gameTime = setInterval(timer, 1000);
    }

    function getCPS() { // Original
        let cps = _gameScore / ((new Date().getTime() - _gameStartDatetime) / 1000);
        if (isNaN(cps) || cps === Infinity || _gameStartTime < 2) {
            cps = 0;
        }
        return cps;
    }

    function timer() { // Original, with checks
        _gameTimeNum--;
        _gameStartTime++;
        if (mode === MODE_NORMAL && _gameTimeNum <= 0) {
            if (GameTimeLayer && I18N) GameTimeLayer.innerHTML = (I18N['time-up'] || 'Time Up') + '!';
            gameOver();
            if (GameLayerBG) GameLayerBG.className += ' flash'; // fork元に合わせてclassNameで操作
            if (soundMode === 'on' && createjs?.Sound) createjs.Sound.play("end");
        }
        updatePanel();
    }

    function updatePanel() { // Original, with checks
        if (!GameTimeLayer) GameTimeLayer = document.getElementById('GameTimeLayer');
        if (!GameTimeLayer || !I18N) return;
        if (mode === MODE_NORMAL) {
            if (!_gameOver) GameTimeLayer.innerHTML = createTimeText(_gameTimeNum);
        } else if (mode === MODE_ENDLESS) {
            let cps = getCPS();
            let text = (cps === 0 && _gameScore === 0 ? (I18N['calculating'] || 'Calculating...') : cps.toFixed(2));
            GameTimeLayer.innerHTML = `CPS:${text}`;
        } else {
            GameTimeLayer.innerHTML = `SCORE:${_gameScore}`;
        }
    }

    function foucusOnReplay(){ // fork元に合わせてスペルも同じにする
        $('#replay').focus();
    }

    function gameOver() { // fork元に合わせて実装
        _gameOver = true; 
        clearInterval(_gameTime);
        let cps = getCPS(); 
        updatePanel();
        setTimeout(function () {
            GameLayerBG.className = ''; // fork元に合わせてclassNameで操作
            showGameScoreLayer(cps);
            foucusOnReplay();
        }, 1500);
    }

    function createTimeText(n) { return 'TIME:' + Math.ceil(n); } // Original

    let _ttreg = / t{1,2}(\d+)/, _clearttClsReg = / t{1,2}\d+| bad/; // Original

    function refreshGameLayer(box, loop, offset) { // Fork元に完全に合わせる
        if (!box?.children || blockSize <= 0) return;
        let i = Math.floor(Math.random() * 1000) % 4 + (loop ? 0 : 4);
        for (let j = 0; j < box.children.length; j++) {
            let r = box.children[j],
                rstyle = r.style;
            rstyle.left = (j % 4) * blockSize + 'px';
            rstyle.bottom = Math.floor(j / 4) * blockSize + 'px';
            rstyle.width = blockSize + 'px';
            rstyle.height = blockSize + 'px';
            r.className = r.className.replace(_clearttClsReg, '');
            if (i === j) {
                _gameBBList.push({
                    cell: i % 4,
                    id: r.id
                });
                r.className += ' t' + (Math.floor(Math.random() * 1000) % 5 + 1);
                r.notEmpty = true;
                i = (Math.floor(j / 4) + 1) * 4 + Math.floor(Math.random() * 1000) % 4;
            } else {
                r.notEmpty = false;
            }
        }
        if (loop) {
            box.style.webkitTransitionDuration = '0ms';
            box.style.display = 'none';
            box.y = -blockSize * (Math.floor(box.children.length / 4) + (offset || 0)) * loop;
            setTimeout(function () {
                box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
                setTimeout(function () {
                    box.style.display = 'block';
                }, 100);
            }, 200);
        } else {
            box.y = 0;
            box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
        }
        box.style[transitionDuration] = '150ms';
    }

    function gameLayerMoveNextRow() { // Original logic
        for (let i = 0; i < GameLayer.length; i++) {
            let g = GameLayer[i]; if (!g?.children) continue;
            g.y += blockSize;
            if (g.y > blockSize * (Math.floor(g.children.length / 4))) {
                refreshGameLayer(g, 1, -1);
            } else { g.style[transform] = 'translate3D(0,' + g.y + 'px,0)'; }
        }
    }

    function gameTapEvent(e) { // fork元に完全に合わせた実装
        if (_gameOver) {
            return false;
        }
        let tar = e.target;
        let eventY = e.clientY || (e.targetTouches && e.targetTouches[0] ? e.targetTouches[0].clientY : 0);
        let eventX = (e.clientX || (e.targetTouches && e.targetTouches[0] ? e.targetTouches[0].clientX : 0)) - (body ? body.offsetLeft : 0);
        
        if (_gameBBList.length === 0 || _gameBBListIndex >= _gameBBList.length) return false;
        let p = _gameBBList[_gameBBListIndex];
        
        if (touchArea[1] !== undefined && (eventY > touchArea[0] || eventY < touchArea[1])) {
            return false;
        }

        if ((p.id === tar.id && tar.notEmpty) || 
            (p.cell === 0 && eventX < blockSize) || 
            (p.cell === 1 && eventX > blockSize && eventX < 2 * blockSize) || 
            (p.cell === 2 && eventX > 2 * blockSize && eventX < 3 * blockSize) || 
            (p.cell === 3 && eventX > 3 * blockSize)) {
            
            if (!_gameStart) {
                gameStart();
            }
            
            if (soundMode === 'on' && createjs?.Sound) {
                createjs.Sound.play("tap");
            }
            
            tar = document.getElementById(p.id);
            if (tar) {
                tar.className = tar.className.replace(_ttreg, ' tt$1');
                tar.notEmpty = false;
            }
            
            _gameBBListIndex++;
            _gameScore++;
            
            updatePanel();
            gameLayerMoveNextRow();
        } else if (_gameStart && !tar.notEmpty) {
            if (soundMode === 'on' && createjs?.Sound) {
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

    function createGameLayer() { // Original
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

    function closeWelcomeLayer() { /* Original */ 
        welcomeLayerClosed = true;
        $('#welcome').css('display', 'none');
        updatePanel();
    }

    function showWelcomeLayer() { /* Original */
        welcomeLayerClosed = false;
        $('#mode').text(modeToString(mode));
        $('#welcome').css('display', 'block');
    }

    function getBestScore(currentScore) {
        // 修正: フォーク元では 'bast-score' だが、正しくは 'best-score'
        let cookieName = (mode === MODE_NORMAL ? 'best-score' : 'endless-best-score');
        let best = cookie(cookieName) ? Math.max(parseFloat(cookie(cookieName)), currentScore) : currentScore;
        cookie(cookieName, best.toFixed(2), 100);
        return best;
    }

    function scoreToString(s) { /* Original */ 
        return mode === MODE_ENDLESS ? parseFloat(s).toFixed(2) : String(Math.floor(s));
    }

    function legalDeviationTime() { /* Original */ 
        return deviationTime < (_gameSettingNum + 3) * 1000;
    }

    function showGameScoreLayer(cps) { // Original, with minor jQuery safety
        let l = $('#GameScoreLayer');
        let c = $(`#${_gameBBList[_gameBBListIndex - 1].id}`).attr('class').match(_ttreg)[1];
        let score = (mode === MODE_ENDLESS ? cps : _gameScore);
        let best = getBestScore(score);
        l.attr('class', l.attr('class').replace(/bgc\d/, 'bgc' + c));
        $('#GameScoreLayer-text').html(shareText(cps)); // Calls Supabase submission
        let normalCond = legalDeviationTime() || mode !== MODE_NORMAL;
        l.css('color', normalCond ? '': 'red');

        $('#cps').text(cps.toFixed(2));
        $('#score').text(scoreToString(score));
        $('#GameScoreLayer-score').css('display', mode === MODE_ENDLESS ? 'none' : '');
        $('#best').text(scoreToString(best));

        l.css('display', 'block');
    }

    function hideGameScoreLayer() { /* Original */ 
        $('#GameScoreLayer').css('display', 'none');
    }

    w.replayBtn = function() { /* Original */ 
        gameRestart();
        hideGameScoreLayer();
    }

    w.backBtn = function() { /* Original */ 
        gameRestart();
        hideGameScoreLayer();
        showWelcomeLayer();
    }

    function shareText(cps) { // Modified for Supabase
        if (mode === MODE_NORMAL) {
            let date2 = new Date(); 
            if (!_date1) _date1 = date2;
            deviationTime = (date2.getTime() - _date1.getTime());
            if (!legalDeviationTime()) {
                return (I18N ? I18N['time-over'] : 'Time over by: ') + ((deviationTime / 1000) - _gameSettingNum).toFixed(2) + 's';
            }
            SubmitResultsToSupabase(); // ★★★ Supabase送信 ★★★
        }
        if (!I18N) return "Score: " + cps.toFixed(2);
        if (cps <= 5) return I18N['text-level-1'] || 'Lvl 1'; 
        if (cps <= 8) return I18N['text-level-2'] || 'Lvl 2';
        if (cps <= 10) return I18N['text-level-3'] || 'Lvl 3'; 
        if (cps <= 15) return I18N['text-level-4'] || 'Lvl 4';
        return I18N['text-level-5'] || 'Lvl 5';
    }

    function toStr(obj) { /* Original */ 
        if (typeof obj === 'object') {
            return JSON.stringify(obj);
        } else {
            return obj;
        }
    }

    function cookie(name, value, time) {
        if (name) {
            if (value) {
                if (time) {
                    let date = new Date();
                    date.setTime(date.getTime() + 864e5 * time), time = date.toGMTString();
                }
                return document.cookie = name + "=" + escape(toStr(value)) + (time ? "; expires=" + time + (arguments[3] ?
                    "; domain=" + arguments[3] + (arguments[4] ? "; path=" + arguments[4] + (arguments[5] ? "; secure" : "") : "") :
                    "") : ""), !0;
            }
            return value = document.cookie.match("(?:^|;)\\s*" + name.replace(/([-.*+?^${}()|[\]\/\\])/g, "\\$1") + "=([^;]*)"),
                value = value && "string" == typeof value[1] ? unescape(value[1]) : !1, (/^(\{|\[).+\}|\]$/.test(value) ||
                /^[0-9]+$/g.test(value)) && eval("value=" + value), value;
        }
        let data = {};
        value = document.cookie.replace(/\s/g, "").split(";");
        for (let i = 0; value.length > i; i++) name = value[i].split("="), name[1] && (data[name[0]] = unescape(name[1]));
        return data;
    }

    document.write(createGameLayer()); // オリジナルに合わせて直接書き込み

    function initSetting() { /* Original */
        $("#username").val(cookie("username") ? cookie("username") : "");
        $("#message").val(cookie("message") ? cookie("message") : "");
        if (cookie("title")) {
            $('title').text(cookie('title'));
            $('#title').val(cookie('title'));
        }
        let keyboard = cookie('keyboard');
        if (keyboard) {
            keyboard = keyboard.toString().toLowerCase();
            $("#keyboard").val(keyboard);
            map = {}
            map[keyboard.charAt(0)] = 1;
            map[keyboard.charAt(1)] = 2;
            map[keyboard.charAt(2)] = 3;
            map[keyboard.charAt(3)] = 4;
        }
        if (cookie('gameTime')) {
            $('#gameTime').val(cookie('gameTime'));
            _gameSettingNum = parseInt(cookie('gameTime'));
            gameRestart();
        }
    }

    w.show_btn = function() { /* Original */
        $("#btn_group,#desc").css('display', 'block');
        $('#setting').css('display', 'none');
    }

    w.show_setting = function() { /* Original */
        $('#btn_group,#desc').css('display', 'none');
        $('#setting').css('display', 'block');
        $('#sound').text(soundMode === 'on' ? I18N['sound-on'] : I18N['sound-off']);
    }

    w.save_cookie = function() { /* Original */
        const settings = ['username', 'message', 'keyboard', 'title', 'gameTime'];
        for (let s of settings) {
            let value=$(`#${s}`).val();
            if(value){
                cookie(s, value.toString(), 100);
            }
        }
        initSetting();
    }

    function isnull(val) { /* Original */ 
        let str = val.replace(/(^\s*)|(\s*$)/g, '');
        return str === '' || str === undefined || str == null;
    }

    w.goRank = function() { /* Original */
        let name = $("#username").val();
        let link = './rank.php';
        if (!isnull(name)) {
            link += "?name=" + name;
        }
        window.location.href = link;
    }

    function click(index) { /* Original logic (with target block finding adjusted) */
        if (!welcomeLayerClosed || _gameOver || _gameBBList.length === 0 || _gameBBListIndex >= _gameBBList.length) return;
        let p = _gameBBList[_gameBBListIndex];
        const currentBlockEl = document.getElementById(p.id); if (!currentBlockEl) return;
        const parentEl = currentBlockEl.parentElement; if (!parentEl) return;
        const currentBlockNumAttr = currentBlockEl.getAttribute("num"); if(currentBlockNumAttr === null) return;
        const currentBlockNum = parseInt(currentBlockNumAttr);
        const rowStartNum = currentBlockNum - p.cell;
        const targetCol = index - 1;
        const targetGlobalNum = rowStartNum + targetCol;
        let targetEl = null;
        for (let i = 0; i < parentEl.children.length; i++) {
            if (parentEl.children[i].getAttribute("num") === String(targetGlobalNum)) {
                targetEl = parentEl.children[i]; break;
            }
        }
        if (!targetEl) return;
        let fakeEvent = {
            clientX: ((index - 1) * blockSize + index * blockSize) / 2 + body.offsetLeft,
            // 確実にタップエリア内にするため
            clientY: (touchArea[0] + touchArea[1]) / 2,
            target: targetEl,
        };
        gameTapEvent(fakeEvent);
    }

    const clickBeforeStyle = $('<style></style>');
    const clickAfterStyle = $('<style></style>');
    clickBeforeStyle.appendTo($(document.head));
    clickAfterStyle.appendTo($(document.head));

    function saveImage(dom, callback) { /* Original */ 
        if (dom.files && dom.files[0]) {
            let reader = new FileReader();
            reader.onload = function() {
                callback(this.result);
            }
            reader.readAsDataURL(dom.files[0]);
        }
    }

    w.getClickBeforeImage = function() { /* Original */ 
        $('#click-before-image').click();
    }

    w.saveClickBeforeImage = function() { /* Original */
        const i = document.getElementById('click-before-image');
        saveImage(i, r => {
            clickBeforeStyle.html(`
                .t1, .t2, .t3, .t4, .t5 {
                   background-size: auto 100%;
                   background-image: url(${r});
            }`);
        });
    }

    w.getClickAfterImage = function() { /* Original */ 
        $('#click-after-image').click();
    }

    w.saveClickAfterImage = function() { /* Original */
        const i = document.getElementById('click-after-image');
        saveImage(i, r => {
            clickAfterStyle.html(`
                .tt1, .tt2, .tt3, .tt4, .tt5 {
                  background-size: auto 86%;
                  background-image: url(${r});
            }`);
        });
    }

})(window);
