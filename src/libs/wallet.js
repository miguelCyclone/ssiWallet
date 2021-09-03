//
// Script to produce the user wallet, derive the public keys from the private keys and eccrypto, and to save the data encrypted locally
//

// Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)

import '../../bundles/bundleBip39.js' //bundle bip
import '../../bundles/bundleELW.js' //bundle eth light wallet
import '../../bundles/bundlecrypt.js' //bunde to cipher
import '../../bundles/bundleEcrypto.js' //bundle from eccrypto
import '../../bundles/bundleBuffer.js' //bundle from buffer
import miscImp from './misc.js' //import miscelanous functions

const maxKeys = 32 //Smart contract requirement

var bkg = miscImp.bkg
var updateSession = miscImp.updateSession
var setPassword = miscImp.setPassword
var setBlockchainObject = miscImp.setBlockchainObject
const ec = ecc.eccrypto
const buffer = buf.Buffer

//eth wallet is the standalone name, and lightwallet is the output funciton that contains the npm ethlightwallet package that got browersify
const ethLW = ethWallet.lightwallet

//bundel to cipher and decipher
const ciph = crypt.CryptoJS

function convertKeyStringtoByteArr(keyString){
  return buffer.from(keyString, 'hex')  
}

//function create seedPhrase mnemotic
function createSeedPhrase() {
  //let seedPhrase.words = bip.outValues();
  //Math.random().toString() to generate extra entropy
  let seedPhrase = ethLW.keystore.generateRandomSeed(Math.random().toString())
  bkg("My phrase: "+seedPhrase)
  return seedPhrase
}

function stringIsMnemonic(seed){
  return ethLW.keystore.isSeedValid(seed)
}

//The createWallet is called after the user has succesfully verififed the seed words //
function createWalletCore(passwordVal, seedPhraseVal) {
  return new Promise(function (resolve, reject) {
    let flag = { status: 0 }
    ethLW.keystore.createVault(
      {
        password: passwordVal,
        seedPhrase: seedPhraseVal,
        hdPathString:
          "m/0'/0'/0'" /*bitcoin main: m / 44' / 0' / 0' / 0 / 0  */ /*ethereumLW:  m/0'/0'/0'*/,
      },
      function (err, ks) {
        if (err) {
          resolve({ err, flag })
        }
        ks.keyFromPassword(passwordVal, async function (err, pwDerivedKey) {
          if (err) {
            resolve({ err, flag })
          }
          if (!ks.isDerivedKeyCorrect(pwDerivedKey)) {
            resolve({ err:'Incorrect derived key!', flag })
          }
          try {
            ks.generateNewAddress(pwDerivedKey, maxKeys) //generate maxKeys initial ethereum addresses
          } catch (err) {
            bkg(err)
            resolve({ err, flag })
          }
          var address = []
          var prv_key = []
          var pbc_key = []

          let i = 0
          for (i = 0; i < maxKeys; i++) {
            let addressString = ks.getAddresses()[i]
            let privateString = ks.exportPrivateKey(addressString, pwDerivedKey)
            let keyBuf = buffer.from(privateString, 'hex') // convert privatekey to byte34 arr
            let publicKey = ec.getPublic(keyBuf) // obtain public key in byte65
            publicKey = publicKey.toString('hex') // convert public key from byte65 to string
            address.push(addressString)
            prv_key.push(privateString)
            pbc_key.push(publicKey)
          }

          var arrObj = { address: address, prv_key: prv_key, pbc_key: pbc_key }

          flag = { status: 1, arrObj: arrObj }
          resolve({ flag })
        })
      },
    )
  })
}

//
//  After the creation of the wallet we store the values ENCRYPTED in local storage
//
async function createLocalData(
  seed,
  pwd,
  address,
  adressPrivateKey,
  addressPublicKey,
  blockchainName,
  network,
  id,
  decentrlizedSigner
) {
  let a = 0 // flag
  const blockchainData = {
    blockchainName: blockchainName,
    network: network,
    id: id,
    address: address,
    adressPrivateKey: adressPrivateKey,
    addressPublicKey: addressPublicKey,
    decentrlizedSigner:decentrlizedSigner
  }
  let blockchainMain = [] //init arr, we are on "create" not update
  blockchainMain.push(blockchainData)
  let seedPhrase = seed
  const data = { vault: 'ok', blockchainMain, seedPhrase }
  // Encrypt
  try {
    const ciphertext = ciph.AES.encrypt(JSON.stringify(data), pwd).toString()
    return new Promise(async function (resolve, reject) {
      await chrome.storage.local.set({ vault: ciphertext }, function () {
        a = 1
        resolve({ a })
      }) // chrome local ends
    }).catch((error) => {
      //general promise failed
      bkg('Err')
      bkg(error)
      resolve({ a })
    })
  } catch {
    //cipherText failed o.O
    return a
  }
}

//
//async behaviour
//
async function initVerifiedUserBackend(pwd, address, publicKey, id) {
  let a = await updateSession(true)
  let b = await setPassword(pwd)
  let c = await setBlockchainObject(address, publicKey, id)
  return 1
  /*if(){
    return 1;
  }else{
    return 0;
  }*/
}

//wrapper function
async function createWallet(
  passwordVal,
  seedPhraseVal,
  blockchainName,
  network,
  id,
) {
  let x = await createWalletCore(passwordVal, seedPhraseVal)
  if (x.flag.status === 1) {
    let addressArr = x.flag.arrObj.address
    let publicArr = x.flag.arrObj.pbc_key
    let privateArr = x.flag.arrObj.prv_key
    
    //
    // init decentralized signer with the first account
    // CHECK!
    // We have to move this init, to the moment when the user decides to change to decentralized, other wise, whenever the user creates a wallet,
    // the signer wallet is overrided to the default address of the user (Ethereum account idx 0). This may or not be what the suer wants
    // END CHECK
    //
    let decentrlizedSigner = {
      address: addressArr[0],
      publicKey: publicArr[0],
      privateKey: privateArr[0],
      blockchainName:"Ethereum",
      network: "LocalNet",
      id: 0
    }
    let y = await createLocalData(
      seedPhraseVal,
      passwordVal,
      addressArr,
      privateArr,
      publicArr,
      blockchainName,
      network,
      id,
      decentrlizedSigner,
    )
    let z = await initVerifiedUserBackend(
      passwordVal,
      addressArr,
      publicArr,
      id,
    )
    if (y.a === 1 && z === 1) {
      return 1
    } else {
      return 0
    }
  } else {
    return 0
  }
}

//
// decipher the storage
//
async function openVaultCore(pwd) {
  let vault = 'NOK'
  return new Promise(async function (resolve, reject) {
    await chrome.storage.local.get('vault', async function (data) {
      if (data.vault.length > 1) {
        const bytes = ciph.AES.decrypt(data.vault, pwd)
        try {
          const decryptedData = JSON.parse(bytes.toString(ciph.enc.Utf8))
          if (decryptedData.vault === 'ok') {
            resolve(decryptedData)
          } else {
            //pwd did not decrypt (it should be rejected on the catch statement)
            resolve({ vault })
          }
        } catch (e) {
          //Wrong cipher
          resolve({ vault })
        }
      } else {
        //ERROR - it shouold not be empty, we already verify this in the previous step
        resolve({ vault })
      }
    }) //chrome local ends
  }).catch((error) => {
    //general promise failed
    bkg('Err')
    bkg(error)
    resolve({ vault })
  })
}

async function openVault(pwd, id) {
  let x = await openVaultCore(pwd)
  if (x.vault === 'ok') {
    //bkg('MY OPEN VAULT DATA')
    bkg(x)
    let data = x.blockchainMain[id]
    let addresArr = data.address
    let publicKey = data.addressPublicKey
    let privateKey = data.adressPrivateKey
    let decentrlizedSigner = data.decentrlizedSigner
    let y = await initVerifiedUserBackend(pwd, addresArr, publicKey, id)
    if (y === 1) {
      return { status: 1, addresArr, publicKey, privateKey, decentrlizedSigner }
    } else {
      // some error
      return { status: 0.1 }
    }
  } else {
    // some error or wrong password
    return { status: 0.2 }
  }
}

export default {
  openVault,
  createSeedPhrase,
  createWallet,
  stringIsMnemonic,
  convertKeyStringtoByteArr
}