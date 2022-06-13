import React from "react";
import Web3 from "web3";
import { Container, Content, FlexboxGrid, Button, Footer, Stack, Navbar } from "rsuite";
import { ZDK, ZDKNetwork, ZDKChain } from "@zoralabs/zdk";
import { MediaObject } from "@zoralabs/nft-components";

// components
import ModalSuccess from "./components/ModalSuccess";

// utils
import ABI from "./ABI.json";

const URL = "http://www.thischimpdoesnotexist.com:8080";

const networkInfo = {
  network: ZDKNetwork.Ethereum,
  chain: ZDKChain.Mainnet,
}

const API_ENDPOINT = "https://api.zora.co/graphql";
const args = { 
            endPoint:API_ENDPOINT, 
            networks:[networkInfo], 
            // apiKey: process.env.API_KEY 
          } 

const zdk = new ZDK(args) // All arguments are optional

const App = () => {
  const [uuid, setUuid] = React.useState("");
  const [txHash, setTxHash] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [tokensUrls, setTokensUrls] = React.useState([])

  React.useEffect(() => {
    init();
    zdk.tokens({
      where: {
        "collectionAddresses": "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"
      },
      "includeFullDetails": true,
      pagination: {
        limit: 6
      }
    }).then((tokens) => {
      if(tokens.tokens.nodes){
        let result = []
        for (let i = 0; i < tokens.tokens.nodes.length; i++) {
          const item = tokens.tokens.nodes[i]
          if(item.token.image){
            result.push(item.token.image.url)
          }
        }
        setTokensUrls(result)
      }
    })
  }, []);

  const init = async () => {
    try {
      const f = await (await fetch(`${URL}/generateImage`)).json();
      setUuid(f.uuid);
    } catch (error) {
      console.log("Server error: ", error);
    }
  };

  const uploadToIPFS = async () => {
    if (uuid) {
      return await (await fetch(`${URL}/uploadToIPFS/${uuid}`)).json();
    } else {
      return null;
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      return accounts[0];
    } else {
      alert("Please install MetaMask");
      return null;
    }
  };

  const createNFT = async () => {
    setIsLoading(true);
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      if(await web3.eth.getChainId() !== 4){
        const PUBLIC_KEY = await connectWallet();
        if (PUBLIC_KEY) {
          const ipfsData = await uploadToIPFS();
          if (ipfsData) {
            if (ipfsData.IpfsHash) {
              const contractAddress =
                "0xB4798e07966Ce521Eac0E969a93DB3Dce60e8a1E";
              const nftContract = new web3.eth.Contract(ABI, contractAddress);
              await mintNFT(
                `https://gateway.pinata.cloud/ipfs/${ipfsData.IpfsHash}`,
                web3,
                PUBLIC_KEY,
                contractAddress,
                nftContract
              );
            } else {
              alert("Server uploading error");
            }
          } else {
            alert("Server uploading error");
          }
        }
      }else{
        alert("Please select Rinkeby network")
      }
    } else {
      alert("Please install MetaMask");
    }
    setIsLoading(false);
  };

  const mintNFT = async (
    tokenURI,
    web3,
    PUBLIC_KEY,
    contractAddress,
    nftContract
  ) => {
    const tx = {
      from: PUBLIC_KEY,
      to: contractAddress,
      data: nftContract.methods.mintNFT(PUBLIC_KEY, tokenURI).encodeABI(),
    };

    const data = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [tx],
    });

    console.log(`Transaction receipt: ${data}`);
    setTxHash(data);
    setIsOpen(true);
  };

  return (
    <Container>
      <Navbar>
        <p>This version is using Rinkeby network now.</p>
      </Navbar>
      <Content style={{ marginTop: 16 }}>
        <FlexboxGrid justify="center">
          <FlexboxGrid.Item>
            {uuid && <img alt="nftImage" src={`${URL}/image/${uuid}`} />}
          </FlexboxGrid.Item>
        </FlexboxGrid>
        <FlexboxGrid justify="center" style={{ marginTop: 16 }}>
          <FlexboxGrid.Item>
            <Button
              color="blue"
              appearance="primary"
              loading={isLoading}
              disabled={isLoading || txHash !== ""}
              onClick={createNFT}
            >
              Upload this NFT to Ethereum!
            </Button>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </Content>
      <Footer style={{ marginTop: 16, backgroundColor: "grey", padding: 3 }}>
        <h1 style={{ color: "white" }}>Recent generated</h1>
        <Stack spacing={4}>
          {
            tokensUrls && (
              tokensUrls.map((item, index) =>
                <MediaObject
                  key={`recentNFT_${index}`}
                  contentURI={item}
                />
              )
            )
          }
        </Stack>
      </Footer>
      <ModalSuccess
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        txHash={txHash}
        link={`https://rinkeby.etherscan.io/tx/${txHash}`}
      />
    </Container>
  );
};

export default App;
