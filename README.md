# 뿌슝뿌슝 - 리듬 액션 게임

p5.js 기반 리듬에 맞춰 벽을 부수는 액션 게임

## 주요 기능

### 게임 시스템
- **리듬 기반 게임플레이**: 음악 비트에 맞춰 다가오는 벽을 정확한 타이밍에 파괴
- **4단계 판정 시스템**: WOW (완벽) / GREAT (좋음) / GOOD (괜찮음) / MISS (실패)
- **콤보 배율 시스템**: 연속 성공 시 최대 2.5배까지 점수 배율 증가
- **체력 시스템**: 벽과 충돌 시 체력 감소, 0이 되면 게임 오버
- **속도 증가**: 곡의 구간에 따라 벽 속도가 점진적으로 증가

### 콘텐츠
- **다중 곡 지원**: 여러 곡 중 선택 가능
- **가사 표시**: LRC 파일 지원으로 가사 동기화
- **랭킹 시스템**: 곡별 최고 점수 로컬 저장
- **곡 미리듣기**: 게임 시작 전 음악 미리 들어보기

### 개발자 기능
- **오토 플레이 모드**: AI가 자동으로 완벽한 타이밍에 공격 (F7 키)
- **디버그 모드**: 판정 범위, 벽 히트박스 시각화 (D 키)
- **정보 팝업**: 게임 정보 및 p5.js 활용 내역 확인

## 게임 조작법

### 메인 게임
- **공격**: `SPACE` 키 - 리듬에 맞춰 벽 파괴
- **일시정지**: `ESC` 키
- **게임 재시작**: 게임 오버 화면에서 `ESC` 키

### 메인 메뉴
- **게임 시작**: `SPACE` 또는 `ENTER` 키
- **곡 선택**: `←` `→` 화살표 키
- **곡 미리듣기**: `P` 키 (토글)

### 개발자 모드
- **오토 플레이**: `F7` 키 (완벽한 타이밍 자동 공격)
- **디버그 모드**: `D` 키 (판정 범위 및 히트박스 표시)

## 판정 시스템

| 판정 | 범위 | 점수 | 설명 |
|------|------|------|------|
| **WOW** | ±12.5px | 50점 | 완벽한 타이밍 |
| **GREAT** | ±25px | 30점 | 좋은 타이밍 |
| **GOOD** | ±50px | 15점 | 괜찮은 타이밍 |
| **MISS** | 그 외 | 5점 | 실패 |

## 콤보 시스템

연속으로 벽을 파괴하면 점수 배율이 증가합니다:

| 콤보 수 | 배율 | 효과 |
|---------|------|------|
| 1-9 | 1.0x | 기본 점수 |
| 10-19 | 1.2x | 금색 콤보 |
| 20-29 | 1.5x | 주황색 콤보 |
| 30-49 | 1.8x | 핫핑크 콤보 |
| 50-99 | 2.0x | 무지개 이펙트 시작 |
| 100+ | 2.5x | 최대 배율 + 무지개 효과 |

**콤보가 끊기는 경우**:
- 벽과 충돌하여 데미지를 받을 때
- 공격했지만 벽을 맞추지 못했을 때

## 프로젝트 구조

```
뿌슝뿌슝/
├── index.html              # 메인 HTML 파일
├── js/
│   ├── sketch.js           # p5.js 메인 게임 로직
│   ├── Character.js        # 캐릭터 상태 관리 (IDLE, RUN, 공격, 데미지 등)
│   ├── Wall.js             # 벽 객체 (이동, 충돌 판정)
│   ├── WallManager.js      # 벽 생성, 관리, 판정 처리
│   ├── ScoreManager.js     # 점수, 체력, 콤보, 판정 통계
│   ├── MusicManager.js     # 음악 재생 및 비트 동기화
│   ├── RankingManager.js   # 랭킹 저장 및 불러오기 (로컬 스토리지)
│   ├── LyricsManager.js    # LRC 파일 파싱 및 가사 표시
│   ├── HitSoundManager.js  # 타격 효과음 관리
│   ├── InfoManager.js      # 게임 정보 팝업
│   ├── AnimationManager.js # 스프라이트 애니메이션
│   ├── SpriteSheet.js      # 스프라이트 시트 슬라이싱
│   ├── SpriteLoader.js     # 스프라이트 리소스 로딩
│   ├── musicConfig.js      # 음악 설정 (BPM, 패턴, 구간별 속도)
│   └── spriteConfig.js     # 스프라이트 설정
└── assets/
    ├── sprites/
    │   └── martial-hero/   # 캐릭터 스프라이트
    ├── background/         # 배경 이미지
    ├── music/              # 음악 파일 (mp3, lrc)
    ├── sounds/             # 효과음
    ├── ui/                 # UI 이미지 (판정, HP바 등)
    └── vfx/                # 시각 효과 (히트 이펙트 등)
```

## 실행 방법

### 1. 로컬 서버 실행

CORS 정책으로 인해 로컬 서버가 필요합니다:

```bash
# Python 3
python -m http.server 8000

# 또는 Node.js의 http-server
npx http-server

# 또는 PHP
php -S localhost:8000
```

브라우저에서 `http://localhost:8000` 접속

### 2. VS Code Live Server

1. VS Code에서 `index.html` 열기
2. 우클릭 → "Open with Live Server"

## 음악 추가 방법

새로운 곡을 게임에 추가하는 방법:

### 1. 음악 파일 추가
`assets/music/` 폴더에 음악 파일 추가 (mp3, ogg, wav 지원)

### 2. 가사 파일 추가 (선택)
같은 폴더에 `.lrc` 파일 추가 (파일명은 음악과 동일하게)

### 3. musicConfig.js 설정
`js/musicConfig.js` 파일의 `MUSIC_LIST` 배열에 곡 정보 추가:

```javascript
{
  name: '곡 제목',
  file: 'assets/music/곡파일.mp3',
  lrc: 'assets/music/곡파일.lrc',    // 선택사항
  bpm: 120,                          // 곡의 BPM
  offset: 0,                         // 음악 동기화 오프셋 (ms)
  volume: 0.7,                       // 볼륨 (0.0 ~ 1.0)
  travelTime: 2000,                  // 벽이 히트존까지 도달하는 시간
  beatDivision: 2,                   // 비트 분할 (2 = 8비트)
  patterns: {
    normalChance: 0.45,              // 일반 벽 확률
    comboChance: 0.15,               // 연타 확률
    tripleComboChance: 0.10,         // 3연타 확률
    rapidComboChance: 0.10,          // 빠른 연타 확률
    delayedComboChance: 0.05,        // 지연 연타 확률
    skipChance: 0.15,                // 쉬는 타이밍 확률
    comboCount: [2, 3],              // 연타 개수
    tripleComboCount: 3,
    rapidComboCount: 5,
    delayedComboCount: 2,
    comboDivision: 2,
    rapidDivision: 4,
    delayedOffset: 0.3
  },
  sections: [                        // 구간별 설정
    { start: 0, end: 30000, name: 'intro', speedMultiplier: 1.0 },
    { start: 30000, end: 60000, name: 'verse', speedMultiplier: 1.1 },
    { start: 60000, end: 90000, name: 'chorus', speedMultiplier: 1.2 }
  ]
}
```

## 스프라이트 다운로드

이 프로젝트는 **Martial Hero** 스프라이트를 사용합니다.

### 다운로드 방법
1. https://luizmelo.itch.io/martial-hero 접속
2. "Download Now" 클릭 (가격은 $0 또는 원하는 금액)
3. 다운로드한 ZIP 파일 압축 해제
4. 모든 PNG 파일을 `assets/sprites/martial-hero/` 폴더에 복사

### 라이선스
- **CC0 (Creative Commons Zero)** - 완전 무료, 상업적 사용 가능
- 크레딧 표시 불필요 (하지만 감사 표시는 환영!)

### 포함된 애니메이션
- Idle (8 frames) - 대기 상태
- Run (8 frames) - 달리기
- Jump (4 frames) - 점프
- Fall (4 frames) - 낙하
- Attack1 (6 frames) - 오른손 펀치
- Attack2 (6 frames) - 왼손 펀치
- Attack3 (6 frames) - 어퍼컷
- Take Hit (4 frames) - 피격
- Death (6 frames) - 사망

## 스프라이트 교체 방법

다른 스프라이트로 쉽게 교체할 수 있도록 설정이 분리되어 있습니다.

### 방법 1: 기존 프리셋 사용
`js/spriteConfig.js` 파일을 열고 **CURRENT_SPRITE** 값 변경:

```javascript
const CURRENT_SPRITE = 'MARTIAL_HERO';  // 다른 프리셋 이름으로 변경
```

### 방법 2: 새로운 스프라이트 추가
`js/spriteConfig.js`의 **SPRITE_PRESETS** 객체에 새 설정 추가:

```javascript
MY_CUSTOM_SPRITE: {
  name: '내 스프라이트',
  author: '제작자',
  license: '라이선스',
  path: 'assets/sprites/my-sprite/',
  frameWidth: 64,
  frameHeight: 64,
  characterScale: 4,
  files: {
    IDLE: 'idle.png',
    RUN: 'run.png',
    // ... 나머지 파일들
  },
  frameCounts: {
    IDLE: 4,
    RUN: 6,
    // ... 각 애니메이션 프레임 수
  }
}
```

그 다음 `CURRENT_SPRITE = 'MY_CUSTOM_SPRITE'`로 변경!

## 주요 클래스 설명

### Character.js
캐릭터의 상태(IDLE, RUN, 공격, 데미지 등)를 관리하고 애니메이션을 제어합니다.

**주요 메서드**:
- `handleAttack()`: 3단 콤보 공격 처리
- `setState(state)`: 캐릭터 상태 전환
- `isAttacking()`: 공격 중인지 확인

### WallManager.js
벽의 생성, 이동, 판정, 충돌을 관리합니다.

**주요 기능**:
- 비트에 맞춰 벽 생성
- 판정 범위 계산 (WOW/GREAT/GOOD/MISS)
- 구간별 속도 증가
- 디버그 모드 (판정 범위 시각화)

### ScoreManager.js
점수, 체력, 콤보, 판정 통계를 관리하고 UI를 표시합니다.

**주요 기능**:
- 판정별 점수 계산
- 콤보 배율 적용
- 게임 오버 화면
- 랭킹 표시

### MusicManager.js
음악 재생과 비트 동기화를 담당합니다.

**주요 기능**:
- 음악 로딩 및 재생
- BPM 기반 비트 감지
- 구간별 패턴 관리
- 벽 생성 타이밍 제어

### RankingManager.js
로컬 스토리지를 사용하여 곡별 랭킹을 저장하고 불러옵니다.

**주요 기능**:
- 점수 저장 (닉네임, 점수, 날짜)
- 랭킹 정렬 (Top 5)
- 곡별 랭킹 분리 관리

## 학습 키워드

### 게임 개발
- 리듬 게임 (Rhythm Game)
- 타이밍 판정 (Timing Judgment)
- 상태 머신 (State Machine)
- 콤보 시스템 (Combo System)
- 충돌 감지 (Collision Detection)

### p5.js
- 스프라이트 애니메이션 (Sprite Animation)
- 스프라이트 슬라이싱 (Sprite Slicing)
- 사운드 재생 및 동기화 (Sound Playback & Sync)
- 프레임 렌더링 (Frame Rendering)
- 입력 처리 (Input Handling)

### 웹 기술
- 로컬 스토리지 (Local Storage)
- LRC 파일 파싱 (LRC File Parsing)
- 비동기 리소스 로딩 (Async Resource Loading)

## 개발 팁

### 디버그 모드 활용
`D` 키를 눌러 디버그 모드를 활성화하면:
- 판정 범위가 색상으로 표시됨 (WOW: 노란색, GREAT: 초록색, GOOD: 파란색, MISS: 빨간색)
- 각 벽의 히트박스가 표시됨
- 현재 벽 수와 파괴한 벽 수가 표시됨

### 오토 플레이로 테스트
`F7` 키로 오토 플레이 모드를 켜면:
- AI가 WOW 판정 범위에 정확히 공격
- 새로운 패턴이나 곡을 테스트할 때 유용
- 최고 점수 확인 가능

### BPM 동기화 맞추기
음악과 벽이 동기화되지 않는다면:
1. `musicConfig.js`의 `offset` 값 조정 (ms 단위)
2. `travelTime` 값 조정 (벽이 도달하는 시간)
3. 오토 플레이로 테스트하며 타이밍 확인

## 크레딧

### 개발자
- 강민우
- 김우혁
- 유원준

### 리소스
- **스프라이트**: [Martial Hero](https://luizmelo.itch.io/martial-hero) by LuizMelo (CC0 License)
- **프레임워크**: [p5.js](https://p5js.org/) - 그래픽 및 애니메이션
- **사운드 라이브러리**: [p5.sound](https://p5js.org/reference/#/libraries/p5.sound) - 음악 재생

### 라이선스
이 프로젝트는 교육 목적으로 제작되었습니다.

---

**즐거운 게임 되세요! 🎮🎵**
