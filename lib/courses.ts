export const REGISTRATION_EMAIL = "hello@distinguisheddaniel.com"

export interface CourseFormat {
  label: string
  includes?: string
  price: string
  seating: string
  time: string
  location: { label: string; value: string }
}

export interface Course {
  id: string
  title: string
  tagline: string
  badge: string
  free: boolean
  /** Course artwork is presented in a 1080 x 1350 portrait frame. */
  image: string
  description: string
  formats: CourseFormat[]
}

const VENUE = { label: "Venue", value: "KAN International, Apostolic Hub" }
const TEAMS = { label: "Platform", value: "MS Teams" }
const IN_PERSON_INCLUDES = "Includes course manual, networking with other pioneers and Q&A with Apostle Zungu"
const ONLINE_INCLUDES = "Includes digital course manual"

export const COURSES: Course[] = [
  {
    id: "building-self",
    title: "Building Self",
    tagline: "Demolish and re-build every faculty for God's purpose.",
    badge: "Short Course, 2026",
    free: false,
    image: "/courses/building-self.png",
    description:
      "Course Code: 01. Building Self is a course that is designed to assist the believer to self-develop. Many people's spiritual, mental, emotional and physical faculties are largely influenced by the environment they grew up in, have been exposed to or are currently participating in. In other words, their faculties have been built by outward circumstances. This course allows the believer to exercise God's wisdom and principles to demolish and re-build each faculty (spiritual, mental, emotional and physical) into a state that is ready to function in God's purpose for their life in order to live a healthy and progressive life.",
    formats: [
      { label: "In-Person", includes: IN_PERSON_INCLUDES, price: "R800", seating: "5, 6 and 7 November 2026", time: "19h00 – 21h00", location: VENUE },
      { label: "Online", includes: ONLINE_INCLUDES, price: "R400", seating: "8 and 9 November 2026", time: "19h00 – 21h00", location: TEAMS },
    ],
  },
  {
    id: "pioneers-take-off",
    title: "Pioneers Take-Off",
    tagline: "Preparing for 2027 and beyond.",
    badge: "Short Course, 2026",
    free: false,
    image: "/courses/pioneers-take-off.png",
    description:
      "Course Code: 02. Pioneers Take-Off is a course designed to train and equip the believer in understanding the times, the current socio-economic climate, political climate and spiritual climate in order to prepare and align their life for advantage in 2027 and beyond. This course will equip the believer on practical Word-based tools to deploy to optimise the time, create wealth and thrive in an otherwise uncertain world. The grace to thrive and prosper is available, but it requires wisdom, insight and practical application. This course provides this very wisdom, insight and practical application principles. The believer will be empowered with knowledge and impartation to thrive continuously irrespective of the uncertain times the world finds itself in.",
    formats: [
      { label: "In-Person", includes: IN_PERSON_INCLUDES, price: "R1200", seating: "18, 19 and 20 November 2026", time: "19h00 – 21h00", location: VENUE },
      { label: "Online", includes: ONLINE_INCLUDES, price: "R600", seating: "22 and 23 November 2026", time: "19h00 – 21h00", location: TEAMS },
    ],
  },
  {
    id: "gifts-of-holy-spirit",
    title: "Gifts of the Holy Spirit in the Marketplace",
    tagline: "A free in-person course on operating in the gifts.",
    badge: "Short Course, 2026 · Free",
    free: true,
    image: "/courses/gifts-of-holy-spirit.png",
    description:
      "Course Code: 03. In 1 Corinthians chapter 12, we are introduced to nine gifts of Holy Spirit. These gifts are grouped into three main gifts: Gifts of Revelation, Gifts of Power and Gifts of Utterance and Inspiration. These gifts operate in the marketplace and become a real and practical advantage for the believer in the so-called “real world” where men have assortments of altars. When received and applied consistently, the gifts of Holy Spirit transform a believer from being ordinary to being an extraordinary participant in the marketplace. This course is designed to teach believers God’s wisdom for these gifts of Holy Spirit, understand their practical application and receive an impartation to flow into these gifts tangibly unto societal and systematic transformation and reformation.",
    formats: [
      { label: "In-Person only", price: "Free", seating: "4, 11 and 12 November 2026", time: "19h00 – 21h00", location: VENUE },
    ],
  },
]
