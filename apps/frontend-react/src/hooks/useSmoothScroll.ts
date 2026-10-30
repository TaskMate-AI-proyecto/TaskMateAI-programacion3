import { useContext } from 'react'
import { SmoothScrollContext } from '../context/smoothScrollContext'

export function useSmoothScroll() {
  return useContext(SmoothScrollContext)
}
