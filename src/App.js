import logo from './logo.svg';
import './App.css';
import Web3 from 'web3';
import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, MapControls } from '@react-three/drei';
import { Physics } from '@react-three/cannon';

import Land from './abis/Land.json';
import IERC20 from './abis/IERC20.json';

// Import Components
import Navbar from './components/Navbar';
import Plane from './components/Plane';
import Plot from './components/Plot';
import Building from './components/Building';

function App() {

  const [web3,setWeb3] = useState(null)
  const [account,setAccount] = useState(null)
  const [landContract,setLandContract] = useState(null)
  const [cost, setCost] = useState(0)
  const [buildings, setBuildings] = useState(null)
	const [landId, setLandId] = useState(null)
	const [landName, setLandName] = useState(null)
	const [landOwner, setLandOwner] = useState(null)
	const [hasOwner, setHasOwner] = useState(false)
  const [usdcContract, setUsdcContract] = useState(null)
  const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

  const loadBlockchainData = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const web3 = new Web3(window.ethereum)
      setWeb3(web3)

      const accounts = await web3.eth.getAccounts()

      if(account.length > 0) {
        setAccount(accounts[0])
      }

      const networkId = await web3.eth.net.getId()

      // We create a local variable called land inside of loadBlockchainData, and to set a proper reference to the smart contract so it's available in our components we follow up with setLandContract(land)
      const land = new web3.eth.Contract(Land.abi, Land.networks[networkId].address)
      setLandContract(land)

      const usdc = new web3.eth.Contract(IERC20.abi, USDC)
      setUsdcContract(usdc)

      const cost = await land.methods.cost().call()
      setCost(web3.utils.fromWei(cost.toString(), 'mwei'))

      const buildings = await land.methods.getBuildings().call()
      setBuildings(buildings)

      // Event listeners...
      window.ethereum.on('accountsChanged', function (account) {
        setAccount(accounts[0])
      })

      window.ethereum.on('chainChanged', (chainId) => {
        window.location.reload();
      })
    }
  }

  // MetaMask Login/Connect
  const web3Handler = async () => {
    if (web3) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0])
    }
  }

  useEffect( () => {
    loadBlockchainData()
  }, [account])

  const buyHandler = async (_id) => {
    console.log("address", landContract._address)
		try {
      // Call the approve function when buyer attempts to mint
      await usdcContract.methods.approve(landContract._address, '1000000').send({ from: account })

      await landContract.methods.mint(_id, '1000000').send({ from: account })
			const buildings = await landContract.methods.getBuildings().call()
			setBuildings(buildings)

			setLandName(buildings[_id - 1].name)
			setLandOwner(buildings[_id - 1].owner)
			setHasOwner(true)
		} catch (error) {
			window.alert('Error occurred when buying')
		}
	}

  return (
    <div>
      <Navbar web3Handler={web3Handler} account={account} />
      <Canvas camera={{ position: [0, 0, 30], up: [0, 0, 1], far: 10000 }}>
        <Suspense fallback={null}>
          <Sky distance={450000} sunPosition={[1, 10, 0]} inclination={0} azimuth={0.25} />

          <ambientLight intensity={0.5} />

					{/* Load in each cell */}
					<Physics>
						{buildings && buildings.map((building, index) => {
							if (building.owner === '0x0000000000000000000000000000000000000000') {
								return (
									<Plot
										key={index}
										position={[building.posX, building.posY, 0.1]}
										size={[building.sizeX, building.sizeY]}
										landId={index + 1}
										landInfo={building}
										setLandName={setLandName}
										setLandOwner={setLandOwner}
										setHasOwner={setHasOwner}
										setLandId={setLandId}
									/>
								)
							} else {
								  return (
                    <Building
                      key={index}
                      position={[building.posX, building.posY, 0.1]}
                      size={[building.sizeX, building.sizeY, building.sizeZ]}
                      landId={index + 1}
                      landInfo={building}
                      setLandName={setLandName}
                      setLandOwner={setLandOwner}
                      setHasOwner={setHasOwner}
                      setLandId={setLandId}
									  />
								  )
							  }
						})}
					</Physics>
          <Plane />
        </Suspense>
        <MapControls />
      </Canvas>

      {landId && (
        <div className="info">
          <h1 className="flex">{landName}</h1>

          <div className='flex-left'>
            <div className='info--id'>
              <h2>ID</h2>
              <p>{landId}</p>
            </div>

            <div className='info--owner'>
              <h2>Owner</h2>
              <p>{landOwner}</p>
            </div>

            {!hasOwner && (
              <div className='info--owner'>
                <h2>Cost</h2>
                <p>{`${cost} USDC`}</p>
              </div>
            )}
          </div>

          {!hasOwner && (
            <button onClick={() => buyHandler(landId)} className='button info--buy'>Buy Property</button>
          )}
        </div>
      )}  
    </div>
  );
}

export default App;
