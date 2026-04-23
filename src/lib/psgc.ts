import { PSGCProvince, PSGCMunicipality, PSGCBarangay } from '@/types/psgc';

const PSGC_BASE = "https://psgc.gitlab.io/api";

async function fetchPSGC<T>(path: string): Promise<T> {
  const res = await fetch(`${PSGC_BASE}${path}`, {
    next: { revalidate: 86400 }, // cache 24 hours
  });
  if (!res.ok) throw new Error(`PSGC fetch failed: ${path}`);
  return res.json();
}

export const getProvinces = () =>
  fetchPSGC<PSGCProvince[]>("/provinces/");

export const getMunicipalities = (provinceCode: string) =>
  fetchPSGC<PSGCMunicipality[]>(`/provinces/${provinceCode}/cities-municipalities/`);

export const getBarangays = (municipalityCode: string) =>
  fetchPSGC<PSGCBarangay[]>(`/cities-municipalities/${municipalityCode}/barangays/`);
