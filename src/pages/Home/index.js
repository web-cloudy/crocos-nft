import React from "react";
import { useState, useEffect } from 'react'
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import { ethers } from 'ethers'
import Web3 from 'web3'
import Web3Modal from "web3modal";
import { getImg } from "../../hook/Helper";
import styles from './Home.module.sass';
import axios from 'axios'
import { CustomButton } from "../../components/CustomButton";
import CrocosFarmCont from "../../ABI/CrocosFarm.json";
import CrocosNFTCont from "../../ABI/CrocosNFT.json";
const CrocosFarmAddr = "0x9181c0349DA770CB8223eE9fe0ed04A0cCe2104d";
const CrocosNFTAddr = "0xA86238EeE61CE05F0B8698588B86948Ce7B725A6";
let myAddr = "";

const style = {
	position: 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	bgcolor: 'background.paper',
	border: '2px solid #000',
	boxShadow: 24,
};

// import detectEthereumProvider from '@metamask/detect-provider';

// const provider = await detectEthereumProvider();

// if (provider) {
//   // From now on, this should always be true:
//   // provider === window.ethereum
//   startApp(provider); // initialize your app
// } else {
//   console.log('Please install MetaMask!');
// }
const StandardImageList = (props) => {
	console.log(props.stakeState)
	const checkToken = async (tokenId) => {
		// super();
		console.log(tokenId)
		const web3 = new Web3(Web3.givenProvider);
		let farmContract;
		let nftContract;
		try {
			const chainId = await web3.eth.getChainId()
			if (chainId === 4) {
				const web3Modal = new Web3Modal();
				const connection = await web3Modal.connect();
				const provider = new ethers.providers.Web3Provider(connection);
				const signer = provider.getSigner();
				farmContract = new ethers.Contract(
					CrocosFarmAddr,
					CrocosFarmCont.abi,
					signer
				);
				nftContract = new ethers.Contract(
					CrocosNFTAddr,
					CrocosNFTCont.abi,
					signer
				);
				if (tokenId) {
					if (props.stakeState === true) {
						const nftCon = await nftContract.approve(CrocosFarmAddr, tokenId);
						await nftCon.wait();
						const farmCon = await farmContract.stake(tokenId);
						await farmCon.wait();
						props.onChange();
					} else {
						const farmCon = await farmContract.withdraw(tokenId);
						await farmCon.wait();
						props.onChange();
					}
				} else {
					alert('Do not have tokenId')
				}
			} else {
				alert('The wrong network, please switch to the linkeby network.')
				try {
					await web3.currentProvider.request({
						method: "wallet_switchEthereumChain",
						params: [{ chainId: "0x04" }]
					});
				} catch (error) {
					alert(error.message);
				}
			}
		} catch (err) {
			console.log(err)
		}

	}
	return (
		<ImageList sx={{ width: 'auto', height: 450, padding: '50px' }} cols={4}>
			{props.itemData.map((item, key) => (
				<ImageListItem key={key} onClick={() => checkToken(item.tokenId)} >
					<div className={styles.image_card}>
						<img
							src={item.img}
							alt={item.title}
							loading="lazy"
						/>
						<ImageListItemBar
							title={item.title}
							position="below"
						/>
					</div>
				</ImageListItem>
			))}
		</ImageList>
	);
}

export const Home = () => {

	const [open, setOpen] = useState(false);
	const [tokensOfOwner, setTokensOfOwner] = useState([]);
	const [stakeState, setStakeState] = useState(false);
	const [harvest, setHarvest] = useState(0);
	useEffect(() => {
		setInterval(async () => {
			const web3 = new Web3(Web3.givenProvider);
			let farmContract;
			try {
				const chainId = await web3.eth.getChainId()
				if (chainId === 4) {
					const web3Modal = new Web3Modal();
					const connection = await web3Modal.connect();
					const provider = new ethers.providers.Web3Provider(connection);
					const signer = provider.getSigner();
					myAddr = signer.provider.provider.selectedAddress;
					// console.log(myAddr)
					farmContract = new ethers.Contract(
						CrocosFarmAddr,
						CrocosFarmCont.abi,
						signer
					);
					const reward = (await farmContract.getTotalClaimable(myAddr) / Math.pow(10, 18)).toString().slice(0, 6);
					console.log(reward)
					setHarvest(reward);
				} else {
					// alert('The wrong network, please switch to the linkeby network.')
					try {
						await web3.currentProvider.request({
							method: "wallet_switchEthereumChain",
							params: [{ chainId: "0x04" }]
						});
					} catch (error) {
						alert(error.message);
					}
				}
			} catch (err) {
				console.log(err)
			}
		}, 3000)
	}, [])
	const onClickPick = async () => {
		setStakeState(true);
		const web3 = new Web3(Web3.givenProvider);
		let nftContract;
		try {
			const chainId = await web3.eth.getChainId()
			if (chainId === 4) {
				const web3Modal = new Web3Modal();
				const connection = await web3Modal.connect();
				const provider = new ethers.providers.Web3Provider(connection);
				const signer = provider.getSigner();
				myAddr = signer.provider.provider.selectedAddress;
				console.log(myAddr)
				nftContract = new ethers.Contract(
					CrocosNFTAddr,
					CrocosNFTCont.abi,
					provider
				);
				// const balance = await nftContract.balanceOf(myAddr);
				const walletOfOwner = await nftContract.walletOfOwner(myAddr);
				const tokenData = [];
				for (var i = 0; i < walletOfOwner.length; i++) {
					let tokenURI = await nftContract.tokenURI(walletOfOwner[i] - 0);
					// tokenURI = tokenURI.slice(0, 82)
					const nftMetaData = await axios.get(tokenURI);
					console.log(nftMetaData)
					const nftTokenData = { img: `https://ipfs.io/ipfs/${nftMetaData.data.image.slice(7)}`, title: nftMetaData.data.name, tokenId: walletOfOwner[i] }
					tokenData.push(nftTokenData);
				}
				setTokensOfOwner(tokenData);
				console.log(tokenData)
				setOpen(true)
			} else {
				// alert('The wrong network, please switch to the linkeby network.')
				try {
					await web3.currentProvider.request({
						method: "wallet_switchEthereumChain",
						params: [{ chainId: "0x04" }]
					});
				} catch (error) {
					alert(error.message);
				}
			}
		} catch (err) {
			console.log(err)
		}

	}

	const onClickHarvest = async () => {
		console.log('clicked')
		const web3 = new Web3(Web3.givenProvider);
		let farmContract;
		try {
			const chainId = await web3.eth.getChainId()
			if (chainId === 4) {
				const web3Modal = new Web3Modal();
				const connection = await web3Modal.connect();
				const provider = new ethers.providers.Web3Provider(connection);
				const signer = provider.getSigner();
				myAddr = signer.provider.provider.selectedAddress;
				console.log(myAddr)
				farmContract = new ethers.Contract(
					CrocosFarmAddr,
					CrocosFarmCont.abi,
					signer
				);
				const stakeCount = await farmContract.stakeBalances(myAddr);
				if (stakeCount > 0) {
					await farmContract.harvest();
				}

			} else {
				alert('The wrong network, please switch to the linkeby network.')
				try {
					await web3.currentProvider.request({
						method: "wallet_switchEthereumChain",
						params: [{ chainId: "0x04" }]
					});
				} catch (error) {
					alert(error.message);
				}
			}
		} catch (err) {
			console.log(err)
		}
	}

	const onClickWithdraw = async () => {
		setStakeState(false);
		const tokenData = [];
		console.log('clicked')
		const web3 = new Web3(Web3.givenProvider);
		let farmContract;
		let nftContract;
		try {
			const chainId = await web3.eth.getChainId()
			if (chainId === 4) {
				const web3Modal = new Web3Modal();
				const connection = await web3Modal.connect();
				const provider = new ethers.providers.Web3Provider(connection);
				const signer = provider.getSigner();
				myAddr = signer.provider.provider.selectedAddress;
				console.log(myAddr)
				farmContract = new ethers.Contract(
					CrocosFarmAddr,
					CrocosFarmCont.abi,
					signer
				);
				nftContract = new ethers.Contract(
					CrocosNFTAddr,
					CrocosNFTCont.abi,
					signer
				);
				const stakeOfOwner = await farmContract.stakeOfOwner(myAddr);
				console.log(stakeOfOwner)
				const balance = await nftContract.balanceOf(myAddr);
				console.log(balance)
				for (var i = 0; i < stakeOfOwner.length; i++) {
					let tokenURI = await nftContract.tokenURI(stakeOfOwner[i]);
					// tokenURI = tokenURI.slice(0, 82)
					console.log(tokenURI);
					const nftMetaData = await axios.get(tokenURI);
					const nftTokenData = { img: `https://ipfs.io/ipfs/${nftMetaData.data.image.slice(7)}`, title: nftMetaData.data.name, tokenId: stakeOfOwner[i] }
					tokenData.push(nftTokenData);
				}
				setTokensOfOwner(tokenData);
				console.log(tokenData)
				setOpen(true)
			} else {
				alert('The wrong network, please switch to the linkeby network.')
				try {
          await web3.currentProvider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x04" }]
          });
        } catch (error) {
          alert(error.message);
        }
			}
		} catch (err) {
			console.log(err)
		}
	}

	return (
		<div className={styles.div} style={{ backgroundImage: `url(${getImg('home/bg.png')})` }}>
			<div className={styles.card}>
				<div className={styles.title}>Stake NFT get CROCOS</div>
				<img src={getImg('home/nft.png')} alt="nft" />
				<CustomButton value="Pick NFT" onClick={onClickPick} />
				<div className={styles.box}>
					<h5>Reward</h5>
					<p>{harvest} CROCOS</p>
					<CustomButton value="Harvest" onClick={onClickHarvest} />
				</div>
				<CustomButton value="Withdraw" onClick={onClickWithdraw} />
			</div>
			<Modal
				open={open}
				onClose={() => setOpen(false)}
				closeAfterTransition
				BackdropComponent={Backdrop}
				BackdropProps={{
					timeout: 500,
				}}
			>
				<Fade in={open}>
					<Box sx={style}>
						<StandardImageList itemData={tokensOfOwner} stakeState={stakeState} onChange={() => setOpen(false)} />
					</Box>
				</Fade>
			</Modal>
		</div>
	)
}