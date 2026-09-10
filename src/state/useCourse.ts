import { useContext } from 'react'
import { CourseContext } from './CourseContext'

export function useCourse() {
  const value = useContext(CourseContext)
  if (!value) throw new Error('useCourse must be used inside CourseProvider')
  return value
}
