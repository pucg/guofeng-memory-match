import Phaser from 'phaser';

import {
  addGameText,
  gamePixels,
  gameUnits,
  GAME_CENTER_X,
  GAME_HEIGHT,
  GAME_WIDTH,
} from '@/rendering';
import { markEditable } from '@/utils';

const BOARD_COLS = 4;
const BOARD_ROWS = 4;
const TOTAL_CARDS = BOARD_COLS * BOARD_ROWS;
const TOTAL_PAIRS = TOTAL_CARDS / 2;

const FONT_FAMILY = '"KaiTi", "STKaiti", "SimSun", "Noto Serif SC", serif';
const INK_COLOR = '#3f3a30';
const PAPER_COLOR = 0xf7f0e0;
const CARD_PAPER = 0xfdf8ec;
const GOLD = 0xd4af6a;
const BACK_COLOR = 0x3f4a5f;

interface CardElement {
  readonly id: string;
  readonly name: string;
  readonly color: number;
}

const CARD_ELEMENTS: readonly CardElement[] = [
  { id: 'mei', name: '梅', color: 0xd14b4f },
  { id: 'lan', name: '兰', color: 0x7d9a5a },
  { id: 'zhu', name: '竹', color: 0x3d7c59 },
  { id: 'ju', name: '菊', color: 0xd99a3f },
  { id: 'he', name: '荷', color: 0xd98aa0 },
  { id: 'die', name: '蝶', color: 0x8e6ba8 },
  { id: 'yu', name: '鱼', color: 0x4f8ab0 },
  { id: 'he2', name: '鹤', color: 0x5d6b7c },
];

interface CardState {
  readonly uid: number;
  readonly elementId: string;
  readonly name: string;
  readonly color: number;
}

class CardView {
  readonly root: Phaser.GameObjects.Container;
  readonly state: CardState;
  readonly size: number;
  private readonly scene: Phaser.Scene;
  private readonly backFace: Phaser.GameObjects.Container;
  private readonly frontFace: Phaser.GameObjects.Container;
  private revealed = false;
  private matched = false;
  private flipping = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number,
    state: CardState,
    onFlip: (card: CardView) => void,
  ) {
    this.scene = scene;
    this.state = state;
    this.size = size;

    this.root = scene.add.container(x, y);
    this.root.setSize(size, size);

    this.backFace = this.buildBack();
    this.frontFace = this.buildFront();
    this.frontFace.setVisible(false);
    this.root.add([this.backFace, this.frontFace]);

    this.root.setInteractive(
      new Phaser.Geom.Rectangle(size / 2, size / 2, size, size),
      Phaser.Geom.Rectangle.Contains,
    );
    this.root.on('pointerdown', () => {
      if (!this.revealed && !this.matched && !this.flipping) {
        this.root.setScale(0.96, 0.96);
      }
    });
    this.root.on('pointerup', () => {
      this.root.setScale(1, 1);
      if (!this.revealed && !this.matched && !this.flipping) {
        onFlip(this);
      }
    });
    this.root.on('pointerout', () => {
      this.root.setScale(1, 1);
    });
  }

  get isRevealed(): boolean {
    return this.revealed;
  }

  get isMatched(): boolean {
    return this.matched;
  }

  private buildBack(): Phaser.GameObjects.Container {
    const face = this.scene.add.container(0, 0);
    const radius = gameUnits(36);

    const g = this.scene.add.graphics();
    g.fillStyle(BACK_COLOR, 1);
    g.fillRoundedRect(0, 0, this.size, this.size, radius);
    g.lineStyle(gameUnits(6), GOLD, 1);
    g.strokeRoundedRect(
      gameUnits(14),
      gameUnits(14),
      this.size - gameUnits(28),
      this.size - gameUnits(28),
      radius * 0.8,
    );

    const cx = this.size / 2;
    const cy = this.size / 2;
    g.lineStyle(gameUnits(8), GOLD, 1);
    g.strokeCircle(cx, cy, this.size * 0.27);

    face.add(g);

    const emblem = addGameText(
      this.scene,
      cx,
      cy,
      '忆',
      {
        color: '#e3c98f',
        fontFamily: FONT_FAMILY,
        fontSize: gamePixels(96),
      },
    ).setOrigin(0.5);
    face.add(emblem);

    return face;
  }

  private buildFront(): Phaser.GameObjects.Container {
    const face = this.scene.add.container(0, 0);
    const radius = gameUnits(36);
    const cx = this.size / 2;
    const cy = this.size / 2;

    const g = this.scene.add.graphics();
    g.fillStyle(CARD_PAPER, 1);
    g.fillRoundedRect(0, 0, this.size, this.size, radius);
    g.lineStyle(gameUnits(8), this.state.color, 1);
    g.strokeRoundedRect(
      gameUnits(16),
      gameUnits(16),
      this.size - gameUnits(32),
      this.size - gameUnits(32),
      radius * 0.8,
    );

    g.fillStyle(this.state.color, 1);
    g.fillCircle(cx, cy, this.size * 0.29);

    face.add(g);

    const ch = addGameText(
      this.scene,
      cx,
      cy,
      this.state.name,
      {
        color: '#fffaf0',
        fontFamily: FONT_FAMILY,
        fontSize: gamePixels(120),
      },
    ).setOrigin(0.5);
    face.add(ch);

    const dots: Phaser.GameObjects.Arc[] = [0.28, 0.5, 0.72].map((f) =>
      this.scene.add.circle(
        this.size * f,
        gameUnits(44),
        gameUnits(9),
        GOLD,
      ),
    );
    face.add(dots);

    return face;
  }

  flipToFront(): void {
    this.revealed = true;
    this.flipping = true;
    this.tweenScaleX(0, () => {
      this.backFace.setVisible(false);
      this.frontFace.setVisible(true);
      this.tweenScaleX(1, () => {
        this.flipping = false;
      });
    });
  }

  flipToBack(): void {
    this.revealed = false;
    this.flipping = true;
    this.tweenScaleX(0, () => {
      this.frontFace.setVisible(false);
      this.backFace.setVisible(true);
      this.tweenScaleX(1, () => {
        this.flipping = false;
      });
    });
  }

  markMatched(): void {
    this.matched = true;
    this.root.setAlpha(0.42);
    this.root.disableInteractive();

    const cx = this.root.x + this.size / 2;
    const cy = this.root.y + this.size / 2;
    const halo = this.scene.add
      .circle(cx, cy, this.size * 0.3, GOLD, 0.9)
      .setStrokeStyle(gameUnits(10), GOLD, 1)
      .setDepth(this.root.depth + 1);

    this.scene.tweens.add({
      targets: halo,
      scale: 1.7,
      alpha: 0,
      duration: 520,
      ease: 'Sine.out',
      onComplete: () => {
        halo.destroy();
      },
    });
  }

  private tweenScaleX(target: number, onComplete: () => void): void {
    this.scene.tweens.add({
      targets: this.root,
      scaleX: target,
      duration: 150,
      ease: 'Sine.inOut',
      onComplete,
    });
  }
}

export class MainGameScene extends Phaser.Scene {
  private moves = 0;
  private matchedCount = 0;
  private locked = false;
  private flippedCards: CardView[] = [];
  private timerEvent?: Phaser.Time.TimerEvent;
  private elapsedSeconds = 0;
  private movesText?: Phaser.GameObjects.Text;
  private timeText?: Phaser.GameObjects.Text;
  private cardViews: CardView[] = [];

  constructor() {
    super('main-game');
  }

  init(): void {
    this.moves = 0;
    this.matchedCount = 0;
    this.locked = false;
    this.flippedCards = [];
    this.elapsedSeconds = 0;
    this.timerEvent?.remove(false);
    this.timerEvent = undefined;
    this.cardViews = [];
  }

  create(): void {
    this.createBackground();
    this.createHeader();
    this.createHud();
    this.createBoard();
    this.startTimer();
  }

  private createBackground(): void {
    const g = this.add.graphics();
    g.fillStyle(PAPER_COLOR, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cx = GAME_CENTER_X;
    const cy = gameUnits(360);
    g.lineStyle(gameUnits(6), 0xd8c9a3, 0.7);
    g.strokeCircle(cx, cy, gameUnits(190));
    g.lineStyle(gameUnits(4), 0xd8c9a3, 0.7);
    g.strokeCircle(cx, cy, gameUnits(226));
  }

  private createHeader(): void {
    markEditable(
      'main-game.title',
      addGameText(this, GAME_CENTER_X, gameUnits(210), '国风记忆翻牌', {
        color: INK_COLOR,
        fontFamily: FONT_FAMILY,
        fontSize: gamePixels(118),
        fontStyle: 'bold',
      }).setOrigin(0.5),
      { label: '游戏标题' },
    );

    markEditable(
      'main-game.subtitle',
      addGameText(this, GAME_CENTER_X, gameUnits(360), '花鸟虫鱼 · 雅趣翻牌', {
        color: '#8a7a5a',
        fontFamily: FONT_FAMILY,
        fontSize: gamePixels(52),
      }).setOrigin(0.5),
      { label: '副标题' },
    );
  }

  private createHud(): void {
    const hudWidth = gameUnits(1680);
    const hudHeight = gameUnits(150);
    const hudX = (GAME_WIDTH - hudWidth) / 2;
    const hudY = gameUnits(560);

    const g = this.add.graphics();
    g.fillStyle(0xefe6d0, 1);
    g.fillRoundedRect(hudX, hudY, hudWidth, hudHeight, gameUnits(32));
    g.lineStyle(gameUnits(4), GOLD, 0.8);
    g.strokeRoundedRect(hudX, hudY, hudWidth, hudHeight, gameUnits(32));

    this.movesText = markEditable(
      'main-game.moves',
      addGameText(this, hudX + gameUnits(260), hudY + hudHeight / 2, '步数 0', {
        color: INK_COLOR,
        fontFamily: FONT_FAMILY,
        fontSize: gamePixels(56),
      }).setOrigin(0, 0.5),
      { label: '步数' },
    );

    this.timeText = markEditable(
      'main-game.timer',
      addGameText(
        this,
        hudX + hudWidth - gameUnits(260),
        hudY + hudHeight / 2,
        '用时 00:00',
        {
          color: INK_COLOR,
          fontFamily: FONT_FAMILY,
          fontSize: gamePixels(56),
        },
      ).setOrigin(1, 0.5),
      { label: '用时' },
    );

    const btnRadius = gameUnits(64);
    const btnCx = hudX + hudWidth - gameUnits(120);
    const btnCy = hudY + hudHeight / 2;
    const restartBtn = this.add
      .circle(btnCx, btnCy, btnRadius, 0xd14b4f)
      .setInteractive();
    const icon = addGameText(this, btnCx, btnCy - gameUnits(4), '↻', {
      color: '#fff',
      fontFamily: 'sans-serif',
      fontSize: gamePixels(72),
    }).setOrigin(0.5);

    restartBtn.on('pointerdown', () => {
      restartBtn.setAlpha(0.85);
    });
    restartBtn.on('pointerup', () => {
      restartBtn.setAlpha(1);
      this.scene.restart();
    });
    restartBtn.on('pointerout', () => {
      restartBtn.setAlpha(1);
    });

    markEditable('main-game.restart', restartBtn, { label: '重新开始按钮' });
    markEditable('main-game.restart-icon', icon, {
      label: '重新开始图标',
    });
  }

  private createBoard(): void {
    const gridWidth = GAME_WIDTH * 0.86;
    const gap = gameUnits(36);
    const cardSize = Math.floor(
      (gridWidth - gap * (BOARD_COLS - 1)) / BOARD_COLS,
    );
    const gridX = (GAME_WIDTH - gridWidth) / 2;
    const gridY = gameUnits(880);

    const deck = this.buildDeck();

    this.cardViews = deck.map((state, index) => {
      const col = index % BOARD_COLS;
      const row = Math.floor(index / BOARD_COLS);
      const x = gridX + col * (cardSize + gap);
      const y = gridY + row * (cardSize + gap);
      return new CardView(this, x, y, cardSize, state, (card) =>
        this.onCardFlip(card),
      );
    });
  }

  private buildDeck(): CardState[] {
    const pairList: CardState[] = [];
    CARD_ELEMENTS.forEach((element, index) => {
      for (let copy = 0; copy < 2; copy += 1) {
        pairList.push({
          uid: index * 2 + copy,
          elementId: element.id,
          name: element.name,
          color: element.color,
        });
      }
    });

    for (let i = pairList.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairList[i], pairList[j]] = [pairList[j], pairList[i]];
    }
    return pairList;
  }

  private startTimer(): void {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.elapsedSeconds += 1;
        this.updateTimeText();
      },
    });
    this.updateTimeText();
    this.updateMovesText();
  }

  private onCardFlip(card: CardView): void {
    if (this.locked || card.isRevealed || card.isMatched) {
      return;
    }

    this.moves += 1;
    this.updateMovesText();
    card.flipToFront();
    this.flippedCards.push(card);

    if (this.flippedCards.length < 2) {
      return;
    }

    this.locked = true;
    const [first, second] = this.flippedCards;
    this.flippedCards = [];

    if (first.state.elementId === second.state.elementId) {
      this.time.delayedCall(260, () => {
        first.markMatched();
        second.markMatched();
        this.matchedCount += 1;
        this.locked = false;
        if (this.matchedCount === TOTAL_PAIRS) {
          this.showResult();
        }
      });
    } else {
      this.time.delayedCall(900, () => {
        first.flipToBack();
        second.flipToBack();
        this.locked = false;
      });
    }
  }

  private showResult(): void {
    this.timerEvent?.remove(false);

    const dim = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x2b2630, 0.55)
      .setOrigin(0, 0)
      .setInteractive()
      .setDepth(100);

    const panelW = gameUnits(1480);
    const panelH = gameUnits(780);
    const panelX = (GAME_WIDTH - panelW) / 2;
    const panelY = (GAME_HEIGHT - panelH) / 2;

    const panel = this.add.graphics().setDepth(101);
    panel.fillStyle(CARD_PAPER, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, gameUnits(48));
    panel.lineStyle(gameUnits(6), GOLD, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, gameUnits(48));

    const title = addGameText(
      this,
      GAME_CENTER_X,
      panelY + gameUnits(150),
      '全部配对完成！',
      {
        color: INK_COLOR,
        fontFamily: FONT_FAMILY,
        fontSize: gamePixels(104),
        fontStyle: 'bold',
      },
    )
      .setOrigin(0.5)
      .setDepth(102);

    const stats = addGameText(
      this,
      GAME_CENTER_X,
      panelY + gameUnits(330),
      `共用 ${this.moves} 步 · 用时 ${this.formatTime(this.elapsedSeconds)}`,
      {
        color: '#6f6757',
        fontFamily: FONT_FAMILY,
        fontSize: gamePixels(56),
      },
    )
      .setOrigin(0.5)
      .setDepth(102);

    const btnW = gameUnits(560);
    const btnH = gameUnits(140);
    const btnX = GAME_CENTER_X - btnW / 2;
    const btnY = panelY + panelH - gameUnits(220);
    const againBtn = this.add
      .circle(GAME_CENTER_X, btnY + btnH / 2, btnW / 2, 0xd14b4f)
      .setInteractive()
      .setDepth(102);

    againBtn.on('pointerdown', () => {
      againBtn.setAlpha(0.85);
    });
    againBtn.on('pointerup', () => {
      againBtn.setAlpha(1);
      this.scene.restart();
    });
    againBtn.on('pointerout', () => {
      againBtn.setAlpha(1);
    });

    const againLabel = addGameText(
      this,
      GAME_CENTER_X,
      btnY + btnH / 2,
      '再来一局',
      {
        color: '#fff',
        fontFamily: FONT_FAMILY,
        fontSize: gamePixels(60),
        fontStyle: 'bold',
      },
    )
      .setOrigin(0.5)
      .setDepth(103);

    markEditable('main-game.result-title', title, {
      label: '结算标题',
    });
    markEditable('main-game.result-stats', stats, {
      label: '结算统计',
    });
    markEditable('main-game.restart-again', againBtn, {
      label: '再来一局按钮',
    });
    markEditable('main-game.restart-again-label', againLabel, {
      label: '再来一局文案',
    });
    markEditable('main-game.result-dim', dim, {
      label: '结算遮罩',
    });
  }

  private updateMovesText(): void {
    this.movesText?.setText(`步数 ${this.moves}`);
  }

  private updateTimeText(): void {
    this.timeText?.setText(`用时 ${this.formatTime(this.elapsedSeconds)}`);
  }

  private formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }
}
