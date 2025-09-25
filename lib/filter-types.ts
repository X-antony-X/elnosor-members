export interface FilterCriteria {
  fullName: string;
  phonePrimary: string;
  phoneSecondary: string;
  dateOfBirthMonth: string; // '1' to '12' or ''
  classStage: string; // 'university' | 'graduation' | ''
  universityYear: string; // '1' to '7' or ''
  confessorName: string;
  role: string; // 'member' | 'admin' | ''
  notes: string;
}
