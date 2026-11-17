import { createPublicClient, http, parseAbi, type Address } from 'viem';
import { sepolia, mainnet } from 'viem/chains';
export const RPC = import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
export const publicClient = createPublicClient({chain:sepolia,transport:http(RPC)});
export const ensClient = createPublicClient({chain:mainnet,transport:http('https://ethereum-rpc.publicnode.com')});
export const C = {
  points:'0x996BA4faE3a3c2d07aC780401B07E103553eAB92',
  evaluator:'0xe446502701fA5808DB07D817B00B660fB5EA6bFB',
  bayc:'0x262fc337408995376b35f950e98b7fB60CF691f5',
  neft:'0x4F4f92733eEEe8405764EaA6D2B7304B59642469',
  meebits:'0x589d269675BE36E4cFc3a4e04c9E5dad2ef2C4d6',
  claimer:'0xA45C08F929dfEf9a2B3E9eB3A5f9728F594f215a'
} as const satisfies Record<string,Address>;
export const nftAbi = parseAbi(['function name() view returns (string)','function totalSupply() view returns (uint256)','function balanceOf(address) view returns (uint256)','function tokenOfOwnerByIndex(address,uint256) view returns (uint256)','function tokenURI(uint256) view returns (string)','function ownerOf(uint256) view returns (address)','function tokenCounter() view returns (uint256)','function claimAToken()','function tokenPrice() view returns (uint256)','function buyAToken() payable']);
export const evaluatorAbi = parseAbi(['function submitExercise()','function hasSubmitted(address) view returns (bool)','function exerciseProgression(address,uint256) view returns (bool)','function ex1_claimedFakeBAYC()','function ex2_boughtFakeNefturians()','function ex3_claimedFakeMeebits()']);
export const pointsAbi = parseAbi(['function balanceOf(address) view returns (uint256)','function decimals() view returns (uint8)']);
export const claimerAbi = parseAbi(['function maxTokenId() view returns (uint256)','function tokensThatWereClaimed(uint256) view returns (bool)','function claimAToken(uint256,bytes) payable']);
export const short = (s:string) => s.slice(0,6)+'…'+s.slice(-4);
export const resolveUri = (s:string) => s.startsWith('ipfs://') ? 'https://ipfs.io/ipfs/'+s.slice(7) : s;
export async function metadata(uri:string) {const ctrl=new AbortController(); const timeout=setTimeout(()=>ctrl.abort(),9000);try {const r=await fetch(resolveUri(uri),{signal:ctrl.signal});if(!r.ok) throw Error('HTTP '+r.status);const data=await r.json();return {...data,image:data.image?resolveUri(data.image):null};} finally {clearTimeout(timeout)}}
