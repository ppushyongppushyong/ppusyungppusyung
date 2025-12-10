/**
 * WallManager 클래스
 * 벽 생성, 관리, 충돌 판정 담당
 */
class WallManager {
  constructor(gameWidth, gameHeight) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;

    this.walls = [];
    
    // 설정값
    this.spawnInterval = 2000;
    this.lastSpawnTime = 0;
    this.wallSpeed = 16;
    this.wallY = gameHeight - 200 - 225; // 벽 생성 Y 위치

    // 판정 관련
    this.hitZoneOffset = 150;
    this.hitZoneWidth = 200;
    this.characterWidth = 100;

    // 게임 상태
    this.isActive = true;
    this.destroyedCount = 0;
    this.debugMode = false;

    // 리소스
    this.wallSprites = [];
    this.currentSpriteIndex = 0;
    
    // 리듬 및 속도
    this.rhythmMode = false;
    this.baseWallSpeed = 16;
    this.currentSpeedMultiplier = 1.0;
    this.maxSpeedMultiplier = 2.5; // 최대 속도 상향

    // 판정 피드백
    this.lastJudgment = null;
    this.judgmentDuration = 800;
    this.judgmentImages = { wow: null, great: null, good: null, miss: null };
    
    // 이펙트
    this.hitEffectFrames = [];
    this.activeHitEffects = [];
    this.hitEffectFrameRate = 40; // 프레임 속도 조절 (더 부드럽게)
  }

  getHitZoneX(characterX) {
    return characterX + this.hitZoneOffset;
  }

  spawnWall() {
    const spawnX = this.gameWidth + 100; // 화면 밖 여유 공간 확보

    // 겹침 방지 로직 개선
    // 속도가 빠를수록 거리 간격을 넓혀야 리듬이 유지됨 (Distance = Speed * Time)
    // 기존 로직: minDistance = base / multiplier (속도가 빠르면 간격이 좁아짐 -> 매우 빠른 연타 가능)
    // 안전 장치: 최소 물리적 거리는 확보
    const safeDistance = 60; 
    const recentWalls = this.walls.filter(w => w.currentState === w.states.NORMAL);
    
    if (recentWalls.length > 0) {
      const lastWall = recentWalls[recentWalls.length - 1];
      if (Math.abs(lastWall.x - spawnX) < safeDistance) {
        // console.log('⚠️ 너무 가까워서 스폰 생략');
        return false;
      }
    }

    const currentSpeed = this.baseWallSpeed * this.currentSpeedMultiplier;
    const wall = new Wall(spawnX, this.wallY, currentSpeed);

    if (this.wallSprites.length > 0) {
      wall.setSprite(this.wallSprites[this.currentSpriteIndex]);
      this.currentSpriteIndex = (this.currentSpriteIndex + 1) % this.wallSprites.length;
    }

    this.walls.push(wall);
    return true;
  }

  autoSpawn() {
    if (!this.isActive || this.rhythmMode) return;
    const currentTime = millis();
    // 속도가 빨라지면 스폰 간격도 줄어들도록 조정
    const adjustedInterval = this.spawnInterval / this.currentSpeedMultiplier;
    
    if (currentTime - this.lastSpawnTime >= adjustedInterval) {
      this.spawnWall();
      this.lastSpawnTime = currentTime;
    }
  }

  spawnOnBeat(beatInfo) {
    if (!this.isActive) return;
    
    // 패턴 처리 (기존 로직 유지)
    const pattern = beatInfo.pattern;
    // ... (기존 spawnOnBeat 내부 로직 동일하게 사용) ...
    // 단, setTimeout 사용 시 주의: 브라우저 탭 비활성 시 타이밍 밀림 발생 가능
    if (pattern.type === 'normal') {
      this.spawnWall();
    } else if (pattern.type === 'combo') {
       const count = pattern.count || 2;
       const interval = this.beatInterval / (pattern.division || 2);
       for(let i=0; i<count; i++) setTimeout(() => this.spawnWall(), i * interval);
    }
    // ... 기타 패턴들 ...
  }

  tryDestroyWall(characterX) {
    const hitZoneX = this.getHitZoneX(characterX);

    // 판정 가능한 벽 찾기 (앞에 있는 순서대로)
    for (let wall of this.walls) {
      if (wall.hasBeenJudged) continue;

      if (wall.isInHitZone(hitZoneX, this.hitZoneWidth)) {
        const distance = Math.abs(wall.x - hitZoneX);
        const judgment = this.calculateJudgment(distance);

        wall.hasBeenJudged = true;
        const destroyed = judgment !== 'miss';
        const originalX = wall.x; // 이펙트 위치 저장

        if (destroyed) {
          wall.destroy();
          this.destroyedCount++;
          
          // 벽을 화면 밖으로 이동시키는 대신 상태만 변경하고 업데이트에서 처리하도록 함
          // 하지만 충돌 로직이 x좌표 기반이라면 멀리 보내는 것이 안전
          wall.x = -2000; 

          this.createHitEffect(originalX, this.wallY);
        }

        this.lastJudgment = {
          type: judgment,
          time: millis(),
          x: originalX,
          y: this.wallY - 150
        };

        return { type: judgment, destroyed };
      }
    }
    return null; // 판정 범위 내 벽이 없음
  }

  calculateJudgment(distance) {
    // 판정 범위 (엄격함 조절 가능)
    const wowZone = this.hitZoneWidth * 0.15;
    const greatZone = this.hitZoneWidth * 0.3;
    const goodZone = this.hitZoneWidth * 0.45;
    
    if (distance <= wowZone) return 'wow';
    if (distance <= greatZone) return 'great';
    if (distance <= goodZone) return 'good';
    return 'miss';
  }

  checkCollision(characterX) {
    // some()을 사용하여 성능 최적화 (하나라도 충돌하면 즉시 반환)
    return this.walls.some(wall => wall.isCollidingWith(characterX, this.characterWidth));
  }

  update() {
    this.autoSpawn();
    this.walls.forEach(wall => wall.update());
    this.walls = this.walls.filter(wall => !wall.shouldRemove());
    
    // 히트 이펙트도 여기서 업데이트하면 좋음 (현재는 display에서 처리 중인 듯)
  }

  display() {
    // 벽 렌더링
    this.walls.forEach(wall => wall.display());
    
    // 이펙트 렌더링
    this.updateAndDisplayHitEffects();
    
    // 판정 텍스트/이미지 렌더링
    this.displayJudgment();
  }

  createHitEffect(x, y) {
    if (this.hitEffectFrames.length === 0) return;
    this.activeHitEffects.push({
      x: x,
      y: y,
      startTime: millis(),
      duration: this.hitEffectFrames.length * this.hitEffectFrameRate
    });
  }

  updateAndDisplayHitEffects() {
    const currentTime = millis();
    
    for (let i = this.activeHitEffects.length - 1; i >= 0; i--) {
      const effect = this.activeHitEffects[i];
      const elapsed = currentTime - effect.startTime;
      const frameIndex = Math.floor(elapsed / this.hitEffectFrameRate);

      if (frameIndex < this.hitEffectFrames.length) {
        const frame = this.hitEffectFrames[frameIndex];
        if (frame) {
          push();
          imageMode(CENTER);
          // 크기 조정 (필요시 scale 조절)
          image(frame, effect.x, effect.y, 300, 300);
          pop();
        }
      } else {
        this.activeHitEffects.splice(i, 1); // 완료된 이펙트 제거
      }
    }
  }

  displayJudgment() {
    if (!this.lastJudgment) return;

    const elapsed = millis() - this.lastJudgment.time;
    if (elapsed > this.judgmentDuration) {
      this.lastJudgment = null;
      return;
    }

    const progress = elapsed / this.judgmentDuration;
    const fadeOut = constrain(map(progress, 0.7, 1, 255, 0), 0, 255); // 끝부분에서만 페이드 아웃
    const yOffset = -Math.sin(progress * PI) * 20; // 살짝 위로 떴다 가라앉음
    
    push();
    translate(this.lastJudgment.x, this.lastJudgment.y + yOffset);
    
    const img = this.judgmentImages[this.lastJudgment.type];
    
    if (img) {
      imageMode(CENTER);
      tint(255, fadeOut);
      // 스케일 효과: 쾅! 하고 커졌다가 원래대로
      const scaleVal = 1 + (1 - progress) * 0.2; 
      image(img, 0, 0, img.width * scaleVal * 0.5, img.height * scaleVal * 0.5);
    } else {
      // 텍스트 폴백 (더 예쁘게)
      textAlign(CENTER, CENTER);
      textSize(40);
      stroke(0);
      strokeWeight(4);
      
      const colors = {
        wow: '#FFD700',   // 골드
        great: '#00FF00', // 그린
        good: '#87CEEB',  // 블루
        miss: '#888888'   // 회색
      };
      
      fill(color(colors[this.lastJudgment.type] || '#FFF'));
      // 투명도 적용
      let c = color(colors[this.lastJudgment.type]);
      c.setAlpha(fadeOut);
      fill(c);
      
      text(this.lastJudgment.type.toUpperCase(), 0, 0);
    }
    pop();
  }

  displayDebug(characterX) {
    if (!this.debugMode) return;

    push();
    const hitZoneX = this.getHitZoneX(characterX);
    
    // Hit Zone 시각화
    rectMode(CENTER);
    noFill();
    
    // MISS (전체 영역)
    stroke(255, 100, 100);
    rect(hitZoneX, this.wallY, this.hitZoneWidth, 200);
    
    // WOW (중심)
    stroke(255, 255, 0);
    rect(hitZoneX, this.wallY, this.hitZoneWidth * 0.15 * 2, 200);

    // 디버그 정보
    fill(255);
    noStroke();
    textSize(14);
    textAlign(LEFT, TOP);
    text(`Walls: ${this.walls.length}`, 20, 80);
    text(`Speed: x${this.currentSpeedMultiplier.toFixed(2)}`, 20, 100);
    
    // !! 중요 수정: this.canvasHeight -> this.gameHeight
    fill(0, 0, 0, 50);
    rect(characterX, this.gameHeight/2, 200, this.gameHeight); 
    pop();
  }
  
  // ... (나머지 setter 메서드들은 그대로 유지) ...
  setWallSprites(sprites) { this.wallSprites = sprites.filter(s => s); }
  setJudgmentImages(images) { this.judgmentImages = images; }
  setHitEffectFrames(frames) { this.hitEffectFrames = frames; }
  setSpeedMultiplierForSection(multiplier) {
     this.currentSpeedMultiplier = Math.min(multiplier, this.maxSpeedMultiplier);
  }
}
