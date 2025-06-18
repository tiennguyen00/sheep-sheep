import {
  _decorator,
  Component,
  director,
  instantiate,
  Label,
  Node,
  Prefab,
  Animation,
} from "cc";
import {
  CHANGE_BOARD,
  CHECK_CLEAR,
  CHECK_COMPLETE,
  CHECK_LOSED,
  PLAY_AUDIO,
} from "./Event";
import {
  AUDIO_EFFECT_ENUM,
  GAME_BOARD_ENUM,
  GAME_EVENT_ENUM,
  GAME_SCENE_ENUM,
  GAME_STATUS_ENUM,
} from "./Enum";
import { Block } from "./Block";
import { DataManager } from "./DataManager";
import { levels } from "./Level";
import { BlockType } from "./type";
import { shuffle } from "./Utils";
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

  initGame(num: number) {
    let currentLevel = levels[num - 1];
    if (!currentLevel) {
      if (levels[0]) {
        num = 1;
        DataManager.instance.level = num;
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

    let typeArr = [];
    const contentTarget = currentLevel.blockTypeArr.slice(
      0,
      currentLevel.blockTypeNum
    );
    for (let i = 0; i < totalBlockNum; i++) {
      typeArr.push(contentTarget[i % currentLevel.blockTypeNum]);
    }
    typeArr = shuffle(typeArr);

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

    let pos = 0;

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
      currentLevel.levelBlockNum % currentLevel.clearableNum == 0 &&
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

    // Loop over each level
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
          case 0: // shrink from left, 4, 8
            minWidth += currentLevel.blockBorderStep;
            break;
          case 3: // shrink from right, 1, 5, 9
            maxWidth -= currentLevel.blockBorderStep;
            break;
          case 2: // shrink from top, 2, 6, 10
            minHeight += currentLevel.blockBorderStep;
            break;
          case 1: // shrink from bottom, 3, 7, 11
            maxHeight -= currentLevel.blockBorderStep;
            break;
        }
      }
      const blocks = blockArr.slice(pos, pos + blockNum);
      pos += blockNum;

      // Used to store tile positions
      let blockPosSet = new Set<string>();

      // Iterate through all blocks to assign random positions
      for (let j = 0; j < blockNum; j++) {
        let block = blocks[j];

        let nx: number, ny: number, key: string;

        if (isRandom) {
          // Generate random x and y within the allowed range
          nx = Math.floor(Math.random() * (maxWidth - minWidth + 1) + minWidth);
          ny = Math.floor(
            Math.random() * (maxHeight - minHeight + 1) + minHeight
          );
          key = `${nx}_${ny}`;

          // If this position is already taken, keep trying until a new one is found
          if (blockPosSet.has(key)) {
            while (true) {
              nx = Math.floor(
                Math.random() * (maxWidth - minWidth + 1) + minWidth
              );
              ny = Math.floor(
                Math.random() * (maxHeight - minHeight + 1) + minHeight
              );
              key = `${nx}_${ny}`;
              if (!blockPosSet.has(key)) break;
            }
          }
        } else {
          // When isRandom is false, use levelBlockNum to calculate a square root size
          let sqrt = Math.floor(Math.sqrt(currentLevel.levelBlockNum));

          // Take the square root of levelBlockNum to get how many blocks per row
          // * 4 means each block is spaced by 4 units
          // Math.floor((chessWidthNum - 3 * sqrt) / 2): calculates the left offset for centering
          nx =
            (j % sqrt) * 4 +
            Math.floor((currentLevel.chessWidthNum - 3 * sqrt) / 2);

          // If sqrt is even, subtract 1 to fine-tune alignment
          if (sqrt % 2 === 0) nx -= 1;

          // Compute ny based on index j and sqrt
          ny = Math.floor(j / sqrt) * 5 + i;

          // Create position key string
          key = `${nx}_${ny}`;
        }

        chessBox?.[nx]?.[ny]?.blocks?.push(block);
        blockPosSet.add(key);

        // Stacking relationship, 2: range to check whether its press down area
        const minX = Math.max(nx - 2, 0);
        const minY = Math.max(ny - 2, 0);
        const maxX = Math.min(nx + 2, maxWidth);
        const maxY = Math.min(ny + 2, maxHeight);

        let maxLevel = 0;
        // console.log("current nx, ny: ", nx, ny);
        // console.log("i & j: ", i, j, minX, maxX, minY, maxY);
        // Check surrounding blocks
        for (let i = minX; i <= maxX; i++) {
          for (let j = minY; j <= maxY; j++) {
            let nearbyBlocks = chessBox[i][j].blocks;

            // If there are blocks stacked at that position
            if (nearbyBlocks.length > 0) {
              let topestBlock = nearbyBlocks[nearbyBlocks.length - 1];
              if (topestBlock.id === block.id) continue;

              maxLevel = Math.max(maxLevel, topestBlock.level);

              block.lowerIds.push(topestBlock.id);

              topestBlock.higherIds.push(block.id);
            }
          }
        }
        // level value will inscrease from frontward to backward (1 -> nearest screen, 2 -> farest screen)
        block.boardType = GAME_BOARD_ENUM.LEVEL;
        block.level = maxLevel + 1;
        block.x = nx * currentLevel.chessItemWidth;
        block.y = ny * currentLevel.chessItemHeight;
      }

      chessBlocks.push(...blocks);
      // console.log("chessBlocks: ", chessBlocks);
      remainBlockNum -= blockNum;
      if (remainBlockNum <= 0) break;
    }

    chessBlocks.forEach((b) => {
      let node = instantiate(this.blockPrefab);
      node.getComponent(Block).init(b);
    });

    let x =
      ((currentLevel.chessItemWidth * currentLevel.chessWidthNum) / 2) * -1 +
      currentLevel.chessWidthNum;
    let y =
      (currentLevel.chessItemHeight * currentLevel.chessHeightNum) / 2 - 300;
    this.boardLevelNode.setPosition(x, y);
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

  onChangeBoard(block: Block) {
    let board = this.boardLevelNode;
    if (block.boardType === GAME_BOARD_ENUM.SLOT) board = this.boardSlotNode;
    if (block.boardType === GAME_BOARD_ENUM.RANDOM_LEFT)
      board = this.boardRandomLeftNode;
    if (block.boardType === GAME_BOARD_ENUM.RANDOM_RIGHT)
      board = this.boardRandomRightNode;
    if (block.boardType === GAME_BOARD_ENUM.LEVEL_EXTEND)
      board = this.boardLevelExtendNode;
    if (block.boardType === GAME_BOARD_ENUM.HIDE) board = this.boardHideNode;
    block.node.setParent(board);
  }

  onCheckClear(block: Block) {
    let slot_blocks = DataManager.instance.blocks.filter(
      (i) => i.boardType == GAME_BOARD_ENUM.SLOT
    );
    let target = slot_blocks.filter((i) => i.type === block.type);
    console.log("target: ", target);
    if (target.length >= DataManager.instance.currentLevel.clearableNum) {
      DataManager.instance.gameStatus = GAME_STATUS_ENUM.CLEAR;
      PLAY_AUDIO.emit(GAME_EVENT_ENUM.PLAY_AUDIO, AUDIO_EFFECT_ENUM.CLEAR);

      target.forEach((i) => {
        const index = DataManager.instance.records.findIndex(
          (i1) => i1.id === i.id
        );
        if (index >= 0) {
          DataManager.instance.records.splice(index, 1);
          let anim = i.node.getComponent(Animation);

          anim.off(Animation.EventType.PLAY, this.onClearPlay, i);
          anim.on(Animation.EventType.PLAY, this.onClearPlay, i);
          anim.off(Animation.EventType.STOP, this.onClearStop, i);
          anim.on(Animation.EventType.STOP, this.onClearStop, i);
          anim.play();
        }
      });
    } else {
      // Check whether the slot_blocks fill over current Slot.
      if (slot_blocks.length >= DataManager.instance.currentLevel.slotNum) {
        CHECK_LOSED.emit(GAME_EVENT_ENUM.CHECK_LOSED, this);
      }
    }
  }

  onCheckLose(block: Block) {
    console.log("lose");
  }
  onClearPlay() {
    this.node.getChildByName("bg").active = false;
  }
  onClearStop() {
    this.node.getChildByName("bg").active = true; // Set the background active

    this.node.getComponent(Block).boardType = GAME_BOARD_ENUM.HIDE; // Set the board type to hide

    let unHide_blocks = DataManager.instance.blocks.filter(
      (item) => item.boardType != GAME_BOARD_ENUM.HIDE
    ); // Filter out the hide blocks

    if (unHide_blocks.length <= 0) {
      CHECK_COMPLETE.emit(GAME_EVENT_ENUM.CHECK_COMPLETE, this); // Emit the event to check if the game is complete
    } else {
      DataManager.instance.gameStatus = GAME_STATUS_ENUM.RUNNING;
    }
  }

  onCheckComplete() {
    console.log("complete: ");
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
