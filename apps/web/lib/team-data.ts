// TEAM DATA
//
// Images are loaded from public/team/.
// Place real photographs in public/team/ with matching filenames.
// If an image is missing or fails to load, a professional avatar fallback is shown.
// Do NOT modify member names or roles — update them only with real information.

export type TeamMember = {
  name: string;
  role: string;
  image: string;
  initials: string;
  isLeader: boolean;
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Suhail Ahmed Aamro",
    role: "Student Leader · AI/Full-Stack Developer",
    image: "/team/Suhailahmedaamro.png",
    initials: "SA",
    isLeader: true,
  },
  {
    name: "Zanib Zulfiqar",
    role: "AI/RAG Engineer",
    image: "/team/Zanib Zulfiqar.jpg",
    initials: "ZZ",
    isLeader: false,
  },
  {
    name: "Majeeb Ullah",
    role: "Frontend & UI/UX Developer",
    image: "/team/Majeeb Ullah.jpg",
    initials: "MU",
    isLeader: false,
  },
  {
    name: "Amna",
    role: "Backend & Database Developer",
    image: "",
    initials: "A",
    isLeader: false,
  },
  {
    name: "Umar Akmal",
    role: "QA & Documentation",
    image: "/team/Umar Kamal.jpg",
    initials: "UA",
    isLeader: false,
  },
  {
    name: "Maira Ghias",
    role: "AI/Data Analytics",
    image: "",
    initials: "MG",
    isLeader: false,
  },
];

export const TEAM_SECTION = {
  title: "Meet the Team",
  subtitle: "The students behind AI StudyMate",
};
