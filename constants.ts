import { Category } from "./types";

export const CATEGORIES: Category[] = [
  {
    id: "diary",
    title: "DIARY",
    icon: "menu_book", 
    colorHex: "#151E2E", // Dark Navy (Reference: Chronicles)
    isLightCover: false,
    backgroundImage: "",
    articles: [],
  },
  {
    id: "travel",
    title: "TRAVEL",
    icon: "explore", 
    colorHex: "#2B5592", // Royal Blue (Reference: Wandering)
    isLightCover: false,
    backgroundImage: "",
    articles: [],
  },
  {
    id: "review",
    title: "REVIEW",
    icon: "library_books", 
    colorHex: "#541818", // Deep Burgundy/Red (Reference: Archives)
    isLightCover: false,
    backgroundImage: "",
    articles: [],
  },
  {
    id: "draft",
    title: "DRAFT",
    icon: "edit_note", 
    colorHex: "#124A36", // Forest Green (Reference: Tales)
    isLightCover: false,
    backgroundImage: "",
    articles: [],
  },
];