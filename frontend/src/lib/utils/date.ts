import { format, isValid, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

/**
 * 안전하게 날짜를 파싱하는 헬퍼 함수
 * @param date - Date 객체, ISO 문자열, 또는 타임스탬프
 * @returns 유효한 Date 객체 또는 null
 */
export function parseDate(date: Date | string | number | null | undefined): Date | null {
  if (!date) return null

  try {
    let parsedDate: Date

    if (date instanceof Date) {
      parsedDate = date
    } else if (typeof date === 'string') {
      // ISO 문자열 형식 파싱
      parsedDate = parseISO(date)
    } else if (typeof date === 'number') {
      // 타임스탬프
      parsedDate = new Date(date)
    } else {
      return null
    }

    // 유효한 날짜인지 확인
    return isValid(parsedDate) ? parsedDate : null
  } catch (error) {
    console.error('Date parsing error:', error, 'Input:', date)
    return null
  }
}

/**
 * 날짜를 포맷팅하는 헬퍼 함수 (에러 처리 포함)
 * @param date - 포맷팅할 날짜
 * @param formatStr - date-fns 포맷 문자열
 * @param fallback - 오류 시 반환할 기본값
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  formatStr: string,
  fallback: string = '-'
): string {
  const parsedDate = parseDate(date)
  
  if (!parsedDate) {
    return fallback
  }

  try {
    return format(parsedDate, formatStr, { locale: ko })
  } catch (error) {
    console.error('Date formatting error:', error)
    return fallback
  }
}