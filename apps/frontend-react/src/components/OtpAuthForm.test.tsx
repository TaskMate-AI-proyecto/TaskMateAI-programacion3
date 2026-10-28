import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendOtp, verifyOtp } from '../api/auth'
import { AuthProvider } from '../context/AuthContext'
import { OtpAuthForm } from './OtpAuthForm'

vi.mock('../api/auth', () => ({
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
}))

const sendOtpMock = vi.mocked(sendOtp)
const verifyOtpMock = vi.mocked(verifyOtp)

const email = 'ana@example.com'
const session = { success: true as const, token: 'jwt-token', user: { id: 'user-1', email } }

function renderLogin() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<OtpAuthForm mode="login" />} />
          <Route path="/dashboard" element={<p>Panel de tareas</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )

  return userEvent.setup()
}

async function requestCode(user: ReturnType<typeof userEvent.setup>) {
  const emailInput = screen.getByLabelText('Correo electrónico')
  await user.clear(emailInput)
  await user.type(emailInput, email)
  await user.click(screen.getByRole('button', { name: /Enviar código/ }))
}

describe('OtpAuthForm (login OTP flow)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts on step 1 asking only for the email', () => {
    renderLogin()

    expect(screen.getByRole('heading', { name: 'Bienvenido de nuevo.' })).toBeInTheDocument()
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    expect(screen.queryByLabelText('Código de verificación')).not.toBeInTheDocument()
  })

  it('requests the code and moves to step 2 once the email is sent', async () => {
    sendOtpMock.mockResolvedValue(undefined)
    const user = renderLogin()

    await requestCode(user)

    expect(sendOtpMock).toHaveBeenCalledWith(email)
    expect(await screen.findByRole('heading', { name: 'Revisa tu correo.' })).toBeInTheDocument()
    expect(screen.getByText(`Enviamos un código de seis dígitos a ${email}.`)).toBeInTheDocument()
    expect(screen.getByLabelText('Código de verificación')).toBeInTheDocument()
  })

  it('keeps the verify button disabled until six digits are entered', async () => {
    sendOtpMock.mockResolvedValue(undefined)
    const user = renderLogin()
    await requestCode(user)

    const verifyButton = await screen.findByRole('button', { name: /Verificar y continuar/ })
    expect(verifyButton).toBeDisabled()

    await user.type(screen.getByLabelText('Código de verificación'), '12345')
    expect(verifyButton).toBeDisabled()

    await user.type(screen.getByLabelText('Código de verificación'), '6')
    expect(verifyButton).toBeEnabled()
  })

  it('discards non-numeric characters typed in the code field', async () => {
    sendOtpMock.mockResolvedValue(undefined)
    const user = renderLogin()
    await requestCode(user)

    const codeInput = await screen.findByLabelText('Código de verificación')
    await user.type(codeInput, '1a2-3b')

    expect(codeInput).toHaveValue('123')
  })

  it('verifies the code, stores the JWT and redirects to the dashboard', async () => {
    sendOtpMock.mockResolvedValue(undefined)
    verifyOtpMock.mockResolvedValue(session)
    const user = renderLogin()
    await requestCode(user)

    await user.type(await screen.findByLabelText('Código de verificación'), '123456')
    await user.click(screen.getByRole('button', { name: /Verificar y continuar/ }))

    expect(verifyOtpMock).toHaveBeenCalledWith(email, '123456')
    expect(await screen.findByText('Panel de tareas')).toBeInTheDocument()
    expect(localStorage.getItem('taskmate.token')).toBe('jwt-token')
    expect(JSON.parse(localStorage.getItem('taskmate.user') ?? 'null')).toEqual(session.user)
  })

  it('shows the server error and stays on step 2 when the code is rejected', async () => {
    sendOtpMock.mockResolvedValue(undefined)
    verifyOtpMock.mockRejectedValue(new Error('invalid'))
    const user = renderLogin()
    await requestCode(user)

    await user.type(await screen.findByLabelText('Código de verificación'), '000000')
    await user.click(screen.getByRole('button', { name: /Verificar y continuar/ }))

    expect(await screen.findByText('No se pudo completar la solicitud.')).toBeInTheDocument()
    expect(screen.getByLabelText('Código de verificación')).toBeInTheDocument()
    expect(localStorage.getItem('taskmate.token')).toBeNull()
  })

  it('shows an error and stays on step 1 when the code request fails', async () => {
    sendOtpMock.mockRejectedValue(new Error('network'))
    const user = renderLogin()

    await requestCode(user)

    expect(await screen.findByText('No se pudo completar la solicitud.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Código de verificación')).not.toBeInTheDocument()
  })

  it('goes back to step 1 and clears the typed code', async () => {
    sendOtpMock.mockResolvedValue(undefined)
    const user = renderLogin()
    await requestCode(user)

    await user.type(await screen.findByLabelText('Código de verificación'), '123')
    await user.click(screen.getByRole('button', { name: 'Cambiar correo' }))

    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    expect(screen.queryByLabelText('Código de verificación')).not.toBeInTheDocument()

    await requestCode(user)
    expect(await screen.findByLabelText('Código de verificación')).toHaveValue('')
  })
})
