import { describe, expect, it } from 'vitest'
import { reportFileName } from './download'

describe('reportFileName', () => {
  it('nombra el reporte con la fecha local en formato AAAA-MM-DD', () => {
    expect(reportFileName(new Date(2026, 10, 5, 9, 30))).toBe('Reporte_Productividad_TaskMate_2026-11-05.pdf')
  })
})
