export type User = {
  id: number;
  name: string;
  email?: string;
};

export type Role = "member" | "moderator";

export type Community = {
  id: number;
  name: string;
  invite_code: string;
  role: Role;
};

export type SignalStatus = "open" | "investigating" | "resolved";

export type AnalysisStatus = "pending" | "done" | "failed";

export type Signal = {
  id: number;
  community_id: number;
  title: string;
  description: string;
  category: string;
  zone: string;
  impact: number;
  status: SignalStatus;
  priority: number | null;
  analysis_status: AnalysisStatus;
  resolution_note: string | null;
  resolved_at: string | null;
  author?: User;
  confirmations_count?: number;
  confirmed_by_me: boolean;
  created_at: string;
};

export type Comment = {
  id: number;
  signal_id: number;
  body: string;
  user?: User;
  created_at: string;
};

export type Paginated<T> = {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type Wrapped<T> = { data: T };

export type AuthResponse = { user: User };

export type SignalFilters = {
  status?: string;
  category?: string;
  zone?: string;
  q?: string;
  sort?: "priority" | "recent";
  page?: number;
};
