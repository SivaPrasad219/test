// common/types.ts

// Define ApiResponse
export interface ApiResponse {
  data: any[];
  pagination: {
    totalCount: number;
  };
}

// Define JsonData
export interface JsonData {
  tasks: {
    taskID: string;
    visible: boolean;
    taskName: string;
    search?: {
      dropdownOptions: any[];

    };
    table?: {
      columns: any[];
      api?: {
        url: string;
        authToken: string;
        clientId: string;
      };
      defaultOrderBy: string;
      defaultLimit: number;
      defaultStrict: string;
    };
    pagination?: {
      totalCount: number;
    };
  }[];
}
