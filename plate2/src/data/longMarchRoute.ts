export type RoutePoint = {
  lng: number;
  lat: number;
  label?: string;
};

export type MarchNode = RoutePoint & {
  id: string;
  name: string;
  reachedAt: string;
  event: string;
  description: string;
};

export const routePoints: RoutePoint[] = [
  { label: "瑞金", lng: 116.03, lat: 25.89 },
  { label: "于都", lng: 115.42, lat: 25.95 },
  { label: "湘江", lng: 111.07, lat: 25.93 },
  { label: "通道", lng: 109.78, lat: 26.16 },
  { label: "遵义", lng: 106.93, lat: 27.73 },
  { label: "赤水", lng: 105.7, lat: 28.59 },
  { label: "扎西", lng: 105.05, lat: 27.85 },
  { label: "皎平渡", lng: 102.93, lat: 26.72 },
  { label: "会理", lng: 102.25, lat: 26.66 },
  { label: "泸定桥", lng: 102.23, lat: 29.91 },
  { label: "夹金山", lng: 102.83, lat: 30.69 },
  { label: "雪山草地", lng: 102.96, lat: 33.58 },
  { label: "腊子口", lng: 103.91, lat: 34.1 },
  { label: "哈达铺", lng: 104.23, lat: 34.25 },
  { label: "榜罗镇", lng: 105.23, lat: 35.16 },
  { label: "吴起镇", lng: 108.18, lat: 36.93 },
  { label: "会宁", lng: 105.05, lat: 35.69 },
];

export const marchNodes: MarchNode[] = [
  {
    id: "ruijin",
    name: "瑞金",
    reachedAt: "1934 年 10 月",
    event: "中央红军主力从赣南、闽西根据地出发，开始战略转移。",
    description:
      "这里作为路线原点展示。后续可替换为更精确的地点坐标、部队番号与史料说明。",
    lng: 116.03,
    lat: 25.89,
  },
  {
    id: "zunyi",
    name: "遵义",
    reachedAt: "1935 年 1 月",
    event: "遵义会议召开，成为长征进程中的重要转折点。",
    description:
      "信息卡片采用玻璃拟态层，适合补充会议背景、路线调整和相关人物资料。",
    lng: 106.93,
    lat: 27.73,
  },
  {
    id: "luding",
    name: "泸定桥",
    reachedAt: "1935 年 5 月",
    event: "红军强渡大渡河、飞夺泸定桥，突破险要通道。",
    description:
      "节点用于承载关键战役或地理关隘，可继续添加图片、音频或时间轴入口。",
    lng: 102.23,
    lat: 29.91,
  },
  {
    id: "snow-grass",
    name: "雪山草地",
    reachedAt: "1935 年夏",
    event: "红军翻越雪山、穿越草地，经历严酷自然环境考验。",
    description:
      "该点为区域性节点，坐标代表展示位置，不对应单一精确城市。",
    lng: 102.96,
    lat: 33.58,
  },
  {
    id: "wuqi",
    name: "吴起镇",
    reachedAt: "1935 年 10 月",
    event: "中央红军到达陕北吴起镇，与陕北红军会合。",
    description:
      "这里可以补充会师背景、路线收束和陕北根据地相关内容。",
    lng: 108.18,
    lat: 36.93,
  },
  {
    id: "huining",
    name: "会宁",
    reachedAt: "1936 年 10 月",
    event: "红军三大主力会师，长征胜利结束的重要标志。",
    description:
      "终点节点突出展示，适合作为完整时间线、纪念地介绍和总结入口。",
    lng: 105.05,
    lat: 35.69,
  },
];
