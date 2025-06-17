import {
  _decorator,
  Component,
  director,
  instantiate,
  Label,
  Node,
  Prefab,
} from "cc";
import {
  CHANGE_BOARD,
  CHECK_CLEAR,
  CHECK_COMPLETE,
  CHECK_LOSED,
} from "./Event";
import {
  GAME_BOARD_ENUM,
  GAME_EVENT_ENUM,
  GAME_SCENE_ENUM,
  GAME_STATUS_ENUM,
} from "./Enum";
import { Block } from "./Block";
import { DataManager } from "./DataManager";
import { levels } from "./Level";
import { BlockType } from "./type";
const { ccclass, property } = _decorator;

@ccclass("GameManager")
export class GameManager extends Component {
  @property(Node)
  boardLevelNode: Node = null;

  @property(Node)
  boardLevelExtendNode: Node = null;

  @property(Node)
  boardRandomLeftNode: Node = null;

  @property(Node)
  boardRandomRightNode: Node = null;

  @property(Node)
  boardSlotNode: Node = null;

  @property(Node)
  boardHideNode: Node = null;

  @property(Prefab)
  blockPrefab: Prefab = null;

  @property(Label)
  titleLabel: Label = null;

  @property(Node)
  gameOverNode: Node = null;

  @property(Node)
  gameCompleteNode: Node = null;

  protected onLoad(): void {
    director.preloadScene(GAME_SCENE_ENUM.MENU);
    CHANGE_BOARD.on(GAME_EVENT_ENUM.CHANGE_BOARD, this.onChangeBoard, this);
    CHECK_CLEAR.on(GAME_EVENT_ENUM.CHECK_CLEAR, this.onCheckClear, this);
    CHECK_LOSED.on(GAME_EVENT_ENUM.CHECK_LOSED, this.onCheckLose, this);
    CHECK_COMPLETE.on(
      GAME_EVENT_ENUM.CHECK_COMPLETE,
      this.onCheckComplete,
      this
    );
    this.gameStart();
  }

  gameStart() {
    DataManager.instance.restore();
    this.initGame(DataManager.instance.level);
    DataManager.instance.gameStatus = GAME_STATUS_ENUM.RUNNING;
  }

  onGameReset() {}

  onGameExtend() {}

  onGameUndo() {}
  onGameShuffle() {}
  onClickable() {}
  onGameNext() {}
  onBackMenu() {}
  initChessBox(width: number, height: number) {
    let box = new Array(width);
    for (let i = 0; i < width; i++) {
      box[i] = new Array(height);
      for (let j = 0; j < height; j++) {
        box[i][j] = {
          blocks: [],
        };
      }
    }
    return box;
  }
  initGame(num: number) {
    let currentLevel = levels[num - 1];
    if (!currentLevel) {
      if (levels[0]) {
        num = 1;
        DataManager.instance.level = 1;
        currentLevel = levels[0];
      } else {
        return;
      }
    }
    DataManager.instance.currentLevel = currentLevel;
    this.titleLabel.string = `Level ${num}`;
    // The calculation of blockUnit is the smallest unit of a block that can pass the current level.
    // This value is mainly used to determine whether a matching block stack can be placed within that unit count.
    const blockUnit = currentLevel.clearableNum * currentLevel.blockTypeNum;
    let totalBlockNum =
      currentLevel.leftRandomBlocks +
      currentLevel.rightRandomBlocks +
      currentLevel.levelNum * currentLevel.levelBlockNum;
    if (totalBlockNum % blockUnit !== 0)
      totalBlockNum = Math.floor(totalBlockNum / blockUnit + 1) * blockUnit;

    const typeArr = [];
    const contentTarget = currentLevel.blockTypeArr.slice(
      0,
      currentLevel.blockTypeNum
    );
    for (let i = 0; i < totalBlockNum; i++) {
      typeArr.push(contentTarget[i % contentTarget.length]);
    }

    const blockArr: BlockType[] = [];
    for (let i = 0; i < totalBlockNum; i++) {
      blockArr.push({
        id: i,
        x: null,
        y: null,
        width: currentLevel.chessItemWidth * 3,
        height: currentLevel.chessItemHeight * 3,
        level: 0,
        boardType: null,
        type: typeArr[i],
        higherIds: [],
        lowerIds: [],
      });
    }

    /**
     * When can it be considered as a regular level block:
     * 1. leftRandomBlocks == 0
     * 2. rightRandomBlocks == 0
     * 3. levelBlockNum % clearableNum == 0
     * 4. levelNum * levelBlockNum % (clearableNum * blockTypeNum) == 0
     * 5. levelBlockNum <= 16
     */

    /**
     * Meaning:
     * - The number of left and right random blocks in the current level is 0.
     * - The number of blocks per layer can be evenly divided by the number of blocks required to clear.
     * - The total number of blocks in the level can be evenly matched according to the clearable count and block types.
     * - Lastly, each layer has 16 blocks or fewer.
     */
    let isRandom = true;
    if (
      currentLevel.leftRandomBlocks == 0 &&
      currentLevel.rightRandomBlocks == 0 &&
      currentLevel.levelBlockNum % currentLevel.clearableNum &&
      (currentLevel.levelNum * currentLevel.levelBlockNum) %
        (currentLevel.clearableNum * currentLevel.blockTypeNum) ==
        0 &&
      currentLevel.levelBlockNum <= 16
    ) {
      isRandom = false;
    }

    // Initialize grid (2D grid box)
    let chessBox = this.initChessBox(
      currentLevel.chessWidthNum,
      currentLevel.chessHeightNum
    );

    // Initialize blocks within the grid
    let chessBlocks: BlockType[] = [];

    // Initialize blocks inside the playable area
    let remainBlockNum =
      totalBlockNum -
      currentLevel.leftRandomBlocks -
      currentLevel.rightRandomBlocks;

    // Combine the remaining blocks
    let minWidth = 0,
      maxWidth = currentLevel.chessWidthNum - 2,
      minHeight = 0,
      maxHeight = currentLevel.chessHeightNum - 2;

    for (let i = 0; i < currentLevel.levelNum; i++) {
      // Number of blocks in this layer
      let blockNum = Math.min(currentLevel.levelBlockNum, remainBlockNum);

      // If it's the last layer, use all remaining blocks
      if (currentLevel.levelNum - 1 === i) {
        blockNum = remainBlockNum;
      }

      // If there's border shrinking and not the first layer
      if (currentLevel.blockBorderStep > 0 && i > 0) {
        // Shrink from one of 4 directions in a rotating pattern
        switch (i % 4) {
          case 0: // shrink from left
            minWidth += currentLevel.blockBorderStep;
            break;
          case 1: // shrink from right
            maxWidth -= currentLevel.blockBorderStep;
            break;
          case 2: // shrink from top
            minHeight += currentLevel.blockBorderStep;
            break;
          case 3: // shrink from bottom
            maxHeight -= currentLevel.blockBorderStep;
            break;
        }
      }

      // Save progress
      remainBlockNum -= blockNum;

      // Stop if all blocks are placed
      if (remainBlockNum <= 0) break;
    }
  }

  onChangeBoard(block: Block) {
    console.log(block);
  }

  onCheckClear(block: Block) {
    console.log(block);
  }

  onCheckLose(block: Block) {
    console.log(block);
  }

  onCheckComplete(block: Block) {
    console.log(block);
  }

  protected onDestroy(): void {
    CHANGE_BOARD.off(GAME_EVENT_ENUM.CHANGE_BOARD, this.onChangeBoard, this);
    CHECK_CLEAR.off(GAME_EVENT_ENUM.CHECK_CLEAR, this.onCheckClear, this);
    CHECK_LOSED.off(GAME_EVENT_ENUM.CHECK_LOSED, this.onCheckLose, this);
    CHECK_COMPLETE.off(
      GAME_EVENT_ENUM.CHECK_COMPLETE,
      this.onCheckComplete,
      this
    );
  }
}
