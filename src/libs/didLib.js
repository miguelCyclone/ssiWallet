//
// This is the decentralized library for the decentralized users
// This library interacts witht he blockcahin through ethersJs
// Code is not shared
//

// Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)


import '../../bundles/ethersJs.js' //bundle from ethersJs
import '../../bundles/bundleEcrypto.js' //bundle from eccrypto
import '../../bundles/bundleBuffer.js' //bundle from buffer
import miscImp from './misc.js' //import miscelanous functions
import DIDAbi from '../configurations/didRegistryAbi.js'
import constants from '../configurations/constants.js'

var bkg = miscImp.bkg

const ethersJS = ethers.ethers
const ec = ecc.eccrypto
const buffer = buf.Buffer

let provider = null
let wallet = null
let contract = null
