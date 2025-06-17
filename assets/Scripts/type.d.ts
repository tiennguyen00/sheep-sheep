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

/**
 * BlockType interface represents a block in the game with the following properties:
 * - id: Unique identifier for the block
 * - x: X coordinate position of the block
 * - y: Y coordinate position of the block
 * - width: Width of the block in pixels
 * - height: Height of the block in pixels
 * - level: block level
 * - boardType: Type of board the block belongs to (from GAME_BOARD_ENUM)
 * - type: Type/category of the block (determines appearance)
 * - higherIds: Array of block IDs that are above this block
 * - lowerIds: Array of block IDs that are below this block
 */
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
