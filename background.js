//
// This script interacts with the background of the chrome plugin
// 

// Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)

const SOURCE_ID = 'cryptpnicsWalletSSI-agent'
const EXTENSION_ID = 'mokbpemgjhbbbgeggjknipddeledcgge'
const EXTENSION_ORIGIN = 'chrome-extension://mokbpemgjhbbbgeggjknipddeledcgge'
const EXTENSION_URL_POPUP =
  'chrome-extension://mokbpemgjhbbbgeggjknipddeledcgge/popup.html'
const EXTENSION_URL_HOME =
  'chrome-extension://mokbpemgjhbbbgeggjknipddeledcgge/src/libs/views/home/home.html'
const TAB = 'tab'
const NAN = 'NAN'

var session = false
var password = ''
var signState = 3 //  0: Authentication,  1:Sign, 2:Encrypt, 3:Innactive
var messageToBeSigned = {}

var ethereumLocalNet = {
  id: 0,
  Blockchain: 'Ethereum',
  net: 'LocalNet',
  address: [], //address arr
  publicKey: [], //publickey arr
}

//check if user has added the website permission
async function checkWebsiteIsPermitted(origin) {
  var lastChar = origin.substr(origin.length - 1)
  if (lastChar !== '/') {
    origin = origin + '/'
  }
  console.log('checkWebsiteIsPermitted MY ORIGIN', origin)
  let x = await checkWebsiteIsPermittedCore(origin)
  return x
}
function checkWebsiteIsPermittedCore(origin) {
  return new Promise((resolve) => {
    chrome.permissions.contains(
      {
        /*permissions: ['host_permissions'],*/
        origins: [origin]
      },
      function (result) {
        resolve(result)}
    )
  })
}

function getBlockchainObject(id) {
  let x = {}
  switch (id) {
    case 0:
      x = ethereumLocalNet
      break
    default:
      x = { id: NAN }
      break
  }
  return x
}

function setBlockchainObject(address, publicKey, id) {
  let x = 0 //{}
  switch (id) {
    case 0:
      ethereumLocalNet.address = address
      ethereumLocalNet.publicKey = publicKey
      x = 1 //ethereum
      break
    default:
      //x = {"id":"NaN"}
      break
  }
  return x
}

//notification
function notificationOpenPopUp(title, text) {
  try {
    chrome.notifications.create('notification_Cryptonics_openPlugin', {
      type: 'basic',
      iconUrl: 'images/signorLogo2Transparent.png',
      title: 'Cryptonics notification',
      message: text,
      priority: 2,
    })
  } catch (err) {
    console.log('ERROR: -1.365 ', err)
    return -1
  }
}

function prepareSignMessage(message) {
  if (message.source === SOURCE_ID) {
    message.payload['site'] = message.payload['source']
    delete message.payload['source']
    signState = 1
    messageToBeSigned = message.payload
    return { status: 1 }
  } else {
    return {
      status: 0,
      err: 'Wrong source ID, the correct source ID is: ' + SOURCE_ID,
    }
  }
}

function resetSignMessage() {
  console.log('reset: ', messageToBeSigned)
  signState = 3
  messageToBeSigned = {}
}

async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true }
  let [tab] = await chrome.tabs.query(queryOptions)
  return tab
}

function sendMessageToTabCore(id, data) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(id, { data: data }, function (response) {
      resolve(response)
    })
  })
}

async function sendMessageToTab(id, data) {
  let x = await sendMessageToTabCore(id, data)
  return x
}

async function sendRawAndSignMessageToActiveTab(mesageSigned) {
  let x = await getCurrentTab()
  data = {
    type: 'signedMessage',
    data: { raw: messageToBeSigned.message, signed: mesageSigned },
  }
  sendMessageToTab(x.id, data)
  return { status: 1 }
}

async function sendCancelSignToActiveTab() {
  let x = await getCurrentTab()
  data = {
    type: 'cancelSignedMessage',
  }
  sendMessageToTab(x.id, data)
  return { status: 1 }
}

async function sendCancelAccessToActiveTab() {
  let x = await getCurrentTab()
  data = {
    type: 'sendCancelAccess',
  }
  sendMessageToTab(x.id, data)
  return { status: 1 }
}

async function sendPullMessageFromContent() {
  let x = await getCurrentTab()
  data = {
    type: 'pullMessageFromContent',
  }
  sendMessageToTab(x.id, data)
  return { status: 1 }
}

async function sendCheckMessageIsWaiting() {
  let x = await getCurrentTab()
  data = {
    type: 'checkMessageIsWaiting',
  }
  let y = await sendMessageToTab(x.id, data)
  console.log('my Y: ',y)
  return { status: 1, response: y }
}

var onMessageListener = function (message, sender, sendResponse) {
  //check the id of the sender
  if (sender.id === EXTENSION_ID) {
    //check the origin of the message (plugin or content script)
    if (
      sender.origin === EXTENSION_ORIGIN &&
      (sender.url === EXTENSION_URL_POPUP ||
        sender.url === EXTENSION_URL_HOME) &&
      !(TAB in sender)
    ) {
      //message is from plugin
      switch (message.type) {
        case 'bglog':
          console.log(message.obj)
          break
        case 'getBlockchainObject':
          let selectedBlockchain = getBlockchainObject(message.obj)
          sendResponse(selectedBlockchain)
          break
        case 'setBlockchainObject':
          let blockcahinObj = setBlockchainObject(
            message.obj,
            message.obj2,
            message.obj3,
          )
          sendResponse(blockcahinObj)
          break
        case 'updateSession':
          session = message.obj
          sendResponse(session)
          break
        case 'getSession':
          sendResponse(session)
          break
        case 'setPassword':
          password = message.obj
          sendResponse(password)
          break
        case 'getPassword':
          sendResponse(password)
          break
        case 'getSignState':
          sendResponse(signState)
          break
        case 'getMessageToSign':
          sendResponse(messageToBeSigned)
          break
        case 'resetSignMessage':
          resetSignMessage()
          sendResponse(1)
          break
        case 'sendRawAndSignMessageToActiveTab':
          sendRawAndSignMessageToActiveTab(message.data).then(sendResponse)
          break
        case 'sendCancelSignToActiveTab':
          sendCancelSignToActiveTab().then(sendResponse)
          break
        case 'sendCancelAccessToActiveTab':
          sendCancelAccessToActiveTab().then(sendResponse)
          break
        case 'pullMessageFromContent':
          sendPullMessageFromContent().then(sendResponse)
          break
        case 'checkMessageIsWaiting':
          sendCheckMessageIsWaiting().then(sendResponse)
          break
        default:
          let response = NAN
          sendResponse(response)
          break
      }
    } else {
      //message is from content script, we LIMIT the requests that they can do
      contentScriptCalls(sender, message, sendResponse)    
    }
    //return true for both cases, content and plugin origin
    return true
  } else {
    //wrong sender id do nothing
    return false
  }
}

async function contentScriptCalls(sender, message, sendResponse){
  let x = await checkWebsiteIsPermitted(sender.origin)
      console.log('site is: ',x)
      if (x === true) {
        console.log('im ture')
        switch (message.type) {
          case 'prepareSignMessage':
            message.data.payload['source'] = sender.origin
            let x = prepareSignMessage(message.data)
            notificationOpenPopUp(
              '',
              'Open the Cryptonics wallet to sign the message',
            )
            sendResponse(x)
            break
          default:
            let response = NAN
            sendResponse(response)
            break
        }
      } else {
        console.log('hello o.0')
        // this website is not permitted to interact with the Content Script
        console.log('ACCESS DENIED')
        notificationOpenPopUp('', 'Open the wallet A site request to connect')
        sendCancelAccessToActiveTab().then(sendResponse)
      }
}

chrome.runtime.onMessage.addListener(onMessageListener)