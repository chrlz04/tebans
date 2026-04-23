cat << 'REPLACE_SCRIPT' > replace_meter_reader_consumers_new.py
import re

with open('src/app/meter-reader/consumers/new/page.tsx', 'r') as f:
    content = f.read()

# Add imports
content = re.sub(
    r"import \{ PUROK_OPTIONS \} from '@/lib/constants'",
    """import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProvinces, getMunicipalities, getBarangays } from '@/lib/psgc'
import type { Area } from '@/types/area'""", content)

# Modify schema
content = re.sub(
    r"const consumerSchema = z\.object\(\{.*?\n\}\)",
    """const consumerSchema = z.object({
  firstName:     z.string().min(1, 'First name is required'),
  lastName:      z.string().min(1, 'Last name is required'),
  street:        z.string().optional(),
  provinceCode:  z.string().min(1, 'Province is required'),
  municipalityCode: z.string().min(1, 'Municipality is required'),
  barangayCode:  z.string().min(1, 'Barangay is required'),
  meterSerialNo: z.string().min(1, 'Meter serial number is required'),
  areaId:        z.string().min(1, 'Area is required'),
  contactNo:     z.string().min(1, 'Contact number is required'),
})""", content, flags=re.DOTALL)

# Modify form state hook and mutations
content = re.sub(
    r"const \{.*?register,\s*handleSubmit,\s*formState:.*?\} = useForm<ConsumerFormValues>\(\{.*?\}\)",
    """const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConsumerFormValues>({
    resolver: zodResolver(consumerSchema),
  })

  const selectedProvinceCode = watch('provinceCode')
  const selectedMunicipalityCode = watch('municipalityCode')

  // Queries
  const { data: areas, isLoading: areasLoading } = useQuery<Area[]>({
    queryKey: ['areas'],
    queryFn: async () => {
      const res = await api.get('/areas')
      return res.data
    },
    enabled: hasAccess,
  })

  const { data: provinces, isLoading: provincesLoading } = useQuery({
    queryKey: ['provinces'],
    queryFn: getProvinces,
  })

  const { data: municipalities, isLoading: municipalitiesLoading } = useQuery({
    queryKey: ['municipalities', selectedProvinceCode],
    queryFn: () => getMunicipalities(selectedProvinceCode),
    enabled: !!selectedProvinceCode,
  })

  const { data: barangays, isLoading: barangaysLoading } = useQuery({
    queryKey: ['barangays', selectedMunicipalityCode],
    queryFn: () => getBarangays(selectedMunicipalityCode),
    enabled: !!selectedMunicipalityCode,
  })""", content, flags=re.DOTALL)

content = re.sub(
    r"mutationFn: async \(values: ConsumerFormValues\) => \{.*?\await api\.post\('/meter-reader/consumers', values\).*?\},",
    """mutationFn: async (values: ConsumerFormValues) => {
      const province = provinces?.find(p => p.code === values.provinceCode)?.name
      const municipality = municipalities?.find(m => m.code === values.municipalityCode)?.name
      const barangay = barangays?.find(b => b.code === values.barangayCode)?.name

      const addressParts = [values.street, barangay, municipality, province].filter(Boolean)
      const address = addressParts.join(', ')

      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        address,
        province,
        municipality,
        barangay,
        meterSerialNo: values.meterSerialNo,
        areaId: values.areaId,
        contactNo: values.contactNo,
      }

      await api.post('/meter-reader/consumers', payload)
    },""", content, flags=re.DOTALL)

# Modify inputs
content = re.sub(
    r"\{\/\* Address \*\/\}\s*<Input\s*label=\"Service Address\"\s*placeholder=\"Enter complete address\"\s*error=\{errors\.address\?\.message\}\s*required\s*\{\.\.\.register\('address'\)\}\s*\/>",
    """{/* Address */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Service Address</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Province */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Province <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('provinceCode')}
                  disabled={provincesLoading}
                >
                  <option value="">Select Province</option>
                  {provinces?.map((p) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
                {errors.provinceCode && <p className="text-xs text-red-600">{errors.provinceCode.message}</p>}
              </div>

              {/* Municipality */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Municipality <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('municipalityCode')}
                  disabled={!selectedProvinceCode || municipalitiesLoading}
                >
                  <option value="">Select Municipality</option>
                  {municipalities?.map((m) => (
                    <option key={m.code} value={m.code}>{m.name}</option>
                  ))}
                </select>
                {errors.municipalityCode && <p className="text-xs text-red-600">{errors.municipalityCode.message}</p>}
              </div>

              {/* Barangay */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Barangay <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('barangayCode')}
                  disabled={!selectedMunicipalityCode || barangaysLoading}
                >
                  <option value="">Select Barangay</option>
                  {barangays?.map((b) => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
                {errors.barangayCode && <p className="text-xs text-red-600">{errors.barangayCode.message}</p>}
              </div>
            </div>

            <Input
              label="Street / House No."
              placeholder="e.g. 123 Rizal St. or Lot 4 Blk 2"
              error={errors.street?.message}
              {...register('street')}
            />
          </div>""", content)


content = re.sub(
    r"<select.*?\{\.\.\.register\('areaName'\)\}.*?>.*?<option value=\"\">Select Area</option>.*?\{PUROK_OPTIONS\.map\(\(area\) => \(\s*<option key=\{area\} value=\{area\}>\s*\{area\}\s*</option>\s*\)\)\}\s*</select>\s*\{errors\.areaName && \(\s*<p className=\"text-xs text-red-600\">\{errors\.areaName\.message\}</p>\s*\)\}",
    """<select
                className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('areaId')}
                disabled={areasLoading}
              >
                <option value="">Select Area</option>
                {areas?.map((area) => (
                  <option key={area.areaId} value={area.areaId}>
                    {area.name}
                  </option>
                ))}
              </select>
              {errors.areaId && (
                <p className="text-xs text-red-600">{errors.areaId.message}</p>
              )}""", content, flags=re.DOTALL)


with open('src/app/meter-reader/consumers/new/page.tsx', 'w') as f:
    f.write(content)
REPLACE_SCRIPT

python3 replace_meter_reader_consumers_new.py
