/**
 * Utility for "Mỗi ngày một câu thơ thả thính ngẫu nhiên" (Daily Flirty Romantic Poems)
 */

export interface PoemItem {
  id: number;
  lines: string[];
  author?: string;
  mood?: string;
}

export const POEM_COLLECTION: PoemItem[] = [
  {
    id: 1,
    lines: [
      "Nắng giấu gì trong mắt em mà làm anh say đắm?",
      "Đêm giấu gì trong tóc em mà làm anh vấn vương?",
    ],
  },
  {
    id: 2,
    lines: [
      "Yêu em không phải vì em đẹp,",
      "Mà vì ở bên em anh thấy lòng bình yên.",
    ],
  },
  {
    id: 3,
    lines: [
      "Trái đất tròn sao anh không tránh khỏi,",
      "Vô tình chạm ánh mắt, hoá cuồng yêu.",
    ],
  },
  {
    id: 4,
    lines: [
      "Cần chi bánh ngọt với trà,",
      "Chỉ cần em cười là đời anh vui.",
    ],
  },
  {
    id: 5,
    lines: [
      "Mặt trời thì ở trên cao,",
      "Còn anh thì ở ngay trong tim này!",
    ],
  },
  {
    id: 6,
    lines: [
      "Người ta thích rượu thích trà,",
      "Còn anh chỉ thích đôi ta chung đường.",
    ],
  },
  {
    id: 7,
    lines: [
      "Gió mây là của bầu trời,",
      "Còn em là của một đời anh yêu.",
    ],
  },
  {
    id: 8,
    lines: [
      "Nhìn bầu trời xanh ngát,",
      "Nhìn mắt em trong vắt,",
      "Mọi muộn phiền biến mất,",
      "Chỉ còn tình yêu thương.",
    ],
  },
  {
    id: 9,
    lines: [
      "Anh không thích uống trà bồ công anh,",
      "Anh chỉ thích nhìn môi em mỉm cười long lanh.",
    ],
  },
  {
    id: 10,
    lines: [
      "Thế gian này vốn dĩ lắm lối đi,",
      "Nhưng lối anh chọn là đi về phía em.",
    ],
  },
  {
    id: 11,
    lines: [
      "Ba mươi chưa phải là Tết,",
      "Gặp em một lần là nhớ đến hết đời.",
    ],
  },
  {
    id: 12,
    lines: [
      "Mưa rơi không làm ướt trái tim anh,",
      "Chỉ có nụ cười em làm lòng anh tan chảy.",
    ],
  },
  {
    id: 13,
    lines: [
      "Anh vốn chỉ thích bình yên,",
      "Nhưng vì có em mà lòng xao xuyến mãi.",
    ],
  },
  {
    id: 14,
    lines: [
      "Hoàng hôn thì ở phía Tây,",
      "Còn tình anh thì ở đây bên em.",
    ],
  },
  {
    id: 15,
    lines: [
      "Chẳng cần nghiêng nước nghiêng thành,",
      "Nghiêng về phía anh là trọn đời an yên.",
    ],
  },
  {
    id: 16,
    lines: [
      "Son màu đỏ, cỏ màu xanh,",
      "Trời sinh một cặp em và anh.",
    ],
  },
  {
    id: 17,
    lines: [
      "Đêm nay trăng sáng lung linh,",
      "Ước gì anh được cùng em chung nhà.",
    ],
  },
  {
    id: 18,
    lines: [
      "Anh thích thứ gì nhất?",
      "Anh thích bình yên.",
      "Thế bình yên ở đâu?",
      "Là ở bên em chứ đâu!",
    ],
  },
  {
    id: 19,
    lines: [
      "Thức khuya mới biết đêm dài,",
      "Yêu em mới biết chẳng ai bằng em.",
    ],
  },
  {
    id: 20,
    lines: [
      "Vũ trụ có nghìn vạn vì sao,",
      "Anh chỉ ngước nhìn ngôi sao là em.",
    ],
  },
  {
    id: 21,
    lines: [
      "Cà phê đắng thêm đường thì ngọt,",
      "Cuộc đời anh có em thì trọn niềm vui.",
    ],
  },
  {
    id: 22,
    lines: [
      "Sông có thể cạn, núi có thể mòn,",
      "Tình anh trao em vẫn luôn vẹn tròn.",
    ],
  },
  {
    id: 23,
    lines: [
      "Không mơ phố xá đông vui,",
      "Chỉ mơ một góc ngơi nghỉ bên em.",
    ],
  },
  {
    id: 24,
    lines: [
      "Trời đổ mưa rồi, sao em chưa đổ anh?",
    ],
  },
  {
    id: 25,
    lines: [
      "Em như chiếc lá mùa thu,",
      "Rơi vào tim anh hóa khúc ru ngọt ngào.",
    ],
  },
  {
    id: 26,
    lines: [
      "Hà Nội đẹp nhất về đêm,",
      "Đời anh đẹp nhất khi có em đồng hành.",
    ],
  },
  {
    id: 27,
    lines: [
      "Nắng chiếu lung linh muôn hoa nở,",
      "Nụ cười em nở sưởi ấm tim anh.",
    ],
  },
  {
    id: 28,
    lines: [
      "Ngắm mây ngắm núi ngắm trời,",
      "Quay qua quay lại ngắm người anh yêu.",
    ],
  },
  {
    id: 29,
    lines: [
      "Trăm năm trong cõi người ta,",
      "Em là duy nhất, không ai sánh bằng.",
    ],
  },
  {
    id: 30,
    lines: [
      "Hoa thược dược nở mùa hạ,",
      "Tình anh nở rộ mỗi khi em cười.",
    ],
  },
  {
    id: 31,
    lines: [
      "Trời xanh mây trắng nắng vàng,",
      "Hôm nay em đã sẵn sàng yêu anh chưa?",
    ],
  },
  {
    id: 32,
    lines: [
      "Bão giông vần vũ ngoài khơi,",
      "Vào vòng tay anh là thấy bình yên.",
    ],
  },
  {
    id: 33,
    lines: [
      "Một cộng một bằng hai,",
      "Anh cộng em bằng tương lai chúng mình.",
    ],
  },
  {
    id: 34,
    lines: [
      "Đường về nhà anh xa lắm,",
      "Nhưng có em đi cùng là hóa gần ngay.",
    ],
  },
  {
    id: 35,
    lines: [
      "Em có biết sự giống nhau giữa em và ngôi sao là gì không?",
      "Cả hai đều chiếu sáng bầu trời đêm của anh.",
    ],
  },
  {
    id: 36,
    lines: [
      "Anh đếm ngày, anh đếm đêm,",
      "Đếm xem mỗi ngày thương em bao nhiêu.",
    ],
  },
  {
    id: 37,
    lines: [
      "Muốn ngọt ngào thì ăn kẹo bơ,",
      "Muốn thơ mộng thì ở bên anh.",
    ],
  },
  {
    id: 38,
    lines: [
      "Thương em chẳng quản đường xa,",
      "Dẫu mưa dẫu nắng vẫn qua ôm em.",
    ],
  },
  {
    id: 39,
    lines: [
      "Cuộc sống thật lắm đua chen,",
      "Nhưng tìm về em là chốn bình an.",
    ],
  },
  {
    id: 40,
    lines: [
      "Trái tim anh vốn ngập ngừng,",
      "Gặp em một cái hóa chừng xôn xao.",
    ],
  },
];

/**
 * Deterministic daily poem selection based on date string YYYY-MM-DD
 */
export const getDailyPoem = (dateSeed?: string): PoemItem => {
  const seed = dateSeed || new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % POEM_COLLECTION.length;
  return POEM_COLLECTION[index];
};

/**
 * Returns a random poem from the collection
 */
export const getRandomPoem = (excludeId?: number): PoemItem => {
  const available = excludeId 
    ? POEM_COLLECTION.filter((p) => p.id !== excludeId)
    : POEM_COLLECTION;
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
};
