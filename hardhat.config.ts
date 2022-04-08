/**
 * @type import('hardhat/config').HardhatUserConfig
 */
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
require('dotenv').config();
module.exports = {
  solidity: "0.8.4",
  networks:{
    kovan:{
      url:process.env.KOVAN_KEY,
      accounts:[`0x${process.env.PRIVATE_KEY}`]
    },
    mumbai:{
      url:process.env.MUMBAI_KEY,
      accounts:[`0x${process.env.PRIVATE_KEY}`]
    }
  }
};
