import { GAME_BOARD_ENUM } from "./Enum";

interface LevelType {
  chessWidthNum: number;
  chessHeightNum: number;
  chessItemWidth: number;
  chessItemHeight: number;
  slotNum: number;
  clearableNum: number;
  leftRandomBlocks: number;
  rightRandomBlocks: number;
  levelNum: number;
  levelBlockNum: number;
  blockTypeNum: number;
  blockBorderStep: number;
  blockTypeArr: number[];
}

interface BlockType {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  boardType: GAME_BOARD_ENUM;
  type: number;
  higherIds: number[];
  lowerIds: number[];
}
