export interface PSGCProvince {
  code: string;
  name: string;
  regionCode: string;
}

export interface PSGCMunicipality {
  code: string;
  name: string;
  provinceCode: string;
  isCapital: boolean;
}

export interface PSGCBarangay {
  code: string;
  name: string;
  cityMunicipalityCode: string;
}
