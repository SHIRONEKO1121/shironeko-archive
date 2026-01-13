import { Category } from "./types";

export const CATEGORIES: Category[] = [
  {
    id: "diary",
    title: "DIARY",
    icon: "menu_book", 
    colorHex: "#151E2E", // Dark Navy (Reference: Chronicles)
    isLightCover: false,
    backgroundImage: "",
    articles: [
      {
        id: "d1",
        title: "Reflections on Solitude",
        date: "October 12, 2023",
        readTime: "5 min read",
        preview: "The rain taps against the windowpane...",
        content: `Today, the silence felt different. Usually, it presses against the walls, heavy and demanding. But today, it was a companion.

I spent the morning watching the fog roll off the hills. There is something profoundly settling about watching nature take its course without any need for intervention. It reminded me that not everything requires my immediate reaction.

The coffee tasted better today. I ground the beans by hand, feeling the vibration in the handle, smelling the earthiness release. These small rituals are the anchors when the mind threatens to drift into chaos.

> "Solitude is the soil in which the soul grows."

I've been thinking about this quote a lot lately. In the noise of the city, we wither. Here, in the quiet, I feel myself taking root again.`,
      },
    ],
  },
  {
    id: "travel",
    title: "TRAVEL",
    icon: "explore", 
    colorHex: "#2B5592", // Royal Blue (Reference: Wandering)
    isLightCover: false,
    backgroundImage: "",
    articles: [
      {
        id: "t1",
        title: "Paris in Rain",
        date: "November 01, 2023",
        readTime: "8 min read",
        location: "Paris, France",
        imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop",
        preview: "The cobblestones glistened under the grey sky...",
        content: `The city of lights is often romanticized in the golden hour of sunset, but I argue it is most honest when it weeps. The clouds hung low over the Seine today, a blanket of charcoal wool that seemed to mute the habitual chaos of the traffic circles.

I found refuge in a small café near the Latin Quarter. The windows were steamed up, creating a soft focus on the passersby. The smell of roasted coffee beans and wet wool coats filled the tiny space.

**Highlights:**
*   Shakespeare and Company.
*   The scent of rain on stone.
*   Notre Dame in the mist.`,
      },
    ],
  },
  {
    id: "review",
    title: "REVIEW",
    icon: "library_books", 
    colorHex: "#541818", // Deep Burgundy/Red (Reference: Archives)
    isLightCover: false,
    backgroundImage: "",
    articles: [
      {
        id: "r1",
        title: "The Shadow of the Wind",
        date: "December 01, 2023",
        readTime: "10 min read",
        preview: "A labyrinth of books...",
        content: "Zafón's masterpiece is a love letter to literature itself. The Cemetery of Forgotten Books is a concept that haunts every reader's dreams—a place where books go to wait for the right soul to find them.",
      }
    ],
  },
  {
    id: "draft",
    title: "DRAFT",
    icon: "edit_note", 
    colorHex: "#124A36", // Forest Green (Reference: Tales)
    isLightCover: false,
    backgroundImage: "",
    articles: [
      {
        id: "s1",
        title: "Midnight Ideas",
        date: "January 15, 2024",
        readTime: "15 min read",
        preview: "Fragments of a dream...",
        content: "The concept of time as a tangible fabric. What if we could weave moments together like thread? A loom of history. The pattern is only visible from a distance.",
      }
    ],
  },
];