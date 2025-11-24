/**
 * spriteConfig.js
 * 스프라이트 리소스 설정 파일
 *
 * 다른 스프라이트로 변경하려면:
 * 1. 새로운 스프라이트 설정을 SPRITE_PRESETS에 추가
 * 2. CURRENT_SPRITE 값을 변경
 */

// ============================================
// 스프라이트 프리셋 정의
// ============================================

const SPRITE_PRESETS = {
  // Martial Hero (기본)
  MARTIAL_HERO: {
    name: 'Martial Hero',
    author: 'LuizMelo',
    license: 'CC0',

    // 스프라이트 경로
    path: 'assets/sprites/martial-hero/',

    // 프레임 크기 (픽셀)
    frameWidth: 200,
    frameHeight: 200,

    // 캐릭터 스케일 (1600x900 해상도 기준)
    characterScale: 3,

    // 애니메이션 파일 정의
    files: {
      IDLE: 'Idle.png',
      RUN: 'Run.png',
      JUMP: 'Jump.png',
      FALL: 'Fall.png',
      ATTACK1: 'Attack1.png',
      ATTACK2: 'Attack2.png',
      TAKE_HIT: 'Take Hit.png',
      DEATH: 'Death.png'
    },

    // 각 애니메이션의 프레임 수
    frameCounts: {
      IDLE: 8,
      RUN: 8,
      JUMP: 4,
      FALL: 4,
      ATTACK1: 6,
      ATTACK2: 6,
      TAKE_HIT: 4,
      DEATH: 6
    },

    // 애니메이션 속도 (프레임 레이트)
    frameRates: {
      IDLE: 8,
      RUN: 12,
      RIGHT_PUNCH: 15,
      LEFT_PUNCH: 15,
      UPPERCUT: 15,
      JUMP_PUNCH: 12,
      DAMAGED: 10,
      DEAD: 8
    }
  },

  // 다른 스프라이트 예시 (주석 처리)
  /*
  ANOTHER_SPRITE: {
    name: 'Another Sprite',
    author: 'Author Name',
    license: 'License',
    path: 'assets/sprites/another-sprite/',
    frameWidth: 64,
    frameHeight: 64,
    characterScale: 4,
    files: {
      IDLE: 'idle.png',
      RUN: 'run.png',
      JUMP: 'jump.png',
      FALL: 'fall.png',
      ATTACK1: 'attack1.png',
      ATTACK2: 'attack2.png',
      TAKE_HIT: 'hit.png',
      DEATH: 'death.png'
    },
    frameCounts: {
      IDLE: 4,
      RUN: 6,
      JUMP: 2,
      FALL: 2,
      ATTACK1: 4,
      ATTACK2: 4,
      TAKE_HIT: 3,
      DEATH: 5
    },
    frameRates: {
      IDLE: 8,
      RUN: 12,
      RIGHT_PUNCH: 15,
      LEFT_PUNCH: 15,
      UPPERCUT: 15,
      JUMP_PUNCH: 12,
      DAMAGED: 10,
      DEAD: 8
    }
  }
  */
};

// ============================================
// 현재 사용할 스프라이트 선택
// ============================================
// 다른 스프라이트로 변경하려면 이 값만 바꾸면 됩니다!
const CURRENT_SPRITE = 'MARTIAL_HERO';

// ============================================
// 현재 스프라이트 설정 가져오기
// ============================================
const SPRITE_CONFIG = SPRITE_PRESETS[CURRENT_SPRITE];

// 설정이 없으면 경고
if (!SPRITE_CONFIG) {
  console.error(`❌ 스프라이트 설정 '${CURRENT_SPRITE}'을 찾을 수 없습니다!`);
  console.log('사용 가능한 스프라이트:', Object.keys(SPRITE_PRESETS));
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 사용 가능한 모든 스프라이트 프리셋 목록 반환
 */
function getAvailableSprites() {
  return Object.keys(SPRITE_PRESETS);
}

/**
 * 특정 스프라이트 프리셋 정보 반환
 */
function getSpritePreset(presetName) {
  return SPRITE_PRESETS[presetName];
}

/**
 * 현재 스프라이트 정보 출력
 */
function printCurrentSpriteInfo() {
  console.log('=================================');
  console.log('현재 스프라이트 설정');
  console.log('=================================');
  console.log('이름:', SPRITE_CONFIG.name);
  console.log('제작자:', SPRITE_CONFIG.author);
  console.log('라이선스:', SPRITE_CONFIG.license);
  console.log('프레임 크기:', `${SPRITE_CONFIG.frameWidth}x${SPRITE_CONFIG.frameHeight}`);
  console.log('캐릭터 스케일:', SPRITE_CONFIG.characterScale);
  console.log('=================================');
}
