//
// This script is the main script for a user that already ahs an account (data in local storage)
//

// Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)

import blockchain from './../../didLib.aux.js' //import blockchain functions
import server from './../../serverCalls.js' //import server functions
import miscImp from './../../misc.js' //import miscelanous functions

//
// globalVariables
//

const popUpTimeOut = 3000 // 3 seconds
const NAN = 'NaN'

var bkg = miscImp.bkg
var getBlockchainObject = miscImp.getBlockchainObject
var spinLogo = miscImp.spinLogo
var updateSession = miscImp.updateSession
var setPassword = miscImp.setPassword
var getSignState = miscImp.getSignState
var getMessageToSign = miscImp.getMessageToSign
var resetSignMessage = miscImp.resetSignMessage
var sendRawAndSignMessageToActiveTab = miscImp.sendRawAndSignMessageToActiveTab
var sendCancelSignToActiveTab = miscImp.sendCancelSignToActiveTab
var checkWebsiteIsPermitted = miscImp.checkWebsiteIsPermitted
var sendCancelAccessToActiveTab = miscImp.sendCancelAccessToActiveTab
var checkMessageIsWaiting = miscImp.checkMessageIsWaiting
var pullMessageFromContent = miscImp.pullMessageFromContent
var getCurrentTab = miscImp.getCurrentTab
var signMessage = blockchain.signeMessage

var activeDID = ''
var activeSignKey = NAN
var activeEncryptKey = NAN
var activeAuthKey = NAN

var rawDidDocument = {} //raw did document, we use it to obtain the keys

var account = [] // ethereum public address array
var publicKey = [] // public keys from user vault (maybe yes or not already at the DID document)

var pubKeyAuth = [] // keys that are currently existing at the DID document
var pubKeySign = []
var pubKeyEncrypt = []

// dictionary for the keys with buttons, so we can obtain the string of they that we want to deleate or choose, etc
// One key is linked to an specific html ID
var keyDict = {}

// dict for the key index
// this is the index of the key inside the DIDdoc, this is the index that we send to the blockchain to remove the key
var keyIndex = {}

window.addEventListener('load', function load(event) {
  init()
})

async function init() {
  var accountAux = await getBlockchainObject(0) //id 0 for ethereum local net
  account = accountAux.address
  publicKey = accountAux.publicKey

  activeDID = getActiveDID()

  //
  initUser()

  //spin logo for fun
  spinLogo()

  //
  initButtons()

  //test blockchain connectivity AND bootstratp backend data (but backend data has already been bootsrapped, wo we dont need this, except for hte decentralized user)
  // init signer to send transaction to verify messages backend server
  try {
    let y = await blockchain.initDidSigner(NAN)
    if (y.status === 1) {
      let x = await blockchain.checkNet()
      bkg('My net is: ' + x)
    } else {
      initPopUp('Error while initializing the wallet signer, please close and open the plugin')
      closePopUp()
    }
  } catch (err) {
    bkg('Connection error')
    bkg(err)
  }
  // check if DID has been created, if not, create
  await checkDIDInit()

  //init kets arr front end from data from server
  await initKeysArr()

  //check if there is a message waiting to be signed and that we are on the right website
  checkSignMessageIsWaiting()
}

async function checkSignMessageIsWaiting() {
  let x = await getSignState()
  let y = await getMessageToSign()
  let z = await checkMessageIsWaiting()
  let a = await getCurrentTab()

  origin = a.url
  let isWebsitePermitted = await checkWebsiteIsPermitted(origin)

  let site = y.response.site
  if (site !== null && site !== undefined && typeof site === 'string') {
    var lastChar = site.substr(site.length - 1)
    if (lastChar !== '/') {
      site = site + '/'
    }
  }
  if (isWebsitePermitted === true) {
    document.getElementById('websiteStatusID').innerHTML =
      '&#9673 Website is connected'
    document.getElementById('websiteStatusID').style.color =
      'rgba(77, 175, 124, 1) '
    document.getElementById('websiteStatusID').disabled = false
  }

  if (
    (x !== 3 && site === origin) ||
    (z.response.status === 1 && z.response.response === true)
  ) {
    if (isWebsitePermitted === true) {
      bkg('bbb')
      signFunctionSelector(x.response)
    } else {
      bkg('ZZ')
      if (z.response.response === true) {
        //website has no permission and there is a message waiting
        bkg('flag final')
        document.getElementById('websiteStatusID').innerHTML =
          '&#9673 Website wants to connect'
        document.getElementById('websiteStatusID').style.color =
          'rgba(245, 171, 53, 1)'
        document.getElementById('websiteStatusID').disabled = false
        //
      } else {
        // website has no permission and there's no message waiting
        // do nothing
      }
    }
  } else {
    // there is no sign message waiting for this website
    // do nothing
    bkg('no message waiting to be signed')
  }
}

//signFunctionSelector(x.response)
function signFunctionSelector(response) {
  switch (response) {
    case 0:
      //authenticate()
      break
    case 1:
      signMain()
      break
    case 2:
    //encrypt()
    case 3:
      break
    default:
      break
  }
}

// user can change the DID that is been used
// To DO: the last DID used is saved on the backend. When the user comes back again, the last DID is obtainned
function getActiveDID() {
  let i = 0 // init ui with did index 0
  return account[i]
}

function initButtons() {
  logOut()
  //dropdown menu show/hide
  displayNetList()
  // Close the dropdown if the user clicks outside of it
  closeNetList()

  //show hide keys
  showHideKeys()

  //init addKeys buttons
  initKeys()

  //process the sign/encrypt/Auth site request
  processRequest()

  //cancel request
  cancelRequest()

  //connect to website
  connectToWebsite()
}

function connectToWebsite() {
  document.getElementById('websiteStatusID').onclick = async function () {
    document.getElementById('websiteStatusID').disabled = true
    let a = await getCurrentTab()
    origin = a.url
    let b = false
    b = await checkWebsiteIsPermitted(origin)
    if (b === true) {
      //ask to remove
      bkg('REMOVE WEBSITE')
      requestToRemoveWebsite(origin)
    } else {
      //ask to add
      bkg('ADD WEBSITE')
      requestToAddWebsite(origin)
    }
  }
}

function initUser() {
  document.getElementById('homeSectionHeader').style.display = 'block'
  document.getElementById('homeSectionSubHeader').style.display = 'block'
  document.getElementById('homeSectionBody').style.display = 'block'
  document.getElementById('authSection').style.display = 'none'
  document.getElementById('encryptSection').style.display = 'none'
  document.getElementById('signSection').style.display = 'none'

  document.getElementById('chooseKeyAuxTitle').style.display = 'none'

  document.getElementById('websiteStatusID').disabled = true

  showPartialAddressString()
}

//dropdown for the network
function displayNetList() {
  document.getElementById('dropDownNet').onclick = function () {
    var div = document.getElementById('myDropdownNet')
    if (div.style.display === 'block') {
      div.style.display = 'none'
    } else {
      div.style.display = 'block'
      div = document.getElementById('selectAccDropDown')
      div.style.display = 'none'
    }
  }
}
//this will close the list if the user clicks outside
function closeNetList() {
  window.onclick = function (event) {
    if (
      !event.target.matches('.dropbtn') &&
      !event.target.matches('.accAuxdbt')
    ) {
      var div = document.getElementById('myDropdownNet')
      div.style.display = 'none'

      div = document.getElementById('selectAccDropDown')
      div.style.display = 'none'
    }
  }
}

function showPartialAddressString() {
  var strDown = activeDID.slice(0, 5).toUpperCase()
  var strUp = activeDID.slice(activeDID.length - 4).toUpperCase()
  document.getElementById('partialAddressString').innerHTML =
    strDown + '...' + strUp

  document.getElementById('partialAddressString').onclick = function () {
    copyAddressToClipBoard()
  }
  document.getElementById('partialAddressTitleString').onclick = function () {
    displayAccList() //copyAddressToClipBoard()
  }
}

function displayAccList() {
  var div = document.getElementById('selectAccDropDown')
  if (div.style.display === 'block') {
    div.style.display = 'none'
  } else {
    div.style.display = 'block'

    div = document.getElementById('myDropdownNet')
    div.style.display = 'none'
  }
}

function logOut() {
  document.getElementById('logout').style.display = 'block'
  document.getElementById('logout').onclick = async function () {
    setPassword('') // flush password
    updateSession(false)
    resetSignMessage()
    window.location.href = './../../../../popup.html' // go to other view
  }
}

async function checkDIDInit() {
  let x = await server.getDIDDocument(activeDID)
  //bkg("My getDID status: "+x.status)
  if (x.status === 1) {
    //did has already been created
    bkg(x.didDoc)
    rawDidDocument = x.didDoc
  } else {
    //did is not created or there was an error
    let y = await server.createDid(activeDID)
    bkg('My createDid status: ' + y.status)
  }
}
async function initKeysArr() {
  hideInitRows()
  initAuthenticationKeys()
  initEncryptionKeys()
  initSigningKeys()
}

function initAuthenticationKeys() {
  let authKeys = rawDidDocument.authentication
  let i = 0
  for (i = 0; i < authKeys.length; i++) {
    //deleate the initial 0x
    let keyAux = authKeys[i].publicKeyPem.substring(2)

    let index = authKeys[i].id
    index = index.split('-')
    index = index[1]

    keyIndex[keyAux] = parseInt(index)

    pubKeyAuth.push(keyAux)
    addAuthDivKey()
  }
}

function initEncryptionKeys() {
  let encryption = rawDidDocument.encryption
  let i = 0
  for (i = 0; i < encryption.length; i++) {
    //deleate the initial 0x
    let keyAux = encryption[i].publicKeyPem.substring(2)

    let index = encryption[i].id
    index = index.split('-')
    index = index[1]

    keyIndex[keyAux] = parseInt(index)

    pubKeyEncrypt.push(keyAux)
    addEncryptDivKey()
  }
}

function initSigningKeys() {
  let signing = rawDidDocument.signing
  let i = 0
  for (i = 0; i < signing.length; i++) {
    //deleate the initial 0x
    let keyAux = signing[i].publicKeyPem.substring(2)

    let index = signing[i].id
    index = index.split('-')
    index = index[1]

    keyIndex[keyAux] = parseInt(index)

    pubKeySign.push(keyAux)
    addSignDivKey()
  }
}

function hideInitRows() {
  //we hide the bootstrap elements for the repeater
  document.getElementById('authObj_CLEAR').style.display = 'none'
  document.getElementById('signObj_CLEAR').style.display = 'none'
  document.getElementById('encryptObj_CLEAR').style.display = 'none'
  //
}

function addAuthDivKey() {
  createClones(
    'authObj_CLEAR',
    'authKeyTitle_',
    'authObj_',
    'chooseAuth_',
    'deleateAuth_',
  )
}
function addSignDivKey() {
  createClones(
    'signObj_CLEAR',
    'signKeyTitle_',
    'signObj_',
    'chooseSign_',
    'deleateSign_',
  )
}
function addEncryptDivKey() {
  createClones(
    'encryptObj_CLEAR',
    'encryptKeyTitle_',
    'encryptObj_',
    'chooseEncrypt_',
    'deleateEncrypt_',
  )
}

function createClones(parent, ketIdAux, rowIdAux, chooseIdAux, deleateIdAux) {
  let oririginal = document.getElementById(parent)
  let clone = oririginal.cloneNode(true) //firstElementChild

  let keyArr = []
  switch (parent) {
    case 'authObj_CLEAR':
      keyArr = pubKeyAuth
      break
    case 'signObj_CLEAR':
      keyArr = pubKeySign
      break
    case 'encryptObj_CLEAR':
      keyArr = pubKeyEncrypt
      break
    default:
      break
  }

  //this Id corresponsed for the clones ID, it does NOT reflect the DID key index
  let idx = keyArr.length - 1
  let idx_s = idx.toString()
  let idTitle = ketIdAux + idx_s

  clone.id = rowIdAux + idx
  //clone name assignment not working, so we set Ids on next step
  /*clone.getElementsByTagName('keyTitle').id = 'authKeyTitle_' + idx
  clone.getElementsByTagName('chooseKey').id = 'choose_auth_' + idx
  clone.getElementsByTagName('deleateKey').id = 'deleate_auth_' + idx*/
  oririginal.parentNode.appendChild(clone)

  var row = document.getElementById(clone.id)
  row.style.display = 'block'
  var children = row.children
  children[0].id = idTitle
  children[1].id = chooseIdAux + idx_s
  children[2].id = deleateIdAux + idx_s

  var strDown = keyArr[idx].slice(2, 6).toUpperCase()
  var strUp = keyArr[idx].slice(keyArr[idx].length - 4).toUpperCase()

  var title = document.getElementById(idTitle)
  title.innerHTML = strDown + '...' + strUp //"key: "+idx_s//strDown+"..."+strUp

  //key dict so we can choose key, deleate, etc
  keyDict[clone.id] = keyArr[idx]

  //init remove key button
  removeKey(deleateIdAux + idx_s)

  //init choose key
  chooseKey(chooseIdAux + idx_s)

  document.getElementById(chooseIdAux + idx_s).style.visibility = 'hidden'
  document.getElementById(deleateIdAux + idx_s).style.visibility = 'hidden'
  row.addEventListener('mouseover', showAuxButtons)
  row.addEventListener('mouseout', hideAuxButtons)
}

function showAuxButtons(e) {
  let idx = e.target.id.split('_') // name_name2_idx
  //var ee = document.getElementById("authObj_"+idx[1]);
  let rowName = getkeyRowName(e.target.id)
  var ee = document.getElementById(rowName)

  //e.style.backgroundColor = 'black';
  var children = ee.children
  var key = document.getElementById(children[0].id)
  var setKey = document.getElementById(children[1].id)
  var deleateKey = document.getElementById(children[2].id)

  key.style.backgroundColor = 'black'
  key.style.color = 'white'

  setKey.style.visibility = 'visible'
  deleateKey.style.visibility = 'visible'
}

function hideAuxButtons(e) {
  let idx = e.target.id.split('_') // name_name2_idx
  //var ee = document.getElementById("authObj_"+idx[1]);
  let rowName = getkeyRowName(e.target.id)
  var ee = document.getElementById(rowName)

  var children = ee.children
  var key = document.getElementById(children[0].id)
  var setKey = document.getElementById(children[1].id)
  var deleateKey = document.getElementById(children[2].id)

  key.style.backgroundColor = 'Transparent'
  key.style.color = 'rgba(128,128,128)'

  setKey.style.transition = '0.01s'
  deleateKey.style.transition = '0.01s'
  setKey.style.visibility = 'hidden'
  deleateKey.style.visibility = 'hidden'
}

function showHideKeys() {
  showHideEncryptKeys()
  showHideSingKeys()
  showHideAuthKeys()
}

function showHideEncryptKeys() {
  document.getElementById('encryptSectionTitle').onclick = async function () {
    unSpotLightButton()

    document.getElementById('authSection').style.display = 'none'
    document.getElementById('signSection').style.display = 'none'

    if (document.getElementById('encryptSection').style.display === 'block') {
      document.getElementById('encryptSection').style.display = 'none'
    } else {
      document.getElementById('encryptSection').style.display = 'block'
      document.getElementById('encryptSectionTitle').style.backgroundColor =
        'black'
      document.getElementById('encryptSectionTitle').style.color = 'White'
    }
  }
}
function showHideSingKeys() {
  document.getElementById('signSectionTitle').onclick = async function () {
    unSpotLightButton()

    document.getElementById('authSection').style.display = 'none'
    document.getElementById('encryptSection').style.display = 'none'

    if (document.getElementById('signSection').style.display === 'block') {
      document.getElementById('signSection').style.display = 'none'
    } else {
      document.getElementById('signSection').style.display = 'block'
      document.getElementById('signSectionTitle').style.backgroundColor =
        'black'
      document.getElementById('signSectionTitle').style.color = 'White'
    }
  }
}
function showHideAuthKeys() {
  document.getElementById('authSectionTitle').onclick = async function () {
    unSpotLightButton()

    document.getElementById('signSection').style.display = 'none'
    document.getElementById('encryptSection').style.display = 'none'

    if (document.getElementById('authSection').style.display === 'block') {
      document.getElementById('authSection').style.display = 'none'
    } else {
      document.getElementById('authSection').style.display = 'block'
      document.getElementById('authSectionTitle').style.backgroundColor =
        'black'
      document.getElementById('authSectionTitle').style.color = 'White'
    }
  }
}

function unSpotLightButton() {
  document.getElementById('authSectionTitle').style.backgroundColor =
    'Transparent'
  document.getElementById('authSectionTitle').style.color = 'black'

  document.getElementById('signSectionTitle').style.backgroundColor =
    'Transparent'
  document.getElementById('signSectionTitle').style.color = 'black'

  document.getElementById('encryptSectionTitle').style.backgroundColor =
    'Transparent'
  document.getElementById('encryptSectionTitle').style.color = 'black'
}

function initKeys() {
  addKeyAuth()
  addKeySign()
  addKeyEncrypt()
  auxButtonTest()
}

function initPopUp(popText) {
  document.getElementById('boxPopUp').style.display = 'none'
  document.getElementById('boxPopUp').style.display = 'block'
  document.getElementById('boxPopUpText').innerHTML = popText
}
function closePopUp() {
  setTimeout(function () {
    document.getElementById('boxPopUp').style.display = 'none'
  }, popUpTimeOut)
}

//the key we send is on string format withouth the prefix[0x]
async function addKeyAuth() {
  document.getElementById('addKeyAuth').onclick = async function () {
    disableAllStateButtons()
    await addKeyWrapper(blockchain.keyPurpose.Authentication)
  }
}
async function addKeySign() {
  document.getElementById('addKeySign').onclick = async function () {
    disableAllStateButtons()
    await addKeyWrapper(blockchain.keyPurpose.Signing)
  }
}
async function addKeyEncrypt() {
  document.getElementById('addKeyEncrypt').onclick = async function () {
    disableAllStateButtons()
    await addKeyWrapper(blockchain.keyPurpose.Encryption)
  }
}

function disableAllStateButtons() {
  disableAddKeyButtons()
  disableAllRemoveKey()
}

function enableAllStateButtons() {
  enableAddKeyButtons()
  enableAllRemoveKey()
}

function disableAddKeyButtons() {
  document.getElementById('addKeyEncrypt').disabled = true
  document.getElementById('addKeySign').disabled = true
  document.getElementById('addKeyAuth').disabled = true
}

function enableAddKeyButtons() {
  document.getElementById('addKeyEncrypt').disabled = false
  document.getElementById('addKeySign').disabled = false
  document.getElementById('addKeyAuth').disabled = false
}

// gets the first key that has not been added to the DID document
// keys can be removed and add again later
// a recovery key mecanishm must be added for the next version
function getAvailableKey() {
  let index = -1
  for (var i = 0; i < publicKey.length; i++) {
    let key = keyIndex[publicKey[i]]
    if (key === undefined && index === -1) {
      index = i
    }
  }
  return index
}

async function addKeyWrapper(purp) {
  return new Promise(async function (resolve, reject) {
    initPopUp('Loading... ')
    let indexToAdd = getAvailableKey()
    if (indexToAdd >= 0) {
      let x = await addKeyCore(indexToAdd, purp)

      //that key has already been added
      if (x.status === -2.04) {
        initPopUp('Error: Key has already been added')
        closePopUp()
        bkg('END NOK: ' + x.status)
        enableAllStateButtons()
        resolve({ status: 0.002 })
      } else if (x.status === -2.04) {
        initPopUp('There was an error 2, please try again')
        closePopUp()
        bkg('END NOK: ' + x.status)
        enableAllStateButtons()
        resolve({ status: 0.001 })
      }
      if (x.status === 1) {
        bkg('END OK')
        initPopUp('Keey added correclty')
        closePopUp()
        //there is an error when resolving this promise... so we have to call each case here on a switch... not preetty but ok
        keyIndex[publicKey[indexToAdd]] = Object.keys(keyIndex).length + 1
        switch (purp) {
          case 0:
            pubKeyAuth.push(publicKey[indexToAdd])
            addAuthDivKey()
            break
          case 1:
            pubKeySign.push(publicKey[indexToAdd])
            addSignDivKey()
            break
          case 2:
            pubKeyEncrypt.push(publicKey[indexToAdd])
            addEncryptDivKey()
            break
          default:
            break
        }
        enableAllStateButtons()
        resolve({ status: 1 })
      }
      if (x.status !== 1 && x.status !== -2.04) {
        initPopUp('There was an error [' + x.status + '], please try again')
        closePopUp()
        bkg('END NOK: ' + x.status)
        enableAllStateButtons()
        resolve({ status: 0 })
      }
    } else {
      //max keys reached
      initPopUp('Max keys reached. To add new keys you have to remove some')
      closePopUp()
      enableAllStateButtons()
      resolve({ status: -1002 })
    }
  }).catch((error) => {
    bkg('Err')
    bkg(error)
    initPopUp('There was an error 1, please try again')
    closePopUp()
    enableAllStateButtons()
    resolve({ status: -1001 })
  })
}
async function addKeyCore(id, purp) {
  return new Promise(async function (resolve, reject) {
    let key = publicKey[id]
    //let key = generatePublicKeyTest()
    //key = key.toString('hex')
    bkg('PublickKey: ' + key + ', purp: ' + purp)
    let x = await server.addKey(activeDID, key, purp)
    bkg(x)
    resolve(x)
  }).catch((error) => {
    bkg('Err')
    bkg(error)
    resolve({ status: -101 })
  })
}

function removeKey(buttonName) {
  document.getElementById(buttonName).onclick = async function () {
    document.getElementById(buttonName).disabled = true
    disableAllStateButtons()
    let rowName = getkeyRowName(buttonName)
    let key = keyDict[rowName]
    let keyIndexVar = keyIndex[key]
    bkg(buttonName + ' ' + rowName + ' ' + key + ' ' + keyIndexVar)
    await removeKeyWrrapper(keyIndexVar, rowName, buttonName)
  }
}

function chooseKey(buttonName) {
  document.getElementById(buttonName).onclick = async function () {
    let rowName = getkeyRowName(buttonName)
    let key = keyDict[rowName]
    if (rowName.charAt(0) === 's') {
      activeSignKey = key
    } else if (rowName.charAt(0) === 'a') {
      activeAuthKey = key
    } else if (rowName.charAt(0) === 'e') {
      activeEncryptKey = key
    }
  }
}

//
// (1) The Did document has the index as +1. So in the backend server we place a -1 to remove key from the index
// (2) When we remove the key from the DID doc, the upper index keys do not change the key index on the same order,
//     therefore after each succesfull removal we make a reload page
// (3) The reload page to obtain the DID document (the truth) has to be done when the blockchain has confirmed the transaction,
//     for now we use ganache on auto minning, so the async time is short. However, it would be longer once we test with a real Testnet
// (4) To avoid erratic behaviour, the user action when removing keys are frozen until the transaction is confirmed by the blockchain
//
function removeKeyWrrapper(keyIndexVar, rowName, buttonName) {
  return new Promise(async function (resolve, reject) {
    initPopUp('Loading... ')
    let x = await removeKeyCore(keyIndexVar)
    if (x.status === 1) {
      /*document.getElementById(rowName).style.display = 'none'
      document.getElementById(buttonName).disabled = false
      var elem = document.getElementById(rowName);
      elem.parentNode.removeChild(elem);
      updateKeyDictIndex(keyIndexVar)
      initPopUp('Key removed correctly')
      closePopUp() */
      window.location.reload(true)
    } else {
      initPopUp('Error [' + x.status + ']. Pleast try again')
      enableAllStateButtons()
      closePopUp()
      resolve(x)
    }
  }).catch((error) => {
    bkg('Err')
    bkg(error)
    document.getElementById(buttonName).disabled = false
    enableAllStateButtons()
    initPopUp('Error removing key')
    closePopUp()
    resolve({ status: -101 })
  })
}

function removeKeyCore(keyIndexVar) {
  return new Promise(async function (resolve, reject) {
    let x = await server.removeKey(activeDID, keyIndexVar)
    resolve(x)
  }).catch((error) => {
    bkg('Err')
    bkg(error)
    resolve({ status: -101 })
  })
}

//function to update our object index variable variable
function updateKeyDictIndex(removedIndex) {
  let auxArr = Object.keys(keyIndex)
  for (var i = 0; i < auxArr.length; i++) {
    let key = keyIndex[auxArr[i]]
    if (key > removedIndex) {
      keyIndex[auxArr[i]] = key - 1
    }
    if (key === removedIndex) {
      delete keyIndex[auxArr[i]]
    }
  }
}

function disableAllRemoveKey() {}

function enableAllRemoveKey() {}

//obtain the name of the row that is mapped towards the publicKey
function getkeyRowName(button) {
  let name = button.split('_')
  if (name[0].indexOf('Auth') !== -1) {
    return 'authObj_' + name[1]
  }
  if (name[0].indexOf('Sign') !== -1) {
    return 'signObj_' + name[1]
  }
  if (name[0].indexOf('Encrypt') !== -1) {
    return 'encryptObj_' + name[1]
  }

  if (name[0].indexOf('auth') !== -1) {
    return 'authObj_' + name[1]
  }
  if (name[0].indexOf('sign') !== -1) {
    return 'signObj_' + name[1]
  }
  if (name[0].indexOf('encrypt') !== -1) {
    return 'encryptObj_' + name[1]
  }
}

function copyAddressToClipBoard() {
  var dummy = document.createElement('textarea')
  document.body.appendChild(dummy)
  dummy.value = activeDID.toUpperCase()
  dummy.select()
  dummy.setSelectionRange(0, 99999) //For mobilephones (check notes)
  document.execCommand('copy')
  alert('Account 1 to clipboard: ' + dummy.value)
  document.body.removeChild(dummy)
}

// auxiliar func to printout all the childs IDs
function auxNameID() {
  var children = document.getElementById('authSection').children // authObj_  authSection
  var idArr = []
  for (var i = 0; i < children.length; i++) {
    idArr.push(children[i].id)
  }
  bkg(idArr)
}

function auxButtonTest() {
  document.getElementById('auxFunction').onclick = async function () {
    bkg(keyIndex)
  }
}

async function signMain() {
  document.getElementById('homeSectionSubHeader').style.display = 'none'
  document.getElementById('chooseKeyAuxTitle').style.display = 'block'

  document.getElementById('authenticateKeysBox').style.display = 'none'
  document.getElementById('signKeysBox').style.display = 'block'
  document.getElementById('encryptKeysBox').style.display = 'none'

  document.getElementById('processMessage').style.display = 'block'

  let x = await getMessageToSign()
  document.getElementById('messageOrigin').innerHTML = x.response.site
  document.getElementById('messageContentTitle').innerHTML = 'Message: '
  document.getElementById('messageContent').innerHTML = x.response.message
  document.getElementById('signMessageButtonMain').innerHTML = 'SIGN'
}

function processRequest() {
  document.getElementById('signMessageButtonMain').onclick = async function () {
    document.getElementById('signMessageButtonMain').disabled = true
    if (activeSignKey !== NAN) {
      let x = await blockchain.initDidSigner(activeSignKey)
      if (x.status === 1) {
        let y = await signMessage(
          document.getElementById('messageContent').innerHTML,
        )
        if (y.status === 1) {
          await sendRawAndSignMessageToActiveTab(y.signedMessage)
          await resetSignMessage()
          window.close()
        } else {
          initPopUp('Error while signing the message')
          closePopUp()
          document.getElementById('signMessageButtonMain').disabled = false
        }
      } else {
        initPopUp('Error while initializing the wallet signer: ' + x.status)
        closePopUp()
        document.getElementById('signMessageButtonMain').disabled = false
      }
    } else {
      initPopUp('Choose a key to use')
      closePopUp()
      document.getElementById('signMessageButtonMain').disabled = false
    }
  }
}

function cancelRequest() {
  document.getElementById(
    'cancelMessageButtonMain',
  ).onclick = async function () {
    document.getElementById('cancelMessageButtonMain').disabled = false
    await resetSignMessage()
    await sendCancelSignToActiveTab()
    window.close()
  }
}

function requestToAddWebsite(origin) {
  bkg(origin)
  chrome.permissions.request(
    {
      /*permissions: ['host_permissions'],*/
      origins: [origin],
    },
    function (granted) {
      // The callback argument will be true if the user granted the permissions.
      if (granted) {
        auxiliarPullMessage()
      } else {
        sendCancelAccessToActiveTab()
      }
      document.getElementById('websiteStatusID').disabled = false
    },
  )
}

function requestToRemoveWebsite(origin) {
  bkg('Request: ' + origin)
  chrome.permissions.remove(
    {
      /*permissions: ['host_permissions'],*/
      origins: [origin],
    },
    function (granted) {
      if (granted) {
        // NaN
        bkg('removed')
        document.getElementById('websiteStatusID').disabled = false
      } else {
        // NaN
        bkg('not removed')
        document.getElementById('websiteStatusID').disabled = false
      }
    },
  )
}

async function auxiliarPullMessage() {
  //pull message from content
  await pullMessageFromContent()
  checkSignMessageIsWaiting()
}
