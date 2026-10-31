/** Academic systems → levels/years. Edit here to change the options shown in the sign-up form. */
const nth = (n: number) => ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"][n - 1] + " year";
const years = (n: number) => Array.from({ length: n }, (_, i) => nth(i + 1));

export const academicSystems = [
  { id: "lmd", label: "LMD system", hint: "Licence · Master · Doctorat", years: [] as string[] },
  { id: "engineer", label: "Engineering", hint: "1st – 5th year", years: years(5) },
  { id: "medicine", label: "Medicine & Pharmacy", hint: "1st – 7th year", years: years(7) },
] as const;
export type SystemId = (typeof academicSystems)[number]["id"];

export const universities = [
  { id: "batna1", label: "University of Batna 1" },
  { id: "batna2", label: "University of Batna 2" },
  { id: "esre", label: "Higher School of Renewable Energy" },
  { id: "isam", label: "ISAM" },
  { id: "outside", label: "Outside the Wilaya" },
] as const;
export type UniversityId = (typeof universities)[number]["id"];

/** All specializations per university (empty array = free-text fallback). */
export const specializations: Record<UniversityId, string[]> = {
  batna1: [
    // Sciences & Technology
    "Computer Science", "Software Engineering", "Networks & Telecommunications",
    "Electronics", "Electrical Engineering", "Mechanical Engineering",
    "Civil Engineering", "Architecture", "Mathematics", "Physics",
    "Chemistry", "Biology", "Biotechnology", "Environmental Science",
    // Economics & Management
    "Business Administration", "Finance & Accounting", "Marketing",
    "International Trade", "Management Sciences",
    // Humanities & Social Sciences
    "Arabic Literature", "French Literature", "English Literature",
    "History", "Geography", "Philosophy", "Psychology", "Sociology",
    // Law
    "Law", "Political Science",
    // Natural & Life Sciences
    "Agronomy", "Veterinary Sciences",
  ],
  batna2: [
    // Sciences & Technology
    "Computer Science", "Software Engineering", "Networks & Telecommunications",
    "Electronics", "Electrical Engineering", "Mechanical Engineering",
    "Civil Engineering", "Architecture", "Industrial Engineering",
    "Mathematics", "Physics", "Chemistry",
    // Medicine & Pharmacy
    "Medicine", "Pharmacy", "Dental Surgery",
    // Sciences
    "Biology", "Biochemistry",
    // Sports
    "Sports Science & Physical Education",
  ],
  esre: ["Renewable Energy"],
  isam: ["Medicine", "Pharmacy", "Paramedical Sciences"],
  outside: ["Other"],
};

/** LMD: Licence = 3 years, Master = 2 years, Doctorat = 3 years (normal thesis duration in Algeria,
 *  per the MESRS "Carnet du doctorant"; an extension beyond 3 years can be granted by agreement). */
export const lmdLevels = [
  { id: "licence", label: "Licence", years: years(3) },
  { id: "master", label: "Master", years: years(2) },
  { id: "doctorat", label: "Doctorat", years: [...years(3), "Extension (beyond 3rd year)"] },
] as const;

export const lmdStatuses = [
  { id: "studying", label: "Currently studying" },
  { id: "graduated", label: "Graduated" },
] as const;
