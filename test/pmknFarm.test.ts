import {ethers} from "hardhat";
import {expect} from "chai";
import {Contract, BigNumber} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {time} from "@openzeppelin/test-helpers";

describe("PmknFarm",()=>{
    let owner:SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let res:any;
    let pmknFarm: Contract;
    let pmknToken: Contract;
    let mockDai: Contract;

    const daiAmount : BigNumber = ethers.utils.parseEther("25000");

    beforeEach(async()=>{
        const PmknFarm = await ethers.getContractFactory("PmknFarm");
        const PmknToken = await ethers.getContractFactory("PmknToken");
        const MockDai = await ethers.getContractFactory("MockERC20");
        mockDai = await MockDai.deploy("MockDai","mDAI");
        [owner, alice, bob]= await ethers.getSigners();
        await Promise.all([
            mockDai.mint(owner.address, daiAmount),
            mockDai.mint(alice.address, daiAmount),
            mockDai.mint(bob.address, daiAmount)
        ]);

        // console.log('ssss',await mockDai.connect(bob).balanceOf())
        pmknToken = await PmknToken.deploy();
        pmknFarm = await PmknFarm.deploy(mockDai.address, pmknToken.address);
    })

    describe("Init", async()=>{
        it("should initialize", async()=>{
            expect(pmknToken).to.be.ok;
            expect(pmknFarm).to.be.ok;
            expect(mockDai).to.be.ok;
        })
    })

    describe("Stake", async()=>{
        it("should accept DAI and update mapping", async()=>{
            let toTransfer = ethers.utils.parseEther("100");
            await mockDai.connect(alice).approve(pmknFarm.address, toTransfer);
            expect(await pmknFarm.isStaking(alice.address)).to.eq(false);
            expect(await pmknFarm.connect(alice).stake(toTransfer)).to.be.ok;
            
            expect(await pmknFarm.isStaking(alice.address)).to.eq(true);
            expect(await pmknFarm.stakingBalance(alice.address)).to.eq(toTransfer);
        })

        it("should update balance with multiple stakes", async()=>{
            let toTransfer = ethers.utils.parseEther("100");
            await mockDai.connect(alice).approve(pmknFarm.address, toTransfer);
            await pmknFarm.connect(alice).stake(toTransfer);

            await mockDai.connect(alice).approve(pmknFarm.address, toTransfer);
            await pmknFarm.connect(alice).stake(toTransfer);
            
            expect(await pmknFarm.stakingBalance(alice.address)).to.eq(ethers.utils.parseEther("200"))
        })

        it("should revert with not enough funds", async()=>{
            let toTransfer = ethers.utils.parseEther("10000000");
            await mockDai.connect(bob).approve(pmknFarm.address, toTransfer);
            // expect(await pmknFarm.connect(bob).stake(toTransfer)).to.be.revertedWith("You cannot stake zero tokens")
        })
    })

    describe("Unstake", async()=>{
        beforeEach(async()=>{
            let toTransfer = ethers.utils.parseEther("100")
            await mockDai.connect(alice).approve(pmknFarm.address, toTransfer);
            await pmknFarm.connect(alice).stake(toTransfer);
        })
        it("should unstake balance from user", async()=>{
            let toTransfer =ethers.utils.parseEther("100")
            await pmknFarm.connect(alice).unstake(toTransfer);

            res = await pmknFarm.stakingBalance(alice.address);
            expect(Number(res)).to.eq(0);
            expect(await pmknFarm.isStaking(alice.address)).to.eq(false)
        })
        it("should show the correct balance when unstaking some of the staked balance", async()=>{

        })

        it("isStaking mapping should equate true when partially unstaking", async()=>{

        })
    })

    describe("WithdrawYield", async()=>{
        beforeEach(async()=>{
            await pmknToken.transferOwnership(pmknFarm.address);
            let toTransfer = ethers.utils.parseEther('10');
            await mockDai.connect(alice).approve(pmknFarm.address, toTransfer);
            await pmknFarm.connect(alice).stake(toTransfer);
        })

        it("should return correct yield time", async()=>{
            let timeStart = await pmknFarm.startTime(alice.address);
            expect(Number(timeStart)).to.be.greaterThan(0);

            await time.increase(86400);
            expect(await pmknFarm.calculateYieldTime(alice.address)).to.eq(86400);

        })
        it("should mint correct token amount in total supply and user", async()=>{
            await time.increase(86400);
            let _time = await pmknFarm.calculateYieldTime(alice.address);
            console.log(_time)
            let formatTime = _time/86400;
            let staked = await pmknFarm.stakingBalance(alice.address);
            let bal = staked * formatTime;
            let newBal = ethers.utils.formatEther(bal.toString());
            console.log(newBal)
            let expected = Number.parseFloat(newBal).toFixed(3)
            console.log(expected)
            await pmknFarm.connect(alice).withdrawYield();

            res = await pmknToken.totalSupply();
            console.log(res)
            let newRes = ethers.utils.formatEther(res)
            console.log(newRes)
            let formatRes = Number.parseFloat(newRes).toFixed(3).toString()
            console.log(formatRes)

            expect(expected).to.eq(formatRes)

            res = await pmknToken.balanceOf(alice.address)
            newRes = ethers.utils.formatEther(res);
            formatRes = Number.parseFloat(newRes).toFixed(3).toString()
            expect(expected).to.eq(formatRes)
        })
        it("should update yield balance when unstaked", async()=>{
            await time.increase(86400)
            await pmknFarm.connect(alice).unstake(ethers.utils.parseEther("5"))

            res = await pmknFarm.pmknBalance(alice.address)
            expect(Number(ethers.utils.formatEther(res))).to.be.approximately(10, .001)
        })
    })
})