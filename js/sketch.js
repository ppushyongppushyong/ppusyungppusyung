/**
 * sketch.js - p5.js 메인 스크립트
 * 게임 초기화, 스프라이트 로드, 캐릭터 관리, 키 입력 처리
 */

// 전역 변수
let character;
let spriteSheets = {};
let animations = {};
let assetsLoaded = false;
let isAutoPlay = false; // 오토 플레이 모드 플래그
let titleLogoImg; // 타이틀 로고 이미지

// 벽 시스템
let wallManager;
let wallSprites = []; // 벽 스프라이트 배열

// 배경 시스템
let backgroundImg;

// UI 아이콘
let heartIcon;

// 시각 효과 (속도 증가)
let speedEffectAlpha = 0; // 속도 변화 시 화면 플래시 효과
let lastSpeedMultiplier = 1.0; // 이전 속도 배율
let judgmentImages = {}; // 판정 이미지 (wow, great, good, miss)
let hitEffectFrames = []; // 히트 이펙트 프레임 배열
let hpBarImages = {}; // HP 바 이미지
let scoreBackboard; // 스코어 백보드 이미지
let bgX1 = 0; // 첫 번째 배경 X 위치
let bgX2; // 두 번째 배경 X 위치 (setup에서 설정)
let baseBgSpeed = 24; // 기본 배경 스크롤 속도
let bgSpeed = 24; // 현재 배경 스크롤 속도 (속도 배율 적용)

// 음악 시스템
let musicManager;
let musicLoaded = []; // 각 곡별 로드 상태
let gameStarted = false; // 게임 시작 여부

// 효과음 시스템
let hitSound; // 히트 효과음 (Kick_Basic.wav)
let hitTestSound; // 테스트 히트 효과음
let hitSoundManager; // 히트 효과음 매니저

// 가사 시스템
let lyricsManager;

// 게임 상태
let gameState = 'playing'; // 'playing', 'paused', 'gameover'
let lastDamageTime = 0;
const DAMAGE_COOLDOWN = 1000; // 데미지 쿨다운 (ms)

// 일시정지 메뉴
let pauseMenuSelection = 0; // 0: 재개, 1: 다시 시작

// 점수 시스템
let scoreManager;

// 랭킹 시스템
let rankingManager;
let nicknameInput = ''; // 닉네임 입력
let nicknameInputElement = null; // HTML input 요소
let isEnteringNickname = false; // 닉네임 입력 중
let rankingSaved = false; // 랭킹 저장 완료 여부
let savedRank = -1; // 저장된 등수

// 정보 시스템
let infoManager;
let logoImg;

// 미리듣기 및 곡 선택 버튼
let isPreviewPlaying = false;
let previewButton = null;
let leftArrowButton = null;
let rightArrowButton = null;

// 공격 판정 플래그 (한 공격당 한 번만 벽 파괴)
let canDestroyWall = false;
let attackHitWall = false; // 현재 공격이 벽을 맞췄는지 추적
let wasAttackingLastFrame = false; // 이전 프레임에서 공격 중이었는지
let lastAttackState = null; // 마지막 공격 상태 (공격 전환 감지용)

// 게임 설정 (기준 해상도 - 고정)
const BASE_WIDTH = 1600;
const BASE_HEIGHT = 900;

// 실제 캔버스 크기와 스케일
let GAME_WIDTH = 1600;
let GAME_HEIGHT = 900;
let gameScale = 1;

/**
 * p5.js preload - 리소스 로드
 */
function preload() {
  // 현재 스프라이트 정보 출력
  printCurrentSpriteInfo();

  // 사운드 포맷 설정
  soundFormats('mp3', 'ogg', 'wav');

  // 타이틀 로고 이미지 로드
  // ★ 중요: 이미지 파일이 assets/ui 폴더 안에 있어야 합니다.
  loadImage(
    'assets/ui/BSBS_LOGO.png',
    (img) => {
      titleLogoImg = img;
      console.log('✓ 타이틀 로고 로드 완료');
    },
    (err) => {
      console.warn('⚠ 타이틀 로고 로드 실패 (assets/ui/BSBS_LOGO.png 경로 확인 필요):', err);
    }
  );

  // 스프라이트 로드 시도
  try {
    const loaderType = SPRITE_CONFIG.loaderType || 'sprite-sheet';

    if (loaderType === 'sprite-sheet') {
      // 스프라이트 시트 방식 (기존)
      for (let [key, filename] of Object.entries(SPRITE_CONFIG.files)) {
        let path = SPRITE_CONFIG.path + filename;
        loadImage(
          path,
          (img) => {
            spriteSheets[key] = img;
            console.log(`✓ ${filename} 로드 완료`);
          },
          (err) => {
            console.warn(`⚠ ${filename} 로드 실패:`, err);
          }
        );
      }
    } else if (loaderType === 'individual-frames') {
      // 개별 프레임 방식
      for (let [key, animConfig] of Object.entries(SPRITE_CONFIG.animations)) {
        if (!animations[key]) {
          animations[key] = [];
        }

        for (let i = 1; i <= animConfig.frameCount; i++) {
          const framePath = SPRITE_CONFIG.path + animConfig.path + animConfig.filePattern.replace('{n}', i);
          loadImage(
            framePath,
            (img) => {
              animations[key][i - 1] = img;
              if (i === animConfig.frameCount) {
                console.log(`✓ ${key} 프레임 로드 완료 (${animConfig.frameCount}개)`);
              }
            },
            (err) => {
              console.warn(`⚠ ${framePath} 로드 실패:`, err);
            }
          );
        }
      }
    }

    // 벽 스프라이트 로드 (3개)
    for (let i = 1; i <= 3; i++) {
      let path = `assets/sprites/obstacles/wall${i}.png`;
      loadImage(
        path,
        (img) => {
          wallSprites[i - 1] = img;
          console.log(`✓ wall${i}.png 로드 완료`);
        },
        (err) => {
          console.warn(`⚠ wall${i}.png 로드 실패:`, err);
        }
      );
    }

    // 배경 이미지 로드
    const bgPath = loaderType === 'individual-frames' ? 'assets/background/BSBS_BG.png' : 'assets/background/city.png';
    loadImage(
      bgPath,
      (img) => {
        backgroundImg = img;
        console.log('✓ 배경 이미지 로드 완료');
      },
      (err) => {
        console.warn('⚠ 배경 이미지 로드 실패:', err);
      }
    );

    // 하트 아이콘 로드
    loadImage(
      'assets/ui/heart.png',
      (img) => {
        heartIcon = img;
        console.log('✓ 하트 아이콘 로드 완료');
      },
      (err) => {
        console.warn('⚠ 하트 아이콘 로드 실패:', err);
      }
    );

    // 판정 이미지 로드
    const judgmentTypes = ['wow', 'great', 'good', 'miss'];
    judgmentTypes.forEach(type => {
      loadImage(
        `assets/ui/${type}.png`,
        (img) => {
          judgmentImages[type] = img;
          console.log(`✓ ${type}.png 로드 완료`);
        },
        (err) => {
          console.warn(`⚠ ${type}.png 로드 실패:`, err);
        }
      );
    });

    // 히트 이펙트 프레임 로드 (4개)
    for (let i = 0; i < 4; i++) {
      loadImage(
        `assets/vfx/hit_${i}.png`,
        (img) => {
          hitEffectFrames[i] = img;
          console.log(`✓ hit_${i}.png 로드 완료`);
        },
        (err) => {
          console.warn(`⚠ hit_${i}.png 로드 실패:`, err);
        }
      );
    }

    // HP 바 이미지 로드
    loadImage('assets/ui/hp_full.png', (img) => { hpBarImages.full = img; console.log('✓ hp_full.png 로드 완료'); });
    loadImage('assets/ui/hp_6.png', (img) => { hpBarImages.hp6 = img; });
    loadImage('assets/ui/hp_5.png', (img) => { hpBarImages.hp5 = img; });
    loadImage('assets/ui/hp_4.png', (img) => { hpBarImages.hp4 = img; });
    loadImage('assets/ui/hp_3.png', (img) => { hpBarImages.hp3 = img; });
    loadImage('assets/ui/hp_2.png', (img) => { hpBarImages.hp2 = img; });
    loadImage('assets/ui/hp_1.png', (img) => { hpBarImages.hp1 = img; });
    loadImage('assets/ui/hp_empty.png', (img) => { hpBarImages.empty = img; console.log('✓ HP 바 이미지 로드 완료'); });

    // 스코어 백보드 이미지 로드
    loadImage('assets/ui/score_backboard.png',
      (img) => { scoreBackboard = img; console.log('✓ 스코어 백보드 로드 완료'); },
      (err) => { console.warn('⚠ 스코어 백보드 로드 실패:', err); }
    );

    // 로고 이미지 로드 (정보 팝업용)
    loadImage('assets/ui/logo.png',
      (img) => { logoImg = img; console.log('✓ 로고 이미지 로드 완료'); },
      (err) => { console.warn('⚠ 로고 이미지 로드 실패:', err); }
    );

    // 히트 효과음 로드
    hitSound = loadSound('assets/sounds/hit.wav',
      () => { console.log('✓ 히트 효과음 (Kick_Basic) 로드 완료'); },
      (err) => { console.warn('⚠ 히트 효과음 로드 실패:', err); }
    );
    hitTestSound = loadSound('assets/sounds/hit_test.wav',
      () => { console.log('✓ 테스트 히트 효과음 로드 완료'); },
      (err) => { console.warn('⚠ 테스트 히트 효과음 로드 실패:', err); }
    );
  } catch (error) {
    console.error('스프라이트 로드 중 오류:', error);
  }
}

/**
 * p5.js setup - 초기 설정
 */
function setup() {
  // 창 크기에 맞게 캔버스 생성 (비율 유지)
  calculateGameSize();
  let canvas = createCanvas(GAME_WIDTH, GAME_HEIGHT);
  canvas.parent('canvas-container');

  // 스페이스바 스크롤 방지
  document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
      e.preventDefault();
    }
  });

  // 스프라이트가 로드되었는지 확인
  checkAssetsLoaded();

  if (assetsLoaded) {
    // 애니메이션 프레임 추출
    extractAnimationFrames();

    // 캐릭터 생성 (화면 왼쪽에 배치)
    const groundOffset = SPRITE_CONFIG.groundOffset || 200;
    const groundY = GAME_HEIGHT - groundOffset;
    const characterHeight = SPRITE_CONFIG.frameHeight * SPRITE_CONFIG.characterScale;
    const characterY = groundY - (characterHeight / 2);

    character = new Character(null, GAME_WIDTH / 5, characterY);
    character.setScale(SPRITE_CONFIG.characterScale);
    character.setupAnimations(animations);
    character.setState(character.states.IDLE);

    // 벽 매니저 초기화
    wallManager = new WallManager(GAME_WIDTH, GAME_HEIGHT);
    wallManager.setSpawnInterval(2500);
    wallManager.setWallSpeed(6);
    wallManager.setWallSprites(wallSprites);
    wallManager.setJudgmentImages(judgmentImages);
    wallManager.setHitEffectFrames(hitEffectFrames);

    // 음악 매니저 초기화
    initMusicManager();

    // 히트 효과음 매니저 초기화
    hitSoundManager = new HitSoundManager();
    hitSoundManager.setSounds(hitSound, hitTestSound);

    // 점수 매니저 초기화
    scoreManager = new ScoreManager();
    scoreManager.setHpBarImages(hpBarImages);
    scoreManager.setScoreBackboard(scoreBackboard);

    // 랭킹 매니저 초기화
    rankingManager = new RankingManager();

    // 가사 매니저 초기화
    lyricsManager = new LyricsManager();

    // 정보 매니저 초기화
    infoManager = new InfoManager();
    if (logoImg) {
      infoManager.setLogo(logoImg);
    }

    console.log('✓ 게임 시스템 초기화 완료');
  } else {
    showSpriteWarning();
    console.warn('⚠ 스프라이트 로드 실패');
  }

  // 텍스트 설정
  textAlign(CENTER, CENTER);
  textSize(32);

  // 배경 두 번째 이미지 시작 위치 설정
  bgX2 = BASE_WIDTH;
}

/**
 * p5.js draw - 메인 게임 루프
 */
function draw() {
  push();
  scale(gameScale);

  // 스크롤링 배경
  drawScrollingBackground();

  // 지평선
  stroke(100, 150, 200, 100);
  strokeWeight(2);
  line(0, BASE_HEIGHT - 200, BASE_WIDTH, BASE_HEIGHT - 200);

  if (assetsLoaded && character) {
    if (gameState !== 'paused') {
      if (musicManager && gameStarted && !scoreManager.isGameEnded()) {
        musicManager.update();

        // 음악 종료 시 클리어 처리
        if (!musicManager.isPlaying && musicManager.getCurrentTime() > 1000) {
          scoreManager.clearGame();
        }
      }
    }

    // 벽 시스템 업데이트 및 렌더링
    if (wallManager && gameStarted && !scoreManager.isGameEnded()) {
      if (gameState !== 'paused') {
        wallManager.update();

        // 구간별 속도 업데이트
        if (musicManager) {
          const currentTime = musicManager.getCurrentTime();
          const config = getSelectedMusicConfig();
          if (config.sections) {
            const currentSection = config.sections.find(s => currentTime >= s.start && currentTime < s.end);
            if (currentSection) {
              const targetMultiplier = currentSection.speedMultiplier || 1.0;
              if (Math.abs(wallManager.getSpeedMultiplier() - targetMultiplier) > 0.01) {
                wallManager.setSpeedMultiplierForSection(targetMultiplier);
                bgSpeed = baseBgSpeed * targetMultiplier;
                if (targetMultiplier > lastSpeedMultiplier) {
                  speedEffectAlpha = 150;
                }
                lastSpeedMultiplier = targetMultiplier;
              }
            }
          }
        }
      }
      wallManager.display();

      // [추가] 오토 플레이 로직 (벽이 WOW 판정 거리에 오면 자동 공격)
      if (isAutoPlay && gameStarted && !scoreManager.isGameEnded() && wallManager) {
        const hitZoneX = wallManager.getHitZoneX(character.x);

        // 가장 가까운 판정 안된 벽 찾기
        let closestWall = null;
        let closestDistance = Infinity;

        for (let wall of wallManager.walls) {
          if (wall.currentState === wall.states.NORMAL && !wall.hasBeenJudged) {
            const distance = Math.abs(wall.x - hitZoneX);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestWall = wall;
            }
          }
        }

        // WOW 판정 범위에 들어오면 공격 (완벽한 타이밍)
        if (closestWall) {
          const wowThreshold = wallManager.hitZoneWidth * 0.125; // WOW 범위 (25px)

          if (closestDistance <= wowThreshold) {
            console.log(`🎯 자동 공격 실행! 벽 ID: ${closestWall.id || 'unknown'}, 거리: ${closestDistance.toFixed(1)}px`);
            character.handleAttack();
            canDestroyWall = true;
          }
        }
      }

      // 공격 판정 처리
      const isCurrentlyAttacking = character.isAttacking();
      const currentState = character.currentState;

      if (isCurrentlyAttacking && canDestroyWall) {
        const result = wallManager.tryDestroyWall(character.x);
        if (result) {
          console.log(`💥 판정 결과: ${result.type.toUpperCase()}, 파괴: ${result.destroyed}`);

          // MISS 판정도 카운트 (점수는 주지 않음)
          if (result.type === 'miss') {
            scoreManager.judgmentCounts.miss++;
            canDestroyWall = false;
          } else if (result.destroyed) {
            // MISS가 아닐 때만 점수 추가
            canDestroyWall = false;
            attackHitWall = true;
            scoreManager.addScore(result.type);
            if (hitSoundManager) hitSoundManager.play();
          }
        }
      }

      // 공격 상태 관리
      const attackStarted = !wasAttackingLastFrame && isCurrentlyAttacking;
      const attackStateChanged = isCurrentlyAttacking && lastAttackState !== null && lastAttackState !== currentState;
      const attackEnded = wasAttackingLastFrame && !isCurrentlyAttacking;

      if (attackStarted) {
        // 자동 모드에서는 WOW 범위 체크에서만 canDestroyWall 설정
        if (!isAutoPlay) {
          canDestroyWall = true;
        }
        attackHitWall = false;
      }

      if (attackStateChanged || attackEnded) {
        if (!attackHitWall) {
          scoreManager.breakCombo();
        }
        if (attackStateChanged) {
          // 자동 모드에서는 attackStateChanged로 판정하지 않음 (정확한 타이밍에만)
          if (!isAutoPlay) {
            canDestroyWall = true;
            attackHitWall = false;
          }
        } else {
          canDestroyWall = false;
          attackHitWall = false;
          lastAttackState = null;
        }
      }

      wasAttackingLastFrame = isCurrentlyAttacking;
      if (isCurrentlyAttacking) {
        lastAttackState = currentState;
      }

      // 충돌 처리
      if (gameState === 'playing') {
        checkWallCollision();
      }

      wallManager.updateAndDisplayHitEffects();
      wallManager.displayJudgment();
      wallManager.displayDebug(character.x);
    }

    // 상태 복구
    const isGameInactive = !gameStarted || (scoreManager && scoreManager.isGameEnded());
    if (isGameInactive && character.currentState !== character.states.IDLE) {
      character.setState(character.states.IDLE);
    }

    // 캐릭터 렌더링
    if (gameState !== 'paused') {
      character.update();
    }
    character.display();

    // UI 표시
    if (gameStarted && scoreManager) {
      scoreManager.displayHealth(heartIcon);
      scoreManager.displayScore();
      scoreManager.displayCombo();

      if (musicManager && musicManager.sound) {
        const currentTime = musicManager.getCurrentTime();
        const totalTime = musicManager.sound.duration() * 1000;
        scoreManager.displayProgress(currentTime, totalTime, animations.RUN);

        if (lyricsManager && lyricsManager.isLoaded && gameState !== 'paused') {
          lyricsManager.display(currentTime, BASE_WIDTH, BASE_HEIGHT);
        }
      }
    }

    // 시작 화면
    if (!gameStarted) {
      drawStartScreen();
    }

    // 게임 종료 화면
    if (scoreManager && scoreManager.isGameEnded()) {
      const config = getSelectedMusicConfig();
      let rankingInfo = null;

      if (scoreManager.isCleared && rankingManager) {
        if (!rankingSaved && !isEnteringNickname) {
          isEnteringNickname = true;
        }
        rankingInfo = {
          isEntering: isEnteringNickname,
          nickname: nicknameInput,
          saved: rankingSaved,
          rank: savedRank,
          rankings: rankingManager.getRankings(config.name)
        };
      }

      scoreManager.displayGameOver(config.name, config.bpm, rankingInfo, infoManager);

      if (infoManager) {
        if (!infoManager.infoButton) infoManager.createInfoButton();
        infoManager.showInfoButton();
        infoManager.updateInfoButtonPosition(gameScale);
      }

      if (scoreManager.isCountdownFinished() && !isEnteringNickname) {
        resetGame();
      }
    }

    // 일시정지 메뉴
    if (gameState === 'paused') {
      drawPauseMenu();
    }

    // 속도 효과
    if (speedEffectAlpha > 0) {
      push();
      noStroke();
      fill(255, 220, 100, speedEffectAlpha);
      rectMode(CORNER);
      rect(0, 0, BASE_WIDTH, BASE_HEIGHT);
      pop();
      speedEffectAlpha -= 5;
    }

    // 속도 표시
    if (gameStarted && wallManager && !scoreManager.isGameEnded()) {
      const currentMultiplier = wallManager.getSpeedMultiplier();
      if (currentMultiplier > 1.0) {
        push();
        fill(255, 220, 100, 200);
        textAlign(RIGHT, TOP);
        textSize(20);
        text(`SPEED: ${currentMultiplier.toFixed(1)}x`, BASE_WIDTH - 30, 125);
        pop();
      }
    }

    // 오토 플레이 표시
    if (isAutoPlay) {
      push();
      fill(0, 255, 255);
      textAlign(CENTER, TOP);
      textSize(24);
      textStyle(BOLD);
      text("🤖 AUTO PLAY ON", BASE_WIDTH / 2, 100);
      pop();
    }

    // 팝업 관리 (최상단에 표시)
    if (infoManager && infoManager.isPopupOpen()) {
      if (previewButton) previewButton.hide();
      if (leftArrowButton) leftArrowButton.hide();
      if (rightArrowButton) rightArrowButton.hide();
      infoManager.displayPopup();
    } else {
      if (!gameStarted) {
        if (previewButton) previewButton.show();
        if (leftArrowButton) leftArrowButton.show();
        if (rightArrowButton) rightArrowButton.show();
      }
    }

  } else {
    noStroke();
    fill(100);
    text('스프라이트를 로드해주세요', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
    textSize(16);
    text('README.md의 다운로드 가이드를 참고하세요', GAME_WIDTH / 2, GAME_HEIGHT / 2);
    textSize(32);
  }

  displayGameInfo();
  pop();
}

/**
 * 게임 크기 계산
 */
function calculateGameSize() {
  const aspectRatio = BASE_WIDTH / BASE_HEIGHT;
  const windowRatio = windowWidth / windowHeight;

  if (windowRatio > aspectRatio) {
    GAME_HEIGHT = windowHeight;
    GAME_WIDTH = windowHeight * aspectRatio;
  } else {
    GAME_WIDTH = windowWidth;
    GAME_HEIGHT = windowWidth / aspectRatio;
  }
  gameScale = GAME_WIDTH / BASE_WIDTH;
}

/**
 * 리사이즈 처리
 */
function windowResized() {
  calculateGameSize();
  resizeCanvas(GAME_WIDTH, GAME_HEIGHT);

  if (!gameStarted) {
    if (previewButton) updatePreviewButtonPosition();
    if (leftArrowButton && rightArrowButton) updateArrowButtonsPosition();
    if (infoManager && infoManager.infoButton) {
      infoManager.updateInfoButtonPosition(gameScale);
    }
  }
}

/**
 * 키 입력 처리
 */
function keyPressed() {
  if (infoManager && infoManager.isPopupOpen()) {
    if (keyCode === ESCAPE) {
      infoManager.closePopup();
      return;
    }
  }

  // F7: 오토 플레이 토글
  if (keyCode === 118) {
    isAutoPlay = !isAutoPlay;
    console.log(`🤖 오토 플레이 ${isAutoPlay ? 'ON' : 'OFF'}`);
    return;
  }

  if (isEnteringNickname) {
    handleNicknameInput(key, keyCode);
    return;
  }

  if (keyCode === ESCAPE) {
    if (scoreManager && scoreManager.isGameEnded()) {
      resetGame();
      return;
    }
    if (gameStarted) {
      togglePause();
    }
    return;
  }

  if (gameState === 'paused') {
    handlePauseMenuInput(key, keyCode);
    return;
  }

  if (key === ' ' || keyCode === 32) {
    if (!character) return false;
    if (!gameStarted) {
      if (musicManager && musicManager.isLoaded) {
        startGame();
      }
    } else {
      if (!character.isDisabled()) {
        character.setState(character.states.JUMP_PUNCH);
      } else if (character.isAttacking()) {
        character.bufferInput('jump');
      }
    }
    return false;
  }

  if (!character) return;

  if (!gameStarted) {
    if (keyCode === LEFT_ARROW) {
      stopPreviewAndChangeMusic('prev');
      return;
    }
    if (keyCode === RIGHT_ARROW) {
      stopPreviewAndChangeMusic('next');
      return;
    }
    return;
  }

  if (keyCode === 65) { // A키
    character.handleAttack();
    return;
  }
  if (keyCode === 82) { // R키
    character.resetCombo();
    return;
  }
  if (keyCode === 68) { // D키
    if (wallManager) wallManager.toggleDebug();
    return;
  }

  // 숫자 키 테스트
  switch (key) {
    case '1': character.setState(character.states.IDLE); break;
    case '2': character.setState(character.states.RUN); break;
    case '3': character.setState(character.states.RIGHT_PUNCH); canDestroyWall = true; break;
    case '4': character.setState(character.states.LEFT_PUNCH); canDestroyWall = true; break;
    case '5': character.setState(character.states.UPPERCUT); canDestroyWall = true; break;
    case '6': character.setState(character.states.JUMP_PUNCH); canDestroyWall = true; break;
    case '7': character.setState(character.states.DAMAGED); break;
    case '8': character.setState(character.states.DEAD); break;
  }
}

/**
 * 마우스 입력 처리
 */
function mousePressed() {
  if (infoManager && infoManager.justOpenedPopup) return false;
  if (infoManager && infoManager.isPopupOpen()) {
    infoManager.closePopup();
    return false;
  }
}

/**
 * 충돌 체크
 */
function checkWallCollision() {
  if (!wallManager || !character || !scoreManager) return;
  if (character.currentState === character.states.DAMAGED || character.currentState === character.states.DEAD) return;
  if (character.isInvincibleNow()) return;
  if (character.isAttacking()) return;
  if (millis() - lastDamageTime < DAMAGE_COOLDOWN) return;

  if (wallManager.checkCollision(character.x)) {
    const isDead = scoreManager.takeDamage();
    lastDamageTime = millis();
    scoreManager.breakCombo();
    wallManager.removeCollidingWall(character.x);

    if (isDead) {
      character.setState(character.states.DEAD);
      setTimeout(() => { scoreManager.gameOver(); }, 1000);
    } else {
      character.setState(character.states.DAMAGED);
    }
  }
}

/**
 * 음악 매니저 초기화
 */
function initMusicManager() {
  const config = getSelectedMusicConfig();
  if (musicManager && musicManager.isPlaying) {
    musicManager.stop();
  }

  musicManager = new MusicManager(config);
  musicManager.loadMusic(() => {
    const beatInterval = getCurrentBeatInterval();
    wallManager.setRhythmMode(true, beatInterval);
    musicManager.onBeat((beatInfo) => {
      wallManager.spawnOnBeat(beatInfo);
    });
    console.log(`✓ "${config.name}" 로드 완료 (BPM: ${config.bpm})`);
  });

  if (lyricsManager && config.lrc) {
    lyricsManager.loadLRC(config.lrc);
  } else if (lyricsManager) {
    lyricsManager.reset();
    lyricsManager.isLoaded = false;
  }

  setTimeout(() => {
    if (!musicManager.isLoaded) {
      console.log('⚠ 음악 파일 없음');
      musicManager.isLoaded = true;
      wallManager.setRhythmMode(false);
    }
  }, 3000);
}

/**
 * 게임 시작
 */
function startGame() {
  if (!musicManager || !musicManager.isLoaded) return;

  if (isPreviewPlaying && musicManager.sound) {
    musicManager.sound.stop();
    isPreviewPlaying = false;
    updatePreviewButtonIcon();
  }

  hidePreviewButton();
  hideArrowButtons();
  if (infoManager) infoManager.hideInfoButton();

  gameStarted = true;
  gameState = 'playing';

  if (character) character.setState(character.states.RUN);
  if (musicManager.sound && musicManager.sound.duration() > 0) {
    musicManager.play();
  }
  console.log('🎮 게임 시작!');
}

/**
 * 게임 리셋
 */
function resetGame() {
  if (musicManager) musicManager.stop();
  if (wallManager) wallManager.reset();
  if (character) {
    character.setState(character.states.IDLE);
    character.resetCombo();
  }
  if (scoreManager) scoreManager.reset();

  initMusicManager();

  gameStarted = false;
  gameState = 'playing';
  lastDamageTime = 0;
  canDestroyWall = false;
  attackHitWall = false;
  wasAttackingLastFrame = false;
  lastAttackState = null;

  nicknameInput = '';
  isEnteringNickname = false;
  rankingSaved = false;
  savedRank = -1;
  removeNicknameInput();

  isPreviewPlaying = false;
  updatePreviewButtonIcon();
  showPreviewButton();
  showArrowButtons();

  if (infoManager) infoManager.showInfoButton();
  console.log('🔄 게임 리셋');
}

/**
 * 시작 화면 그리기 (수정됨: 레이아웃 개선)
 */
function drawStartScreen() {
  push();
  const config = getSelectedMusicConfig();

  fill(0, 0, 0, 180);
  rectMode(CORNER);
  rect(0, 0, BASE_WIDTH, BASE_HEIGHT);

  // [1] 로고 (위로 올림: -320)
  if (titleLogoImg) {
    imageMode(CENTER);
    const logoWidth = 600;
    const logoHeight = (titleLogoImg.height / titleLogoImg.width) * logoWidth;
    image(titleLogoImg, BASE_WIDTH / 2, BASE_HEIGHT / 2 - 260, logoWidth, logoHeight);
  } else {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(64);
    text('뿌슝뿌슝', BASE_WIDTH / 2, BASE_HEIGHT / 2 - 200);
  }

  // [2] 곡 선택 박스 (아래로 내림: 중심 -50)
  fill(255, 255, 255, 40);
  rectMode(CENTER);
  rect(BASE_WIDTH / 2, BASE_HEIGHT / 2 - 50, 600, 100, 15);

  textSize(16);
  fill(255, 220, 100);
  text('[ 곡 선택 ]', BASE_WIDTH / 2, BASE_HEIGHT / 2 - 85);

  textSize(26);
  fill(255);
  textStyle(BOLD);
  text(config.name, BASE_WIDTH / 2, BASE_HEIGHT / 2 - 60);
  textStyle(NORMAL);

  textSize(20);
  fill(100, 255, 100);
  let durationText = '';
  if (musicManager && musicManager.sound && musicManager.isLoaded) {
    const totalSec = Math.floor(musicManager.sound.duration());
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    durationText = ` | ${min}:${sec.toString().padStart(2, '0')}`;
  }
  text(`BPM: ${config.bpm}${durationText}`, BASE_WIDTH / 2, BASE_HEIGHT / 2 - 25);

  textSize(14);
  fill(150);
  text(`${selectedMusicIndex + 1} / ${MUSIC_LIST.length}`, BASE_WIDTH / 2, BASE_HEIGHT / 2 + 15);

  // [3] 시작 텍스트 (더 아래로: +80)
  textSize(40);
  fill(100, 255, 100);
  if (frameCount % 60 < 40) {
    text('SPACE 를 눌러 시작', BASE_WIDTH / 2, BASE_HEIGHT / 2 + 80);
  }

  // [4] 조작 박스 (더 아래로: +240)
  fill(255, 255, 255, 30);
  rectMode(CENTER);
  rect(BASE_WIDTH / 2, BASE_HEIGHT / 2 + 240, 500, 160, 15);

  textSize(22);
  fill(255);
  text('[ 조작 방법 ]', BASE_WIDTH / 2, BASE_HEIGHT / 2 + 185);

  textSize(18);
  fill(255, 220, 100);
  const keysY = BASE_HEIGHT / 2 + 225;
  text('A', BASE_WIDTH / 2 - 100, keysY);
  text('ESC', BASE_WIDTH / 2 - 100, keysY + 35);
  text('F7', BASE_WIDTH / 2 - 100, keysY + 70);

  fill(200);
  textAlign(LEFT, CENTER);
  text('펀치 공격', BASE_WIDTH / 2 - 50, keysY);
  text('게임 리셋 / 일시정지', BASE_WIDTH / 2 - 50, keysY + 35);
  text('오토 플레이 ON/OFF', BASE_WIDTH / 2 - 50, keysY + 70);

  // 로딩 상태 (맨 아래)
  textAlign(CENTER, CENTER);
  textSize(14);
  if (musicManager && musicManager.isLoaded) {
    fill(100, 255, 100);
    text('Ready!', BASE_WIDTH / 2, BASE_HEIGHT / 2 + 340);

    if (!previewButton) createPreviewButton();
    updatePreviewButtonPosition();
    if (!leftArrowButton || !rightArrowButton) createArrowButtons();
    updateArrowButtonsPosition();
    if (infoManager && !infoManager.infoButton) infoManager.createInfoButton();
    if (infoManager && infoManager.infoButton) infoManager.updateInfoButtonPosition(gameScale);
  } else {
    fill(255, 200, 100);
    text('로딩 중...', BASE_WIDTH / 2, BASE_HEIGHT / 2 + 340);
  }

  if (rankingManager) {
    // 랭킹 표시는 기본값 유지 (오른쪽에 위치)
    const rankX = BASE_WIDTH - 200;
    const rankY = BASE_HEIGHT / 2 - 50;
    fill(0, 0, 0, 150);
    rectMode(CENTER);
    rect(rankX, rankY, 280, 300, 15);
    fill(255, 220, 100);
    textAlign(CENTER, CENTER);
    textSize(20);
    text('RANKING', rankX, rankY - 120);
    fill(150);
    textSize(12);
    text(config.name, rankX, rankY - 95);
    stroke(100, 100, 150);
    strokeWeight(1);
    line(rankX - 120, rankY - 80, rankX + 120, rankY - 80);
    noStroke();
    const rankings = rankingManager.getRankings(config.name);
    if (rankings.length === 0) {
      fill(100);
      textSize(14);
      text('기록 없음', rankX, rankY);
    } else {
      for (let i = 0; i < Math.min(5, rankings.length); i++) {
        const entry = rankings[i];
        const y = rankY - 55 + i * 35;
        fill(i < 3 ? color(255, 220, 100) : color(150));
        textSize(16);
        textAlign(LEFT, CENTER);
        text(`${i + 1}.`, rankX - 110, y);
        fill(255);
        text(entry.name.substring(0, 6), rankX - 80, y);
        textAlign(RIGHT, CENTER);
        fill(100, 255, 100);
        text(`${entry.score}`, rankX + 110, y);
      }
    }
  }

  pop();
}

/**
 * 미리듣기/화살표 버튼 위치 동기화 (곡 선택 박스 중심: -50)
 */
function updatePreviewButtonPosition() {
  if (!previewButton) return;
  const btnX = (windowWidth / 2) + 320 * gameScale;
  const btnY = (windowHeight / 2) - 50 * gameScale;
  previewButton.position(btnX, btnY - 22);
}

function updateArrowButtonsPosition() {
  if (!leftArrowButton || !rightArrowButton) return;
  const centerY = (windowHeight / 2) - 50 * gameScale;
  const leftX = (windowWidth / 2) - 280 * gameScale;
  leftArrowButton.position(leftX - 20, centerY - 20);
  const rightX = (windowWidth / 2) + 240 * gameScale;
  rightArrowButton.position(rightX - 20, centerY - 20);
}

// ... 나머지 보조 함수들은 동일합니다 (아래에 포함) ...

function extractAnimationFrames() {
  const loaderType = SPRITE_CONFIG.loaderType || 'sprite-sheet';
  if (loaderType === 'individual-frames') {
    if (animations.ATTACK1) animations.RIGHT_PUNCH = animations.ATTACK1;
    if (animations.ATTACK2) { animations.LEFT_PUNCH = animations.ATTACK2; animations.UPPERCUT = animations.ATTACK2; }
    if (animations.JUMP && animations.ATTACK1) {
      animations.JUMP_PUNCH = [...animations.JUMP.slice(0, 2), ...animations.ATTACK1.slice(0, 3)];
    }
    if (animations.TAKE_HIT) animations.DAMAGED = animations.TAKE_HIT;
    if (animations.DEATH) animations.DEAD = animations.DEATH;
    console.log('✓ 애니메이션 프레임 준비 완료');
    return;
  }
  // 스프라이트 시트 방식
  const { frameWidth, frameHeight, frameCounts } = SPRITE_CONFIG;
  if (spriteSheets.IDLE) animations.IDLE = new SpriteSheet(spriteSheets.IDLE, frameWidth, frameHeight).getFrameSequence(0, frameCounts.IDLE - 1);
  if (spriteSheets.RUN) animations.RUN = new SpriteSheet(spriteSheets.RUN, frameWidth, frameHeight).getFrameSequence(0, frameCounts.RUN - 1);
  if (spriteSheets.ATTACK1) animations.RIGHT_PUNCH = new SpriteSheet(spriteSheets.ATTACK1, frameWidth, frameHeight).getFrameSequence(0, frameCounts.ATTACK1 - 1);
  if (spriteSheets.ATTACK2) {
    const sheet = new SpriteSheet(spriteSheets.ATTACK2, frameWidth, frameHeight);
    animations.LEFT_PUNCH = sheet.getFrameSequence(0, frameCounts.ATTACK2 - 1);
    animations.UPPERCUT = sheet.getFrameSequence(0, frameCounts.ATTACK2 - 1);
  }
  if (spriteSheets.JUMP && spriteSheets.ATTACK1) {
    animations.JUMP_PUNCH = [...new SpriteSheet(spriteSheets.JUMP, frameWidth, frameHeight).getFrameSequence(0, 2), ...new SpriteSheet(spriteSheets.ATTACK1, frameWidth, frameHeight).getFrameSequence(0, 3)];
  }
  if (spriteSheets.TAKE_HIT) animations.DAMAGED = new SpriteSheet(spriteSheets.TAKE_HIT, frameWidth, frameHeight).getFrameSequence(0, frameCounts.TAKE_HIT - 1);
  if (spriteSheets.DEATH) animations.DEAD = new SpriteSheet(spriteSheets.DEATH, frameWidth, frameHeight).getFrameSequence(0, frameCounts.DEATH - 1);
  console.log('✓ 애니메이션 프레임 추출 완료');
}

function checkAssetsLoaded() {
  const loaderType = SPRITE_CONFIG.loaderType || 'sprite-sheet';
  let loadedCount = 0;
  if (loaderType === 'individual-frames') {
    loadedCount = Object.keys(animations).filter(key => animations[key] && animations[key].length > 0).length;
  } else {
    loadedCount = Object.keys(spriteSheets).length;
  }
  assetsLoaded = loadedCount >= 3;
  if (assetsLoaded) console.log(`✓ 리소스 로드 완료`);
}

function showSpriteWarning() {
  let warningElement = document.getElementById('sprite-warning');
  if (warningElement) warningElement.style.display = 'block';
}

function displayGameInfo() {
  push();
  noStroke();
  fill(0, 255, 100);
  textSize(16);
  textAlign(LEFT, BOTTOM);
  text(`FPS: ${Math.round(frameRate())}`, 20, BASE_HEIGHT - 20);
  if (wallManager) {
    let destroyedElement = document.getElementById('destroyed-count');
    if (destroyedElement) destroyedElement.textContent = wallManager.destroyedCount;
  }
  pop();
}

function drawScrollingBackground() {
  if (backgroundImg) {
    push();
    if (gameStarted && !scoreManager.isGameEnded()) tint(100, 100, 120, 180);
    image(backgroundImg, bgX1, 0, BASE_WIDTH, BASE_HEIGHT);
    image(backgroundImg, bgX2, 0, BASE_WIDTH, BASE_HEIGHT);
    noTint();
    pop();
    const isGameActive = gameStarted && (!scoreManager || !scoreManager.isGameEnded());
    if (isGameActive) {
      bgX1 -= bgSpeed;
      bgX2 -= bgSpeed;
      if (bgX1 <= -BASE_WIDTH) bgX1 = bgX2 + BASE_WIDTH;
      if (bgX2 <= -BASE_WIDTH) bgX2 = bgX1 + BASE_WIDTH;
    }
  } else {
    background(220, 240, 255);
  }
}

function drawGrid() {
  push();
  stroke(200, 220, 240);
  strokeWeight(1);
  for (let x = 0; x < GAME_WIDTH; x += 100) line(x, 0, x, GAME_HEIGHT);
  for (let y = 0; y < GAME_HEIGHT; y += 100) line(0, y, GAME_WIDTH, y);
  stroke(150, 180, 200);
  strokeWeight(2);
  line(GAME_WIDTH / 2, 0, GAME_WIDTH / 2, GAME_HEIGHT);
  line(0, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT / 2);
  pop();
}

function togglePause() {
  if (gameState === 'paused') resumeGame();
  else pauseGame();
}

function pauseGame() {
  gameState = 'paused';
  pauseMenuSelection = 0;
  if (musicManager && musicManager.isPlaying) musicManager.pause();
  if (character) character.inputBuffer = null;
  console.log('⏸ 게임 일시정지');
}

function resumeGame() {
  gameState = 'playing';
  if (musicManager) musicManager.resume();
  console.log('▶ 게임 재개');
}

function handlePauseMenuInput(key, keyCode) {
  if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
    pauseMenuSelection = pauseMenuSelection === 0 ? 1 : 0;
    return;
  }
  if (keyCode === ENTER || keyCode === RETURN) {
    if (pauseMenuSelection === 0) resumeGame();
    else { gameState = 'playing'; resetGame(); }
  }
}

function drawPauseMenu() {
  push();
  fill(0, 0, 0, 180);
  rectMode(CORNER);
  rect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  fill(30, 30, 50, 240);
  stroke(100, 200, 255);
  strokeWeight(3);
  rectMode(CENTER);
  rect(BASE_WIDTH / 2, BASE_HEIGHT / 2, 400, 280, 20);
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(48);
  text('일시정지', BASE_WIDTH / 2, BASE_HEIGHT / 2 - 80);
  const menuY = BASE_HEIGHT / 2 + 20;
  const menuSpacing = 60;
  if (pauseMenuSelection === 0) { fill(100, 200, 255); rect(BASE_WIDTH / 2, menuY, 250, 50, 10); fill(0); }
  else { fill(80, 80, 100); rect(BASE_WIDTH / 2, menuY, 250, 50, 10); fill(200); }
  textSize(24);
  text('재개', BASE_WIDTH / 2, menuY);
  if (pauseMenuSelection === 1) { fill(100, 200, 255); rect(BASE_WIDTH / 2, menuY + menuSpacing, 250, 50, 10); fill(0); }
  else { fill(80, 80, 100); rect(BASE_WIDTH / 2, menuY + menuSpacing, 250, 50, 10); fill(200); }
  text('다시 시작', BASE_WIDTH / 2, menuY + menuSpacing);
  fill(150);
  textSize(14);
  text('↑↓ 선택  |  Enter 확인  |  ESC 재개', BASE_WIDTH / 2, BASE_HEIGHT / 2 + 120);
  pop();
}

function startNicknameInput() {
  if (nicknameInputElement) return;
  isEnteringNickname = true;
  nicknameInputElement = createInput('');
  nicknameInputElement.attribute('placeholder', '닉네임 입력');
  nicknameInputElement.attribute('maxlength', '10');
  nicknameInputElement.style('font-size', '16px');
  nicknameInputElement.style('padding', '8px 12px');
  nicknameInputElement.style('border', '2px solid #64c8ff');
  nicknameInputElement.style('border-radius', '5px');
  nicknameInputElement.style('background', '#32323c');
  nicknameInputElement.style('color', '#fff');
  nicknameInputElement.style('text-align', 'center');
  nicknameInputElement.style('width', '160px');
  nicknameInputElement.style('outline', 'none');
  const canvas = document.querySelector('canvas');
  const canvasRect = canvas.getBoundingClientRect();
  const inputX = canvasRect.left + (BASE_WIDTH / 2 - 160) * gameScale;
  const inputY = canvasRect.top + (BASE_HEIGHT / 2 + 165) * gameScale; // 140 + 25 (라벨 아래)
  nicknameInputElement.position(inputX - 80, inputY - 18);
  nicknameInputElement.elt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      nicknameInput = nicknameInputElement.value();
      if (nicknameInput.trim().length > 0) saveRanking();
      removeNicknameInput();
    } else if (e.key === 'Escape') {
      isEnteringNickname = false;
      rankingSaved = true;
      removeNicknameInput();
    }
  });
  nicknameInputElement.elt.focus();
}

function removeNicknameInput() {
  if (nicknameInputElement) {
    nicknameInputElement.remove();
    nicknameInputElement = null;
  }
}

function handleNicknameInput(key, keyCode) {
  if (!nicknameInputElement) startNicknameInput();
}

function createPreviewButton() {
  if (previewButton) return;
  previewButton = createButton('<i class="fas fa-headphones"></i>');
  previewButton.class('preview-btn');
  previewButton.style('font-size', '20px');
  previewButton.style('width', '45px');
  previewButton.style('height', '45px');
  previewButton.style('border', 'none');
  previewButton.style('border-radius', '50%');
  previewButton.style('background', 'linear-gradient(145deg, #4a9eff, #2d7dd2)');
  previewButton.style('color', '#fff');
  previewButton.style('cursor', 'pointer');
  previewButton.style('box-shadow', '0 4px 15px rgba(74, 158, 255, 0.4)');
  previewButton.style('transition', 'all 0.2s ease');
  previewButton.style('display', 'flex');
  previewButton.style('align-items', 'center');
  previewButton.style('justify-content', 'center');
  previewButton.mousePressed(togglePreview);
  previewButton.mouseOver(() => {
    previewButton.style('transform', 'scale(1.1)');
    previewButton.style('box-shadow', '0 6px 20px rgba(74, 158, 255, 0.6)');
  });
  previewButton.mouseOut(() => {
    previewButton.style('transform', 'scale(1)');
    previewButton.style('box-shadow', '0 4px 15px rgba(74, 158, 255, 0.4)');
  });
}

function hidePreviewButton() { if (previewButton) previewButton.hide(); }
function showPreviewButton() { if (previewButton) previewButton.show(); }

function updatePreviewButtonIcon() {
  if (!previewButton) return;
  if (isPreviewPlaying) {
    previewButton.html('<i class="fas fa-pause"></i>');
    previewButton.style('background', 'linear-gradient(145deg, #ff6b6b, #ee5a5a)');
  } else {
    previewButton.html('<i class="fas fa-headphones"></i>');
    previewButton.style('background', 'linear-gradient(145deg, #4a9eff, #2d7dd2)');
  }
}

function createArrowButtons() {
  if (leftArrowButton && rightArrowButton) return;
  leftArrowButton = createButton('<i class="fas fa-chevron-left"></i>');
  styleArrowButton(leftArrowButton);
  leftArrowButton.mousePressed(() => { stopPreviewAndChangeMusic('prev'); });
  rightArrowButton = createButton('<i class="fas fa-chevron-right"></i>');
  styleArrowButton(rightArrowButton);
  rightArrowButton.mousePressed(() => { stopPreviewAndChangeMusic('next'); });
}

function styleArrowButton(btn) {
  btn.style('font-size', '18px');
  btn.style('width', '40px');
  btn.style('height', '40px');
  btn.style('border', 'none');
  btn.style('border-radius', '50%');
  btn.style('background', 'rgba(255, 255, 255, 0.15)');
  btn.style('color', '#fff');
  btn.style('cursor', 'pointer');
  btn.style('transition', 'all 0.2s ease');
  btn.style('display', 'flex');
  btn.style('align-items', 'center');
  btn.style('justify-content', 'center');
  btn.style('backdrop-filter', 'blur(5px)');
  btn.mouseOver(() => {
    btn.style('background', 'rgba(255, 255, 255, 0.3)');
    btn.style('transform', 'scale(1.1)');
  });
  btn.mouseOut(() => {
    btn.style('background', 'rgba(255, 255, 255, 0.15)');
    btn.style('transform', 'scale(1)');
  });
}

function hideArrowButtons() { if (leftArrowButton) leftArrowButton.hide(); if (rightArrowButton) rightArrowButton.hide(); }
function showArrowButtons() { if (leftArrowButton) leftArrowButton.show(); if (rightArrowButton) rightArrowButton.show(); }

function stopPreviewAndChangeMusic(direction) {
  if (isPreviewPlaying && musicManager && musicManager.sound) {
    musicManager.sound.stop();
    isPreviewPlaying = false;
    updatePreviewButtonIcon();
  }
  if (direction === 'prev') selectPrevMusic();
  else selectNextMusic();
  initMusicManager();
}

function togglePreview() {
  if (!musicManager || !musicManager.sound) return;
  if (isPreviewPlaying) {
    musicManager.sound.pause();
    isPreviewPlaying = false;
    console.log('⏸ 미리듣기 정지');
  } else {
    musicManager.sound.play();
    isPreviewPlaying = true;
    console.log('▶ 미리듣기 재생');
  }
  updatePreviewButtonIcon();
}

function saveRanking() {
  if (!rankingManager || !scoreManager) return;
  const config = getSelectedMusicConfig();
  const playerName = nicknameInput.trim() || 'Player';
  savedRank = rankingManager.saveRanking(config.name, playerName, scoreManager.score, scoreManager.wallsDestroyed);
  isEnteringNickname = false;
  rankingSaved = true;
  console.log(`🏆 랭킹 저장: ${playerName} - ${scoreManager.score}점 (${savedRank}위)`);
}
