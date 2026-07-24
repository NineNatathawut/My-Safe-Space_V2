// src/data/hospitalsData.ts

export interface Hospital {
  id: number;
  name: string;
  type: string;
  province: string;
  phone: string;
  address: string;
  facebook: string;
  mapUrl: string;
}

export const HOSPITALS_DATABASE: Hospital[] = [
  {
    id: 1,
    name: 'โรงพยาบาลอุทัยธานี',
    type: 'โรงพยาบาลทั่วไป',
    province: 'อุทัยธานี',
    phone: '056-511081',
    address: '56 ถนน รักดี ตำบล อุทัยใหม่ อำเภอเมืองอุทัยธานี อุทัยธานี 61000',
    facebook: 'โรงพยาบาลอุทัยธานี',
    mapUrl: 'https://maps.google.com/?q=โรงพยาบาลอุทัยธานี'
  },
  {
    id: 2,
    name: 'โรงพยาบาลพะเยา',
    type: 'โรงพยาบาลทั่วไป',
    province: 'พะเยา',
    phone: '054-409300',
    address: 'ตำบลบ้านต๋อม อำเภอเมืองพะเยา พะเยา 56000',
    facebook: 'โรงพยาบาลพะเยา',
    mapUrl: 'https://maps.google.com/?q=โรงพยาบาลพะเยา'
  },
  {
    id: 3,
    name: 'โรงพยาบาลสวนปรุง',
    type: 'โรงพยาบาลจิตเวชเฉพาะทาง',
    province: 'เชียงใหม่',
    phone: '053-908500',
    address: '131 ถนนกู๊ดวิลล์ ตำบลหายยา อำเภอเมืองเชียงใหม่ เชียงใหม่ 50100',
    facebook: 'โรงพยาบาลสวนปรุง',
    mapUrl: 'https://maps.google.com/?q=โรงพยาบาลสวนปรุง'
  },
  {
    id: 4,
    name: 'สถาบันจิตเวชศาสตร์สมเด็จเจ้าพระยา',
    type: 'สถาบันเฉพาะทาง',
    province: 'กรุงเทพมหานคร',
    phone: '02-4422500',
    address: '112 ถนนสมเด็จเจ้าพระยา แขวงคลองสาน เขตคลองสาน กรุงเทพมหานคร 10600',
    facebook: 'สถาบันจิตเวชศาสตร์สมเด็จเจ้าพระยา',
    mapUrl: 'https://maps.google.com/?q=สถาบันจิตเวชศาสตร์สมเด็จเจ้าพระยา'
  }
];