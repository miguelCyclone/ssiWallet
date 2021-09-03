//
// Script to call the server for the users that decide to go through a centralized port
//

// Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)

import constants from '../configurations/constants.js'
import miscImp from './misc.js' //import miscelanous functions
import blockchain from './didLib.aux.js' //import miscelanous functions

var bkg = miscImp.bkg
var signMessage = blockchain.signeMessage

const urlMain = constants.server + '/did/'

// body is the variable that swe send in the body of the fetch
async function signMessageToVerify(body){
  let b = JSON.stringify(body)
  b = await signMessage(b)
  return {rawMessage: b.rawMessage, signedMessage:b.signedMessage}
}

function errObj(err){
  return {"status": -15, "err":err}
}

async function createDid(didAddress) {
  let verifyMessage = await signMessageToVerify({ did: didAddress})
  const url = urlMain + 'createDid'
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify({verifyMessage}),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((resp) => resp.json())
    .then(function (data) {
      var obj = JSON.parse(data.msg)
      obj = obj.msg
      return obj
    })
    .catch((error) => {
      bkg('Err')
      bkg(error)
      return errObj(error);
    })
}

function getDIDDocument(didAddress) {
  let myMethod = 'did:signor:mainet:' + didAddress
  const url = urlMain + 'getDIDDocument'
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify({ didMethod: myMethod }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((resp) => resp.json())
    .then(function (data) {
      var obj = JSON.parse(data.msg)
      obj = obj.msg
      return obj
    })
    .catch((error) => {
      bkg(error)
      return errObj(error);
    })
}

function getController(didAddress) {
  const url = urlMain + 'getController'
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify({ did: didAddress }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((resp) => resp.json())
    .then(function (data) {
      var obj = JSON.parse(data.msg)
      obj = obj.msg
      bkg(obj)
    })
    .catch((error) => {
      bkg('Err')
      bkg(error)
      return errObj(error);
    })
}

async function addKey(didAddress, keyVar, purpVar) {
  let verifyMessage = await signMessageToVerify({ did: didAddress, key: keyVar, purp: purpVar})
  const url = urlMain + 'addKey'
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify({verifyMessage}),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((resp) => resp.json())
    .then(function (data) {
      var obj = JSON.parse(data.msg)
      obj = obj.msg
      return obj;
    })
    .catch((error) => {
      bkg('Err')
      bkg(error)
      return errObj(error);
    })
}

async function removeKey(didAddress, indexVar) {
  let verifyMessage = await signMessageToVerify({did: didAddress, index: indexVar})
  const url = urlMain + 'removeKey'
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify({verifyMessage}),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((resp) => resp.json())
    .then(function (data) {
      var obj = JSON.parse(data.msg)
      obj = obj.msg
      return obj
    })
    .catch((error) => {
      bkg('Err')
      bkg(error)
      return errObj(error);
    })
}

export default {
  createDid,
  getController,
  addKey,
  getDIDDocument,
  removeKey
}