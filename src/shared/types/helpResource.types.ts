export interface CreateHelpResourceInput {
  title: string;
  description?: string;
  resourceType: 'pdf' | 'video';
  url: string;
  audience: 'client' | 'internal';
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateHelpResourceInput {
  title?: string;
  description?: string;
  resourceType?: 'pdf' | 'video';
  url?: string;
  audience?: 'client' | 'internal';
  sortOrder?: number;
  isActive?: boolean;
}
