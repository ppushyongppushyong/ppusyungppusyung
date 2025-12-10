/**
 * Wall 클래스
 * 오른쪽에서 왼쪽으로 이동하는 파괴 가능한 벽(장애물)
 */
class Wall {
  constructor(x, y, speed = 8) {
    this.x = x;
    this.y = y;
    this.speed = speed;

    // 벽 크기
    this.width = 160;
    this.height = 300;

    // 상태 상수
    this.states = {
      NORMAL: 'NORMAL',
      DESTROYED: 'DESTROYED'
    };
    this.currentState = this.states.NORMAL;

    // 판정 상태
    this.hasBeenJudged = false;

    // 파괴 이펙트용 파티클
    this.particles = [];
    
    // 스프라이트
    this.sprite = null;
  }

  setSprite(sprite) {
    this.sprite = sprite;
  }

  destroy() {
    if (this.currentState === this.states.NORMAL) {
      this.currentState = this.states.DESTROYED;
      this.createDestroyParticles();
      // console.log('💥 벽 파괴!'); // 로그는 성능을 위해 주석 처리 권장
    }
  }

  createDestroyParticles() {
    const particleCount = 10; // 파티클 수 약간 증가
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: this.x + random(-this.width / 3, this.width / 3),
        y: this.y + random(-this.height / 3, this.height / 3),
        vx: random(-8, 8),      // 폭발력 증가
        vy: random(-10, -4),    // 위로 솟구침
        size: random(15, 30),
        rotation: random(TWO_PI),
        rotationSpeed: random(-0.3, 0.3),
        color: color(139, 90, 43), // 색상 객체 저장
        alpha: 255
      });
    }
  }

  updateParticles() {
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.6; // 중력 강화
      p.rotation += p.rotationSpeed;
      p.alpha -= 6; // 서서히 투명
      p.size *= 0.95; // 크기가 점차 줄어듬 (자연스러운 소멸)
    }
    this.particles = this.particles.filter(p => p.alpha > 0 && p.size > 2);
  }

  shouldRemove() {
    if (this.currentState === this.states.DESTROYED) {
      return this.particles.length === 0;
    }
    return this.x < -this.width - 100; // 여유 있게 제거
  }

  isInHitZone(zoneX, zoneWidth) {
    if (this.currentState !== this.states.NORMAL) return false;
    // 범위 최적화: abs 사용
    return Math.abs(this.x - zoneX) < (this.width + zoneWidth) / 2;
  }

  isCollidingWith(characterX, characterWidth) {
    if (this.currentState !== this.states.NORMAL) return false;
    return Math.abs(this.x - characterX) < (this.width + characterWidth) / 2;
  }

  update() {
    if (this.currentState === this.states.NORMAL) {
      this.x -= this.speed;
    } else {
      this.updateParticles();
    }
  }

  display() {
    push();
    if (this.currentState === this.states.NORMAL) {
      if (this.sprite) {
        imageMode(CENTER);
        image(this.sprite, this.x, this.y, this.width, this.height);
      } else {
        // 스프라이트 없을 때 기본 도형 (최적화를 위해 복잡한 패턴 제거 가능)
        rectMode(CENTER);
        fill(139, 90, 43);
        stroke(100, 60, 20);
        strokeWeight(3);
        rect(this.x, this.y, this.width, this.height, 5);
        // (벽돌 패턴은 성능 이슈가 없다면 유지, 여기선 생략)
      }
    } else {
      // 파티클 렌더링
      noStroke();
      rectMode(CENTER);
      for (let p of this.particles) {
        push();
        translate(p.x, p.y);
        rotate(p.rotation);
        fill(red(p.color), green(p.color), blue(p.color), p.alpha);
        rect(0, 0, p.size, p.size, 2);
        pop();
      }
    }
    pop();
  }

  displayDebug(hitZoneX, hitZoneWidth) {
    push();
    noFill();
    stroke(255, 0, 0);
    strokeWeight(2);
    rectMode(CENTER);
    rect(this.x, this.y, this.width, this.height);

    if (this.isInHitZone(hitZoneX, hitZoneWidth)) {
      stroke(0, 255, 0);
      strokeWeight(4);
      rect(this.x, this.y, this.width + 10, this.height + 10);
    }
    pop();
  }
}
