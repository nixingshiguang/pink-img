import React from 'react';

export type ToolCategory = '全部' | '优化' | '创建' | '编辑' | '转换' | '安全';

export interface Tool {
  id: string;
  title: string;
  description: string;
  // Added React import to fix namespace error for React.ReactNode
  icon: React.ReactNode;
  category: ToolCategory[];
  isNew?: boolean;
  color: string;
}