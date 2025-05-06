export interface Rubric {
  name: string;
  percentage: number;
}

export interface Criteria {
  id: string;
  name: string;
  courseId: string;
  userId: string;
  rubrics: Rubric[];
  scoringRange: string;
  passingScore: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    name: string;
    email: string;
  };
}

export interface CriteriaCreateInput {
  name: string;
  courseId: string;
  rubrics: Rubric[];
  scoringRange: string;
  passingScore: string;
}

export interface CriteriaUpdateInput extends Partial<CriteriaCreateInput> {}

export interface CriteriaResponse {
  criteria: Criteria[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
