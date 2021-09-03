//
// Miscelanous functions
// This cript acts as an abstraction level between background script and the front end form the plugin
// It also supports some auxiliar functions
// IMPORTANT [To avoid circular dependency: this module CANNOT have any imports from other libraries (except from bundles)]
//

// Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)

import '../../bundles/bundleEcrypto.js' //bundle from eccrypto

const ec = ecc.eccrypto

// To print out in console
var bkg = function (obj) {
  if (chrome && chrome.runtime) {
    chrome.runtime.sendMessage({ type: 'bglog', obj: obj })
  }
}

function generatePublicKeyTest() {
  let privKey = ec.generatePrivate()
  let pubKey = ec.getPublic(privKey)
  return pubKey
}

function createNotificaiton(title,text){
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

function checkMessageIsWaiting(){
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage(
      {
        type: 'checkMessageIsWaiting'
      },
      function (response) {
        bkg('my super resp: ')
        bkg(response)
        resolve({ response })
      },
    )
  }).catch((error) => {
    bkg('Err')
    bkg(error)
    resolve({ response: 0.01 })
  })
}

async function pullMessageFromContent(){
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage(
      {
        type: 'pullMessageFromContent'
      },
      function (response) {
        resolve({ response })
      },
    )
  }).catch((error) => {
    bkg('Err')
    bkg(error)
    resolve({ response: 0.01 })
  })
}

//send cancel website access to content to the active Tab
function sendCancelAccessToActiveTab() {
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage(
      {
        type: 'sendCancelAccessToActiveTab'
      },
      function (response) {
        resolve({ response })
      },
    )
  }).catch((error) => {
    bkg('Err')
    bkg(error)
    resolve({ response: 0.01 })
  })
}

//send cancel to active tab that requested this message
function sendCancelSignToActiveTab() {
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage(
      {
        type: 'sendCancelSignToActiveTab'
      },
      function (response) {
        resolve({ response })
      },
    )
  }).catch((error) => {
    bkg('Err')
    bkg(error)
    resolve({ response: 0.01 })
  })
}

//send signed message to active tab that requested this message
function sendRawAndSignMessageToActiveTab(signedMessaged) {
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage(
      {
        type: 'sendRawAndSignMessageToActiveTab',
        data:signedMessaged
      },
      function (response) {
        resolve({ response })
      },
    )
  }).catch((error) => {
    bkg('Err')
    bkg(error)
    resolve({ response: 0.01 })
  })
}

function getSignState() {
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage(
      {
        type: 'getSignState',
      },
      function (response) {
        resolve({ response })
      },
    )
  }).catch((error) => {
    bkg('Err')
    bkg(error)
    resolve({ response: false })
  })
}

function getMessageToSign(){
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage(
      {
        type: 'getMessageToSign',
      },
      function (response) {
        resolve({ response })
      },
    )
  }).catch((error) => {
    bkg('Err')
    bkg(error)
    resolve({ response: false })
  })
} 

function resetSignMessage(){
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage(
      {
        type: 'resetSignMessage',
      },
      function (response) {
        resolve({ response })
      },
    )
  }).catch((error) => {
    bkg('Err')
    bkg(error)
    resolve({ response: false })
  })
}

//get session boolean
function getSessionCore() {
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage(
      {
        type: 'getSession',
      },
      function (response) {
        //bkg('My get session: ' + response)
        resolve({ response })
      },
    )
  }).catch((error) => {
    bkg('Err')
    bkg(error)
    resolve({ response: false })
  })
}

async function getSession() {
  let x = await getSessionCore()
  x = x.response

  if (x === true) {
    return true
  } else {
    return false
  }
}

//update session boolean
function updateSession(session) {
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage(
      {
        type: 'updateSession',
        obj: session,
      },
      function (response) {
        resolve({ response })
      },
    )
  }).catch((error) => {
    bkg('Err')
    bkg(error)
    let response = 'Err'
    resolve({ response })
  })
}

//get password
function getPassword() {
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage(
      {
        type: 'getPassword',
      },
      function (response) {
        resolve({ response })
      },
    )
  }).catch((error) => {
    bkg('Err')
    bkg(error)
    resolve({ response: false })
  })
}

//get password
function setPassword(pwd) {
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage(
      {
        type: 'setPassword',
        obj: pwd,
      },
      function (response) {
        resolve({ response })
      },
    )
  }).catch((error) => {
    bkg('Err')
    bkg(error)
    resolve({ response: false })
  })
}

// To add/update AcctounArr
function setBlockchainObject(accountArr, publicKey, id) {
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage(
      {
        type: 'setBlockchainObject',
        obj: accountArr,
        obj2: publicKey,
        obj3: id,
      },
      function (response) {
        resolve({ response })
      },
    )
  }).catch((error) => {
    bkg('Err')
    bkg(error)
  })
}

// To get blockcahin user data object
function getBlockchainObject(id) {
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage(
      {
        type: 'getBlockchainObject',
        obj: id,
      },
      function (response) {
        resolve(response)
      },
    )
  }).catch((error) => {
    bkg('Err')
    bkg(error)
  })
}

//check if user has added the website permission
async function checkWebsiteIsPermitted(origin) {
  var lastChar = origin.substr(origin.length - 1)
  if (lastChar !== '/') {
    origin = origin + '/'
  }
  console.log('MY ORIGIN', origin)
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

//from stackOverFlow: to randomize the index position of the values from an array
//de-facto unbiased shuffle algorithm is the Fisher-Yates (aka Knuth) Shuffle
function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex

  // While there remain elements to shuffle
  while (0 !== currentIndex) {
    // Pick a remaining element
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }

  return array
}

//
// Spinning logo for fun...
//
function spinLogo() {
  var img = document.getElementById('mainLogoHeader')
  if (img.clientWidth > 0) {
    function mouse(e) {
      var center_x = img.offsetLeft + img.clientWidth / 2
      var center_y = img.offsetTop + img.clientHeight / 2
      var mouse_x = e.clientX
      var mouse_y = e.clientY
      var radians = Math.atan2(mouse_x - center_x, mouse_y - center_y)
      var degree = radians * (180 / Math.PI) * -1 + 0 // +0 = anchor in the bottom, +90 = anchor in the right
      /*img.style('-moz-transform', 'rotate(' + degree + 'deg)');
        img.style('-webkit-transform', 'rotate(' + degree + 'deg)');
        img.style('-o-transform', 'rotate(' + degree + 'deg)');
        img.style('-ms-transform', 'rotate(' + degree + 'deg)');*/
      img.style['-moz-transform'] = 'rotate(' + degree + 'deg)'
      img.style['-webkit-transform'] = 'rotate(' + degree + 'deg)'
      img.style['-o-transform'] = 'rotate(' + degree + 'deg)'
      img.style['-mstransform'] = 'rotate(' + degree + 'deg)'
    }
    window.addEventListener('mousemove', (e) => {
      mouse(e)
    })
  }
}

async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true }
  let [tab] = await chrome.tabs.query(queryOptions)
  return tab
}

export default {
  bkg,
  shuffle,
  spinLogo,

  getSession,
  updateSession,
  getSignState,
  getMessageToSign,
  resetSignMessage,
  sendRawAndSignMessageToActiveTab,
  sendCancelSignToActiveTab,
  sendCancelAccessToActiveTab,
  pullMessageFromContent,
  checkMessageIsWaiting,

  getPassword,
  setPassword,

  getBlockchainObject,
  setBlockchainObject,

  generatePublicKeyTest,

  checkWebsiteIsPermitted,
  createNotificaiton,
  getCurrentTab
}