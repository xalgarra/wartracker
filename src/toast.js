export function mostrarToast(msg, tipo = 'error') {
  const container = document.getElementById('toast-container')
  const toast = document.createElement('div')
  toast.className = `toast toast-${tipo}`
  toast.textContent = msg
  container.appendChild(toast)
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('visible')))
  setTimeout(() => {
    toast.classList.remove('visible')
    toast.addEventListener('transitionend', () => toast.remove(), { once: true })
  }, 3500)
}

export const mostrarError = msg => mostrarToast(msg, 'error')
export const mostrarExito = msg => mostrarToast(msg, 'exito')
