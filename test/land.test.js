const Land = artifacts.require("./Land")

require('chai')
    .use(require('chai-as-promised'))
    .should()

const EVM_REVERT = 'VM Exception while processing transaction: revert'    

contract('Land', ([owner1, owner2]) => {

    const NAME = "DApp U Buildings"
    const SYMBOL = "DUB"
    const COST = web3.utils.toWei('1', 'ether')  
    
    let land, result
    // let USDC

    beforeEach(async () => {
        land = await Land.new(NAME, SYMBOL, COST)
    })

    describe('Deployment', () => {
        it("returns the contract name", async () => {
            result = await land.name()
            result.should.equal(NAME)
        })

        it('Returns the symbol', async () => {
            result = await land.symbol()
            result.should.equal(SYMBOL)
        })

        it('Returns the cost to mint', async () => {
            result = await land.cost()
            result.toString().should.equal(COST)
        })

        it('Returns the max supply', async () => {
            result = await land.maxSupply()
            result.toString().should.equal('5')
        })

        it('Returns the number of buildings/land available', async () => {
            result = await land.getBuildings()
            result.length.should.equal(5)
        })
    })

    describe('Minting', () => {
        // This is where I describe the USDC transfer?
        // it deducts the user's USDC balance
        // it passes through the contract
        describe('Success', () => {
            beforeEach(async () => {
                result = await land.mint(1, {from: owner1, value: COST})
            })

            it('Updates the owner address', async () => {
                result = await land.ownerOf(1)
                result.should.equal(owner1)
            })
    
            it('Updates building details', async()=>{
                    result = await land.getBuilding(1)
                    result.owner.should.equal(owner1)
            })

            // it make sure the user's USDC balance was deducted and passed to the contract
        })

        describe('Failure', () => {
            it('Prevents mint with 0 value', async () => {
                await land.mint(1, { from: owner1, value: 0 }).should.be.rejected
            })

            it('Prevents mint with invalid ID', async () => {
                await land.mint(100, { from: owner1, value: 1 }).should.be.rejected
            })

            it('Prevents minting if already owned', async () => {
                await land.mint(1, { from: owner1, value: COST })
                await land.mint(1, { from: owner2, value: COST }).should.be.rejected
            })
        })
    })

    describe('Transfers', () => {
        describe('success', () => {
            beforeEach( async () => {
                await land.mint(1, { from: owner1, value: COST })
                await land.approve(owner2, 1, { from: owner1 })
                await land.transferFrom(owner1, owner2, 1, { from: owner2 })
            })

            it('Updates the owner address', async () => {
                result = await land.ownerOf(1)
                result.should.equal(owner2)
            })

            it('Updates building details', async () => {
                result = await land.getBuilding(1)
                result.owner.should.equal(owner2)
            })
        })

        describe('failure', () => {
            it('Prevents transfers without ownership', async () => {
                await land.transferFrom(owner1, owner2, 1, { from: owner2 }).should.be.rejected
            })

            it('Prevents transfers without approval', async () => {
                await land.mint(1, { from: owner1, value: COST })
                await land.transferFrom(owner1, owner2, 1, { from: owner2 }).should.be.rejected
            })
        })
    })
})