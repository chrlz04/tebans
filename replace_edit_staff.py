import re

with open('src/components/shared/EditStaffModal.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r"import \{ PUROK_OPTIONS \} from '@/lib/constants'",
    "import { useQuery } from '@tanstack/react-query'\nimport type { Area } from '@/types/area'", content)

content = re.sub(
    r"const \{.*?register,\s*handleSubmit,\s*formState:.*?\} = useForm<EditStaffValues>\(\{",
    """// Queries
  const { data: areas, isLoading: areasLoading } = useQuery<Area[]>({
    queryKey: ['admin-areas'],
    queryFn: async () => {
      const res = await api.get('/admin/areas')
      return res.data
    },
    enabled: isOpen,
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditStaffValues>({""", content, flags=re.DOTALL)


content = re.sub(
    r"<select.*?\{\.\.\.register\('assignedAreaId'\)\}.*?>.*?<option value=\"\">Select Area</option>.*?\{PUROK_OPTIONS\.map\(\(area\) => \(\s*<option key=\{area\} value=\{area\}>\s*\{area\}\s*</option>\s*\)\)\}\s*</select>",
    """<select
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('assignedAreaId')}
              disabled={staff.userType === 'admin' || areasLoading}
            >
              <option value="">Select Area</option>
              {areas?.map((area) => (
                <option key={area.areaId} value={area.areaId}>
                  {area.name}
                </option>
              ))}
            </select>""", content, flags=re.DOTALL)

with open('src/components/shared/EditStaffModal.tsx', 'w') as f:
    f.write(content)
