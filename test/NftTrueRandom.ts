import type { SnapshotRestorer } from "@nomicfoundation/hardhat-network-helpers";
import { takeSnapshot } from "@nomicfoundation/hardhat-network-helpers";
import { mine } from "@nomicfoundation/hardhat-network-helpers";


import { expect } from "chai";
import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import type { NftTrueRandom } from "../typechain-types";
import { utils } from "../typechain-types/@openzeppelin/contracts";


const MILLION = 1000000

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

    describe.only("gas analysis", function() {
        it("initialize 1k not used nft ids", async() =>{
            const TOTAL_NFT_AMOUNT = 1000
            let tx  = await nftTruerandom.initializeNotUsedNftId(TOTAL_NFT_AMOUNT);
            const receipt = await tx.wait()
            console.log("gasUsed in million", receipt.gasUsed / MILLION )
        })
        it("set 1k URIs gas estimation", async() =>{
            let URI_LIST_5000= Array.apply(null, Array(1000)).map(function (x, i) { return i.toString(); })

            let tx  = await nftTruerandom.setURIs(URI_LIST_5000);
            const receipt = await tx.wait()
            console.log("gasUsed in million", receipt.gasUsed / MILLION)

        })
    })
    describe("", function () {

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
