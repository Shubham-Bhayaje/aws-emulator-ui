export interface TagItem {
  key: string;
  value: string;
}

export interface ResourceTagMapping {
  resourceArn: string;
  resourceName: string;
  resourceType: string;
  region: string;
  service: string;
  tags: TagItem[];
}

export interface SearchCriteria {
  regions: string[];
  resourceTypes: string[];
  tagFilters: { key: string; value?: string }[];
}

export interface ResourceGroupItem {
  groupArn: string;
  name: string;
  description?: string;
  queryType?: string;
  query?: string;
  resourceCount?: number;
}

export interface GroupResourceItem {
  arn: string;
  name: string;
  type: string;
  region: string;
  status?: string;
}
