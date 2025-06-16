import { _decorator, Component, Node, tween } from "cc";
const { ccclass, property } = _decorator;

@ccclass("SheepMove")
export class SheepMove extends Component {
  @property(Node)
  movePointsTrans: Node[] = [];

  start() {
    if (this.movePointsTrans.length > 0) this.moveAlongPath();
  }

  moveAlongPath() {
    let points = this.movePointsTrans.map((point) => point.getPosition());
    let currentIndex = 0;

    const moveToNextPoint = () => {
      let targetPos = points[currentIndex];
      tween(this.node)
        .to(1, { position: targetPos }, { easing: "sineInOut" })
        .call(moveToNextPoint)
        .start();

      currentIndex = (currentIndex + 1) % points.length;
    };

    moveToNextPoint();
  }

  update(deltaTime: number) {
    if (this.node.position.y >= 0) {
      this.node.setScale(-1, 1);
    } else {
      this.node.setScale(1, 1);
    }
  }
}
