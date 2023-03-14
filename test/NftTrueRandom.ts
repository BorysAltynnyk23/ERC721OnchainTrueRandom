import type { SnapshotRestorer } from "@nomicfoundation/hardhat-network-helpers";
import { takeSnapshot } from "@nomicfoundation/hardhat-network-helpers";
import { mine } from "@nomicfoundation/hardhat-network-helpers";


import { expect } from "chai";
import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import type { NftTrueRandom } from "../typechain-types";
import { utils } from "../typechain-types/@openzeppelin/contracts";




const URI_LIST = [
    "disk",
    "news",
    "soup",
    "loss",
    "hair",
    "tale",
    "hall",
    "dirt",
    "exam",
    "year"
]


describe("NftTrueRandom", function () {
    let snapshotA: SnapshotRestorer;

    // Signers.
    let deployer: SignerWithAddress, owner: SignerWithAddress, user: SignerWithAddress;

    let nftTruerandom: NftTrueRandom;

    before(async () => {
        // Getting of signers.
        [deployer, user] = await ethers.getSigners();

        // Deployment of the factory.
        const NftTrueRandom = await ethers.getContractFactory("NftTrueRandom", deployer);
        nftTruerandom = await NftTrueRandom.deploy();
        await nftTruerandom.deployed();

        owner = deployer;

        snapshotA = await takeSnapshot();
    });

    afterEach(async () => await snapshotA.restore());
    describe("", function() {
        it.skip("gas used on constructor 1000 URI", async() =>{
            let URI_LIST_1000 = Array.apply(null, Array(1100)).map(function (x, i) { return i.toString(); })
            
            const NftTrueRandom = await ethers.getContractFactory("NftTrueRandom", deployer);
            let tx = await NftTrueRandom.deploy(URI_LIST_1000);

            const txReceipt = await ethers.provider.getTransactionReceipt(tx.deployTransaction.hash);

            console.log("gasUSED", txReceipt.gasUsed)
            // const receipt = await tx.wait();
            // const gasUsed = receipt.getTransactionReceipt().gasUsed;
            // console.log("gasUsed 1000 URI", gasUsed)
        })
    })
    describe("", function () {
        it.only("test", async() =>{
            let tx  = await nftTruerandom.initializeNotUsedNftId();
            const receipt = await tx.wait()
            console.log("gasUsed", receipt.gasUsed)
            console.log(await nftTruerandom.getEl(2) )
        })
        it("flow", async() =>{
            let nftPrice = await nftTruerandom.ethNftPrice()

            await nftTruerandom.connect(user).applyForMint({value: nftPrice})
            
            // wait 128 blocks
            await mine(128)

            //final mint
            await expect(nftTruerandom.connect(user).mint(user.address, 0))
                .to.emit(nftTruerandom, "NewNftMinted" )
                .withArgs(1, user.address)
            
        })
        it("cannot mint nft when there is no nft", async() =>{
            let nftPrice = await nftTruerandom.ethNftPrice()
            await nftTruerandom.connect(user).applyForMint({value: nftPrice})
            await mine(128)
            await nftTruerandom.connect(user).mint(user.address, 0)
            await expect(nftTruerandom.connect(user).mint(user.address, 0))
                .to.be.revertedWith("no nft to be minted")
        })


    });



});
