//
// This script is a higher abstraction level to call the the didLib functions
// They are enclosed on promises, and nested functions to core functionalities 
//

// Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)


import did from './didLib.js' //import web3 functions
import '../../bundles/ethersJs.js' //bundle from ethersJs
import miscImp from './misc.js' //import miscelanous functions
import walletImp from './wallet.js'

var bkg = miscImp.bkg
var getPassword = miscImp.getPassword
var openVault = walletImp.openVault

let keyPurpose = did.KeyPurpose

const ethersJS = ethers.ethers

//send a sing random message to be verifies on the backend to check that the user is this one
async function signeMessage(rawMessage) {
  return new Promise(async function (resolve, reject) {
    let signedMessage = await did.wallet.signMessage(rawMessage)
    resolve({ status: 1 , rawMessage, signedMessage})
  }).catch((error) => {
    resolve({ status: -1})
  })
}

//async behaviour
async function initDidSigner(flagKey) {
  return new Promise(async function (resolve, reject) {
    let x = await getPassword()
    if (x.response.length > 0) {
      let pwd = x.response
      return openVault(pwd, 0) // init backend vualt with data from id zero: Eth Local net
        .then((a) => {
          if (a.status === 1) {
            let key = null
            if(flagKey === 'NaN'){
              key = a.decentrlizedSigner.privateKey
            }else{
              let idx = a.publicKey.indexOf(flagKey.toLowerCase())
              if(idx !== -1){
                key = a.privateKey[idx]
              }
            }
            bkg('KEY: '+key)
            if(key !== null){
              did.init(key)
              resolve({ status: 1 })
            }else{
              resolve({ status: -121.4 })
            }            
          } else {
            // user is already verified, this should not happen
            resolve({ status: -121.3 })
          }
        })
        .catch((error) => {
          // unexpected error...
          bkg('ERROR')
          bkg(error)
          resolve({ status: -121.2, err: error })
        })
    } else {
      resolve({ status: -121.1 })
    }
  }).catch((error) => {
    resolve({ status: -121, err: error })
  })
}

function createDID(address) {
  return new Promise(function (resolve, reject) {
    return getController(address) //check if did already exists
      .then((rGetCont) => {
        bkg('My answer!: ')
        bkg(rGetCont)
        if (rGetCont.status === 0) {
          return createDIDcore(address)
            .then((rCreateDid) => {
              resolve({ status: rCreateDid.status })
            })
            .catch((error) => {
              bkg('Why am I here!!!!')
              resolve({ status: -2.2 })
            })
        } else {
          //there was an error or DID already exists
          resolve({ status: -2.1 })
        }
      })
      .catch((error) => {
        resolve({ status: -2 })
      })
  })
}

function createDIDcore(address) {
  return new Promise(function (resolve, reject) {
    return did
      .createDID(address)
      .then((rCreateDid) => {
        let st = rCreateDid.status
        resolve({ status: st })
      })
      .catch((error) => {
        resolve({ status: -2.22 })
      })
  })
}

function getDIDDocument(didMethod) {
  let didArray = didMethod.split(':')
  let id = didArray[3]
  return new Promise(function (resolve, reject) {
    return getController(id) //check if did already exists
      .then((rGetCont) => {
        if (rGetCont.status === 1) {
          return did
            .getDIDDocument(didMethod)
            .then((rDidDoc) => {
              resolve({ status: 1, didDoc: rDidDoc })
            })
            .catch((error) => {
              bkg('ERROR -1.2', error)
              resolve({ status: -1.2 })
            })
        } else {
          // Did does not exists, or value passed to server was not an address
          resolve({ status: -1.1 })
        }
      })
      .catch((error) => {
        bkg('ERROR -1.0', error)
        resolve({ status: -1.0 })
      })
  })
}

function removeKey(address, index) {
  return new Promise(function (resolve, reject) {
    return getController(address) //check if did already exists
      .then((rGetCont) => {
        if (rGetCont.status === 1) {
          return removeKeyCore(address, index)
            .then((rCreateDid) => {
              resolve({ status: rCreateDid.status })
            })
            .catch((error) => {
              resolve({ status: -3.2 })
            })
        } else {
          //there was an error or DID DOES not exist
          resolve({ status: -3.1 })
        }
      })
      .catch((error) => {
        resolve({ status: -3 })
      })
  })
}

function removeKeyCore(address, index) {
  return new Promise(function (resolve, reject) {
    return did
      .removeKey(address, index)
      .then((rRemoveKey) => {
        bkg(rRemoveKey)
        resolve({ status: 1 })
      })
      .catch((error) => {
        bkg('ERROR!!!!', error)
        resolve({ status: -3.3 })
      })
  })
}

function getController(address) {
  return new Promise(function (resolve, reject) {
    let addressOK = checkAddress(address)
    if (addressOK === true) {
      return did
        .getController(address)
        .then((rGetCont) => {
          bkg('IM IN')
          if (
            rGetCont.controller === '0x0000000000000000000000000000000000000000'
          ) {
            resolve({ status: 0 }) //did has no controller
          }
          if (
            rGetCont.controller !=
              '0x0000000000000000000000000000000000000000' &&
            checkAddress(rGetCont.controller) === true
          ) {
            resolve({ status: 1, controller: rGetCont.controller })
          }
        })
        .catch((error) => {
          bkg('ERROR -1.22')
          bkg(error)
          resolve({ status: -1.22 })
        })
    } else {
      resolve({ status: -1.11 })
    }
  })
}

function addKey(address, key, purp) {
  return new Promise(function (resolve, reject) {
    return getController(address) //check if did already exists
      .then((rGetCont) => {
        if (rGetCont.status === 1) {
          //did exists we proceed to check if key format is correct
          if (checkPublicKey(key) === true) {
            //key is publicKey format, we proceed to check if it has already been added
            return getKeys(address)
              .then((rgetKeys) => {
                if (checkKeyAlreadyExist(key, rgetKeys.pubKeys) === false) {
                  //key has not been added for this DID, we proceed with addkeyCore
                  return addKeyCore(address, key, purp)
                    .then((rgetKeys) => {
                      if (rgetKeys.status === 1) {
                        resolve({ status: 1 })
                      } else {
                        //not enough gas, keymax reached, no controller, etc errors
                        resolve({ status: -2.6 })
                      }
                    })
                    .catch((error) => {
                      bkg(error)
                      resolve({ status: -2.5 })
                    })
                } else {
                  //key has already been added
                  resolve({ status: -2.4 })
                }
              })
              .catch((error) => {
                bkg(error)
                resolve({ status: -2.3 })
              })
          } else {
            //key is not a publickey
            resolve({ status: -2.2 })
          }
        } else {
          //there was an error or DID does not exist
          resolve({ status: -2.1 })
        }
      })
      .catch((error) => {
        resolve({ status: -22 })
      })
  })
}

function addKeyCore(address, key, purp) {
  return new Promise(function (resolve, reject) {
    return did
      .addKey(address, key, purp)
      .then((rAddKey) => {
        resolve({ status: 1 })
      })
      .catch((error) => {
        bkg('ERROR', error)
        resolve({ status: -4.0 })
      })
  })
}

function checkPublicKey(key) {
  //if string can generate an address, string is a public key
  try {
    let address = ethersJS.utils.computeAddress(key)
    let x = checkAddress(address)
    return x
  } catch {
    return false
  }
}

function getKeys(address) {
  return new Promise(function (resolve, reject) {
    let addressOK = checkAddress(address)
    if (addressOK === true) {
      return getKeysCore(address)
        .then((rGetKeys) => {
          let keys = rGetKeys.rGetKeys
          pubKeys = []
          for (let i = 0; i < keys.length; i++) {
            let pem = '0x' + keys[i][0].toString('hex')
            pubKeys.push(pem)
          }
          resolve({ pubKeys })
        })
        .catch((error) => {
          bkg(error)
          resolve({ status: -3.2 })
        })
    } else {
      resolve({ status: -3.3 })
    }
  })
}

function getKeysCore(address) {
  return new Promise(function (resolve, reject) {
    return did
      .getKeys(address)
      .then((rGetKeys) => {
        resolve({ rGetKeys })
      })
      .catch((error) => {
        resolve({ status: -2.022 })
      })
  })
}

function checkAddress(address) {
  if (typeof address === 'string') {
    return ethersJS.utils.isAddress(address)
  } else {
    return false
  }
}

async function checkNetCore() {
  return new Promise(async function (resolve, reject) {
    return did.provider
      .getBlock(5)
      .then((r) => {
        if (r.timestamp > 1000) {
          resolve(1)
        } else {
          resolve(-1.001)
        }
      })
      .catch((error) => {
        resolve(-1.002)
      })
  }).catch((error) => {
    resolve(-1.003)
  })
}

function checkNet() {
  return checkNetCore()
    .then((r) => {
      return r
    })
    .catch((error) => {
      return 0
    })
}

function checkKeyAlreadyExist(key, keyArr) {
  key = '0x' + key.toString('hex')
  var keyExist = keyArr.includes(key)
  var keyExist = keyArr.includes(key)
  return keyExist
}

function returnNoNetAux(res) {
  let msg = { status: -200 }
  msg = JSON.stringify({ msg })
  return res.status(200).send({ msg })
}

function returnCatchErr(res) {
  let msg = { status: -100 }
  msg = JSON.stringify({ msg })
  return res.status(200).send({ msg })
}

export default {
  getController,
  createDID,
  checkAddress,
  checkNet,
  returnNoNetAux,
  returnCatchErr,
  addKey,
  getKeys,
  getDIDDocument,
  removeKey,
  initDidSigner,
  signeMessage,
  keyPurpose,
}
