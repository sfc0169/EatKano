// IMPORTANT: Make sure to include the Supabase SDK in your HTML file before this script:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const MODE_NORMAL = 1, MODE_ENDLESS = 2, MODE_PRACTICE = 3;

// ─── Supabase Client Initialization (Moved to the top of the IIFE) ───
const SUPABASE_URL = 'https://pazuftgivpsfqekecfvt.supabase.co';
// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// IMPORTANT: REPLACE WITH YOUR ACTUAL SUPABASE ANONYMOUS KEY
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhenVmdGdpdnBzZnFla2VjZnZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NzUwNTUsImV4cCI6MjA2MjM1MTA1NX0.m_N4lzEf6rbSqN18oDre4MCx8MteakGfyvv9vs3p5EY';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
const supaClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// ─── End of Supabase Client Initialization ───

(function(w) {

    // ─── New Supabase Submit Score Function ───
    async function submitScore(score) {
        const name = cookie('username') || prompt('お名前を入力してください (ランキング登録)');
        if (!name) {
            alert('名前が入力されなかったため、スコアは保存されませんでした。');
            return;
        }
        cookie('username', name, 100); // Save username for next time

        const commentElement = document.getElementById('message'); // Get comment from input field
        const comment = commentElement ? (commentElement.value || '').trim() : '';

        const { data, error } = await supaClient
            .from('leaderboard') // Ensure this table name matches your Supabase table
            .insert([
                { name: name, score: score, comment: comment }
                // created_at will be set automatically by Supabase (DEFAULT now())
            ]);

        if (error) {
            console.error('スコア保存エラー:', error);
            alert('スコアの保存に失敗しました。エラー: ' + error.message);
        } else {
            // console.log('スコア保存成功:', data);
            // alert('スコアが保存されました！'); // Optional: Notify user of success
        }
    }
    // ─── End of New Supabase Submit Score Function ───

    function getJsonI18N() {
        const LANGUAGES = [
            { regex: /^zh\b/, lang: 'zh' },
            { regex: /^ja\b/, lang: 'ja' },
            { regex: /.*/, lang: 'en'}
        ];
        const lang = LANGUAGES.find(l => l.regex.test(navigator.language)).lang;
        
        let i18nData = null;
        $.ajax({
            url: `./static/i18n/${lang}.json`, // Ensure this path is correct
            dataType: 'json',
            method: 'GET',
            async: false, // Note: Synchronous AJAX is generally discouraged
            success: data => i18nData = data,
            error: () => {
                alert('言語ファイルの読み込みに失敗: ' + lang + '.json. 英語をデフォルトとします。');
                // Fallback to English if preferred language file fails
                $.ajax({
                    url: `./static/i18n/en.json`,
                    dataType: 'json',
                    method: 'GET',
                    async: false,
                    success: data => i18nData = data,
                    error: () => {
                        alert('英語の言語ファイルも読み込めませんでした。');
                        i18nData = {}; // Empty object to prevent further errors
                    }
                });
            }
        });
        return i18nData;
    }

    const I18N = getJsonI18N();

    $('[data-i18n]').each(function() {
        const key = this.dataset.i18n;
        if (I18N && I18N[key]) {
            $(this).text(I18N[key]);
        }
    });

    $('[data-placeholder-i18n]').each(function() {
        const key = this.dataset.placeholderI18n;
        if (I18N && I18N[key]) {
            $(this).attr('placeholder', I18N[key]);
        }
    });

    if (I18N && I18N['lang']) {
        $('html').attr('lang', I18N['lang']);
    }

    let isDesktop = !navigator['userAgent'].match(/(ipad|iphone|ipod|android|windows phone)/i);
    let fontunit = isDesktop ? 20 : ((window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth) / 320) * 10;
    // document.write for styles is generally not recommended, consider moving to CSS file or <style> tag in <head>
    document.write('<style type="text/css">' +
        'html,body {font-size:' + (fontunit < 30 ? fontunit : '30') + 'px;}' +
        (isDesktop ? '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position: absolute;}' :
            '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position:fixed;}@media screen and (orientation:landscape) {#landscape {display: box; display: -webkit-box; display: -moz-box; display: -ms-flexbox;}}') +
        '</style>');

    let map = {'d': 1, 'f': 2, 'j': 3, 'k': 4};
    if (isDesktop) {
        // Consider creating #gameBody in HTML and just attaching event listener
        document.write('<div id="gameBody"></div>');
        document.onkeydown = function (e) {
            let key = e.key.toLowerCase();
            if (Object.keys(map).includes(key)) { // .includes is more modern than .indexOf !== -1
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
        // ① Insert game layer at the beginning of the body
        // This should be done only once.
        if (!document.getElementById('GameLayerBG')) { // Check if already inserted
             document.body.insertAdjacentHTML('afterbegin', createGameLayer());
        }

        showWelcomeLayer(); // ② Show welcome screen

        body = document.getElementById('gameBody') || document.body;
        body.style.height = window.innerHeight + 'px';
        transform = typeof (body.style.webkitTransform) !== 'undefined' ? 'webkitTransform' : (typeof (body.style.msTransform) !==
        'undefined' ? 'msTransform' : 'transform');
        transitionDuration = transform.replace(/ransform/g, 'ransitionDuration');

        GameTimeLayer = document.getElementById('GameTimeLayer');
        GameLayerBG = document.getElementById('GameLayerBG'); // GameLayerBG should exist now

        // GameLayers should be re-fetched or ensured they exist after createGameLayer
        GameLayer = []; // Clear previous GameLayer array
        const gameLayer1 = document.getElementById('GameLayer1');
        const gameLayer2 = document.getElementById('GameLayer2');

        if (gameLayer1 && gameLayer2) {
            GameLayer.push(gameLayer1);
            GameLayer[0].children = GameLayer[0].querySelectorAll('div');
            GameLayer.push(gameLayer2);
            GameLayer[1].children = GameLayer[1].querySelectorAll('div');
        } else {
            console.error("GameLayer1 or GameLayer2 not found after creating game layer.");
            return; // Stop initialization if layers are not found
        }

        if (GameLayerBG) {
            if (GameLayerBG.ontouchstart === null) {
                GameLayerBG.ontouchstart = gameTapEvent;
            } else {
                GameLayerBG.onmousedown = gameTapEvent;
            }
        } else {
            console.error("GameLayerBG not found.");
            return;
        }

        gameInit();
        initSetting();
        window.addEventListener('resize', refreshSize, false);
    }

    function getMode() {
        return cookie('gameMode') ? parseInt(cookie('gameMode')) : MODE_NORMAL;
    }

    function getSoundMode() {
        return cookie('soundMode') || 'on'; // Default to 'on' if not set
    }

    w.changeSoundMode = function() {
        soundMode = (soundMode === 'on' ? 'off' : 'on');
        $('#sound').text(I18N[soundMode === 'on' ? 'sound-on' : 'sound-off']);
        cookie('soundMode', soundMode, 100);
    }

    function modeToString(m) {
        if (m === MODE_ENDLESS) return I18N['endless'];
        if (m === MODE_PRACTICE) return I18N['practice'];
        return I18N['normal']; // Default to normal
    }

    w.changeMode = function(m) {
        mode = m;
        cookie('gameMode', m, 100);
        $('#mode').text(modeToString(m));
    }

    w.readyBtn = function() {
        closeWelcomeLayer();
        // gameRestart(); // Consider if gameRestart is needed here or on first tap
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
        countBlockSize();
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
        let y = ((_gameBBListIndex) % 10) * blockSize; // Assuming _gameBBListIndex is row-like
        f.y = y;
        f.style[transform] = 'translate3D(0,' + f.y + 'px,0)';
        a.y = -blockSize * Math.floor(f.children.length / 4) + y;
        a.style[transform] = 'translate3D(0,' + a.y + 'px,0)';
    }

    function countBlockSize() {
        if (!body || body.offsetWidth === 0) { // Ensure body is available and has width
             // console.warn("countBlockSize called before body is ready or has width.");
             // Try to get body again if it was not available
             body = document.getElementById('gameBody') || document.body;
             if (!body || body.offsetWidth === 0) return; // Still not ready
        }
        blockSize = body.offsetWidth / 4;
        body.style.height = window.innerHeight + 'px';
        if (GameLayerBG) GameLayerBG.style.height = window.innerHeight + 'px';
        touchArea[0] = window.innerHeight; // Full height
        touchArea[1] = window.innerHeight - blockSize * 3; // Top of the 3rd row from bottom
    }

    let _gameBBList = [],
        _gameBBListIndex = 0,
        _gameOver = false,
        _gameStart = false,
        _gameSettingNum = 20, // Default game time for normal mode
        _gameTime, _gameTimeNum, _gameScore, _date1, deviationTime;

    let _gameStartTime, _gameStartDatetime; // Used for CPS calculation

    function gameInit() {
        // Ensure createjs.Sound is available
        if (typeof createjs !== 'undefined' && createjs.Sound) {
            createjs.Sound.registerSound({ src: "./static/music/err.mp3", id: "err" });
            createjs.Sound.registerSound({ src: "./static/music/end.mp3", id: "end" });
            createjs.Sound.registerSound({ src: "./static/music/tap.mp3", id: "tap" });
        } else {
            console.warn("CreateJS Sound library not found. Sounds will not play.");
        }
        gameRestart();
    }

    function gameRestart() {
        _gameBBList = [];
        _gameBBListIndex = 0;
        _gameScore = 0;
        _gameOver = false;
        _gameStart = false;
        _gameTimeNum = parseInt(cookie('gameTime')) || _gameSettingNum; // Use saved game time or default
        _gameStartTime = 0; // For CPS calculation: elapsed game time in seconds

        if (GameLayer.length < 2) {
            // console.error("Game layers not initialized for gameRestart.");
            // Try to re-init them, though this indicates an earlier setup issue.
            const gameLayer1 = document.getElementById('GameLayer1');
            const gameLayer2 = document.getElementById('GameLayer2');
            if (gameLayer1 && gameLayer2) {
                GameLayer = [gameLayer1, gameLayer2];
                GameLayer[0].children = GameLayer[0].querySelectorAll('div');
                GameLayer[1].children = GameLayer[1].querySelectorAll('div');
            } else {
                return; // Cannot proceed
            }
        }
        
        countBlockSize(); // Recalculate sizes
        if (blockSize > 0) { // Ensure blockSize is valid before refreshing layers
            refreshGameLayer(GameLayer[0]);
            refreshGameLayer(GameLayer[1], 1);
        } else {
            // console.warn("BlockSize is 0, cannot refresh game layers. Retrying countBlockSize.");
            // Attempt to recount block size, could be due to body not being fully rendered.
            setTimeout(() => {
                countBlockSize();
                if (blockSize > 0) {
                    refreshGameLayer(GameLayer[0]);
                    refreshGameLayer(GameLayer[1], 1);
                    updatePanel();
                } else {
                    // console.error("Failed to calculate blockSize even after delay.");
                }
            }, 100); // Short delay to allow DOM to settle
        }
        updatePanel();
    }

    function gameStart() {
        _date1 = new Date(); // Start time for deviation check
        _gameStartDatetime = _date1.getTime(); // Start timestamp for CPS
        _gameStart = true;
        if (_gameTime) clearInterval(_gameTime); // Clear any existing timer
        _gameTime = setInterval(timer, 1000);
    }

    function getCPS() {
        const elapsedTimeSeconds = (new Date().getTime() - _gameStartDatetime) / 1000;
        if (elapsedTimeSeconds <= 0 || _gameScore === 0) return 0; // Avoid division by zero or NaN early on
        let cps = _gameScore / elapsedTimeSeconds;
        return isNaN(cps) || !isFinite(cps) || _gameStartTime < 1 ? 0 : cps; // _gameStartTime is incremented by timer
    }

    function timer() {
        _gameTimeNum--;
        _gameStartTime++; // For CPS, elapsed seconds
        if (mode === MODE_NORMAL && _gameTimeNum <= 0) {
            GameTimeLayer.innerHTML = I18N['time-up'] ? I18N['time-up'] + '!' : 'Time Up!';
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
            let text = (cps === 0 && _gameScore === 0 ? (I18N['calculating'] || 'Calculating...') : cps.toFixed(2));
            GameTimeLayer.innerHTML = `CPS: ${text}`;
        } else { // MODE_PRACTICE
            GameTimeLayer.innerHTML = `SCORE: ${_gameScore}`;
        }
    }

    function foucusOnReplay(){
        const replayButton = document.getElementById('replay');
        if (replayButton) replayButton.focus();
    }

    function gameOver() {
        _gameOver = true;
        if (_gameTime) clearInterval(_gameTime);
        let cps = getCPS(); // Calculate CPS at game over
        // updatePanel(); // updatePanel is called by timer, or can be called here explicitly
        setTimeout(function () {
            if (GameLayerBG) GameLayerBG.classList.remove('flash');
            showGameScoreLayer(cps);
            foucusOnReplay();
        }, 1500);
    }

    // Removed: encrypt and SubmitResults (PHP-based)

    function createTimeText(n) {
        return `TIME: ${Math.max(0, Math.ceil(n))}`; // Ensure time is not negative
    }

    let _ttreg = / t{1,2}(\d+)/,
        _clearttClsReg = / t{1,2}\d+| bad/;

    function refreshGameLayer(box, loop, offset) {
        if (!box || !box.children || blockSize <= 0) {
             // console.error("Cannot refresh game layer, box or blockSize invalid.", box, blockSize);
             return;
        }
        let i = Math.floor(Math.random() * 1000) % 4 + (loop ? 0 : 4); // Start black tile in first or second row
        for (let j = 0; j < box.children.length; j++) {
            let r = box.children[j], rstyle = r.style;
            rstyle.left = (j % 4) * blockSize + 'px';
            rstyle.bottom = Math.floor(j / 4) * blockSize + 'px';
            rstyle.width = blockSize + 'px';
            rstyle.height = blockSize + 'px';
            r.className = r.className.replace(_clearttClsReg, '');
            r.notEmpty = false; // Reset notEmpty
            if (i === j) {
                _gameBBList.push({ cell: i % 4, id: r.id });
                r.className += ' t' + (Math.floor(Math.random() * 5) + 1); // t1 to t5
                r.notEmpty = true;
                i = (Math.floor(j / 4) + 1) * 4 + Math.floor(Math.random() * 4); // Next black tile in next row
            }
        }
        if (loop) {
            // box.style.webkitTransitionDuration = '0ms'; // Handled by transitionDuration
            box.style[transitionDuration] = '0ms';
            box.style.display = 'none';
            box.y = -blockSize * (Math.floor(box.children.length / 4) + (offset || 0)) * loop;
            setTimeout(function () {
                box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
                box.style.display = 'block'; // Show after repositioning
            }, 50); // A small delay might be needed for CSS to apply
        } else {
            box.y = 0;
            box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
        }
        box.style[transitionDuration] = '150ms'; // Default transition for movement
    }

    function gameLayerMoveNextRow() {
        _gameBBListIndex++; // Move to the next expected black block
        for (let i = 0; i < GameLayer.length; i++) {
            let g = GameLayer[i];
            g.y += blockSize;
            if (g.y >= blockSize * Math.floor(g.children.length / 4)) { // Corrected condition
                refreshGameLayer(g, 1, 0); // Offset 0 as y is already at the top
            } else {
                g.style[transform] = 'translate3D(0,' + g.y + 'px,0)';
            }
        }
    }

    function gameTapEvent(e) {
        if (_gameOver || _gameBBList.length === 0 || _gameBBListIndex >= _gameBBList.length) {
            return false;
        }
        let tar = e.target;
        let y = e.clientY || (e.targetTouches && e.targetTouches[0] ? e.targetTouches[0].clientY : 0);
        let x = (e.clientX || (e.targetTouches && e.targetTouches[0] ? e.targetTouches[0].clientX : 0)) - (body ? body.offsetLeft : 0);
        
        // Check if tap is within the game area (bottom 3 rows typically)
        // touchArea might not be set if countBlockSize hasn't run or body width was 0
        if (touchArea[1] === undefined) countBlockSize(); // Attempt to set touchArea
        if (y > touchArea[0] || y < touchArea[1]) {
             // console.log("Tap outside touch area");
             return false;
        }

        let p = _gameBBList[_gameBBListIndex];
        let tappedBlock = null;
        
        // Determine which block was tapped based on x coordinate
        const col = Math.floor(x / blockSize);

        if (p.cell === col && tar && (tar.id === p.id || tar.classList.contains('block'))) { // Check if tapped on the correct column
             tappedBlock = document.getElementById(p.id);
        }


        if (tappedBlock && tappedBlock.notEmpty) {
            if (!_gameStart) {
                gameStart();
            }
            if (soundMode === 'on' && createjs && createjs.Sound) {
                createjs.Sound.play("tap");
            }
            tappedBlock.className = tappedBlock.className.replace(_ttreg, ' tt$1'); // Change to "tapped" style
            tappedBlock.notEmpty = false; // Mark as tapped
            _gameScore++;
            updatePanel();
            gameLayerMoveNextRow();
        } else if (_gameStart) { // Tapped on a white block or wrong black block
            if (soundMode === 'on' && createjs && createjs.Sound) {
                createjs.Sound.play("err");
            }
            if(tar && tar.classList.contains('block') && !tar.notEmpty) { // Ensure it's a block and it's white
                tar.classList.add('bad');
            } else if (tar && tar.classList.contains('block') && tar.notEmpty && tar.id !== p.id) {
                // Tapped a future black block (should not happen with current logic, but good to handle)
                tar.classList.add('bad');
            }


            if (mode === MODE_PRACTICE) {
                setTimeout(() => {
                    if(tar && tar.classList) tar.classList.remove('bad');
                }, 500);
            } else {
                gameOver();
            }
        }
        return false; // Prevent default event behavior
    }

    function createGameLayer() {
        let html = '<div id="GameLayerBG">';
        for (let i = 1; i <= 2; i++) { // Two layers for continuous scrolling
            let id = 'GameLayer' + i;
            html += `<div id="${id}" class="GameLayer">`;
            for (let j = 0; j < 10; j++) { // 10 rows per layer
                for (let k = 0; k < 4; k++) { // 4 columns
                    html += `<div id="${id}-${k + j * 4}" num="${k + j * 4}" class="block${k ? ' bl' : ''}"></div>`;
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
        const welcomeDiv = document.getElementById('welcome');
        if (welcomeDiv) welcomeDiv.style.display = 'none';
        updatePanel(); // Update panel, especially if game starts immediately
    }

    function showWelcomeLayer() {
        welcomeLayerClosed = false;
        const modeButton = document.getElementById('mode');
        if (modeButton) modeButton.textContent = modeToString(mode);
        const welcomeDiv = document.getElementById('welcome');
        if (welcomeDiv) welcomeDiv.style.display = 'block'; // Or 'flex' if using flex for centering
    }

    function getBestScore(currentScore) {
        let cookieName = (mode === MODE_NORMAL ? 'best-score' : 'endless-best-score'); // Fixed typo bast-score
        let best = parseFloat(cookie(cookieName)) || 0;
        if (currentScore > best) {
            best = currentScore;
            cookie(cookieName, best.toFixed(mode === MODE_ENDLESS ? 2 : 0), 100);
        }
        return best;
    }

    function scoreToString(s) {
        return mode === MODE_ENDLESS ? s.toFixed(2) : String(Math.floor(s));
    }

    function legalDeviationTime() {
        // deviationTime is calculated in shareText, ensure _date1 is set
        return _date1 ? deviationTime < (_gameSettingNum + 3) * 1000 : true;
    }

    function showGameScoreLayer(cps) {
        const gameScoreLayer = $('#GameScoreLayer'); // jQuery object
        if (gameScoreLayer.length === 0) return;

        // Determine background color class based on last tapped block's style
        let colorClass = 'bgc1'; // Default
        if (_gameBBList.length > 0 && _gameBBListIndex > 0 && _gameBBList[_gameBBListIndex-1]) {
             const lastBlockId = _gameBBList[_gameBBListIndex-1].id;
             const lastBlock = $(`#${lastBlockId}`);
             if (lastBlock.length > 0) {
                const match = lastBlock.attr('class').match(/tt(\d)/); // tt1, tt2 etc.
                if (match && match[1]) colorClass = 'bgc' + match[1];
             }
        }
        
        gameScoreLayer.attr('class', (idx, oldClass) => (oldClass || '').replace(/bgc\d/, '') + ' ' + colorClass + ' BBOX SHADE');


        $('#GameScoreLayer-text').html(shareText(cps)); // This will call submitScore for MODE_NORMAL

        let scoreToDisplay = (mode === MODE_ENDLESS ? cps : _gameScore);
        let bestScore = getBestScore(scoreToDisplay); // Pass the relevant score for current mode

        $('#cps').text(cps.toFixed(2));
        $('#score').text(scoreToString(_gameScore)); // Always show _gameScore for "Score" field
        
        if (mode === MODE_ENDLESS) {
            $('#GameScoreLayer-score').css('display', 'none'); // Hide "Score" if endless, CPS is primary
        } else {
            $('#GameScoreLayer-score').css('display', 'flex'); // Show "Score"
        }
        $('#best').text(scoreToString(bestScore));

        // Color based on deviation time (only for normal mode)
        if (mode === MODE_NORMAL && !legalDeviationTime()) {
            gameScoreLayer.css('color', 'red');
        } else {
            gameScoreLayer.css('color', ''); // Reset to default (CSS defined)
        }

        gameScoreLayer.css('display', 'block'); // Or 'flex' if layout requires
    }

    function hideGameScoreLayer() {
        const gameScoreLayer = document.getElementById('GameScoreLayer');
        if (gameScoreLayer) gameScoreLayer.style.display = 'none';
    }

    w.replayBtn = function() {
        gameRestart();
        hideGameScoreLayer();
    }

    w.backBtn = function() { // This button might not exist in the current HTML
        gameRestart();
        hideGameScoreLayer();
        showWelcomeLayer();
    }

    function shareText(cps) { // Called from showGameScoreLayer
        if (mode === MODE_NORMAL) {
            let date2 = new Date();
            deviationTime = (date2.getTime() - (_date1 ? _date1.getTime() : date2.getTime()));
            if (!legalDeviationTime()) {
                return (I18N['time-over'] || 'Time over by: ') + ((deviationTime / 1000) - _gameSettingNum).toFixed(2) + 's';
            }
            // Submit score to Supabase if conditions are met (e.g., not practice mode)
            submitScore(_gameScore); // Moved Supabase submission here from original SubmitResults
        }

        // Text levels based on CPS
        if (cps <= 5) return I18N['text-level-1'] || 'Level 1: Keep trying!';
        if (cps <= 8) return I18N['text-level-2'] || 'Level 2: Good pace!';
        if (cps <= 10) return I18N['text-level-3'] || 'Level 3: Impressive!';
        if (cps <= 15) return I18N['text-level-4'] || 'Level 4: Awesome!';
        return I18N['text-level-5'] || 'Level 5: Master!';
    }

    function toStr(obj) {
        if (typeof obj === 'object') {
            try { return JSON.stringify(obj); } catch (e) { return String(obj); }
        } else {
            return String(obj);
        }
    }

    function cookie(name, value, timeInDays) {
        if (name) {
            if (value !== undefined) { // Set cookie
                let expires = "";
                if (timeInDays) {
                    let date = new Date();
                    date.setTime(date.getTime() + (timeInDays * 24 * 60 * 60 * 1000));
                    expires = "; expires=" + date.toUTCString();
                }
                document.cookie = name + "=" + (escape(toStr(value)) || "") + expires + "; path=/";
                return true;
            } else { // Get cookie
                let nameEQ = name + "=";
                let ca = document.cookie.split(';');
                for (let i = 0; i < ca.length; i++) {
                    let c = ca[i];
                    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                    if (c.indexOf(nameEQ) === 0) {
                        let valStr = unescape(c.substring(nameEQ.length, c.length));
                        try {
                            // Try to parse if it looks like JSON or a number
                            if ((/^(\{|\[).+\}|\]$/.test(valStr) || /^[0-9.]+$/g.test(valStr)) && !isNaN(parseFloat(valStr))) {
                                 return JSON.parse(valStr); // Prefer JSON.parse over eval
                            } else if (/^(\{|\[).+\}|\]$/.test(valStr)) {
                                 return JSON.parse(valStr);
                            }
                        } catch (e) { /* Fall through if not valid JSON */ }
                        return valStr; // Return as string if not parsable as number/JSON
                    }
                }
                return null; // Changed from false to null for "not found"
            }
        }
        // Get all cookies (rarely used like this)
        let data = {};
        let ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let pair = ca[i].split('=');
            if (pair.length === 2) {
                let key = pair[0].trim();
                try {
                    data[key] = unescape(pair[1]);
                } catch (e) {
                    data[key] = pair[1];
                }
            }
        }
        return data;
    }

    // Removed: document.write(createGameLayer()); - Moved to init() with insertAdjacentHTML

    function initSetting() {
        $("#username").val(cookie("username") || "");
        $("#message").val(cookie("message") || "");

        const savedTitle = cookie("title");
        if (savedTitle) {
            $('title').text(savedTitle);
            $('#title').val(savedTitle);
        }

        const savedKeyboard = cookie("keyboard");
        if (savedKeyboard) {
            const keyboardStr = String(savedKeyboard).toLowerCase();
            $("#keyboard").val(keyboardStr);
            map = {}; // Reset map
            if (keyboardStr.length === 4) {
                map[keyboardStr.charAt(0)] = 1;
                map[keyboardStr.charAt(1)] = 2;
                map[keyboardStr.charAt(2)] = 3;
                map[keyboardStr.charAt(3)] = 4;
            }
        }

        const savedGameTime = cookie('gameTime');
        if (savedGameTime) {
            const gameTimeNum = parseInt(savedGameTime);
            if (!isNaN(gameTimeNum) && gameTimeNum > 0) {
                $('#gameTime').val(gameTimeNum);
                _gameSettingNum = gameTimeNum; // Update the game setting number
            }
        }
        // gameRestart(); // gameRestart is called in gameInit, which is called in w.init
    }

    w.show_btn = function() {
        $('#btn_group').css('display', 'block'); // Or 'grid' if HTML uses d-grid
        $('#desc').css('display', 'block');
        $('#setting').css('display', 'none');
    }

    w.show_setting = function() {
        $('#btn_group').css('display', 'none');
        $('#desc').css('display', 'none');
        $('#setting').css('display', 'block'); // Or 'grid' if using d-grid
        $('#sound').text(soundMode === 'on' ? (I18N['sound-on'] || 'Sound ON') : (I18N['sound-off'] || 'Sound OFF'));
    }

    w.save_cookie = function() {
        const settings = ['username', 'message', 'keyboard', 'title', 'gameTime'];
        for (let s of settings) {
            let value = $(`#${s}`).val();
            if (value !== null && value !== undefined) { // Check for null/undefined explicitly
                cookie(s, String(value), 100);
            }
        }
        // Update _gameSettingNum if gameTime was changed
        const gameTimeVal = $('#gameTime').val();
        if (gameTimeVal) {
            const newGameTime = parseInt(gameTimeVal);
            if (!isNaN(newGameTime) && newGameTime > 0) {
                _gameSettingNum = newGameTime;
            }
        }
        initSetting(); // Re-apply settings (e.g., title)
        // gameRestart(); // Consider if a full game restart is needed after saving settings
    }

    // isnull function is not used in the provided Supabase-version logic.
    // function isnull(val) { ... }

    // Removed: w.goRank() - PHP specific

    function click(index) { // Called by keyboard input
        if (!welcomeLayerClosed || _gameOver || _gameBBList.length === 0 || _gameBBListIndex >= _gameBBList.length) {
            return;
        }

        let p = _gameBBList[_gameBBListIndex];
        // Construct the ID of the target block in the current active row based on the keyboard index (1-4)
        // This assumes blocks are numbered 0-3 in each row internally (p.cell)
        // And that p.id gives the ID of the *correct* black block.
        // We need to find the block ID corresponding to the *key press* (index) in the *same row* as p.id.
        
        const currentBlackBlockElement = document.getElementById(p.id);
        if (!currentBlackBlockElement) return;

        const parentLayer = currentBlackBlockElement.parentElement;
        if (!parentLayer) return;

        // Try to find the target block by its column index in the same row as the current black block.
        // This is a bit indirect. A more direct way would be to have _gameBBList store all blocks in the active row.
        // For now, let's assume the gameTapEvent logic correctly identifies the tapped element.
        // We simulate a tap on the `index`-th column (1-based for `click` function).
        
        // Calculate approximate clientX for the given column index
        const approxClientX = (index - 1 + 0.5) * blockSize + (body ? body.offsetLeft : 0);
        // clientY can be within the active touch area
        const approxClientY = (touchArea[0] + touchArea[1]) / 2;

        // Find the element at that position (this is complex and not perfectly reliable)
        // A simpler way for keyboard is to directly target the block by a predictable ID if possible
        // or by iterating through visible blocks in the active row.

        // Let's try to find the block by its `num` attribute relative to the current black block's row
        const currentBlockNum = parseInt(currentBlackBlockElement.getAttribute('num'));
        const rowStartNum = currentBlockNum - p.cell; // num of the first block in the current row
        const targetNum = rowStartNum + (index - 1); // num of the block in the pressed column
        
        let targetBlockElement = null;
        // Iterate through children of the parent layer to find the block with targetNum
        for (let child of parentLayer.children) {
            if (parseInt(child.getAttribute('num')) === targetNum) {
                targetBlockElement = child;
                break;
            }
        }

        if (!targetBlockElement) {
             // console.warn("Could not find target block for keyboard click:", index);
             return;
        }
        
        let fakeEvent = {
            target: targetBlockElement,
            // clientX and clientY are used by gameTapEvent to check tap area, so simulate them
            clientX: approxClientX,
            clientY: approxClientY
            // No targetTouches for emulated mouse click
        };

        gameTapEvent(fakeEvent);
    }

    // Styles for click-before/after images are applied via <style> tags
    const clickBeforeStyle = $('<style id="clickBeforeStyle"></style>').appendTo($(document.head));
    const clickAfterStyle = $('<style id="clickAfterStyle"></style>').appendTo($(document.head));

    function saveImage(fileInputDom, callback) {
        if (fileInputDom.files && fileInputDom.files[0]) {
            let reader = new FileReader();
            reader.onload = function() {
                callback(this.result); // this.result is the base64 encoded image data
            }
            reader.readAsDataURL(fileInputDom.files[0]);
        }
    }

    w.getClickBeforeImage = function() {
        $('#click-before-image').trigger('click'); // Use jQuery to trigger click on file input
    }

    w.saveClickBeforeImage = function() {
        const imgInput = document.getElementById('click-before-image');
        saveImage(imgInput, imageDataUrl => {
            clickBeforeStyle.html(`
                .t1, .t2, .t3, .t4, .t5 {
                   background-size: contain !important; /* Ensure it fits */
                   background-image: url(${imageDataUrl}) !important; /* Use important to override other styles if needed */
                   background-repeat: no-repeat !important;
                   background-position: center !important;
            }`);
        });
    }

    w.getClickAfterImage = function() {
        $('#click-after-image').trigger('click');
    }

    w.saveClickAfterImage = function() {
        const imgInput = document.getElementById('click-after-image');
        saveImage(imgInput, imageDataUrl => {
            clickAfterStyle.html(`
                .tt1, .tt2, .tt3, .tt4, .tt5 {
                  background-size: contain !important;
                  background-image: url(${imageDataUrl}) !important;
                  background-repeat: no-repeat !important;
                  background-position: center !important;
            }`);
        });
    }

})(window);
