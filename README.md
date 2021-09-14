# Plugin SSI wallet

# License
* Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)

This is an MvP SSI wallet. It is uploaded to GitHub for showcase and educational purposes.
It is not intended to be use under commercial activities, please read the license file.

# Goal
* Create an MvP for an SSI wallet that follows the W3 SSI standards

# NPM packages 
* They have been browersify under the bundles folder

# Chrome plugin
* The UI is a chrome plugin
* It interacts with the websites
* It stores locally the data from the wallet

# Blockchain
* It ineracts with Ethereum. For faster development of it was used with Truffle and Ganache
* IMPORTANT: As it has been developed with Ganache, the blockchain waiting time is almost instant, therefore the blockcahin
commmands have been coded as async funtioncs which have an almost instant behavior.
Howeverm changing into a testnet, we will have the reall "confirmation" time. Therefore, apart from the async call,
an abstraction level shall be put in placed to take into accoun this DLT confirmation time and how to deal with it

# Wallet 
* It follows the BIP standards for HD wallets
* It is stored locally
* It is encrypted
* Multiple public keys are derived from eccrypto and the private key

# Architecture
* Modular nested files
* The functions are nested into core funtionalities to obtain a better error management
* Separated Abstraction level into the files 

* All images rights go to the corresponding Authors
