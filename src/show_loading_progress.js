const ShowLoadingProgress = (id, currentProgress, maxProgress) => {
  const progressBar = document.getElementById('progress-bar')
  let div
  if (progressBar.firstChild.tagName === 'DIV') {
    div = progressBar.firstChild
  } else {
    div = document.createElement('div')
    progressBar.innerHTML = ''
    progressBar.appendChild(div)
  }

  div.style.width = Math.ceil((currentProgress / maxProgress) * 100) + '%'
  div.innerHTML = id
  if (currentProgress === maxProgress) {
    setTimeout(() => {
      progressBar.style.display = 'none'
      document.getElementById('typing').style.visibility = 'visible'
    }, 200)
  }
}

export { ShowLoadingProgress }
