export type MemberTier = "Ambassador" | "Fellow" | "Patron"

export const stats = {
  coursesInProgress: 2,
  coursesCompleted: 6,
  certificationsEarned: 3,
  connectionsMade: 41,
  opportunitiesViewed: 18,
  profileCompletion: 82,
}

export type LearningModule = {
  id: string
  title: string
  track: string
  progress: number
  totalLessons: number
  completedLessons: number
  nextLesson: string
  image: string
}

export const learningPath: LearningModule[] = [
  {
    id: "lm-1",
    title: "Kingdom Capital: Foundations of Ethical Wealth",
    track: "Stewardship",
    progress: 68,
    totalLessons: 12,
    completedLessons: 8,
    nextLesson: "Structuring Your First Family Trust",
    image: "/dashboard/course-stewardship.jpg",
  },
  {
    id: "lm-2",
    title: "The Ambassador's Playbook: Influence Without Compromise",
    track: "Leadership",
    progress: 25,
    totalLessons: 10,
    completedLessons: 2,
    nextLesson: "Negotiating from a Position of Values",
    image: "/dashboard/course-leadership.jpg",
  },
  {
    id: "lm-3",
    title: "Legacy Architecture: Building Beyond Yourself",
    track: "Legacy",
    progress: 100,
    totalLessons: 8,
    completedLessons: 8,
    nextLesson: "Completed",
    image: "/dashboard/course-legacy.jpg",
  },
]

export type Resource = {
  id: string
  title: string
  type: "Guide" | "Template" | "Recording" | "Whitepaper"
  category: string
  date: string
  duration?: string
}

export const resourceLibrary: Resource[] = [
  {
    id: "res-1",
    title: "The Family Office Blueprint",
    type: "Guide",
    category: "Stewardship",
    date: "Sep 12, 2026",
  },
  {
    id: "res-2",
    title: "Quarterly Board Review Template",
    type: "Template",
    category: "Leadership",
    date: "Aug 28, 2026",
  },
  {
    id: "res-3",
    title: "Live Session: Negotiating Kingdom Deals",
    type: "Recording",
    category: "Leadership",
    date: "Aug 15, 2026",
    duration: "58 min",
  },
  {
    id: "res-4",
    title: "Trust Structures for Multi-Generational Wealth",
    type: "Whitepaper",
    category: "Legacy",
    date: "Jul 30, 2026",
  },
  {
    id: "res-5",
    title: "The Ambassador's Due Diligence Checklist",
    type: "Template",
    category: "Stewardship",
    date: "Jul 11, 2026",
  },
]

export type Certification = {
  id: string
  title: string
  issued: string
  credentialId: string
  status: "Earned" | "In Progress"
}

export const certifications: Certification[] = [
  {
    id: "cert-1",
    title: "Certified Kingdom Steward",
    issued: "Jun 2026",
    credentialId: "TDD-CKS-10482",
    status: "Earned",
  },
  {
    id: "cert-2",
    title: "Ambassador Leadership Fellow",
    issued: "Apr 2026",
    credentialId: "TDD-ALF-08821",
    status: "Earned",
  },
  {
    id: "cert-3",
    title: "Legacy Architect",
    issued: "Feb 2026",
    credentialId: "TDD-LGA-05390",
    status: "Earned",
  },
  {
    id: "cert-4",
    title: "Capital Alignment Specialist",
    issued: "Pending",
    credentialId: "—",
    status: "In Progress",
  },
]

export type Opportunity = {
  id: string
  title: string
  postedBy: string
  postedByTitle: string
  category: "Investment" | "Partnership" | "Mentorship" | "Speaking"
  location: string
  postedAt: string
  description: string
}

export const opportunities: Opportunity[] = [
  {
    id: "op-1",
    title: "Seeking Co-Investor for Faith-Based EdTech Series A",
    postedBy: "Renata Cole",
    postedByTitle: "Managing Partner, Cole Ventures",
    category: "Investment",
    location: "Atlanta, GA",
    postedAt: "2 hours ago",
    description:
      "Raising $4M Series A for a Kingdom-aligned EdTech platform serving underfunded districts. Looking for one lead co-investor.",
  },
  {
    id: "op-2",
    title: "Strategic Partnership: Logistics + Last-Mile Distribution",
    postedBy: "Marcus Oyelaran",
    postedByTitle: "CEO, Oyelaran Freight Group",
    category: "Partnership",
    location: "Houston, TX",
    postedAt: "6 hours ago",
    description:
      "Expanding into the Gulf Coast and seeking a distribution partner who shares our values around fair labor practices.",
  },
  {
    id: "op-3",
    title: "Mentor Needed: First-Generation Founder, Consumer Goods",
    postedBy: "Priya Nathan",
    postedByTitle: "Founder, Nathan & Bloom",
    category: "Mentorship",
    location: "Remote",
    postedAt: "Yesterday",
    description:
      "Looking for a seasoned operator to mentor through our first retail expansion. Two calls a month, six-month commitment.",
  },
  {
    id: "op-4",
    title: "Keynote Speaker — Kingdom Capital Summit 2027",
    postedBy: "The Distinguished Daniel Institute",
    postedByTitle: "Events Committee",
    category: "Speaking",
    location: "Dallas, TX",
    postedAt: "2 days ago",
    description:
      "Seeking a Fellow-tier member to deliver the closing keynote on stewardship and generational wealth transfer.",
  },
]

export type NetworkMember = {
  id: string
  name: string
  title: string
  company: string
  tier: MemberTier
  tags: string[]
  location: string
  initials: string
}

export const memberDirectory: NetworkMember[] = [
  {
    id: "mem-1",
    name: "Renata Cole",
    title: "Managing Partner",
    company: "Cole Ventures",
    tier: "Patron",
    tags: ["Venture Capital", "EdTech", "Faith-Based Funds"],
    location: "Atlanta, GA",
    initials: "RC",
  },
  {
    id: "mem-2",
    name: "Marcus Oyelaran",
    title: "Chief Executive Officer",
    company: "Oyelaran Freight Group",
    tier: "Fellow",
    tags: ["Logistics", "Supply Chain", "Partnerships"],
    location: "Houston, TX",
    initials: "MO",
  },
  {
    id: "mem-3",
    name: "Priya Nathan",
    title: "Founder",
    company: "Nathan & Bloom",
    tier: "Ambassador",
    tags: ["Consumer Goods", "Retail", "D2C"],
    location: "Remote",
    initials: "PN",
  },
  {
    id: "mem-4",
    name: "Elias Forsythe",
    title: "Managing Director",
    company: "Forsythe Capital",
    tier: "Patron",
    tags: ["Private Equity", "Real Estate", "Family Office"],
    location: "New York, NY",
    initials: "EF",
  },
  {
    id: "mem-5",
    name: "Camille Adeyemi",
    title: "Chief Strategy Officer",
    company: "Adeyemi Holdings",
    tier: "Fellow",
    tags: ["Strategy", "M&A", "International Trade"],
    location: "Lagos, NG",
    initials: "CA",
  },
  {
    id: "mem-6",
    name: "Josiah Ramirez",
    title: "Founder & CEO",
    company: "Ramirez Biotech",
    tier: "Ambassador",
    tags: ["Biotech", "R&D", "Healthcare"],
    location: "San Diego, CA",
    initials: "JR",
  },
]

export type Notification = {
  id: string
  source: "Institute" | "Network"
  title: string
  description: string
  time: string
  read: boolean
}

export const notifications: Notification[] = [
  {
    id: "n-1",
    source: "Institute",
    title: "New lesson unlocked",
    description: "\"Structuring Your First Family Trust\" is now available.",
    time: "1h ago",
    read: false,
  },
  {
    id: "n-2",
    source: "Network",
    title: "New connection request",
    description: "Elias Forsythe wants to connect with you.",
    time: "3h ago",
    read: false,
  },
  {
    id: "n-3",
    source: "Network",
    title: "Opportunity matches your profile",
    description: "Seeking Co-Investor for Faith-Based EdTech Series A.",
    time: "5h ago",
    read: false,
  },
  {
    id: "n-4",
    source: "Institute",
    title: "Certification earned",
    description: "You earned the Legacy Architect credential.",
    time: "1d ago",
    read: true,
  },
  {
    id: "n-5",
    source: "Institute",
    title: "Live session reminder",
    description: "\"Negotiating Kingdom Deals\" starts tomorrow at 2 PM ET.",
    time: "1d ago",
    read: true,
  },
]

export const businessProfile = {
  company: "Whitfield Capital Partners",
  tagline: "Ethical private equity for Kingdom-minded founders.",
  industry: "Private Equity",
  website: "whitfieldcapital.com",
  seekingIntroductions: true,
  profileViews: 127,
  completion: 82,
  missingFields: ["Portfolio Highlights", "Investment Thesis PDF"],
}
