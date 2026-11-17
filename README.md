# ERC721 UX 101 — NFT Studio

Frontend React + TypeScript + viem pour le TD ERC721 UX 101, réseau Ethereum Sepolia.

## Démarrer dans WSL

```bash
cd ~/erc721-ux-101
# Sauvegarde d'abord ton projet actuel si tu veux le conserver.
# Décompresse le ZIP téléchargé dans ~/erc721-ux-101 en remplaçant les fichiers du squelette Vite.
cp .env.example .env
npm install
npm run dev
```

Ouvre http://localhost:5173/.

## Configuration

Dans `.env`, renseigne `VITE_SEPOLIA_RPC_URL` avec un endpoint Sepolia (idéalement ton endpoint Alchemy/Infura) et `VITE_WALLETCONNECT_PROJECT_ID` avec ton identifiant de projet WalletConnect Cloud pour activer le QR code. Ne mets jamais de clé privée dans `.env` : les variables VITE_ sont publiques dans le navigateur.

## Parcours pour les points automatiques

1. Connecter MetaMask (ou WalletConnect configuré) avec **le même portefeuille pour tout le TD**.
2. Basculer sur Sepolia.
3. Tableau de bord → **S'inscrire à l'Evaluator** (+2 points).
4. Fake BAYC → **Réclamer gratuitement**, attendre confirmation, puis **Valider auprès de l'Evaluator** (+2 points).
5. Fake Nefturians → **Acheter** (coût on-chain 0.001 ETH Sepolia), puis **Valider auprès de l'Evaluator** (+2 points).
6. Fake Meebits → sélectionner un ID encore disponible, vérifier la signature correspondante chargée depuis le fichier officiel, réclamer puis **Valider auprès de l'Evaluator** (+2 points).

Les autres points sont attribués **manuellement par l'enseignant** après inspection du dépôt. Aucun point n'est garanti sans transactions confirmées et validation par l'enseignant.

## Fonctionnalités

- Connexion injectée avec `window.ethereum`, événements `accountsChanged` et `chainChanged`.
- WalletConnect v2 directement via `@walletconnect/ethereum-provider` (nécessite project ID).
- Changement de chaîne avec fallback `wallet_addEthereumChain`.
- `/chain-info`, redirection vers `/wrong-network` si réseau incorrect.
- `/fakeBayc`, `/fakeBayc/:tokenId`, `/fakeBayc/gallery/:owner`.
- `/fakeNefturians`, `/fakeNefturians/:owner`.
- `/fakeMeebits`, filtrage des signatures par état de claim on-chain.
- Suivi transaction : signature, pending, succès, revert, lien Etherscan.
- ENS reverse resolution sur Ethereum mainnet, fallback adresse.
- Images NFT en lazy-loading, métadonnées IPFS via gateway.

## Sécurité et limites

- Projet préparé sans accès à un environnement Node/npm permettant de valider `npm run build` ici : exécuter `npm run build` localement et corriger toute incompatibilité éventuelle.
- Les signatures sont téléchargées depuis GitHub : une connexion Internet et la disponibilité du fichier sont nécessaires.
- Les appels RPC, API metadata et ENS dépendent de services tiers. Les images peuvent ne pas être disponibles.
- Ne réutilise pas une clé privée exposée pour de l'argent réel. Ce TD doit rester sur Sepolia.
- Inspecter `npm audit` et corriger les vulnérabilités avant tout déploiement public.

## Contrats

Evaluator `0xe446502701fA5808DB07D817B00B660fB5EA6bFB`

Points `0x996BA4faE3a3c2d07aC780401B07E103553eAB92`

Les autres adresses figurent dans `src/chain.ts`.
