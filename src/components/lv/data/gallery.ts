export interface GalleryImage {
  id: string;
  src: string;
  number: string;
  title: string;
  subtitle: string;
  region: string;
  description: string;
  /** portrait = tall frame, horizontal = wide frame */
  ratio: "portrait" | "horizontal";
}

export const gallery: GalleryImage[] = [
  {
    id: "01",
    src: "/images/01-the-outlaw.webp",
    number: "01",
    title: "The Outlaw",
    subtitle: "A throne reforged.",
    region: "Drakensberg",
    description: "Where the mist meets the mountain, a new sovereign emerges.",
    ratio: "portrait",
  },
  {
    id: "02",
    src: "/images/08-the-corral.webp",
    number: "02",
    title: "The Estate",
    subtitle: "A new frontier.",
    region: "Johannesburg CBD",
    description: "Black monogram, black horses, concrete skyline.",
    ratio: "horizontal",
  },
  {
    id: "03",
    src: "/images/06-the-mountain-pass.webp",
    number: "03",
    title: "The Pass",
    subtitle: "Three riders cross the divide.",
    region: "Sani Pass",
    description: "The mountain that once divided — now a runway.",
    ratio: "horizontal",
  },
  {
    id: "04",
    src: "/images/03-the-battlefield.webp",
    number: "04",
    title: "The Field",
    subtitle: "Battlefield to runway.",
    region: "Johannesburg CBD",
    description: "Grass underfoot, the city always visible.",
    ratio: "horizontal",
  },
  {
    id: "05",
    src: "/images/07-the-portrait.webp",
    number: "05",
    title: "The Portrait",
    subtitle: "A study in black.",
    region: "Johannesburg CBD",
    description: "Rain-slicked and silent.",
    ratio: "portrait",
  },
  {
    id: "06",
    src: "/images/10-the-storm.webp",
    number: "06",
    title: "The Storm",
    subtitle: "Charge through the rain.",
    region: "Johannesburg CBD",
    description: "Rain, leather, and a city holding its breath.",
    ratio: "portrait",
  },
  {
    id: "07",
    src: "/images/05-the-zulu-plains.webp",
    number: "07",
    title: "The Plains",
    subtitle: "A crown reimagined.",
    region: "Zululand",
    description: "White horse through the long grass.",
    ratio: "portrait",
  },
  {
    id: "08",
    src: "/images/02-the-ascent.webp",
    number: "08",
    title: "The Ascent",
    subtitle: "Sidesaddle to the summit.",
    region: "Cathedral Peak",
    description: "The climb itself becomes couture.",
    ratio: "portrait",
  },
  {
    id: "09",
    src: "/images/04-the-bridle.webp",
    number: "09",
    title: "The Bridle",
    subtitle: "In the hand of couture.",
    region: "Detail",
    description: "Monogrammed gloves, gilded reins.",
    ratio: "horizontal",
  },
  {
    id: "10",
    src: "/images/09-the-dusk-ride.webp",
    number: "10",
    title: "The Dusk Ride",
    subtitle: "One rider, no witnesses.",
    region: "Johannesburg CBD",
    description: "Monogram catching the last grey light.",
    ratio: "portrait",
  },
  {
    id: "11",
    src: "/images/11-the-throne.webp",
    number: "11",
    title: "The Throne",
    subtitle: "Gold above the skyline.",
    region: "Johannesburg CBD",
    description: "Gold monogram, a city as backdrop, command in stillness.",
    ratio: "horizontal",
  },
  {
    id: "12",
    src: "/images/12-the-finale.webp",
    number: "12",
    title: "The Finale",
    subtitle: "The crew, one last time.",
    region: "Johannesburg CBD",
    description: "The Outlaw has become Outlandish.",
    ratio: "portrait",
  },
];
