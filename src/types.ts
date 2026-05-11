export enum ProjectStep {
  INTRO = 'intro',
  CONCEPT = 'concept',
  SCHEMA = 'schema',
  DATA = 'data',
  QUERIES = 'queries',
  ADVANCED = 'advanced',
  EXPORT = 'export'
}

export interface Column {
  id: string;
  name: string;
  type: 'INTEGER' | 'TEXT' | 'REAL' | 'BLOB' | 'DATE' | 'TIMESTAMP';
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
  defaultValue?: string;
  checkConstraint?: string;
  references?: {
    tableId: string;
    columnName: string;
    onDelete?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'NO ACTION';
  };
}

export interface Table {
  id: string;
  name: string;
  description: string;
  columns: Column[];
  rows?: Record<string, string | number | null>[];
}

export interface QueryRequirement {
  id: string;
  label: string;
  description: string;
  sql: string;
  isMet: boolean;
}

export interface DatabaseProject {
  title: string;
  problemStatement: string;
  entities: Table[];
  queries: QueryRequirement[];
  hasView: boolean;
  viewDetails: {
    name: string;
    sql: string;
    purpose: string;
  };
  hasTrigger?: boolean;
  triggerDetails?: {
    name: string;
    sql: string;
  };
}
