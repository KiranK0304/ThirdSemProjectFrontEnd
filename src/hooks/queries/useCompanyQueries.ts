import { useQuery } from '@tanstack/react-query'
import { getCompanyDetail } from '@/api/companies'

export function useCompany(id: number) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => getCompanyDetail(id),
    enabled: !isNaN(id) && id > 0,
  })
}
