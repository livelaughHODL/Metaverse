const Land = artifacts.require("./Land")
const IERC20 = artifacts.require("./IERC20")

require('chai')
    .use(require('chai-as-promised'))
    .should()

const EVM_REVERT = 'VM Exception while processing transaction: revert'    

contract('Land', ([owner1, owner2]) => {

    const NAME = "DApp U Buildings"
    const SYMBOL = "DUB"
    const COST = web3.utils.toWei('1', 'mwei')  
    const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    const UNLOCKED_ACCOUNT = '0x72a53cdbbcc1b9efa39c834a540550e23463aacb' // USDC Unlocked Account
    let land, usdc, result

    beforeEach(async () => {
        land = await Land.new(NAME, SYMBOL, COST)
        usdc = await IERC20.at(USDC)
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
        
        describe('Success', () => {
            beforeEach(async () => {
                // This is where I describe the USDC transfer?
                await usdc.transfer(owner1, COST, { from: UNLOCKED_ACCOUNT })
                // UNLOCKED_ACCOUNT transfers usdc of the COST to owner1
                await usdc.approve(land.address, COST, { from: owner1 })
                // owner1 approves contract to take usdc
                result = await land.mint(1, COST, { from: owner1 })
                // owner1 mints land ID 1
            })

            it('Updates the owner address', async () => {
                result = await land.ownerOf(1)
                result.should.equal(owner1)
            })
    
            it('Updates building details', async()=>{
                    result = await land.getBuilding(1)
                    result.owner.should.equal(owner1)
            })
        })

        describe('Failure', () => {
            it('Prevents mint with 0 value', async () => {
                await land.mint(1, 0, { from: owner1 }).should.be.rejected
            })

            it('Prevents mint with invalid ID', async () => {
                await land.mint(100, 1, { from: owner1 }).should.be.rejected
            })

            it('Prevents minting if already owned', async () => {
                await land.mint(1, COST, { from: owner1 })
                await land.mint(1, COST, { from: owner2 }).should.be.rejected
            })
        })
    })

    describe('Transfers', () => {
        describe('success', () => {
            beforeEach( async () => {
                await land.mint(1, COST, { from: owner1 })
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
                await land.mint(1, COST, { from: owner1 })
                await land.transferFrom(owner1, owner2, 1, { from: owner2 }).should.be.rejected
            })
        })
    })
})