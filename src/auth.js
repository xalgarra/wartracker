import { db } from './db.js'
import { inicializar } from './init.js'

export async function login() {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const { error } = await db.auth.signInWithPassword({ email, password })
  if (error) {
    document.getElementById('error-msg').style.display = 'block'
  } else {
    await mostrarApp()
  }
}

export async function logout() {
  await db.auth.signOut()
  document.getElementById('app-screen').style.display = 'none'
  document.getElementById('login-screen').style.display = 'block'
}

export function toggleDarkMode() {
  const dark = document.body.classList.toggle('dark')
  localStorage.setItem('wt_theme', dark ? 'dark' : 'light')
  const btn = document.getElementById('btn-theme')
  if (btn) btn.textContent = dark ? '☀️' : '🌙'
}

export async function mostrarApp() {
  document.getElementById('login-screen').style.display = 'none'
  document.getElementById('app-screen').style.display = 'block'
  const btn = document.getElementById('btn-theme')
  if (btn) btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙'
  await inicializar()
}
