const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { legos } = require("@studydefi/money-legos");
const { expect } = require("chai");

const IUniswapV2Router02 = require('@uniswap/v2-periphery/build/IUniswapV2Router02.json');

describe("LeveragedYieldFarm", () => {
    let accounts;
    let deployer;
    let uRouter, dai, cDai, comp, leveragedYieldFarm;

    beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];

        // Set up Uniswap.V2.Router Contract...
        // This will be used to swap 1 ETH with DAI that way we can pay for fees and deposit...
        uRouter = new ethers.Contract("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", IUniswapV2Router02.abi, deployer);

        // Set up contract...
        dai = new ethers.Contract(legos.erc20.dai.address, legos.erc20.dai.abi, deployer);

        // Set up Compound contracts cDai & COMP...
        cDai = new ethers.Contract(legos.compound.cDAI.address, legos.compound.cDAI.abi, deployer);
        comp = new ethers.Contract("0xc00e94cb662c3520282e6f5717214004a7f26888", legos.erc20.abi, deployer);

        // Deploy LeveragedYieldFarm...
        const LeveragedYieldFarm = await ethers.getContractFactory("LeveragedYieldFarm");
        leveragedYieldFarm = await LeveragedYieldFarm.deploy();
    });

    describe('Swapping 1 ETH for DAI...', () => {
        const AMOUNT = ethers.parseUnits("1", 18); // 1 WETH
        const PATH = ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", "0x6b175474e89094c44da98b954eedeac495271d0f"]; // [WETH, DAI]
        const DEADLINE = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

        it('Swaps ETH for DAI', async () => {
            const ethBalanceBefore = await ethers.provider.getBalance(deployer.address);
            const daiBalanceBefore = await dai.connect(deployer).balanceOf(deployer.address);

            await uRouter.connect(deployer).swapExactETHForTokens(0, PATH, deployer.address, DEADLINE, { value: AMOUNT });

            const ethBalanceAfter = await ethers.provider.getBalance(deployer.address);
            const daiBalanceAfter = await dai.balanceOf(deployer.address);

            expect(Number(daiBalanceAfter)).to.be.above(Number(daiBalanceBefore));
            expect(Number(ethBalanceAfter)).to.be.below(Number(ethBalanceBefore));
        });
    });

    describe("Leveraged Yield Farming on Compound boosted with dYdX flash loan...", function () {
        it("deposit/wait/withdrawing/taking profits...", () => {
          beforeEach (async () => {
            //Deposit 1.1 DAI to contract (.1 for fee)
            await dai.connect(deployer).transfer(leveragedYieldFarm.address, ethers.parseUnits("1.1", 18))
    
            //Supplying 1 DAI with flash loan to Compound 
            await leveragedYieldFarm.depositDai(ethers.parseUnits("1", 18))
          })
    
          it('Deposits/Waits/Withdraws/Takes Profits...', async () => {
            const ethBalanceBefore = await ethers.provider.getBalance(deployer.address)
            const daiBalanceBefore = ethers.utils.formatUnits(await dai.balanceOf(deployer.address))
            const cDaiBalanceBefore = ethers.utils.formatUnits(await cDai.balanceOf(leveragedYieldFarm.address))
            const compBalanceBefore = ethers.utils.formatUnits(await comp.balanceOf(deployer.address))
    
            console.log("Waiting for a new block...")
    
            const BLOCK_NUMBER =  await ethers.provider.getBlockNumber()
            const BLOCK = await ethers.provider.getBlock(BLOCK_NUMBER)
    
            //Fast forward 1 block...
            //New blocks are validated roughly every - 12 seconds 
            await time.increaseTo(BLOCK.timestamp + 12)
    
            // Taking Profits
            await leveragedYieldFarm.withdrawDai(ethers.parseUnits("1", 18))
            
            const ethBalanceAfter = await ethers.provider.getBalance(deployer.address)
            const daiBalanceAfter = ethers.utils.formatUnits(await dai.balanceOf(deployer.address))
            const cDaiBalanceAfter = ethers.utils.formatUnits(await cDai.balanceOf(leveragedYieldFarm.address))
            const compBalanceAfter = ethers.utils.formatUnits(await comp.balanceOf(deployer.address))
    
            expect(Number(ethBalanceBefore)).to.be.above(Number(ethBalanceAfter)); // Due to gas fee
            expect(Number(daiBalanceAfter)).to.be.above(Number(daiBalanceBefore)); // Interest for supplying
            expect(Number(cDaiBalanceBefore)).to.be.above(Number(cDaiBalanceAfter)); // Swapping cDAI => DAI 
            expect(Number(compBalanceAfter)).to.be.above(Number(compBalanceBefore)); // Successful yield farm
    
          const results = {
            "ethBalanceBefore" : ethers.utils.formatUnits(ethBalanceBefore.toString(), 'ether'),
            "ethBalanceAfter": ethers.utils.formatUnits(ethBalanceAfter.toString(), 'ether'),
            "daiBalanceBefore": daiBalanceBefore,
            "daiBalanceAfter": daiBalanceAfter,
            "cDaiBalanceBefore": cDaiBalanceBefore,
            "cDaiBalanceAfter": cDaiBalanceAfter,
            "compBalanceAfter": compBalanceAfter,
          }

          console.log("Results:")
          console.table(results)
        });
      });
    });
});
