/**
 * sketch.js - p5.js 메인 스크립트
 * 게임 초기화, 스프라이트 로드, 캐릭터 관리, 키 입력 처리
 *
 * 스프라이트 변경: js/spriteConfig.js 파일에서 CURRENT_SPRITE 값만 변경하면 됩니다!
 */

// 전역 변수
let character;
let spriteSheets = {};
let animations = {};
let assetsLoaded = false;

// 게임 설정
const GAME_WIDTH = 1600;
const GAME_HEIGHT = 900;

/**
 * p5.js preload - 리소스 로드
 */
function preload() {
  // 현재 스프라이트 정보 출력
  printCurrentSpriteInfo();

  // 스프라이트 로드 시도
  try {
    // 각 애니메이션 스프라이트 시트 로드
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
  } catch (error) {
    console.error('스프라이트 로드 중 오류:', error);
  }
}

/**
 * p5.js setup - 초기 설정
 */
function setup() {
  // 캔버스 생성 (1600x900)
  let canvas = createCanvas(GAME_WIDTH, GAME_HEIGHT);
  canvas.parent('canvas-container');

  // 스프라이트가 로드되었는지 확인
  checkAssetsLoaded();

  if (assetsLoaded) {
    // 애니메이션 프레임 추출
    extractAnimationFrames();

    // 캐릭터 생성 (화면 중앙 하단)
    character = new Character(null, GAME_WIDTH / 2, GAME_HEIGHT - 200);
    character.setScale(SPRITE_CONFIG.characterScale);
    character.setupAnimations(animations);

    console.log('✓ 캐릭터 초기화 완료');
  } else {
    // 스프라이트 없이도 실행 가능하도록 경고만 표시
    showSpriteWarning();
    console.warn('⚠ 스프라이트를 찾을 수 없습니다. README의 다운로드 가이드를 참고하세요.');
  }

  // 텍스트 설정
  textAlign(CENTER, CENTER);
  textSize(32);
}

/**
 * p5.js draw - 메인 게임 루프
 */
function draw() {
  // 배경
  background(220, 240, 255);

  // 그리드 그리기 (개발 참고용)
  drawGrid();

  // 지평선
  stroke(100, 150, 200);
  strokeWeight(2);
  line(0, GAME_HEIGHT - 200, GAME_WIDTH, GAME_HEIGHT - 200);

  if (assetsLoaded && character) {
    // 캐릭터 업데이트 및 렌더링
    character.update();
    character.display();
  } else {
    // 스프라이트 없을 때 안내 메시지
    noStroke();
    fill(100);
    text('스프라이트를 로드해주세요', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
    textSize(16);
    text('README.md의 다운로드 가이드를 참고하세요', GAME_WIDTH / 2, GAME_HEIGHT / 2);
    textSize(32);
  }

  // 게임 정보 표시
  displayGameInfo();
}

/**
 * 키 입력 처리
 */
function keyPressed() {
  if (!character) return;

  // 'a' 키로 콤보 공격
  if (key === 'a' || key === 'A') {
    character.handleAttack();
    return;
  }

  // 'r' 키로 콤보 리셋
  if (key === 'r' || key === 'R') {
    character.resetCombo();
    return;
  }

  // 숫자 키로 상태 전환 (테스트용)
  switch (key) {
    case '1':
      character.setState(character.states.IDLE);
      break;
    case '2':
      character.setState(character.states.RUN);
      break;
    case '3':
      character.setState(character.states.RIGHT_PUNCH);
      break;
    case '4':
      character.setState(character.states.LEFT_PUNCH);
      break;
    case '5':
      character.setState(character.states.UPPERCUT);
      break;
    case '6':
      character.setState(character.states.JUMP_PUNCH);
      break;
    case '7':
      character.setState(character.states.DAMAGED);
      break;
    case '8':
      character.setState(character.states.DEAD);
      break;
  }
}

/**
 * 애니메이션 프레임 추출
 */
function extractAnimationFrames() {
  const frameWidth = SPRITE_CONFIG.frameWidth;
  const frameHeight = SPRITE_CONFIG.frameHeight;
  const frameCounts = SPRITE_CONFIG.frameCounts;

  // IDLE
  if (spriteSheets.IDLE) {
    let sheet = new SpriteSheet(spriteSheets.IDLE, frameWidth, frameHeight);
    animations.IDLE = sheet.getFrameSequence(0, frameCounts.IDLE - 1);
  }

  // RUN
  if (spriteSheets.RUN) {
    let sheet = new SpriteSheet(spriteSheets.RUN, frameWidth, frameHeight);
    animations.RUN = sheet.getFrameSequence(0, frameCounts.RUN - 1);
  }

  // RIGHT_PUNCH (Attack1)
  if (spriteSheets.ATTACK1) {
    let sheet = new SpriteSheet(spriteSheets.ATTACK1, frameWidth, frameHeight);
    animations.RIGHT_PUNCH = sheet.getFrameSequence(0, frameCounts.ATTACK1 - 1);
  }

  // LEFT_PUNCH (Attack2)
  if (spriteSheets.ATTACK2) {
    let sheet = new SpriteSheet(spriteSheets.ATTACK2, frameWidth, frameHeight);
    animations.LEFT_PUNCH = sheet.getFrameSequence(0, frameCounts.ATTACK2 - 1);
  }

  // UPPERCUT (Attack2와 동일하게 사용)
  if (spriteSheets.ATTACK2) {
    let sheet = new SpriteSheet(spriteSheets.ATTACK2, frameWidth, frameHeight);
    animations.UPPERCUT = sheet.getFrameSequence(0, frameCounts.ATTACK2 - 1);
  }

  // JUMP_PUNCH (Jump + Attack1 조합)
  if (spriteSheets.JUMP && spriteSheets.ATTACK1) {
    let jumpSheet = new SpriteSheet(spriteSheets.JUMP, frameWidth, frameHeight);
    let attackSheet = new SpriteSheet(spriteSheets.ATTACK1, frameWidth, frameHeight);

    let jumpFrames = jumpSheet.getFrameSequence(0, 2); // 점프 초반 프레임
    let attackFrames = attackSheet.getFrameSequence(0, 3); // 공격 프레임

    animations.JUMP_PUNCH = [...jumpFrames, ...attackFrames];
  }

  // DAMAGED (Take Hit)
  if (spriteSheets.TAKE_HIT) {
    let sheet = new SpriteSheet(spriteSheets.TAKE_HIT, frameWidth, frameHeight);
    animations.DAMAGED = sheet.getFrameSequence(0, frameCounts.TAKE_HIT - 1);
  }

  // DEAD (Death)
  if (spriteSheets.DEATH) {
    let sheet = new SpriteSheet(spriteSheets.DEATH, frameWidth, frameHeight);
    animations.DEAD = sheet.getFrameSequence(0, frameCounts.DEATH - 1);
  }

  console.log('✓ 애니메이션 프레임 추출 완료');
}

/**
 * 에셋 로드 확인
 */
function checkAssetsLoaded() {
  let loadedCount = Object.keys(spriteSheets).length;
  assetsLoaded = loadedCount >= 3; // 최소 3개 이상 로드되면 실행 가능

  if (assetsLoaded) {
    console.log(`✓ ${loadedCount}개 스프라이트 로드 완료`);
  }
}

/**
 * 스프라이트 경고 표시
 */
function showSpriteWarning() {
  let warningElement = document.getElementById('sprite-warning');
  if (warningElement) {
    warningElement.style.display = 'block';
  }
}

/**
 * 게임 정보 표시
 */
function displayGameInfo() {
  push();
  noStroke();
  fill(0, 0, 0, 100);
  textSize(14);
  textAlign(LEFT, TOP);
  text(`해상도: ${GAME_WIDTH} x ${GAME_HEIGHT}`, 20, 20);
  text(`FPS: ${Math.round(frameRate())}`, 20, 40);
  pop();
}

/**
 * 개발용 그리드 그리기
 */
function drawGrid() {
  push();
  stroke(200, 220, 240);
  strokeWeight(1);

  // 세로선
  for (let x = 0; x < GAME_WIDTH; x += 100) {
    line(x, 0, x, GAME_HEIGHT);
  }

  // 가로선
  for (let y = 0; y < GAME_HEIGHT; y += 100) {
    line(0, y, GAME_WIDTH, y);
  }

  // 중앙선 강조
  stroke(150, 180, 200);
  strokeWeight(2);
  line(GAME_WIDTH / 2, 0, GAME_WIDTH / 2, GAME_HEIGHT);
  line(0, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT / 2);

  pop();
}
