//
// Initial Main script
//

// Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)

import miscImp from './src/libs/misc.js' //import miscelanous functions
import walletImp from './src/libs/wallet.js' //import miscelanous functions

//
//globalVariables
//

var bkg = miscImp.bkg
var shuffle = miscImp.shuffle
var spinLogo = miscImp.spinLogo
var getSession = miscImp.getSession

var openVault = walletImp.openVault
var createSeedPhrase = walletImp.createSeedPhrase
var createWallet = walletImp.createWallet  
var stringIsMnemonic = walletImp.stringIsMnemonic

let seedPhraseOk
let passwordOk

//functions are called inside the event listener, to prevent calls prior loading
window.addEventListener('load', function load(event) {
  bkg(
    ' *******************************  START  ******************************* ',
  )
  //init the page, sections to display
  init()
})

//
// functions
//
async function init() {
  //get session status, user is identified already or not
  let x = await getSession()
  if (x === false) {
    //dropdown menu show/hide
    displayNetList()

    // Close the dropdown if the user clicks outside of it
    closeNetList()

    //selectuserFlow
    userStatus()

    //spin logo for fun
    spinLogo()
  } else {
    //user is already identified, proceed to home page
    window.location.href = './src/libs/views/home/home.html' // go to other view
  }
}

//check if user is onboarding or if already has a stored seed
function userStatus() {
  //we start from a known state
  collapseAllSections()

  chrome.storage.local.get('vault', function (data) {
    if (data.vault != undefined && data.vault.length > 1) {
      identifyUser()
    } else {
      welcome()
    }
  }) //
}

function welcome() {
  document.getElementById('welcomeSection').style.display = 'block'
  document.getElementById('confirmTerms').checked = false
  document.getElementById('verifySeedPhrase').innerHTML = ''
  document.getElementById('showSeedPhrase').innerHTML = ''

  goToNewToCryptonicsSection()
}

function identifyUser() {
  sectionSelection(6)
  document.getElementById('pwdIdentifySection').focus()
}

//dropdown for the network
function displayNetList() {
  document.getElementById('dropDownNet').onclick = function () {
    var div = document.getElementById('myDropdownNet')
    if (div.style.display === 'block') {
      div.style.display = 'none'
    } else {
      div.style.display = 'block'
    }
  }
}
//this will close the list if the user clicks outside
function closeNetList() {
  window.onclick = function (event) {
    if (!event.target.matches('.dropbtn')) {
      var div = document.getElementById('myDropdownNet')
      div.style.display = 'none'
    }
  }
}

//change state functions

//this is used to collapse all the sections
function collapseAllSections() {
  document.getElementById('welcomeSection').style.display = 'none'
  document.getElementById('newToCryptonics').style.display = 'none'
  document.getElementById('createPasswordSection').style.display = 'none'
  document.getElementById('phraseCreationSection').style.display = 'none'
  document.getElementById('confirmPhraseSection').style.display = 'none'
  document.getElementById('congratulationsSection').style.display = 'none'
  document.getElementById('homeSectionHeader').style.display = 'none'
  document.getElementById('homeSectionBody').style.display = 'none'
  document.getElementById('identifyUser').style.display = 'none'
  document.getElementById('recoverWallet').style.display = 'none'
}

//one switch to change among divs
function sectionSelection(section) {
  collapseAllSections() //first collapse all, we init from a known state
  switch (section) {
    //goTo newToCryptonics selection
    case 0:
      //For Testing implementation uncomment
      //document.getElementById( 'homeSectionHeader' ).style.display = "block";
      //showPartialAddressString();

      //Start onboarding flow
      document.getElementById('newToCryptonics').style.display = 'block'

      //function to reccover account selection
      recoverAccount()

      //initialize
      goTocreatePasswordSection()

      break

    //goTo createPassword
    case 1:
      document.getElementById('createPasswordSection').style.display = 'block'

      //initialize
      createPassword()
      break

    //goTo seeCreatedSecretPhrase
    case 2:
      document.getElementById('phraseCreationSection').style.display = 'block'

      //initialize
      goToVerifySeedSection()
      break

    //goTo verifySeedSection
    case 3:
      document.getElementById('confirmPhraseSection').style.display = 'block'

      //initialize
      backToSeeSeedPhrase()
      verifySeedString()
      break

    //goTo endSection
    case 4:
      document.getElementById('congratulationsSection').style.display = 'block'

      //initialize
      goToHomeMainSection()
      break

    //goTo homeMainSection
    case 5:
      window.location.href = './src/libs/views/home/home.html' // go to other view
      break

    //goTo identifyUser - Welcome back section
    case 6:
      document.getElementById('identifyUser').style.display = 'block'

      //initialize
      recoverAccount()
      verifyUser()

      break

    //goTo recovery wallet
    case 7:
      document.getElementById('recoverWallet').style.display = 'block'
      document.getElementById('seedPhraseRecovery').focus()
      break

    //defaul section TBD
    default:
      defaultSection()
      break
  }
}

function defaultSection() {
  document.getElementById('welcomeSection').style.display = 'block'
}

function goToNewToCryptonicsSection() {
  document.getElementById('toWelcomeSection').onclick = function () {
    sectionSelection(0)
  }
}

function goTocreatePasswordSection() {
  document.getElementById('createWallet').onclick = function () {
    sectionSelection(1)
  }
}

function goToVerifySeedSection() {
  document.getElementById('walletCreateNext').onclick = function () {
    //go to verify section
    sectionSelection(3)
  }
}

function backToSeeSeedPhrase() {
  document.getElementById('backToSeeSeedPhrase').onclick = function () {
    sectionSelection(2)
  }
}

function goToHomeMainSection() {
  document.getElementById('endOnboardingButton').onclick = function () {
    coreGoToHomer()
  }
}

function coreGoToHomer() {
  sectionSelection(5)
}

//CreatePassword
// verifies the minimum req for the password
// calls the create seed function
// goes to the see seed phrase section
function createPassword() {
  document.getElementById('createPasswordButton').onclick = function () {
    document.getElementById('createPasswordError').style.display = 'none'

    let a = document.getElementById('pwd').value
    let b = document.getElementById('pwdConfirm').value
    if (document.getElementById('confirmTerms').checked === true) {
      if (
        a ==
        b /*&& a.length >= 8 && b.length>= 8 && a.length <=100 && b.length <= 100*/
      ) {
        createSeedPhraseMain()
        sectionSelection(2)

        //init buttons labels
        prepareButtonLabels()

        //savePasswordValue in variable for wallet
        passwordOk = a
      } else {
        document.getElementById('createPasswordError').innerHTML =
          'Verify that the password is more than 8 characteres and minor than 100 characters. Both password fields have to be the same'
        document.getElementById('createPasswordError').style.display = 'block'
      }
    } else {
      document.getElementById('createPasswordError').innerHTML =
        'To continue read and accept the Terms of Use'
      document.getElementById('createPasswordError').style.display = 'block'
    }
  }
}

//function create seedPhrase mnemotic
function createSeedPhraseMain() {
  document.getElementById('showSeedPhrase').innerHTML = createSeedPhrase()
}

//verify seed section

//prepare the word list to be selected
function prepareButtonLabels() {
  let seedPhrase = document.getElementById('showSeedPhrase').innerHTML
  let arrWords = seedPhrase.split(' ')

  //place the words in random orders jh
  arrWords = shuffle(arrWords)

  //add word to the button
  //idx matches witht the button id
  //init the word button onclick function
  var i
  for (i = 0; i < arrWords.length; i++) {
    let idx = i + 1
    let buttonVar = 'word' + idx
    addWordtoVerifyBox(buttonVar, arrWords[i])
  }
}

//init specific word button
function addWordtoVerifyBox(buttonVar, label) {
  //change button label value
  document.getElementById(buttonVar).innerHTML = label

  //onlick button funciton
  document.getElementById(buttonVar).onclick = function () {
    let str = document.getElementById('verifySeedPhrase').innerHTML
    let arrWords = str.split(' ')

    //add or remove word and visual style
    addRemoveWord(label, buttonVar)
  }
}

//funciton to add a word if it hasnt been added, and to remove it, if it has already been added
function addRemoveWord(word, buttonVar) {
  let str = document.getElementById('verifySeedPhrase').innerHTML
  let arrWords = str.split(' ')

  let key = 0
  let idx = 0

  //remove word from list if it exist
  var i = 0
  for (i = 0; i < arrWords.length; i++) {
    if (arrWords[i] === word) {
      key = 1
      idx = i
    }
  }

  // key===1 then REMOVE word, otherwise add
  if (key === 1) {
    //check if the length is one word, if so, we remove the whole string
    if (arrWords.length === 1) {
      document.getElementById('verifySeedPhrase').innerHTML = ''
    } else {
      //if it is the frist word, the blank goes after the word, otherwise, the blank goes before the word
      if (idx === 0) {
        document.getElementById('verifySeedPhrase').innerHTML = str.replace(
          word + ' ',
          '',
        )
      } else {
        document.getElementById('verifySeedPhrase').innerHTML = str.replace(
          ' ' + word,
          '',
        )
      }
    }
    document.getElementById(buttonVar).style.backgroundColor = 'Transparent'
    document.getElementById(buttonVar).style.color = '#6ec1e4'
    document.getElementById(buttonVar).style.borderColor = '#6ec1e4'
  } else {
    //check if it is the first word to add, if so, then we do not add an initial blank
    if (str.length < 1) {
      document.getElementById('verifySeedPhrase').innerHTML = word
    } else {
      document.getElementById('verifySeedPhrase').innerHTML = str + ' ' + word
    }
    document.getElementById(buttonVar).style.backgroundColor = 'black'
    document.getElementById(buttonVar).style.color = 'white'
    document.getElementById(buttonVar).style.borderColor = 'Transparent'
  }
}

//compares the text from the seed box, with the text that the user input via buttons
async function verifySeedString() {
  document.getElementById('confirmSeedButton').onclick = async function () {
    let seedA = document.getElementById('showSeedPhrase').innerHTML
    let seedB = document.getElementById('verifySeedPhrase').innerHTML
    document.getElementById('verifySeedError').style.display = 'none'

    // for testing to move fast among the user experience: seedA != seedB
    //CHANGE FOR seedA===seedB
    if (seedA != seedB) {
      seedPhraseOk = seedA
      let x = await createWallet(
        passwordOk,
        seedPhraseOk,
        'Ethereum',
        'LocalNet',
        0,
      )
      bkg('MY FLAG')
      bkg(x)
      if (x === 1) {
        sectionSelection(4)
      } else {
        //ERROR in create wallet
        document.getElementById('verifySeedError').innerHTML =
          'There has been an error while creating the wallet, please try again'
        document.getElementById('verifySeedError').style.display = 'block'
      }
    } else {
      //strings do not match to very mnemonic
      document.getElementById('verifySeedError').innerHTML =
        'Select in order all the words from your seed phrase'
      document.getElementById('verifySeedError').style.display = 'block'
    }
  }
}

//
// For the welcomeSection
//
async function verifyUser() {
  document.getElementById('unlockButtonIdentify').onclick = async function () {
    var pwd = document.getElementById('pwdIdentifySection').value
    return openVault(pwd, 0) // init backend vualt with data from id zero: Eth Local net
      .then((a) => {
        if (a.status === 1) {
          coreGoToHomer()
        } else {
          // user is not verified, or there was an error... nothing happens
        }
      })
      .catch((error) => {
        // unexpected error... nothing happens
        bkg(error)
      })
  }

  var input = document.getElementById('pwdIdentifySection')
  input.addEventListener('keyup', function (event) {
    if (event.keyCode === 13) {
      event.preventDefault()
      document.getElementById('unlockButtonIdentify').click()
    }
  })
}

//function to go to the recovery acocunt section
function recoverAccount() {
  document.getElementById('importWallet').onclick = function () {
    sectionSelection(7)
    goBackToNewToCryptonicsSelection()
    recoverAccountCreate()
  }
  document.getElementById('restoreWalletFromWelcome').addEventListener(
    'click',
    function () {
      sectionSelection(7)
      goBackToMainFromRestore()
      recoverAccountCreate()
    },
    false,
  )
}

function goBackToMainFromRestore() {
  document.getElementById('backToMain').onclick = function () {
    identifyUser()
  }
}

function goBackToNewToCryptonicsSelection() {
  document.getElementById('backToMain').onclick = function () {
    sectionSelection(0)
  }
}

function recoverAccountCreate(){
  document.getElementById('recoverWalletButton').onclick = function () {
    recoverAccountCore()    
  }
}

async function recoverAccountCore(){
  document.getElementById('recoverWalletError').style.display = 'none'
  let seed = document.getElementById('seedPhraseRecovery').value 
  seed = seed.replace(/\s\s+/g, ' '); //remove all double spaces
  seed = seed.trim(); //remove spaced at the beginning and end
  let isMnemonic = stringIsMnemonic(seed);
  if(isMnemonic === true){
    let a = document.getElementById('pwdRecovery').value 
    let b = document.getElementById('pwdRecoveryConfirm').value
    if (a === b && a.length >= 1 /*&& a.length >= 8 && b.length>= 8 && a.length <=100 && b.length <= 100*/) {
      let x = await createWallet(
        a,
        seed,
        'Ethereum',
        'LocalNet',
        0,
      )
    if (x === 1) {
      sectionSelection(4)  
    } else {
      //ERROR in create wallet
      document.getElementById('recoverWalletError').innerHTML =
        'There has been an error while creating the wallet, please try again'
      document.getElementById('recoverWalletError').style.display = 'block'
    }
  } else {
    //passwords do not match
    document.getElementById('recoverWalletError').innerHTML =
      'Passwords do not match or they are below the minimum length'
    document.getElementById('recoverWalletError').style.display = 'block'
  }
}else{
  //strings is not mnemonic
  document.getElementById('recoverWalletError').innerHTML =
  'The phrase you input does not match the format. Verify the words'
  document.getElementById('recoverWalletError').style.display = 'block'
  }
}
