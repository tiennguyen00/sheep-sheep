export function shuffle(arr: any[]) {
  let length = arr.length,
    randomIndex,
    temp;
  while (length) {
    randomIndex = Math.floor(Math.random() * length--);
    temp = arr[randomIndex];
    arr[randomIndex] = arr[length];
    arr[length] = temp;
  }
  return arr;
}
