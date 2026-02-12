'use client';

/**
 * ParadisePOS - Write-offs Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { writeoffsApi, type GetWriteOffsParams, type WriteOffCreateData } from '@/lib/api';

export const writeoffKeys = {
  all: ['writeoffs'] as const,
  lists: () => [...writeoffKeys.all, 'list'] as const,
  list: (params: GetWriteOffsParams) => [...writeoffKeys.lists(), params] as const,
};

export function useWriteoffs(params: GetWriteOffsParams = {}) {
  return useQuery({
    queryKey: writeoffKeys.list(params),
    queryFn: () => writeoffsApi.getAll(params),
    select: (data) => data.data,
  });
}

export function useCreateWriteoff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WriteOffCreateData) => writeoffsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: writeoffKeys.lists() });
    },
  });
}
