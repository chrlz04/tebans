cat << 'REPLACE_SCRIPT' > replace_staff_new.py
import re

with open('src/app/admin/staff/new/page.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r"import \{ PUROK_OPTIONS \} from '@/lib/constants'",
    """import { useQuery } from '@tanstack/react-query'
import type { Area } from '@/types/area'""", content)

content = re.sub(
    r"assignedArea:\s*z\.enum\(PUROK_OPTIONS.*?\)",
    "assignedAreaId: z.string().optional()", content, flags=re.DOTALL)

content = re.sub(
    r"const mutation = useMutation\(\{.*?\}\)",
    """// Queries
  const { data: areas, isLoading: areasLoading } = useQuery<Area[]>({
    queryKey: ['admin-areas'],
    queryFn: async () => {
      const res = await api.get('/admin/areas')
      return res.data
    },
    enabled: hasAccess,
  })

  const mutation = useMutation({
    mutationFn: async (values: StaffFormValues) => {
      await api.post('/admin/staff', values)
    },
    onSuccess: () => {
      router.push('/admin/accounts')
    },
  })""", content, flags=re.DOTALL)

content = re.sub(
    r"<select.*?\{\.\.\.register\('assignedArea'\)\}.*?>.*?<option value=\"\">Select Area</option>.*?\{PUROK_OPTIONS\.map\(\(area\) => \(\s*<option key=\{area\} value=\{area\}>\s*\{area\}\s*</option>\s*\)\)\}\s*</select>\s*\{errors\.assignedArea && \(\s*<p className=\"text-xs text-red-600\">\{errors\.assignedArea\.message\}</p>\s*\)\}",
    """<select
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('assignedAreaId')}
                disabled={areasLoading}
              >
                <option value="">Select Area</option>
                {areas?.map((area) => (
                  <option key={area.areaId} value={area.areaId}>
                    {area.name}
                  </option>
                ))}
              </select>
              {errors.assignedAreaId && (
                <p className="text-xs text-red-600">{errors.assignedAreaId.message}</p>
              )}""", content, flags=re.DOTALL)

with open('src/app/admin/staff/new/page.tsx', 'w') as f:
    f.write(content)
REPLACE_SCRIPT

python3 replace_staff_new.py
