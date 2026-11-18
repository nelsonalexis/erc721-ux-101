import {useCallback,useEffect,useState} from 'react';
import {Link,NavLink,Route,Routes,useNavigate,useParams} from 'react-router-dom';
import {createWalletClient,custom,formatEther,formatUnits,isAddress,type Address,type Hash,type EIP1193Provider} from 'viem';
import {sepolia} from 'viem/chains';
import EthereumProvider from '@walletconnect/ethereum-provider';
import {C,claimerAbi,ensClient,evaluatorAbi,metadata,nftAbi,pointsAbi,publicClient,RPC,short} from './chain';

type Provider=EIP1193Provider & {on?:(event:string,fn:(arg:any)=>void)=>void;removeListener?:(event:string,fn:(arg:any)=>void)=>void};
declare global {interface Window {ethereum?:Provider}}
type Tx={state:'idle'|'signing'|'pending'|'success'|'error',hash?:Hash,message:string};
const initialTx:Tx={state:'idle',message:''};
const errorText=(e:unknown)=>{
  const x=e as {code?:number;shortMessage?:string;message?:string;cause?:{code?:number}};
  const message=x?.shortMessage||x?.message||String(e);
  const lower=message.toLowerCase();

  if(x?.code===4001||x?.cause?.code===4001||
     /user rejected|user denied|user cancelled|user canceled|rejected the request|user refused/.test(lower))
    return 'Transaction refusée dans le portefeuille.';

  if(/insufficient funds|insufficient balance|exceeds the balance/.test(lower))
    return 'Solde ETH Sepolia insuffisant pour payer la transaction et les frais réseau.';

  if(/invalid token id|nonexistent token|non-existent token/.test(lower))
    return "Ce NFT n'existe pas dans cette collection.";

  if(/execution reverted|transaction reverted|transaction annulée par le contrat/.test(lower))
    return 'Transaction rejetée par le smart contract. Vérifie les conditions de l’opération.';

  return message;
};
function App(){
 const [provider,setProvider]=useState<Provider|null>(null),[address,setAddress]=useState<Address|null>(null),[chainId,setChainId]=useState<number|null>(null),[ens,setEns]=useState<string|null>(null),[tx,setTx]=useState<Tx>(initialTx),[refresh,setRefresh]=useState(0),[walletError,setWalletError]=useState('');
 const navigate=useNavigate();
 const sync=useCallback(async(p:Provider)=>{try{const accounts=await p.request({method:'eth_accounts'}) as string[];setAddress(accounts[0]&&isAddress(accounts[0])?accounts[0] as Address:null);const id=await p.request({method:'eth_chainId'}) as string;setChainId(Number(BigInt(id)));}catch(e){setWalletError(errorText(e))}},[]);
 useEffect(()=>{const p=window.ethereum;if(!p)return;setProvider(p);void sync(p)},[sync]);
 useEffect(()=>{if(!provider)return;const accountListener=()=>{void sync(provider)};const chainListener=()=>{void sync(provider)};provider.on?.('accountsChanged',accountListener);provider.on?.('chainChanged',chainListener);return()=>{provider.removeListener?.('accountsChanged',accountListener);provider.removeListener?.('chainChanged',chainListener)}},[provider,sync]);
 useEffect(()=>{setEns(null);if(address)void ensClient.getEnsName({address}).then(setEns).catch(()=>{})},[address]);
 useEffect(()=>{if(address&&chainId!==null&&chainId!==11155111)navigate('/wrong-network')},[address,chainId,navigate]);
 const connect=async()=>{try{setWalletError('');if(!window.ethereum)throw Error('Aucun portefeuille injecté. Installe MetaMask ou utilise WalletConnect.');setProvider(window.ethereum);const accounts=await window.ethereum.request({method:'eth_requestAccounts'}) as string[];setAddress(accounts[0] as Address);await sync(window.ethereum)}catch(e){setWalletError(errorText(e))}};
 const connectWC=async()=>{try{setWalletError('');const projectId=import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;if(!projectId)throw Error('Ajoute VITE_WALLETCONNECT_PROJECT_ID dans .env');const p=await EthereumProvider.init({projectId,chains:[11155111],showQrModal:true,rpcMap:{11155111:RPC},metadata:{name:'ERC721 UX 101',description:'NFT workshop on Sepolia',url:window.location.origin,icons:[]}});await p.connect();const ep=p as unknown as Provider;setProvider(ep);await sync(ep)}catch(e){setWalletError(errorText(e))}};
 const switchNetwork=async()=>{if(!provider)return;try{await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:'0xaa36a7'}]})}catch(e){const err=e as {code?:number};if(err.code===4902){await provider.request({method:'wallet_addEthereumChain',params:[{chainId:'0xaa36a7',chainName:'Sepolia',rpcUrls:[RPC],nativeCurrency:{name:'Sepolia Ether',symbol:'ETH',decimals:18},blockExplorerUrls:['https://sepolia.etherscan.io']} ]})}else{setWalletError(errorText(e));return}}await sync(provider)};
 const write=async(contract:Address,abi:typeof nftAbi|typeof evaluatorAbi|typeof claimerAbi,fn:string,args:readonly unknown[]=[],value?:bigint)=>{if(!provider||!address){setTx({state:'error',message:'Connecte ton portefeuille'});return false}if(chainId!==11155111){setTx({state:'error',message:'Passe sur Sepolia'});return false}try{setTx({state:'signing',message:'Confirme la transaction dans ton portefeuille…'});const wallet=createWalletClient({chain:sepolia,transport:custom(provider),account:address});const hash=await wallet.writeContract({address:contract,abi:abi as any,functionName:fn as any,args:args as any,value,account:address,chain:sepolia});setTx({state:'pending',hash,message:'Transaction envoyée, attente de confirmation…'});const receipt=await publicClient.waitForTransactionReceipt({hash});if(receipt.status!=='success')throw Error('Transaction annulée par le contrat (revert).');setTx({state:'success',hash,message:'Transaction confirmée sur Sepolia'});setRefresh(n=>n+1);return true}catch(e){setTx({state:'error',message:errorText(e)});return false}};
 return <div className="shell"><aside className="sidebar"><Link className="brand" to="/"><span className="brand-icon">◈</span><span>ATELIER <small>NFT STUDIO / 101</small></span></Link><div className="menu-caption">EXPLORER</div><nav><NavLink end to="/">⌂ <span>Tableau de bord</span></NavLink><NavLink to="/chain-info">◎ <span>Réseau Sepolia</span></NavLink><NavLink to="/fakeBayc">◈ <span>Fake BAYC</span></NavLink><NavLink to="/fakeNefturians">◆ <span>Fake Nefturians</span></NavLink><NavLink to="/fakeMeebits">✳ <span>Fake Meebits</span></NavLink></nav><div className="side-footer"><span className="online-dot"/> ETHEREUM SEPOLIA<br/><small>ERC721 UX 101 • Workshop</small></div></aside><div className="content"><header className="topbar"><span className="eyebrow">BLOCKCHAIN LAB / SESSION 01</span><div className="top-actions"><span className={'network '+(chainId===11155111?'good':'')}>{chainId===11155111?'● Sepolia':'○ Réseau non vérifié'}</span>{address?<span className="wallet-label">{ens||short(address)}</span>:null}<button className="btn ghost" onClick={connect}>{address?'Changer de compte':'Connecter MetaMask'}</button><button className="btn ghost" onClick={connectWC}>WalletConnect</button></div></header>{walletError&&<div className="alert error">{walletError}</div>}{tx.state!=='idle'&&<div className={'alert '+tx.state}><b>{tx.state==='success'?'✓ ':tx.state==='error'?'! ':'◌ '}{tx.message}</b>{tx.hash&&<a target="_blank" rel="noreferrer" href={'https://sepolia.etherscan.io/tx/'+tx.hash}>Voir sur Etherscan ↗</a>}<button className="close" onClick={()=>setTx(initialTx)}>×</button></div>}<main><Routes><Route path="/" element={<Dashboard address={address} refresh={refresh} write={write} switchNetwork={switchNetwork} chainId={chainId}/>}/><Route path="/chain-info" element={<ChainInfo address={address} chainId={chainId} switchNetwork={switchNetwork}/>}/><Route path="/wrong-network" element={<section className="panel"><h1>Réseau incorrect</h1><p>Cette dApp fonctionne uniquement sur Ethereum Sepolia.</p><button className="btn primary" onClick={switchNetwork}>Basculer sur Sepolia</button></section>}/><Route path="/fakeBayc" element={<Collection kind="bayc" address={address} write={write} refresh={refresh}/>}/><Route path="/fakeBayc/:tokenId" element={<TokenDetail/>}/><Route path="/fakeBayc/gallery/:owner" element={<Gallery kind="bayc"/>}/><Route path="/fakeNefturians" element={<Collection kind="neft" address={address} write={write} refresh={refresh}/>}/><Route path="/fakeNefturians/:owner" element={<Gallery kind="neft"/>}/><Route path="/fakeNefturians/token/:tokenId" element={<TokenDetail kind="neft"/>}/><Route path="/fakeMeebits" element={<Meebits address={address} write={write} refresh={refresh}/>}/><Route path="*" element={<section className="panel"><h1>Page introuvable</h1><Link to="/">Retour à l'accueil</Link></section>}/></Routes></main></div></div>
}
type Writer=(contract:Address,abi:typeof nftAbi|typeof evaluatorAbi|typeof claimerAbi,fn:string,args?:readonly unknown[],value?:bigint)=>Promise<boolean>;
function Dashboard({address,refresh,write,switchNetwork,chainId}:{address:Address|null,refresh:number,write:Writer,switchNetwork:()=>void,chainId:number|null}){const [registered,setRegistered]=useState(false),[done,setDone]=useState<boolean[]>([]),[score,setScore]=useState<string>('—');useEffect(()=>{if(!address)return;void Promise.all([publicClient.readContract({address:C.evaluator,abi:evaluatorAbi,functionName:'hasSubmitted',args:[address]}),...([0,1,2,3].map(i=>publicClient.readContract({address:C.evaluator,abi:evaluatorAbi,functionName:'exerciseProgression',args:[address,BigInt(i)]}))),publicClient.readContract({address:C.points,abi:pointsAbi,functionName:'balanceOf',args:[address]}),publicClient.readContract({address:C.points,abi:pointsAbi,functionName:'decimals'})]).then(([r,...rest])=>{setRegistered(Boolean(r));setDone(rest.slice(0,4) as boolean[]);setScore(formatUnits(rest[4] as bigint,Number(rest[5]))) }).catch(()=>{})},[address,refresh]);return <><div className="hero"><div className="eyebrow">LE LABORATOIRE NFT</div><h1>Construire. Minter.<br/><em>Valider.</em></h1><p>Une expérience Web3 complète pour interagir avec trois collections ERC721 et collecter tes points on-chain.</p><div className="hero-actions">{chainId!==11155111?<button className="btn primary" onClick={switchNetwork}>Activer Sepolia ↗</button>:<button className="btn primary" disabled={!address||registered} onClick={()=>void write(C.evaluator,evaluatorAbi,'submitExercise')}>{registered?'✓ Inscription validée':'01 / S’inscrire à l’Evaluator ↗'}</button>}<Link className="btn outline" to="/chain-info">Explorer le réseau</Link></div></div><div className="stat-grid"><Stat label="POINTS ON-CHAIN" value={score} sub="TD-ERC721-UX-101"/><Stat label="EXERCICES AUTOMATIQUES" value={`${done.filter(Boolean).length} / 4`} sub="Inscription + 3 collections"/><Stat label="ÉTAT DU COMPTE" value={address?'Connecté':'En attente'} sub={address?short(address):'Connecte MetaMask ou WalletConnect'}/></div><div className="section-head"><div><span className="eyebrow">PARCOURS D’APPRENTISSAGE</span><h2>Les collections</h2></div><span className="muted">03 EXPÉRIENCES</span></div><div className="collection-grid"><CollectionCard num="01" title="Fake BAYC" tag="FREE MINT" text="Réclame un NFT gratuitement, inspecte ses métadonnées et explore une galerie." to="/fakeBayc" color="violet"/><CollectionCard num="02" title="Fake Nefturians" tag="PAYABLE" text="Achète un NFT avec de l'ETH Sepolia et vérifie ton portefeuille." to="/fakeNefturians" color="orange"/><CollectionCard num="03" title="Fake Meebits" tag="SIGNED CLAIM" text="Réclame un NFT en fournissant une signature cryptographique valide." to="/fakeMeebits" color="green"/></div><section className="panel"><h3>Vérifications automatiques</h3><div className="check-grid">{['Inscription','Fake BAYC','Fake Nefturians','Fake Meebits'].map((s,i)=><div key={s} className="check"><span>{done[i]?'✓':'○'}</span>{s}</div>)}</div><p className="muted">Les autres points sont attribués manuellement après examen de ton dépôt GitHub.</p></section></>}
function Stat({label,value,sub}:{label:string,value:string,sub:string}){return <div className="stat"><span className="eyebrow">{label}</span><strong>{value}</strong><small>{sub}</small></div>}
function CollectionCard({num,title,tag,text,to,color}:{num:string,title:string,tag:string,text:string,to:string,color:string}){return <Link to={to} className={'collection-card '+color}><div className="card-top"><span>{num} / NFT</span><span>{tag}</span></div><div className="abstract-art">{num==='01'?'◈':num==='02'?'◆':'✳'}</div><h3>{title}</h3><p>{text}</p><div className="card-link">Explorer la collection <span>↗</span></div></Link>}
function ChainInfo({address,chainId,switchNetwork}:{address:Address|null,chainId:number|null,switchNetwork:()=>void}){const [block,setBlock]=useState('…');useEffect(()=>{void publicClient.getBlockNumber().then(n=>setBlock(n.toString())).catch(()=>setBlock('Indisponible'))},[]);return <section className="panel"><span className="eyebrow">NETWORK / STATUS</span><h1>Informations réseau</h1><div className="info-list"><Info label="Chain ID connecté" value={chainId?.toString()||'Non connecté'}/><Info label="Dernier bloc Sepolia" value={block}/><Info label="Adresse connectée" value={address||'Non connecté'}/><Info label="RPC Sepolia" value={RPC}/></div>{chainId!==11155111&&<button className="btn primary" onClick={switchNetwork}>Basculer sur Sepolia</button>}</section>}
function Info({label,value}:{label:string,value:string}){return <div className="info-row"><span>{label}</span><code>{value}</code></div>}
function Collection({kind,address,write,refresh}:{kind:'bayc'|'neft',address:Address|null,write:Writer,refresh:number}){const isBayc=kind==='bayc',contract=isBayc?C.bayc:C.neft;const [name,setName]=useState('…'),[supply,setSupply]=useState('…'),[price,setPrice]=useState<bigint>(0n),[balance,setBalance]=useState('0');useEffect(()=>{void Promise.all([publicClient.readContract({address:contract,abi:nftAbi,functionName:'name'}),publicClient.readContract({address:contract,abi:nftAbi,functionName:'totalSupply'}),address?publicClient.readContract({address:contract,abi:nftAbi,functionName:'balanceOf',args:[address]}):Promise.resolve(0n),isBayc?Promise.resolve(0n):publicClient.readContract({address:contract,abi:nftAbi,functionName:'tokenPrice'})]).then(([n,s,b,p])=>{setName(n as string);setSupply(String(s));setBalance(String(b));setPrice(p as bigint)}).catch(()=>{})},[contract,address,refresh,isBayc]);return <><div className={'collection-banner '+(isBayc?'violet':'orange')}><span className="eyebrow">{isBayc?'01 / FREE MINT':'02 / PAYABLE MINT'}</span><h1>{name}</h1><p>{isBayc?'Un NFT gratuit, une transaction réelle.':'Un NFT acheté avec de l’ETH Sepolia.'}</p><div className="big-symbol">{isBayc?'◈':'◆'}</div></div><div className="stat-grid"><Stat label="SUPPLY TOTAL" value={supply} sub="NFT mintés"/><Stat label="MES NFT" value={balance} sub="Sur l'adresse connectée"/><Stat label="PRIX UNITAIRE" value={isBayc?'Gratuit':formatEther(price)+' ETH'} sub="Ethereum Sepolia"/></div><section className="panel"><h2>{isBayc?'Réclamer un NFT':'Acheter un NFT'}</h2><p>{isBayc?'Le contrat mint directement un nouveau NFT à ton adresse.':'Le montant exact est envoyé au contrat via une fonction payable.'}</p><button className="btn primary" disabled={!address} onClick={()=>void write(contract,nftAbi,isBayc?'claimAToken':'buyAToken',[],isBayc?undefined:price)}>{isBayc?'Réclamer gratuitement ↗':`Acheter pour ${formatEther(price)} ETH ↗`}</button><button className="btn outline" disabled={!address||balance==='0'} onClick={()=>void write(C.evaluator,evaluatorAbi,isBayc?'ex1_claimedFakeBAYC':'ex2_boughtFakeNefturians')}>Valider auprès de l'Evaluator (+2 pts)</button></section><section className="panel"><h2>Explorer mes NFT</h2><p>Visualise les identifiants et les métadonnées détenus par une adresse.</p>{address?<Link className="btn outline" to={isBayc?`/fakeBayc/gallery/${address}`:`/fakeNefturians/${address}`}>Ouvrir ma galerie ↗</Link>:<p className="muted">Connecte ton portefeuille pour afficher ta galerie.</p>}</section></>}

function TokenDetail({kind='bayc'}:{kind?:'bayc'|'neft'}){
  const {tokenId}=useParams();
  const [data,setData]=useState<any>(null);
  const [owner,setOwner]=useState<string>('');
  const [uri,setUri]=useState<string>('');
  const [metadataError,setMetadataError]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);

  const contract=kind==='bayc'?C.bayc:C.neft;

  useEffect(()=>{
    let active=true;
    setLoading(true);
    setData(null);
    setOwner('');
    setUri('');
    setError('');
    setMetadataError('');

    void (async()=>{
      try {
        if(!tokenId||!/^\d+$/.test(tokenId)){
          throw Error('Identifiant NFT invalide');
        }

        const id=BigInt(tokenId);

        const nftOwner=await publicClient.readContract({
          address:contract,
          abi:nftAbi,
          functionName:'ownerOf',
          args:[id]
        });

        if(active)setOwner(nftOwner);

        try {
          const tokenUri=await publicClient.readContract({
            address:contract,
            abi:nftAbi,
            functionName:'tokenURI',
            args:[id]
          });

          if(active)setUri(tokenUri);

          const meta=await metadata(tokenUri);
          if(active)setData(meta);
        } catch(e) {
          if(active)setMetadataError(errorText(e));
        }
      } catch(e) {
        if(active)setError('Impossible de vérifier ce NFT : '+errorText(e));
      } finally {
        if(active)setLoading(false);
      }
    })();

    return ()=>{active=false};
  },[tokenId,contract]);

  return <section className="panel">
    <Link to={kind==='bayc'?"/fakeBayc":"/fakeNefturians"}>
      ← {kind==='bayc'?"Fake BAYC":"Fake Nefturians"}
    </Link>

    <h1>Token #{tokenId}</h1>

    {loading?<p>Lecture de la blockchain…</p>:
      error?<div className="alert error">{error}</div>:
      <>
        <h2>Informations blockchain</h2>
        <Info label="Token ID" value={String(tokenId)}/>
        <Info label="Réseau" value="Ethereum Sepolia"/>
        <Info label="Contrat" value={contract}/>
        <Info label="Propriétaire" value={owner}/>
        {uri&&<Info label="Token URI" value={uri}/>}

        {metadataError&&
          <div className="alert error">
            Métadonnées externes indisponibles : {metadataError}
          </div>
        }

        {data&&
          <div className="detail">
            {data.image&&
              <img alt={`NFT #${tokenId}`} src={data.image}/>
            }
            <div>
              <h2>Attributs</h2>
              {(data.attributes||[]).map((a:any,i:number)=>
                <Info
                  key={i}
                  label={String(a.trait_type||'Attribut')}
                  value={String(a.value)}
                />
              )}
            </div>
          </div>
        }
      </>
    }
  </section>;
}

function Gallery({kind}:{kind:'bayc'|'neft'}){const params=useParams(),owner=params.owner;const [ids,setIds]=useState<string[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);useEffect(()=>{let alive=true;setLoading(true);setError('');void(async()=>{try{if(!owner||!isAddress(owner))throw Error('Adresse Ethereum invalide');const contract=kind==='bayc'?C.bayc:C.neft;const count=await publicClient.readContract({address:contract,abi:nftAbi,functionName:'balanceOf',args:[owner]});const n=Number(count);if(n>1000)throw Error('Galerie trop grande (limite de 1000 NFT)');const values=await Promise.all(Array.from({length:n},(_,i)=>publicClient.readContract({address:contract,abi:nftAbi,functionName:'tokenOfOwnerByIndex',args:[owner,BigInt(i)]})));if(alive)setIds(values.map(String))}catch(e){if(alive)setError(errorText(e))}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[owner,kind]);return <section><span className="eyebrow">COLLECTION / GALLERY</span><h1>Galerie NFT</h1><p className="muted">Propriétaire : {owner}</p>{loading?<p>Lecture de la blockchain…</p>:error?<div className="alert error">{error}</div>:ids.length===0?<p>Aucun NFT trouvé.</p>:<div className="nft-grid">{ids.map(id=><NftTile key={id} kind={kind} id={id}/>)}</div>}</section>}
function NftTile({kind,id}:{kind:'bayc'|'neft',id:string}){const [img,setImg]=useState<string|null>(null);const [failed,setFailed]=useState(false);useEffect(()=>{let alive=true;void(async()=>{try{const uri=await publicClient.readContract({address:kind==='bayc'?C.bayc:C.neft,abi:nftAbi,functionName:'tokenURI',args:[BigInt(id)]});const d=await metadata(uri);if(alive)setImg(d.image||null)}catch{if(alive)setFailed(true)}})();return()=>{alive=false}},[id,kind]);return <Link className="nft-tile" to={kind==='bayc'?`/fakeBayc/${id}`:`/fakeNefturians/token/${id}`}><div className="nft-image">{img?<img src={img} loading="lazy" alt={`NFT ${id}`}/>:<span>{failed?'Image indisponible':'◈'}</span>}</div><b>Token #{id}</b></Link>}
const SIG_URL='https://raw.githubusercontent.com/Elli610/Blockchain-101/feat/privacy-101/workshops/solidity/erc721-ux-101/signatures/output-sig.json';
function Meebits({address,write,refresh}:{address:Address|null,write:Writer,refresh:number}){const [signatures,setSignatures]=useState<{tokenNumber:number,signature:`0x${string}`}[]>([]),[available,setAvailable]=useState<number[]>([]),[selected,setSelected]=useState(''),[manualSig,setManualSig]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);useEffect(()=>{void fetch(SIG_URL).then(r=>{if(!r.ok)throw Error('Signatures indisponibles');return r.json()}).then(setSignatures).catch(e=>setError(errorText(e)))},[]);useEffect(()=>{if(!signatures.length)return;let active=true;setBusy(true);void(async()=>{try{const max=await publicClient.readContract({address:C.claimer,abi:claimerAbi,functionName:'maxTokenId'});const options=signatures.filter(s=>BigInt(s.tokenNumber)<=max);const claimed=await Promise.all(options.map(s=>publicClient.readContract({address:C.claimer,abi:claimerAbi,functionName:'tokensThatWereClaimed',args:[BigInt(s.tokenNumber)]}).catch(()=>true)));if(active){setAvailable(options.filter((_,i)=>!claimed[i]).map(s=>s.tokenNumber));setSelected(current=>options.some(s=>String(s.tokenNumber)===current&&!claimed[options.indexOf(s)])?current:String(options.find((_,i)=>!claimed[i])?.tokenNumber??''))}}catch(e){if(active)setError(errorText(e))}finally{if(active)setBusy(false)}})();return()=>{active=false}},[signatures,refresh]);const selectedSignature=signatures.find(s=>String(s.tokenNumber)===selected)?.signature||manualSig;return <><div className="collection-banner green"><span className="eyebrow">03 / SIGNED CLAIM</span><h1>Fake Meebits</h1><p>Un NFT protégé par une signature cryptographique.</p><div className="big-symbol">✳</div></div><section className="panel"><h2>Réclamer un Meebit</h2><p>Le contrat vérifie que la signature correspond au token sélectionné et qu'il n'a pas encore été réclamé.</p>{error&&<div className="alert error">{error}</div>}<label htmlFor="token">Identifiant disponible</label><select id="token" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Sélectionner un token</option>{available.map(id=><option key={id} value={id}>Token #{id}</option>)}</select><label htmlFor="signature">Signature correspondante</label><textarea id="signature" rows={3} value={selectedSignature} onChange={e=>setManualSig(e.target.value)} placeholder="0x…"/><p className="muted">{busy?'Vérification des tokens disponibles…':`${available.length} token(s) disponibles parmi les signatures publiées`}</p><button className="btn primary" disabled={!address||!selected||!/^0x[0-9a-fA-F]{130}$/.test(selectedSignature)} onClick={()=>void write(C.claimer,claimerAbi,'claimAToken',[BigInt(selected),selectedSignature])}>Réclamer ce Meebit ↗</button><button className="btn outline" disabled={!address} onClick={()=>void write(C.evaluator,evaluatorAbi,'ex3_claimedFakeMeebits')}>Valider auprès de l'Evaluator (+2 pts)</button></section></>}
export default App;
