import Toastify from 'toastify-js'

const TOAST_DEFAULT_WAIT = 4000

let previousToastMsg

const showToast = (msg, wait = TOAST_DEFAULT_WAIT) => {
  previousToastMsg = msg
  const toast = Toastify({
    text: msg,
    duration: wait,
    position: 'center',
    backgroundColor: '#555',
    stopOnFocus: true,
    onClick: () => { toast.hideToast() },
  })
  toast.showToast()
}

const showPreviousToast = (wait = TOAST_DEFAULT_WAIT) => {
  showToast(previousToastMsg, wait)
}

export { showToast, showPreviousToast }
