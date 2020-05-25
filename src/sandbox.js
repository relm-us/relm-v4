// I think block editing that's not 100% wysiwyg is better than an arbitrary editor
// maybe custom elements may help or so, editor.js
// node node_modules/y-webrtc/bin/server.js
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'

let countElement = document.getElementById('count')

countElement.addEventListener('animationend', (event) => {
  console.log(event.animationName)
  if (event.animationName === "fadeOut") {
    countElement.classList.remove('fadeout-text')
    countElement.innerText = countElement.dataset.newText
    countElement.classList.add('fadein-text')
  } else if (event.animationName === "fadeIn") {
    countElement.classList.remove('fadein-text')
  }
});

function updateText(text) {
  countElement.dataset.newText = text;
  countElement.classList.add('fadeout-text')
}

async function abcde() {
  const ydoc = new Y.Doc()
  // this allows you to instantly get the (cached) documents data
  let idbP = new IndexeddbPersistence('count-demo', ydoc)
  await idbP.whenSynced
  
  // this will sync between clients in the background, may be replaced by any network provider
  // let webP = new WebrtcProvider('count-demo', ydoc)
  // webP.connect()
  // array of numbers which produce a sum
  const yarray = ydoc.getArray('count')
  // add 1 to the sum
  yarray.push([1])
  // observe changes of the sum
  yarray.observe(event => {
    // this will print updates from the network
    let sum = yarray.toArray().reduce((a,b)=>(a+b))
    console.log("new sum: " + sum)
    updateText(sum.toString())
  })
  // print initial number (the cached one plus one)
  let sum = yarray.toArray().reduce((a,b)=>(a+b))
  console.log(sum)
  countElement.innerText = sum.toString()
  countElement.classList.add('fadein-text');
  countElement.classList.remove('invisible');

  (document.getElementById('add-count')).addEventListener('click', e => {
    yarray.push([1])
  })

  const yPosts = ydoc.getArray('posts1')
  yPosts.observe(event => {
    let table = document.getElementById('posts')
    let node = table.querySelector('tbody')
    var tbody = node.cloneNode(false);
    (node.parentNode).replaceChild(tbody, node);

    yPosts.forEach((originalElement) => {
      let element = originalElement
      let tr = document.createElement('tr')

      let tdTitle = document.createElement('td')
      tdTitle.appendChild(document.createTextNode(element.get('title')))

      let tdAuthors = document.createElement('td')
      tdAuthors.appendChild(document.createTextNode(element.get('author')))

      let tdContent = document.createElement('td')
      tdContent.appendChild(document.createTextNode(element.get('content')))

      let tdCreatedAt = document.createElement('td')
      tdCreatedAt.appendChild(document.createTextNode(element.get('createdAt')))

      let tdUpdatedAt = document.createElement('td')
      tdUpdatedAt.appendChild(document.createTextNode(element.get('updatedAt')))

      tr.appendChild(tdTitle)
      tr.appendChild(tdAuthors)
      tr.appendChild(tdContent)
      tr.appendChild(tdCreatedAt)
      tr.appendChild(tdUpdatedAt)

      tbody.appendChild(tr)
    })
  })

  const yPost = new Y.Map()
  yPost.set("title", "Teeest")
  yPost.set("author", "mohe2015")
  yPost.set("content", "hi")
  yPost.set("createdAt", "10.12.2001")
  yPost.set("updatedAt", "27.04.2020")

  yPosts.push([yPost])


  const yText = ydoc.getText('text')

  yText.insert(0, 'bold text', { bold: true })

  yText.observe((event, transaction) => {
    console.log(event.changes)
  })
}
abcde()