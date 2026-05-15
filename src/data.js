
//더미파일들 나중에 DB로 대체
export const categories = [
  {id: "all", name: "전체"},
  {id: "battery", name: "보조 배터리"},
  {id: "blanket", name: "담요"},
  {id: "umbrella", name: "우산"},
  {id: "calculator", name: "공학용 계산기"},
  {id: "laser", name: "레이저 포인터"},
  {id: "charger", name: "노트북 충전기"},
  {id: "medicine", name: "상비약"},
  {id: "soccer", name: "축구공"},
];

export const items = [
  {id: 1, name: "보조 배터리", category: "battery", available: 6, inUse: 3, preparing: 0,image: "/images/battery.jpg"},
  {id: 2, name: "담요", category: "blanket", available: 3, inUse: 1, preparing: 0, image: "/images/blanket.jpg"},
  {id: 3, name: "우산", category: "umbrella", available: 10, inUse: 0, preparing:1 ,image: "/images/umbrella.jpg"},
  {id: 4, name: "공학용 계산기", category: "calculator", available: 4, inUse: 2, preparing: 2,image: "/images/calculator.jpg"},
  {id: 5, name: "레이저 포인터", category: "laser", available: 2, inUse: 1, preparing: 0,image: "/images/laser.jpg"},
  {id: 6, name: "노트북 충전기", category: "charger", available: 5, inUse: 2, preparing: 2,image: "/images/charger.jpg"},
  {id: 7, name: "상비약", category: "medicine", available: 8, inUse: 0, preparing: 1,image: "/images/medicine.jpg"},
  {id: 8, name: "축구공", category: "soccer", available: 0, inUse: 3, preparing: 4,image: "/images/soccer.jpg"},
];
