import {
  _decorator,
  Component,
  find,
  Node,
  Sprite,
  SpriteAtlas,
  tween,
  UITransform,
  Vec2,
  Vec3,
} from "cc";
import {
  AUDIO_EFFECT_ENUM,
  GAME_BOARD_ENUM,
  GAME_EVENT_ENUM,
  GAME_STATUS_ENUM,
} from "./Enum";
import { BlockType } from "./type";
import { CHANGE_BOARD, CHECK_CLEAR, PLAY_AUDIO } from "./Event";
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

  // For debugging
  public slotNode: Node = null;

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

  // this render func: update x, y, content size, priority, type, bg
  render() {
    this.node.setPosition(this.x, this.y);
    // tween(this.node)
    //   .to(
    //     0.5,
    //     { position: new Vec3(this.x, this.y, 0) },
    //     { easing: "sineInOut" }
    //   )
    //   .start();

    this.node.getComponent(UITransform).width = this.width;
    this.node.getComponent(UITransform).height = this.height;
    this.node.getComponent(UITransform).priority = this.level;
    // this.node.setSiblingIndex(this.level);
    this.node.getComponent(Sprite).spriteFrame =
      this.spriteAtlas.getSpriteFrames()[this.type];
    this.node.getChildByName("bg").active = !this.clickable();
  }
  clickable() {
    switch (this.boardType) {
      case GAME_BOARD_ENUM.LEVEL:
        if (DataManager.instance.clickable) return true;
        return this.higherIds.length <= 0;
      case GAME_BOARD_ENUM.RANDOM_LEFT:
      case GAME_BOARD_ENUM.RANDOM_RIGHT:
        return this.higherIds.length <= 0;
      case GAME_BOARD_ENUM.LEVEL_EXTEND:
        return true;
      default:
        return false;
    }
  }
  toSlot() {
    // console.log("toSlot: ", this);
    // Get the lowerIds array of the current block

    this.lowerIds.forEach((id) => {
      let block: Block = DataManager.instance.blocks.find((i) => i.id === id);
      if (block.higherIds.findIndex((i) => i === this.id) >= 0) {
        //Remove the current block's id from the higherIds array
        block.higherIds.splice(
          block.higherIds.findIndex((i) => i === this.id),
          1
        );
      }
      block.render();
    });
    //
    if (
      DataManager.instance.records.findIndex((i) => i.id === this.id) === -1
    ) {
      DataManager.instance.records.push(this);
    }

    this.level = 0;
    this.y = 0;
    this.boardType = GAME_BOARD_ENUM.SLOT;
    const slots_all = DataManager.instance.blocks.filter(
      (i) => i.boardType == GAME_BOARD_ENUM.SLOT
    );
    const slots_same = DataManager.instance.blocks.filter(
      (i) => i.boardType === GAME_BOARD_ENUM.SLOT && this.type == i.type
    );
    // This level use for the arrange the block in the Slot container
    let maxLevel = 0;
    slots_all.forEach((s) => {
      if (s.level > maxLevel) {
        maxLevel = s.level;
      }
    });

    slots_same.forEach((i) => {
      i.level = maxLevel + 1;
      i.render();
    });

    PLAY_AUDIO.emit(GAME_EVENT_ENUM.PLAY_AUDIO, AUDIO_EFFECT_ENUM.CLICKBUTTON);
    CHECK_CLEAR.emit(GAME_EVENT_ENUM.CHECK_CLEAR, this);
  }
  toSlotCancel() {}
  protected onLoad(): void {
    this.slotNode = find("Canvas/BoardSlot");
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
  }

  onTouchStart(): void {
    if (
      DataManager.instance.gameStatus !== GAME_STATUS_ENUM.RUNNING ||
      !this.clickable()
    )
      return;

    this.toSlot();
  }

  onTouchEnd(): void {}

  onTouchCancel(): void {}

  protected onDestroy(): void {
    this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
  }
}
