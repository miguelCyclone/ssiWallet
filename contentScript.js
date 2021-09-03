//
// Script to intercat with the website (read and write)
//

// Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)

const EDITOR_EXTENSION_ID = 'mokbpemgjhbbbgeggjknipddeledcgge'
const SOURCE_ID = 'cryptpnicsWalletSSI-agent'
const NAN = 'NAN'

let myMessage = null

window.addEventListener('load', function load(event) {
  //closePopAux()
  //initIframe()
  sendMessageAux()
})

function sendMessageAux() {
  window.addEventListener('message', (event) => {
    try {
      // Only accept messages from the same frame
      if (event.source !== window) {
        return
      }
      var message = event.data
      if (message.source !== SOURCE_ID) {
        return
      }
      switch (message.type) {
        case 'prepareSignMessage':
          myMessage = message
          sendMessage(myMessage, 'prepareSignMessage')
          break
        case 'connectRequest':
          //connectRequest()
          break
        default:
          break
      }
    } catch (err) {
      console.log('ERR', err)
      return
    }
  })
}

async function sendMessage(message, type) {
  let x = await sendMessageCore(message, type)
}

async function sendMessageCore(message, typeAux) {
  return new Promise(async function (resolve, reject) {
    chrome.runtime.sendMessage(
      EDITOR_EXTENSION_ID,
      {
        type: typeAux,
        data: message,
      },
      function (response) {
        resolve({ response })
      },
    )
  }).catch((error) => {
    console.log('Err')
    console.log(error)
    let x = { status: 0.1, err: error }
    resolve({ x })
  })
}

function sendMessageToWebsite(type, message) {
  window.postMessage(
    {
      source: SOURCE_ID,
      type: type,
      payload: {message: message },
    },
    '*',
  )
}

function checkMessageIsWaiting(){
  if(myMessage === null){
    return false
  }else{
    return true
  }
}

var onMessageListener = async function (message, sender, sendResponse) {
  if (sender.id === EDITOR_EXTENSION_ID) {
    message = message.data
    switch (message.type) {
      case 'signedMessage':
        // we post this message data to the website
        myMessage = null
        sendMessageToWebsite('signedMessage', message.data)
        sendResponse(1)
        break
      case 'cancelSignedMessage':
        myMessage = null
        sendMessageToWebsite('cancelSignedMessage', NAN)
        sendResponse(1)
        break
      case 'sendCancelAccess':
        sendMessageToWebsite('sendCancelAccess', NAN)
        sendResponse(1)
        break
      case 'checkMessageIsWaiting':
        let x = checkMessageIsWaiting()
        sendResponse(x)
        break
      case 'pullMessageFromContent':
        await sendMessage(myMessage, 'prepareSignMessage')    
        sendResponse(1)
        break    
      default:
        // NaN
        break
    }
    return true
  } else {
    console.log('ERR: wrong sender')
    return false
  }
}

//message from background script to webstie via content script
chrome.runtime.onMessage.addListener(onMessageListener)