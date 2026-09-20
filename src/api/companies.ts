import { api } from './client'
import { CompanyDetail } from './types'

export async function getCompanyDetail(id: number): Promise<CompanyDetail> {
  const response = await api.get<CompanyDetail>(`/api/auth/companies/${id}/`)
  return response.data
}
