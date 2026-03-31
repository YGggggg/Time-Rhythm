/**
 * Time math utilities for the ring component.
 * 24 hours = 360 degrees. 1 minute = 0.25 degrees.
 */

export const minutesToDeg = (minutes: number): number => minutes * 0.25
export const degToMinutes = (deg: number): number => deg / 0.25

/** Convert a datetime string to minutes since midnight */
export const datetimeToMinutes = (iso: string): number => {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
}

/** Convert minutes since midnight to degrees on the ring (0° = top = midnight) */
export const minutesToAngle = (minutes: number): number => (minutes / (24 * 60)) * 360

/** Convert polar angle + center + radius to SVG x,y coordinates */
export const polarToCartesian = (
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): [number, number] => {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

/** Build an SVG arc path for a ring segment */
export const arcPath = (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
  thickness: number
): string => {
  const outerR = r
  const innerR = r - thickness
  const [ox1, oy1] = polarToCartesian(cx, cy, outerR, startAngle)
  const [ox2, oy2] = polarToCartesian(cx, cy, outerR, endAngle)
  const [ix1, iy1] = polarToCartesian(cx, cy, innerR, endAngle)
  const [ix2, iy2] = polarToCartesian(cx, cy, innerR, startAngle)
  const large = endAngle - startAngle > 180 ? 1 : 0
  return [
    `M ${ox1} ${oy1}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${ox2} ${oy2}`,
    `L ${ix1} ${iy1}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2}`,
    'Z',
  ].join(' ')
}

/** Format a Date as local datetime string (YYYY-MM-DDTHH:mm:ss), without UTC conversion */
export const toLocalISO = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** Get current time as minutes since midnight */
export const nowMinutes = (): number => {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
}

/** Extract the date part (YYYY-MM-DD) from an ISO datetime string, using local time */
export const datetimeToDate = (iso: string): string => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Return true if a child task's date is later than the parent task's date (crosses midnight) */
export const isNextDay = (parentIso: string, childIso: string): boolean => {
  return datetimeToDate(childIso) > datetimeToDate(parentIso)
}
