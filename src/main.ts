import Phaser from 'phaser';

import { BootScene } from './scene/BootScene';
import { MainGameScene } from './scene/MainGameScene';
import { GAME_HEIGHT, GAME_WIDTH } from './rendering';
import './style.css';

const createGame = (_launchSpec?: LaunchSpec): Phaser.Game => {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    pixelArt: false,
    parent: 'game',
    // 运行时单坐标系：Canvas、Scene、Camera、Pointer 与碰撞完全一致。
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#ffffff',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, MainGameScene],
  });

  return game;
};

// 注册游戏到 PhaserBridge，可以在扣子网页游戏开发中编辑评论
if (window.PhaserBridge) {
  window.PhaserBridge.bind({ launchGame: createGame });
} else {
  createGame();
}
