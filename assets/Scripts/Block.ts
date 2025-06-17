import {
  _decorator,
  Component,
  Node,
  Sprite,
  SpriteAtlas,
  UITransform,
} from "cc";
import { GAME_BOARD_ENUM, GAME_EVENT_ENUM } from "./Enum";
import { BlockType } from "./type";
import { CHANGE_BOARD } from "./Event";
import { DataManager } from "./DataManager";
const { ccclass, property } = _decorator;

@ccclass("Block")
export class Block extends Component implements BlockType {
  id: number = 0;
  x: number = 0;
  y: number = 0;
  width: number = 0;
  height: number = 0;
  level: number = 0;
  _boardType: GAME_BOARD_ENUM;
  type: number = 0;
  higherIds: number[] = [];
  lowerIds: number[] = [];

  @property(SpriteAtlas)
  spriteAtlas: SpriteAtlas = null;

  old_boardType: GAME_BOARD_ENUM;
  old_x: number;
  old_y: number;
  old_width: number;
  old_height: number;
  old_level: number;

  get boardType() {
    return this._boardType;
  }

  set boardType(value: GAME_BOARD_ENUM) {
    if (this._boardType !== value) {
      this._boardType = value;
      CHANGE_BOARD.emit(GAME_EVENT_ENUM.CHANGE_BOARD, this);
    }
  }

  init(block: BlockType) {
    Object.assign(this, block);

    // Currently for testing, add to the `blocks` array in the `DataManager` instance
    DataManager.instance.blocks.push(this);
    this.old_boardType = block.boardType;
    this.old_x = block.x;
    this.old_y = block.y;
    this.old_width = block.width;
    this.old_height = block.height;
    this.old_level = block.level;
    this.render();
  }
  render() {
    this.node.setPosition(this.x, this.y);
    this.node.getComponent(UITransform).width = this.width;
    this.node.getComponent(UITransform).height = this.height;
    this.node.setSiblingIndex(this.level);
    this.node.getComponent(Sprite).spriteFrame =
      this.spriteAtlas.getSpriteFrames()[this.type];
    this.node.getChildByName("bg").active = !this.clickable();
  }
  clickable() {
    return null;
  }
  toSlot() {}
  toSlotCancel() {}
  protected onLoad(): void {
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
  }

  onTouchStart(): void {
    console.log("onTouchStart");
  }

  onTouchEnd(): void {
    console.log("onTouchEnd");
  }

  onTouchCancel(): void {
    console.log("onTouchCancel");
  }

  protected onDestroy(): void {
    this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
  }
}
