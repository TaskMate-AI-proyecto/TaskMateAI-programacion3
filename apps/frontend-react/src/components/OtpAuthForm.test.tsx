import { render, screen, within } from '@testing-library/react'
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
          <Route path="/login" element={<OtpAuthForm mode="login" onSwitch={() => undefined} />} />
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

function codeBoxes() {
  return within(screen.getByRole('group', { name: 'Código de verificación' })).getAllByRole('textbox')
}

function boxValues() {
  return codeBoxes().map((box) => (box as HTMLInputElement).value)
}

describe('OtpAuthForm (login OTP flow)', () => {
  beforeEach(() => {
    localStorage.clear()
    sendOtpMock.mockReset()
    verifyOtpMock.mockReset()
  })

  it('starts on step 1 asking only for the email', () => {
    renderLogin()

    expect(screen.getByRole('heading', { name: 'Bienvenido de nuevo.' })).toBeInTheDocument()
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Código de verificación' })).not.toBeInTheDocument()
  })

  it('requests the code and moves to step 2 with six code boxes', async () => {
    sendOtpMock.mockResolvedValue(undefined)
    const user = renderLogin()

    await requestCode(user)

    expect(sendOtpMock).toHaveBeenCalledWith(email)
    expect(await screen.findByRole('heading', { name: 'Revisa tu correo.' })).toBeInTheDocument()
    expect(screen.getByText(`Enviamos un código de seis dígitos a ${email}.`)).toBeInTheDocument()
    expect(codeBoxes()).toHaveLength(6)
  })

  it('moves focus to the next box as digits are typed and back with backspace', async () => {
    sendOtpMock.mockResolvedValue(undefined)
    const user = renderLogin()
    await requestCode(user)

    await user.type(await screen.findByLabelText('Dígito 1 del código'), '12')
    expect(codeBoxes()[2]).toHaveFocus()

    await user.keyboard('{Backspace}')
    expect(codeBoxes()[1]).toHaveFocus()
    expect(boxValues()).toEqual(['1', '', '', '', '', ''])
  })

  it('discards non-numeric characters typed in the code boxes', async () => {
    sendOtpMock.mockResolvedValue(undefined)
    const user = renderLogin()
    await requestCode(user)

    await user.type(await screen.findByLabelText('Dígito 1 del código'), '1a2-3b')

    expect(boxValues().slice(0, 3)).toEqual(['1', '2', '3'])
  })

  it('verifies the pasted code automatically, stores the JWT and redirects to the dashboard', async () => {
    sendOtpMock.mockResolvedValue(undefined)
    verifyOtpMock.mockResolvedValue(session)
    const user = renderLogin()
    await requestCode(user)

    await user.click(await screen.findByLabelText('Dígito 1 del código'))
    await user.paste('123456')

    expect(verifyOtpMock).toHaveBeenCalledWith(email, '123456')
    expect(await screen.findByText('Panel de tareas', undefined, { timeout: 3000 })).toBeInTheDocument()
    expect(localStorage.getItem('taskmate.token')).toBe('jwt-token')
    expect(JSON.parse(localStorage.getItem('taskmate.user') ?? 'null')).toEqual(session.user)
  })

  it('shows the server error and clears the boxes when the code is rejected', async () => {
    sendOtpMock.mockResolvedValue(undefined)
    verifyOtpMock.mockRejectedValue(new Error('invalid'))
    const user = renderLogin()
    await requestCode(user)

    await user.type(await screen.findByLabelText('Dígito 1 del código'), '000000')

    expect(await screen.findByText('No se pudo completar la solicitud.')).toBeInTheDocument()
    expect(codeBoxes()).toHaveLength(6)
    expect(boxValues()).toEqual(['', '', '', '', '', ''])
    expect(localStorage.getItem('taskmate.token')).toBeNull()
  })

  it('shows an error and stays on step 1 when the code request fails', async () => {
    sendOtpMock.mockRejectedValue(new Error('network'))
    const user = renderLogin()

    await requestCode(user)

    expect(await screen.findByText('No se pudo completar la solicitud.')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Código de verificación' })).not.toBeInTheDocument()
  })

  it('goes back to step 1 and starts with empty boxes next time', async () => {
    sendOtpMock.mockResolvedValue(undefined)
    const user = renderLogin()
    await requestCode(user)

    await user.type(await screen.findByLabelText('Dígito 1 del código'), '123')
    await user.click(screen.getByRole('button', { name: 'Cambiar correo' }))

    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Código de verificación' })).not.toBeInTheDocument()

    await requestCode(user)
    expect(await screen.findByRole('group', { name: 'Código de verificación' })).toBeInTheDocument()
    expect(boxValues()).toEqual(['', '', '', '', '', ''])
  })
})
