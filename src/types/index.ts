export type Tag = "校務" | "行事" | "ICT" | "提出書類" | "生徒指導" | "成績処理" | string;

export interface Tip {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: {
    name: string;
    role: string;
  };
  likes?: number;
}

export interface Attachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_by?: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  month: number;
  description: string;
  tags: Tag[];
  steps: string[];
  author_id?: string;
  created_at: string;
  updated_at: string;
  tips?: Tip[];
  attachments?: Attachment[];
}
