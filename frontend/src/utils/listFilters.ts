export type FilterValues = Record<string, string | number | undefined>;

export function buildFilterParams(filters: FilterValues, perPage = 1000): Record<string, unknown> {
  const params: Record<string, unknown> = { per_page: perPage };
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) {
      params[key] = value;
    }
  });
  return params;
}

export const emptyFilter = (): FilterValues => ({});
