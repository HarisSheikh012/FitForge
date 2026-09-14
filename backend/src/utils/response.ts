import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const sendSuccess = (
  res: Response,
  data: unknown,
  message = 'Success',
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendCreated = (res: Response, data: unknown, message = 'Created successfully') => {
  return sendSuccess(res, data, message, 201);
};

export const sendPaginated = (
  res: Response,
  data: unknown,
  meta: PaginationMeta,
  message = 'Success',
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta,
  });
};

export const sendError = (
  res: Response,
  message = 'An error occurred',
  statusCode = 500,
  errors?: unknown,
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export const parsePagination = (
  query: Record<string, unknown>,
  defaults = { page: 1, limit: 10 },
) => {
  const page = Math.max(1, parseInt(String(query.page ?? defaults.page), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? defaults.limit), 10)));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number,
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

export const parseSort = (
  query: Record<string, unknown>,
  allowedFields: string[],
  defaultField = 'createdAt',
  defaultOrder: 'asc' | 'desc' = 'desc',
): Record<string, 'asc' | 'desc'> => {
  const sortBy = String(query.sortBy ?? defaultField);
  const sortOrder = String(query.sortOrder ?? defaultOrder) as 'asc' | 'desc';
  const field = allowedFields.includes(sortBy) ? sortBy : defaultField;
  return { [field]: sortOrder };
};
